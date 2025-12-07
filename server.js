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

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`Clean Home Server running on port ${port}`);
    console.log(`- GitHub Repo: ${process.env.REPO_OWNER}/${process.env.REPO_NAME}`);
    console.log(`- Branch: ${process.env.BRANCH_NAME || 'main'}`);
});
