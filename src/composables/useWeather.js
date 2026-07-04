import { ref, onMounted, onUnmounted } from 'vue';
import dayjs from 'dayjs';
import { apiEndpoints } from '@/config';

const AMAP_BASE_URL = 'https://restapi.amap.com';
const DEFAULT_ADCODE = '110000'; 
const DEFAULT_CITY_NAME = '北京';

const userGeoAPIs = apiEndpoints.userGeoHosts
    .filter(host => host.startsWith('http'))
    .map((host, index) => ({
      name: `自建兜底 IP 定位 ${index + 1}`,
      url: `${host}/api/geo`, 
      host: host, 
      handler: (data) => {
        if (data && data.city && data.ip) {
          return { 
            city: data.city, 
            ip: data.ip, 
            latitude: data.latitude, 
            longitude: data.longitude
          }; 
        }
        return null;
      }
    }));

const FREE_IP_APIS = [
  { 
    name: 'Vore.top', 
    url: 'https://api.vore.top/api/IPdata', 
    handler: (data) => {
      if (data.code === 200 && data.ipdata) {
        return { city: data.ipdata.info2, ip: data.ipinfo?.text }; 
      }
      return null;
    }
  },
  { 
    name: 'Xxapi.cn', 
    url: 'https://v2.xxapi.cn/api/ip', 
    handler: (data) => {
      if (data.code === 200 && data.data) {
        const address = data.data.address || '';
        const cityMatch = address.match(/[^省市自治区 ]+(市|区|县)/);
        let city;
        if (cityMatch && cityMatch[0]) {
            city = cityMatch[0].replace(/(市|区|县)/, ''); 
        } else {
            city = address.replace(/中国|电信|移动|联通/g, '').trim() || address;
        }
        return { city: city, ip: data.data.ip };
      }
      return null;
    }
  }
];


const FETCH_TIMEOUT = 20000;

const fetchWithTimeout = (url, options = {}, timeout = FETCH_TIMEOUT) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
};

const weatherData = ref({
  city: '定位中...',
  weather: '--',
  temperature: '0',
  wind: '无数据',
  updateTime: ''
});
const loading = ref(true); 
const getLocationByAmap = async (key) => {
  if (!key) return null;
  try {
    const res = await fetchWithTimeout(`${AMAP_BASE_URL}/v3/ip?key=${key}`);
    const data = await res.json();
    if (data.status === '1' && typeof data.adcode === 'string' && data.adcode.length > 0) {
      console.log('📍 高德定位成功:', data.city, `(Adcode: ${data.adcode})`);
      return { 
        location: data.adcode, 
        cityName: data.city
      };
    }
  } catch (e) {
    console.warn('高德定位失败:', e);
  }
  return null;
};

const getLocationByUserApi = async () => {
    console.log('🔄 尝试自建兜底 IP 定位...');
    for (const api of userGeoAPIs) {
        try {
            const url = api.url;
            const res = await fetchWithTimeout(url);
            const data = await res.json();
            if (data && data.city && data.ip) {
                console.log(`✅ ${api.name} 成功: ${data.city}`);
                console.log(`📡 你的 IP: ${data.ip} (来源: ${api.name})`);
                return { 
                    location: data.city, 
                    cityName: data.city,
                    host: api.host, 
                    latitude: data.latitude, 
                    longitude: data.longitude
                };
            }
        } catch (e) {
            console.warn(`自建定位 ${api.name} 失败:`, e.message);
        }
    }
    return null;
};

const getLocationByFreeApi = async () => {
  console.log('🌍 尝试免费第三方 IP 定位 (Vore/Xxapi)...');
  for (const api of FREE_IP_APIS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); 
      const res = await fetch(api.url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const result = api.handler(data);
      const visitorIP = result?.ip;

      if (visitorIP) {
          console.log(`📡 你的 IP: ${visitorIP} (来源: ${api.name})`);
      } else if (result) {
          console.log(`📡 [${api.name}] 定位成功，IP 字段缺失或未返回`); 
      }

      if (result && result.city) {
        console.log(`✅ ${api.name} 定位成功:`, result.city);
        const cleanCity = result.city.replace(/市$/, ''); 
        return { 
          location: cleanCity, 
          cityName: cleanCity
        };
      }
    } catch (e) {
    }
  }
  
  return null;
};

const getQWeather = async (location, key, host) => {
  try {
    const geoUrl = `${host}/geo/v2/city/lookup?location=${encodeURIComponent(location)}&key=${key}`;
    const geoRes = await fetchWithTimeout(geoUrl);
    const geoData = await geoRes.json();

    if (geoData.code === '200' && geoData.location?.length > 0) {
      const locInfo = geoData.location[0];
      const weatherUrl = `${host}/v7/weather/now?location=${locInfo.id}&key=${key}`;
      const weatherRes = await fetchWithTimeout(weatherUrl);
      const weatherDataRes = await weatherRes.json();

      if (weatherDataRes.code === '200') {
        const now = weatherDataRes.now;
        return {
          success: true,
          data: {
            city: locInfo.name,
            weather: now.text,
            temperature: now.temp,
            wind: `${now.windDir} ${now.windScale}级`,
            updateTime: dayjs().format('HH:mm')
          }
        };
      }
    }
  } catch (e) {
    console.warn('和风天气请求失败:', e);
  }
  return { success: false };
};

const getAmapWeather = async (location, key) => {
  try {
    const url = `${AMAP_BASE_URL}/v3/weather/weatherInfo?city=${encodeURIComponent(location)}&key=${key}&extensions=base`;
    const res = await fetchWithTimeout(url);
    const data = await res.json();

    if (data.status === '1' && data.lives?.length > 0) {
      const live = data.lives[0];
      return {
        success: true,
        data: {
          city: live.city,
          weather: live.weather,
          temperature: live.temperature,
          wind: `${live.winddirection}风 ${live.windpower}级`,
          updateTime: live.reporttime ? live.reporttime.slice(11, 16) : dayjs().format('HH:mm')
        }
      };
    }
  } catch (e) {
    console.warn('高德天气失败:', e);
  }
  return { success: false };
};

const getVoreWeather = async () => {
  try {
    const url = 'https://api.vore.top/api/Weather';
    const res = await fetchWithTimeout(url);
    const data = await res.json();
    
    if (data.code === 200 && data.data) {
      let d = data.data;
      if (d.tianqi && typeof d.tianqi === 'object') {
        d = d.tianqi;
      }

      return {
        success: true,
        data: {
          city: d.city || '未知城市',
          weather: d.weather || d.tianqi || '未知',
          temperature: d.temp || d.temperature || '0',
          wind: d.wind || d.winddirection || '未知', 
          updateTime: dayjs().format('HH:mm')
        }
      };
    }
  } catch (e) {
    console.warn('Vore IP 天气获取失败:', e);
  }
  return { success: false };
};

const getUserWeather = async (host, lat, lon, city) => {
  try {
    const params = new URLSearchParams();
    if (lat && lon) {
      params.append('lat', lat);
      params.append('lon', lon);
    }
    params.append('city', city);
    const url = `${host}/api/weather?${params.toString()}`;
    const res = await fetchWithTimeout(url);
    const data = await res.json();
    
    if (data.status === 'ok' && data.data) {
      const d = data.data;
      const source = data.source || '自建源'; 
      return {
        success: true,
        data: {
          city: city, 
          weather: d.weather,
          temperature: d.temp,
          wind: d.wind,
          source: source, 
          updateTime: dayjs().format('HH:mm')
        }
      };
    }
  } catch (e) {
    console.warn('自建兜底天气 获取失败:', e);
  }
  return { success: false };
};

const fetchWeather = async () => {
  loading.value = true;
  weatherData.value.city = '定位中...'; 
  const amapKey = import.meta.env.VITE_AMAP_KEY;
  const qweatherKey = import.meta.env.VITE_QWEATHER_KEY;
  const qweatherHost = import.meta.env.VITE_QWEATHER_HOST;
  let locInfo = null;
  locInfo = await getLocationByFreeApi(); 
      if (!locInfo) {
        console.log('🔄 免费API定位失败，尝试高德定位...'); 
        locInfo = await getLocationByAmap(amapKey);
      }
  
      if (!locInfo) {
          console.log('🔄 高德定位失败，尝试自建兜底 IP 定位...'); 
          locInfo = await getLocationByUserApi();
      }
    
      const locationToUse = locInfo ? locInfo.location : DEFAULT_ADCODE;
      let cityName = locInfo ? locInfo.cityName : DEFAULT_CITY_NAME; 
      let result = null;
  
      if (!result && qweatherKey && qweatherHost) {
        const qRes = await getQWeather(locationToUse, qweatherKey, qweatherHost);
        if (qRes.success) {
          result = qRes.data;
          console.log('🌤️ 天气来源: 和风');
        }
      }
  
      if (!result && amapKey) {
        const aRes = await getAmapWeather(locationToUse, amapKey);
        if (aRes.success) {
          result = aRes.data;
          console.log('🌤️ 天气来源: 高德');
        }  
      }

      if (!result) {
        console.log('🔄 尝试 Vore IP 天气...');
        const vRes = await getVoreWeather();
        if (vRes.success) {
          if (!locInfo) {
            cityName = vRes.data.city; 
          }
          result = vRes.data;
          console.log('🌤️ 天气来源: Vore.top (IP)');
        }
      }
    
      if (!result) {
          const fallbackHost = locInfo?.host || apiEndpoints.userGeoHosts[0];
          if (fallbackHost) {  
              console.log('🔄 尝试自建兜底天气...');  
              const uRes = await getUserWeather(fallbackHost, locInfo?.latitude, locInfo?.longitude, cityName);  
              if (uRes.success) {  
                  result = uRes.data;  
                  console.log(`🌤️ 天气来源: 自建兜底 (${result.source})`); 
              } 
          }
      }

  if (result) {
    weatherData.value = result;
  } else {
    console.error('❌ 所有天气接口均失败');
    weatherData.value = {
      city: cityName,
      weather: '暂无数据',
      temperature: '-',
      wind: '-',
      updateTime: ''
    };
  }
  
  loading.value = false;
};

let weatherPromise = null;

export const useWeather = () => {
  if (!weatherPromise) {
    weatherPromise = fetchWeather();
  }

  let intervalId = null;

  onMounted(() => {
    intervalId = setInterval(fetchWeather, 30 * 60 * 1000);
  });

  onUnmounted(() => {
    if (intervalId) clearInterval(intervalId);
  });

  return { weatherData, loading, refreshWeather: fetchWeather };
};