import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  base: './',
  plugins: [
    vue(),
    // 压缩插件在 CI 环境（Cloudflare Pages 等）可能导致构建卡死，CI 时自动跳过
    ...(process.env.CI ? [] : [viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'gzip',
      ext: '.gz',
    })]),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },

  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern',
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
})
