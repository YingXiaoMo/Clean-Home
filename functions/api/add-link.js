/**
 * Cloudflare Pages Function: /api/add-link
 * * 作用: 安全地调用 GitHub API 修改 nav.js 文件。
 * * 环境变量要求 (配置在 Cloudflare Pages Settings 中):
 * - GITHUB_TOKEN: 具有 repo 权限的 PAT
 * - REPO_OWNER: 仓库所有者 (e.g., yingxiaomo)
 * - REPO_NAME: 仓库名称
 */

// Cloudflare Workers 环境的 Base64 编码/解码工具，用于安全处理 UTF-8 字符串
const base64Encode = (str) => btoa(unescape(encodeURIComponent(str)));
const base64Decode = (b64) => decodeURIComponent(escape(atob(b64)));

const FILE_PATH = 'src/config/nav.js';
const BRANCH = 'feature/i18n'; // 确保分支名正确

// -----------------------------------------------------------
// 步骤 1: 获取文件当前内容和 SHA
// -----------------------------------------------------------
async function getCurrentFile(env) {
    const GITHUB_API_URL = `https://api.github.com/repos/${env.REPO_OWNER}/${env.REPO_NAME}/contents/${FILE_PATH}?ref=${BRANCH}`;
    
    if (!env.GITHUB_TOKEN) {
        throw new Error("GitHub Token未配置。请检查 Cloudflare 环境变量。");
    }

    const response = await fetch(GITHUB_API_URL, {
        headers: {
            'Authorization': `token ${env.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Cloudflare-Worker-Commit',
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`无法获取文件：${response.status}. 详情: ${errorText}`);
    }

    const data = await response.json();
    const fileContent = base64Decode(data.content);
    return { sha: data.sha, content: fileContent };
}

// -----------------------------------------------------------
// 步骤 2: 修改文件内容 (使用字符串替换，依赖于 nav.js 格式)
// -----------------------------------------------------------
function updateFileContent(oldContent, newLink) {
    // 构造新的链接字符串
    const newLinkString = `,\n      { name: "${newLink.name}", icon: "${newLink.icon}", url: "${newLink.url}" }`;

    // 查找目标分组的 items 数组的结束位置，这是最脆弱的一步，请务必保持 nav.js 格式不变
    const targetGroupTitle = newLink.groupTitle;
    
    // 查找目标 items 数组的结束位置（例如: items: [...] 之后的 ]）
    const itemsEndRegex = new RegExp(`(title: "${targetGroupTitle}",\\s*icon: "[^"]*",\\s*items: \\[\\s*[\\s\\S]*?)\\]`, 'm');

    const match = oldContent.match(itemsEndRegex);

    if (!match) {
        throw new Error(`文件格式不匹配或未找到标题为 "${targetGroupTitle}" 的分组。`);
    }

    // 找到 items 数组结束的 ']' 位置
    const insertionPoint = match.index + match[1].length;
    
    // 检查 items 数组是否为空。如果 items 数组内有内容，我们在新链接前加逗号。
    // 这里我们假设 items 数组非空，因为我们插入的位置是 ']' 之前，需要逗号。
    let contentToInsert = newLinkString;
    
    // 检查数组内容是否为空，如果为空，则不需要开头的逗号。
    const contentBeforeClosingBracket = oldContent.substring(oldContent.lastIndexOf('[', insertionPoint) + 1, insertionPoint).trim();

    if (contentBeforeClosingBracket === '') {
        // 如果数组是空的 `items: []`，则移除开头的逗号
        contentToInsert = contentToInsert.substring(1); 
    }
    
    // 替换并生成新内容
    const newContent = oldContent.slice(0, insertionPoint) + contentToInsert + oldContent.slice(insertionPoint);

    return newContent;
}

// -----------------------------------------------------------
// 步骤 3: 提交新的文件内容
// -----------------------------------------------------------
async function commitNewFile(sha, newContent, env) {
    const GITHUB_API_URL = `https://api.github.com/repos/${env.REPO_OWNER}/${env.REPO_NAME}/contents/${FILE_PATH}`;
    const encodedContent = base64Encode(newContent);
    const commitMessage = `feat: add link "${newLink.name}" to ${newLink.groupTitle} via web UI`;

    const commitData = {
        message: commitMessage,
        content: encodedContent,
        sha: sha,
        branch: BRANCH
    };

    const response = await fetch(GITHUB_API_URL, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${env.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'User-Agent': 'Cloudflare-Worker-Commit',
        },
        body: JSON.stringify(commitData),
    });

    if (!response.ok) {
        const errorText = await response.json();
        throw new Error(`GitHub 提交失败: ${response.status} - ${errorText.message}`);
    }

    // 返回提交成功信息
    return response.json();
}

// -----------------------------------------------------------
// Cloudflare Pages Functions 入口
// -----------------------------------------------------------
export async function onRequest(context) {
    try {
        // 确保请求方法是 POST
        if (context.request.method !== 'POST') {
            return new Response(JSON.stringify({ success: false, message: '只支持 POST 方法' }), { status: 405 });
        }

        const { name, url, icon, groupTitle } = await context.request.json();
        const env = context.env;

        if (!name || !url || !groupTitle) {
            return new Response(JSON.stringify({ success: false, message: '缺少链接信息：name, url, 或 groupTitle' }), { status: 400 });
        }
        
        const newLink = { name, url, icon, groupTitle };

        // 1. 获取文件内容和 SHA
        const { sha, content } = await getCurrentFile(env);

        // 2. 修改文件内容
        const updatedContent = updateFileContent(content, newLink);

        // 3. 提交新文件
        await commitNewFile(sha, updatedContent, env);

        // 成功响应
        return new Response(JSON.stringify({ 
            success: true, 
            message: `链接 "${name}" 添加成功！Cloudflare Pages 将自动开始重新部署。` 
        }), { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' } 
        });

    } catch (error) {
        console.error("Function Error:", error.message);
        return new Response(JSON.stringify({ 
            success: false, 
            message: `操作失败，请检查 Serverless Function 日志: ${error.message}` 
        }), { status: 500 });
    }
}