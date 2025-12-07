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

  console.log('🔄 尝试后端安全接口...');
  try {
    const res = await fetch('/api/weather');
    if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
            finalData = data.data;
            console.log(`✅ 后端获取成功! 来源: ${finalData.source}`);
        }
    }
  } catch (e) {
    console.warn('❌ 后端接口不可用，跳过。', e.message);
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
