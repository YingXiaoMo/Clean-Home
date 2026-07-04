import { ref, onMounted, onUnmounted } from 'vue';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

export function useTime() {
  const timeData = ref({
    dateParams: '',
    weekday: '',
    time: ''
  });

  let timer = null;

  const updateTime = () => {
    const now = dayjs();
    timeData.value = {
      dateParams: now.format('YYYY 年 MM 月 DD 日'),
      weekday: now.locale('zh-cn').format('dddd'),
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
