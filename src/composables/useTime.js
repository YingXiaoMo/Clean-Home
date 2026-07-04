import { ref, onMounted, onUnmounted } from 'vue';
import dayjs from 'dayjs';

export function useTime() {
  const timeData = ref({
    dateParams: '',
    weekday: '',
    time: ''
  });

  let timer = null;
  const weeks = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

  const updateTime = () => {
    const now = dayjs();
    timeData.value = {
      dateParams: now.format('YYYY 年 MM 月 DD 日'),
      weekday: weeks[now.day()],
      time: now.format('HH:mm:ss')
    };
  };

  onMounted(() => {
    updateTime();
    timer = setInterval(updateTime, 1000);
  });

  onUnmounted(() => {
    if (timer) clearInterval(timer);
  });

  return { timeData };
}