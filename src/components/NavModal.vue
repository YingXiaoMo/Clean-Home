<template>
  <Transition name="modal">
    <div class="nav-modal" v-if="store.navOpenState" @click.self="close">
      <div class="modal-content glass-card">
        
        <div class="header-tabs">
          <div 
            class="tab-item" 
            :class="{ 'active': currentView === 'nav' }"
            @click="currentView = 'nav'"
          >
            <Icon icon="ri:folder-line" /> 导航列表
          </div>
          <div 
            class="tab-item" 
            :class="{ 'active': currentView === 'manage-links' }"
            @click="currentView = 'manage-links'"
          >
            <Icon icon="ri:edit-2-line" /> 管理链接
          </div>
          <div 
            class="tab-item" 
            :class="{ 'active': currentView === 'add-link' }"
            @click="currentView = 'add-link'"
          >
            <Icon icon="ri:add-line" /> 添加链接
          </div>
          <div 
            class="tab-item" 
            :class="{ 'active': currentView === 'add-folder' }"
            @click="currentView = 'add-folder'"
          >
            <Icon icon="ri:folder-add-line" /> 添加文件夹
          </div>
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

          <Transition name="fade-content" mode="out-in">
            
            <div v-if="currentView === 'nav'" :key="'nav-list'">
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
            </div>
            
            <div v-else-if="currentView === 'manage-links'" :key="'manage-links'" class="manage-container">
                <h3 class="form-title">管理现有链接</h3>
                
                <Transition name="fade-content" mode="out-in">
                  <div v-if="!currentEditLink" :key="'list'">
                    <div class="manage-group" v-for="group in categoryList" :key="group.title">
                      <div class="group-header clickable" @click="toggleGroup(group)">
                        <span class="group-title-text">{{ group.title }} ({{ group.items.length }})</span>
                        <Icon icon="ri:arrow-down-s-line" class="arrow" :class="{ 'rotated': group.collapsed }"/>
                      </div>
                      
                      <div class="group-list-wrapper" :class="{ 'is-collapsed': group.collapsed }">
                         <div class="group-list-inner">
                            <div class="link-item-manage" v-for="(item, idx) in group.items" :key="item.url">
                                <div class="item-left-wrapper">
                                    <div class="manage-icon-box">
                                        <Icon v-if="!isUrl(item.icon)" :icon="item.icon || 'ri:link'" width="20" height="20" />
                                        <img v-else :src="item.icon" class="manage-favicon" width="20" height="20" />
                                    </div>
                                    <div class="link-info">
                                        <span class="link-name">{{ item.name }}</span>
                                        <span class="link-url">{{ item.url }}</span>
                                    </div>
                                </div>
                                <div class="actions">
                                    <button class="action-btn icon-only edit" @click="startEdit(group.title, item, idx)" title="编辑/移动">
                                        <Icon icon="ri:pencil-line" width="18" />
                                    </button>
                                    <button class="action-btn icon-only delete" @click="onManageLink('DELETE', group.title, item, idx)" title="删除">
                                        <Icon icon="ri:delete-bin-line" width="18" />
                                    </button>
                                </div>
                            </div>
                         </div>
                      </div>
                    </div>
                  </div>
                  
                  <div v-else :key="'edit-form'" class="edit-form-wrapper">
                      <h4 class="form-title">编辑链接：{{ currentEditLink.name }}</h4>
                      <div class="form-item">
                        <label>名称 (Name) *</label>
                        <input type="text" v-model="currentEditLink.name" class="glass-input" />
                      </div>
                      <div class="form-item">
                        <label>链接 (URL) *</label>
                        <input type="url" v-model="currentEditLink.url" class="glass-input" />
                      </div>
                      <div class="form-item icon-group">
                        <label>图标 (Iconify Code / URL)</label>
                        <input type="text" v-model="currentEditLink.icon" class="glass-input" />
                        <span v-if="currentEditLink.icon" class="icon-preview">
                            <Icon v-if="!isUrl(currentEditLink.icon)" :icon="currentEditLink.icon" width="24" />
                            <img v-else :src="currentEditLink.icon" alt="Icon Preview" width="24" height="24" class="favicon-img" />
                        </span>
                      </div>
                      
                      <div class="form-item">
                        <label>目标分组 (Move To) *</label>
                        <select v-model="currentEditLink.newGroupTitle" class="glass-input high-contrast-select">
                          <option 
                            v-for="(group, index) in categoryList" 
                            :key="index" 
                            :value="group.title"
                          >
                            {{ group.title }}
                          </option>
                        </select>
                      </div>

                      <div class="form-actions">
                        <button class="save-btn" @click="onManageLink('MOVE', currentEditLink.oldGroupTitle, currentEditLink.originalItem, currentEditLink.originalIndex)" :disabled="isSaving">
                            <Icon v-if="isSaving" icon="ri:loader-4-line" class="spinner-sm" />
                            <span v-else>保存修改/移动</span>
                        </button>
                        <button class="action-btn cancel" @click="currentEditLink = null" :disabled="isSaving">
                            取消
                        </button>
                      </div>
                  </div>
                </Transition>
                <p v-if="saveMessage" :class="['message', isSaving ? 'info' : 'error']">
                    {{ saveMessage }}
                </p>
                <p v-if="successCommitUrl" class="message success">
                    ✅ 操作成功，自动部署中。<a :href="successCommitUrl" target="_blank">查看提交</a>
                </p>
            </div>

            <div v-else-if="currentView === 'add-link'" :key="'add-link'" class="add-form-container">
              <h3 class="form-title">添加新链接 (多行模式)</h3>
              
              <div class="form-item">
                <label>选择分组 *</label>
                <select v-model="selectedGroupTitle" class="glass-input high-contrast-select">
                  <option v-for="(group, index) in categoryList" :key="index" :value="group.title">{{ group.title }}</option>
                </select>
              </div>

              <div class="dynamic-rows">
                <div v-for="(link, index) in newLinks" :key="index" class="link-row-card glass-card-sm">
                  <div class="row-header">
                    <span class="row-label">链接 #{{ index + 1 }}</span>
                    <button v-if="newLinks.length > 1" class="delete-btn" @click="removeLinkRow(index)" title="删除此行">
                      <Icon icon="ri:close-line" />
                    </button>
                  </div>
                  
                  <div class="row-inputs-flex">
                    <div class="input-col name">
                      <input type="text" v-model="link.name" class="glass-input" placeholder="名称" />
                    </div>
                    <div class="input-col url">
                      <input type="url" v-model="link.url" class="glass-input" placeholder="URL (https://...)" @input="detectIcon(link)" />
                    </div>
                    <div class="input-col icon">
                      <div class="icon-input-wrapper">
                        <input type="text" v-model="link.icon" class="glass-input" placeholder="图标 (自动识别)" />
                        <div class="icon-preview-box" v-if="link.icon">
                            <Icon v-if="!isUrl(link.icon)" :icon="link.icon" width="18" />
                            <img v-else :src="link.icon" class="favicon-img" width="18" height="18" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="form-actions">
                <button class="action-btn add-row" @click="addLinkRow">
                  <Icon icon="ri:add-line" /> 添加更多
                </button>
                <button class="action-btn save" @click="onSubmitLinks" :disabled="isSaving || !selectedGroupTitle">
                  <Icon v-if="isSaving" icon="ri:loader-4-line" class="spinner-sm" />
                  <span v-else>全部提交 ({{ validLinksCount }})</span>
                </button>
              </div>

              <p v-if="saveMessage" :class="['message', isSaving ? 'info' : 'error']">{{ saveMessage }}</p>
              <p v-if="successCommitUrl" class="message success">
                  ✅ 提交成功，自动部署中。<a :href="successCommitUrl" target="_blank">查看提交</a>
              </p>
            </div>

            <div v-else-if="currentView === 'add-folder'" class="add-form-container">
               <h3 class="form-title">添加新文件夹</h3>
               <div class="form-item"><label>文件夹名称</label><input type="text" v-model="newFolder.title" class="glass-input" placeholder="例如：我的项目" /></div>
               <div class="form-item"><label>图标 (Iconify)</label><input type="text" v-model="newFolder.icon" class="glass-input" placeholder="例如：ri:folder-3-line" /></div>
               <div class="form-actions"><button class="action-btn save" @click="onSubmitNewFolder" :disabled="isSaving">提交</button></div>
               <p v-if="saveMessage" :class="['message', isSaving ? 'info' : 'error']">{{ saveMessage }}</p>
               <p v-if="successCommitUrl" class="message success">✅ 创建成功，<a :href="successCommitUrl" target="_blank">查看提交</a></p>
            </div>

          </Transition>
          <div v-if="!contentReady && currentView !== 'add-link' && currentView !== 'add-folder' && currentView !== 'manage-links'" class="loading-placeholder">
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
const currentView = ref('nav'); 
const keyword = ref('');
const currentEngine = ref(searchEngines[0]);
const showEngineList = ref(false);
const isFocused = ref(false);
const categoryList = ref(JSON.parse(JSON.stringify(navData)));

const newLinks = ref([{ name: '', url: '', icon: 'ri:link' }]);
const selectedGroupTitle = ref(navData[0]?.title || ''); 
const newFolder = ref({ title: '', icon: 'ri:folder-line' });
const currentEditLink = ref(null);
const successCommitUrl = ref('');
const isSaving = ref(false);
const saveMessage = ref('');

const isUrl = (str) => str && (str.startsWith('http://') || str.startsWith('https://'));
const validLinksCount = computed(() => newLinks.value.filter(l => l.name && l.url).length);

const detectIcon = (link) => {
    if (!link.url.startsWith('http') || link.url.length < 8) return;
    try {
        const domain = new URL(link.url).hostname;
        const fav = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
        const img = new Image();
        img.src = fav;
        img.onload = () => { link.icon = fav; };
    } catch(e) {}
};

const addLinkRow = () => {
    newLinks.value.push({ name: '', url: '', icon: 'ri:link' });
    nextTick(() => {
        const container = document.querySelector('.dynamic-rows');
        if(container) container.scrollTop = container.scrollHeight;
    });
};
const removeLinkRow = (idx) => newLinks.value.splice(idx, 1);

const onSubmitLinks = async () => {
    const validLinks = newLinks.value.filter(l => l.name && l.url);
    if (validLinks.length === 0) return;
    isSaving.value = true;
    saveMessage.value = '正在提交...';
    successCommitUrl.value = '';
    try {
        const res = await fetch('/api/add-link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ links: validLinks, groupTitle: selectedGroupTitle.value })
        });
        const data = await res.json();
        if (res.ok) {
            saveMessage.value = data.message;
            successCommitUrl.value = data.commit_url;
            setTimeout(() => { newLinks.value = [{ name: '', url: '', icon: 'ri:link' }]; saveMessage.value = ''; }, 2000);
        } else {
            saveMessage.value = `❌ 错误: ${data.message}`;
        }
    } catch (e) { saveMessage.value = `网络错误: ${e.message}`; } finally { isSaving.value = false; }
};

const onSubmitNewFolder = async () => {
    if (!newFolder.value.title) return;
    isSaving.value = true;
    successCommitUrl.value = '';
    try {
        const res = await fetch('/api/add-group', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newFolder.value)
        });
        const data = await res.json();
        if (res.ok) {
            saveMessage.value = data.message;
            successCommitUrl.value = data.commit_url;
            setTimeout(() => { window.location.reload(); }, 2500);
        } else {
            saveMessage.value = `错误: ${data.message}`;
        }
    } catch (e) { saveMessage.value = `网络错误: ${e.message}`; } finally { isSaving.value = false; }
};

const startEdit = (groupTitle, item, index) => {
    currentEditLink.value = {
        originalItem: item, originalIndex: index, oldGroupTitle: groupTitle,
        name: item.name, url: item.url, icon: item.icon, newGroupTitle: groupTitle, 
    };
};

const onManageLink = async (action, groupTitle, item, index) => {
    isSaving.value = true;
    successCommitUrl.value = '';
    saveMessage.value = action === 'DELETE' ? '正在删除...' : '正在保存...';
    let payload = { action: action, oldGroupTitle: groupTitle, originalIndex: index, originalUrl: item.url };
    if (action === 'MOVE') {
        payload.newGroupTitle = currentEditLink.value.newGroupTitle;
        payload.newLink = { name: currentEditLink.value.name, url: currentEditLink.value.url, icon: currentEditLink.value.icon };
    }
    try {
        const response = await fetch('/api/manage-link', { 
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (response.ok) {
            saveMessage.value = data.message;
            successCommitUrl.value = data.commit_url;
            setTimeout(() => { window.location.reload(); }, 2500); 
        } else {
            saveMessage.value = `❌ 错误: ${data.message}`; 
            currentEditLink.value = null; 
        }
    } catch (error) { saveMessage.value = `网络错误: ${error.message}`; } finally { isSaving.value = false; }
};

watch(() => store.navOpenState, (val) => { 
    if(val) { contentReady.value = false; setTimeout(()=> contentReady.value = true, 300); }
    else { successCommitUrl.value = ''; saveMessage.value = ''; currentView.value = 'nav'; }
});
watch(currentView, () => {
    newLinks.value = [{ name: '', url: '', icon: 'ri:link' }];
    newFolder.value = { title: '', icon: 'ri:folder-line' };
    currentEditLink.value = null; saveMessage.value = ''; successCommitUrl.value = '';
    contentReady.value = false; setTimeout(()=> contentReady.value = true, 300);
});
onMounted(() => {
  document.addEventListener('click', () => { showEngineList.value = false; });
  if (!selectedGroupTitle.value && categoryList.value.length > 0) selectedGroupTitle.value = categoryList.value[0].title;
});
const close = () => store.navOpenState = false;
const toggleEngineList = () => showEngineList.value = !showEngineList.value;
const switchEngine = (eng) => currentEngine.value = eng;
const onSearch = () => { if (keyword.value.trim()) window.open(currentEngine.value.url + encodeURIComponent(keyword.value), '_blank'); };
const toggleGroup = (g) => g.collapsed = !g.collapsed;
</script>

<style scoped lang="scss">
/* 基础布局 */
.nav-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 2000; display: flex; justify-content: center; align-items: center; padding: 20px; }
.modal-content { width: 100%; max-width: 850px; height: 80vh; background: rgba(30,30,30,0.85); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.15); border-radius: 16px; display: grid; grid-template-rows: auto 1fr; overflow: hidden; }

/* 头部 Tab */
.header-tabs { grid-row: 1; display: flex; gap: 10px; padding: 15px; background: rgba(255,255,255,0.05); overflow-x: auto; }
.tab-item { padding: 6px 12px; border-radius: 6px; color: #bbb; cursor: pointer; display: flex; gap: 5px; align-items: center; font-size: 0.9rem; transition: 0.2s; white-space: nowrap; }
.tab-item.active { background: rgba(255,255,255,0.15); color: #fff; font-weight: bold; }
.close-btn { position: absolute; top: 12px; right: 15px; background: none; border: none; color: rgba(255,255,255,0.5); cursor: pointer; z-index: 50; &:hover { color: #fff; } }

/* 搜索框 */
.search-box-wrapper { padding: 15px 25px; background: rgba(255,255,255,0.02); }
.search-box { display: flex; align-items: center; background: rgba(0,0,0,0.3); border-radius: 8px; padding: 0 10px; border: 1px solid rgba(255,255,255,0.1); transition: 0.3s; }
.search-box.focused { border-color: #4facfe; background: rgba(0,0,0,0.5); }
.search-input { flex: 1; background: transparent; border: none; color: #fff; padding: 10px; outline: none; &::placeholder { color: rgba(255,255,255,0.7); } }
.engine-switch { position: relative; cursor: pointer; display: flex; align-items: center; gap: 5px; color: #ddd; padding-right: 10px; border-right: 1px solid rgba(255,255,255,0.1); }
.engine-dropdown { position: absolute; top: 35px; left: 0; background: #333; border-radius: 6px; padding: 5px; width: 120px; z-index: 100; border: 1px solid rgba(255,255,255,0.1); }
.engine-item { padding: 8px; display: flex; gap: 8px; align-items: center; cursor: pointer; &:hover { background: rgba(255,255,255,0.1); } }
.search-btn { width: 36px; display: flex; justify-content: center; background: none; border: none; color: #eee; cursor: pointer; &:disabled { opacity: 0.3; } }

/* 统一输入框样式：深色毛玻璃 + 白字 */
.glass-input {
  width: 100%; padding: 10px 12px; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 6px;
  color: #fff; font-size: 0.95rem; outline: none; transition: 0.3s;
  &::placeholder { color: rgba(255,255,255,0.5); } 
  &:focus { border-color: #4facfe; background: rgba(0, 0, 0, 0.6); }
}
.high-contrast-select {
  appearance: none; -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white' width='24' height='24'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 10px center;
  option { background-color: #333; color: #fff; } /* 强制深底白字 */
}

/* 动态行样式 (Add Link) */
.dynamic-rows { max-height: 400px; overflow-y: auto; padding-right: 5px; margin-bottom: 20px; }
.link-row-card {
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px; padding: 15px; margin-bottom: 15px; position: relative;
  .row-header { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 0.85rem; opacity: 0.6; }
  .delete-btn { background: none; border: none; color: #ff4d4f; cursor: pointer; opacity: 0.7; transition: 0.2s; &:hover { opacity: 1; transform: scale(1.1); } }
  
  .row-inputs-flex {
      display: flex; gap: 15px; align-items: flex-start; flex-wrap: wrap;
      .input-col {
          flex: 1; min-width: 150px;
          &.name { flex: 1; }
          &.url { flex: 2; }
          &.icon { flex: 1; }
      }
      .icon-input-wrapper {
          position: relative;
          input { padding-right: 35px; }
          .icon-preview-box { position: absolute; right: 8px; top: 10px; pointer-events: none; color: #fff; }
      }
  }
}

.add-form-container { padding: 20px 25px; color: #fff; max-width: 800px; margin: 0 auto; }
.form-title { font-size: 1.1rem; margin-bottom: 20px; color: rgba(255,255,255,0.9); }
.form-item { margin-bottom: 15px; label { display: block; margin-bottom: 8px; font-size: 0.95rem; color: #ccc; } }
.form-actions { display: flex; gap: 15px; margin-top: 25px; }
.action-btn {
  flex: 1; padding: 14px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 5px; transition: 0.2s; font-size: 1rem;
  &.save { background: #4facfe; color: #fff; &:hover { background: #3099f1; } &:disabled { opacity: 0.6; cursor: not-allowed; } }
  &.add-row { background: rgba(255,255,255,0.1); color: #fff; &:hover { background: rgba(255,255,255,0.2); } }
  &.edit { background: #4facfe; color: #fff; } &.delete { background: #ff4d4f; color: #fff; } &.cancel { background: rgba(255, 255, 255, 0.1); color: #fff; &:hover { background: rgba(255, 255, 255, 0.2); } }
}
.message { margin-top: 20px; padding: 15px; border-radius: 8px; font-size: 0.95rem; word-break: break-all; &.info { color: #ffd700; background: rgba(255,215,0,0.15); } &.error { color: #ff4d4f; background: rgba(255,0,0,0.15); } &.success { color: #76ff7a; background: rgba(30,200,30,0.2); a { color: inherit; border-bottom: 1px solid; } } }

/* 滚动区域 */
.scroll-area { grid-row: 2; overflow-y: auto; padding-bottom: 30px; }
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

/* 导航卡片 */
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

/* 🚀 管理列表 (优化版) */
.manage-container { padding: 20px 30px; }

/* 分组头部 - 可点击折叠 */
.group-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 15px 0 10px 0; 
    border-bottom: 1px solid rgba(255,255,255,0.1); 
    cursor: pointer; user-select: none;
    margin-top: 10px; margin-bottom: 10px;
    opacity: 0.9; transition: opacity 0.2s;
    &:hover { opacity: 1; }
}
.group-title-text { font-size: 1.1rem; color: #fff; font-weight: 500; }
.group-header .arrow { transition: transform 0.3s ease; color: rgba(255,255,255,0.6); }
.group-header .arrow.rotated { transform: rotate(-90deg); }

/* 折叠容器动画 */
.group-list-wrapper {
    display: grid;
    grid-template-rows: 1fr;
    transition: grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.group-list-wrapper.is-collapsed {
    grid-template-rows: 0fr;
}
.group-list-inner {
    overflow: hidden;
}

.link-item-manage { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    padding: 12px 15px;
    margin-bottom: 10px; 
    background: rgba(255, 255, 255, 0.03); 
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 8px; 
    transition: background 0.2s;
    
    &:hover { background: rgba(255, 255, 255, 0.08); }

    .item-left-wrapper {
        display: flex; align-items: center; gap: 15px; overflow: hidden; flex: 1;
    }

    .manage-icon-box {
        width: 36px; height: 36px;
        background: rgba(0,0,0,0.25);
        border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
        color: #ddd;
    }
    .manage-favicon { width: 20px; height: 20px; object-fit: contain; border-radius: 4px; }

    .link-info { 
        display: flex; flex-direction: column; overflow: hidden; flex: 1;
        .link-name { font-weight: 500; font-size: 0.95rem; color: #fff; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } 
        .link-url { font-size: 0.8rem; color: rgba(255,255,255,0.5); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } 
    }
    .actions { 
        display: flex; gap: 8px; margin-left: 10px;
        .action-btn.icon-only { 
            padding: 8px; width: 34px; height: 34px; 
            border-radius: 6px; 
            display: flex; align-items: center; justify-content: center;
            background: rgba(255,255,255,0.1); 
            color: #ddd;
            &:hover { background: #4facfe; color: #fff; }
            &.delete:hover { background: #ff4d4f; }
        } 
    }
}

.edit-form-wrapper { padding: 10px 0; } /* 确保编辑模式也有内边距 */

@media (max-width: 768px) {
  .modal-content { height: 95vh; width: 98%; }
  .header-tabs { gap: 8px; padding: 10px; }
  .tab-item { padding: 6px 10px; font-size: 0.85rem; }
  .link-item-manage { flex-direction: column; align-items: flex-start; gap: 8px; .actions { width: 100%; justify-content: flex-end; } }
  .link-row-card .row-inputs-flex { flex-direction: column; gap: 12px; }
}
</style>