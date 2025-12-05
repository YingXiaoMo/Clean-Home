# Clean Home (Minimalist Personal Homepage)

[🔴 **Live Demo**](https://ovoxo.cc) | [🇨🇳 中文文档](./README.md)

Clean Home is a minimalist personal homepage refactored with Vue 3 + Vite. This project is a deep refactoring of the open-source project [imsyy/home](https://github.com/imsyy/home). While retaining the excellent visual design of the original, it removes heavy UI framework dependencies, rewrites the underlying logic, and achieves a lighter, more stable, and more responsive experience.

## ✨ Core Features

- ⚡️ **Lightweight & Fast**: Removed heavy UI libraries, adopting native CSS Grid/Flex layout for significantly improved loading speed.
- 🛡️ **Robust Geolocation**: Weather positioning uses **multiple API polling + Amap/QWeather fallback** to ensure stable weather data display.
- 🖼️ **Smart Backgrounds**: Supports **automatic scanning of all formats in `src/assets/backgrounds/`**, using **dynamic on-demand loading** to greatly reduce the initial bundle size.
- ♿ **Accessibility Friendly**: Semantic HTML for all buttons, adapted for screen readers, ensuring smooth usage for all users.
- 🚀 **Extreme Performance**: Built-in Gzip compression configuration, font preloading, non-blocking UI rendering for instant loading.
- 📊 **Integrated Data Flow**: Supports **Busuanzi visitor statistics** and **automatic site running time calculation**, with configurable toggles.

### ⚠️ Preparation Before Deployment

#### 1. Environment Variables (.env)

Create a `.env` file in the project root directory and fill in the key API keys:

```ini
# --- Map & Weather Services (Recommended) ---
# 🚨 Amap and QWeather Keys have the highest priority. Configuring them provides the most accurate data.
VITE_AMAP_KEY="Your_Amap_WebService_KEY"
VITE_QWEATHER_KEY="Your_QWeather_WebService_KEY"
VITE_QWEATHER_HOST="Your_QWeather_API_HOST"

# --- Music API Address (Optional) ---
VITE_MUSIC_API="http://[Your_Music_API_Address]"
```

#### 2. Custom Fallback API Configuration

If no Key is configured in `.env`, or if free APIs fail, the project will use my self-hosted fallback API.
If you have your own, you can modify the fallback interface address in the `apiEndpoints` object in `src/config/index.js`.

## ⚙️ Resource Files

- **Background Images**: To enable automatic background scanning and optimized building, please move all background image files to the `src/assets/backgrounds/` directory. Supports jpg, png, webp formats, no renaming required.
- **Icon Optimization**: Ensure Logo and Favicon are located in `public/icon/`.

## 📝 Content Customization Guide

All text, links, API toggles, and fallback configurations on the page are centrally managed in `src/config/index.js`.

## 🔌 API Interface Description

### Location & Weather Logic

This project uses a **multi-level degradation strategy** to ensure data is always available:

1.  Due to poor IPv6 support in Amap, priority is given to free APIs **[Vore](https://api.vore.top)** and **[Xxapi](https://xxapi.cn)** for automatic location acquisition.
2.  If that fails, **attempts [Amap IP Location](https://console.amap.com/dev/key/app)** (requires `VITE_AMAP_KEY` configuration in `.env`).
3.  If it still fails, tries the self-hosted fallback API. If you have your own, you can configure `userGeoHosts` in `src/config/index.js`.
4.  Finally, fetches weather: Based on the acquired location, it sequentially tries **[QWeather](https://id.qweather.com)** -> **[Amap Weather](https://console.amap.com/dev/index)** -> **[Vore Weather](https://api.vore.top/api/Weather)** -> **[Self-hosted Fallback](https://api.ovoxo.cc)**. It stops automatically upon a successful response. If all fail, it defaults to Beijing.

### Music

- [Meting API](https://github.com/metowolf/Meting) parses playlists from NetEase Cloud Music/QQ Music. Self-deployment is recommended.

### Hitokoto (Daily Quote)

- [Hitokoto API](https://hitokoto.cn) fetches a daily inspirational/literary quote.

### Wallpapers

- [Random Anime Wallpaper](https://img.paulzzh.com/touhou/random)
- [Bing Daily Image](https://api.vore.top/api/Bing)

## ⚙️ Deployment Methods

### 1. [Vercel (Recommended)](https://vercel.com)

The simplest and fastest deployment method.

1.  Fork this project to your Github.
2.  Log in to [Vercel](https://vercel.com/), click **New Project**.
3.  Import your Github repository.
4.  **Important**: Fill in the environment variables from `.env` (e.g., `VITE_AMAP_KEY`) in **Environment Variables**.
5.  Click **Deploy**. Vercel will automatically detect the Vite framework and complete the build.

### 2. [Cloudflare Pages](https://pages.cloudflare.com)

1.  Log in to [Cloudflare Dashboard - Pages](https://pages.cloudflare.com), click **Create an application** or enter your existing project.
2.  Connect your Github account and select the repository.
3.  **Build Settings**:
    *   **Framework preset**: `Vue` or `Vite`
    *   **Build command**: `npm run build`
    *   **Build output directory**: `dist`
4.  **Environment Variables**: Add variables from `.env` in the settings.
5.  Click **Save and Deploy**.
6.  **Deployment Address**: After successful deployment, you can find the application's access address on the Cloudflare Pages **Project Overview** page.

### 3. Docker Deployment

The project has built-in `Dockerfile` and `nginx.conf` optimization configurations.

**Build Image**:
```bash
docker build -t clean-home .
```

**Run Container**:
```bash
docker run -d -p 8080:80 \
  -e VITE_AMAP_KEY="Your_Amap_Key" \
  -e VITE_QWEATHER_KEY="Your_QWeather_Key" \
  -e VITE_QWEATHER_HOST="Your_QWeather_API_HOST" \
  -e VITE_MUSIC_API="Music_API" \
  # Optional, uses default if left blank
  --name my-home clean-home
```
*Note: Since the build is done inside Docker, environment variables need to be passed during the build stage (modify Dockerfile) or verify .env file before build. It is recommended to modify the local .env file directly before building.*

### 4. Manual Server Deployment (Nginx)

1.  **Local Build**:
    ```bash
    # Ensure .env configuration is created/modified
    npm run build
    ```
2.  **Upload Files**: Upload the generated `dist/` directory to the server (e.g., `/var/www/clean-home`).
3.  **Nginx Configuration**:
    The project root directory provides an optimized `nginx.conf` which you can reference. Core configuration:
    ```nginx
    server {
        listen 80;
        root /var/www/clean-home; # Point to the uploaded dist directory
        
        # Enable Gzip static compression (project has built-in .gz generation) 
        gzip_static on; 
        
        location / {
            # Solve SPA routing 404 issue
            try_files $uri $uri/ /index.html;
        }
    }
    ```

## 📁 Directory Structure

Here is the key file and directory structure of the project:

```
├── public/          # Static assets 
│   ├── font/        # Font resources
│   └── icon/        # Logo and icons
├── src/
│   ├── api/         # Frontend API encapsulation 
│   ├── assets/
│   │   └── backgrounds/ # Auto-scanned background images (put images here, supports jpg, png, webp, no renaming needed)
│   ├── components/  # Vue components 
│   ├── composables/ # Composable API logic
│   ├── config/      # Global configuration
│   ├── store/       # Pinia state management
│   └── utils/       # Utility functions
├── .env             # Environment variable configuration file (needs manual creation)
├── Dockerfile       # Docker build configuration
├── nginx.conf       # Nginx server configuration 
├── index.html       # Entry file
└── vite.config.js   # Vite configuration file
```

## 🤝 Contribution & Acknowledgements

Thanks to the following projects for inspiration and resources:

- **Original Design: [imsyy/home](https://github.com/imsyy/home)**
- **[VORE-API](https://github.com/imsyy/home)**
- **[Xxapi](https://xxapi.cn/)
- **Icons: [Remix Icon via Iconify](https://icon-sets.iconify.design/)
- **Visitor Stats: Busuanzi**
