<template>
  <div class="footer-wrapper">
    <Transition name="fade" mode="out-in">
      <div v-if="store.playerState && store.playerLrc" class="lrc-line" :key="'lrc'">
        <Icon icon="ri:music-2-fill" width="18" height="18" />
        <span class="text">{{ store.playerLrc }}</span>
        <Icon icon="ri:music-2-fill" width="18" height="18" />
      </div>

      <div v-else class="copyright" :key="'copy'">
        
        <span>&copy; {{ copyrightDate }}</span>
        
        <span class="author-link">
          Theme by 
          <a :href="sys.p" target="_blank">{{ sys.n }}</a>
        </span>
        
        <span class="split">|</span>
        
        <a href="https://beian.miit.gov.cn/" target="_blank">{{ siteConfig.icp }}</a>
        
        <span class="split hidden-mobile">|</span>
        <span class="running-time hidden-mobile">已运行 {{ runningDays }} 天</span>

        <template v-if="siteConfig.showStatistics">
          <span class="split hidden-mobile">|</span>
          <span id="busuanzi_container_site_pv" class="visitor-count hidden-mobile">
            访问量 <span id="busuanzi_value_site_pv">--</span> 次
          </span>
        </template>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch, nextTick } from 'vue';
import { useGlobalStore } from '@/store';
import { siteConfig } from '@/config';
import { Icon } from '@iconify/vue';
import dayjs from 'dayjs';

const _hash_sig = "62303176595668705747647561566b3d"; 
const _hash_key = "5a57317661433976625739686158686e626d6c354c3231765979356964576830615763764c7a707a6348523061413d3d"; 

const _verify = (h) => {
  try {
    const s = h.match(/.{1,2}/g).map(b => String.fromCharCode(parseInt(b, 16))).join('');
    return window.atob(s).split('').reverse().join('');
  } catch (e) { return 'Error'; }
};

const sys = {
  n: _verify(_hash_sig), 
  p: _verify(_hash_key) 
};

const store = useGlobalStore();
const runningDays = ref(0);

const copyrightDate = computed(() => {
  const startYear = dayjs(siteConfig.startTime).year();
  const currentYear = dayjs().year();
  return currentYear === startYear ? startYear : `${startYear} - ${currentYear}`;
});

const calcRunningDays = () => {
  const start = dayjs(siteConfig.startTime);
  const now = dayjs();
  runningDays.value = now.diff(start, 'day');
};

const loadBusuanzi = () => {
  if (!siteConfig.showStatistics) return;
  const oldScript = document.getElementById('busuanzi-script');
  if (oldScript) oldScript.remove();
  if (window.bszCaller) { window.bszCaller = null; window.bszTag = null; }

  const script = document.createElement('script');
  script.id = 'busuanzi-script';
  script.src = `//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js?t=${Date.now()}`;
  script.async = true;
  script.referrerPolicy = 'unsafe-url'; 
  document.body.appendChild(script);

  if (import.meta.env.DEV) {
    setTimeout(() => {
      const pvEl = document.getElementById('busuanzi_value_site_pv');
      const containerEl = document.getElementById('busuanzi_container_site_pv');
      if (pvEl && pvEl.innerText === '--') {
        pvEl.innerText = '9999 (dev)';
        if (containerEl) containerEl.style.display = 'inline-flex';
      }
    }, 2000);
  }
};

watch(() => store.playerState, (isPlaying) => {
  if (!isPlaying) {
    nextTick(() => {
      loadBusuanzi();
    });
  }
});

onMounted(() => {
  calcRunningDays();
  setTimeout(() => {
    loadBusuanzi();
  }, 1000);
});
</script>

<style scoped lang="scss">
.footer-wrapper {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
  height: 30px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.lrc-line {
  display: flex;
  align-items: center;
  gap: 10px;
  .text {
    max-width: 80vw;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}

.copyright {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;

  a {
    color: inherit;
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: all 0.3s;
    cursor: pointer;
    &:hover {
      color: #fff;
      border-bottom-color: #fff;
    }
  }

  .split {
    margin: 0 2px;
    opacity: 0.6;
    font-size: 12px;
  }

  .visitor-count {
    display: flex;
    align-items: center;
  }
  
  .author-link {
    font-weight: 500;
  }
}

@media (max-width: 720px) {
  .hidden-mobile {
    display: none !important;
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>