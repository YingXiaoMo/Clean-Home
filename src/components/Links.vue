<template>
  <div class="links-card">
    <div class="header">
      <Icon icon="ri:link" width="20" height="20" />
      <span class="title">网站列表</span>
    </div>
    
    <swiper
      :modules="[Pagination, Mousewheel]"
      :slides-per-view="1"
      :space-between="20"
      :pagination="{ clickable: true }"
      :mousewheel="true"
      class="link-swiper"
    >
      <swiper-slide v-for="(page, pIndex) in siteLinksList" :key="pIndex">
        <div class="link-grid">
          <a 
            v-for="(item, index) in page" 
            :key="index" 
            :href="item.link" 
            target="_blank" 
            class="link-item glass-card"
          >
            <div class="icon-box">
               <Icon :icon="item.icon || 'ri:link'" width="28" height="28" />
            </div>
            <span class="name">{{ item.name }}</span>
          </a>
        </div>
      </swiper-slide>
    </swiper>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Pagination, Mousewheel } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { Icon } from '@iconify/vue';
import { siteLinks } from '@/config';

const siteLinksList = computed(() => {
  const result = [];
  for (let i = 0; i < siteLinks.length; i += 6) {
    result.push(siteLinks.slice(i, i + 6));
  }
  return result;
});
</script>

<style scoped lang="scss">
.links-card {
  width: 100%;
  margin-top: 0;
  
  .header {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
    color: white;
    .title { margin-left: 8px; font-weight: bold; font-size: 1.1rem; }
  }

  .link-swiper {
    width: 100%;
    padding-bottom: 30px;
    
    :deep(.swiper-pagination-bullet) {
      background: #fff;
      opacity: 0.4;
      &.swiper-pagination-bullet-active { opacity: 1; }
    }
  }

  .link-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 25px;
    
    @media (max-width: 720px) {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .link-item {
      height: 120px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      text-decoration: none;
      transition: 0.3s;
      padding: 0 10px;

      &:hover {
        background: rgba(0,0,0,0.4);
        transform: translateY(-5px);
      }

      .icon-box { margin-bottom: 10px; }
      
      .name { 
        font-size: 1.1rem; 
        opacity: 0.9;
        width: 100%;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }
}

.glass-card {
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
</style>