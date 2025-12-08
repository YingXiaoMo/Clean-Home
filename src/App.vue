<template>
  <Transition name="fade" mode="out-in">
    <div class="loading" v-if="!store.imgLoadStatus">
      
      <div class="loading-orb orb-1"></div>
      <div class="loading-orb orb-2"></div>

      <div class="loading-box">
        <div class="particles-container">
          <div 
            v-for="(p, index) in particles" 
            :key="index" 
            class="particle" 
            :style="p.style"
          ></div>
        </div>

        <img :src="themeConfig.siteLogo" alt="Logo" class="loading-logo" />
        
        <div class="loader"></div>
        
        <span class="loading-text">Loading...</span>
        
        <div class="font-preload-helper">
          <span style="font-family: 'Pacifico-Regular'">preload</span>
          <span style="font-family: 'UnidreamLED'">preload</span>
        </div>
      </div>
    </div>
  </Transition>

  <Background />

  <WelcomeNotify />

  <Transition name="slide-down">
    <div class="music-notify" v-show="musicNotifyShow">
      <Icon icon="ri:music-2-fill" width="16" height="16" style="margin-right:5px; display:inline-block; vertical-align:text-bottom;"/>
      <span>{{ store.playerTitle }} - {{ store.playerArtist }}</span>
    </div>
  </Transition>

  <transition name="fade">
    <main class="main-container" v-show="store.imgLoadStatus">
      <div class="content">
        <section class="left-col">
          <InfoCard />
          <SocialLinks />
        </section>
        
        <section class="right-col">
          <div class="func-row">
            <div class="switcher-box">
               <Transition name="fade">
                 <div class="abs-full" v-show="store.musicOpenState">
                   <MusicPlayer />
                 </div>
               </Transition>
               <Transition name="fade">
                 <div class="abs-full" v-show="!store.musicOpenState">
                   <Hitokoto />
                 </div>
               </Transition>
            </div>
            <div class="col-weather">
               <FuncCard />
            </div>
          </div>
          <Links />
        </section>
      </div>
      
      <footer class="footer">
        <Footer />
      </footer>
    </main>
  </transition>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useGlobalStore } from '@/store';
import { siteConfig, themeConfig } from '@/config';
import Background from '@/components/Background.vue';
import InfoCard from '@/components/InfoCard.vue';
import SocialLinks from '@/components/SocialLinks.vue';
import FuncCard from '@/components/FuncCard.vue';
import Hitokoto from '@/components/Hitokoto.vue';
import Links from '@/components/Links.vue';
import MusicPlayer from '@/components/MusicPlayer.vue';
import Footer from '@/components/Footer.vue';
import { Icon } from '@iconify/vue';
import WelcomeNotify from '@/components/WelcomeNotify.vue';

const store = useGlobalStore();
const musicNotifyShow = ref(false);
let notifyTimer = null;

const particleCount = 50; 
const particles = Array.from({ length: particleCount }, (_, i) => {
  const angle = Math.random() * 360; 
  const distance = 200 + Math.random() * 200; 
  const delay = Math.random() * 2; 
  const size = 2 + Math.random() * 3;
  const duration = 1.5 + Math.random();

  return {
    style: {
      '--angle': `${angle}deg`,
      '--dist': `${distance}px`,
      '--delay': `-${delay}s`, 
      '--dur': `${duration}s`,
      '--size': `${size}px`
    }
  };
});

watch(() => store.playerTitle, (newVal) => {
  if (newVal) {
    musicNotifyShow.value = true;
    if (notifyTimer) clearTimeout(notifyTimer);
    notifyTimer = setTimeout(() => { musicNotifyShow.value = false; }, 3000);
  }
});
</script>

<style lang="scss">
@font-face { font-family: "Pacifico-Regular"; src: url("/font/Pacifico-Regular.ttf"); }
@font-face { font-family: "UnidreamLED"; src: url("/font/UnidreamLED.ttf"); }

* { box-sizing: border-box; margin: 0; padding: 0; }

body { 
  width: 100%; 
  min-height: 100vh;
  overflow-x: hidden; 
  background: #222; 
  font-family: "HarmonyOS_Regular", "Microsoft YaHei", sans-serif; 
}

.loading { 
  position: fixed; 
  top: 0; left: 0; 
  width: 100%; height: 100%; 
  background: rgba(20, 20, 20, 0.75); 
  backdrop-filter: blur(20px); 
  -webkit-backdrop-filter: blur(20px);
  color: #fff; 
  display: flex; 
  justify-content: center; 
  align-items: center; 
  z-index: 9999; 
  overflow: hidden; 
}

.loading-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
  z-index: -1;
  animation: orb-float 8s infinite ease-in-out alternate;
}
.orb-1 {
  width: 300px; height: 300px;
  background: #4facfe; 
  top: -50px; left: -50px;
}
.orb-2 {
  width: 400px; height: 400px;
  background: #00f2fe; 
  bottom: -100px; right: -100px;
  animation-delay: -4s;
}

.loading-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 25px;
  position: relative;
}

.particles-container {
  position: absolute;
  top: 40px; 
  left: 50%;
  width: 0; height: 0;
  z-index: -1; 
}

.particle {
  position: absolute;
  top: 0; left: 0;
  width: var(--size);
  height: var(--size);
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
  opacity: 0;
  
  animation: gather var(--dur) linear infinite;
  animation-delay: var(--delay);
}

.loading-logo {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 0 30px rgba(255, 255, 255, 0.15); /* Logo 发光 */
  border: 2px solid rgba(255, 255, 255, 0.1);
  animation: logo-float 3s ease-in-out infinite;
  position: relative;
  z-index: 10;
}

.loading-text {
  font-size: 1.2rem;
  letter-spacing: 3px;
  color: rgba(255, 255, 255, 0.9);
  font-family: "Pacifico-Regular", sans-serif;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

.loader {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-bottom-color: #fff;
  border-radius: 50%;
  display: inline-block;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
}

@keyframes gather {
  0% {
    transform: rotate(var(--angle)) translateX(var(--dist));
    opacity: 0;
  }
  20% {
    opacity: 1; 
  }
  100% {
    transform: rotate(var(--angle)) translateX(0); 
    opacity: 0; 
  }
}

@keyframes rotation {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes logo-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@keyframes orb-float {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(30px, 30px) scale(1.1); }
}

.font-preload-helper {
  position: absolute;
  width: 0; height: 0;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
}

.music-notify {
  position: fixed; 
  top: 70px; 
  left: 50%; 
  transform: translateX(-50%); 
  z-index: 1000;
  background: rgba(0, 0, 0, 0.6); 
  backdrop-filter: blur(10px);
  padding: 8px 20px; 
  border-radius: 20px; 
  color: #fff; 
  font-size: 14px;
  display: flex; 
  align-items: center; 
  box-shadow: 0 4px 15px rgba(0,0,0,0.3); 
  white-space: nowrap;
  border: 1px solid rgba(255,255,255,0.1);
}

.slide-down-enter-active, .slide-down-leave-active { transition: all 0.4s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translate(-50%, -20px); }

.main-container {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  padding: 0 20px;
}

.content {
  display: flex; width: 100%; max-width: 1200px;
  justify-content: center; align-items: center; 
  gap: 80px; 
}

.left-col { flex: 0 0 40%; max-width: 450px; }
.right-col { 
  flex: 0 0 50%; max-width: 550px; 
  display: flex; flex-direction: column; 
  gap: 30px; 
}

.func-row {
  display: flex; gap: 30px; height: 160px;
  .col-weather { flex: 1; }
  .switcher-box { flex: 1; position: relative; height: 100%; }
  .abs-full { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
}

.footer { position: absolute; bottom: 20px; width: 100%; text-align: center; z-index: 10; }

@media (max-width: 990px) {
  body {
    height: auto;
    overflow-y: auto;
  }

  .main-container { position: static; display: block; height: auto; min-height: 100vh; padding: 40px 20px; overflow-y: visible; }
  .content { flex-direction: column; gap: 40px; } 
  .left-col, .right-col { width: 100%; max-width: 100%; flex: none; }
  .func-row {
    height: auto; flex-direction: column; gap: 0;
    .switcher-box { height: 180px; width: 100%; flex: none; margin-bottom: 25px; } 
    .col-weather { height: 180px; width: 100%; flex: none; }
  }
  .footer { position: static; margin-top: 50px; margin-bottom: 20px; }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.6s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>