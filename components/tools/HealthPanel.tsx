
import React from 'react';
import { WaterRecord, CalorieRecord, SleepRecord, ExerciseRecord } from '../../types';
import { Droplet, Flame, Moon, Activity, Plus, TrendingUp, Utensils } from 'lucide-react';

interface HealthPanelProps {
  water: WaterRecord;
  calories: CalorieRecord;
  sleep: SleepRecord;
  exercise: ExerciseRecord;
  onAddWater: () => void;
}

const HealthPanel: React.FC<HealthPanelProps> = ({ water, calories, sleep, exercise, onAddWater }) => {
  const waterPercent = Math.min(100, (water.current / water.goal) * 100);
  const caloriePercent = Math.min(100, (calories.current / calories.goal) * 100);
  const exercisePercent = Math.min(100, (exercise.current / exercise.goal) * 100);

  // Helper to render a clean bar chart
  const renderChart = (data: { day: string; value: number }[], maxValue: number, barColorClass: string, labelColor: string = "text-gray-400") => {
    return (
        <div className="flex items-end justify-between h-20 gap-2 mt-4">
            {data.map((d, i) => {
                const height = Math.max(10, Math.min(100, (d.value / maxValue) * 100));
                return (
                    <div key={i} className="flex flex-col items-center flex-1 group cursor-pointer relative">
                        <div className="w-full bg-black/5 rounded-t-md h-full relative overflow-hidden">
                             <div 
                                className={`absolute bottom-0 left-0 right-0 rounded-t-md transition-all duration-700 ease-out ${barColorClass} group-hover:opacity-80`}
                                style={{ height: `${height}%` }}
                             ></div>
                        </div>
                        <span className={`text-[10px] font-bold ${labelColor} mt-1.5`}>{d.day}</span>
                        
                        {/* Tooltip */}
                        <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-all bg-gray-800 text-white text-[10px] px-2 py-1 rounded-md shadow-lg font-bold z-10 whitespace-nowrap">
                            {d.value}
                        </div>
                    </div>
                );
            })}
        </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-gray-50/50 p-5 font-sans">
      <div className="max-w-3xl mx-auto space-y-5 pb-8">
        
        {/* Header */}
        <div className="flex items-center gap-2 px-1">
            <div className="p-2 bg-white rounded-xl shadow-sm">
                <Activity className="text-violet-500" size={20} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-800">身体状态</h2>
                <p className="text-[10px] text-gray-400 font-medium">Daily Health Tracking</p>
            </div>
        </div>

        {/* Water & Calories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Water Card */}
            <div className="col-span-1 bg-gradient-to-b from-sky-400 to-blue-600 rounded-[2rem] p-6 text-white shadow-lg shadow-blue-200 relative overflow-hidden group">
                {/* Wave Animation Background */}
                <div className="absolute bottom-0 left-0 right-0 h-1/2 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/washi.png')] mix-blend-overlay"></div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                    <div className="flex justify-between items-start">
                        <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md border border-white/10">
                            <Droplet size={20} fill="white" className="text-white" />
                        </div>
                        <div className="text-right">
                             <span className="text-4xl font-bold tracking-tighter">{water.current}</span>
                             <p className="text-sky-100 text-xs font-medium opacity-80">/ {water.goal} ml</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="relative h-4 bg-black/20 rounded-full overflow-hidden border border-white/10 shadow-inner">
                            {/* Animated Liquid Bar */}
                             <div 
                                className="absolute top-0 left-0 bottom-0 bg-white/90 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(255,255,255,0.6)]" 
                                style={{ width: `${waterPercent}%` }}
                             >
                                 <div className="absolute top-0 right-0 bottom-0 w-2 bg-white/50 blur-[2px]"></div>
                             </div>
                        </div>
                        <button 
                            onClick={onAddWater} 
                            className="w-full py-3 bg-white text-blue-600 rounded-xl font-bold shadow-lg shadow-black/10 hover:bg-sky-50 transition-colors flex items-center justify-center gap-2 active:scale-95 group-hover:-translate-y-0.5"
                        >
                            <Plus size={16} strokeWidth={3} /> 
                            <span className="text-sm">喝水打卡</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Calories Card */}
            <div className="col-span-1 bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 relative flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                     <div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold text-gray-800 tracking-tight">{calories.current}</span>
                            <span className="text-xs text-gray-400 font-bold uppercase">kcal</span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium mt-1">Goal: {calories.goal}</p>
                     </div>
                     <div className="bg-orange-50 p-2.5 rounded-xl text-orange-500">
                        <Flame size={20} fill="currentColor" />
                    </div>
                </div>

                {/* Macro Bars */}
                <div className="space-y-3 mt-2">
                    {[
                        { label: 'Protein', val: calories.macros.protein, color: 'bg-orange-500', bg: 'bg-orange-100' },
                        { label: 'Carbs', val: calories.macros.carbs, color: 'bg-yellow-500', bg: 'bg-yellow-100' },
                        { label: 'Fat', val: calories.macros.fat, color: 'bg-red-500', bg: 'bg-red-100' }
                    ].map(m => (
                        <div key={m.label} className="flex items-center gap-2 text-xs">
                            <span className="w-10 font-bold text-gray-400 text-[10px] uppercase">{m.label}</span>
                            <div className={`flex-1 h-2 ${m.bg} rounded-full overflow-hidden`}>
                                <div className={`h-full ${m.color} rounded-full`} style={{width: '60%'}}></div>
                            </div>
                            <span className="w-8 text-right font-bold text-gray-700">{m.val}g</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Sleep Analysis */}
        <div className="bg-[#1a1b4b] rounded-[2rem] p-6 text-white relative overflow-hidden shadow-xl shadow-indigo-900/20 group">
            {/* Animated Stars */}
            <div className="absolute top-4 right-8 w-1 h-1 bg-white rounded-full opacity-60 animate-pulse"></div>
            <div className="absolute top-12 right-20 w-1.5 h-1.5 bg-purple-300 rounded-full opacity-40 animate-pulse delay-75"></div>
            <div className="absolute bottom-8 left-12 w-1 h-1 bg-indigo-200 rounded-full opacity-50 animate-pulse delay-150"></div>
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl"></div>
            
            <div className="flex justify-between items-start relative z-10 mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-500/30 p-2.5 rounded-xl backdrop-blur-md border border-white/10 shadow-inner">
                        <Moon size={20} className="text-indigo-200" fill="currentColor" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">睡眠分析</h3>
                        <p className="text-indigo-200/60 text-[10px] uppercase tracking-wider">Last Night</p>
                    </div>
                </div>
                <div className="text-right">
                     <div className="flex items-baseline justify-end gap-1">
                        <span className="text-4xl font-bold tracking-tighter text-indigo-50">{sleep.current}</span>
                        <span className="text-sm text-indigo-300">h</span>
                     </div>
                     <span className="text-[10px] bg-indigo-900/50 px-2 py-0.5 rounded text-indigo-200 border border-white/5">
                        Quality: Good
                     </span>
                </div>
            </div>

            <div className="relative z-10 bg-black/20 rounded-xl p-4 border border-white/5 backdrop-blur-sm">
                {renderChart(sleep.history.map(h => ({day: h.day, value: h.hours})), 12, 'bg-indigo-400', 'text-indigo-300')}
            </div>
        </div>

        {/* Exercise Card */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                     <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600">
                         <Activity size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">运动追踪</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">This Week</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-3xl font-bold text-gray-800">{exercise.current}</span>
                    <span className="text-xs font-bold text-gray-400 uppercase mt-2">min</span>
                </div>
            </div>
            
             <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                 {renderChart(exercise.history.map(h => ({day: h.day, value: h.minutes})), 90, 'bg-gradient-to-t from-emerald-500 to-emerald-300')}
             </div>
        </div>

      </div>
    </div>
  );
};

export default HealthPanel;
