// src/config/index.js

/**
 * -----------------------------------------------------------------------------
 * 全局配置文件
 * -----------------------------------------------------------------------------
 * 这里集中管理网站的所有可配置项，包括站点信息、音乐、背景、链接等。
 * 修改这里的配置后，无需修改组件代码，页面会自动更新。
 */

// 站点基本信息
export const siteConfig = {
  title: "ovoxo.cc",                // 浏览器标签页上显示的标题 
  author: "天天",                   // 站长名称
  description: "记录生活碎片、收集灵感糖果的小站，点进来就是朋友啦！",
  url: "ovoxo.cc",                   // 站点链接 (用户自己的域名)
  startTime: "2025-04-15",           // 建站时间
  icp: "京ICP备2022015201号-1",       // ICP 备案号
  



  // 访问量统计配置
  showStatistics: true, //开关：true 开启 | false 关闭
};




// API 端点配置
// 兜底 IP 定位和天气
// 这是我自建的，目的是为了不填写天气 API Key 也能正常获取天气，但是不保证可用性，建议自行部署或使用稳定的第三方服务。
export const apiEndpoints = {
  userGeoHosts: [
    'https://api.ovoxo.cc',
    'https://api.396638.xyz'
  ]
};





// 音乐播放器配置
export const musicConfig = {
  api: import.meta.env.VITE_MUSIC_API || "https://musicapi.396638.xyz/api",    // 优先读取环境变量 VITE_MUSIC_API，如果没有则使用默认的，默认 API 可能会不稳定，建议自行部署 NetEase-Cloud-Music-API
  server: "netease",              // 音乐平台 可选值: 'netease' (网易云) | 'tencent' (QQ音乐)
  type: "playlist",               // 播放类型 可选值: 'playlist' (歌单) | 'song' (单曲) | 'album' (专辑)
  id: "13575938506",              // 歌单 ID 或 歌曲 ID 在网易云网页版打开歌单，URL 中的 id=xxxxxx 即为 ID
};



// 背景 & Logo 配置
export const themeConfig = {
  siteLogo: "/icon/logo.png",              // 站点 Logo 放在 public/images/icon/ 目录下
  background: {                           // 背景来源类型
    type: "local",                        // 可选值: 'local' 使用本地图片，'api' 使用在线 API 图片
    localCount: 10,                       // 本地背景图片数量，当 type 为 'local' 时生效，随机读取 src/assets/backgrounds/ 目录图片。

// 在线背景 API 地址，当 type 为 'api' 时生效。      
    apiURL: "https://img.paulzzh.com/touhou/random",      // 随机二次元
    apiURL: "https://api.vore.top/api/RandBG",            // 随机二次元
//  apiURL: "https://api.vore.top/api/Bing",              // 必应每日一图  
  },
};



/**
// 社交链接配置
 * 如何使用新图标:
 * 1. 访问图标库：https://icon-sets.iconify.design/
 * 2. 搜索你想要的图标（如 "bilibili"），找到喜欢的图标代码（如 "ri:bilibili-fill"）。
 * 3. 如果图标的前缀（如 "ri:" 或 "mingcute:"）项目中没有安装，你需要安装并注册：
 * - 终端运行命令安装：npm install @iconify-json/{前缀} -D
 * - 例如安装 Material Design: 
 * -                          npm install @iconify-json/mdi -D
 * - 在 src/main.js 中引入并注册 (addCollection)。
 * 4. 如果是已有前缀 (ri: 和 mingcute:)，直接填代码即可使用。
 */

// 嫌太长了，可以把下面的每个卡片写成一行:
// { name: "书签", link: "https://book.example.com", icon: "ri:bookmark-line" }


export const socialLinks = [
  { 
    name: "Github",                           // 卡片名字
    icon: "ri:github-fill",                   // 图标名字写这里
    url: "https://github.com",                // 跳转链接
    tip: "去 Github 看看"                     
  },
  { 
    name: "Bilibili", 
    icon: "ri:bilibili-fill", 
    url: "https://bilibili.com", 
    tip: "(゜-゜)つロ 干杯 ~" 
  },
  { 
    name: "QQ", 
    icon: "ri:qq-fill", 
    url: "http://wpa.qq.com/msgrd?v=3&uin=3966368520&site=qq&menu=yes", 
    tip: "有什么事吗" 
  },
  { 
    name: "Email", 
    icon: "ri:mail-fill", 
    url: "mailto:mm@mmovo.com", 
    tip: "来封 Email ~" 
  },
  { 
    name: "Twitter", 
    icon: "ri:twitter-x-fill", 
    url: "https://twitter.com", 
    tip: "你懂的 ~" 
  },
  { 
    name: "Telegram", 
    icon: "ri:telegram-fill", 
    url: "https://t.me/TianTianOVOBot", 
    tip: "你懂的 ~" 
  }
];

/**
 * 网站列表配置
 * 这里的图标同样直接填写 Iconify 代码即可。
 * 建议每页 6 个，超出 6 个会自动分页显示。
 */

export const siteLinks = [
  { 
    name: "博客", 
    link: "https://blog.example.com", 
    icon: "ri:book-2-line" 
  },
  { 
    name: "网盘", 
    link: "https://cloud.example.com", 
    icon: "ri:cloud-line" 
  },
  { 
    name: "音乐", 
    link: "https://music.163.com/", 
    icon: "ri:music-2-line" 
  },
  { 
    name: "Github", 
    link: "https://github.com/", 
    icon: "ri:github-line" 
  },
  { 
    name: "邮箱", 
    link: "mailto:test@test.com", 
    icon: "ri:mail-line" 
  },
  { 
    name: "书签", 
    link: "https://book.example.com", 
    icon: "ri:bookmark-line" 
  }
];


