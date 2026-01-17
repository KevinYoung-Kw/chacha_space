import React from 'react';
import { TodoItem, WeatherData } from '../types';
import { CloudRain, CheckCircle, Circle, Sun, Wind, Cloud, CloudSnow, CloudLightning, CloudFog, Droplets } from 'lucide-react';

interface WidgetsProps {
  todos: TodoItem[];
  weather: WeatherData | null;
  onToggleTodo: (id: string) => void;
}

const getWeatherIcon = (condition: string, size: number = 20) => {
  if (condition.includes('雷')) return <CloudLightning size={size} className="text-purple-500" />;
  if (condition.includes('雪')) return <CloudSnow size={size} className="text-cyan-400" />;
  if (condition.includes('雨')) return <CloudRain size={size} className="text-blue-500" />;
  if (condition.includes('雾') || condition.includes('霾')) return <CloudFog size={size} className="text-slate-400" />;
  if (condition.includes('风') && !condition.includes('微风')) return <Wind size={size} className="text-blue-300" />;
  if (condition.includes('阴') || condition.includes('云')) return <Cloud size={size} className="text-gray-500" />;
  if (condition.includes('晴')) return <Sun size={size} className="text-amber-500" />;
  return <Sun size={size} className="text-amber-500" />;
};

const Widgets: React.FC<WidgetsProps> = ({ todos, weather, onToggleTodo }) => {
  return (
    <div className="grid grid-cols-1 gap-4 w-full max-w-md mx-auto">
      
      {/* Weather Widget */}
      <div className="bg-white/60 border border-[var(--color-border-subtle)] p-5 rounded-2xl transition-colors hover:bg-white/80">
        <h3 className="text-[var(--color-text-muted)] text-[10px] font-semibold uppercase tracking-wide mb-4 flex items-center gap-1">
          <Cloud size={12} /> 环境感知
        </h3>
        {weather ? (
          <div>
            {/* Current Weather */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tighter flex items-start gap-1">
                    {weather.temp}
                    <span className="text-base font-normal text-[var(--color-text-muted)] mt-1">°C</span>
                </span>
                <span className="text-sm font-medium text-[var(--color-text-secondary)] mt-1">
                    {weather.city} · {weather.condition}
                </span>
              </div>
              
              <div className="w-14 h-14 bg-[var(--color-bg-accent)] rounded-2xl flex items-center justify-center">
                {getWeatherIcon(weather.condition, 28)}
              </div>
            </div>

            {/* Weather Stats */}
            <div className="flex items-center gap-3 mb-4 text-xs text-[var(--color-text-muted)]">
                <div className="flex items-center gap-1.5 bg-[var(--color-bg-accent)] px-2.5 py-1.5 rounded-lg">
                    <Droplets size={12} className="text-blue-400"/>
                    <span>湿度 {weather.humidity}%</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[var(--color-bg-accent)] px-2.5 py-1.5 rounded-lg">
                    <Wind size={12} className="text-indigo-400"/>
                    <span>{weather.wind}</span>
                </div>
            </div>

            {/* Forecast Divider */}
            <div className="h-px bg-[var(--color-border-subtle)] w-full mb-4" />

            {/* 3-Day Forecast */}
            <div className="grid grid-cols-3 gap-2">
              {weather.forecast.map((day, idx) => (
                <div key={idx} className="flex flex-col items-center justify-center p-2 rounded-xl hover:bg-[var(--color-bg-accent)] transition-colors">
                  <span className="text-[10px] font-semibold text-[var(--color-text-muted)] mb-1.5 uppercase">{day.day}</span>
                  <div className="mb-1.5">
                    {getWeatherIcon(day.condition, 18)}
                  </div>
                  <span className="text-xs text-[var(--color-text-primary)] font-semibold">
                    {day.max}° <span className="text-[var(--color-text-muted)] font-normal">/</span> {day.min}°
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-[var(--color-text-muted)] text-sm border border-dashed border-[var(--color-border-subtle)] rounded-2xl bg-[var(--color-bg-accent)]/30">
             <div className="flex flex-col items-center gap-2">
                 <Sun size={24} className="text-[var(--color-text-muted)] animate-spin" style={{ animationDuration: '3s' }} />
                 <span>正在获取天气...</span>
             </div>
          </div>
        )}
      </div>

      {/* Todo Widget */}
      <div className="bg-white/60 border border-[var(--color-border-subtle)] p-5 rounded-2xl transition-colors hover:bg-white/80 max-h-60 overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-4">
             <h3 className="text-[var(--color-text-muted)] text-[10px] font-semibold uppercase tracking-wide flex items-center gap-1">
                <CheckCircle size={12} /> 任务清单
             </h3>
             <span className="text-[10px] bg-[var(--color-bg-accent)] px-2 py-0.5 rounded-full text-[var(--color-text-secondary)] font-medium">
                 {todos.filter(t => !t.completed).length} 待办
             </span>
        </div>
        
        {todos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-[var(--color-text-muted)] text-sm">
            <p>暂无进行中的任务</p>
            <p className="text-xs mt-1 text-[var(--color-accent-rose)]">告诉叉叉「添加一个新任务」</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {todos.map(todo => (
              <li 
                key={todo.id} 
                onClick={() => onToggleTodo(todo.id)}
                className={`group flex items-center p-2.5 rounded-xl cursor-pointer transition-colors ${todo.completed ? 'bg-transparent opacity-50' : 'bg-white/60 border border-[var(--color-border-subtle)] hover:bg-white/80'}`}
              >
                <div className={`mr-3 transition-colors ${todo.completed ? 'text-green-500' : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-rose)]'}`}>
                    {todo.completed ? <CheckCircle size={18} /> : <Circle size={18} />}
                </div>
                <span className={`flex-1 text-sm ${todo.completed ? 'line-through text-[var(--color-text-muted)]' : 'text-[var(--color-text-primary)] font-medium'}`}>
                    {todo.text}
                </span>
                {todo.priority === 'high' && !todo.completed && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-rose)]" title="高优先级"></span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
};

export default Widgets;
