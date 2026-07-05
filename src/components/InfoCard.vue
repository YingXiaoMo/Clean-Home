<template>
  <div class="info-card">
    <div class="logo-wrapper">
      <img :src="logoUrl" class="logo" alt="Logo" />
      <div class="site-name">
        <span class="main">{{ config.title }}</span>
        <span class="sub">.{{ config.url.split('.').pop() }}</span>
      </div>
    </div>
    <div class="desc-card">
      <p class="greet">Hello World !</p>
      <p class="desc-text">{{ config.description }}</p>
    </div>
  </div>
</template>

<script setup>
import { siteConfig, themeConfig } from '@/config';

const config = siteConfig;
const logoUrl = themeConfig.siteLogo;
</script>

<style scoped lang="scss">
.info-card {
  display: flex;
  flex-direction: column;
  color: white;
  animation: fade-in 0.6s ease;

  .logo-wrapper {
    display: flex;
    align-items: center;
    margin-bottom: 2rem;

    .logo {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      margin-right: 1rem;
      transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      object-fit: cover;
      box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);

      &:hover {
        transform: rotate(360deg) scale(1.05);
        box-shadow: 0 0 30px rgba(255, 255, 255, 0.12);
      }
    }

    .site-name {
      font-family: "Pacifico-Regular", sans-serif;
      .main { font-size: 3rem; line-height: 1; }
      .sub { font-size: 1.5rem; margin-left: 0.5rem; opacity: 0.7; }
    }
  }

  .desc-card {
    padding: 1.5rem;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(12px);
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    transition: all 0.3s;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);

    &:hover {
      background: rgba(255, 255, 255, 0.12);
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    }

    .greet {
      font-family: "Pacifico-Regular", sans-serif;
      font-size: 1.5rem;
      margin-bottom: 8px;
      background: linear-gradient(135deg, #fff 0%, rgba(255, 255, 255, 0.7) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .desc-text {
      font-size: 1rem;
      line-height: 1.6;
      opacity: 0.85;
    }
  }
}

@media (max-width: 720px) {
  .info-card .logo-wrapper .logo { width: 80px; height: 80px; }
  .info-card .logo-wrapper .site-name .main { font-size: 2.2rem; }
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
