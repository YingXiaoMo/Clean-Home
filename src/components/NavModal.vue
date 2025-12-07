<template>
  <Transition name="modal">
    <div class="nav-modal" v-if="store.navOpenState" @click.self="close">
      <div class="modal-content glass-card">
        <div class="header-title">
          <Icon icon="ri:compass-3-line" width="24" height="24" />
          <span>网站导航</span>
        </div>
        <button class="close-btn" @click="close" aria-label="Close">
          <Icon icon="ri:close-circle-fill" width="32" height="32" />
        </button>
        <div class="scroll-area">
          <div class="search-box-wrapper sticky-top">
             <div class="search-box" :class="{ 'focused': isFocused }">
                <div class="engine-switch" @click.stop="toggleEngineList">
                  <Icon :icon="currentEngine.icon" width="20" height="20" class="engine-icon" />
                  <Icon icon="ri:arrow-down-s-fill" width="14" class="arrow" :class="{ 'rotate': showEngineList }"/>
                  <Transition name="drop">
                    <div class="engine-dropdown" v-if="showEngineList">
                      <div v-for="(eng, index) in searchEngines" :key="index" class="engine-item" 
                           :class="{ 'active': currentEngine.name === eng.name }" @click.stop="switchEngine(eng)">
                        <Icon :icon="eng.icon" width="18" /> <span>{{ eng.name }}</span>
                      </div>
                    </div>
                  </Transition>
                </div>
                <input type="text" v-model="keyword" class="search-input" :placeholder="currentEngine.placeholder" 
                       @focus="isFocused = true" @blur="isFocused = false" @keyup.enter="onSearch" ref="searchInputRef" />
                <button class="search-btn" @click="onSearch" :disabled="!keyword">
                  <Icon icon="ri:search-2-line" width="20" />
                </button>
              </div>
          </div>
          <Transition name="fade-content">
            <div v-show="contentReady">
              <div class="folder-group" v-for="(group, index) in categoryList" :key="index" :class="{ 'is-collapsed': group.collapsed }">
                <div class="folder-header" @click="toggleGroup(group)">
                  <div class="left" style="display: flex; align-items: center; gap: 12px;">
                    <div class="folder-icon-box">
                        <Icon :icon="group.icon || 'ri:folder-fill'" width="18" />
                    </div>
                    <span class="folder-name" style="color: #fff;">{{ group.title }}</span>
                    <span class="count">{{ group.items.length }}</span>
                  </div>
                  <Icon icon="ri:arrow-down-s-line" class="arrow" />
                </div>
                <div class="folder-wrapper" :class="{ 'wrapper-closed': group.collapsed }">
                  <div class="folder-inner">
                      <div class="grid">
                        <a v-for="(item, idx) in group.items" :key="idx" :href="item.url" target="_blank" class="nav-item">
                          <div class="icon-box">
                            <Icon v-if="!isUrl(item.icon)" :icon="item.icon || 'ri:link'" width="22" height="22" />
                            <img v-else :src="item.icon" alt="Favicon" width="22" height="22" class="favicon-img" />
                          </div>
                          <span class="link-name" :title="item.name">{{ item.name }}</span>
                        </a>
                      </div>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
          <div v-if="!contentReady" class="loading-placeholder">
            <Icon icon="ri:loader-4-line" class="spinner" width="30" />
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
<script setup>
import { ref, watch, onMounted } from 'vue';
import { useGlobalStore } from '@/store';
import { navData } from '@/config/nav';
import { searchEngines } from '@/config/search';
import { Icon } from '@iconify/vue';
const store = useGlobalStore();
const contentReady = ref(false);
const searchInputRef = ref(null);
const keyword = ref('');
const currentEngine = ref(searchEngines[0]);
const showEngineList = ref(false);
const isFocused = ref(false);
const categoryList = ref(JSON.parse(JSON.stringify(navData)));
const isUrl = (str) => str && (str.startsWith('http://') || str.startsWith('https://'));
watch(() => store.navOpenState, (val) => { 
    if(val) { 
      contentReady.value = false; 
      setTimeout(()=> contentReady.value = true, 300); 
    }
});
onMounted(() => {
  document.addEventListener('click', () => { showEngineList.value = false; });
});
const close = () => store.navOpenState = false;
const toggleEngineList = () => showEngineList.value = !showEngineList.value;
const switchEngine = (eng) => currentEngine.value = eng;
const onSearch = () => { if (keyword.value.trim()) window.open(currentEngine.value.url + encodeURIComponent(keyword.value), '_blank'); };
const toggleGroup = (g) => g.collapsed = !g.collapsed;
</script>
<style scoped lang="scss">
.nav-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 2000; display: flex; justify-content: center; align-items: center; padding: 20px; }
.modal-content { width: 100%; max-width: 850px; height: 80vh; background: rgba(30,30,30,0.85); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.15); border-radius: 16px; display: grid; grid-template-rows: auto 1fr; overflow: hidden; position: relative; }
.header-title { grid-row: 1; display: flex; align-items: center; gap: 10px; padding: 20px; font-size: 1.2rem; color: #fff; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.1); }
.close-btn { position: absolute; top: 15px; right: 15px; background: none; border: none; color: rgba(255,255,255,0.5); cursor: pointer; z-index: 50; &:hover { color: #fff; } }
.search-box-wrapper { padding: 15px 25px; background: rgba(255,255,255,0.02); }
.search-box { display: flex; align-items: center; background: rgba(0,0,0,0.3); border-radius: 8px; padding: 0 10px; border: 1px solid rgba(255,255,255,0.1); transition: 0.3s; }
.search-box.focused { border-color: #4facfe; background: rgba(0,0,0,0.5); }
.search-input { flex: 1; background: transparent; border: none; color: #fff; padding: 10px; outline: none; &::placeholder { color: rgba(255,255,255,0.7); } }
.engine-switch { position: relative; cursor: pointer; display: flex; align-items: center; gap: 5px; color: #ddd; padding-right: 10px; border-right: 1px solid rgba(255,255,255,0.1); }
.engine-dropdown { position: absolute; top: 35px; left: 0; background: #333; border-radius: 6px; padding: 5px; width: 120px; z-index: 100; border: 1px solid rgba(255,255,255,0.1); }
.engine-item { padding: 8px; display: flex; gap: 8px; align-items: center; cursor: pointer; &:hover { background: rgba(255,255,255,0.1); } }
.search-btn { width: 36px; display: flex; justify-content: center; background: none; border: none; color: #eee; cursor: pointer; &:disabled { opacity: 0.3; } }
.scroll-area { 
    grid-row: 2; 
    overflow-y: auto; 
    padding-bottom: 30px; 
    &::-webkit-scrollbar { width: 6px; height: 6px; }
    &::-webkit-scrollbar-track { background: transparent; }
    &::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 4px; }
    &::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.4); }
}
.folder-group { margin-bottom: 25px; padding: 0 30px; }
.folder-header { display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid rgba(255,255,255,0.1); cursor: pointer; opacity: 0.9; font-size: 1.05rem; &:hover { opacity: 1; } }
.folder-name { color: #fff; font-weight: 500; }
.count { margin-left: 5px; font-size: 0.85rem; color: rgba(255,255,255,0.5); background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 10px; }
.folder-icon-box {
    width: 32px; height: 32px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    color: #4facfe;
    flex-shrink: 0;
}
.folder-wrapper { display: grid; grid-template-rows: 1fr; transition: grid-template-rows 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); will-change: grid-template-rows; }
.folder-wrapper.wrapper-closed { grid-template-rows: 0fr; }
.folder-inner { overflow: hidden; min-height: 0; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 20px; padding-top: 20px; }
.nav-item { 
    display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 20px; 
    background: rgba(255,255,255,0.05); border-radius: 12px; text-decoration: none; 
    color: #fff !important; transition: all 0.2s ease; overflow: hidden;
    &:hover { background: rgba(255,255,255,0.15); transform: translateY(-3px) scale(1.02); } 
}
.icon-box { width: 42px; height: 42px; background: rgba(0,0,0,0.2); border-radius: 10px; display: flex; align-items: center; justify-content: center; .favicon-img { border-radius: 6px; width: 24px; height: 24px; object-fit: contain; } }
.link-name { 
    font-size: 0.9rem; text-align: center; color: #fff; width: 100%;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 5px;
}
.loading-placeholder { display: flex; justify-content: center; padding: 50px; color: #888; }
.spinner { animation: spin 1s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }
@media (max-width: 768px) {
  .modal-content { height: 95vh; width: 98%; }
}
</style>