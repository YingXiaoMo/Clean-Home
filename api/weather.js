export default async function handler(req, res) {
  // 1. 获取用户 IP (处理多级代理)
  const forwarded = req.headers['x-forwarded-for'];
  const clientIP = forwarded ? forwarded.split(',')[0].trim() : (req.socket.remoteAddress || '');
  
  console.log(`[Vercel] Client IP: ${clientIP}`); // Debug log

  // 2. 环境变量
  const qweatherKey = process.env.VITE_QWEATHER_KEY;
  const qweatherHost = process.env.VITE_QWEATHER_HOST || 'https://devapi.qweather.com';
  const amapKey = process.env.VITE_AMAP_KEY;

  if (!qweatherKey && !amapKey) {
    return res.status(500).json({ success: false, message: 'Server Config Error: Missing Weather Keys' });
  }

  try {
    // 3. 第三方 IP 定位
    let cityName = '北京'; // 默认

    // A. 优先尝试 Vercel 自带定位 Header
    const vercelCity = req.headers['x-vercel-ip-city'];
    if (vercelCity) {
        cityName = decodeURIComponent(vercelCity);
        console.log(`[Vercel] Located via Header: ${cityName}`);
    } else {
        // B. 尝试 Vore
        try {
            const voreUrl = `https://api.vore.top/api/IPdata?ip=${clientIP}`;
            const voreRes = await fetch(voreUrl);
            const voreData = await voreRes.json();
            
            if (voreData.code === 200 && voreData.ipdata) {
                // 优先取 info2 (市)，没有则取 info1 (省/国)
                cityName = voreData.ipdata.info2 || voreData.ipdata.info1;
                cityName = cityName.replace(/市$/, '');
                console.log(`[Vercel] Located via Vore: ${cityName}`);
            }
        } catch (e) {
            console.warn('[Vercel] Vore lookup failed:', e.message);
        }
    }

    if (!cityName || cityName === '未知城市' || cityName === 'null') {
        cityName = '北京';
    }

    // 4. 优先尝试和风天气
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
                    return res.status(200).json({
                        success: true,
                        data: {
                            city: qCityName,
                            weather: now.text,
                            temperature: now.temp,
                            wind: `${now.windDir} ${now.windScale}级`,
                            updateTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
                            ip: clientIP,
                            source: '和风天气 (Vercel)'
                        }
                    });
                }
            }
        } catch (e) {
            console.error('[Vercel] QWeather failed:', e.message);
        }
    }

    // 5. 失败后尝试高德天气
    if (amapKey) {
        try {
            const amapUrl = `https://restapi.amap.com/v3/weather/weatherInfo?city=${encodeURIComponent(cityName)}&key=${amapKey}`;
            const amapRes = await fetch(amapUrl);
            const amapData = await amapRes.json();

            if (amapData.status === '1' && amapData.lives && amapData.lives.length > 0) {
                const live = amapData.lives[0];
                return res.status(200).json({
                    success: true,
                    data: {
                        city: live.city,
                        weather: live.weather,
                        temperature: live.temperature,
                        wind: `${live.winddirection}风 ${live.windpower}级`,
                        updateTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
                        ip: clientIP,
                        source: '高德天气 (Vercel)'
                    }
                });
            }
        } catch (e) {
            console.error('[Vercel] Amap failed:', e.message);
        }
    }

    return res.status(500).json({ success: false, message: 'All weather APIs failed' });

  } catch (error) {
    return res.status(500).json({ success: false, message: `Server Error: ${error.message}` });
  }
}