export async function onRequest(context) {
  const { request, env } = context;

  // 1. 获取用户真实 IP
  const clientIP = request.headers.get('CF-Connecting-IP');
  console.log(`[Cloudflare] Client IP: ${clientIP}`);

  // 环境变量
  const qweatherKey = env.VITE_QWEATHER_KEY;
  const qweatherHost = env.VITE_QWEATHER_HOST || 'https://devapi.qweather.com';
  const amapKey = env.VITE_AMAP_KEY;
  
  if (!qweatherKey && !amapKey) {
    console.error('[Cloudflare] Missing Weather Keys');
    return new Response(JSON.stringify({ success: false, message: 'Server Config Error: Missing Weather Keys' }), { 
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
    let cityName = '北京'; // 默认
    
    // 优先尝试 Vore
    try {
        const voreUrl = `https://api.vore.top/api/IPdata?ip=${clientIP}`;
        const voreRes = await fetch(voreUrl);
        const voreData = await voreRes.json();
        
        if (voreData.code === 200 && voreData.ipdata) {
             cityName = voreData.ipdata.info2 || voreData.ipdata.info1;
             cityName = cityName.replace(/市$/, '');
             console.log(`[Cloudflare] Located via Vore: ${cityName}`);
        }
    } catch (e) {
        if (request.cf && request.cf.city) {
            cityName = request.cf.city;
            console.log(`[Cloudflare] Located via CF Geo: ${cityName}`);
        }
    }

    if (!cityName) cityName = '北京';

    // 3. 优先尝试和风天气
    if (qweatherKey) {
        try {
            const geoUrl = `${qweatherHost}/geo/v2/city/lookup?location=${encodeURIComponent(cityName)}&key=${qweatherKey}&lang=zh`;
            const geoRes = await fetch(geoUrl);
            const geoData = await geoRes.json();
            
            if (geoData.code === '200' && geoData.location && geoData.location.length > 0) {
                const locationID = geoData.location[0].id;
                const qCityName = geoData.location[0].name;

                const weatherUrl = `${qweatherHost}/v7/weather/now?location=${locationID}&key=${qweatherKey}&lang=zh`;
                const weatherRes = await fetch(weatherUrl);
                const weatherData = await weatherRes.json();

                if (weatherData.code === '200') {
                    const now = weatherData.now;
                    return jsonResponse({
                        success: true,
                        data: {
                            city: qCityName,
                            weather: now.text,
                            temperature: now.temp,
                            wind: `${now.windDir} ${now.windScale}级`,
                            updateTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
                            ip: clientIP,
                            source: '和风天气'
                        }
                    });
                }
            }
        } catch (e) {
            console.error('[Cloudflare] QWeather failed:', e.message);
        }
    }

    // 4. 失败后尝试高德天气
    if (amapKey) {
        try {
            const amapUrl = `https://restapi.amap.com/v3/weather/weatherInfo?city=${encodeURIComponent(cityName)}&key=${amapKey}`;
            const amapRes = await fetch(amapUrl);
            const amapData = await amapRes.json();

            if (amapData.status === '1' && amapData.lives && amapData.lives.length > 0) {
                const live = amapData.lives[0];
                return jsonResponse({
                    success: true,
                    data: {
                        city: live.city,
                        weather: live.weather,
                        temperature: live.temperature,
                        wind: `${live.winddirection}风 ${live.windpower}级`,
                        updateTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
                        ip: clientIP,
                        source: '高德天气'
                    }
                });
            }
        } catch (e) {
            console.error('[Cloudflare] Amap failed:', e.message);
        }
    }

    return jsonResponse({ success: false, message: 'All weather APIs failed' });

  } catch (error) {
    return jsonResponse({ success: false, message: `Server Error: ${error.message}` });
  }
}