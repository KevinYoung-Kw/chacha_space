/**
 * 动画点播面板
 * 让用户可以手动选择播放不同的动画
 * 根据好感度等级逐步解锁动画（每级解锁5个）
 */

import React, { useState, useMemo } from 'react';
import { Play, Sparkles, Smile, Frown, Meh, Activity, Cloud, Zap, Wind, Music } from 'lucide-react';
import { ANIMATION_ICONS } from './AnimationIcons';
import { AffinityData, AffinityLevel } from '../../types';

interface AnimationPanelProps {
  onPlayAnimation: (actionName: string) => void;
  affinity: AffinityData;
}

// 动画解锁配置：从 3 级开始，每级解锁 5 个动画
const UNLOCK_BASE_LEVEL = 3; // 从 3 级开始解锁
const ANIMATIONS_PER_LEVEL = 5; // 每级解锁 5 个


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
      { name: 'idle_4', label: '待机动作4', description: '随机触发的小动作' },
      { name: 'listening_v2', label: '倾听', description: '认真倾听的样子' },
      { name: 'observing', label: '观察', description: '仔细观察' },
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
      { name: 'sleeping_long', label: '深度睡眠', description: '长时间睡眠' },
      { name: 'singing', label: '唱歌', description: '快乐唱歌' },
      { name: 'listening', label: '听音乐', description: '享受音乐' },
      { name: 'phone', label: '玩手机', description: '使用手机' },
      { name: 'check_phone', label: '查手机', description: '查看信息' },
      { name: 'notes', label: '记笔记', description: '认真记录' },
      { name: 'drinking_water', label: '喝水', description: '补充水分' },
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
      { name: 'surprised_observe', label: '惊喜观察', description: '惊喜靠近观察' },
    ]
  },
  weather: {
    name: '天气相关',
    icon: <Cloud size={18} />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    animations: [
      { name: 'weather', label: '天气', description: '天气展示' },
      { name: 'wind_blowing', label: '有风吹过', description: '微风吹拂' },
      { name: 'strong_wind', label: '大风', description: '大风吹过' },
      { name: 'wind_blowing_2', label: '风吹过2', description: '风吹效果2' },
    ]
  },
  special: {
    name: '特殊动作',
    icon: <Zap size={18} />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    animations: [
      { name: 'skill', label: '技能', description: '展示技能' },
      { name: 'tarot_reading', label: '塔罗占卜', description: '塔罗牌占卜' },
      { name: 'dancing', label: '跳舞', description: '欢快舞蹈' },
      { name: 'dancing_2', label: '跳舞2', description: '欢快舞蹈2' },
    ]
  }
};

const AnimationPanel: React.FC<AnimationPanelProps> = ({ onPlayAnimation, affinity }) => {
  const [activeCategory, setActiveCategory] = useState<string>('positive');
  const [playingAnimation, setPlayingAnimation] = useState<string | null>(null);

  // 计算当前好感度等级数字
  const affinityLevelNum = parseInt(affinity.level.replace('v', '')) || 1;
  
  // 计算已解锁的动画数量（从3级开始，每级5个）
  const unlockedAnimationCount = useMemo(() => {
    if (affinityLevelNum < UNLOCK_BASE_LEVEL) return 0;
    return (affinityLevelNum - UNLOCK_BASE_LEVEL + 1) * ANIMATIONS_PER_LEVEL;
  }, [affinityLevelNum]);

  // 获取所有动画的扁平列表，用于计算解锁顺序
  const allAnimations = useMemo(() => {
    const animations: { name: string; category: string }[] = [];
    Object.entries(ANIMATION_CATEGORIES).forEach(([categoryKey, category]) => {
      category.animations.forEach(anim => {
        animations.push({ name: anim.name, category: categoryKey });
      });
    });
    return animations;
  }, []);

  // 计算总动画数量
  const totalAnimationCount = allAnimations.length;

  // 检查某个动画是否已解锁
  const isAnimationUnlocked = (animationName: string): boolean => {
    const index = allAnimations.findIndex(a => a.name === animationName);
    return index >= 0 && index < unlockedAnimationCount;
  };

  // 获取动画解锁所需的等级
  const getRequiredLevel = (animationName: string): number => {
    const index = allAnimations.findIndex(a => a.name === animationName);
    if (index < 0) return 10;
    const requiredLevel = UNLOCK_BASE_LEVEL + Math.floor(index / ANIMATIONS_PER_LEVEL);
    return Math.min(requiredLevel, 10);
  };

  const handlePlayAnimation = (actionName: string) => {
    if (!isAnimationUnlocked(actionName)) return;
    
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
            const unlocked = isAnimationUnlocked(animation.name);
            const requiredLevel = getRequiredLevel(animation.name);
            
            return (
              <div key={animation.name} className="relative group/item">
                <button
                  onClick={() => handlePlayAnimation(animation.name)}
                  disabled={playingAnimation === animation.name || !unlocked}
                  className={`
                    w-full text-left group
                    glass-panel rounded-xl p-3
                    transition-all duration-300
                    ${unlocked 
                      ? 'hover:shadow-md hover:scale-[1.02] active:scale-[0.98]' 
                      : 'opacity-50 cursor-not-allowed grayscale pointer-events-none'}
                    disabled:cursor-not-allowed
                    flex flex-col items-center gap-2 text-center
                    ${playingAnimation === animation.name ? 'ring-2 ring-rose-400' : ''}
                  `}
                >
                  {/* 动画图标容器 */}
                  <div className={`
                    relative w-12 h-12 rounded-xl
                    flex items-center justify-center
                    transition-all duration-300
                    ${playingAnimation === animation.name
                      ? `${currentCategory.bgColor} ${currentCategory.color} animate-pulse scale-110`
                      : unlocked 
                        ? `bg-white/60 text-[#8b7b6d] group-hover:text-[#5c4d43] group-hover:bg-white`
                        : `bg-gray-200/60 text-gray-400`
                    }
                  `}>
                    <IconComponent size={24} />
                  </div>

                  {/* 动画信息 */}
                  <div className="min-w-0 w-full">
                    <div className="flex items-center justify-center gap-1.5">
                      <h3 className={`font-semibold text-sm truncate ${unlocked ? 'text-[#5c4d43]' : 'text-gray-400'}`}>
                        {animation.label}
                      </h3>
                    </div>
                    <p className={`text-[10px] mt-0.5 truncate ${unlocked ? 'text-[#8b7b6d]' : 'text-gray-400'}`}>
                      {unlocked ? animation.description : `${requiredLevel} 级解锁`}
                    </p>
                  </div>
                </button>
                {/* 锁定提示气泡 - 显示在右侧 */}
                {!unlocked && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 bg-gray-800/95 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg" style={{ zIndex: 9999 }}>
                    需要好感度满 {requiredLevel} 级
                    {/* 左侧箭头 */}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-800/95"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 底部提示 */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-[#e6ddd0]/40 bg-[#f5f0e8]/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#8b7b6d]">
            <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
            <span>点击按钮即可播放对应动画</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#8b7b6d]">已解锁</span>
            <span className="font-bold text-rose-500">{Math.min(unlockedAnimationCount, totalAnimationCount)}</span>
            <span className="text-[#8b7b6d]">/</span>
            <span className="text-[#8b7b6d]">{totalAnimationCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimationPanel;
