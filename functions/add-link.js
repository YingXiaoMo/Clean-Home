/**
 * Cloudflare Pages Function: /api/add-link
 * 作用: 安全地调用 GitHub API 修改 nav.js 文件。
 * * 环境变量要求 (配置在 Cloudflare Pages Settings 中):
 * - GITHUB_TOKEN: 具有 repo 权限的 PAT
 * - REPO_OWNER: 仓库所有者
 * - REPO_NAME: 仓库名称
 * - BRANCH_NAME: (可选) 目标分支名称，例如 'feature/i18n'。如果未设置，默认为 'main'。
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
// 步骤 2: 修改文件内容 (依赖于 nav.js 格式，保持不变)
// -----------------------------------------------------------
function updateFileContent(oldContent, newLink) {
    const newLinkString = `,\n      { name: "${newLink.name}", icon: "${newLink.icon}", url: "${newLink.url}" }`;
    const targetGroupTitle = newLink.groupTitle;
    
    // 查找目标 items 数组的结束位置（例如: items: [...] 之后的 ]）
    const itemsEndRegex = new RegExp(`(title: "${targetGroupTitle}",\\s*icon: "[^"]*",\\s*items: \\[\\s*[\\s\\S]*?)\\]`, 'm');
    const match = oldContent.match(itemsEndRegex);

    if (!match) {
        throw new Error(`文件格式不匹配或未找到标题为 "${targetGroupTitle}" 的分组。`);
    }

    const insertionPoint = match.index + match[1].length;
    let contentToInsert = newLinkString;
    
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
async function commitNewFile(sha, newContent, env, branchName) {
    const GITHUB_API_URL = `https://api.github.com/repos/${env.REPO_OWNER}/${env.REPO_NAME}/contents/${FILE_PATH}`;
    const encodedContent = base64Encode(newContent);
    const commitMessage = `feat: add link "${newLink.name}" to ${newLink.groupTitle} via web UI`;

    const commitData = {
        message: commitMessage,
        content: encodedContent,
        sha: sha,
        // 动态使用分支名称
        branch: branchName 
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

    return response.json();
}

// -----------------------------------------------------------
// Cloudflare Pages Functions 入口
// -----------------------------------------------------------
export async function onRequest(context) {
    try {
        if (context.request.method !== 'POST') {
            return new Response(JSON.stringify({ success: false, message: '只支持 POST 方法' }), { status: 405 });
        }

        const { name, url, icon, groupTitle } = await context.request.json();
        const env = context.env;

        // 1. 动态读取目标分支名，如果未设置环境变量，默认提交到 'main'
        const branchToUse = env.BRANCH_NAME || 'main'; 

        if (!name || !url || !groupTitle) {
            return new Response(JSON.stringify({ success: false, message: '缺少链接信息：name, url, 或 groupTitle' }), { status: 400 });
        }
        
        const newLink = { name, url, icon, groupTitle };

        // 2. 获取文件内容和 SHA (传入动态分支名)
        const { sha, content } = await getCurrentFile(env, branchToUse);

        // 3. 修改文件内容
        const updatedContent = updateFileContent(content, newLink);

        // 4. 提交新文件 (传入动态分支名)
        await commitNewFile(sha, updatedContent, env, branchToUse);

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
            message: `操作失败，请检查 Serverless Function 日志: ${error.message}` 
        }), { status: 500 });
    }
}