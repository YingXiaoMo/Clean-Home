<template>
  <div class="info-card">
    <button class="lang-switch" @click="toggleLang" title="Switch Language">
      <Icon icon="ri:translate" width="18" height="18" />
      <span class="lang-text">{{ locale === 'zh' ? 'EN' : '中' }}</span>
    </button>

    <div class="logo-wrapper">
      <img :src="logoUrl" class="logo" alt="Logo" />
      <div class="site-name">
        <span class="main">{{ t('site.title') }}</span>
        <span class="sub">.{{ config.url.split('.')[1] }}</span>
      </div>
    </div>
    
    <div class="desc-card glass-card">
      <p class="greet">Hello World !</p>
      <p class="desc-text">{{ t('site.description') }}</p>
    </div>
  </div>
</template>

<script setup>
import { siteConfig, themeConfig } from '@/config';
import { useI18n } from 'vue-i18n';
import { Icon } from '@iconify/vue';

const config = siteConfig;
const logoUrl = themeConfig.siteLogo;
const { t, locale } = useI18n();

const toggleLang = () => {
  locale.value = locale.value === 'zh' ? 'en' : 'zh';
  localStorage.setItem('lang', locale.value);
};
</script>

<style scoped lang="scss">
.info-card {
  display: flex;
  flex-direction: column;
  color: white;
  animation: fade-in 0.5s ease;
  
  .lang-switch {
    position: fixed; 
    top: 1.5rem;    
    right: 1.5rem;   
    z-index: 999;    
    
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.9);
    
    padding: 6px 14px;
    border-radius: 20px;
    cursor: pointer;
    
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 500;
    
    transition: all 0.3s;
    backdrop-filter: blur(8px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

    .lang-text {
      padding-top: 1px;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.25);
      border-color: rgba(255, 255, 255, 0.4);
      color: #fff;
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
    }
    
    &:active {
      transform: scale(0.95);
    }
  }

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
  .info-card {
    .logo-wrapper .logo { width: 80px; height: 80px; }
    .logo-wrapper .site-name .main { font-size: 2.2rem; }
    .lang-switch {
      top: 1rem;
      right: 1rem;
      padding: 4px 10px;
      font-size: 12px;
    }
  }
}

@keyframes fade-in { 
  from { opacity: 0; transform: translateY(20px); } 
  to { opacity: 1; transform: translateY(0); } 
}
</style>