const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const port = process.env.PORT || 3000;

// 解析 JSON
app.use(express.json());

// 静态文件服务 (托管 dist 目录)
app.use(express.static(path.join(__dirname, 'dist')));

// =============================================================================
//  SHARED UTILS & DATA (Integrated from weather-api-source)
// =============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const WEATHER_MAP_ZH = {
  0: '晴', 1: '晴间多云', 2: '多云', 3: '阴',
  45: '雾', 48: '白霜', 51: '毛毛雨', 61: '小雨', 63: '中雨', 65: '大雨',
  71: '小雪', 73: '中雪', 75: '大雪', 80: '阵雨', 95: '雷阵雨',
  'clear': '晴', 'mcloudy': '多云', 'cloudy': '阴', 'rain': '雨', 
  'snow': '雪', 'ts': '雷暴', 'lightrain': '小雨', 
  'oshower': '阵雨', 'ishower': '阵雨', 'lightsnow': '小雪', 'rainsnow': '雨夹雪'
};

const WEATHER_MAP_EN = {
  0: 'Clear', 1: 'Partly Cloudy', 2: 'Cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Rime Fog', 51: 'Light Drizzle', 61: 'Slight Rain', 63: 'Moderate Rain', 65: 'Heavy Rain',
  71: 'Slight Snow', 73: 'Moderate Snow', 75: 'Heavy Snow', 80: 'Showers', 95: 'Thunderstorm',
  'clear': 'Clear', 'mcloudy': 'Partly Cloudy', 'cloudy': 'Cloudy', 'rain': 'Rain', 
  'snow': 'Snow', 'ts': 'Thunderstorm', 'lightrain': 'Light Rain', 
  'oshower': 'Showers', 'ishower': 'Showers', 'lightsnow': 'Light Snow', 'rainsnow': 'Sleet'
};

// 简单的城市映射 (由于太长，这里只保留常用部分，完整版建议从外部加载)
// 既然是在 Node 环境，我们可以尝试读取文件，但为了单文件部署方便，这里包含核心部分
const cityMap = {
  "Beijing": "北京市", "Shanghai": "上海市", "Guangzhou": "广州市", "Shenzhen": "深圳市",
  "Chengdu": "成都市", "Hangzhou": "杭州市", "Wuhan": "武汉市", "Chongqing": "重庆市",
  "Nanjing": "南京市", "Tianjin": "天津市", "Suzhou": "苏州市", "Xi'an": "西安市",
  "Zhengzhou": "郑州市", "Changsha": "长沙市", "Shenyang": "沈阳市", "Qingdao": "青岛市",
  "Ningbo": "宁波市", "Dongguan": "东莞市", "Wuxi": "无锡市", "Foshan": "佛山市",
  "Hefei": "合肥市", "Dalian": "大连市", "Fuzhou": "福州市", "Xiamen": "厦门市",
  "Harbin": "哈尔滨市", "Jinan": "济南市", "Wenzhou": "温州市", "Nanning": "南宁市",
  "Changchun": "长春市", "Quanzhou": "泉州市", "Shijiazhuang": "石家庄市", "Guiyang": "贵阳市",
  "Nanchang": "南昌市", "Jincheng": "晋城市", "Taiyuan": "太原市", "Hong Kong": "香港", "Macau": "澳门"
};

function generateRandomIP() {
  const segments = [[110, 125], [116, 124], [220, 223], [180, 183], [218, 220]];
  const segment = segments[Math.floor(Math.random() * segments.length)];
  const first = Math.floor(Math.random() * (segment[1] - segment[0] + 1)) + segment[0];
  return `${first}.${Math.floor(Math.random()*254)+1}.${Math.floor(Math.random()*254)+1}.${Math.floor(Math.random()*254)+1}`;
}

async function fetchWithFakeHeaders(url, extraOptions = {}) {
  const fakeIp = generateRandomIP();
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'X-Forwarded-For': fakeIp,
    'X-Real-IP': fakeIp,
    'Client-IP': fakeIp
  };
  return fetch(url, { headers, ...extraOptions });
}

function kmhToScale(kmh, lang = 'zh') {
  const speed = parseFloat(kmh);
  if (lang === 'en') return `${speed} km/h`;
  if (speed < 1) return '0级';
  if (speed < 6) return '1级';
  if (speed < 12) return '2级';
  if (speed < 20) return '3级';
  if (speed < 29) return '4级';
  if (speed < 39) return '5级';
  if (speed < 50) return '6级';
  if (speed < 62) return '7级';
  if (speed < 75) return '8级';
  return '9级+';
}

function degreesToDir(deg, lang = 'zh') {
  const directionsZh = ['北风', '东北风', '东风', '东南风', '南风', '西南风', '西风', '西北风'];
  const directionsEn = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(deg / 45) % 8;
  return lang === 'en' ? directionsEn[index] : directionsZh[index];
}

async function getCoordsByCity(city) {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    const res = await fetchWithFakeHeaders(url);
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        return {
          lat: data.results[0].latitude,
          lon: data.results[0].longitude
        };
      }
    }
  } catch (e) {}
  return null;
}

// =============================================================================
//  ADMIN PANEL UTILS (GitHub API)
// =============================================================================

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

// =============================================================================
//  API ROUTES
// =============================================================================

// --- Geo API ---
app.get('/api/geo', async (req, res) => {
    const lang = req.query.lang || 'zh';
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    
    // 简单的 IP 回显，实际部署中可以使用免费 API 获取地理位置
    // 这里为了演示自建 API 的功能，我们尝试调用 ip-api.com 作为后端代理
    // 这是一个免费的非商业 API，限制 45req/min
    try {
        const cleanIp = ip.split(',')[0].trim();
        const geoUrl = `http://ip-api.com/json/${cleanIp}?lang=${lang === 'en' ? 'en' : 'zh-CN'}`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();

        if (geoData.status === 'success') {
            return res.json({
                ip: cleanIp,
                type: cleanIp.includes(':') ? 'IPv6' : 'IPv4',
                city: geoData.city,
                city_en: geoData.city, // ip-api returns localized name if lang set, so this might be mixed
                country: geoData.country,
                latitude: geoData.lat,
                longitude: geoData.lon,
                source: "Node.js Server (ip-api)"
            });
        }
    } catch (e) {
        console.error("Geo API Error:", e);
    }

    // Fallback response
    res.json({
        ip: ip,
        type: 'Unknown',
        city: 'Unknown',
        city_en: 'Unknown',
        country: 'Unknown',
        source: "Node.js Server (Fallback)"
    });
});

// --- Weather API ---
app.get('/api/weather', async (req, res) => {
    let lat = req.query.lat;
    let lon = req.query.lon;
    const city = req.query.city;
    const lang = req.query.lang || 'zh';

    if ((!lat || !lon) && city) {
        const coords = await getCoordsByCity(city);
        if (coords) {
            lat = coords.lat;
            lon = coords.lon;
        }
    }

    const WEATHER_MAP = lang === 'en' ? WEATHER_MAP_EN : WEATHER_MAP_ZH;
    let weatherData = null;
    let source = '';
    let debugLog = [];

    // Plan A: OpenMeteo
    if (lat && lon) {
        try {
            const omUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m&timezone=auto`;
            const response = await fetchWithFakeHeaders(omUrl);
            if (response.ok) {
                const data = await response.json();
                const cur = data.current;
                weatherData = {
                    weather: WEATHER_MAP[cur.weather_code] || (lang === 'en' ? 'Unknown' : '未知'),
                    temp: Math.round(cur.temperature_2m),
                    wind: `${degreesToDir(cur.wind_direction_10m, lang)} ${kmhToScale(cur.wind_speed_10m, lang)}`
                };
                source = 'OpenMeteo';
            } else { debugLog.push(`OpenMeteo Error: ${response.status}`); }
        } catch (e) { debugLog.push(`OpenMeteo Exception: ${e.message}`); }
    }

    // Plan B: 7Timer
    if (!weatherData && lat && lon) {
        try {
            const stUrl = `https://www.7timer.info/bin/api.pl?lon=${lon}&lat=${lat}&product=civil&output=json`;
            const response = await fetchWithFakeHeaders(stUrl);
            if (response.ok) {
                const data = await response.json();
                const cur = data.dataseries && data.dataseries[0];
                if (cur) {
                    weatherData = {
                        weather: WEATHER_MAP[cur.weather] || (lang === 'en' ? 'Cloudy' : '多云'),
                        temp: cur.temp2m,
                        wind: lang === 'en' ? `Level ${cur.wind10m.speed}` : `${cur.wind10m.speed}级`
                    };
                    source = '7Timer';
                }
            } else { debugLog.push(`7Timer Error: ${response.status}`); }
        } catch (e) { debugLog.push(`7Timer Exception: ${e.message}`); }
    }

    // Plan C: Wttr.in
    if (!weatherData) {
        try {
            const query = (lat && lon) ? `${lat},${lon}` : city;
            if (query) {
                const wttrLang = lang === 'en' ? 'en' : 'zh';
                const wttrUrl = `https://wttr.in/${encodeURIComponent(query)}?format=j1&lang=${wttrLang}`;
                const response = await fetchWithFakeHeaders(wttrUrl);
                if (response.ok) {
                    const data = await response.json();
                    const cur = data.current_condition[0];
                    let desc = 'Unknown';
                    if (lang === 'en') {
                        desc = cur.weatherDesc ? cur.weatherDesc[0].value : 'Cloudy';
                    } else {
                        desc = cur.lang_zh ? cur.lang_zh[0].value : (cur.weatherDesc[0].value || '多云');
                    }
                    weatherData = {
                        weather: desc,
                        temp: cur.temp_C,
                        wind: `${degreesToDir(cur.winddirDegree, lang)} ${kmhToScale(cur.windspeedKmph, lang)}`
                    };
                    source = 'Wttr.in';
                } else { debugLog.push(`Wttr Error: ${response.status}`); }
            }
        } catch (e) { debugLog.push(`Wttr Exception: ${e.message}`); }
    }

    if (weatherData) {
        res.json({
            status: 'ok',
            data: weatherData,
            source: source,
            debug_info: source !== 'OpenMeteo' ? debugLog : undefined
        });
    } else {
        res.status(500).json({ status: 'error', debug_log: debugLog });
    }
});

// --- Admin APIs (Existing) ---

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

app.post('/api/add-link', checkAuth, async (req, res) => {
    try {
        const { links, newLink, groupTitle } = req.body;
        if (!groupTitle || (!links && !newLink)) return res.status(400).json({ success: false, message: '缺少参数' });
        const branch = process.env.BRANCH_NAME || 'main';
        const filePath = 'src/config/nav.js';
        const { sha, content } = await getFile(filePath, branch);
        const targetLinks = links || [newLink];
        const newLinksString = targetLinks.map(link => 
            `,
      { name: "${link.name}", icon: "${link.icon}", url: "${link.url}" }`
        ).join('');
        const itemsEndRegex = new RegExp(`([\s\S]*?title:\s*"${groupTitle}"[\s\S]*?items:\s*\[[\s\S]*?)\]`, 'm');
        const match = content.match(itemsEndRegex);
        if (!match) throw new Error(`未找到分组: "${groupTitle}"`);
        const insertionPoint = match.index + match[1].length;
        let contentToInsert = newLinksString;
        const contentBefore = content.substring(content.lastIndexOf('[', insertionPoint) + 1, insertionPoint).trim();
        if (contentBefore === '') contentToInsert = contentToInsert.substring(1);
        const updatedContent = content.slice(0, insertionPoint) + contentToInsert + content.slice(insertionPoint);
        const msg = `feat: add ${targetLinks.length} link(s) to ${groupTitle} via web UI`;
        const result = await updateFile(filePath, updatedContent, msg, sha, branch);
        res.json({ success: true, message: `成功添加 ${targetLinks.length} 个链接！`, commit_url: result.commit.html_url });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.post('/api/add-group', checkAuth, async (req, res) => {
    try {
        const { title, icon } = req.body;
        if (!title) return res.status(400).json({ success: false, message: '缺少分组名称' });
        const branch = process.env.BRANCH_NAME || 'main';
        const filePath = 'src/config/nav.js';
        const { sha, content } = await getFile(filePath, branch);
        const newGroupObject = `,
  {
    title: "${title}",
    icon: "${icon || 'ri:folder-line'}",
    items: [

    ]
  }`;
        const navDataArrayEndRegex = new RegExp(`(export\s+const\s+navData\s*=\s*\[[\s\S]*?)\]\s*;`, 'm');
        const match = content.match(navDataArrayEndRegex);
        if (!match) throw new Error(`nav.js 文件格式不匹配`);
        const insertionPoint = match.index + match[1].length;
        let contentToInsert = newGroupObject;
        const arrayStart = content.lastIndexOf('[', insertionPoint);
        const contentBefore = content.substring(arrayStart + 1, insertionPoint).trim();
        if (contentBefore === '') contentToInsert = contentToInsert.substring(1);
        const updatedContent = content.slice(0, insertionPoint) + contentToInsert + content.slice(insertionPoint);
        const msg = `feat: add new folder "${title}" via web UI`;
        const result = await updateFile(filePath, updatedContent, msg, sha, branch);
        res.json({ success: true, message: `文件夹 "${title}" 添加成功！`, commit_url: result.commit.html_url });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.post('/api/manage-link', checkAuth, async (req, res) => {
    try {
        const { action, oldGroupTitle, originalUrl, newGroupTitle, newLink } = req.body;
        const branch = process.env.BRANCH_NAME || 'main';
        const filePath = 'src/config/nav.js';
        const { sha, content } = await getFile(filePath, branch);
        let updatedContent = content;
        let msg = '';
        const deleteLink = (txt, group, url) => {
            const groupRegex = new RegExp(`(title:\s*"${group}"[\s\S]*?items:\s*\[)([\s\S]*?)(\])`, 'm');
            const m = txt.match(groupRegex);
            if (!m) throw new Error(`未找到分组: "${group}"`);
            const escapedUrl = url.replace(/[.*+?^${}()|[\\\]/g, '\\$&');
            const itemRegex = new RegExp(`\s*{\s*name:[\s\S]*?url:\s*["']${escapedUrl}["']\s*\}\s*,?`, 'g');
            if (!itemRegex.test(m[2])) throw new Error(`链接不存在: ${url}`);
            let newItems = m[2].replace(itemRegex, '').replace(/^\s*[
]/gm, '');
            return txt.replace(m[0], m[1] + newItems + m[3]);
        };
        const addLink = (txt, group, link) => {
            const linkStr = `,
      { name: "${link.name}", icon: "${link.icon}", url: "${link.url}" }`;
            const itemsEndRegex = new RegExp(`([\s\S]*?title:\s*"${group}"[\s\S]*?items:\s*\[[\s\S]*?)\]`, 'm');
            const m = txt.match(itemsEndRegex);
            if (!m) throw new Error(`未找到分组: "${group}"`);
            const ins = m.index + m[1].length;
            let toIns = linkStr;
            const pre = txt.substring(txt.lastIndexOf('[', ins) + 1, ins).trim();
            if (pre === '') toIns = toIns.substring(1);
            return txt.slice(0, ins) + toIns + txt.slice(ins);
        };
        if (action === 'DELETE') {
            updatedContent = deleteLink(content, oldGroupTitle, originalUrl);
            msg = `chore: delete link ${originalUrl} from ${oldGroupTitle}`;
        } else if (action === 'MOVE') {
            updatedContent = deleteLink(content, oldGroupTitle, originalUrl);
            updatedContent = addLink(updatedContent, newGroupTitle, newLink);
            msg = `chore: update link ${newLink.name}`;
        } else {
            return res.status(400).json({ success: false, message: 'Unknown action' });
        }
        const result = await updateFile(filePath, updatedContent, msg, sha, branch);
        res.json({ success: true, message: '操作成功', commit_url: result.commit.html_url });
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

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`Clean Home Server running on port ${port}`);
    console.log(`- GitHub Repo: ${process.env.REPO_OWNER}/${process.env.REPO_NAME}`);
    console.log(`- Branch: ${process.env.BRANCH_NAME || 'main'}`);
});