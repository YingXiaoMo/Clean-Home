import { ref, onMounted } from 'vue';

export function useHitokoto() {
  const hitokoto = ref({
    text: '正在获取一言...',
    from: '天天'
  });

  const fetchHitokoto = async () => {
    try {
      const res = await fetch('https://v1.hitokoto.cn');
      const data = await res.json();
      hitokoto.value = {
        text: data.hitokoto,
        from: data.from
      };
    } catch (e) {
      console.error('一言获取失败', e);
      hitokoto.value = { text: '生活明朗，万物可爱', from: '天天' };
    }
  };

  let timer = null;
  const updateHitokoto = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fetchHitokoto();
    }, 500);
  };

  onMounted(() => {
    fetchHitokoto();
  });

  return { hitokoto, updateHitokoto };
}