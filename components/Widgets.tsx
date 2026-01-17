import React from 'react';
import { TodoItem, WeatherData } from '../types';
import { CloudRain, CheckCircle, Circle, Sun, Wind, Cloud, CloudSnow, CloudLightning, CloudFog, Droplets, Thermometer } from 'lucide-react';

interface WidgetsProps {
  todos: TodoItem[];
  weather: WeatherData | null;
  onToggleTodo: (id: string) => void;
}

const getWeatherIcon = (condition: string, size: number = 20) => {
  // Order matters: check for specific severe weather before general conditions
  if (condition.includes('雷')) return <CloudLightning size={size} className="text-purple-500" />;
  if (condition.includes('雪')) return <CloudSnow size={size} className="text-cyan-400" />;
  if (condition.includes('雨')) return <CloudRain size={size} className="text-blue-500" />;
  if (condition.includes('雾') || condition.includes('霾')) return <CloudFog size={size} className="text-slate-400" />;
  if (condition.includes('风') && !condition.includes('微风')) return <Wind size={size} className="text-blue-300" />;
  if (condition.includes('阴') || condition.includes('云')) return <Cloud size={size} className="text-gray-500" />;
  if (condition.includes('晴')) return <Sun size={size} className="text-orange-400" />;
  
  // Default fallback
  return <Sun size={size} className="text-orange-400" />;
};

const Widgets: React.FC<WidgetsProps> = ({ todos, weather, onToggleTodo }) => {
  return (
    <div className="grid grid-cols-1 gap-4 w-full max-w-md mx-auto">
      
      {/* Weather Widget */}
      <div className="glass-panel p-5 rounded-2xl shadow-sm transition-all hover:shadow-md group">
        <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-1">
          <Cloud size={12} /> 环境感知
        </h3>
        {weather ? (
          <div>
            {/* Current Weather */}
            <div className="flex items-center justify-between text-gray-800 mb-6">
              <div className="flex flex-col">
                <span className="text-3xl font-bold tracking-tighter flex items-start gap-1">
                    {weather.temp}
                    <span className="text-base font-normal text-gray-400 mt-1">°C</span>
                </span>
                <span className="text-sm font-medium text-gray-500 mt-1 flex items-center gap-1">
                    {weather.city} · {weather.condition}
                </span>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                 <div className="p-3 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-sm border border-gray-100">
                    {getWeatherIcon(weather.condition, 32)}
                 </div>
              </div>
            </div>

            {/* Weather Stats */}
            <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
                <div className="flex items-center gap-1.5 bg-blue-50/50 px-2 py-1 rounded-lg">
                    <Droplets size={12} className="text-blue-400"/>
                    <span>湿度 {weather.humidity}%</span>
                </div>
                <div className="flex items-center gap-1.5 bg-indigo-50/50 px-2 py-1 rounded-lg">
                    <Wind size={12} className="text-indigo-400"/>
                    <span>{weather.wind}</span>
                </div>
            </div>

            {/* Forecast Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent w-full mb-4" />

            {/* 3-Day Forecast */}
            <div className="grid grid-cols-3 gap-2">
              {weather.forecast.map((day, idx) => (
                <div key={idx} className="flex flex-col items-center justify-center p-2 rounded-xl hover:bg-white/60 transition-colors cursor-default">
                  <span className="text-[10px] font-bold text-gray-400 mb-1.5 uppercase">{day.day}</span>
                  <div className="mb-1.5 scale-90">
                    {getWeatherIcon(day.condition, 20)}
                  </div>
                  <span className="text-xs text-gray-700 font-bold">
                    {day.max}° <span className="text-gray-300 font-normal">/</span> {day.min}°
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm italic border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
             <div className="flex flex-col items-center gap-2">
                 <Sun size={24} className="text-gray-300 animate-spin-slow" />
                 <span>正在连接气象卫星...</span>
             </div>
          </div>
        )}
      </div>

      {/* Todo Widget */}
      <div className="glass-panel p-5 rounded-2xl shadow-sm transition-all hover:shadow-md max-h-60 overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-4">
             <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                <CheckCircle size={12} /> 任务清单
             </h3>
             <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-500 font-medium">
                 {todos.filter(t => !t.completed).length} 待办
             </span>
        </div>
        
        {todos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-gray-400 text-sm italic">
            <p>暂无进行中的任务</p>
            <p className="text-xs mt-1 text-blue-400 cursor-pointer hover:underline">告诉塔塔 "添加一个新任务"</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {todos.map(todo => (
              <li 
                key={todo.id} 
                onClick={() => onToggleTodo(todo.id)}
                className={`group flex items-center p-2.5 rounded-xl cursor-pointer transition-all duration-200 ${todo.completed ? 'bg-gray-50/50 opacity-60' : 'bg-white hover:bg-blue-50/30 hover:shadow-sm border border-transparent hover:border-blue-100'}`}
              >
                <div className={`mr-3 transition-colors ${todo.completed ? 'text-green-500' : 'text-gray-300 group-hover:text-blue-400'}`}>
                    {todo.completed ? <CheckCircle size={18} /> : <Circle size={18} />}
                </div>
                <span className={`flex-1 text-sm ${todo.completed ? 'line-through text-gray-400' : 'text-gray-700 font-medium'}`}>
                    {todo.text}
                </span>
                {todo.priority === 'high' && !todo.completed && (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-1" title="高优先级"></span>
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