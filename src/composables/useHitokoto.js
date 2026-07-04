import { ref, onMounted, onUnmounted } from 'vue';

export function useHitokoto() {
  const hitokoto = ref({
    text: '正在获取一言...',
    from: '天天'
  });

  // 用于取消未完成的请求
  let abortController = null;

  const fetchHitokoto = async () => {
    // 取消上一次未完成的请求
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();

    try {
      const res = await fetch('https://v1.hitokoto.cn', { signal: abortController.signal });
      const data = await res.json();
      hitokoto.value = {
        text: data.hitokoto,
        from: data.from
      };
    } catch (e) {
      // 用户主动取消的请求不报错
      if (e.name === 'AbortError') return;
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

  onUnmounted(() => {
    if (timer) clearTimeout(timer);
    if (abortController) {
      abortController.abort();
    }
  });

  return { hitokoto, updateHitokoto };
}
