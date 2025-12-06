# Clean Home (极简个人主页)

[🇺🇸 English Documentation](./README_EN.md)

Clean Home 是一个基于 Vue 3 + Vite 重构的极简风格个人主页。本项目源于对开源项目 [imsyy/home](https://github.com/imsyy/home) 的深度重构。在保留原版优秀的视觉设计同时，移除了繁重的 UI 框架依赖，重写了底层逻辑，实现了更轻量、更稳定、响应式更佳的体验。

## ✨ 核心特性

- ⚡️ **轻量极速**：移除重型 UI 库，采用原生 CSS Grid/Flex 布局，加载速度显著提升。
- 🛡️ **超强容错定位**：天气定位采用 **多个 API 轮询 + 高德/和风兜底**，确保天气数据稳定显示。
- 🖼️ **智能背景**：支持 **`src/assets/backgrounds/` 目录全格式自动扫描**，采用 **动态按需加载**，极大减小首屏体积。
- ♿ **无障碍友好**：全站按钮语义化，适配屏幕阅读器，让所有用户都能顺畅使用。
- 🚀 **性能极致**：内置 Gzip 压缩配置，字体预加载，非阻塞式 UI 渲染，秒开体验。
- 📊 **集成数据流**：支持 **访客统计 (不蒜子)** 和 **建站时间自动计算**，且功能可配置开关。
- 🧭 **网址导航**：内置精美的网址导航页，支持分组折叠、搜索过滤，可作为浏览器主页使用。
- 🖥️ **可视化后台**：提供 `/admin` 管理面板，支持在线修改站点配置、管理导航链接、上传图片，所有修改自动提交到 GitHub 仓库。

## 🛠️ 配置与环境变量

本项目使用环境变量来配置核心功能（天气、地图）以及后台管理系统。

### 环境变量列表

无论你选择哪种部署方式，请参考下表准备环境变量。

| 变量名 | 作用 | 适用功能 | 必填 | 示例 |
| :--- | :--- | :--- | :--- | :--- |
| `VITE_AMAP_KEY` | 高德 Web 服务 Key | **天气/定位** | ✅ | `你的高德Key` |
| `VITE_QWEATHER_KEY` | 和风天气 Web 服务 Key | **天气** | ✅ | `你的和风Key` |
| `VITE_QWEATHER_HOST`| 和风天气 API 域名 | **天气** | ✅ | `https://api.qweather.com` (免费版使用 `devapi`) |
| `VITE_MUSIC_API` | Meting 音乐 API 地址 | **音乐播放器** | ❌ | `https://api.injahow.cn/meting/` |
| `GITHUB_TOKEN` | GitHub Token (需 `repo` 权限) | **后台管理** | ⚠️* | `ghp_xxxxxxxx` |
| `REPO_OWNER` | GitHub 用户名 | **后台管理** | ⚠️* | `yourname` |
| `REPO_NAME` | 仓库名称 | **后台管理** | ⚠️* | `Clean-Home` |
| `ADMIN_PASSWORD` | 后台登录密码 | **后台管理** | ⚠️* | `password123` |
| `BRANCH_NAME` | 目标分支 (默认 `main`) | **后台管理** | ❌ | `main` |

> **⚠️ 注意**：`*` 标记的变量用于启用后台管理功能。如果不需要后台管理，可以不配置这些变量。

### 填写位置

1.  **本地开发**: 创建 `.env` 文件填入。
2.  **Vercel / Cloudflare Pages**: 在平台的 **Settings -> Environment Variables** 中填入。
3.  **Docker**: 在 `docker run` 命令中使用 `-e` 参数传入。

### 自建兜底 API 配置

如果在 `.env` 中没有配置 Key，或者免费 API 均失败，项目将使用我自建的兜底 API。
如果有自己的，可以在 `src/config/index.js` 中的 `apiEndpoints` 对象里修改兜底接口地址。


## ⚙️ 资源文件

- **背景图**：为了启用背景图自动扫描和优化构建，请将所有背景图片文件移动到：`src/assets/backgrounds/` 目录，支持jpg，png，webp等格式，不需要改名
- **图标优化**：确保 Logo 和 Favicon 位于：`public/icon/`


## 📝 内容定制指南


所有页面上的文字、链接、API 开关和兜底配置，都在 `src/config/index.js` 中集中管理。


## 🔌 API 接口说明

### 定位与天气逻辑

本项目采用 **多级降级策略** 来确保数据始终可用：

1. 由于高德 ipv6 支持不佳，优先尝试免费 API **[Vore](https://api.vore.top)**，**[Xxapi](https://xxapi.cn)**，自动获取位置。
2.  若失败，**尝试 [高德IP定位](https://console.amap.com/dev/key/app)** 需在 `.env` 配置 `VITE_AMAP_KEY`。
3.  若仍失败，尝试自建兜底 API，有自己的可以在 `src/config/index.js` 中配置 `userGeoHosts`。
4.  最后获取天气：根据获取到的位置，依次尝试 **[和风天气](https://id.qweather.com)** -> **[高德天气](https://console.amap.com/dev/index)** -> **[vore 天气](https://api.vore.top/api/Weather)** -> **[自建兜底](https://api.ovoxo.cc)**，有一个返回结果会自动停止，全部失败返回默认北京。


### 音乐

- [Meting API](https://github.com/metowolf/Meting) 解析网易云/QQ音乐的歌单播放地址，推荐自行部署。

### 一言

- [Hitokoto API](https://hitokoto.cn) 获取每日一句励志/文艺语句。

### 壁纸
- [随机二次元壁纸](https://img.paulzzh.com/touhou/random)
- [必应每日一图](https://api.vore.top/api/Bing) 


## ⚙️ 部署方法

### 1. [Vercel (推荐)](https://vercel.com)

最简单快捷的部署方式。

1.  Fork 本项目到你的 Github。
2.  登录 [Vercel](https://vercel.com/)，点击 **New Project**。
3.  导入你的 Github 仓库。
4.  **重要**：在 **Environment Variables** 中填入 `.env` 里的环境变量 (如 `VITE_AMAP_KEY`)。
5.  点击 **Deploy**。Vercel 会自动识别 Vite 框架并完成构建。

### 2. [Cloudflare Pages ](https://pages.cloudflare.com)

1.  登录 [Cloudflare Dashboard - Pages](https://pages.cloudflare.com)，点击 **创建应用程序** 或进入你已有的项目。
2.  连接你的 Github 账户并选择仓库。
3.  **构建设置**:
    *   **框架预设**: `Vue` 或 `Vite`
    *   **构建命令**: `npm run build`
    *   **构建输出目录**: `dist`
4.  **环境变量**: 在设置中添加 `.env` 里的变量。
5.  点击 **Save and Deploy**。
6.  **部署地址**: 部署成功后，你可以在 Cloudflare Pages **项目概览页面**找到应用的访问地址（通常在页面的顶部或概览卡片中）。

### 3. Docker 部署

项目已内置 `Dockerfile` 和 `nginx.conf` 优化配置。

**构建镜像**:
```bash
docker build -t clean-home .
```

**运行容器**:
```bash
docker run -d -p 8080:3000 \
  -e VITE_AMAP_KEY="你的高德Key" \
  -e VITE_QWEATHER_KEY="你的和风Key" \
  -e VITE_QWEATHER_HOST="你的和风API HOST" \
  -e VITE_MUSIC_API="音乐API" \
  # --- 后台管理配置 (可选) ---
  -e GITHUB_TOKEN="ghp_xxxx" \
  -e REPO_OWNER="yourname" \
  -e REPO_NAME="Clean-Home" \
  -e ADMIN_PASSWORD="password123" \
  --name my-home clean-home
```
*注意：环境变量需要在 build 阶段传入（修改 Dockerfile）或者在构建前修改 .env 文件。推荐直接修改本地 .env 文件后再 build。*

### 4. 服务器手动部署 (Nginx)

1.  **本地构建**:
    ```bash
    # 确保已创建修改 .env 配置
    npm run build
    ```
2.  **上传文件**: 将生成的 `dist/` 目录上传到服务器 (例如 `/var/www/clean-home`)。
3.  **Nginx 配置**:
    项目根目录提供了一个优化过的 `nginx.conf`，你可以参考它配置你的服务器。核心配置如下：
    ```nginx
    server {
        listen 80;
        root /var/www/clean-home; # 指向上传的 dist 目录
        
        # 开启 Gzip 静态压缩 (项目已内置 .gz 生成)
        gzip_static on; 
        
        location / {
            # 解决 SPA 路由刷新 404 问题
            try_files $uri $uri/ /index.html;
        }
    }
    ```




## 📁 目录结构

以下是项目的关键文件和目录结构：

```
├── public/          # 静态资源 
│   ├── font/        # 字体资源
│   └── icon/        # logo和头像
├── src/
│   ├── api/         # 前端 API 封装 
│   ├── assets/
│   │   └── backgrounds/ # 自动扫描背景图片 (请将背景图放入此处，支持jpg，png，webp等，不需要改名)
│   ├── components/  # Vue 组件 
│   ├── composables/ # 组合式 API 逻辑
│   ├── config/      # 全局配置
│   ├── store/       # Pinia 状态管理
│   └── utils/       # 工具函数
├── server.js        # Node.js 后端服务 (用于 Docker/PM2 部署)
├── .env             # 环境变量配置文件 (需要手动创建)
├── Dockerfile       # Docker 构建配置 (现在基于 Node.js，包含前端构建和服务运行)
├── nginx.conf       # Nginx 服务器配置 (仅用于纯静态部署参考，不再是 Docker 核心)
├── index.html       # 入口文件
└── vite.config.js   # Vite 配置文件
```

## 🤝 贡献与致谢

感谢以下项目提供的灵感与资源：

- **原始设计: [imsyy/home](https://github.com/imsyy/home)**
- **[VORE-API](https://github.com/imsyy/home)**
- **[小小API](https://xxapi.cn/)**
- **图标：[Remix Icon via Iconify](https://icon-sets.iconify.design/)**:
- **访客统计: 不蒜子**