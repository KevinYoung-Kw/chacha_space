
import React, { useState, useEffect } from 'react';
import { WeatherData } from '../../types';
import { Sun, CloudRain, Wind, Thermometer, Umbrella, AlertTriangle, Shirt, MapPin, Cloud, CloudSnow, CloudLightning, CloudFog, Eye, Gauge, Droplets, Sparkles, Clock } from 'lucide-react';

interface WeatherPanelProps {
  weather: WeatherData;
}

const getWeatherIcon = (condition: string, size: number = 32, className?: string) => {
  const c = condition;
  if (c.includes('雷')) return <CloudLightning size={size} className={className || "text-yellow-300 drop-shadow-lg"} />;
  if (c.includes('雪')) return <CloudSnow size={size} className={className || "text-white drop-shadow-lg"} />;
  if (c.includes('大雨') || c.includes('暴雨')) return <CloudRain size={size} className={className || "text-blue-200 drop-shadow-lg"} />;
  if (c.includes('雨')) return <CloudRain size={size} className={className || "text-white drop-shadow-lg"} />;
  if (c.includes('雾') || c.includes('霾')) return <CloudFog size={size} className={className || "text-gray-200 drop-shadow-lg"} />;
  if (c.includes('阴') || c.includes('云')) return <Cloud size={size} className={className || "text-gray-100 drop-shadow-lg"} />;
  if (c.includes('晴')) return <Sun size={size} className={className || "text-yellow-300 drop-shadow-lg"} />;
  return <Sun size={size} className={className || "text-white drop-shadow-lg"} />;
};

const getForecastIcon = (condition: string, size: number = 24) => {
    if (condition.includes('雷')) return <CloudLightning size={size} className="text-purple-500" />;
    if (condition.includes('雪')) return <CloudSnow size={size} className="text-cyan-400" />;
    if (condition.includes('雨')) return <CloudRain size={size} className="text-blue-500" />;
    if (condition.includes('雾') || condition.includes('霾')) return <CloudFog size={size} className="text-slate-400" />;
    if (condition.includes('阴') || condition.includes('云')) return <Cloud size={size} className="text-gray-500" />;
    if (condition.includes('晴')) return <Sun size={size} className="text-orange-400" />;
    return <Sun size={size} className="text-orange-400" />;
}

const getBackgroundClass = (condition: string, temp: number) => {
    if (condition.includes('雷')) return 'bg-gradient-to-br from-slate-700 via-purple-900 to-slate-800';
    if (condition.includes('雨')) return 'bg-gradient-to-br from-slate-600 via-blue-700 to-slate-600';
    if (condition.includes('雪')) return 'bg-gradient-to-br from-blue-100 via-blue-300 to-indigo-200 text-blue-900';
    if (condition.includes('雾') || condition.includes('霾')) return 'bg-gradient-to-br from-slate-300 via-gray-400 to-slate-400 text-slate-800';
    if (condition.includes('晴')) {
        if (temp > 30) return 'bg-gradient-to-br from-orange-400 via-red-400 to-pink-500';
        return 'bg-gradient-to-br from-blue-400 via-blue-300 to-sky-200';
    }
    return 'bg-gradient-to-br from-slate-400 via-slate-500 to-gray-400';
};

const WeatherPanel: React.FC<WeatherPanelProps> = ({ weather }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const airQuality = weather.airQuality || "良";
  const bgClass = getBackgroundClass(weather.condition, weather.temp);
  const isLightBg = bgClass.includes('from-blue-100') || bgClass.includes('from-slate-300');
  const textColor = isLightBg ? 'text-slate-800' : 'text-white';
  const subTextColor = isLightBg ? 'text-slate-600' : 'text-white/80';

  return (
    <div className="h-full flex flex-col relative overflow-hidden font-sans">
      
      {/* Top Section: Time & Weather Dashboard */}
      <div className={`${bgClass} ${textColor} p-8 pb-10 relative overflow-hidden transition-all duration-700 flex-shrink-0`}>
        {/* Animated Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl animate-pulse-slow"></div>
        
        {/* Header content */}
        <div className="relative z-10 flex flex-col justify-between h-full gap-6">
            <div className="flex justify-between items-start">
                 <div className="bg-black/10 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-1.5 border border-white/10">
                    <MapPin size={14} className={textColor}/>
                    <span className="text-xs font-bold tracking-wide">{weather.city}</span>
                 </div>
                 <div className="flex flex-col items-end">
                     {/* Digital Clock */}
                     <span className="text-3xl font-bold tracking-tighter leading-none">
                        {time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                     </span>
                     <span className={`text-xs font-medium opacity-80 mt-1`}>
                        {time.toLocaleDateString('zh-CN', { weekday: 'long', month:'short', day:'numeric' })}
                     </span>
                 </div>
            </div>

            <div className="flex items-end justify-between">
                 <div>
                    <h1 className="text-6xl font-bold tracking-tighter drop-shadow-sm">{weather.temp}°</h1>
                    <p className={`text-xl font-medium mt-1 ${subTextColor} flex items-center gap-2`}>
                        {weather.condition} 
                        <span className="w-1 h-1 rounded-full bg-current opacity-50"></span>
                        <span className="text-base">{weather.wind || '微风'}</span>
                    </p>
                 </div>
                 <div className="flex flex-col items-center mb-2 animate-float">
                    {getWeatherIcon(weather.condition, 64, textColor)}
                 </div>
            </div>
        </div>
      </div>

      {/* Details Scroll Area */}
      <div className="flex-1 bg-white/50 relative overflow-y-auto custom-scrollbar">
        <div className="p-6 space-y-4">
            
            {/* AI Tip */}
             <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 p-4 text-white shadow-lg shadow-indigo-200/50">
                <div className="flex items-start gap-3 relative z-10">
                    <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm mt-0.5">
                        <Sparkles size={16} className="text-yellow-200" />
                    </div>
                    <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-violet-200 mb-1">今日贴士</h3>
                        <p className="text-sm font-medium leading-relaxed text-white/95">
                            {weather.tips && weather.tips.length > 0 ? weather.tips[0] : "今天是个好日子，记得保持微笑哦！"}
                        </p>
                    </div>
                </div>
             </div>
            
            {/* Environmental Stats */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/60 p-3 rounded-2xl border border-white/50 flex flex-col items-center justify-center text-center gap-1">
                    <Droplets size={18} className="text-blue-400 mb-1" />
                    <p className="text-[10px] text-gray-400 font-bold uppercase">湿度</p>
                    <p className="text-sm font-bold text-gray-700">{weather.humidity}%</p>
                </div>
                <div className="bg-white/60 p-3 rounded-2xl border border-white/50 flex flex-col items-center justify-center text-center gap-1">
                    <Gauge size={18} className="text-green-500 mb-1" />
                    <p className="text-[10px] text-gray-400 font-bold uppercase">空气</p>
                    <p className="text-sm font-bold text-gray-700">{airQuality}</p>
                </div>
            </div>

            {/* Forecast */}
            <div className="bg-white/60 rounded-2xl p-4 border border-white/50">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">未来趋势</h3>
                <div className="space-y-3">
                    {weather.forecast.map((day, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-600 w-10">{day.day}</span>
                            <div className="flex items-center gap-2 flex-1 justify-center">
                                {getForecastIcon(day.condition, 16)}
                                <span className="text-xs text-gray-500">{day.condition}</span>
                            </div>
                            <span className="text-sm font-bold text-gray-700">{day.max}° <span className="text-gray-400 font-normal text-xs">/ {day.min}°</span></span>
                        </div>
                    ))}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default WeatherPanel;
