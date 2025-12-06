import express from 'express';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ESM 环境下没有 __dirname，需要手动创建
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const port = process.env.PORT || 3000;

// 解析 JSON
app.use(express.json());

// 静态文件服务 (托管 dist 目录)
app.use(express.static(path.join(__dirname, 'dist')));

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
//  ADMIN API ROUTES
// =============================================================================

// 1. 保存配置 (save-config)
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

// 2. 添加链接 (add-link)
app.post('/api/add-link', checkAuth, async (req, res) => {
    try {
        const { links, newLink, groupTitle } = req.body;
        if (!groupTitle || (!links && !newLink)) return res.status(400).json({ success: false, message: '缺少参数' });
        const branch = process.env.BRANCH_NAME || 'main';
        const filePath = 'src/config/nav.js';
        const { sha, content } = await getFile(filePath, branch);
        
        // 兼容处理：支持 links 数组 或 单个 newLink 对象
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

// 3. 添加分组 (add-group)
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

// 4. 管理链接 (manage-link)
app.post('/api/manage-link', checkAuth, async (req, res) => {
    try {
        const { action, oldGroupTitle, originalUrl, newGroupTitle, newLink } = req.body;
        const branch = process.env.BRANCH_NAME || 'main';
        const filePath = 'src/config/nav.js';
        const { sha, content } = await getFile(filePath, branch);
        let updatedContent = content;
        let msg = '';

        // Helper functions
        const deleteLink = (txt, group, url) => {
            const groupRegex = new RegExp(`(title:\s*"${group}"[\s\S]*?items:\s*\[)([\s\S]*?)(\])`, 'm');
            const m = txt.match(groupRegex);
            if (!m) throw new Error(`未找到分组: "${group}"`);
            const escapedUrl = url.replace(/[.*+?^${}()|[\\\]/g, '\\$&');
            const itemRegex = new RegExp(`\s*{\s*name:[\s\S]*?url:\s*["']${escapedUrl}["']\s*\},?`, 'g');
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

// 5. 上传文件 (upload)
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

// SPA 回退处理 (必须放在最后)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 启动服务器
app.listen(port, () => {
    console.log(`Clean Home Server running on port ${port}`);
    console.log(`- GitHub Repo: ${process.env.REPO_OWNER}/${process.env.REPO_NAME}`);
    console.log(`- Branch: ${process.env.BRANCH_NAME || 'main'}`);
});
