/**
 * 搜索引擎配置
 * name: 引擎名称
 * icon: 图标 (Iconify)
 * url: 搜索前缀 (查询关键词将拼接在后面)
 * placeholder: 输入框占位符
 */
export const searchEngines = [
  { 
    name: 'Google', 
    icon: 'ri:google-fill', 
    url: 'https://www.google.com/search?q=', 
    placeholder: 'Google Search...' 
  },
  { 
    name: 'Baidu', 
    icon: 'ri:baidu-fill', 
    url: 'https://www.baidu.com/s?wd=', 
    placeholder: '百度一下，你就知道' 
  },
  { 
    name: 'Bing', 
    icon: 'ri:bing-fill', 
    url: 'https://www.bing.com/search?q=', 
    placeholder: '微软 Bing 搜索' 
  },
  { 
    name: 'GitHub', 
    icon: 'ri:github-fill', 
    url: 'https://github.com/search?q=', 
    placeholder: 'Search GitHub...' 
  },
  { 
    name: 'Bilibili', 
    icon: 'ri:bilibili-fill', 
    url: 'https://search.bilibili.com/all?keyword=', 
    placeholder: '搜索 B 站视频' 
  }
];
