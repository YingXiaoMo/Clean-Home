/**
 * -----------------------------------------------------------------------------
 * 英文模式 专用静态歌单，使用中文不用此文件。
 * -----------------------------------------------------------------------------
 * 当网站切换到英文模式 (EN) 时，将自动加载此列表，不再请求网易云 API。
 * 格式说明:
 * - name: 歌曲名
 * - artist: 歌手
 * - url: 音频直链 (MP3/M4A), 推荐使用 CDN 或对象存储链接
 * - cover: 封面图链接
 * - lrc: 歌词 (可选，支持 LRC 格式字符串或 .lrc 文件链接，如果没有请留空)
 */

/**
* -----------------------------------------------------------------------------
* This is a static playlist for English mode only. Do not use this file if you are using Chinese.
* -----------------------------------------------------------------------------
* This playlist will be automatically loaded when the website switches to English mode (EN), and will no longer request the NetEase Cloud Music API.
* Format Description:
* - name: Song title
* - artist: Artist
* - url: Audio link (MP3/M4A), CDN or object storage link recommended
* - cover: Cover image link
* - lrc: Lyrics (optional, supports LRC format string or .lrc file link; leave blank if not available)
*/


export const globalPlaylist = [
  {
    name: "Sunny",
    artist: "Bensound",
    url: "https://www.bensound.com/bensound-music/bensound-sunny.mp3",
    cover: "https://www.bensound.com/bensound-img/sunny.jpg",
    lrc: "" 
  },
  {
    name: "Energy",
    artist: "Bensound",
    url: "https://www.bensound.com/bensound-music/bensound-energy.mp3",
    cover: "https://www.bensound.com/bensound-img/energy.jpg",
    lrc: ""
  },
  {
    name: "Slow Motion",
    artist: "Bensound",
    url: "https://www.bensound.com/bensound-music/bensound-slowmotion.mp3",
    cover: "https://www.bensound.com/bensound-img/slowmotion.jpg",
    lrc: ""
  }
];