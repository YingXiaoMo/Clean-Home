/**
 * 导航页配置文件
 * 可无限添加分类（文件夹）
 */
export const navData = [
  {
    title: "常用工具",
    icon: "ri:tools-fill",
    items: [
      { name: "ChatGPT", url: "https://chat.openai.com", icon: "ri:openai-fill" },
      { name: "Canva", url: "https://www.canva.com", icon: "ri:brush-line" },
      { name: "Google 翻译", url: "https://translate.google.com", icon: "ri:translate" },
      { name: "Json格式化", url: "https://www.json.cn", icon: "ri:code-s-slash-line" }
    ,
      { name: "哔哩哔哩", icon: "https://icons.duckduckgo.com/ip3/www.bilibili.com.ico", url: "https://www.bilibili.com/" }]
  },
  {
    title: "摸鱼专用",
    icon: "ri:gamepad-line",
    items: [
      { name: "微博热搜", url: "https://s.weibo.com/top/summary", icon: "ri:weibo-fill" },
      { name: "Bilibili", url: "https://www.bilibili.com", icon: "ri:bilibili-fill" },
      { name: "YouTube", url: "https://www.youtube.com", icon: "ri:youtube-fill" }
    ]
  },
  {
    title: "开发文档",
    icon: "ri:book-read-fill",
    // 默认折叠该分组 (可选配置，需组件支持)
    collapsed: false, 
    items: [
      { name: "Vue.js", url: "https://vuejs.org", icon: "ri:vuejs-fill" },
      { name: "Vite", url: "https://vitejs.dev", icon: "ri:thunderstorms-line" },
      { name: "MDN", url: "https://developer.mozilla.org", icon: "ri:firefox-fill" }
    ]
  }
];