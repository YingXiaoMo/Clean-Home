/**
 * Cloudflare Pages Function: /api/add-link
 * 作用: 安全地调用 GitHub API 修改 nav.js 文件。
 * * 环境变量要求 (配置在 Cloudflare Pages Settings 中):
 * - GITHUB_TOKEN: 具有 repo 权限的 PAT
 * - REPO_OWNER: 仓库所有者
 * - REPO_NAME: 仓库名称
 * - BRANCH_NAME: (可选) 目标分支名称，如果未设置，默认为 'main'。
 */

// Cloudflare Workers 环境的 Base64 编码/解码工具
const base64Encode = (str) => btoa(unescape(encodeURIComponent(str)));
const base64Decode = (b64) => decodeURIComponent(escape(atob(b64)));

const FILE_PATH = 'src/config/nav.js';

// -----------------------------------------------------------
// 步骤 1: 获取文件当前内容和 SHA
// -----------------------------------------------------------
async function getCurrentFile(env, branchName) {
    // 动态使用分支名称
    const GITHUB_API_URL = `https://api.github.com/repos/${env.REPO_OWNER}/${env.REPO_NAME}/contents/${FILE_PATH}?ref=${branchName}`;
    
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
// 步骤 2: 修改文件内容 (已优化正则，提高兼容性)
// -----------------------------------------------------------
function updateFileContent(oldContent, newLink) {
    const newLinkString = `,\n      { name: "${newLink.name}", icon: "${newLink.icon}", url: "${newLink.url}" }`;
    const targetGroupTitle = newLink.groupTitle;
    
    // 🚀 优化的正则表达式：
    // 匹配 'title: "TITLE"' 之后到 'items: [' 之间的所有内容，不严格要求 icon 字段，
    // 并在 items 数组结束后，捕获插入点之前的文本。
    const itemsEndRegex = new RegExp(
        // 匹配从文件开头到目标 title，非贪婪
        `([\\s\\S]*?title:\\s*"${targetGroupTitle}"[\\s\\S]*?items:\\s*\\[[\\s\\S]*?)\\]`, 
        'm'
    );
    
    const match = oldContent.match(itemsEndRegex);

    if (!match) {
        // 确保返回详细信息
        throw new Error(`文件内容匹配失败。请检查分组标题是否为 "${targetGroupTitle}"，或 nav.js 文件格式是否被破坏。`);
    }

    const insertionPoint = match.index + match[1].length;
    let contentToInsert = newLinkString;
    
    // 检查 items 数组是否为空，如果为空，则不需要开头的逗号。
    const contentBeforeClosingBracket = oldContent.substring(oldContent.lastIndexOf('[', insertionPoint) + 1, insertionPoint).trim();

    if (contentBeforeClosingBracket === '') {
        contentToInsert = contentToInsert.substring(1); 
    }
    
    const newContent = oldContent.slice(0, insertionPoint) + contentToInsert + oldContent.slice(insertionPoint);

    return newContent;
}

// -----------------------------------------------------------
// 步骤 3: 提交新的文件内容
// -----------------------------------------------------------
async function commitNewFile(sha, newContent, env, branchName, newLink) {
    const GITHUB_API_URL = `https://api.github.com/repos/${env.REPO_OWNER}/${env.REPO_NAME}/contents/${FILE_PATH}`;
    const encodedContent = base64Encode(newContent);
    
    const commitMessage = `feat: add link "${newLink.name}" to ${newLink.groupTitle} via web UI`;

    const commitData = {
        message: commitMessage,
        content: encodedContent,
        sha: sha,
        branch: branchName 
    };

    const response = await fetch(GITHUB_API_URL, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${env.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.com.v3+json', // 修正 Accept 头，使用 GitHub 标准 V3
            'Content-Type': 'application/json',
            'User-Agent': 'Cloudflare-Worker-Commit',
        },
        body: JSON.stringify(commitData),
    });

    if (!response.ok) {
        const errorText = await response.json();
        throw new Error(`GitHub 提交失败: ${response.status} - ${errorText.message}`);
    }

    return response.json();
}

// -----------------------------------------------------------
// Cloudflare Pages Functions 入口 (无鉴权)
// -----------------------------------------------------------
export async function onRequest(context) {
    try {
        if (context.request.method !== 'POST') {
            return new Response(JSON.stringify({ success: false, message: '只支持 POST 请求' }), { status: 405 });
        }

        const request = context.request;
        const env = context.env;
        
        const { name, url, icon, groupTitle } = await request.json();

        // 动态读取目标分支名
        const branchToUse = env.BRANCH_NAME || 'main'; 

        if (!name || !url || !groupTitle) {
            return new Response(JSON.stringify({ success: false, message: '缺少链接信息：name, url, 或 groupTitle' }), { status: 400 });
        }
        
        const newLink = { name, url, icon, groupTitle };

        // 执行文件操作
        const { sha, content } = await getCurrentFile(env, branchToUse);
        const updatedContent = updateFileContent(content, newLink);
        await commitNewFile(sha, updatedContent, env, branchToUse, newLink);

        // 成功响应
        return new Response(JSON.stringify({ 
            success: true, 
            message: `链接 "${name}" 成功提交到分支 ${branchToUse}！Cloudflare Pages 将自动开始重新部署。` 
        }), { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' } 
        });

    } catch (error) {
        console.error("Function Error:", error.message);
        return new Response(JSON.stringify({ 
            success: false, 
            message: `操作失败: ${error.message}` 
        }), { status: 500 });
    }
}