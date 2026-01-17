/**
 * FloatingAffinityHint - 浮动好感度提示组件
 * 
 * 在角色左右两侧随机出现，向上飘动并自动消失
 */

import React, { useEffect } from 'react';
import { Heart, TrendingUp, TrendingDown } from 'lucide-react';
import { AffinityEvent } from '../types';

interface FloatingAffinityHintProps {
  event: AffinityEvent;
  onComplete: () => void;
  side: 'left' | 'right'; // 出现在左侧还是右侧
  offset: number; // 垂直偏移量（0-100）
}

const FloatingAffinityHint: React.FC<FloatingAffinityHintProps> = ({ 
  event, 
  onComplete,
  side,
  offset 
}) => {
  const isPositive = event.change > 0;

  useEffect(() => {
    // 3.5秒后自动移除（动画3秒 + 0.5秒缓冲）
    const timer = setTimeout(() => {
      onComplete();
    }, 3500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const getActionTypeText = (action: string): string => {
    const actionMap: Record<string, string> = {
      'todo_complete': '完成待办',
      'todo_add': '添加待办',
      'health_water': '记录喝水',
      'health_goal': '完成健康目标',
      'weather_check': '查询天气',
      'fortune_draw': '占卜',
      'daily_chat': '每日对话',
      'positive_reply': '积极反馈',
      'negative_reply': '负面反馈',
      'no_interaction': '长时间未互动',
    };
    return actionMap[action] || action;
  };

  const positionStyle: React.CSSProperties = side === 'left' 
    ? { left: '15%', bottom: `${30 + offset}%` }
    : { right: '15%', bottom: `${30 + offset}%` };

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={positionStyle}
    >
      <div
        className={`
          flex items-center gap-2 px-3 py-2 rounded-full shadow-lg
          backdrop-blur-md border
          ${isPositive 
            ? 'bg-green-100/90 border-green-300 text-green-700' 
            : 'bg-red-100/90 border-red-300 text-red-700'
          }
          animate-float-up
        `}
      >
        {/* 图标 */}
        <div className={`
          flex-shrink-0
          ${isPositive ? 'text-green-600' : 'text-red-600'}
        `}>
          {isPositive ? (
            <TrendingUp size={16} />
          ) : (
            <TrendingDown size={16} />
          )}
        </div>

        {/* 内容 */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium">
            {getActionTypeText(event.action)}
          </span>
          <Heart 
            size={12} 
            className={`${isPositive ? 'text-green-600 fill-current' : 'text-red-600'}`}
          />
          <span className={`
            text-sm font-bold
            ${isPositive ? 'text-green-700' : 'text-red-700'}
          `}>
            {isPositive ? '+' : ''}{event.change}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FloatingAffinityHint;
