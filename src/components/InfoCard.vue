<template>
  <div class="info-card">
    <div class="logo-wrapper">
      <img :src="logoUrl" class="logo" alt="Logo" />
      <div class="site-name">
        <span class="main">{{ config.title }}</span>
        <span class="sub">.{{ config.url.split('.')[1] }}</span>
      </div>
    </div>
    <div class="desc-card glass-card">
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
  animation: fade-in 0.5s ease;
  
  .logo-wrapper {
    display: flex;
    align-items: center;
    margin-bottom: 2rem;
    .logo {
      width: 100px;
      height: 100px; 
      border-radius: 50%;
      margin-right: 1rem;
      transition: transform 0.3s;
      object-fit: cover; 
      &:hover { transform: rotate(360deg); }
    }
    .site-name {
      font-family: "Pacifico-Regular", sans-serif;
      .main { font-size: 3rem; line-height: 1; }
      .sub { font-size: 1.5rem; margin-left: 0.5rem; }
    }
  }

  .glass-card {
    padding: 1.5rem;
    background: rgba(0, 0, 0, 0.25);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: transform 0.3s;
    &:hover { transform: scale(1.01); }
    
    .greet {
      font-family: "Pacifico-Regular", sans-serif;
      font-size: 1.5rem;
      margin-bottom: 8px;
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