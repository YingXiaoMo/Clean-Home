import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { addCollection } from '@iconify/vue';

// Import Icon Collections
import riIcons from '@iconify-json/ri/icons.json';
import mingcuteIcons from '@iconify-json/mingcute/icons.json';
import mdiIcons from '@iconify-json/mdi/icons.json';
import phIcons from '@iconify-json/ph/icons.json';
import tablerIcons from '@iconify-json/tabler/icons.json';
import hugeiconsIcons from '@iconify-json/hugeicons/icons.json';
import carbonIcons from '@iconify-json/carbon/icons.json';

import { initConsole } from '@/utils/console';

if (!window.ColorThief) {
  window.ColorThief = class {
    getColor() { return [0, 0, 0]; }
    getPalette() { return [[0, 0, 0]]; }
  };
}

// Register all icon collections
[
  riIcons, 
  mingcuteIcons, 
  mdiIcons, 
  phIcons, 
  tablerIcons, 
  hugeiconsIcons, 
  carbonIcons
].forEach(addCollection);

import router from './router';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.mount('#app');

initConsole();