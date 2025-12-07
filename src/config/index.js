// src/config/index.js
import siteData from './site-data.json';

/**
 * -----------------------------------------------------------------------------
 * 全局配置文件 (数据适配层)
 * -----------------------------------------------------------------------------
 * 为了支持后台管理系统 (/admin) 在线修改配置，核心数据已迁移至 site-data.json。
 * 本文件负责将 JSON 数据导出为组件可用的常量，并处理部分动态逻辑（如环境变量）。
 */

// 1. 站点基本信息 (来自 site-data.json)
export const siteConfig = siteData.siteConfig;

// 2. API 端点配置 (来自 site-data.json)
export const apiEndpoints = siteData.apiEndpoints;

// 3. 音乐播放器配置
// 融合了 JSON 配置和代码逻辑 (环境变量)
export const musicConfig = {
  ...siteData.musicConfig,
  // 优先读取环境变量，否则使用 JSON 中的默认值
  api: import.meta.env.VITE_MUSIC_API || siteData.musicConfig.api,
  // 移除了静态歌单 (国际化已移除)
};

// 4. 背景 & Logo 配置 (来自 site-data.json)
export const themeConfig = siteData.themeConfig;

// 5. 社交链接 (来自 site-data.json)
export const socialLinks = siteData.socialLinks;

// 6. 底部网站列表 (来自 site-data.json)
export const siteLinks = siteData.siteLinks;
