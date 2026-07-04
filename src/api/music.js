import { musicConfig } from '@/config';
export const getPlayerList = async () => {
  const { api, server, type, id } = musicConfig;  
  try {
    const res = await fetch(`${api}?server=${server}&type=${type}&id=${id}`);
    const raw = await res.json();

    // 兼容数组和 { data: [...] } 两种响应格式
    const list = Array.isArray(raw) ? raw : raw?.data;
    if (!Array.isArray(list) || list.length === 0) {
      console.warn('获取歌单列表为空或格式异常', raw);
      return [];
    }

    return list.map((v) => ({
      name: v.name || v.title,
      artist: v.artist || v.author,
      url: v.url,
      cover: v.cover || v.pic,
      lrc: v.lrc,
    }));
  } catch (error) {
    console.error("获取歌单失败", error);
    return [];
  }
};