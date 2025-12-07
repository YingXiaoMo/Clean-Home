import express from 'express';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

const base64Encode = (str) => Buffer.from(str).toString('base64');
const base64Decode = (b64) => Buffer.from(b64, 'base64').toString('utf-8');

async function githubRequest(url, options = {}) {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error("GITHUB_TOKEN 未配置");

    const defaultHeaders = {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.com.v3+json',
        'User-Agent': 'Clean-Home-Server'
    };

    const response = await fetch(url, {
        ...options,
        headers: { ...defaultHeaders, ...options.headers }
    });

    if (!response.ok) {
        let errorText = await response.text();
        try { errorText = JSON.parse(errorText).message; } catch (e) {}
        throw new Error(`GitHub API Error ${response.status}: ${errorText}`);
    }
    return response.json();
}

async function getFile(path, branch) {
    const url = `https://api.github.com/repos/${process.env.REPO_OWNER}/${process.env.REPO_NAME}/contents/${path}?ref=${branch}`;
    const data = await githubRequest(url);
    return { sha: data.sha, content: base64Decode(data.content) };
}

async function updateFile(path, content, message, sha, branch) {
    const url = `https://api.github.com/repos/${process.env.REPO_OWNER}/${process.env.REPO_NAME}/contents/${path}`;
    const body = {
        message,
        content: base64Encode(content),
        sha,
        branch
    };
    return await githubRequest(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
}

const checkAuth = (req, res, next) => {
    const clientPassword = req.headers['x-admin-password'];
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminPassword && clientPassword !== adminPassword) {
        return res.status(401).json({ success: false, message: '未授权：管理员密码错误' });
    }
    next();
};


app.post('/api/save-config', checkAuth, async (req, res) => {
    try {
        const branch = process.env.BRANCH_NAME || 'main';
        const filePath = 'src/config/site-data.json';
        const { sha } = await getFile(filePath, branch);
        const newContent = JSON.stringify(req.body, null, 2);
        const result = await updateFile(filePath, newContent, "chore: update site config via web UI", sha, branch);
        res.json({ success: true, message: '配置更新成功！', commit_url: result.commit.html_url });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});


app.post('/api/save-nav', checkAuth, async (req, res) => {
    try {
        const branch = process.env.BRANCH_NAME || 'main';
        const filePath = 'src/config/nav.js';
        const { sha } = await getFile(filePath, branch);
        
        const navData = req.body;
        const fileContent = `/**
 * 导航页配置文件
 * 由后台管理系统自动生成
 */
export const navData = ${JSON.stringify(navData, null, 2)};
`;

        const result = await updateFile(filePath, fileContent, "chore: update navigation data via web UI", sha, branch);
        res.json({ success: true, message: '导航配置保存成功！', commit_url: result.commit.html_url });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.post('/api/upload', checkAuth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: '未找到文件' });
        if (req.file.size > 2 * 1024 * 1024) return res.status(400).json({ success: false, message: '文件过大 (>2MB)' });

        const timestamp = new Date().getTime();
        const safeName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${timestamp}-${safeName}`;
        const filePath = `public/uploads/${fileName}`; 
        const publicUrl = `/uploads/${fileName}`;

        const localUploadDir = path.join(__dirname, 'dist', 'uploads');
        if (!fs.existsSync(localUploadDir)) {
            fs.mkdirSync(localUploadDir, { recursive: true });
        }
        fs.writeFileSync(path.join(localUploadDir, fileName), req.file.buffer);

        const contentBase64 = req.file.buffer.toString('base64');
        const branch = process.env.BRANCH_NAME || 'main';
        const url = `https://api.github.com/repos/${process.env.REPO_OWNER}/${process.env.REPO_NAME}/contents/${filePath}`;

        const result = await githubRequest(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `feat: upload ${fileName} via web UI`,
                content: contentBase64,
                branch: branch
            })
        });
        res.json({ success: true, message: '上传成功', url: publicUrl, commit_url: result.commit.html_url });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// 天气接口代理 (适配 Docker/Node 环境)
app.get('/api/weather', async (req, res) => {
    try {
        const { lat, lon } = req.query;
        let clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
        if (clientIP.includes(',')) clientIP = clientIP.split(',')[0].trim();
        
        const qweatherKey = process.env.VITE_QWEATHER_KEY;
        const qweatherHost = process.env.VITE_QWEATHER_HOST || 'https://devapi.qweather.com';
        const amapKey = process.env.VITE_AMAP_KEY;

        if (!qweatherKey && !amapKey) {
            return res.status(500).json({ success: false, message: 'Server Config Error: Missing Weather Keys' });
        }

        let locationParam = null; // 用于和风查询的 location 参数 (可能是 lon,lat 或 城市名)
        let cityName = '未知城市'; // 用于高德查询和前端显示
        let locationSource = 'IP';

        // 1. 确定定位信息 (GPS 优先 -> IP 兜底)
        if (lat && lon) {
            locationSource = 'GPS';
            locationParam = `${lon},${lat}`; // 和风的 geo lookup 支持经纬度
            
            // 如果有高德 Key，尝试通过高德逆地理编码获取城市名
            if (amapKey) {
                try {
                    const regeoUrl = `https://restapi.amap.com/v3/geocode/regeo?location=${lon},${lat}&key=${amapKey}&extensions=base`;
                    const regeoRes = await fetch(regeoUrl);
                    const regeoData = await regeoRes.json();
                    if (regeoData.status === '1' && regeoData.regeocode && regeoData.regeocode.addressComponent) {
                        cityName = regeoData.regeocode.addressComponent.city.length > 0 ? 
                                   regeoData.regeocode.addressComponent.city[0] : 
                                   regeoData.regeocode.addressComponent.province;
                        cityName = cityName.replace(/市$/, ''); // 确保城市名干净
                    }
                } catch (e) {
                    console.warn('[Node] Amap Regeo failed:', e.message);
                }
            }
            if (cityName === '未知城市') cityName = '当前位置'; // 如果逆地理编码失败，给个通用名

        } else {
            // IP 定位 (Vore)
            try {
                const voreUrl = `https://api.vore.top/api/IPdata?ip=${clientIP}`;
                const voreRes = await fetch(voreUrl);
                const voreData = await voreRes.json();
                if (voreData.code === 200 && voreData.ipdata) {
                    cityName = voreData.ipdata.info2 || voreData.ipdata.info1;
                    cityName = cityName.replace(/市$/, '');
                    locationParam = cityName; // IP 定位时，和风也用城市名查
                }
            } catch (e) {
                console.warn('[Node] Vore IP lookup failed:', e.message);
            }
            if (!locationParam) {
                cityName = '北京';
                locationParam = '北京';
            }
        }

        // 2. 优先尝试和风天气
        if (qweatherKey) {
            try {
                const geoUrl = `${qweatherHost}/geo/v2/city/lookup?location=${encodeURIComponent(locationParam)}&key=${qweatherKey}&lang=zh`;
                const geoRes = await fetch(geoUrl);
                const geoData = await geoRes.json();

                if (geoData.code === '200' && geoData.location && geoData.location.length > 0) {
                    const locationID = geoData.location[0].id;
                    cityName = geoData.location[0].name; // 更新为和风返回的准确城市名
                    
                    const weatherUrl = `${qweatherHost}/v7/weather/now?location=${locationID}&key=${qweatherKey}&lang=zh`;
                    const weatherRes = await fetch(weatherUrl);
                    const weatherData = await weatherRes.json();

                    if (weatherData.code === '200') {
                        const now = weatherData.now;
                        return res.json({
                            success: true,
                            data: {
                                city: cityName,
                                weather: now.text,
                                temperature: now.temp,
                                wind: `${now.windDir} ${now.windScale}级`,
                                updateTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
                                ip: clientIP,
                                source: `和风天气 (${locationSource})`
                            }
                        });
                    }
                }
            } catch (e) {
                console.warn('[Node] QWeather failed, trying fallback:', e.message);
            }
        }

        // 3. 失败后尝试高德天气
        if (amapKey) {
            try {
                // 高德天气查询需要城市名或 adcode。如果 cityName 已经确定，直接用。
                if (cityName && cityName !== '未知城市' && cityName !== '当前位置') {
                    const amapUrl = `https://restapi.amap.com/v3/weather/weatherInfo?city=${encodeURIComponent(cityName)}&key=${amapKey}`;
                    const amapRes = await fetch(amapUrl);
                    const amapData = await amapRes.json();

                    if (amapData.status === '1' && amapData.lives && amapData.lives.length > 0) {
                        const live = amapData.lives[0];
                        return res.json({
                            success: true,
                            data: {
                                city: live.city,
                                weather: live.weather,
                                temperature: live.temperature,
                                wind: `${live.winddirection}风 ${live.windpower}级`,
                                updateTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
                                ip: clientIP,
                                source: `高德天气 (${locationSource})`
                            }
                        });
                    }
                }
            } catch (e) {
                console.warn('[Node] Amap weather failed:', e.message);
            }
        }

        return res.status(500).json({ success: false, message: 'All weather APIs failed' });

    } catch (error) {
        res.status(500).json({ success: false, message: `Server Error: ${error.message}` });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`Clean Home Server running on port ${port}`);
    console.log(`- GitHub Repo: ${process.env.REPO_OWNER}/${process.env.REPO_NAME}`);
    console.log(`- Branch: ${process.env.BRANCH_NAME || 'main'}`);
});
