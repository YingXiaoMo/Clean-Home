import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import App from './App.vue';
import { addCollection } from '@iconify/vue';
import riIcons from '@iconify-json/ri/icons.json';
import mingcuteIcons from '@iconify-json/mingcute/icons.json';
import { initConsole } from '@/utils/console';

import zh from '@/locales/zh.json';
import en from '@/locales/en.json';

if (!window.ColorThief) {
  window.ColorThief = class {
    getColor() { return [0, 0, 0]; }
    getPalette() { return [[0, 0, 0]]; }
  };
}

addCollection(riIcons);
addCollection(mingcuteIcons);

const i18n = createI18n({
  legacy: false, 
  locale: localStorage.getItem('lang') || 'zh', 
  fallbackLocale: 'en', 
  messages: {
    zh,
    en
  }
});

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(i18n); 
app.mount('#app');

initConsole();