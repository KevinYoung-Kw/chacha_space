/**
 * DailyLetter - 每日信件组件
 * 
 * 早晨拆信仪式：展示 Agent 生成的昨日回信
 * 必须点击"收起信件"才能进入主界面
 */

import React, { useState } from 'react';
import { Mail, X, Heart } from 'lucide-react';

interface DailyLetterData {
  id: string;
  date: string;
  content: string;
  mood?: string;
  emotionColor?: string;
}

interface DailyLetterProps {
  letter: DailyLetterData;
  onClose: () => void;
}

const DailyLetter: React.FC<DailyLetterProps> = ({ letter, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // 打开信件动画
  const handleOpenEnvelope = () => {
    setIsOpen(true);
  };

  // 关闭信件
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 500);
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  return (
    <div 
      className={`
        fixed inset-0 z-[100] flex items-center justify-center
        bg-gradient-to-b from-[#f5f0e8]/95 to-[#e6ddd0]/95 backdrop-blur-md
        transition-opacity duration-500
        ${isClosing ? 'opacity-0' : 'opacity-100'}
      `}
    >
      {/* 装饰背景 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 w-32 h-32 bg-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-rose-200/20 rounded-full blur-3xl" />
      </div>

      {/* 内容区域 */}
      <div className="relative w-full max-w-md mx-4 flex flex-col items-center">
        
        {!isOpen ? (
          // 信封状态
          <div 
            className="cursor-pointer transform transition-all duration-500 hover:scale-105"
            onClick={handleOpenEnvelope}
          >
            {/* 信封 */}
            <div 
              className="relative w-72 h-48 bg-gradient-to-br from-[#f8f4ec] to-[#ede6dc] rounded-lg shadow-xl border border-white/50"
              style={{
                boxShadow: '0 20px 40px rgba(92, 77, 67, 0.15), inset 0 1px 0 rgba(255,255,255,0.5)'
              }}
            >
              {/* 信封盖子 */}
              <div 
                className="absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-[#e6ddd0] to-[#d9cfc0] rounded-t-lg"
                style={{
                  clipPath: 'polygon(0 0, 50% 60%, 100% 0)',
                  transformOrigin: 'top center'
                }}
              />
              
              {/* 封蜡 */}
              <div 
                className="absolute top-12 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-10"
                style={{ 
                  background: letter.emotionColor || 'linear-gradient(135deg, #e6a4b4 0%, #d88a9a 100%)',
                }}
              >
                <Heart size={20} className="text-white" fill="white" />
              </div>

              {/* 日期标签 */}
              <div className="absolute bottom-4 inset-x-0 text-center">
                <span className="text-xs text-[#8b7b6d] font-medium">
                  {formatDate(letter.date)}
                </span>
              </div>
            </div>

            {/* 提示文字 */}
            <p className="text-center mt-6 text-[#8b7b6d] text-sm animate-pulse">
              点击打开叉叉的来信
            </p>
          </div>
        ) : (
          // 信件内容状态
          <div className="w-full animate-fade-in">
            {/* 信纸 */}
            <div 
              className="bg-[#fffdf8] rounded-2xl shadow-2xl overflow-hidden border border-[#e6ddd0]/50"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(
                    transparent,
                    transparent 31px,
                    #e6ddd0 31px,
                    #e6ddd0 32px
                  )
                `,
                backgroundPosition: '0 40px'
              }}
            >
              {/* 信件头部 */}
              <div className="bg-gradient-to-r from-[#f5f0e8] to-[#ede6dc] px-6 py-4 border-b border-[#e6ddd0]/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ background: letter.emotionColor || '#e6a4b4' }}
                    >
                      <Mail size={18} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#5c4d43]">叉叉的来信</h3>
                      <p className="text-xs text-[#8b7b6d]">{formatDate(letter.date)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 信件内容 */}
              <div className="px-6 py-6 min-h-[300px] max-h-[50vh] overflow-y-auto">
                <div className="text-[#5c4d43] leading-relaxed whitespace-pre-wrap font-serif">
                  {letter.content}
                </div>
              </div>
            </div>

            {/* 收起按钮 */}
            <button
              onClick={handleClose}
              className="w-full mt-6 py-4 px-6 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>收好信件，开始新的一天</span>
              <X size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyLetter;
