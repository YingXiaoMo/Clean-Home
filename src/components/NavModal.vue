<template>
  <Transition name="modal">
    <div class="nav-modal" v-if="store.navOpenState" @click.self="close">
      <div class="modal-content glass-card">
        
        <div class="search-header">
          <div class="search-box" :class="{ 'focused': isFocused }">
            <div class="engine-switch" @click.stop="toggleEngineList">
              <Icon :icon="currentEngine.icon" width="20" height="20" class="engine-icon" />
              <Icon icon="ri:arrow-down-s-fill" width="14" class="arrow" :class="{ 'rotate': showEngineList }"/>
              
              <Transition name="drop">
                <div class="engine-dropdown" v-if="showEngineList">
                  <div 
                    v-for="(eng, index) in searchEngines" 
                    :key="index"
                    class="engine-item"
                    :class="{ 'active': currentEngine.name === eng.name }"
                    @click.stop="switchEngine(eng)"
                  >
                    <Icon :icon="eng.icon" width="18" />
                    <span>{{ eng.name }}</span>
                  </div>
                </div>
              </Transition>
            </div>

            <input 
              type="text" 
              v-model="keyword" 
              class="search-input"
              :placeholder="currentEngine.placeholder"
              @focus="isFocused = true"
              @blur="isFocused = false"
              @keyup.enter="onSearch"
              ref="searchInputRef"
            />

            <button class="search-btn" @click="onSearch" :disabled="!keyword">
              <Icon icon="ri:search-2-line" width="20" />
            </button>
          </div>

          <button class="close-btn" @click="close" aria-label="Close">
            <Icon icon="ri:close-circle-fill" width="32" height="32" />
          </button>
        </div>

        <div class="scroll-area">
          <Transition name="fade-content">
            <div v-show="contentReady">
              <div 
                class="folder-group" 
                v-for="(group, index) in categoryList" 
                :key="index"
                :class="{ 'is-collapsed': group.collapsed }"
                :style="{ '--delay': index * 0.03 + 's' }" 
              >
                <div class="folder-header" @click="toggleGroup(group)">
                  <div class="left">
                    <Icon :icon="group.icon || 'ri:folder-fill'" width="20" class="folder-icon"/>
                    <span class="folder-name">{{ group.title }}</span>
                    <span class="count">{{ group.items.length }}</span>
                  </div>
                  <Icon icon="ri:arrow-down-s-line" class="arrow" />
                </div>

                <div class="folder-wrapper" :class="{ 'wrapper-closed': group.collapsed }">
                   <div class="folder-inner">
                      <div class="grid">
                        <a 
                          v-for="(item, idx) in group.items" 
                          :key="idx" 
                          :href="item.url" 
                          target="_blank"
                          class="nav-item"
                        >
                          <div class="icon-box">
                            <Icon :icon="item.icon || 'ri:link'" width="22" height="22" />
                          </div>
                          <span class="link-name">{{ item.name }}</span>
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
import { ref, watch, onMounted, nextTick } from 'vue';
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

const categoryList = ref(navData.map(item => ({
  ...item,
  collapsed: item.collapsed || false 
})));

watch(() => store.navOpenState, (isOpen) => {
  if (isOpen) {
    contentReady.value = false;
    setTimeout(() => { contentReady.value = true; }, 300);
    nextTick(() => {
      if (searchInputRef.value) searchInputRef.value.focus();
    });
  } else {
    contentReady.value = false;
    showEngineList.value = false; 
    keyword.value = ''; 
  }
});

const toggleEngineList = () => {
  showEngineList.value = !showEngineList.value;
};

const switchEngine = (eng) => {
  currentEngine.value = eng;
  showEngineList.value = false;
  if (searchInputRef.value) searchInputRef.value.focus();
};

const onSearch = () => {
  if (!keyword.value.trim()) return;
  const targetUrl = currentEngine.value.url + encodeURIComponent(keyword.value);
  window.open(targetUrl, '_blank');
};

onMounted(() => {
  document.addEventListener('click', () => {
    showEngineList.value = false;
  });
});

const close = () => {
  store.navOpenState = false;
};

const toggleGroup = (group) => {
  group.collapsed = !group.collapsed;
};
</script>

<style scoped lang="scss">
.nav-modal {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.7); 
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.modal-content {
  width: 100%;
  max-width: 850px;
  height: 80vh;
  background: rgba(30, 30, 30, 0.85); 
  contain: content; 
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0,0,0,0.5);
  transform: translateZ(0); 
}

.search-header {
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 15px;
  flex-shrink: 0;
  z-index: 20; 

  .close-btn {
    background: none; border: none; padding: 0; margin-left: auto;
    color: rgba(255,255,255,0.5);
    cursor: pointer;
    transition: all 0.3s;
    &:hover { color: #fff; transform: rotate(90deg); }
  }
}

.search-box {
  flex: 1;
  max-width: 600px;
  height: 46px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  display: flex;
  align-items: center;
  padding: 0 6px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;

  &.focused {
    background: rgba(0, 0, 0, 0.4);
    border-color: rgba(255, 255, 255, 0.3);
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
  }
}

.engine-switch {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 34px;
  padding: 0 8px;
  margin-right: 5px;
  border-radius: 6px;
  cursor: pointer;
  color: #ddd;
  transition: 0.2s;
  position: relative;

  &:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }

  .arrow { opacity: 0.6; transition: transform 0.3s; }
  .arrow.rotate { transform: rotate(180deg); }
}

.engine-dropdown {
  position: absolute;
  top: 120%; left: 0;
  width: 140px;
  background: rgba(40, 40, 40, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 6px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  display: flex;
  flex-direction: column;
  gap: 2px;

  .engine-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 6px;
    font-size: 0.9rem;
    color: #ccc;
    transition: 0.2s;
    
    &:hover, &.active {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }
  }
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #fff;
  font-size: 1rem;
  height: 100%;
  padding: 0 10px;
  
  &::placeholder { color: rgba(255, 255, 255, 0.3); }
}

.search-btn {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  color: #eee;
  cursor: pointer;
  transition: 0.2s;
  
  &:hover:not(:disabled) { background: rgba(255, 255, 255, 0.25); color: #fff; }
  &:active:not(:disabled) { transform: scale(0.95); }
  &:disabled { opacity: 0.3; cursor: not-allowed; }
}

.scroll-area {
  flex: 1; overflow-y: auto; padding: 20px 24px; position: relative; scroll-behavior: smooth;
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
  &::-webkit-scrollbar-track { background: transparent; }
}
.loading-placeholder { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: rgba(255,255,255,0.5); .spinner { animation: spin 1s linear infinite; } }
@keyframes spin { 100% { transform: rotate(360deg); } }

.folder-group {
  margin-bottom: 20px; background: rgba(255, 255, 255, 0.03); border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.05); overflow: hidden;
  opacity: 0; animation: slide-in 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; animation-delay: var(--delay); 

  .folder-header {
    padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; background: rgba(255, 255, 255, 0.02); transition: background-color 0.2s; user-select: none;
    &:hover { background: rgba(255, 255, 255, 0.08); }
    .left { display: flex; align-items: center; gap: 10px; .folder-name { font-size: 1rem; font-weight: 600; color: #fff; } .count { font-size: 0.75rem; background: rgba(255,255,255,0.15); padding: 2px 8px; border-radius: 10px; color: #ddd; } }
    .arrow { color: rgba(255,255,255,0.5); transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
  }
  &.is-collapsed .arrow { transform: rotate(-90deg); }
}

.folder-wrapper { display: grid; grid-template-rows: 1fr; transition: grid-template-rows 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); will-change: grid-template-rows; }
.folder-wrapper.wrapper-closed { grid-template-rows: 0fr; }
.folder-inner { overflow: hidden; min-height: 0; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 12px; padding: 20px; padding-top: 5px; }

.nav-item {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; background: rgba(0, 0, 0, 0.2); padding: 15px 10px; border-radius: 10px; text-decoration: none; color: #ddd; border: 1px solid transparent; transition: transform 0.2s ease, background-color 0.2s ease;
  &:hover { background: rgba(255, 255, 255, 0.15); border-color: rgba(255, 255, 255, 0.3); transform: translateY(-3px); color: #fff; }
  .icon-box { width: 40px; height: 40px; background: rgba(255,255,255,0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; transition: background-color 0.2s; }
  &:hover .icon-box { background: rgba(255,255,255,0.9); color: #333; }
  .link-name { font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
}

@keyframes slide-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.modal-enter-active, .modal-leave-active { transition: opacity 0.3s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .modal-content { animation: pop-up 0.35s cubic-bezier(0.2, 0.8, 0.2, 1); }
.modal-leave-active .modal-content { animation: pop-up 0.3s reverse ease-in; }
.drop-enter-active, .drop-leave-active { transition: all 0.2s ease; }
.drop-enter-from, .drop-leave-to { opacity: 0; transform: translateY(-10px); }
.fade-content-enter-active { transition: opacity 0.4s ease; }
.fade-content-enter-from { opacity: 0; transform: translateY(10px); }
.fade-content-enter-to { opacity: 1; transform: translateY(0); }
@keyframes pop-up { 0% { transform: scale(0.95) translateY(10px); opacity: 0; } 100% { transform: scale(1) translateY(0); opacity: 1; } }

@media (max-width: 600px) {
  .modal-content { height: 90vh; width: 95%; }
  .grid { grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .search-header { padding: 15px; gap: 10px; }
  .close-btn { width: 28px; height: 28px; }
}
</style>