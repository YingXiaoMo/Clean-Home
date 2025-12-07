export async function onRequest(context) {
  const { request, env } = context;

  // 1. 获取用户真实 IP
  const clientIP = request.headers.get('CF-Connecting-IP');
  
  // 环境变量
  const qweatherKey = env.VITE_QWEATHER_KEY;
  const qweatherHost = env.VITE_QWEATHER_HOST || 'https://devapi.qweather.com'; // 默认值作为兜底
  
  if (!qweatherKey) {
    return new Response(JSON.stringify({ success: false, message: 'Server Config Error: Missing QWeather Key' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
    });
  }

  // 辅助函数：标准化返回
  const jsonResponse = (data) => new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });

  try {
    // 2. 第三方 IP 定位 (尝试 Vore)
    // 注意：后端请求通常不受 CORS 限制
    let locationID = null;
    let cityName = '未知城市';
    
    // 优先尝试 Vore
    try {
        const voreUrl = `https://api.vore.top/api/IPdata?ip=${clientIP}`;
        const voreRes = await fetch(voreUrl);
        const voreData = await voreRes.json();
        
        if (voreData.code === 200 && voreData.ipdata) {
             // 拿到城市名称，例如 "北京市"
             cityName = voreData.ipdata.info2 || voreData.ipdata.info1;
             // 去掉 "市" 后缀，增加搜索命中率
             cityName = cityName.replace(/市$/, '');
        }
    } catch (e) {
        // Vore 失败，可以增加备用 API，或者直接用 CF 的城市名兜底
        if (request.cf && request.cf.city) {
            cityName = request.cf.city;
        }
    }

    if (!cityName) {
         // 实在获取不到，默认北京
         cityName = '北京';
    }

    // 3. 和风天气 - 城市搜索 API (获取 Location ID)
    // 这一步是必须的，因为和风天气推荐使用 Location ID 查询天气，而不是直接用中文名，更准
    const geoUrl = `${qweatherHost}/geo/v2/city/lookup?location=${encodeURIComponent(cityName)}&key=${qweatherKey}&lang=zh`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();
    
    if (geoData.code === '200' && geoData.location && geoData.location.length > 0) {
        locationID = geoData.location[0].id;
        cityName = geoData.location[0].name; // 修正为和风返回的标准名称
    } else {
        // 如果搜不到（比如国外IP），尝试直接用 IP 查和风（和风也支持 IP 查）
        // 或者直接报错
        return jsonResponse({ success: false, message: 'City Lookup Failed' });
    }

    // 4. 和风天气 - 实况天气 API
    const weatherUrl = `${qweatherHost}/v7/weather/now?location=${locationID}&key=${qweatherKey}&lang=zh`;
    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();

    if (weatherData.code === '200') {
        const now = weatherData.now;
        // 构造返回给前端的数据格式
        return jsonResponse({
            success: true,
            data: {
                city: cityName,
                weather: now.text,
                temperature: now.temp,
                wind: `${now.windDir} ${now.windScale}级`,
                updateTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
                ip: clientIP,
                source: '和风天气'
            }
        });
    } else {
        return jsonResponse({ success: false, message: `QWeather API Error: ${weatherData.code}` });
    }

  } catch (error) {
    return jsonResponse({ success: false, message: `Server Error: ${error.message}` });
  }
}