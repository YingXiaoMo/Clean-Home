<template>
  <div class="welcome-notify" :class="{ visible }">
    <Icon :icon="greeting.icon" width="14" height="14" class="icon" />
    <span class="text">{{ greeting.text }}，欢迎来到我的主页</span>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import { useGreeting } from '@/composables/useGreeting';

const { greeting } = useGreeting();
const visible = ref(false);

onMounted(() => {
  setTimeout(() => { visible.value = true; }, 800);
  setTimeout(() => { visible.value = false; }, 4000);
});
</script>

<style scoped lang="scss">
.welcome-notify {
  position: fixed;
  top: 12px;
  left: 50%;
  transform: translateX(-50%) scale(0.9) translateZ(0);
  transform-origin: top center;
  z-index: 1001;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 28px;
  padding: 0 14px;

  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);

  color: #fff;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.4px;

  white-space: nowrap;
  pointer-events: none;
  user-select: none;

  opacity: 0;
  transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);

  &.visible {
    opacity: 1;
    transform: translateX(-50%) scale(1) translateZ(0);
  }

  .icon {
    color: rgba(255, 255, 255, 0.9);
    flex-shrink: 0;
  }
}
</style>
