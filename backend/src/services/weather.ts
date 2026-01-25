/**
 * 天气服务
 * 使用 Open-Meteo API (免费，无需 API Key)
 */

import { WeatherData, ForecastDay } from '../types';

// WMO 天气代码解释
const getWeatherCondition = (code: number): string => {
  if (code === 0) return "晴";
  if (code <= 3) return "多云";
  if (code <= 48) return "雾";
  if (code <= 55) return "小雨";
  if (code <= 65) return "雨";
  if (code <= 77) return "雪";
  if (code <= 82) return "大雨";
  if (code <= 86) return "雪";
  if (code <= 99) return "雷雨";
  return "多云";
};

/**
 * 根据城市名获取天气
 */
export async function getWeatherForCity(city: string): Promise<WeatherData | null> {
  try {
    // 1. 地理编码
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh&format=json`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json() as any;

    if (!geoData.results || geoData.results.length === 0) {
      console.warn("City not found:", city);
      return null;
    }

    const { latitude, longitude, name } = geoData.results[0];

    // 2. 获取天气数据
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json() as any;

    const current = weatherData.current;
    const daily = weatherData.daily;

    // 处理预报
    const forecast: ForecastDay[] = [];
    for (let i = 1; i < Math.min(daily.time.length, 4); i++) {
      const date = new Date(daily.time[i]);
      forecast.push({
        day: date.toLocaleDateString('zh-CN', { weekday: 'short' }),
        min: Math.round(daily.temperature_2m_min[i]),
        max: Math.round(daily.temperature_2m_max[i]),
        condition: getWeatherCondition(daily.weather_code[i])
      });
    }

    const condition = getWeatherCondition(current.weather_code);
    const temp = Math.round(current.temperature_2m);

    let tempTip = "天气舒适。";
    if (temp < 10) tempTip = "天气较冷，注意保暖。";
    else if (temp > 30) tempTip = "天气炎热，注意防暑。";

    return {
      city: name,
      temp: temp,
      condition: condition,
      humidity: current.relative_humidity_2m,
      wind: `${current.wind_speed_10m}km/h`,
      airQuality: "良",
      forecast: forecast,
      tips: [tempTip, `今日${condition}，湿度${current.relative_humidity_2m}%。`]
    };

  } catch (e) {
    console.error("Weather service failed", e);
    return null;
  }
}

/**
 * 根据经纬度获取天气
 */
export async function getWeatherByLocation(lat: number, lng: number): Promise<WeatherData | null> {
  try {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json() as any;

    const current = weatherData.current;
    const daily = weatherData.daily;

    const forecast: ForecastDay[] = [];
    for (let i = 1; i < Math.min(daily.time.length, 4); i++) {
      const date = new Date(daily.time[i]);
      forecast.push({
        day: date.toLocaleDateString('zh-CN', { weekday: 'short' }),
        min: Math.round(daily.temperature_2m_min[i]),
        max: Math.round(daily.temperature_2m_max[i]),
        condition: getWeatherCondition(daily.weather_code[i])
      });
    }

    return {
      city: "本地",
      temp: Math.round(current.temperature_2m),
      condition: getWeatherCondition(current.weather_code),
      humidity: current.relative_humidity_2m,
      wind: `${current.wind_speed_10m}km/h`,
      airQuality: "良",
      forecast: forecast,
      tips: ["已定位到您的位置。", `当前气温 ${Math.round(current.temperature_2m)}°C`]
    };
  } catch (e) {
    console.error("Location weather failed", e);
    return null;
  }
}

/**
 * 根据 IP 获取天气
 * 如果 IP 定位失败，返回默认城市（北京）的天气
 */
export async function getWeatherByIP(): Promise<WeatherData | null> {
  try {
    console.log('[Weather] 尝试通过 IP 获取位置...');
    const ipRes = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(5000)
    });

    if (!ipRes.ok) {
      console.warn('[Weather] IP 定位服务响应异常:', ipRes.status);
      // 返回默认城市天气
      return await getWeatherForCity('北京');
    }

    const ipData = await ipRes.json() as any;
    console.log('[Weather] IP 定位结果:', ipData.city || '未知城市');

    if (ipData.city) {
      return await getWeatherForCity(ipData.city);
    } else if (ipData.latitude && ipData.longitude) {
      return await getWeatherByLocation(ipData.latitude, ipData.longitude);
    }
    
    // 如果无法获取位置，返回默认城市
    console.log('[Weather] 无法从 IP 获取位置，使用默认城市');
    return await getWeatherForCity('北京');
  } catch (e: any) {
    console.warn("[Weather] IP 定位失败:", e?.message || e);
    // 返回默认城市天气，而不是 null
    try {
      console.log('[Weather] 使用默认城市（北京）');
      return await getWeatherForCity('北京');
    } catch (fallbackError) {
      console.error('[Weather] 默认城市天气也获取失败:', fallbackError);
      return null;
    }
  }
}
