<template>
  <div class="cover" :class="{ 'show': store.backgroundShow }">
    <img
      v-if="imgSrc"
      v-show="store.imgLoadStatus"
      :src="imgSrc"
      class="bg-img"
      @load="handleLoad"
      @error="handleError"
      alt="cover"
    />
    <div class="mask" :class="{ 'hidden': store.backgroundShow }"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useGlobalStore } from '@/store';
import { themeConfig } from '@/config';

const store = useGlobalStore();
const imgSrc = ref('');
const bgModules = import.meta.glob('@/assets/backgrounds/*.{jpg,jpeg,png,webp,gif,bmp,svg}');
const loadLocalImage = async () => {
  const keys = Object.keys(bgModules);
  if (keys.length === 0) {
    console.warn('⚠️ 未在 /src/assets/backgrounds/ 目录下发现图片，自动切换为 API 随机图模式。');
    loadApiImage();
    return;
  }

  const randomIndex = Math.floor(Math.random() * keys.length);
  const randomKey = keys[randomIndex];
  
  try {
    const module = await bgModules[randomKey]();
    imgSrc.value = module.default;
    console.log(`🖼️ 已加载本地背景 (${randomIndex + 1}/${keys.length})`);
  } catch (e) {
    console.error('加载本地背景图失败:', e);
    loadApiImage();
  }
};

const loadApiImage = () => {
  imgSrc.value = themeConfig.background.apiURL;
  console.log(`🌐 使用 API 背景图: ${imgSrc.value}`);
};

const handleLoad = () => {
  store.setImgLoadStatus(true);
  nextTick(() => {
    store.backgroundShow = true;
  });
};

const handleError = () => {
  console.error('❌ 背景图加载失败:', imgSrc.value);
  
  if (themeConfig.background.type === 'local' && imgSrc.value !== themeConfig.background.apiURL) {
     console.warn('🔄 尝试切换到 API 背景...');
     loadApiImage();
  } else {
     store.setImgLoadStatus(true);
     store.backgroundShow = true;
  }
};

onMounted(() => {
  if (themeConfig.background.type === 'api') {
    loadApiImage();
  } else {
    loadLocalImage();
  }
});
</script>

<style scoped lang="scss">
.cover {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  background-color: #222;
}

.bg-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s ease-in-out, filter 0.6s ease-in-out;
  transform: scale(1.1);
  filter: blur(10px) brightness(0.8);
  opacity: 0; 
}

.cover.show .bg-img {
  transform: scale(1);
  filter: blur(0) brightness(1);
  opacity: 1;
}

.mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.4) 100%);
  transition: opacity 0.6s;
  pointer-events: none;
}

.mask.hidden {
  opacity: 0;
}
</style>