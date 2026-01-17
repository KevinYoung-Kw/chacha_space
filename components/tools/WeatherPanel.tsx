
import React, { useState, useEffect } from 'react';
import { WeatherData } from '../../types';
import { Sun, CloudRain, Wind, MapPin, Cloud, CloudSnow, CloudLightning, CloudFog, Droplets, Gauge, Lightbulb } from 'lucide-react';

interface WeatherPanelProps {
  weather: WeatherData;
}

const getWeatherIcon = (condition: string, size: number = 32, className?: string) => {
  const c = condition;
  if (c.includes('雷')) return <CloudLightning size={size} className={className || "text-purple-500"} />;
  if (c.includes('雪')) return <CloudSnow size={size} className={className || "text-blue-400"} />;
  if (c.includes('大雨') || c.includes('暴雨')) return <CloudRain size={size} className={className || "text-blue-500"} />;
  if (c.includes('雨')) return <CloudRain size={size} className={className || "text-blue-400"} />;
  if (c.includes('雾') || c.includes('霾')) return <CloudFog size={size} className={className || "text-gray-400"} />;
  if (c.includes('阴') || c.includes('云')) return <Cloud size={size} className={className || "text-gray-400"} />;
  if (c.includes('晴')) return <Sun size={size} className={className || "text-amber-500"} />;
  return <Sun size={size} className={className || "text-amber-500"} />;
};

const WeatherPanel: React.FC<WeatherPanelProps> = ({ weather }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const airQuality = weather.airQuality || "良";

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg-warm)] font-sans">
      
      {/* Header Section */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-1.5 text-[var(--color-text-muted)] text-xs font-medium mb-1">
            <MapPin size={12} />
            <span>{weather.city}</span>
        </div>
        <div className="flex items-end justify-between">
            <div>
                <h1 className="text-5xl font-bold text-[var(--color-text-primary)] tracking-tighter">{weather.temp}°</h1>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1 flex items-center gap-2">
                    {weather.condition} 
                    <span className="w-1 h-1 rounded-full bg-[var(--color-text-muted)]"></span>
                    <span>{weather.wind || '微风'}</span>
                </p>
            </div>
            <div className="mb-2">
                {getWeatherIcon(weather.condition, 48)}
            </div>
        </div>
      </div>

      {/* Time Display */}
      <div className="px-6 pb-4">
        <div className="bg-white/60 border border-[var(--color-border-subtle)] rounded-2xl p-4 flex items-center justify-between">
            <div>
                <p className="text-xs text-[var(--color-text-muted)] mb-0.5">当前时间</p>
                <p className="text-lg font-bold text-[var(--color-text-primary)]">
                    {time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
            <div className="text-right">
                <p className="text-xs text-[var(--color-text-muted)] mb-0.5">日期</p>
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                    {time.toLocaleDateString('zh-CN', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
            </div>
        </div>
      </div>

      {/* Details Scroll Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6 space-y-4">
          
          {/* AI Tip */}
          {weather.tips && weather.tips.length > 0 && (
            <div className="bg-white/60 border border-[var(--color-border-subtle)] rounded-2xl p-4">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Lightbulb size={16} className="text-amber-500" />
                    </div>
                    <div>
                        <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1">今日贴士</h3>
                        <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
                            {weather.tips[0]}
                        </p>
                    </div>
                </div>
            </div>
          )}
          
          {/* Environmental Stats */}
          <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/60 border border-[var(--color-border-subtle)] p-4 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                      <Droplets size={16} className="text-blue-400" />
                      <span className="text-xs font-medium text-[var(--color-text-muted)]">湿度</span>
                  </div>
                  <p className="text-xl font-bold text-[var(--color-text-primary)]">{weather.humidity}%</p>
              </div>
              <div className="bg-white/60 border border-[var(--color-border-subtle)] p-4 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                      <Gauge size={16} className="text-green-500" />
                      <span className="text-xs font-medium text-[var(--color-text-muted)]">空气质量</span>
                  </div>
                  <p className="text-xl font-bold text-[var(--color-text-primary)]">{airQuality}</p>
              </div>
          </div>

          {/* Forecast */}
          <div className="bg-white/60 border border-[var(--color-border-subtle)] rounded-2xl p-4">
              <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-3">未来天气</h3>
              <div className="space-y-3">
                  {weather.forecast.map((day, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-[var(--color-text-secondary)] w-12">{day.day}</span>
                          <div className="flex items-center gap-2 flex-1 justify-center">
                              {getWeatherIcon(day.condition, 18)}
                              <span className="text-xs text-[var(--color-text-muted)]">{day.condition}</span>
                          </div>
                          <div className="text-right">
                              <span className="text-sm font-bold text-[var(--color-text-primary)]">{day.max}°</span>
                              <span className="text-xs text-[var(--color-text-muted)] ml-1">/ {day.min}°</span>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

      </div>
    </div>
  );
};

export default WeatherPanel;
