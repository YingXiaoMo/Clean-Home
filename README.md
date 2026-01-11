<div align="center">
  <img src="./public/icon/logo.png" width="120" height="120" alt="Clean Home Logo">
  <h1>Clean Home</h1>
  <p>
    <b>A minimal, fast, and beautiful personal homepage / start page.</b>
  </p>
  <p>极简风格个人主页 | 导航页 | 仪表盘</p>

  <p>
    <a href="https://github.com/yingxiaomo/clean-home/blob/main/LICENSE">
      <img src="https://img.shields.io/github/license/yingxiaomo/clean-home?style=flat-square" alt="license" />
    </a>
    <a href="https://github.com/yingxiaomo/clean-home/stargazers">
      <img src="https://img.shields.io/github/stars/yingxiaomo/clean-home?style=flat-square" alt="stars" />
    </a>
    <a href="https://github.com/yingxiaomo/clean-home/network/members">
      <img src="https://img.shields.io/github/forks/yingxiaomo/clean-home?style=flat-square" alt="forks" />
    </a>
  </p>

  <p>
    <a href="https://ovoxo.cc">🔴 演示地址</a>
    <span> | </span>
    <a href="https://pages.cloudflare.com/deploy?repo=https://github.com/yingxiaomo/home">
      <img src="https://devtools.com/badge/deploy-to-cloudflare-pages.svg" alt="Deploy to Cloudflare Pages" />
    </a>
  </p>
</div>



# Clean Home 

本项目是一个基于 Vue 3 + Vite 重构的极简风格个人主页。源于对开源项目 [imsyy/home](https://github.com/imsyy/home) 的深度重构。在保留原版优秀的视觉设计同时，移除了繁重的 UI 框架依赖，重写了底层逻辑，实现了更轻量、更稳定、响应式更佳的体验。

## ✨ 核心特性

- ⚡️ **轻量极速**：移除重型 UI 库，采用原生 CSS Grid/Flex 布局，加载速度显著提升。
- 🛡️ **超强容错定位**：天气定位采用 **多个 API 轮询 + 高德/和风兜底**，确保天气数据稳定显示。
- 🖼️ **智能背景**：支持 **`src/assets/backgrounds/` 目录全格式自动扫描**，采用 **动态按需加载**，极大减小首屏体积。
- ♿ **无障碍友好**：全站按钮语义化，适配屏幕阅读器，让所有用户都能顺畅使用。
- 📊 **集成数据流**：支持 **访客统计 (不蒜子)** 和 **建站时间自动计算**，且功能可配置开关。

# ⚙️ 部署指南

## 1. 环境准备
在开始之前，请确保您的环境满足以下要求：

- **Node.js**：建议版本 LTS (v18+)，本项目构建依赖 Node.js 环境。
- **Git**：用于拉取代码。
- **包管理器**：npm (随 Node.js 安装)、pnpm 或 yarn。本文档以 npm 为例。

## 2. 获取代码与安装依赖

### 2.1 获取项目代码
首先将项目下载到本地或服务器：

```bash
# 如果使用 Git
git clone https://github.com/yingxiaomo/home.git
cd home
```

### 2.2 安装依赖
项目依赖定义在 `package.json` 中，包含 Vue 3, Pinia, Swiper 等核心库以及 Vite 构建工具。

在项目根目录下运行以下命令安装所有依赖：

```bash
npm install
```

> **注意**：如果在国内服务器部署，建议配置 npm 镜像源以加速下载。

## 3. 项目配置

在构建或运行之前，您需要对项目进行必要的配置。

### 3.1 环境变量配置 (.env)
在项目根目录下创建一个 `.env` 文件，用于配置敏感信息和 API 密钥。

`.env` 文件示例：

```ini
# --- 地图与天气服务 (推荐配置，提高准确率) ---
# 高德 Web 服务 Key
VITE_AMAP_KEY="您的_高德_Web服务KEY"

# 和风天气 Web 服务 Key
VITE_QWEATHER_KEY="您的_和风_Web服务KEY"
VITE_QWEATHER_HOST="https://api.qweather.com"

# --- 音乐 API 地址 (可选) ---
# 默认使用公用 API，建议自行部署 NetEase-Cloud-Music-API
VITE_MUSIC_API="http://your-music-api.com"
```

### 3.2 站点内容配置
项目的核心配置位于 `src/config/index.js` 文件中。您可以修改以下内容：

- 站点信息：标题、作者、描述、备案号、建站时间。
- 功能开关：是否开启访客统计等。
- 背景图片：配置本地图片或在线 API 地址。
- 社交链接：修改首页左侧的社交图标和跳转链接。
- 网站列表：修改首页右侧的导航链接列表。

## 4. 本地开发与预览

在部署前，您可以在本地启动项目进行调试。

### 启动开发服务器：
```bash
npm run dev
```

启动后访问 `http://localhost:3000` 即可预览。

### 本地预览构建结果：
```bash
npm run build
npm run preview
```
## 5. 部署方式
您可以选择以下任意一种方式进行部署。

### 1. [Vercel (推荐)](https://vercel.com)

最简单快捷的部署方式。

1.  Fork 本项目到你的 Github。
2.  登录 [Vercel](https://vercel.com/)，点击 **New Project**。
3.  导入你的 Github 仓库。
4.  **重要**：在 **Environment Variables** 中填入 `.env` 里的环境变量 (如 `VITE_AMAP_KEY`)。
5.  点击 **Deploy**。Vercel 会自动识别框架并完成构建。

### 2. [Cloudflare Pages ](https://pages.cloudflare.com)

1.  登录 [Cloudflare Dashboard - Pages](https://pages.cloudflare.com)，点击 **创建应用程序** 或进入你已有的项目。
2.  连接你的 Github 账户并选择仓库。
3.  **构建设置**:
    *   **框架预设**: `Vue` 或 `Vite`
    *   **构建命令**: `npm run build`
    *   **构建输出目录**: `dist`
4.  **环境变量**: 在设置中添加 `.env` 里的变量。
5.  点击 **Save and Deploy**。
6.  **部署地址**: 部署成功后，你可以在 Cloudflare Pages **项目概览页面**找到应用的访问地址。


### 3.传统 Nginx 静态部署

#### 1. 执行构建
在本地或服务器上运行构建命令，生成静态文件：

```bash
npm run build
```

构建完成后，会在项目根目录生成一个 `dist` 文件夹，将文件夹上传到服务器即可。

#### 2. 配置 Nginx
确保您的服务器已安装 Nginx。修改 Nginx 配置文件（通常位于 `/etc/nginx/conf.d/` 目录下创建一个新的 `.conf` 文件，或者合并到您的主配置中），参考项目提供的 `nginx.conf`：

```nginx
server {
    listen       80;
    server_name  your-domain.com; # 替换为您的域名
    root   /path/to/your/project/dist; # 指向构建生成的 dist 目录绝对路径
    index  index.html index.htm;

    # 开启 gzip_static，直接利用 Vite 生成的 .gz 文件，减少 CPU 消耗
    gzip_static on;

    # 开启普通 gzip (针对未预压缩的文件)
    gzip on;
    gzip_min_length 1k;
    gzip_comp_level 6;
    gzip_types text/plain application/javascript application/x-javascript text/css application/xml text/javascript application/x-httpd-php image/jpeg image/gif image/png;
    gzip_vary on;

    location / {
        # SPA 路由重定向：解决刷新 404 问题
        try_files $uri $uri/ /index.html;
    }

    # 缓存静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }

    # 错误页面配置
    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }
}
```

#### 3. 重启 Nginx
```bash
sudo nginx -t  # 检查配置语法
sudo nginx -s reload # 重启 Nginx
```

### 4：Docker 容器化部署

项目内置了 Dockerfile，支持一键构建和运行。

#### 1. 构建 Docker 镜像
在项目根目录下执行（注意最后的 `.`）：

```bash
docker build -t home .
```

此过程会经历两个阶段：首先在 Node 环境中构建项目，然后将产物复制到 Nginx 镜像中。

#### 2. 运行容器
运行容器并映射端口（例如映射到宿主机 8080 端口）：

```bash
docker run -p 44355:80 -d home
```

### 3. Docker Compose 部署 (推荐)
如果您已经安装了 Docker Compose，可以使用以下方式一键部署：

```bash
# 启动
docker compose up -d
# 停止
docker compose down
# 更新镜像并重启
docker compose pull && docker compose up -d
```




## ⚙️ 资源文件

- **背景图**：为了启用背景图自动扫描和优化构建，请将所有背景图片文件移动到：`src/assets/backgrounds/` 目录，支持jpg，png，webp等格式，不需要改名
- **自定义图标**：确保 Logo 和 Favicon 位于：`public/icon/`


## 🔌 API 接口说明

### 定位与天气逻辑

采用 **多级降级策略** 来确保天气数据尽量不失败：

1. 由于高德 ipv6 支持不佳，优先尝试免费 API **[Vore](https://api.vore.top)**，**[Xxapi](https://xxapi.cn)**，自动获取位置。
2.  若失败，**尝试 [高德IP定位](https://console.amap.com/dev/key/app)** ，需在 `.env` 配置 `VITE_AMAP_KEY`。
3.  若仍失败，尝试自建兜底 API，有自己的可以在 `src/config/index.js` 中配置 。
4.  最后获取天气：根据获取到的位置，依次尝试 **[和风天气](https://id.qweather.com)** -> **[高德天气](https://console.amap.com/dev/index)** -> **[vore 天气](https://api.vore.top/api/Weather)** -> **[自建兜底](https://api.ovoxo.cc)**，有一个返回结果会自动停止，全部失败返回默认北京。


### 音乐

- [Meting API](https://github.com/metowolf/Meting) 解析网易云/QQ音乐的歌单播放地址，推荐自行部署。

### 一言

- [Hitokoto API](https://hitokoto.cn) 获取每日一句励志/文艺语句。

### 壁纸
- [随机二次元壁纸](https://img.paulzzh.com/touhou/random)
- [必应每日一图](https://api.vore.top/api/Bing) 



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
├── .env             # 环境变量配置文件 (需要手动创建)
├── Dockerfile       # Docker 构建配置
├── nginx.conf       # Nginx 服务器配置 
├── index.html       # 入口文件
└── vite.config.js   # Vite 配置文件
```

## 🤝 贡献与致谢

感谢以下项目提供的灵感与资源：

- **原始设计: [imsyy/home](https://github.com/imsyy/home)**
- **[VORE-API](https://github.com/imsyy/home)**
- **[小小API](https://xxapi.cn/)**
- **图标：[Remix Icon via Iconify](https://icon-sets.iconify.design/ri/)**
- **图标：[Remix Icon via Iconify](https://icon-sets.iconify.design/mingcute/?keyword=MingCute+Icon)**
- **访客统计: 不蒜子**
