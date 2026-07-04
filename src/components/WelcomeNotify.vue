<template>
  <Transition name="slide-down">
    <div v-if="visible" class="welcome-notify">
      <Icon :icon="greeting.icon" width="12" height="12" class="icon" />
      <span class="text">{{ greeting.text }}，欢迎来到我的主页</span>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import { useGreeting } from '@/composables/useGreeting';

const { greeting } = useGreeting();
const visible = ref(false);

onMounted(() => {
  setTimeout(() => { visible.value = true; }, 500);
  setTimeout(() => { visible.value = false; }, 3500);
});
</script>

<style scoped lang="scss">
.welcome-notify {
  position: fixed;
  top: 10px;
  left: 50%;
  transform: translateX(-50%) scale(0.8) translateZ(0);
  transform-origin: top center;
  z-index: 1001;
  
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 24px; 
  padding: 0 10px;
  
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
  
  color: #fff;
  font-size: 12px;
  font-weight: 400;
  letter-spacing: 0.5px;
  
  white-space: nowrap;
  pointer-events: none;
  user-select: none;

  .icon {
    color: rgba(255, 255, 255, 0.9);
  }
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px) scale(0.8);
}
</style>
