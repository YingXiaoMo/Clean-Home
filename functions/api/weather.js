export async function onRequest(context) {
  const { request, env } = context;

  const clientIP = request.headers.get('CF-Connecting-IP');
  const url = new URL(request.url);
  const lat = url.searchParams.get('lat');
  const lon = url.searchParams.get('lon');

  console.log(`[Cloudflare] Client IP: ${clientIP}, Params: lat=${lat}, lon=${lon}`);

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

  const jsonResponse = (data) => new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });

  try {
    let locationParam = null;
    let cityName = '未知城市';
    let locationSource = 'IP';

    // 1. 确定定位信息 (GPS 优先 -> IP 兜底 -> CF Geo)
    if (lat && lon) {
        locationSource = 'GPS';
        locationParam = `${lon},${lat}`; // 和风的 geo lookup 支持经纬度

        // 如果有高德 Key，尝试通过高德逆地理编码获取城市名
        if (amapKey) {
            try {
                const regeoUrl = `https://restapi.amap.com/v3/geocode/regeo?location=${lon},${lat}&key=${amapKey}&extensions=base`;
                const regeoRes = await fetch(regeoUrl);
                const regeoData = await regeoRes.json();
                if (regeoData.status === '1' && regeoData.regeocode && regeoData.regeocode.addressComponent) {
                    cityName = regeoData.regeocode.addressComponent.city.length > 0 ? 
                               regeoData.regeocode.addressComponent.city[0] : 
                               regeoData.regeocode.addressComponent.province;
                    cityName = cityName.replace(/市$/, ''); // 确保城市名干净
                    console.log(`[Cloudflare] Amap Regeo City: ${cityName}`);
                }
            } catch (e) {
                console.warn('[Cloudflare] Amap Regeo failed:', e.message);
            }
        }
        if (cityName === '未知城市') cityName = '当前位置';

    } else {
        // IP 定位
        // A. 尝试 Vore
        try {
            const voreUrl = `https://api.vore.top/api/IPdata?ip=${clientIP}`;
            const voreRes = await fetch(voreUrl);
            const voreData = await voreRes.json();
            
            if (voreData.code === 200 && voreData.ipdata) {
                 cityName = voreData.ipdata.info2 || voreData.ipdata.info1;
                 cityName = cityName.replace(/市$/, '');
                 locationParam = cityName;
                 locationSource = 'Vore IP';
                 console.log(`[Cloudflare] Located via Vore: ${cityName}`);
            }
        } catch (e) {
            // B. 尝试 CF Geo (作为 IP 定位的最后兜底)
            if (context.request.cf && context.request.cf.city) {
                cityName = context.request.cf.city;
                locationParam = cityName;
                locationSource = 'Cloudflare Geo';
                console.log(`[Cloudflare] Located via CF Geo: ${cityName}`);
            }
        }
        
        if (!locationParam) {
            cityName = '北京';
            locationParam = '北京';
        }
    }

    // 2. 优先尝试和风天气
    if (qweatherKey) {
        try {
            const geoUrl = `${qweatherHost}/geo/v2/city/lookup?location=${encodeURIComponent(locationParam)}&key=${qweatherKey}&lang=zh`;
            const geoRes = await fetch(geoUrl);
            const geoData = await geoRes.json();
            
            if (geoData.code === '200' && geoData.location && geoData.location.length > 0) {
                const locationID = geoData.location[0].id;
                cityName = geoData.location[0].name; 

                const weatherUrl = `${qweatherHost}/v7/weather/now?location=${locationID}&key=${qweatherKey}&lang=zh`;
                const weatherRes = await fetch(weatherUrl);
                const weatherData = await weatherRes.json();

                if (weatherData.code === '200') {
                    const now = weatherData.now;
                    return jsonResponse({
                        success: true,
                        data: {
                            city: cityName,
                            weather: now.text,
                            temperature: now.temp,
                            wind: `${now.windDir} ${now.windScale}级`,
                            updateTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
                            ip: clientIP,
                            source: `和风天气 (${locationSource})`
                        }
                    });
                }
            }
        } catch (e) {
            console.error('[Cloudflare] QWeather failed:', e.message);
        }
    }

    // 3. 失败后尝试高德天气
    if (amapKey) {
        try {
            if (cityName && cityName !== '未知城市' && cityName !== '当前位置') {
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
                            source: `高德天气 (${locationSource})`
                        }
                    });
                }
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