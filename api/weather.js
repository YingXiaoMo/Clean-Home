export default async function handler(req, res) {
  const clientIP = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : (req.socket.remoteAddress || '');
  const { lat, lon } = req.query;

  console.log(`[Vercel] Client IP: ${clientIP}, Params: lat=${lat}, lon=${lon}`);

  const qweatherKey = process.env.VITE_QWEATHER_KEY;
  const qweatherHost = process.env.VITE_QWEATHER_HOST || 'https://devapi.qweather.com';
  const amapKey = process.env.VITE_AMAP_KEY;

  if (!qweatherKey && !amapKey) {
    return res.status(500).json({ success: false, message: 'Server Config Error: Missing Weather Keys' });
  }

  try {
    let locationParam = null; // 用于和风查询的 location 参数 (可能是 lon,lat 或 城市名)
    let cityName = '未知城市'; // 用于高德查询和前端显示
    let locationSource = 'IP';

    // 1. 确定定位信息 (GPS 优先 -> IP 兜底)
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
                    console.log(`[Vercel] Amap Regeo City: ${cityName}`);
                }
            } catch (e) {
                console.warn('[Vercel] Amap Regeo failed:', e.message);
            }
        }
        if (cityName === '未知城市') cityName = '当前位置'; 

    } else {
        // IP 定位 (Vercel Header -> Vore)
        const vercelCity = req.headers['x-vercel-ip-city'];
        if (vercelCity) {
            cityName = decodeURIComponent(vercelCity);
            locationParam = cityName;
            locationSource = 'Vercel Header';
            console.log(`[Vercel] Located via Header: ${cityName}`);
        } else {
            try {
                const voreUrl = `https://api.vore.top/api/IPdata?ip=${clientIP}`;
                const voreRes = await fetch(voreUrl);
                const voreData = await voreRes.json();
                if (voreData.code === 200 && voreData.ipdata) {
                    cityName = voreData.ipdata.info2 || voreData.ipdata.info1;
                    cityName = cityName.replace(/市$/, '');
                    locationParam = cityName;
                    locationSource = 'Vore IP';
                    console.log(`[Vercel] Located via Vore: ${cityName}`);
                }
            } catch (e) {
                console.warn('[Vercel] Vore IP lookup failed:', e.message);
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
                    return res.status(200).json({
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
            console.error('[Vercel] QWeather failed:', e.message);
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
                    return res.status(200).json({
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
            console.error('[Vercel] Amap failed:', e.message);
        }
    }

    return res.status(500).json({ success: false, message: 'All weather APIs failed' });

  } catch (error) {
    return res.status(500).json({ success: false, message: `Server Error: ${error.message}` });
  }
}