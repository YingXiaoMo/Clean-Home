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
            <Icon icon="ri:add-line" /> 批量添加
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
          <Transition name="fade-content" mode="out-in">
            <div v-if="currentView === 'search' || currentView === 'nav'" :key="'search-nav'">
              
              <div class="search-box-wrapper" v-if="currentView === 'search'">
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
                                <Icon v-if="!isUrl(item.icon)" :icon="item.icon || 'ri:link'" width="22" height="22" />
                                <img v-else :src="item.icon" alt="Favicon" width="22" height="22" class="favicon-img" />
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

            <div v-else-if="currentView === 'add-link'" :key="'add-link'" class="add-form-container">
              <h3 class="form-title">批量添加链接（提交后 Cloudflare Pages 会自动部署）</h3>
              
              <div class="form-item">
                <label for="group">分组 (Category) *</label>
                <select id="group" v-model="selectedGroupTitle" class="high-contrast-select">
                  <option 
                    v-for="(group, index) in categoryList" 
                    :key="index" 
                    :value="group.title"
                  >
                    {{ group.title }}
                  </option>
                </select>
              </div>

              <div class="form-item bulk-input">
                <label for="bulk-links">
                  批量添加链接 (格式: **名称 | URL | IconCode/URL**) *
                  <span class="auto-tip" v-if="parsedLinks.length > 0">（已解析 {{ parsedLinks.length }} 个有效链接）</span>
                  <span class="auto-tip error" v-if="bulkError">{{ bulkError }}</span>
                </label>
                <textarea 
                  id="bulk-links" 
                  v-model="bulkInput" 
                  rows="8" 
                  placeholder="每行输入一个链接，例如：&#10;Google | https://google.com | ri:google-fill&#10;Bing | https://bing.com | https://icons.duckduckgo.com/ip3/bing.com.ico"
                ></textarea>
              </div>

              <div class="form-actions">
                <button 
                  class="save-btn" 
                  @click="onSubmitNewLink"
                  :disabled="parsedLinks.length === 0 || isSaving || !selectedGroupTitle"
                >
                  <Icon v-if="isSaving" icon="ri:loader-4-line" class="spinner-sm" />
                  <span v-else>批量添加到 {{ selectedGroupTitle }} ({{ parsedLinks.length }} 条)</span>
                </button>
              </div>

              <p v-if="saveMessage" :class="['message', isSaving ? 'info' : 'error']">
                  {{ saveMessage }}
              </p>
            </div>


            <div v-else-if="currentView === 'add-folder'" :key="'add-folder'" class="add-form-container">
              <h3 class="form-title">添加新文件夹（将插入到导航列表末尾）</h3>
              
              <div class="form-item">
                <label for="folder-title">文件夹名称 (Title) *</label>
                <input id="folder-title" type="text" v-model="newFolder.title" placeholder="例如：我的项目" />
              </div>

              <div class="form-item">
                <label for="folder-icon">图标 (Iconify Code)</label>
                <input id="folder-icon" type="text" v-model="newFolder.icon" placeholder="例如：ri:box-3-line" />
                <span v-if="newFolder.icon" class="icon-preview"><Icon :icon="newFolder.icon" width="24" /></span>
              </div>

              <div class="form-actions">
                <button 
                  class="save-btn" 
                  @click="onSubmitNewFolder"
                  :disabled="!newFolder.title || isSaving"
                >
                  <Icon v-if="isSaving" icon="ri:loader-4-line" class="spinner-sm" />
                  <span v-else>创建文件夹</span>
                </button>
              </div>
              
              <p v-if="saveMessage" :class="['message', isSaving ? 'info' : 'error']">
                  {{ saveMessage }}
              </p>
            </div>
            
            <div v-else-if="currentView === 'manage-links'" :key="'manage-links'" class="manage-container">
                <h3 class="form-title">管理现有链接</h3>
                
                <Transition name="fade-content" mode="out-in">
                  <div v-if="!currentEditLink" :key="'list'">
                    <div class="manage-group" v-for="group in categoryList" :key="group.title">
                      <h4 class="group-title">{{ group.title }} ({{ group.items.length }})</h4>
                      <div class="link-item-manage" v-for="(item, idx) in group.items" :key="item.url">
                        <div class="link-info">
                            <span class="link-name">{{ item.name }}</span>
                            <span class="link-url">{{ item.url }}</span>
                        </div>
                        <div class="actions">
                            <button class="action-btn edit" @click="startEdit(group.title, item, idx)">
                                <Icon icon="ri:pencil-line" /> 编辑/移动
                            </button>
                            <button class="action-btn delete" @click="onManageLink('DELETE', group.title, item, idx)">
                                <Icon icon="ri:delete-bin-line" /> 删除
                            </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div v-else :key="'edit-form'" class="edit-form-wrapper">
                      <h4 class="form-title">编辑链接：{{ currentEditLink.name }}</h4>
                      <div class="form-item">
                        <label>名称 (Name) *</label>
                        <input type="text" v-model="currentEditLink.name" />
                      </div>
                      <div class="form-item">
                        <label>链接 (URL) *</label>
                        <input type="url" v-model="currentEditLink.url" />
                      </div>
                      <div class="form-item">
                        <label>图标 (Iconify Code / URL)</label>
                        <input type="text" v-model="currentEditLink.icon" />
                        <span v-if="currentEditLink.icon" class="icon-preview">
                            <Icon v-if="!isUrl(currentEditLink.icon)" :icon="currentEditLink.icon" width="24" />
                            <img v-else :src="currentEditLink.icon" alt="Icon Preview" width="24" height="24" class="favicon-img" />
                        </span>
                      </div>
                      
                      <div class="form-item">
                        <label>目标分组 (Move To) *</label>
                        <select v-model="currentEditLink.newGroupTitle" class="high-contrast-select">
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
                    ✅ 提交成功，请稍等自动部署。您可以 <a :href="successCommitUrl" target="_blank">查看 Git 提交详情</a>。
                </p>
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

// 搜索相关状态
const keyword = ref('');
const currentEngine = ref(searchEngines[0]);
const showEngineList = ref(false);
const isFocused = ref(false);

// 批量添加链接状态
const bulkInput = ref('');
const bulkError = ref('');

// 添加文件夹相关状态
const newFolder = ref({ title: '', icon: 'ri:folder-line' });

// 管理链接状态
const currentEditLink = ref(null);
const successCommitUrl = ref('');

// 通用状态
const selectedGroupTitle = ref(navData[0]?.title || ''); 
const isSaving = ref(false);
const saveMessage = ref('');


// 链接分类数据 (使用深拷贝，防止直接修改 navData 影响原始配置)
const categoryList = ref(JSON.parse(JSON.stringify(navData)));

// 工具函数：判断字符串是否为 URL
const isUrl = (str) => {
  return str.startsWith('http://') || str.startsWith('https://') || str.startsWith('//');
};

// 🌟 核心逻辑：解析批量输入的链接
const parsedLinks = computed(() => {
  const lines = bulkInput.value.trim().split('\n').filter(line => line.trim() !== '');
  const links = [];
  bulkError.value = '';

  for (const line of lines) {
    const parts = line.split('|').map(part => part.trim());
    
    if (parts.length < 2) {
      bulkError.value = '格式错误：每行至少需要 [名称 | URL]';
      return [];
    }

    const [name, url, icon = 'ri:link'] = parts;

    if (!url.startsWith('http')) {
      bulkError.value = 'URL 必须以 http:// 或 https:// 开头';
      return [];
    }

    links.push({
      name,
      url,
      icon: icon.trim() || 'ri:link'
    });
  }
  return links;
});


// 弹窗开关监听
watch(() => store.navOpenState, (isOpen) => {
  if (isOpen) {
    contentReady.value = false;
    setTimeout(() => { contentReady.value = true; }, 300);
    // 每次打开弹窗时，确保清空旧的成功信息
    successCommitUrl.value = ''; 
    saveMessage.value = '';
  } else {
    contentReady.value = false;
    showEngineList.value = false;
    keyword.value = '';
    currentView.value = 'nav';
  }
});

// 切换视图时，重置状态
watch(currentView, (newView) => {
  // 确保在切换到列表或搜索视图时，内容延迟加载动画会触发
  if (newView !== 'add-link' && newView !== 'add-folder' && newView !== 'manage-links') {
    contentReady.value = false;
    setTimeout(() => { contentReady.value = true; }, 300);
  } else {
    // 重置表单状态
    bulkInput.value = '';
    newFolder.value = { title: '', icon: 'ri:folder-line' };
    currentEditLink.value = null; // 清除编辑状态
    saveMessage.value = ''; // 清空错误信息
    bulkError.value = '';
  }
});


// 提交新链接（批量处理）
const onSubmitNewLink = async () => {
  if (parsedLinks.value.length === 0 || !selectedGroupTitle.value) return;

  isSaving.value = true;
  saveMessage.value = `正在提交 ${parsedLinks.value.length} 个链接至 GitHub API... (请等待自动部署)`;
  successCommitUrl.value = '';
  
  try {
    const payload = {
      links: parsedLinks.value, 
      groupTitle: selectedGroupTitle.value,
    };

    const response = await fetch('/api/add-link', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json(); 

    if (response.ok) { 
        saveMessage.value = data.message || `批量添加链接成功！共 ${parsedLinks.value.length} 条。`;
        // 🚀 获取 Commit URL 实现“直接访问”
        successCommitUrl.value = data.commit_url || '';
        
        setTimeout(() => {
            bulkInput.value = '';
            saveMessage.value = '';
            // 不自动切换视图，让用户看到成功信息和 Commit URL
        }, 300);
        
    } else {
        saveMessage.value = `❌ 错误 (${response.status}): ${data.message}`; 
    }
    
  } catch (error) {
    saveMessage.value = `网络连接或数据解析错误: ${error.message}`;
  } finally {
    isSaving.value = false;
  }
};

// 提交新文件夹
const onSubmitNewFolder = async () => {
  if (!newFolder.value.title.trim()) return;

  isSaving.value = true;
  saveMessage.value = '正在提交新文件夹至 GitHub API...';
  successCommitUrl.value = '';

  try {
    const payload = {
      title: newFolder.value.title,
      icon: newFolder.value.icon, 
    };

    const response = await fetch('/api/add-group', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok) {
        saveMessage.value = data.message || '文件夹添加成功！请等待部署完成。';
        // 🚀 获取 Commit URL 实现“直接访问”
        successCommitUrl.value = data.commit_url || '';
        
        // 成功后清空表单并刷新页面，以便重新拉取 navData
        setTimeout(() => {
            newFolder.value = { title: '', icon: 'ri:folder-line' };
            saveMessage.value = '';
            window.location.reload(); 
        }, 2500);
        
    } else {
        saveMessage.value = `❌ 错误 (${response.status}): ${data.message}`; 
    }
    
  } catch (error) {
    saveMessage.value = `网络连接或数据解析错误: ${error.message}`;
  } finally {
    isSaving.value = false;
  }
};

// 启动编辑模式
const startEdit = (groupTitle, item, index) => {
    currentEditLink.value = {
        // 原始信息，用于定位旧链接
        originalItem: item,
        originalIndex: index,
        oldGroupTitle: groupTitle,
        // 编辑字段
        name: item.name,
        url: item.url,
        icon: item.icon,
        // 目标分组（用于移动）
        newGroupTitle: groupTitle, 
    };
};

// 删除或移动链接
const onManageLink = async (action, groupTitle, item, index) => {
    isSaving.value = true;
    successCommitUrl.value = '';
    saveMessage.value = action === 'DELETE' ? '正在删除链接...' : '正在保存/移动链接...';
    
    // 构建 payload
    let payload = {
        action: action, // DELETE 或 MOVE
        oldGroupTitle: groupTitle,
        originalIndex: index,
        originalUrl: item.url, // 用URL作为唯一标识符（尽管有index，但URL更稳）
    };
    
    if (action === 'MOVE') {
        payload.newGroupTitle = currentEditLink.value.newGroupTitle;
        payload.newLink = {
            name: currentEditLink.value.name,
            url: currentEditLink.value.url,
            icon: currentEditLink.value.icon,
        };
        // 如果没有移动，且链接没有变化，则取消提交
        if (payload.oldGroupTitle === payload.newGroupTitle && 
            payload.originalItem.name === payload.newLink.name &&
            payload.originalItem.url === payload.newLink.url &&
            payload.originalItem.icon === payload.newLink.icon) {
                isSaving.value = false;
                saveMessage.value = '未检测到任何修改。';
                currentEditLink.value = null;
                return;
            }
    }

    try {
        const response = await fetch('/api/manage-link', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok) {
            saveMessage.value = data.message || '操作成功，请等待部署完成。';
            successCommitUrl.value = data.commit_url || '';
            
            // 成功后强制刷新页面以加载新的 navData
            setTimeout(() => { window.location.reload(); }, 2500); 
            
        } else {
            saveMessage.value = `❌ 错误 (${response.status}): ${data.message}`; 
            currentEditLink.value = null; // 失败时退出编辑状态
        }

    } catch (error) {
        saveMessage.value = `网络连接或数据解析错误: ${error.message}`;
    } finally {
        isSaving.value = false;
    }
};

onMounted(() => {
  // 保持事件监听和初始状态检查
  document.addEventListener('click', () => { showEngineList.value = false; });
  if (!selectedGroupTitle.value && categoryList.value.length > 0) {
     selectedGroupTitle.value = categoryList.value[0].title;
  }
});

const close = () => { store.navOpenState = false; };

const toggleEngineList = () => { showEngineList.value = !showEngineList.value; };
const switchEngine = (eng) => { currentEngine.value = eng; showEngineList.value = false; if (searchInputRef.value) searchInputRef.value.focus(); };
const onSearch = () => {
  if (!keyword.value.trim()) return;
  const targetUrl = currentEngine.value.url + encodeURIComponent(keyword.value);
  window.open(targetUrl, '_blank');
};
const toggleGroup = (group) => { group.collapsed = !group.collapsed; };
</script>

<style scoped lang="scss">
/* --- 样式保持不变，新增管理界面和表单项样式 --- */
.nav-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); z-index: 2000; display: flex; justify-content: center; align-items: center; padding: 20px; }
.modal-content { width: 100%; max-width: 850px; height: 80vh; background: rgba(30, 30, 30, 0.85); contain: content; border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 16px; display: grid; grid-template-rows: auto 1fr; overflow: hidden; box-shadow: 0 25px 50px rgba(0,0,0,0.5); transform: translateZ(0); }

.header-tabs {
  grid-row: 1; display: flex; justify-content: center; align-items: center; gap: 10px; padding: 10px 15px; background: rgba(255, 255, 255, 0.05); border-bottom: 1px solid rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.6); z-index: 30;
  flex-wrap: wrap; 
  .tab-item {
    display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 6px; font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: all 0.2s;
    &:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }
    &.active { background: rgba(255, 255, 255, 0.2); color: #fff; font-weight: bold; }
  }
}

.search-box-wrapper {
  padding: 20px 24px; background: rgba(255, 255, 255, 0.03); border-bottom: 1px solid rgba(255, 255, 255, 0.1); display: flex; justify-content: center; align-items: center;
}

.close-btn {
  position: absolute; top: 10px; right: 15px; background: none; border: none; padding: 0; color: rgba(255,255,255,0.5); cursor: pointer; transition: all 0.3s; z-index: 40;
  &:hover { color: #fff; transform: rotate(90deg); }
}

.search-box {
  width: 100%; max-width: 500px; height: 46px; background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; display: flex;
  align-items: center; padding: 0 6px; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); position: relative;

  &.focused { background: rgba(0, 0, 0, 0.4); border-color: rgba(255, 255, 255, 0.3); box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1); }
}
.engine-switch { display: flex; align-items: center; justify-content: center; gap: 4px; height: 34px; padding: 0 8px; margin-right: 5px; border-radius: 6px; cursor: pointer; color: #ddd; transition: 0.2s; position: relative;
  &:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }
  .arrow { opacity: 0.6; transition: transform 0.3s; }
  .arrow.rotate { transform: rotate(180deg); }
}

.search-input { flex: 1; background: transparent; border: none; outline: none; color: #fff; font-size: 1rem; height: 100%; padding: 0 10px; &::placeholder { color: rgba(255, 255, 255, 0.3); } }
.search-btn {
  width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: rgba(255, 255, 255, 0.1); border: none; border-radius: 8px; color: #eee; cursor: pointer; transition: 0.2s;
  &:hover:not(:disabled) { background: rgba(255, 255, 255, 0.25); color: #fff; }
  &:active:not(:disabled) { transform: scale(0.95); }
  &:disabled { opacity: 0.3; cursor: not-allowed; }
}

.scroll-area {
  grid-row: 2; overflow-y: auto; padding: 0 24px 20px 24px; position: relative; scroll-behavior: smooth;
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
  &::-webkit-scrollbar-track { background: transparent; }
}

.loading-placeholder { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: rgba(255,255,255,0.5); .spinner { animation: spin 1s linear infinite; } }

/* 文件夹样式 */
.folder-group { /* ... 保持不变 ... */ }

.folder-wrapper { display: grid; grid-template-rows: 1fr; transition: grid-template-rows 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); will-change: grid-template-rows; }
.folder-wrapper.wrapper-closed { grid-template-rows: 0fr; }
.folder-inner { overflow: hidden; min-height: 0; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 12px; padding: 20px; padding-top: 5px; }

.nav-item { /* ... 保持不变 ... */
  .icon-box { 
    .favicon-img { border-radius: 4px; object-fit: contain; }
  }
}

/* --- 表单区域通用样式 --- */
.add-form-container, .manage-container {
  padding: 20px 0; color: #fff; max-width: 500px; margin: 0 auto;
  .form-title { font-size: 1.1rem; font-weight: bold; margin-bottom: 20px; color: rgba(255, 255, 255, 0.9); }
  
  .form-item {
    margin-bottom: 20px;
    position: relative;

    label { display: block; font-size: 0.9rem; color: rgba(255, 255, 255, 0.7); margin-bottom: 5px; font-weight: 500; }
    input, select, textarea {
      width: 100%; padding: 12px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px; color: #fff; font-size: 1rem; outline: none; transition: border-color 0.2s;
      -webkit-appearance: none; appearance: none;
      color: #fff; 
      
      &:focus { border-color: #4facfe; }
    }
    select {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24'%3E%3Cpath fill='white' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: right 10px top 50%; padding-right: 30px;
    }
    textarea { resize: vertical; line-height: 1.4; }
    
    .icon-preview {
        position: absolute; top: 32px; right: 10px; display: inline-flex; align-items: center; justify-content: center;
        padding: 5px; background: rgba(0, 0, 0, 0.5); border-radius: 50%; color: #fff; border: 1px solid rgba(255,255,255,0.1);
        .favicon-img { border-radius: 4px; }
    }
    .auto-tip { display: block; margin-top: 5px; font-size: 0.8rem; color: #a0f0a0; }
    .error { color: #ff4d4f; }
  }

  .form-actions {
    margin-top: 30px;
    display: flex;
    gap: 10px;
  }
  
  .save-btn {
    flex: 1;
    padding: 15px; background: #4facfe; color: #fff; border: none; border-radius: 8px;
    font-size: 1rem; font-weight: bold; cursor: pointer; transition: all 0.3s; display: flex;
    justify-content: center; align-items: center; gap: 10px;
    
    &.cancel { background: rgba(255, 255, 255, 0.1); }
  }
  
  .message { /* ... 保持不变 ... */ }
  .message.success { 
      background: rgba(30, 200, 30, 0.2); 
      color: #76ff7a; 
      border: 1px solid rgba(30, 200, 30, 0.4);
      a { color: #fff; font-weight: bold; text-decoration: none; border-bottom: 1px solid; }
  }
}

/* --- 链接管理视图样式 --- */
.manage-container {
    padding: 20px 0;
    .group-title {
        font-size: 1.1rem;
        color: #fff;
        opacity: 0.8;
        margin-bottom: 10px;
        padding-top: 10px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
    }
}

.link-item-manage {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    margin-bottom: 8px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;

    .link-info {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        
        .link-name { font-weight: bold; font-size: 1rem; color: #fff; }
        .link-url { font-size: 0.8rem; color: #ccc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    }

    .actions {
        display: flex;
        gap: 10px;
        
        .action-btn {
            background: none; border: none; padding: 6px 10px; border-radius: 6px;
            cursor: pointer; transition: 0.2s; font-size: 0.9rem;
            
            &.edit { background: #4facfe; color: #fff; }
            &.delete { background: #ff4d4f; color: #fff; }
            
            &:hover { opacity: 0.8; }
        }
    }
}

.edit-form-wrapper {
    padding: 10px 0;
}


/* --- 动画 (保持不变) --- */
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
  .header-tabs { gap: 8px; }
  .tab-item { padding: 6px 8px; font-size: 0.8rem; }
  .link-item-manage { flex-direction: column; align-items: flex-start; gap: 8px; 
    .actions { width: 100%; justify-content: flex-end; }
  }
}
</style>