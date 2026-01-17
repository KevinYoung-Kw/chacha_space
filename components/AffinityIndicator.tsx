/**
 * AffinityIndicator - 好感度指示器组件
 * 
 * 显示当前好感度值和等级，带有动画效果
 */

import React from 'react';
import { Heart, TrendingUp, TrendingDown } from 'lucide-react';
import { AffinityData, AffinityLevel } from '../types';
import { getAffinityStats, getLevelName } from '../services/affinityService';

interface AffinityIndicatorProps {
  affinity: AffinityData;
  showDetails?: boolean;
  compact?: boolean;
  variant?: 'default' | 'toolbar';
}

const AffinityIndicator: React.FC<AffinityIndicatorProps> = ({ 
  affinity, 
  showDetails = false,
  compact = false,
  variant = 'default'
}) => {
  // 确保affinity数据有效
  if (!affinity) {
    return null;
  }
  
  const stats = getAffinityStats(affinity);
  
  // 根据等级获取颜色（v1-v10渐变）
  const getLevelColor = (level: AffinityLevel): string => {
    try {
      const levelNum = parseInt(level.replace('v', ''));
      if (isNaN(levelNum)) return 'text-gray-500';
      if (levelNum <= 2) return 'text-gray-500';
      if (levelNum <= 4) return 'text-blue-600';
      if (levelNum <= 6) return 'text-amber-600';
      if (levelNum <= 8) return 'text-orange-600';
      return 'text-rose-600';
    } catch {
      return 'text-gray-500';
    }
  };

  const getLevelFillColor = (level: AffinityLevel): string => {
    try {
      const levelNum = parseInt(level.replace('v', ''));
      if (isNaN(levelNum)) return '#6b7280'; // gray-500
      if (levelNum <= 2) return '#6b7280'; // gray-500
      if (levelNum <= 4) return '#2563eb'; // blue-600
      if (levelNum <= 6) return '#d97706'; // amber-600
      if (levelNum <= 8) return '#ea580c'; // orange-600
      return '#e11d48'; // rose-600
    } catch {
      return '#6b7280';
    }
  };
  
  const getLevelBgColor = (level: AffinityLevel): string => {
    const levelNum = parseInt(level.replace('v', ''));
    if (levelNum <= 2) return 'bg-gray-400';
    if (levelNum <= 4) return 'bg-blue-500';
    if (levelNum <= 6) return 'bg-amber-500';
    if (levelNum <= 8) return 'bg-orange-500';
    return 'bg-rose-500';
  };
  
  // 计算当前等级内的进度（0-100%）
  const levelProgress = stats.progress || 0;
  
  // 计算心形填充数量（最多10颗心，对应v1-v10）
  let heartCount = 1;
  try {
    const levelNum = parseInt(stats.level.replace('v', ''));
    heartCount = isNaN(levelNum) ? 1 : Math.max(1, Math.min(10, levelNum));
  } catch {
    heartCount = 1;
  }
  
  // 渲染工具栏变体：一个会随好感度垂直填充的爱心
  if (variant === 'toolbar') {
    const fillColor = getLevelFillColor(stats.level);
    // 使用当前等级内的进度 (0-100%)，而不是总体 1000 点的进度，降低压力
    const currentProgress = stats.progress;
    
    return (
      <div className="relative w-7 h-7 flex items-center justify-center">
        {/* 底层空心心 - 使用与其它图标一致的描边 */}
        <Heart 
          size={22} 
          className="text-gray-200 transition-colors duration-500" 
        />
        {/* 上层填充心 - 使用 clip-path 实现垂直填充效果 */}
        <div 
          className="absolute inset-0 flex items-center justify-center overflow-hidden transition-all duration-700 ease-in-out"
          style={{ 
            clipPath: `inset(${100 - currentProgress}% 0 0 0)`
          }}
        >
          <Heart 
            size={22} 
            fill="none"
            stroke={fillColor}
            className="transition-colors duration-500"
          />
        </div>
        {/* 悬浮显示的数值或小圆点提示 */}
        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-white rounded-full border border-gray-100 flex items-center justify-center shadow-sm">
          <span className="text-[8px] font-bold text-gray-500" style={{ fontSize: '7px', lineHeight: 1 }}>
            {stats.level.replace('v', '')}
          </span>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/60 backdrop-blur-sm">
        <Heart 
          size={14} 
          className={`${getLevelColor(stats.level)} fill-current`}
        />
        <span className={`text-xs font-medium ${getLevelColor(stats.level)}`}>
          {stats.level.toUpperCase()}
        </span>
        <span className="text-xs text-gray-500">
          {stats.currentLevelExp} / {stats.nextLevelExpNeeded}
        </span>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col gap-2">
      {/* 好感度数值和等级 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart 
            size={18} 
            className={`${getLevelColor(stats.level)} fill-current transition-all`}
          />
          <div className="flex flex-col">
            <span className={`text-sm font-bold ${getLevelColor(stats.level)}`}>
              {stats.currentLevelExp} / {stats.nextLevelExpNeeded}
            </span>
            <span className="text-xs text-gray-500">
              {stats.level.toUpperCase()} · {getLevelName(stats.level)}
            </span>
          </div>
        </div>
        
        {showDetails && stats.nextLevel && (
          <div className="text-xs text-gray-400">
            距离{stats.nextLevel.toUpperCase()}还需 {stats.nextLevelThreshold! - affinity.value} 点
          </div>
        )}
      </div>
      
      {/* 进度条 */}
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getLevelBgColor(stats.level)} transition-all duration-500 ease-out`}
          style={{ width: `${levelProgress}%` }}
        />
      </div>
      
      {/* 等级指示器（v1-v10） */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => {
          const isActive = i <= heartCount;
          const isCurrent = i === heartCount;
          return (
            <div
              key={i}
              className={`
                flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-all
                ${isActive 
                  ? `${getLevelColor(`v${i}` as AffinityLevel)} bg-current/10 border-2 border-current` 
                  : 'text-gray-300 border-2 border-gray-200'
                }
                ${isCurrent ? 'scale-110 ring-2 ring-current/30' : ''}
              `}
            >
              {i}
            </div>
          );
        })}
      </div>
      
      {showDetails && (
        <div className="text-xs text-gray-400 mt-1">
          总互动: {affinity.totalInteractions} 次
        </div>
      )}
    </div>
  );
};

export default AffinityIndicator;
