import { ref } from 'vue';
export function useHitokoto() {
  const hitokoto = ref({
    text: '正在获取一言...',
    from: '天天'
  });
  const fetchHitokoto = async () => {
    hitokoto.value = { text: '正在获取一言...', from: '天天' };
    try {
      const res = await fetch('https://v1.hitokoto.cn');
      const data = await res.json();
      hitokoto.value = {
        text: data.hitokoto,
        from: data.from
      };
    } catch (e) {
      console.error('Quote fetch failed', e);
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
  return { hitokoto, updateHitokoto };
}