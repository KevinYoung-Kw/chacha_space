/**
 * GoodNightModal - 晚安结算组件
 * 
 * 晚安仪式：进入睡眠模式，锁定输入，显示睡眠提示
 */

import React, { useState, useEffect } from 'react';
import { Moon, BookOpen, Sparkles } from 'lucide-react';

interface GoodNightModalProps {
  isVisible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const GoodNightModal: React.FC<GoodNightModalProps> = ({
  isVisible,
  onConfirm,
  onCancel,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  // 获取当前时间的问候语
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 21 || hour < 5) {
      return '夜深了，该休息了';
    } else if (hour >= 18) {
      return '晚上好，今天辛苦了';
    } else {
      return '要休息一下吗？';
    }
  };

  return (
    <div 
      className={`
        fixed inset-0 z-[100] flex items-center justify-center
        bg-gradient-to-b from-[#3d3529]/90 to-[#2a2419]/95 backdrop-blur-md
        transition-opacity duration-500
        ${isAnimating ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {/* 星星装饰 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-amber-200 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.5 + 0.3,
            }}
          />
        ))}
      </div>

      {/* 月亮装饰 */}
      <div className="absolute top-10 right-10 w-20 h-20 bg-amber-100 rounded-full shadow-[0_0_60px_rgba(255,230,180,0.4)] opacity-60" />

      {/* 内容区域 */}
      <div className="relative w-full max-w-sm mx-4 flex flex-col items-center">
        {/* 卡片 */}
        <div className="w-full bg-[#fdfcf8]/10 backdrop-blur-xl rounded-3xl p-8 text-center border border-[#e6dec8]/30 shadow-2xl">
          {/* 图标 */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Moon size={40} className="text-amber-200" />
          </div>

          {/* 标题 */}
          <h2 className="text-2xl font-bold text-[#fdfcf8] mb-2">
            {getTimeGreeting()}
          </h2>

          {/* 描述 */}
          <p className="text-[#d4c8b0] mb-6 text-sm leading-relaxed">
            我会去整理今天的回忆，<br />
            给你写一封信，明天见~
          </p>

          {/* 装饰图标 */}
          <div className="flex items-center justify-center gap-4 mb-8 text-[#c4b89c]">
            <BookOpen size={20} />
            <Sparkles size={16} />
            <Moon size={20} />
          </div>

          {/* 按钮组 */}
          <div className="space-y-3">
            <button
              onClick={handleConfirm}
              className="w-full py-4 px-6 bg-gradient-to-r from-[#8b7b6d] to-[#6d5d4f] text-[#fdfcf8] rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              晚安，明天见
            </button>
            <button
              onClick={onCancel}
              className="w-full py-3 px-6 text-[#c4b89c] hover:text-[#fdfcf8] transition-colors text-sm"
            >
              再聊会儿
            </button>
          </div>
        </div>

        {/* 底部提示 */}
        <p className="mt-6 text-[#a89b8c]/60 text-xs">
          凌晨 4:00 会自动进入睡眠模式
        </p>
      </div>
    </div>
  );
};

/**
 * SleepModeOverlay - 睡眠模式遮罩
 * 
 * 进入睡眠模式后显示的界面，锁定输入
 */
export const SleepModeOverlay: React.FC<{
  isActive: boolean;
  onWake: () => void;
}> = ({ isActive, onWake }) => {
  if (!isActive) return null;

  return (
    <div 
      className="fixed inset-0 z-[90] flex items-center justify-center pointer-events-auto"
      style={{
        background: 'linear-gradient(180deg, rgba(61, 53, 41, 0.85) 0%, rgba(42, 36, 25, 0.92) 100%)',
        backdropFilter: 'blur(4px)',
      }}
    >
      {/* 星星装饰 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-amber-200 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.3 + 0.2,
            }}
          />
        ))}
      </div>

      <div className="text-center">
        {/* 睡眠图标 */}
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-amber-500/20 flex items-center justify-center animate-pulse">
          <Moon size={48} className="text-amber-200" />
        </div>

        {/* 睡眠提示 */}
        <p className="text-[#fdfcf8] text-lg font-medium mb-2">
          叉叉正在睡觉...
        </p>
        <p className="text-[#a89b8c] text-sm mb-8">
          正在整理回忆，写明天的信
        </p>

        {/* 唤醒按钮 */}
        <button
          onClick={onWake}
          className="px-6 py-3 bg-[#fdfcf8]/10 hover:bg-[#fdfcf8]/20 text-[#fdfcf8] rounded-full text-sm transition-all border border-[#e6dec8]/30"
        >
          叫醒叉叉
        </button>
      </div>
    </div>
  );
};

export default GoodNightModal;
