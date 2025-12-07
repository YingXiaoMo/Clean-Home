import { ref, onMounted } from 'vue';
import dayjs from 'dayjs';
import { apiEndpoints } from '@/config';

const userGeoAPIs = apiEndpoints.userGeoHosts
    .filter(host => host.startsWith('http'))
    .map((host) => ({
      name: `自建 API (${new URL(host).hostname})`,
      geoUrl: `${host}/api/geo`, 
      weatherUrl: `${host}/api/weather`, 
      host: host, 
    }));

const FREE_IP_APIS = [
  { 
    name: 'Vore.top IP', 
    url: 'https://api.vore.top/api/IPdata', 
    handler: (data) => {
      if (data.code === 200 && data.ipdata) {
        return { 
            city: data.ipdata.info2 || data.ipdata.info1, 
            ip: data.ipinfo?.text 
        }; 
      }
      return null;
    }
  },
  { 
    name: 'Xxapi.cn IP', 
    url: 'https://v2.xxapi.cn/api/ip', 
    handler: (data) => {
      if (data.code === 200 && data.data) {
        const address = data.data.address || '';
        let city = address;
        const match = address.match(/([^省]+市)/);
        if (match) {
            city = match[1].replace('省', '').replace('自治区', '');
        }
        return { city: city, ip: data.data.ip };
      }
      return null;
    }
  }
];

const FREE_WEATHER_APIS = [
    { 
        name: 'Vore.top Weather', 
        url: 'https://api.vore.top/api/Weather', 
        type: 'direct_or_city', 
        handler: (data) => {
            if (data.code === 200 && data.data) {
                let d = data.data;
                if (d.tianqi && typeof d.tianqi === 'object') d = d.tianqi;
                return {
                    city: d.city || '未知',
                    weather: d.weather || d.tianqi || '未知',
                    temperature: d.temp || d.temperature || '0',
                    wind: d.wind || d.winddirection || '未知', 
                    updateTime: dayjs().format('HH:mm'),
                    source: 'Vore.top'
                };
            }
            return null;
        }
    }
];

const weatherData = ref({
  city: '定位中...',
  weather: '--',
  temperature: '0',
  wind: '无数据',
  updateTime: ''
});

const loading = ref(true); 
let isInitialized = false;

const standardize = (data, source, ip) => ({
    city: data.city || '未知',
    weather: data.weather || '暂无数据',
    temperature: data.temperature || '-',
    wind: data.wind || '-',
    updateTime: data.updateTime || dayjs().format('HH:mm'),
    source: source,
    ip: ip
});

const fetchWeather = async () => {
  loading.value = true;
  weatherData.value.city = '定位中...';
  
  let finalData = null;
  let detectedCity = null;
  let detectedIP = null;

  // ----------------------------------------------------------------
  // 阶段一：优先尝试后端安全接口 (和风/高德 + 隐藏 Key)
  // 策略 A: 浏览器定位 (最准，无视代理)
  // 策略 B: IP 定位 (兜底)
  // ----------------------------------------------------------------
  console.log('🔄 [Step 1] 尝试后端安全接口...');
  
  try {
    let lat = null;
    let lon = null;

    // 尝试获取浏览器定位 (超时 3秒)
    try {
        const getLoc = () => new Promise((resolve, reject) => {
            if (!navigator.geolocation) return reject('Not Supported');
            navigator.geolocation.getCurrentPosition(
                pos => resolve(pos.coords),
                err => reject(err.message),
                { timeout: 3000, maximumAge: 600000 }
            );
        });
        const coords = await getLoc();
        lat = coords.latitude;
        lon = coords.longitude;
        console.log(`📍 [浏览器定位] 获取经纬度成功: ${lat}, ${lon}`);
    } catch (e) {
        console.log('⚠️ 浏览器定位不可用或超时，降级为 IP 定位');
    }

    // 构建请求 URL
    let apiUrl = '/api/weather';
    if (lat && lon) {
        apiUrl += `?lat=${lat}&lon=${lon}`;
    }

    const res = await fetch(apiUrl);
    if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
            finalData = data.data;
            if (finalData.ip) console.log(`📡 你的 IP: ${finalData.ip}`);
            if (finalData.source) console.log(`🌤️ 天气来源: ${finalData.source}`);
        } else {
            console.warn('❌ 后端接口返回失败:', data.message);
        }
    } else {
        console.warn(`❌ 后端接口 HTTP 错误: ${res.status}`);
    }
  } catch (e) {
    console.error('❌ 后端接口异常:', e);
  }


  if (!finalData) {
      console.log('🔄 尝试第三方 API...');
      
      for (const api of FREE_IP_APIS) {
          try {
              const res = await fetch(api.url);
              const data = await res.json();
              const result = api.handler(data);
              if (result && result.city) {
                  detectedCity = result.city.replace(/市$/, ''); 
                  detectedIP = result.ip;
                  console.log(`📍 [定位] ${api.name} 成功: ${detectedCity} (${detectedIP})`);
                  break; 
              }
          } catch (e) { console.warn(`⚠️ ${api.name} 失败`, e.message); }
      }


      for (const api of FREE_WEATHER_APIS) {
          try {
              let url = api.url;
              if (detectedCity && api.type === 'direct_or_city') {
                  url += `?city=${encodeURIComponent(detectedCity)}`;
              }
              const res = await fetch(url);
              const data = await res.json();
              const result = api.handler(data);
              
              if (result) {
                  if (!result.city || result.city === '未知') {
                      result.city = detectedCity || '未知城市';
                  }
                  finalData = standardize(result, api.name, detectedIP);
                  console.log(`✅ [天气] ${api.name} 获取成功`);
                  break;
              }
          } catch (e) { console.warn(`⚠️ ${api.name} 失败`, e.message); }
      }
  }

  if (!finalData) {
      console.log('🔄 尝试自建 API 兜底...');
      
      for (const api of userGeoAPIs) {
          try {
              let cityToUse = detectedCity;
              
              if (!cityToUse) {
                  console.log(`🔸 无缓存定位，调用自建定位: ${api.geoUrl}`);
                  const geoRes = await fetch(api.geoUrl);
                  const geoData = await geoRes.json();
                  if (geoRes.ok && geoData.city) {
                      cityToUse = geoData.city;
                      detectedIP = geoData.ip;
                      detectedCity = cityToUse; 
                  }
              }

              if (cityToUse) {
                  const weatherRes = await fetch(`${api.weatherUrl}?city=${encodeURIComponent(cityToUse)}&lang=zh`);
                  const wData = await weatherRes.json();
                  
                  if (weatherRes.ok && wData.status === 'ok' && wData.data) {
                      finalData = standardize({
                          ...wData.data,
                          city: cityToUse 
                      }, api.name, detectedIP);
                      console.log(`✅ [自建兜底] ${api.name} 获取成功`);
                      break;
                  }
              }
          } catch (e) { console.warn(`⚠️ ${api.name} 失败`, e.message); }
      }
  }


  if (finalData) {
      weatherData.value = finalData;
      if (finalData.ip) console.log(`📡 最终 IP: ${finalData.ip}`);
  } else {
      console.error('❌ 所有天气源均不可用');
      weatherData.value = {
          city: '获取失败',
          weather: '暂无数据',
          temperature: '-',
          wind: '-',
          updateTime: ''
      };
  }
  loading.value = false;
};

export const useWeather = () => {
  if (!isInitialized) {
    onMounted(async () => {
      await fetchWeather();
      setInterval(() => fetchWeather(), 30 * 60 * 1000); 
    });
    isInitialized = true;
  }
  return { weatherData, loading, refreshWeather: fetchWeather };
};
