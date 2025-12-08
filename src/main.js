import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { addCollection } from '@iconify/vue';
import riIcons from '@iconify-json/ri/icons.json';
import mingcuteIcons from '@iconify-json/mingcute/icons.json';
import { initConsole } from '@/utils/console';

if (!window.ColorThief) {
  window.ColorThief = class {
    getColor() { return [0, 0, 0]; }
    getPalette() { return [[0, 0, 0]]; }
  };
}

addCollection(riIcons);
addCollection(mingcuteIcons);

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.mount('#app');

initConsole();