import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useGlobalStore = defineStore('global', () => {
  const imgLoadStatus = ref(false); 
  const backgroundShow = ref(false); 
  const musicOpenState = ref(false); 
  
  const playerState = ref(false); 
  const playerTitle = ref(null); 
  const playerArtist = ref(null); 
  const playerLrc = ref("歌词加载中"); 

  const setImgLoadStatus = (status) => {
    imgLoadStatus.value = status;
  };

  return { 
    imgLoadStatus, 
    backgroundShow, 
    musicOpenState, 
    setImgLoadStatus,
    playerState,
    playerTitle,
    playerArtist,
    playerLrc
  };
});