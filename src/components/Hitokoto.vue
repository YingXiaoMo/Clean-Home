<template>
  <div class="hitokoto-card glass-card">
    
    <div class="music-area-top" @click.stop="store.musicOpenState = true" title="打开音乐播放器">
      
      <Icon icon="ri:music-2-fill" width="16" height="16" class="music-icon"/>
      <span class="music-text">打开音乐播放器</span>
      
    </div>
    
    <div class="content-wrapper" @click="updateHitokoto">
      <div class="content">
        <span class="text">“ {{ hitokoto.text }} ”</span>
      </div>

      <div class="footer">
        <span class="from">-「 {{ hitokoto.from }} 」</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useHitokoto } from '@/composables/useHitokoto';
import { useGlobalStore } from '@/store';
import { Icon } from '@iconify/vue';

const { hitokoto, updateHitokoto } = useHitokoto();
const store = useGlobalStore();
</script>

<style scoped lang="scss">
.hitokoto-card {
  width: 100%;
  height: 100%;
  padding: 0 0 15px 0; 
  box-sizing: border-box;
  
  display: flex;
  flex-direction: column;
  align-items: center; 
  
  .music-area-top {
    width: 100%;
    height: 30px; 
    padding-top: 3px; 
    
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
    
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 5px; 

    cursor: pointer; 
    transition: background-color 0.3s;
    
    .music-icon, .music-text {
      opacity: 0;
      transition: opacity 0.3s;
    }
    
    &:hover {
      background-color: rgba(255, 255, 255, 0.1); 
      
      .music-icon { opacity: 0.75; } 
      .music-text { opacity: 0.7; }
    }
    
    .music-icon { color: #fff; }
    
    .music-text {
      color: #fff;
      font-size: 0.9rem;
      font-weight: 500;
      white-space: nowrap;
    }
  }

  .content-wrapper {
    flex-grow: 1;
    width: 100%;
    padding: 0 20px; 
    
    display: grid;
    grid-template-rows: 1fr auto; 
    gap: 0;
    

    position: relative; 
    overflow: hidden; 
    
    cursor: pointer;
    transition: transform 0.3s;
    
    &:hover { transform: scale(1.01); }
  }

  .content {
    padding-bottom: 25px; 
    
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    overflow: hidden;
    width: 100%;
    padding-top: 5px; 
    
    .text {
      font-size: 1.1rem; 
      font-weight: bold;
      line-height: 1.5;
      text-align: left;
      width: 100%;
      
      display: -webkit-box;
      -webkit-line-clamp: 2; 
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      word-break: break-word;
      
      font-family: "HarmonyOS_Regular", "Microsoft YaHei", sans-serif !important;
    }
  }

  .footer {
    position: absolute;
    bottom: 5px; 
    right: 20px; 
    

    width: calc(100% - 40px); 
    
    display: block; 
    text-align: right; 
    padding-top: 0; 
    
    .from {
      font-size: 1rem; 
      font-weight: bold;
      opacity: 0.9;
      
  
      display: inline-block;
      white-space: nowrap; 
      overflow: hidden;
      text-overflow: ellipsis;
      

      max-width: 100%; 
      
      font-family: "HarmonyOS_Regular", "Microsoft YaHei", sans-serif !important;
    }
  }
}

.glass-card {
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1); 
  color: white;
}
</style>