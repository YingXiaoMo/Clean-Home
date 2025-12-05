import { ref } from 'vue';

export function useHitokoto() {
  const hitokoto = ref({
    text: '正在获取一言...',
    from: '天天'
  });

  const fetchHitokoto = async (lang = 'zh') => {

    if (lang === 'en') {
      hitokoto.value = { text: 'Loading quote...', from: 'Daily' };
    } else {
      hitokoto.value = { text: '正在获取一言...', from: '天天' };
    }

    try {
      let res, data;
      
      if (lang === 'en') {
        res = await fetch('https://dummyjson.com/quotes/random');
        data = await res.json();
        hitokoto.value = {
          text: data.quote,
          from: data.author
        };
      } else {

        res = await fetch('https://v1.hitokoto.cn');
        data = await res.json();
        hitokoto.value = {
          text: data.hitokoto,
          from: data.from
        };
      }
    } catch (e) {
      console.error('Quote fetch failed', e);

      if (lang === 'en') {
        hitokoto.value = { text: 'Life is bright, everything is cute.', from: 'Daily' };
      } else {
        hitokoto.value = { text: '生活明朗，万物可爱', from: '天天' };
      }
    }
  };


  let timer = null;
  const updateHitokoto = (lang = 'zh') => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fetchHitokoto(lang);
    }, 500); 
  };

  return { hitokoto, updateHitokoto };
}