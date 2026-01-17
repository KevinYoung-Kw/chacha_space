
import React from 'react';
import { WaterRecord, CalorieRecord, SleepRecord, ExerciseRecord } from '../../types';
import { Droplet, Flame, Moon, Activity, Plus, TrendingUp } from 'lucide-react';

interface HealthPanelProps {
  water: WaterRecord;
  calories: CalorieRecord;
  sleep: SleepRecord;
  exercise: ExerciseRecord;
  onAddWater: () => void;
}

const HealthPanel: React.FC<HealthPanelProps> = ({ water, calories, sleep, exercise, onAddWater }) => {
  const waterPercent = Math.min(100, (water.current / water.goal) * 100);

  // Helper to render a clean bar chart
  const renderChart = (data: { day: string; value: number }[], maxValue: number, barColorClass: string) => {
    return (
        <div className="flex items-end justify-between h-16 gap-1.5 mt-3">
            {data.map((d, i) => {
                const height = Math.max(8, Math.min(100, (d.value / maxValue) * 100));
                return (
                    <div key={i} className="flex flex-col items-center flex-1">
                        <div className="w-full bg-[var(--color-bg-accent)] rounded-md h-full relative overflow-hidden">
                             <div 
                                className={`absolute bottom-0 left-0 right-0 rounded-md transition-all duration-500 ${barColorClass}`}
                                style={{ height: `${height}%` }}
                             ></div>
                        </div>
                        <span className="text-[10px] font-medium text-[var(--color-text-muted)] mt-1">{d.day}</span>
                    </div>
                );
            })}
        </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-[var(--color-bg-warm)] font-sans">
      <div className="p-6 space-y-4">
        
        {/* Header */}
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Activity className="text-purple-500" size={20} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-[var(--color-text-primary)]">身体状态</h2>
                <p className="text-xs text-[var(--color-text-muted)]">Daily Health Tracking</p>
            </div>
        </div>

        {/* Water Card */}
        <div className="bg-white/60 border border-[var(--color-border-subtle)] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Droplet size={16} className="text-blue-500" />
                    </div>
                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">饮水量</span>
                </div>
                <div className="text-right">
                     <span className="text-xl font-bold text-[var(--color-text-primary)]">{water.current}</span>
                     <span className="text-xs text-[var(--color-text-muted)] ml-1">/ {water.goal} ml</span>
                </div>
            </div>

            <div className="h-2 bg-[var(--color-bg-accent)] rounded-full overflow-hidden mb-3">
                <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                    style={{ width: `${waterPercent}%` }}
                />
            </div>
            
            <button 
                onClick={onAddWater} 
                className="w-full py-2.5 bg-blue-500 text-white rounded-xl font-semibold text-sm hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
            >
                <Plus size={16} strokeWidth={2.5} /> 
                喝水打卡
            </button>
        </div>

        {/* Calories Card */}
        <div className="bg-white/60 border border-[var(--color-border-subtle)] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Flame size={16} className="text-orange-500" />
                    </div>
                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">热量摄入</span>
                </div>
                <div className="text-right">
                     <span className="text-xl font-bold text-[var(--color-text-primary)]">{calories.current}</span>
                     <span className="text-xs text-[var(--color-text-muted)] ml-1">kcal</span>
                </div>
            </div>

            {/* Macro Bars */}
            <div className="space-y-2">
                {[
                    { label: '蛋白质', val: calories.macros.protein, color: 'bg-orange-400' },
                    { label: '碳水', val: calories.macros.carbs, color: 'bg-amber-400' },
                    { label: '脂肪', val: calories.macros.fat, color: 'bg-rose-400' }
                ].map(m => (
                    <div key={m.label} className="flex items-center gap-2 text-xs">
                        <span className="w-12 font-medium text-[var(--color-text-muted)]">{m.label}</span>
                        <div className="flex-1 h-1.5 bg-[var(--color-bg-accent)] rounded-full overflow-hidden">
                            <div className={`h-full ${m.color} rounded-full`} style={{width: '60%'}}></div>
                        </div>
                        <span className="w-8 text-right font-semibold text-[var(--color-text-secondary)]">{m.val}g</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Sleep Card */}
        <div className="bg-white/60 border border-[var(--color-border-subtle)] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Moon size={16} className="text-indigo-500" />
                    </div>
                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">睡眠分析</span>
                </div>
                <div className="text-right">
                     <span className="text-xl font-bold text-[var(--color-text-primary)]">{sleep.current}</span>
                     <span className="text-xs text-[var(--color-text-muted)] ml-1">小时</span>
                </div>
            </div>

            {renderChart(sleep.history.map(h => ({day: h.day, value: h.hours})), 10, 'bg-indigo-400')}
        </div>

        {/* Exercise Card */}
        <div className="bg-white/60 border border-[var(--color-border-subtle)] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <TrendingUp size={16} className="text-emerald-500" />
                    </div>
                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">运动追踪</span>
                </div>
                <div className="text-right">
                     <span className="text-xl font-bold text-[var(--color-text-primary)]">{exercise.current}</span>
                     <span className="text-xs text-[var(--color-text-muted)] ml-1">分钟</span>
                </div>
            </div>

            {renderChart(exercise.history.map(h => ({day: h.day, value: h.minutes})), 90, 'bg-emerald-400')}
        </div>

      </div>
    </div>
  );
};

export default HealthPanel;
