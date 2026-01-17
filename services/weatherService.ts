
import { WeatherData } from "../types";

// WMO Weather Code interpretation
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

// Open-Meteo allows fetching weather without an API key, supporting CORS.
export const getWeatherForCity = async (city: string): Promise<WeatherData | null> => {
    try {
        // 1. Geocoding
        // language=zh ensures we try to get Chinese names if available
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh&format=json`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
             console.warn("City not found:", city);
             return null;
        }

        const { latitude, longitude, name } = geoData.results[0];

        // 2. Weather Data
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();

        const current = weatherData.current;
        const daily = weatherData.daily;

        // Forecast processing
        const forecast = [];
        // Start from index 1 (tomorrow), up to 3 days
        for(let i = 1; i < Math.min(daily.time.length, 4); i++) {
             const date = new Date(daily.time[i]);
             const dayName = date.toLocaleDateString('zh-CN', { weekday: 'short' });
             forecast.push({
                 day: dayName,
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
            city: name, // Uses the name returned by API (often localized if language=zh used)
            temp: temp,
            condition: condition,
            humidity: current.relative_humidity_2m,
            wind: `${current.wind_speed_10m}km/h`,
            airQuality: "良", // Open-Meteo doesn't provide AQI in free tier basic call, defaulting
            forecast: forecast,
            tips: [tempTip, `今日${condition}，湿度${current.relative_humidity_2m}%。`]
        };

    } catch (e) {
        console.error("Weather service failed", e);
        return null;
    }
}

export const getWeatherByLocation = async (lat: number, lng: number): Promise<WeatherData | null> => {
    try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();
        
        const current = weatherData.current;
        const daily = weatherData.daily;
        
        const forecast = [];
        for(let i = 1; i < Math.min(daily.time.length, 4); i++) {
             const date = new Date(daily.time[i]);
             forecast.push({
                 day: date.toLocaleDateString('zh-CN', { weekday: 'short' }),
                 min: Math.round(daily.temperature_2m_min[i]),
                 max: Math.round(daily.temperature_2m_max[i]),
                 condition: getWeatherCondition(daily.weather_code[i])
             });
        }

        return {
            city: "本地", // Generic name since we don't have reverse geocoding in this simple setup
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
};

export const getWeatherByIP = async (): Promise<WeatherData | null> => {
  try {
      // Use ipapi.co for IP-based location (Free tier, HTTPS, CORS friendly)
      const ipRes = await fetch('https://ipapi.co/json/', {
          // 添加超时和错误处理
          signal: AbortSignal.timeout(5000) // 5秒超时
      });
      
      // 检查响应状态
      if (!ipRes.ok) {
          console.warn(`IP API returned status ${ipRes.status}: ${ipRes.statusText}`);
          return null;
      }
      
      const ipData = await ipRes.json();
      
      if (ipData.city) {
          // Use the city name from IP to get full weather data
          return await getWeatherForCity(ipData.city);
      } else if (ipData.latitude && ipData.longitude) {
          // 如果有经纬度但没有城市名，直接使用经纬度
          return await getWeatherByLocation(ipData.latitude, ipData.longitude);
      }
  } catch (e: any) {
      // 更详细的错误信息
      if (e.name === 'TimeoutError') {
          console.warn("IP Geo request timeout");
      } else if (e.name === 'AbortError') {
          console.warn("IP Geo request aborted");
      } else {
          console.warn("IP Geo failed:", e.message || e);
      }
  }
  return null;
};
