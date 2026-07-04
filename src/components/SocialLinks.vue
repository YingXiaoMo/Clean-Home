<template>
  <div class="social">
    <a 
      v-for="item in links" 
      :key="item.name" 
      :href="item.url" 
      target="_blank" 
      class="link-item"
      :data-tip="item.tip" 
      :aria-label="item.name"
    >
      <Icon :icon="item.icon" width="24" height="24" />
    </a>
  </div>
</template>

<script setup>
import { socialLinks } from '@/config';
import { Icon } from '@iconify/vue';

const links = socialLinks;
</script>

<style scoped lang="scss">
.social {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 15px;
  
  .link-item {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 6px;
    color: #fff;
    text-decoration: none;
    transition: all 0.3s;
    
    &:hover {
      background-color: rgba(255,255,255,0.2);
      transform: scale(1.1);
      
      &::after {
        opacity: 1;
        visibility: visible;
        transform: translate(-50%, 0); 
      }
    }

    &::after {
      content: attr(data-tip);
      
      position: absolute;
      bottom: 100%; 
      left: 50%;
      transform: translate(-50%, 8px);       
      padding: 4px 8px;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 5px;
      
      color: #fff;
      font-size: 12px;
      white-space: nowrap;
      line-height: 1.2;
      
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      z-index: 100;
      margin-bottom: 6px; 
    }
  }
}
</style>