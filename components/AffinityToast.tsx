/**
 * AffinityToast - 好感度变化提示组件
 * 
 * 显示好感度增加/减少的动效提示
 */

import React, { useEffect, useState } from 'react';
import { Heart, TrendingUp, TrendingDown } from 'lucide-react';
import { AffinityEvent } from '../types';

interface AffinityToastProps {
  event: AffinityEvent;
  onClose: () => void;
}

const AffinityToast: React.FC<AffinityToastProps> = ({ event, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const isPositive = event.change > 0;

  useEffect(() => {
    // 触发进入动画
    setTimeout(() => setIsVisible(true), 10);
    
    // 1.8秒后自动关闭（大幅缩短停留时间）
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 800); // 预留较长的淡出时间，保证丝滑
    }, 1800);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`
        absolute top-[45%] left-1/2 -translate-x-1/2 z-[100]
        transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1) pointer-events-none
        flex flex-col items-center gap-1
        ${isVisible 
          ? 'opacity-100 -translate-y-4' 
          : 'opacity-0 translate-y-0'}
      `}
    >
      {/* 极简数字与心形 */}
      <div className={`flex items-center gap-1.5 font-bold tracking-widest text-lg
        ${isPositive ? 'text-rose-500/90' : 'text-gray-400/90'}`}
        style={{ textShadow: '0 2px 10px rgba(255,255,255,0.8)' }}>
        <Heart 
          size={16} 
          className={`${isPositive ? 'fill-rose-500/80' : ''}`}
        />
        <span>{isPositive ? '+' : ''}{event.change}</span>
      </div>
      
      {/* 微型理由字幕 */}
      <div className={`text-[9px] font-medium tracking-wider opacity-60
        ${isPositive ? 'text-rose-600' : 'text-gray-600'}`}>
        {event.reason}
      </div>
    </div>
  );
};

export default AffinityToast;
