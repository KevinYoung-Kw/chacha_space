
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

// 圆环组件 - Apple Watch 风格
interface ActivityRingProps {
  progress: number; // 0-100
  radius: number;
  strokeWidth: number;
  color: string;
  glowColor: string;
}

const ActivityRing: React.FC<ActivityRingProps> = ({ progress, radius, strokeWidth, color, glowColor }) => {
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const centerX = 100;
  const centerY = 100;

  return (
    <g>
      {/* 背景圆环 */}
      <circle
        cx={centerX}
        cy={centerY}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* 进度圆环 */}
      <circle
        cx={centerX}
        cy={centerY}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${centerX} ${centerY})`}
        style={{
          filter: `drop-shadow(0 0 8px ${glowColor})`,
          transition: 'stroke-dashoffset 1s ease-out'
        }}
      />
    </g>
  );
};

const HealthPanel: React.FC<HealthPanelProps> = ({ water, calories, sleep, exercise, onAddWater }) => {
  // 计算百分比
  const waterPercent = Math.min(100, (water.current / water.goal) * 100);
  const caloriesPercent = Math.min(100, (calories.current / calories.goal) * 100);
  const sleepPercent = Math.min(100, (sleep.current / sleep.goal) * 100);
  const exercisePercent = Math.min(100, (exercise.current / exercise.goal) * 100);

  // Helper to render a clean bar chart
  const renderChart = (data: { day: string; value: number }[], maxValue: number, barColorClass: string) => {
    return (
        <div className="flex items-end justify-between h-12 gap-1.5 mt-2">
            {data.map((d, i) => {
                const height = Math.max(8, Math.min(100, (d.value / maxValue) * 100));
                return (
                    <div key={i} className="flex flex-col items-center flex-1">
                        <div className="w-full bg-white/30 rounded-md h-full relative overflow-hidden">
                             <div 
                                className={`absolute bottom-0 left-0 right-0 rounded-md transition-all duration-500 ${barColorClass}`}
                                style={{ height: `${height}%` }}
                             ></div>
                        </div>
                        <span className="text-[9px] font-medium text-[var(--color-text-muted)] mt-0.5">{d.day}</span>
                    </div>
                );
            })}
        </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-gradient-to-br from-[#1c1c1e] via-[#2c2c2e] to-[#1c1c1e] font-sans">
      <div className="p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <Activity className="text-white" size={20} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-white">活动记录</h2>
                <p className="text-xs text-gray-400">Activity Rings</p>
            </div>
        </div>

        {/* 主圆环 - Apple Watch 风格 */}
        <div className="relative bg-black/40 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl">
          {/* SVG 圆环 */}
          <div className="flex items-center justify-center mb-6">
            <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
              {/* 运动圆环 (外圈 - 绿色) */}
              <ActivityRing 
                progress={exercisePercent} 
                radius={85} 
                strokeWidth={12} 
                color="#7AFF45" 
                glowColor="rgba(122, 255, 69, 0.6)"
              />
              {/* 热量圆环 (中圈 - 红色/橙色) */}
              <ActivityRing 
                progress={caloriesPercent} 
                radius={68} 
                strokeWidth={12} 
                color="#FA233D" 
                glowColor="rgba(250, 35, 61, 0.6)"
              />
              {/* 饮水圆环 (内圈 - 蓝色) */}
              <ActivityRing 
                progress={waterPercent} 
                radius={51} 
                strokeWidth={12} 
                color="#00D4FF" 
                glowColor="rgba(0, 212, 255, 0.6)"
              />
            </svg>
          </div>

          {/* 圆环数据标签 */}
          <div className="grid grid-cols-3 gap-3 text-center">
            {/* 运动 */}
            <div className="space-y-1">
              <div className="w-3 h-3 rounded-full bg-[#7AFF45] mx-auto shadow-lg shadow-green-500/50"></div>
              <div className="text-xs text-gray-400">运动</div>
              <div className="text-lg font-bold text-white">{exercise.current}</div>
              <div className="text-[10px] text-gray-500">/ {exercise.goal}分钟</div>
            </div>

            {/* 热量 */}
            <div className="space-y-1">
              <div className="w-3 h-3 rounded-full bg-[#FA233D] mx-auto shadow-lg shadow-red-500/50"></div>
              <div className="text-xs text-gray-400">热量</div>
              <div className="text-lg font-bold text-white">{calories.current}</div>
              <div className="text-[10px] text-gray-500">/ {calories.goal}卡</div>
            </div>

            {/* 饮水 */}
            <div className="space-y-1">
              <div className="w-3 h-3 rounded-full bg-[#00D4FF] mx-auto shadow-lg shadow-cyan-500/50"></div>
              <div className="text-xs text-gray-400">饮水</div>
              <div className="text-lg font-bold text-white">{water.current}</div>
              <div className="text-[10px] text-gray-500">/ {water.goal}ml</div>
            </div>
          </div>

          {/* 喝水按钮 */}
          <button 
            onClick={onAddWater} 
            className="w-full mt-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-2xl font-semibold text-sm hover:from-cyan-600 hover:to-blue-600 transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-cyan-500/30"
          >
            <Droplet size={16} strokeWidth={2.5} fill="currentColor" /> 
            喝水打卡
          </button>
        </div>

        {/* 睡眠卡片 - 深色风格 */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <Moon size={16} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-white">睡眠</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-white">{sleep.current}</span>
              <span className="text-xs text-gray-400 ml-1">小时</span>
            </div>
          </div>

          {/* 睡眠进度环 */}
          <div className="relative h-2 bg-white/10 rounded-full overflow-hidden mb-3">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500 shadow-lg" 
              style={{ width: `${sleepPercent}%` }}
            />
          </div>

          {renderChart(
            sleep.history.map(h => ({day: h.day, value: h.hours})), 
            10, 
            'bg-gradient-to-t from-indigo-500 to-purple-400'
          )}
        </div>

        {/* 营养分析 - 深色风格 */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
              <Flame size={16} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-white">营养摄入</span>
          </div>

          {/* 营养素圆环 */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: '蛋白质', val: calories.macros.protein, goal: 120, color: 'from-orange-500 to-orange-400', glowColor: 'orange' },
              { label: '碳水', val: calories.macros.carbs, goal: 250, color: 'from-amber-500 to-yellow-400', glowColor: 'yellow' },
              { label: '脂肪', val: calories.macros.fat, goal: 80, color: 'from-rose-500 to-pink-400', glowColor: 'pink' }
            ].map(m => {
              const percent = Math.min(100, (m.val / m.goal) * 100);
              return (
                <div key={m.label} className="text-center">
                  {/* 小圆环 */}
                  <svg width="60" height="60" viewBox="0 0 60 60" className="mx-auto mb-2">
                    <circle
                      cx="30"
                      cy="30"
                      r="24"
                      fill="none"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="6"
                    />
                    <circle
                      cx="30"
                      cy="30"
                      r="24"
                      fill="none"
                      stroke="url(#gradient-${m.glowColor})"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 24}`}
                      strokeDashoffset={`${2 * Math.PI * 24 * (1 - percent / 100)}`}
                      transform="rotate(-90 30 30)"
                      className={`drop-shadow-[0_0_6px_${m.glowColor}]`}
                    />
                    <defs>
                      <linearGradient id={`gradient-${m.glowColor}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" className={`text-${m.glowColor}-500`} stopColor="currentColor" />
                        <stop offset="100%" className={`text-${m.glowColor}-400`} stopColor="currentColor" />
                      </linearGradient>
                    </defs>
                    {/* 中心文字 */}
                    <text x="30" y="34" textAnchor="middle" className="text-xs font-bold fill-white">
                      {m.val}
                    </text>
                  </svg>
                  <div className="text-[10px] text-gray-400 mb-0.5">{m.label}</div>
                  <div className="text-xs font-bold text-white">{Math.round(percent)}%</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 运动趋势 - 深色风格 */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp size={16} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-white">运动趋势</span>
            </div>
            <div className="text-xs text-gray-400">过去4天</div>
          </div>

          {renderChart(
            exercise.history.map(h => ({day: h.day, value: h.minutes})), 
            90, 
            'bg-gradient-to-t from-emerald-500 to-green-400'
          )}
        </div>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
};

export default HealthPanel;
