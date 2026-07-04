import { ref } from 'vue';

/**
 * 根据当前时间段返回问候语和图标
 */
export function useGreeting() {
  const greeting = ref({ text: '', icon: '' });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) {
      return { text: '早上好', icon: 'ri:sun-line' };
    } else if (hour >= 11 && hour < 13) {
      return { text: '中午好', icon: 'ri:sun-cloudy-line' };
    } else if (hour >= 13 && hour < 17) {
      return { text: '下午好', icon: 'ri:cup-line' };
    } else if (hour >= 17 && hour < 23) {
      return { text: '晚上好', icon: 'ri:moon-line' };
    } else {
      return { text: '夜深了', icon: 'ri:moon-cloudy-line' };
    }
  };

  const updateGreeting = () => {
    greeting.value = getGreeting();
  };

  // 初始化
  updateGreeting();

  return { greeting, updateGreeting };
}
