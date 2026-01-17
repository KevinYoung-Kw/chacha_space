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
    
    // 3秒后自动关闭
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // 等待动画完成
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`
        fixed top-20 right-4 md:right-6 z-50
        transform transition-all duration-300 ease-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div
        className={`
          flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl
          backdrop-blur-md border
          ${isPositive 
            ? 'bg-green-50/90 border-green-200 text-green-700' 
            : 'bg-red-50/90 border-red-200 text-red-700'
          }
          min-w-[280px] max-w-[320px]
        `}
      >
        {/* 图标 */}
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
          ${isPositive ? 'bg-green-100' : 'bg-red-100'}
        `}>
          {isPositive ? (
            <TrendingUp size={20} className="text-green-600" />
          ) : (
            <TrendingDown size={20} className="text-red-600" />
          )}
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Heart 
              size={14} 
              className={`${isPositive ? 'text-green-600 fill-current' : 'text-red-600'}`}
            />
            <span className="font-bold text-sm">
              {isPositive ? '+' : ''}{event.change} 好感度
            </span>
          </div>
          <p className="text-xs text-gray-600 line-clamp-2">
            {event.reason}
          </p>
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M12.854 3.146a.5.5 0 0 0-.708-.708L8 7.293 3.854 3.146a.5.5 0 1 0-.708.708L7.293 8l-4.147 4.146a.5.5 0 0 0 .708.708L8 8.707l4.146 4.147a.5.5 0 0 0 .708-.708L8.707 8l4.147-4.854z"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default AffinityToast;
