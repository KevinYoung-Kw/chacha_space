/**
 * 动画点播面板
 * 让用户可以手动选择播放不同的动画
 */

import React, { useState } from 'react';
import { Play, Sparkles, Smile, Frown, Meh, Activity } from 'lucide-react';
import { ANIMATION_ICONS } from './AnimationIcons';

interface AnimationPanelProps {
  onPlayAnimation: (actionName: string) => void;
}


// 动画分类
const ANIMATION_CATEGORIES = {
  idle: {
    name: '待机动作',
    icon: <Meh size={18} />,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    animations: [
      { name: 'idle_alt', label: '备选待机', description: '另一种待机姿态' },
      { name: 'idle_1', label: '待机动作1', description: '随机触发的小动作' },
      { name: 'idle_3', label: '待机动作3', description: '随机触发的小动作' },
      { name: 'listening_v2', label: '倾听', description: '认真倾听的样子' },
    ]
  },
  positive: {
    name: '正面情绪',
    icon: <Smile size={18} />,
    color: 'text-rose-500',
    bgColor: 'bg-rose-50',
    animations: [
      { name: 'happy', label: '开心', description: '增加好感度' },
      { name: 'excited', label: '激动', description: '兴奋惊喜' },
      { name: 'jump', label: '跳跃', description: '欢快跳跃' },
      { name: 'wave', label: '挥手', description: '打招呼' },
      { name: 'nod', label: '点头', description: '肯定同意' },
    ]
  },
  negative: {
    name: '负面情绪',
    icon: <Frown size={18} />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    animations: [
      { name: 'crying', label: '哭泣', description: '悲伤委屈' },
      { name: 'shy', label: '害羞', description: '尴尬害羞' },
      { name: 'scared', label: '害怕', description: '恐惧紧张' },
      { name: 'angry', label: '生气', description: '愤怒不满' },
      { name: 'angry_cross', label: '插手生气', description: '更生气了' },
      { name: 'rage', label: '无能狂怒', description: '极度愤怒' },
      { name: 'disapprove', label: '不认可', description: '反对拒绝' },
      { name: 'shouting', label: '大喊', description: '大声喊话' },
    ]
  },
  activities: {
    name: '活动状态',
    icon: <Activity size={18} />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    animations: [
      { name: 'sleeping', label: '睡觉', description: '休息睡眠' },
      { name: 'singing', label: '唱歌', description: '快乐唱歌' },
      { name: 'listening', label: '听音乐', description: '享受音乐' },
      { name: 'phone', label: '玩手机', description: '使用手机' },
      { name: 'check_phone', label: '查手机', description: '查看信息' },
      { name: 'notes', label: '记笔记', description: '认真记录' },
    ]
  },
  interaction: {
    name: '交互动作',
    icon: <Sparkles size={18} />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    animations: [
      { name: 'speaking', label: '说话', description: '正在说话' },
      { name: 'thinking', label: '思考', description: '认真思考' },
    ]
  }
};

const AnimationPanel: React.FC<AnimationPanelProps> = ({ onPlayAnimation }) => {
  const [activeCategory, setActiveCategory] = useState<string>('positive');
  const [playingAnimation, setPlayingAnimation] = useState<string | null>(null);

  const handlePlayAnimation = (actionName: string) => {
    setPlayingAnimation(actionName);
    onPlayAnimation(actionName);
    
    // 2秒后清除播放状态
    setTimeout(() => {
      setPlayingAnimation(null);
    }, 2000);
  };

  const currentCategory = ANIMATION_CATEGORIES[activeCategory as keyof typeof ANIMATION_CATEGORIES];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-[#fdfcf8] to-[#f5f0e8]">
      {/* 标题区域 */}
      <div className="flex-shrink-0 px-6 py-5 border-b border-[#e6ddd0]/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-md">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#5c4d43]">动画点播</h2>
            <p className="text-xs text-[#8b7b6d] mt-0.5">选择你想看的叉叉动作～</p>
          </div>
        </div>
      </div>

      {/* 分类标签 */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[#e6ddd0]/30">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {Object.entries(ANIMATION_CATEGORIES).map(([key, category]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium
                transition-all duration-300 whitespace-nowrap flex-shrink-0
                ${activeCategory === key
                  ? `${category.bgColor} ${category.color} shadow-sm scale-105`
                  : 'bg-white/50 text-[#8b7b6d] hover:bg-white/80'
                }
              `}
            >
              {category.icon}
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 动画列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          {currentCategory.animations.map((animation) => {
            // 获取对应的图标组件，如果没有则回退到 Play 图标
            const IconComponent = ANIMATION_ICONS[animation.name] || Play;
            
            return (
              <button
                key={animation.name}
                onClick={() => handlePlayAnimation(animation.name)}
                disabled={playingAnimation === animation.name}
                className={`
                  w-full text-left group
                  glass-panel rounded-xl p-3
                  transition-all duration-300
                  hover:shadow-md hover:scale-[1.02]
                  active:scale-[0.98]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex flex-col items-center gap-2 text-center
                  ${playingAnimation === animation.name ? 'ring-2 ring-rose-400' : ''}
                `}
              >
                {/* 动画图标容器 */}
                <div className={`
                  w-12 h-12 rounded-xl
                  flex items-center justify-center
                  transition-all duration-300
                  ${playingAnimation === animation.name
                    ? `${currentCategory.bgColor} ${currentCategory.color} animate-pulse scale-110`
                    : `bg-white/60 text-[#8b7b6d] group-hover:text-[#5c4d43] group-hover:bg-white`
                  }
                `}>
                  <IconComponent size={24} />
                </div>

                {/* 动画信息 */}
                <div className="min-w-0 w-full">
                  <div className="flex items-center justify-center gap-1.5">
                    <h3 className="font-semibold text-[#5c4d43] text-sm truncate">
                      {animation.label}
                    </h3>
                  </div>
                  <p className="text-[10px] text-[#8b7b6d] mt-0.5 truncate">
                    {animation.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 底部提示 */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-[#e6ddd0]/40 bg-[#f5f0e8]/50">
        <div className="flex items-center gap-2 text-xs text-[#8b7b6d]">
          <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
          <span>点击按钮即可播放对应动画</span>
        </div>
      </div>
    </div>
  );
};

export default AnimationPanel;
