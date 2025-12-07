<template>
  <div class="admin-container">
    <div v-if="!isAuthenticated" class="login-box glass-card">
      <h2>后台管理登录</h2>
      <input type="password" v-model="password" placeholder="请输入管理员密码" @keyup.enter="login" class="glass-input">
      <button @click="login" class="login-btn" :disabled="isLoggingIn">
          <Icon v-if="isLoggingIn" icon="ri:loader-4-line" class="spinner-sm" />
          <span v-else>登录</span>
      </button>
      <p v-if="error" class="error-msg">{{ error }}</p>
    </div>

    <div v-else class="dashboard">
      <input type="file" ref="fileInput" @change="handleFileUpload" style="display: none;" accept="image/*" />
      <div class="dashboard-header">
        <h2 style="color:white;">网站内容管理</h2>
        <div class="header-actions">
           <a href="/" target="_blank" class="preview-btn"><Icon icon="ri:external-link-line" /> 访问前台</a>
           <button @click="logout" class="logout-btn"><Icon icon="ri:logout-box-r-line" /> 退出登录</button>
        </div>
      </div>
      
      <div class="management-ui glass-card-large">
        <div class="tabs">
          <button :class="{ active: currentTab === 'manage' }" @click="currentTab = 'manage'">
             <Icon icon="ri:edit-2-line" /> 管理链接
          </button>
          <button :class="{ active: currentTab === 'add' }" @click="currentTab = 'add'">
             <Icon icon="ri:add-line" /> 添加链接
          </button>
          <button :class="{ active: currentTab === 'folder' }" @click="currentTab = 'folder'">
             <Icon icon="ri:folder-add-line" /> 添加分组
          </button>
          <button :class="{ active: currentTab === 'config' }" @click="currentTab = 'config'">
             <Icon icon="ri:settings-3-line" /> 全局配置
          </button>
        </div>

        <!-- Global Save Bar for Navigation Tabs -->
        <Transition name="slide-up">
            <div v-if="['manage', 'add', 'folder'].includes(currentTab) && hasUnsavedChanges" class="global-save-bar">
                <div class="save-bar-content">
                    <span class="unsaved-text"><Icon icon="ri:error-warning-fill" /> 有未保存的更改</span>
                    <button class="save-all-btn" @click="saveNavData" :disabled="isSaving">
                        <Icon v-if="isSaving" icon="ri:loader-4-line" class="spinner-sm" />
                        <span v-else>立即保存所有更改</span>
                    </button>
                </div>
            </div>
        </Transition>

        <div class="tab-content">
             <!-- CONFIG TAB (Independent Save) -->
             <div v-if="currentTab === 'config'" class="config-container">
                <!-- Basic Info -->
                <div class="config-section">
                   <h3 class="section-title">基本信息</h3>
                   <div class="form-grid">
                      <div class="form-item">
                        <label>站点标题</label>
                        <input type="text" v-model="siteData.siteConfig.title" class="glass-input" />
                      </div>
                      <div class="form-item">
                        <label>站长名称</label>
                        <input type="text" v-model="siteData.siteConfig.author" class="glass-input" />
                      </div>
                      <div class="form-item full-width">
                        <label>站点描述</label>
                        <textarea v-model="siteData.siteConfig.description" class="glass-input" rows="2"></textarea>
                      </div>
                      <div class="form-item">
                        <label>Logo 路径</label>
                        <div class="input-with-upload">
                            <input type="text" v-model="siteData.themeConfig.siteLogo" class="glass-input" />
                            <button class="upload-trigger-btn" @click="triggerUpload(siteData.themeConfig, 'siteLogo')" title="上传图片">
                                 <Icon v-if="isUploading && currentUploadTarget?.obj === siteData.themeConfig" icon="ri:loader-4-line" class="spinner-sm" />
                                 <Icon v-else icon="ri:upload-cloud-2-line" />
                            </button>
                        </div>
                      </div>
                   </div>
                </div>

                <!-- Background -->
                <div class="config-section">
                   <h3 class="section-title">背景设置</h3>
                   <div class="form-grid">
                      <div class="form-item">
                        <label>背景类型 (local/api)</label>
                        <select v-model="siteData.themeConfig.background.type" class="glass-input high-contrast-select">
                          <option value="local">Local (本地)</option>
                          <option value="api">API (在线)</option>
                        </select>
                      </div>
                      <div class="form-item" v-if="siteData.themeConfig.background.type === 'api'">
                        <label>背景 API 地址</label>
                        <input type="text" v-model="siteData.themeConfig.background.apiURL" class="glass-input" />
                      </div>
                   </div>
                </div>

                <!-- Social Links -->
                <div class="config-section">
                   <h3 class="section-title">社交链接 (首页左下)</h3>
                   <div v-for="(item, idx) in siteData.socialLinks" :key="'social-'+idx" class="link-row-card glass-card-sm compact">
                      <div class="row-inputs-flex">
                          <div class="input-col"><input type="text" v-model="item.name" class="glass-input" placeholder="Name" /></div>
                          <div class="input-col icon">
                               <div class="input-with-upload">
                                   <input type="text" v-model="item.icon" class="glass-input" placeholder="Icon" />
                                   <button class="upload-trigger-btn icon-small" @click="triggerUpload(item, 'icon')">
                                        <Icon v-if="isUploading && currentUploadTarget?.obj === item" icon="ri:loader-4-line" />
                                        <Icon v-else icon="ri:upload-cloud-2-line" />
                                   </button>
                               </div>
                          </div>
                          <div class="input-col url"><input type="text" v-model="item.url" class="glass-input" placeholder="URL" /></div>
                          <div class="input-col"><input type="text" v-model="item.tip" class="glass-input" placeholder="Tip" /></div>
                          <button class="delete-btn" @click="siteData.socialLinks.splice(idx, 1)"><Icon icon="ri:close-line"/></button>
                      </div>
                   </div>
                   <button class="action-btn add-row" @click="siteData.socialLinks.push({name:'',icon:'',url:'',tip:''})">
                      <Icon icon="ri:add-line" /> 添加一行
                   </button>
                </div>

                 <!-- Site Links (Footer) -->
                <div class="config-section">
                   <h3 class="section-title">底部链接 (首页右下)</h3>
                   <div v-for="(item, idx) in siteData.siteLinks" :key="'site-'+idx" class="link-row-card glass-card-sm compact">
                      <div class="row-inputs-flex">
                          <div class="input-col"><input type="text" v-model="item.name" class="glass-input" placeholder="Name" /></div>
                          <div class="input-col icon">
                               <div class="input-with-upload">
                                   <input type="text" v-model="item.icon" class="glass-input" placeholder="Icon" />
                                   <button class="upload-trigger-btn icon-small" @click="triggerUpload(item, 'icon')">
                                        <Icon v-if="isUploading && currentUploadTarget?.obj === item" icon="ri:loader-4-line" />
                                        <Icon v-else icon="ri:upload-cloud-2-line" />
                                   </button>
                               </div>
                          </div>
                          <div class="input-col url"><input type="text" v-model="item.link" class="glass-input" placeholder="URL" /></div>
                          <button class="delete-btn" @click="siteData.siteLinks.splice(idx, 1)"><Icon icon="ri:close-line"/></button>
                      </div>
                   </div>
                   <button class="action-btn add-row" @click="siteData.siteLinks.push({name:'',icon:'',link:''})">
                      <Icon icon="ri:add-line" /> 添加一行
                   </button>
                </div>

                <div class="form-actions sticky-bottom">
                    <button class="save-btn" @click="onSaveConfig" :disabled="isSaving">
                       <Icon v-if="isSaving" icon="ri:loader-4-line" class="spinner-sm" />
                       <span v-else>保存所有配置</span>
                    </button>
                </div>
             </div>

             <!-- MANAGE LINKS TAB -->
             <div v-if="currentTab === 'manage'" class="manage-container">
                <Transition name="fade-content" mode="out-in">
                  <div v-if="!currentEditLink" :key="'list'">
                    <draggable 
                        v-model="categoryList" 
                        item-key="title" 
                        handle=".drag-handle-group" 
                        @end="onDragChange" 
                        :animation="200"
                        ghost-class="ghost-card"
                    >
                        <template #item="{ element: group }">
                            <div class="manage-group">
                              <div class="group-header clickable" @click="toggleGroup(group)">
                                <div style="display:flex;align-items:center;gap:10px;flex:1;">
                                    <span class="drag-handle-group" @click.stop title="按住拖动排序">
                                        <Icon icon="ri:drag-move-2-line" class="drag-icon" />
                                    </span>
                                    <span class="group-title-text">{{ group.title }} ({{ group.items.length }})</span>
                                </div>
                                <div class="group-actions" @click.stop>
                                     <button class="action-btn icon-only delete" style="padding:4px;" @click="deleteGroupLocal(group)" title="删除整个分组">
                                        <Icon icon="ri:delete-bin-2-line" width="16" />
                                     </button>
                                     <Icon icon="ri:arrow-down-s-line" class="arrow" :class="{ 'rotated': group.collapsed }"/>
                                </div>
                              </div>
                              
                              <div class="group-list-wrapper" :class="{ 'is-collapsed': group.collapsed }">
                                 <draggable 
                                    v-model="group.items" 
                                    item-key="name" 
                                    group="links" 
                                    handle=".drag-handle-item" 
                                    @end="onDragChange" 
                                    :animation="200"
                                    ghost-class="ghost-item"
                                    class="group-list-inner"
                                 >
                                    <template #item="{ element: item, index: idx }">
                                        <div class="link-item-manage">
                                            <div class="item-left-wrapper">
                                                <span class="drag-handle-item" title="按住拖动排序">
                                                    <Icon icon="ri:draggable" class="drag-icon" />
                                                </span>
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
                                                <button class="action-btn icon-only delete" @click="deleteLinkLocal(group.title, idx)" title="删除">
                                                    <Icon icon="ri:delete-bin-line" width="18" />
                                                </button>
                                            </div>
                                        </div>
                                    </template>
                                 </draggable>
                              </div>
                            </div>
                        </template>
                    </draggable>
                  </div>
                  
                  <div v-else :key="'edit-form'" class="edit-form-wrapper">
                      <h4 class="form-title">编辑链接：{{ currentEditLink.name }}</h4>
                      <div class="form-item">
                        <label>名称 *</label>
                        <input type="text" v-model="currentEditLink.name" class="glass-input" />
                      </div>
                      <div class="form-item">
                        <label>链接地址 (URL) *</label>
                        <input type="url" v-model="currentEditLink.url" class="glass-input" />
                      </div>
                      <div class="form-item icon-group">
                        <label>图标 (Iconify代码 或 URL)</label>
                        <div class="input-with-upload">
                             <input type="text" v-model="currentEditLink.icon" class="glass-input" />
                             <button class="upload-trigger-btn" @click="triggerUpload(currentEditLink, 'icon')" title="上传图片">
                                 <Icon v-if="isUploading && currentUploadTarget?.obj === currentEditLink" icon="ri:loader-4-line" class="spinner-sm" />
                                 <Icon v-else icon="ri:upload-cloud-2-line" />
                             </button>
                        </div>
                        <span v-if="currentEditLink.icon" class="icon-preview">
                            <Icon v-if="!isUrl(currentEditLink.icon)" :icon="currentEditLink.icon" width="24" />
                            <img v-else :src="currentEditLink.icon" alt="图标预览" width="24" height="24" class="favicon-img" />
                        </span>
                      </div>
                      
                      <div class="form-item">
                        <label>移动到分组 *</label>
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
                        <button class="save-btn" @click="confirmEditLocal" :disabled="isSaving">
                            <span>确认修改 (暂存)</span>
                        </button>
                        <button class="action-btn cancel" @click="currentEditLink = null" :disabled="isSaving">
                            取消
                        </button>
                      </div>
                  </div>
                </Transition>
             </div>

             <!-- ADD LINKS TAB -->
             <div v-if="currentTab === 'add'" class="add-form-container">
              <h3 class="form-title">批量添加链接</h3>
              
              <div class="form-item">
                <label>选择目标分组 *</label>
                <select v-model="selectedGroupTitle" class="glass-input high-contrast-select">
                  <option v-for="(group, index) in categoryList" :key="index" :value="group.title">{{ group.title }}</option>
                </select>
              </div>

              <div class="dynamic-rows">
                <div v-for="(link, index) in newLinks" :key="index" class="link-row-card glass-card-sm">
                  <div class="row-header">
                    <span class="row-label">链接 #{{ index + 1 }}</span>
                    <button v-if="newLinks.length > 1" class="delete-btn" @click="removeLinkRow(index)" title="删除">
                      <Icon icon="ri:close-line" />
                    </button>
                  </div>
                  
                  <div class="row-inputs-flex">
                    <div class="input-col name">
                      <input type="text" v-model="link.name" class="glass-input" placeholder="网站名称" />
                    </div>
                    <div class="input-col url">
                      <input type="url" v-model="link.url" class="glass-input" placeholder="链接 (https://...)" @input="detectIcon(link)" />
                    </div>
                    <div class="input-col icon">
                      <div class="icon-input-wrapper input-with-upload">
                        <input type="text" v-model="link.icon" class="glass-input" placeholder="图标 (自动识别)" style="padding-right: 70px;" />
                        <button class="upload-trigger-btn inside" @click="triggerUpload(link, 'icon')" title="上传图片">
                                 <Icon v-if="isUploading && currentUploadTarget?.obj === link" icon="ri:loader-4-line" class="spinner-sm" />
                                 <Icon v-else icon="ri:upload-cloud-2-line" />
                        </button>
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
                  <Icon icon="ri:add-line" /> 添加一行
                </button>
                <button class="action-btn save" @click="addLinksLocal" :disabled="!selectedGroupTitle">
                  <span >添加至列表 (暂存)</span>
                </button>
              </div>
            </div>

            <!-- ADD FOLDER TAB -->
            <div v-if="currentTab === 'folder'" class="add-form-container">
               <h3 class="form-title">添加新分组（文件夹）</h3>
               <div class="form-item"><label>分组名称</label><input type="text" v-model="newFolder.title" class="glass-input" placeholder="例如：我的项目" /></div>
               <div class="form-item">
                   <label>图标 (Iconify代码)</label>
                   <div class="input-with-upload">
                        <input type="text" v-model="newFolder.icon" class="glass-input" placeholder="例如：ri:folder-3-line" />
                        <button class="upload-trigger-btn" @click="triggerUpload(newFolder, 'icon')" title="上传图片">
                             <Icon v-if="isUploading && currentUploadTarget?.obj === newFolder" icon="ri:loader-4-line" class="spinner-sm" />
                             <Icon v-else icon="ri:upload-cloud-2-line" />
                        </button>
                   </div>
               </div>
               <div class="form-actions"><button class="action-btn save" @click="addGroupLocal">创建分组 (暂存)</button></div>
            </div>
            
            <p v-if="saveMessage" :class="['message', isSaving ? 'info' : 'error']">{{ saveMessage }}</p>
            <p v-if="successCommitUrl" class="message success">
                ✅ 操作成功！已提交变更至 GitHub，正在自动部署。 <a :href="successCommitUrl" target="_blank">查看提交</a>
            </p>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>

import { ref, onMounted, computed, nextTick } from 'vue';

import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';

import draggable from 'vuedraggable';

import { navData } from '@/config/nav';

import initialSiteData from '@/config/site-data.json'; 



const router = useRouter();



const password = ref('');

const isAuthenticated = ref(false);

const error = ref('');



const currentTab = ref('manage');

const categoryList = ref(JSON.parse(JSON.stringify(navData)));

const siteData = ref(JSON.parse(JSON.stringify(initialSiteData))); 

const isSaving = ref(false);

const saveMessage = ref('');

const successCommitUrl = ref('');

const hasUnsavedChanges = ref(false); 



const fileInput = ref(null);

const currentUploadTarget = ref(null); 

const isUploading = ref(false);



const currentEditLink = ref(null);



const newLinks = ref([{ name: '', url: '', icon: 'ri:link' }]);

const selectedGroupTitle = ref(navData[0]?.title || ''); 

const isUrl = (str) => str && (str.startsWith('http://') || str.startsWith('https://'));

const validLinksCount = computed(() => newLinks.value.filter(l => l.name && l.url).length);



const newFolder = ref({ title: '', icon: 'ri:folder-line' });



const isLoggingIn = ref(false);



const login = async () => {

  if (!password.value) return;

  

  isLoggingIn.value = true;

  error.value = '';



  try {

      const res = await fetch('/api/auth-check', {

          method: 'POST',

          headers: {

              'Content-Type': 'application/json',

              'x-admin-password': password.value

          }

      });

      

      const data = await res.json();

      

      if (res.ok && data.success) {

          localStorage.setItem('admin_token', password.value);

          isAuthenticated.value = true;

      } else {

          error.value = data.message || '密码错误';

      }

  } catch (e) {

      error.value = '网络错误';

  } finally {

      isLoggingIn.value = false;

  }

};



const logout = () => {

  localStorage.removeItem('admin_token');

  isAuthenticated.value = false;

  router.push('/');

};



onMounted(async () => {

  const token = localStorage.getItem('admin_token');

  if (token) {

    try {

        const res = await fetch('/api/auth-check', {

            method: 'POST',

            headers: {

                'Content-Type': 'application/json',

                'x-admin-password': token

            }

        });

        const data = await res.json();

        if (res.ok && data.success) {

            isAuthenticated.value = true;

        } else {

            localStorage.removeItem('admin_token');

            isAuthenticated.value = false;

        }

    } catch (e) {

        localStorage.removeItem('admin_token');

        isAuthenticated.value = false;

    }

  }

  

  if (!selectedGroupTitle.value && categoryList.value.length > 0) {

      selectedGroupTitle.value = categoryList.value[0].title;

  }

});



const toggleGroup = (g) => g.collapsed = !g.collapsed;



const onDragChange = () => {

    hasUnsavedChanges.value = true;

};



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



const triggerUpload = (obj, key) => {

    currentUploadTarget.value = { obj, key };

    fileInput.value.click();

};



const handleFileUpload = async (event) => {

    const file = event.target.files[0];

    if (!file) return;



    isUploading.value = true;

    saveMessage.value = '正在上传...';

    successCommitUrl.value = '';



    const formData = new FormData();

    formData.append('file', file);



    try {

        const res = await fetch('/api/upload', {

            method: 'POST',

            headers: {

                'x-admin-password': localStorage.getItem('admin_token') || ''

            },

            body: formData

        });

        const data = await res.json();

        

        if (res.ok) {

            if (currentUploadTarget.value) {

                currentUploadTarget.value.obj[currentUploadTarget.value.key] = data.url;

            }

            saveMessage.value = ''; 

        } else {

             if (res.status === 401) {

                 saveMessage.value = '未授权：管理员密码错误';

             } else {

                 saveMessage.value = `Error: ${data.message}`;

             }

        }

    } catch (e) {

        saveMessage.value = `网络错误: ${e.message}`;

    } finally {

        isUploading.value = false;

        event.target.value = ''; 

        currentUploadTarget.value = null;

    }

};



const deleteLinkLocal = (groupTitle, itemIndex) => {

    if(!confirm('确定删除此链接吗？此操作将处于暂存状态，需点击顶部保存按钮生效。')) return;

    const group = categoryList.value.find(g => g.title === groupTitle);

    if (group) {

        group.items.splice(itemIndex, 1);

        hasUnsavedChanges.value = true;

    }

};



const deleteGroupLocal = (group) => {

    if(!confirm(`确定删除分组 "${group.title}" 及其所有链接吗？`)) return;

    const idx = categoryList.value.findIndex(g => g.title === group.title);

    if(idx !== -1) {

        categoryList.value.splice(idx, 1);

        hasUnsavedChanges.value = true;

    }

};



const startEdit = (groupTitle, item, index) => {

    currentEditLink.value = {

        originalItem: item, 

        originalIndex: index, 

        oldGroupTitle: groupTitle,

        name: item.name, 

        url: item.url, 

        icon: item.icon, 

        newGroupTitle: groupTitle, 

    };

};



const confirmEditLocal = () => {

    const edit = currentEditLink.value;

    const oldGroup = categoryList.value.find(g => g.title === edit.oldGroupTitle);

    const newGroup = categoryList.value.find(g => g.title === edit.newGroupTitle);

    

    if (oldGroup && newGroup) {

        // Remove from old

        oldGroup.items.splice(edit.originalIndex, 1);

        // Add to new

        newGroup.items.push({

            name: edit.name,

            url: edit.url,

            icon: edit.icon

        });

        hasUnsavedChanges.value = true;

        currentEditLink.value = null;

    }

};



const addLinksLocal = () => {

    const group = categoryList.value.find(g => g.title === selectedGroupTitle.value);

    const valid = newLinks.value.filter(l => l.name && l.url);

    if (group && valid.length > 0) {

        group.items.push(...valid);

        newLinks.value = [{ name: '', url: '', icon: 'ri:link' }]; // Reset

        hasUnsavedChanges.value = true;

        alert(`已暂存 ${valid.length} 个链接，请记得点击顶部的保存按钮！`);

    }

};



const addGroupLocal = () => {

    if (!newFolder.value.title) return;

    categoryList.value.push({

        title: newFolder.value.title,

        icon: newFolder.value.icon || 'ri:folder-line',

        items: []

    });

    newFolder.value = { title: '', icon: 'ri:folder-line' };

    hasUnsavedChanges.value = true;

    alert('分组已暂存，请记得点击顶部的保存按钮！');

};



const getHeaders = () => ({

    'Content-Type': 'application/json',

    'x-admin-password': localStorage.getItem('admin_token') || ''

});



const saveNavData = async () => {

    if (!hasUnsavedChanges.value) return;

    isSaving.value = true;

    saveMessage.value = '正在保存...';

    successCommitUrl.value = '';

    

    try {

        const res = await fetch('/api/save-nav', {

            method: 'POST',

            headers: getHeaders(),

            body: JSON.stringify(categoryList.value)

        });

        const data = await res.json();

        if (res.ok) {

            successCommitUrl.value = data.commit_url;

            saveMessage.value = '';

            hasUnsavedChanges.value = false;

        } else {

             if (res.status === 401) {

                 saveMessage.value = '未授权：管理员密码错误';

             } else {

                 saveMessage.value = `Error: ${data.message}`;

             }

        }

    } catch (e) { 

        saveMessage.value = `网络错误: ${e.message}`; 

    } finally { 

        isSaving.value = false; 

    }

};



const onSaveConfig = async () => {

    isSaving.value = true;

    saveMessage.value = '正在保存...';

    successCommitUrl.value = '';

    try {

        const res = await fetch('/api/save-config', {

            method: 'POST',

            headers: getHeaders(),

            body: JSON.stringify(siteData.value)

        });

        const data = await res.json();

        if (res.ok) {

            successCommitUrl.value = data.commit_url;

            saveMessage.value = '';

        } else {

             if (res.status === 401) {

                 saveMessage.value = '未授权：管理员密码错误';

             } else {

                 saveMessage.value = `Error: ${data.message}`;

             }

        }

    } catch (e) { saveMessage.value = `网络错误: ${e.message}`; } finally { isSaving.value = false; }

};

</script>

<style scoped lang="scss">
.admin-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 50px;
  background: #1a1a1a;
  color: white;
  font-family: sans-serif;
}

.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 300px;
  margin-top: 100px;
}

.glass-card-large {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-height: 400px;
}

.glass-input {
  width: 100%;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 6px;
  outline: none;
  &:focus { border-color: #4facfe; }
}

.high-contrast-select {
  appearance: none; -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white' width='24' height='24'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 10px center;
  option { background-color: #333; color: #fff; }
}

.login-btn {
  padding: 10px;
  background: #4facfe;
  border: none;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  &:hover { background: #3099f1; }
}

.error-msg { color: #ff4d4f; font-size: 0.9rem; }

.dashboard {
  width: 90%;
  max-width: 1000px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-actions { display: flex; gap: 15px; }

.preview-btn, .logout-btn {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.1);
  color: #fff;
  padding: 8px 15px;
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none;
  display: flex; align-items: center; gap: 5px;
  &:hover { background: rgba(255,255,255,0.2); }
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.tabs button {
  padding: 10px 20px;
  background: rgba(255,255,255,0.05);
  border: none;
  color: #aaa;
  cursor: pointer;
  border-radius: 6px;
  display: flex; align-items: center; gap: 8px;
  transition: 0.2s;
  &.active { background: #4facfe; color: white; }
  &:hover:not(.active) { background: rgba(255,255,255,0.1); }
}

.global-save-bar {
    background: rgba(255, 165, 0, 0.15);
    border: 1px solid rgba(255, 165, 0, 0.4);
    color: #ffcc00;
    padding: 12px 20px;
    border-radius: 8px;
    margin-bottom: 20px;
    display: flex;
    justify-content: center;
}
.save-bar-content {
    display: flex;
    align-items: center;
    gap: 20px;
    width: 100%;
    justify-content: space-between;
}
.unsaved-text { display: flex; align-items: center; gap: 8px; font-weight: bold; }
.save-all-btn {
    background: #4facfe;
    border: none;
    padding: 8px 20px;
    border-radius: 6px;
    color: white;
    font-weight: bold;
    cursor: pointer;
    &:disabled { opacity: 0.6; cursor: not-allowed; }
    &:hover:not(:disabled) { background: #3099f1; }
}

.manage-container { padding: 0 10px; }
.group-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 15px 10px; 
    border-bottom: 1px solid rgba(255,255,255,0.1); 
    cursor: pointer; user-select: none;
    background: rgba(255,255,255,0.02);
    margin-bottom: 5px;
    border-radius: 6px;
    &:hover { background: rgba(255,255,255,0.05); }
}
.group-title-text { font-size: 1rem; color: #fff; font-weight: 500; }
.group-actions { display: flex; align-items: center; gap: 10px; }
.arrow { transition: transform 0.3s; color: rgba(255,255,255,0.6); &.rotated { transform: rotate(-90deg); } }

.group-list-wrapper { display: grid; grid-template-rows: 1fr; transition: 0.3s; &.is-collapsed { grid-template-rows: 0fr; } }
.group-list-inner { overflow: hidden; }

.link-item-manage { 
    display: flex; justify-content: space-between; align-items: center; 
    padding: 10px 15px; margin-bottom: 8px; 
    background: rgba(255, 255, 255, 0.03); 
    border-radius: 6px; 
    .item-left-wrapper { display: flex; align-items: center; gap: 15px; overflow: hidden; flex: 1; }
    .manage-icon-box { width: 32px; height: 32px; background: rgba(0,0,0,0.3); border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #ddd; }
    .manage-favicon { width: 20px; height: 20px; object-fit: contain; }
    .link-info { display: flex; flex-direction: column; overflow: hidden; flex: 1; .link-name { color: #fff; margin-bottom: 2px; } .link-url { font-size: 0.8rem; color: #888; } }
    .actions { display: flex; gap: 8px; }
}

.action-btn {
  padding: 8px 12px; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px; transition: 0.2s;
  &.save { background: #4facfe; color: #fff; &:hover { background: #3099f1; } }
  &.edit { background: rgba(255,255,255,0.1); color: #ddd; &:hover { background: #4facfe; color: #fff; } }
  &.delete { background: rgba(255,255,255,0.1); color: #ddd; &:hover { background: #ff4d4f; color: #fff; } }
  &.add-row { background: rgba(255,255,255,0.1); color: #fff; width: 100%; margin-top: 10px; }
  &.cancel { background: rgba(255,255,255,0.15); color: #fff; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.edit-form-wrapper, .add-form-container { padding: 20px; background: rgba(0,0,0,0.2); border-radius: 8px; }
.form-title { margin-bottom: 20px; color: #fff; }
.form-item { margin-bottom: 15px; label { display: block; margin-bottom: 5px; color: #ccc; font-size: 0.9rem; } }
.form-actions { display: flex; gap: 15px; margin-top: 25px; }
.save-btn { flex: 1; padding: 12px; background: #4facfe; border: none; border-radius: 6px; color: #fff; font-weight: bold; cursor: pointer; }

.dynamic-rows { 
    max-height: 400px; 
    overflow-y: auto; 
    padding-right: 5px; 

    &::-webkit-scrollbar { width: 6px; height: 6px; }
    &::-webkit-scrollbar-track { background: transparent; }
    &::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 4px; }
    &::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.4); }
}
.link-row-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 15px; margin-bottom: 15px; border-radius: 8px; }
.row-header { display: flex; justify-content: space-between; margin-bottom: 10px; color: #aaa; font-size: 0.85rem; }
.delete-btn { background: none; border: none; color: #ff4d4f; cursor: pointer; }
.row-inputs-flex { display: flex; gap: 10px; flex-wrap: wrap; .input-col { flex: 1; min-width: 120px; } }
.icon-input-wrapper { position: relative; input { padding-right: 30px; } .icon-preview-box { position: absolute; right: 8px; top: 10px; pointer-events: none; } }

.message { margin-top: 20px; padding: 10px; border-radius: 6px; &.info { color: #ffd700; background: rgba(255,215,0,0.1); } &.error { color: #ff4d4f; background: rgba(255,0,0,0.1); } &.success { color: #76ff7a; background: rgba(30,200,30,0.1); } }

.config-container { padding: 0 10px; padding-bottom: 60px; }
.config-section { margin-bottom: 30px; background: rgba(255,255,255,0.02); padding: 15px; border-radius: 8px; }
.section-title { margin-bottom: 15px; border-left: 3px solid #4facfe; padding-left: 10px; color: #fff; font-size: 1.1rem; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
.form-grid .full-width { grid-column: span 2; }
textarea.glass-input { resize: vertical; min-height: 80px; }
.link-row-card.compact { padding: 10px; }
.sticky-bottom { position: sticky; bottom: 0; background: #1a1a1a; padding: 10px 0; border-top: 1px solid rgba(255,255,255,0.1); box-shadow: 0 -5px 15px rgba(0,0,0,0.5); z-index: 10; margin-top: 20px; }

.input-with-upload { display: flex; align-items: center; gap: 8px; position: relative; width: 100%; }
.input-with-upload .glass-input { flex: 1; }
.upload-trigger-btn {
    padding: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 6px; color: #ccc; cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: 0.2s;
    &:hover { background: #4facfe; color: #fff; }
}
.upload-trigger-btn.inside { position: absolute; right: 35px; top: 50%; transform: translateY(-50%); background: none; border: none; padding: 4px; z-index: 10; &:hover { background: none; color: #4facfe; } }
.upload-trigger-btn.icon-small { padding: 4px; width: 30px; height: 30px; }

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s ease; }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateY(-20px); }

.drag-handle-group, .drag-handle-item {
    cursor: move;
    color: rgba(255, 255, 255, 0.3);
    display: flex;
    align-items: center;
    transition: color 0.2s;
}
.drag-handle-group:hover, .drag-handle-item:hover {
    color: #4facfe;
}
.drag-handle-item {
    margin-right: 10px;
}
.ghost-card {
    opacity: 0.5;
    background: rgba(79, 172, 254, 0.1);
    border: 1px dashed #4facfe;
}
.ghost-item {
    opacity: 0.5;
    background: rgba(79, 172, 254, 0.1);
    border: 1px dashed #4facfe;
}
</style>