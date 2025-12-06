<template>
  <Transition name="modal">
    <div class="nav-modal" v-if="store.navOpenState" @click.self="close">
      <div class="modal-content glass-card">
        
        <div class="header-tabs">
          <div 
            class="tab-item" 
            :class="{ 'active': currentView === 'search' }"
            @click="currentView = 'search'"
          >
            <Icon icon="ri:search-line" /> 聚合搜索
          </div>
          <div 
            class="tab-item" 
            :class="{ 'active': currentView === 'nav' }"
            @click="currentView = 'nav'"
          >
            <Icon icon="ri:folder-line" /> 导航列表
          </div>
          <div 
            class="tab-item" 
            :class="{ 'active': currentView === 'add' }"
            @click="currentView = 'add'"
          >
            <Icon icon="ri:add-line" /> 添加导航
          </div>
        </div>

        <button class="close-btn" @click="close" aria-label="Close">
          <Icon icon="ri:close-circle-fill" width="32" height="32" />
        </button>

        <div class="scroll-area">
          <Transition name="fade-content" mode="out-in">
            <div v-if="currentView === 'search' || currentView === 'nav'" :key="currentView">
              
              <div class="search-box-wrapper">
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
              </div>

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

            </div>

            <div v-else-if="currentView === 'add'" :key="'add-nav'" class="add-form-container">
              <h3 class="form-title">添加新链接（仅为演示，实际保存需后端支持）</h3>
              <div class="form-item">
                <label for="name">名称 (Name)</label>
                <input id="name" type="text" v-model="newLink.name" placeholder="例如：我的博客" />
              </div>
              <div class="form-item">
                <label for="url">链接 (URL)</label>
                <input id="url" type="url" v-model="newLink.url" placeholder="例如：https://my.blog.com" />
              </div>
              <div class="form-item">
                <label for="icon">图标 (Iconify Code)</label>
                <input id="icon" type="text" v-model="newLink.icon" placeholder="例如：ri:book-2-line" />
                <span v-if="newLink.icon" class="icon-preview"><Icon :icon="newLink.icon" width="24" /></span>
              </div>
               <div class="form-item">
                <label for="group">分组 (Category)</label>
                <select id="group" v-model="selectedGroupIndex">
                  <option 
                    v-for="(group, index) in categoryList" 
                    :key="index" 
                    :value="index"
                  >
                    {{ group.title }}
                  </option>
                </select>
              </div>

              <div class="form-actions">
                <button 
                  class="save-btn" 
                  @click="onSubmitNewLink"
                  :disabled="!newLink.name || !newLink.url || isSaving"
                >
                  <Icon v-if="isSaving" icon="ri:loader-4-line" class="spinner-sm" />
                  <span v-else>添加到 {{ selectedGroupName }}</span>
                </button>
              </div>

              <p v-if="saveMessage" :class="['message', isSaving ? 'info' : 'error']">
                  {{ saveMessage }}
              </p>
            </div>
          </Transition>

          <div v-if="!contentReady && currentView !== 'add'" class="loading-placeholder">
            <Icon icon="ri:loader-4-line" class="spinner" width="30" />
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, onMounted, nextTick, computed } from 'vue';
import { useGlobalStore } from '@/store';
import { navData } from '@/config/nav';
import { searchEngines } from '@/config/search';
import { Icon } from '@iconify/vue';

const store = useGlobalStore();
const contentReady = ref(false);
const searchInputRef = ref(null);
const currentView = ref('search'); // 'search', 'nav', 'add'

// 搜索相关状态
const keyword = ref('');
const currentEngine = ref(searchEngines[0]);
const showEngineList = ref(false);
const isFocused = ref(false);

// 添加导航相关状态
const newLink = ref({ name: '', url: '', icon: 'ri:link' });
const selectedGroupIndex = ref(0);
const isSaving = ref(false);
const saveMessage = ref('');

const selectedGroupName = computed(() => {
  return categoryList.value[selectedGroupIndex.value]?.title || '未选择分组';
});

// 链接分类数据
const categoryList = ref(navData.map(item => ({
  ...item,
  collapsed: item.collapsed || false
})));

// 弹窗开关监听
watch(() => store.navOpenState, (isOpen) => {
  if (isOpen) {
    contentReady.value = false;
    setTimeout(() => { contentReady.value = true; }, 300);
    // 自动聚焦输入框
    nextTick(() => {
      if (searchInputRef.value) searchInputRef.value.focus();
    });
  } else {
    contentReady.value = false;
    showEngineList.value = false;
    keyword.value = '';
    currentView.value = 'search'; // 关闭后默认回到搜索视图
  }
});

// 切换引擎下拉显示
const toggleEngineList = () => {
  showEngineList.value = !showEngineList.value;
};

// 切换引擎逻辑
const switchEngine = (eng) => {
  currentEngine.value = eng;
  showEngineList.value = false;
  if (searchInputRef.value) searchInputRef.value.focus();
};

// 执行搜索
const onSearch = () => {
  if (!keyword.value.trim()) return;
  const targetUrl = currentEngine.value.url + encodeURIComponent(keyword.value);
  window.open(targetUrl, '_blank');
};

// 提交新链接（模拟 GitHub API 调用）
const onSubmitNewLink = () => {
  // 🚨 这一步是前端演示，实际的写入操作必须在 Serverless/后端完成
  isSaving.value = true;
  saveMessage.value = '正在模拟调用后端服务修改 nav.js 文件...';

  const groupName = categoryList.value[selectedGroupIndex.value].title;
  const linkData = JSON.stringify(newLink.value);
  
  // 模拟网络延迟和结果
  setTimeout(() => {
    isSaving.value = false;
    // 假设后端操作失败（因为前端无法完成写入）
    saveMessage.value = `❌ 错误：静态网页无法直接写入 GitHub 文件。请在后端（Serverless Function）实现 API 写入逻辑！\n\n您尝试添加的链接: ${newLink.value.name} 到 [${groupName}]`;

    // 清空表单（可选）
    // newLink.value = { name: '', url: '', icon: 'ri:link' };
    
  }, 2500); 
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
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.7); z-index: 2000; display: flex;
  justify-content: center; align-items: center; padding: 20px;
}
.modal-content {
  width: 100%; max-width: 850px; height: 80vh; 
  background: rgba(30, 30, 30, 0.85); contain: content; 
  border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 16px;
  display: grid; 
  /* 布局改为 grid: 1. header; 2. scroll-area */
  grid-template-rows: auto 1fr; 
  overflow: hidden; box-shadow: 0 25px 50px rgba(0,0,0,0.5); transform: translateZ(0); 
}

/* 顶部 Tab 切换栏 */
.header-tabs {
  grid-row: 1; 
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  padding: 10px 0;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
  z-index: 20;

  .tab-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 15px;
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    &:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }
    &.active { 
      background: rgba(255, 255, 255, 0.2); 
      color: #fff;
      font-weight: bold;
    }
  }
}

/* 搜索框独立容器 */
.search-box-wrapper {
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 关闭按钮绝对定位，不影响搜索框居中 */
.close-btn {
  position: absolute;
  top: 10px; /* 调整到顶部 */
  right: 15px;
  background: none; border: none; padding: 0;
  color: rgba(255,255,255,0.5);
  cursor: pointer;
  transition: all 0.3s;
  z-index: 30; /* 确保在 Tab 栏之上 */

  &:hover { color: #fff; transform: rotate(90deg); }
}


.search-box {
  width: 100%; max-width: 500px; height: 46px; background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; display: flex;
  align-items: center; padding: 0 6px; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); position: relative;

  &.focused { background: rgba(0, 0, 0, 0.4); border-color: rgba(255, 255, 255, 0.3); box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1); }
}

.engine-switch {
  display: flex; align-items: center; justify-content: center; gap: 4px; height: 34px;
  padding: 0 8px; margin-right: 5px; border-radius: 6px; cursor: pointer; color: #ddd;
  transition: 0.2s; position: relative;
  &:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }
  .arrow { opacity: 0.6; transition: transform 0.3s; }
  .arrow.rotate { transform: rotate(180deg); }
}
.engine-dropdown {
  position: absolute; top: 120%; left: 0; width: 140px; background: rgba(40, 40, 40, 0.95);
  backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px;
  padding: 6px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); display: flex; flex-direction: column; gap: 2px;
  .engine-item {
    display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 6px;
    font-size: 0.9rem; color: #ccc; transition: 0.2s;
    &:hover, &.active { background: rgba(255, 255, 255, 0.1); color: #fff; }
  }
}
.search-input {
  flex: 1; background: transparent; border: none; outline: none; color: #fff;
  font-size: 1rem; height: 100%; padding: 0 10px;
  &::placeholder { color: rgba(255, 255, 255, 0.3); }
}
.search-btn {
  width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
  background: rgba(255, 255, 255, 0.1); border: none; border-radius: 8px; color: #eee;
  cursor: pointer; transition: 0.2s;
  &:hover:not(:disabled) { background: rgba(255, 255, 255, 0.25); color: #fff; }
  &:active:not(:disabled) { transform: scale(0.95); }
  &:disabled { opacity: 0.3; cursor: not-allowed; }
}


/* --- 添加导航表单样式 --- */
.add-form-container {
  padding: 20px;
  color: #fff;
  max-width: 500px;
  margin: 0 auto;

  .form-title {
    font-size: 1.1rem;
    font-weight: bold;
    margin-bottom: 20px;
    color: #ffd700; /* 警告色 */
  }

  .form-item {
    margin-bottom: 20px;
    label {
      display: block;
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 5px;
      font-weight: 500;
    }
    input, select {
      width: 100%;
      padding: 12px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      color: #fff;
      font-size: 1rem;
      outline: none;
      transition: border-color 0.2s;
      -webkit-appearance: none;
      appearance: none;
      
      &:focus { border-color: #4facfe; }
    }
    select {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24'%3E%3Cpath fill='white' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 10px top 50%;
      padding-right: 30px;
    }
    .icon-preview {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 5px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 50%;
        margin-left: 10px;
        vertical-align: middle;
        color: #fff;
    }
  }

  .form-actions {
    margin-top: 30px;
  }

  .save-btn {
    width: 100%;
    padding: 15px;
    background: #4facfe;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    
    &:hover:not(:disabled) { background: #3e9ae0; }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
  }
  .spinner-sm { animation: spin 1s linear infinite; }
  
  .message {
    margin-top: 15px;
    padding: 10px;
    border-radius: 6px;
    font-size: 0.9rem;
    white-space: pre-wrap;

    &.info { 
      background: rgba(255, 215, 0, 0.2); 
      color: #ffd700; 
      border: 1px solid rgba(255, 215, 0, 0.4);
    }
    &.error { 
      background: rgba(255, 0, 0, 0.2); 
      color: #ff4d4f; 
      border: 1px solid rgba(255, 0, 0, 0.4);
    }
  }
}

/* --- 列表与动画 (保持不变) --- */
.scroll-area {
  grid-row: 2; /* 确保内容区在第二行 */
  overflow-y: auto; padding: 20px 24px; position: relative; scroll-behavior: smooth;
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
  &::-webkit-scrollbar-track { background: transparent; }
}

.loading-placeholder { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: rgba(255,255,255,0.5); }
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
@keyframes pop-up { 0% { transform: scale(0.95) translateY(10px); opacity: 0; } 100% { transform: scale(1) translateY(0); opacity: 1; } }

.modal-enter-active, .modal-leave-active { transition: opacity 0.3s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .modal-content { animation: pop-up 0.35s cubic-bezier(0.2, 0.8, 0.2, 1); }
.modal-leave-active .modal-content { animation: pop-up 0.3s reverse ease-in; }
.drop-enter-active, .drop-leave-active { transition: all 0.2s ease; }
.drop-enter-from, .drop-leave-to { opacity: 0; transform: translateY(-10px); }
.fade-content-enter-active { transition: opacity 0.4s ease; }
.fade-content-enter-from { opacity: 0; transform: translateY(10px); }
.fade-content-enter-to { opacity: 1; transform: translateY(0); }

@media (max-width: 600px) {
  .modal-content { height: 90vh; width: 95%; }
  .search-input { font-size: 0.9rem; }
  .engine-switch { padding: 0 6px; }
  .engine-icon { width: 18px; height: 18px; }
  .search-header { padding: 10px 15px; }
  .close-btn { right: 10px; top: 8px; }
}
</style>