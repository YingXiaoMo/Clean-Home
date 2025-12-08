<template>
  <div class="music-card glass-card">
    <div class="header-btns">
      <button class="btn" @click="openList" type="button" aria-label="打开音乐列表">音乐列表</button>
      <button class="btn" @click="store.musicOpenState = false" type="button" aria-label="返回一言卡片">回到一言</button>
    </div>

    <div class="controls">
      <button class="control-btn" @click="onPrev" type="button" aria-label="上一首">
        <Icon icon="ri:skip-back-fill" width="35" height="35" class="icon-btn" />
      </button>
      
      <div class="play-toggle" @click="onToggle" role="button" tabindex="0" :aria-label="isPlaying ? '暂停' : '播放'" @keydown.space.prevent="onToggle">
        <Icon v-if="!isPlaying" icon="ri:play-circle-fill" width="60" height="60" class="icon-btn main-btn" />
        <Icon v-else icon="ri:pause-circle-fill" width="60" height="60" class="icon-btn main-btn" />
      </div>
      
      <button class="control-btn" @click="onNext" type="button" aria-label="下一首">
        <Icon icon="ri:skip-forward-fill" width="35" height="35" class="icon-btn" />
      </button>
    </div>

    <div class="song-info">
      <span class="name">{{ currentSong.name }}</span>
      <span class="artist" v-if="currentSong.artist"> - {{ currentSong.artist }}</span>
    </div>
  </div>

  <Transition name="fade">
    <div class="music-modal" v-show="listVisible" @click.self="listVisible = false">
      <div class="modal-card">
        <div class="close-area" @click="listVisible = false" role="button" tabindex="0" aria-label="关闭列表">
           <Icon icon="ri:close-fill" width="24" height="24" />
        </div>
        
        <div class="player-box">
          <APlayer
            v-if="songList.length > 0"
            ref="aplayerRef"
            :audio="songList"
            :lrcType="3"
            :theme="'#efefef'"
            :autoplay="false"
            :listFolded="false"
            :listMaxHeight="420"
            :noticeSwitch="false"
            @play="onPlay"
            @pause="onPause"
            @listSwitch="onListSwitch"
            @loadedmetadata="onLoadedMetadata"
            @timeupdate="onTimeUpdate"
          />
          <div v-else class="loading-tips">歌单加载中...</div>
        </div>
      </div>
    </div>
  </Transition>

  <Teleport to="body">
    <Transition name="notify-slide">
      <div class="music-notify-container" v-if="showNotify && currentSong.name">
        <div class="notify-capsule">
          <div class="cover">
            <img :src="currentSong.cover" alt="cover" />
          </div>
          <div class="text-info">
            <span class="name">{{ currentSong.name }}</span>
            <span class="split">-</span>
            <span class="artist">{{ currentSong.artist }}</span>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="lyric-fade">
      <div class="footer-lyric-bar" v-if="isPlaying && currentLyricText && !listVisible">
        <span class="text">{{ currentLyricText }}</span>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import { useGlobalStore } from '@/store';
import { getPlayerList } from '@/api/music';
import { Icon } from '@iconify/vue';
import APlayer from '@worstone/vue-aplayer';

const store = useGlobalStore();
const songList = ref([]);
const listVisible = ref(false);
const isPlaying = ref(false);
const currentSong = ref({ name: '未播放音乐', artist: '', cover: '', lrc: '' });
const aplayerRef = ref(null);
const showNotify = ref(false);
const currentLyricText = ref("");
let notifyTimer = null;
let lrcLines = [];

watch(isPlaying, (val) => {
  if (val) document.body.classList.add('music-playing');
  else document.body.classList.remove('music-playing');
});

onMounted(async () => {
  try {
    const list = await getPlayerList();
    if (list && list.length > 0) {
      songList.value = list;
      updateBySongObject(list[0]);
    } else {
      currentSong.value.name = "暂无音乐";
    }
  } catch (e) {
    currentSong.value.name = "加载失败";
  }
});

onBeforeUnmount(() => {
  if (notifyTimer) clearTimeout(notifyTimer);
  document.body.classList.remove('music-playing');
});

const openList = () => listVisible.value = true;
const onPrev = () => aplayerRef.value?.skipBack();
const onNext = () => aplayerRef.value?.skipForward();
const onToggle = () => aplayerRef.value?.toggle();

const getRealIndex = () => {
  if (!aplayerRef.value) return 0;
  if (aplayerRef.value.aplayer && typeof aplayerRef.value.aplayer.index === 'number') {
    return aplayerRef.value.aplayer.index;
  }
  if (typeof aplayerRef.value.playIndex === 'number') {
    return aplayerRef.value.playIndex;
  }
  return 0;
};

const updateByIndex = () => {
  const index = getRealIndex();
  const targetSong = songList.value[index];
  
  if (targetSong) {
    if (targetSong.name !== currentSong.value.name) {
      updateBySongObject(targetSong);
      if (isPlaying.value) triggerNotify(); 
    }
  }
};

const updateBySongObject = (song) => {
  currentSong.value = {
    name: song.name || song.title,
    artist: song.artist || song.author,
    cover: song.cover || song.pic,
    lrc: song.lrc
  };
  parseLrc(song.lrc);
};

const onPlay = () => {
  isPlaying.value = true;
  updateByIndex();
  triggerNotify();
};

const onPause = () => {
  isPlaying.value = false;
};

const onListSwitch = (data) => {
  setTimeout(updateByIndex, 50);
};

const onLoadedMetadata = () => {
  setTimeout(updateByIndex, 50);
};

const onTimeUpdate = (e) => {
  const index = getRealIndex();
  if (songList.value[index] && songList.value[index].name !== currentSong.value.name) {
      updateByIndex();
  }

  const time = e.target.currentTime;
  if (lrcLines.length) {
    let idx = -1;
    for (let i = 0; i < lrcLines.length; i++) {
      if (lrcLines[i].time <= time) idx = i;
      else break;
    }
    if (idx !== -1) currentLyricText.value = lrcLines[idx].text;
  }
};

const triggerNotify = () => {
  showNotify.value = true;
  if (notifyTimer) clearTimeout(notifyTimer);
  notifyTimer = setTimeout(() => { showNotify.value = false; }, 3000);
};

const parseLrc = async (lrcUrl) => {
  lrcLines = [];
  currentLyricText.value = " ";
  if (!lrcUrl) return;
  try {
    const res = await fetch(lrcUrl);
    const text = await res.text();
    text.split('\n').forEach(line => {
      const match = /^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)$/.exec(line);
      if (match) {
        const time = parseInt(match[1])*60 + parseInt(match[2]) + parseInt(match[3].padEnd(3,'0'))/1000;
        const text = match[4].trim();
        if (text) lrcLines.push({ time, text });
      }
    });
  } catch (e) {}
};
</script>

<style scoped lang="scss">
.glass-card { background: rgba(0, 0, 0, 0.25); backdrop-filter: blur(10px); border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1); color: white; }
.music-card { width: 100%; height: 100%; padding: 20px; display: flex; flex-direction: column; justify-content: space-between; align-items: center; }
.header-btns { display: flex; gap: 10px; 
  .btn { 
    background: rgba(255, 255, 255, 0.15); padding: 4px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; transition: 0.3s; border: none; color: white; font-family: inherit;
    &:hover { background: rgba(255, 255, 255, 0.3); } 
  } 
}
.controls { display: flex; align-items: center; justify-content: center; gap: 20px; width: 100%; 
  .control-btn { background: none; border: none; padding: 0; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .icon-btn { cursor: pointer; opacity: 0.9; transition: transform 0.2s; color: #efefef; &:hover { transform: scale(1.1); opacity: 1; } &:active { transform: scale(0.95); } } 
  .main-btn { filter: drop-shadow(0 2px 6px rgba(0,0,0,0.3)); } 
}
.song-info { text-align: center; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 1rem; .artist { font-size: 0.85rem; opacity: 0.7; } }

.music-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(5px); z-index: 9999; display: flex; justify-content: center; align-items: center; }
.modal-card { width: 550px; min-height: 500px; max-width: 90vw; background: rgba(50, 50, 50, 0.65); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 0; position: relative; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6); overflow: hidden; display: flex; flex-direction: column; .close-area { position: absolute; top: 15px; right: 15px; z-index: 10; cursor: pointer; padding: 5px; border-radius: 50%; color: #fff; &:hover { background: rgba(255,255,255,0.1); } } .player-box { flex: 1; display: flex; flex-direction: column; } .loading-tips { text-align: center; padding: 40px; color: #ddd; } }

:deep(.aplayer) {
  background: transparent !important; box-shadow: none !important; margin: 0; width: 100%; font-family: sans-serif;
  .aplayer-body { background: transparent !important; padding: 15px 15px 0 15px; }
  .aplayer-pic { width: 80px !important; height: 80px !important; border-radius: 6px; margin-right: 15px; }
  .aplayer-info { border: none !important; padding: 0 !important; height: 80px !important;
    .aplayer-music { margin-bottom: 10px; .aplayer-title { color: #fff !important; font-size: 18px; } .aplayer-author { color: #ddd !important; font-size: 13px; } }
    .aplayer-lrc { display: none !important; } 
    .aplayer-controller { .aplayer-bar-wrap { margin: 0; .aplayer-bar { background: rgba(255,255,255,0.2); height: 4px; } .aplayer-loaded { background: rgba(255,255,255,0.3); height: 4px; } .aplayer-played { background: #fff; height: 4px; .aplayer-thumb { background: #fff; transform: scale(0.8); } } } .aplayer-time { color: #ccc; bottom: -5px; .aplayer-icon path { fill: #ccc; } } }
  }
  .aplayer-list { margin-top: 10px; display: block !important; height: auto !important; max-height: 380px !important; background: transparent !important; border: none !important; overflow-y: auto; &::-webkit-scrollbar { width: 5px; } &::-webkit-scrollbar-track { background: transparent; } &::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 4px; } &::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.4); } ol { background: transparent !important; overflow: visible !important; height: auto !important; li { background: transparent !important; border-top: 1px solid rgba(255,255,255,0.05) !important; height: 40px; line-height: 40px; padding: 0 20px; transition: background 0.2s; &:hover { background: rgba(255,255,255,0.1) !important; } .aplayer-list-index { color: #aaa !important; font-size: 13px; } .aplayer-list-title { color: #eee !important; font-size: 14px; } .aplayer-list-author { color: #999 !important; font-size: 12px; float: right; } &.aplayer-list-light { background: rgba(255,255,255,0.15) !important; .aplayer-list-title { color: #fff !important; font-weight: bold; } .aplayer-list-author { color: #ddd !important; } } } } }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

<style>
.music-notify-container {
  position: fixed; top: 60px; left: 0; width: 100%; display: flex; justify-content: center; z-index: 10000; pointer-events: none;
}
.notify-capsule {
  display: flex; align-items: center; height: 36px;
  background: rgba(0, 0, 0, 0.65); backdrop-filter: blur(10px);
  padding: 0 16px 0 4px; border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  max-width: 80%;
}
.notify-capsule .cover {
  width: 28px; height: 28px; border-radius: 50%; overflow: hidden; margin-right: 8px; flex-shrink: 0; animation: rotate-cover 8s linear infinite;
}
.notify-capsule .cover img { width: 100%; height: 100%; object-fit: cover; }
.notify-capsule .text-info {
  color: #fff; font-size: 13px; line-height: 36px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; gap: 5px;
}
.notify-capsule .text-info .name { font-weight: bold; }
.notify-capsule .text-info .artist { opacity: 0.8; font-size: 12px; }

.footer-lyric-bar {
  position: fixed; bottom: 0; left: 0; width: 100%; height: 46px; 
  display: flex; align-items: center; justify-content: center; z-index: 2000; pointer-events: none;
}
.footer-lyric-bar .text {
  font-size: 14px; color: rgba(255, 255, 255, 0.85); 
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  max-width: 85%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: 1px;
}

body.music-playing footer, body.music-playing .footer { opacity: 0 !important; transition: opacity 0.3s ease; }
@keyframes rotate-cover { to { transform: rotate(360deg); } }
.notify-slide-enter-active, .notify-slide-leave-active { transition: all 0.4s ease; }
.notify-slide-enter-from, .notify-slide-leave-to { opacity: 0; transform: translateY(-30px); }
.lyric-fade-enter-active, .lyric-fade-leave-active { transition: all 0.5s ease; }
.lyric-fade-enter-from, .lyric-fade-leave-to { opacity: 0; transform: translateY(10px); }
</style>