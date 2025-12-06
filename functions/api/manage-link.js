/**
 * Cloudflare Pages Function: /api/add-link
 * 作用: 支持批量添加链接到 nav.js，自动处理数组插入。
 */

const base64Encode = (str) => btoa(unescape(encodeURIComponent(str)));
const base64Decode = (b64) => decodeURIComponent(escape(atob(b64)));
const FILE_PATH = 'src/config/nav.js';

// 获取文件内容
async function getCurrentFile(env, branchName) {
    const GITHUB_API_URL = `https://api.github.com/repos/${env.REPO_OWNER}/${env.REPO_NAME}/contents/${FILE_PATH}?ref=${branchName}`;
    if (!env.GITHUB_TOKEN) throw new Error("GitHub Token未配置");
    
    const response = await fetch(GITHUB_API_URL, {
        headers: { 'Authorization': `token ${env.GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.com.v3+json', 'User-Agent': 'Cloudflare-Worker-Commit' }
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`无法获取文件: ${response.status} ${errorText}`);
    }
    const data = await response.json();
    return { sha: data.sha, content: base64Decode(data.content) };
}

// 核心逻辑：批量修改内容
function updateFileContent(oldContent, payload) {
    const targetGroupTitle = payload.groupTitle;
    // 兼容处理：支持 links 数组 或 单个 newLink 对象
    const links = payload.links || [payload.newLink];
    
    // 1. 生成所有链接的字符串 (保持缩进格式)
    const newLinksString = links.map(link => 
        `,\n      { name: "${link.name}", icon: "${link.icon}", url: "${link.url}" }`
    ).join('');

    // 2. 查找目标分组的插入位置 (兼容 collapsed 字段)
    const itemsEndRegex = new RegExp(`([\\s\\S]*?title:\\s*"${targetGroupTitle}"[\\s\\S]*?items:\\s*\\[[\\s\\S]*?)\\]`, 'm');
    const match = oldContent.match(itemsEndRegex);

    if (!match) throw new Error(`未找到分组: "${targetGroupTitle}"`);

    const insertionPoint = match.index + match[1].length;
    let contentToInsert = newLinksString;
    
    // 3. 处理空数组的情况 (如果 items: [] 为空，移除第一个逗号)
    const contentBefore = oldContent.substring(oldContent.lastIndexOf('[', insertionPoint) + 1, insertionPoint).trim();
    if (contentBefore === '') {
        contentToInsert = contentToInsert.substring(1); // 去掉开头的逗号
    }
    
    return oldContent.slice(0, insertionPoint) + contentToInsert + oldContent.slice(insertionPoint);
}

// 提交到 GitHub
async function commitNewFile(sha, newContent, env, branchName, message) {
    const GITHUB_API_URL = `https://api.github.com/repos/${env.REPO_OWNER}/${env.REPO_NAME}/contents/${FILE_PATH}`;
    const response = await fetch(GITHUB_API_URL, {
        method: 'PUT',
        headers: { 'Authorization': `token ${env.GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.com.v3+json', 'Content-Type': 'application/json', 'User-Agent': 'Cloudflare-Worker-Commit' },
        body: JSON.stringify({
            message: message,
            content: base64Encode(newContent),
            sha: sha,
            branch: branchName
        }),
    });

    if (!response.ok) {
        const errorText = await response.json();
        throw new Error(`GitHub 提交失败: ${errorText.message}`);
    }
    return response.json();
}

// 入口函数
export async function onRequest(context) {
    try {
        if (context.request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
        
        const payload = await context.request.json();
        const env = context.env;
        const branchToUse = env.BRANCH_NAME || 'main';

        // 简单校验
        if (!payload.groupTitle || (!payload.links && !payload.newLink)) {
            return new Response(JSON.stringify({ success: false, message: '缺少参数: groupTitle 或 links' }), { status: 400 });
        }

        // 执行操作流程
        const { sha, content } = await getCurrentFile(env, branchToUse);
        const updatedContent = updateFileContent(content, payload);
        
        const count = payload.links ? payload.links.length : 1;
        const msg = `feat: add ${count} link(s) to ${payload.groupTitle} via web UI`;
        
        const commitData = await commitNewFile(sha, updatedContent, env, branchToUse, msg);

        return new Response(JSON.stringify({ 
            success: true, 
            message: `成功添加 ${count} 个链接！`,
            commit_url: commitData.commit.html_url
        }), { status: 200 });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
    }
}