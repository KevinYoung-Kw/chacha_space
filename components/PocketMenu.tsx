/**
 * PocketMenu - 百宝箱组件
 * 
 * 收纳工具类图标的二级菜单
 * 包含：音乐、健康、天气、占卜、待办、技能、动作
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Package, 
  Music, 
  VolumeX, 
  Activity, 
  CloudSun, 
  Sparkles, 
  CheckSquare, 
  Zap, 
  Film,
  X,
  ChevronRight
} from 'lucide-react';

export type PocketPanelType = 'bgm' | 'health' | 'weather' | 'fortune' | 'todo' | 'skills' | 'animation';

interface PocketMenuItem {
  id: PocketPanelType;
  icon: React.ReactNode;
  label: string;
  notification?: boolean;
  requiredLevel?: number;
  lockedMessage?: string;
}

interface PocketMenuProps {
  activePanel: string;
  onSelectPanel: (panel: PocketPanelType | 'none') => void;
  hasNewTodo: boolean;
  affinityLevel: number;
  isBgmPlaying: boolean;
  onToggleBgm: () => void;
  isMobile?: boolean;
}

const PocketMenu: React.FC<PocketMenuProps> = ({
  activePanel,
  onSelectPanel,
  hasNewTodo,
  affinityLevel,
  isBgmPlaying,
  onToggleBgm,
  isMobile = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const menuItems: PocketMenuItem[] = [
    { 
      id: 'bgm', 
      icon: isBgmPlaying ? <Music size={18} /> : <VolumeX size={18} />, 
      label: '音乐' 
    },
    { id: 'health', icon: <Activity size={18} />, label: '健康' },
    { id: 'weather', icon: <CloudSun size={18} />, label: '天气' },
    { id: 'fortune', icon: <Sparkles size={18} />, label: '占卜' },
    { id: 'todo', icon: <CheckSquare size={18} />, label: '待办', notification: hasNewTodo },
    { id: 'skills', icon: <Zap size={18} />, label: '技能' },
    { 
      id: 'animation', 
      icon: <Film size={18} />, 
      label: '动作',
      requiredLevel: 3,
      lockedMessage: '需要好感度满 3 级'
    },
  ];

  const handleItemClick = (item: PocketMenuItem) => {
    if (item.requiredLevel && affinityLevel < item.requiredLevel) {
      return; // 锁定状态不响应
    }

    if (item.id === 'bgm') {
      onToggleBgm();
    } else {
      const newPanel = activePanel === item.id ? 'none' : item.id;
      onSelectPanel(newPanel as PocketPanelType | 'none');
      setIsOpen(false);
    }
  };

  // 检查百宝箱内是否有激活的面板
  const hasActiveItem = menuItems.some(item => item.id === activePanel && item.id !== 'bgm');
  const hasNotification = menuItems.some(item => item.notification);

  if (isMobile) {
    // 移动端：展开为横向滚动菜单
    return (
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-2">
        {menuItems.map((item) => {
          const isLocked = item.requiredLevel ? affinityLevel < item.requiredLevel : false;
          const isActive = item.id === 'bgm' ? isBgmPlaying : activePanel === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              disabled={isLocked}
              className={`
                flex flex-col items-center justify-center min-w-[56px] py-2 px-3 rounded-xl transition-all
                ${isLocked 
                  ? 'opacity-40 cursor-not-allowed' 
                  : isActive 
                    ? 'bg-purple-100 text-purple-600' 
                    : 'hover:bg-white/60 text-[#8b7b6d]'}
              `}
            >
              <span className="relative">
                {item.icon}
                {item.notification && !isLocked && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 border border-white" />
                )}
              </span>
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // 桌面端：点击展开弹出菜单
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 计算菜单位置
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.top,
        left: rect.right + 12, // 按钮右侧 + 间距
      });
    }
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative">
      {/* 百宝箱主按钮 */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          toolbar-btn flex items-center justify-center transition-all duration-300
          w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14
          rounded-xl sm:rounded-2xl relative
          ${isOpen || hasActiveItem
            ? 'bg-white/90 shadow-lg scale-105' 
            : 'hover:bg-white/60 cursor-pointer'}
        `}
      >
        <span className="scale-75 sm:scale-90 md:scale-100 text-[#8b7b6d]">
          {isOpen ? <X size={22} /> : <Package size={22} />}
        </span>
        {/* 通知红点 */}
        {hasNotification && !isOpen && (
          <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-rose-500 rounded-full border-2 border-[#f5f0e8] shadow-sm animate-pulse" />
        )}
      </button>
      
      {/* 标签 */}
      <span className={`
        toolbar-label mt-0.5 sm:mt-1 font-medium transition-colors text-center block
        text-[10px] sm:text-xs
        ${isOpen || hasActiveItem ? 'text-[#5c4d43]' : 'text-[#a89b8c]'}
      `}>
        百宝箱
      </span>

      {/* 弹出菜单 - 使用 fixed 定位避免被父容器裁剪 */}
      {isOpen && menuPosition && (
        <div 
          className="fixed bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-[#e6dec8]/50 p-2 z-[100] animate-fade-in"
          style={{ 
            minWidth: '160px',
            top: menuPosition.top,
            left: menuPosition.left,
          }}
        >
          {/* 菜单标题 */}
          <div className="px-3 py-2 border-b border-gray-100 mb-1">
            <span className="text-xs font-semibold text-[#8b7b6d]">百宝箱</span>
          </div>
          
          {/* 菜单项 */}
          <div className="space-y-0.5">
            {menuItems.map((item) => {
              const isLocked = item.requiredLevel ? affinityLevel < item.requiredLevel : false;
              const isActive = item.id === 'bgm' ? isBgmPlaying : activePanel === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  disabled={isLocked}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group
                    ${isLocked 
                      ? 'opacity-40 cursor-not-allowed' 
                      : isActive 
                        ? 'bg-[#f5f0e8] text-[#5c4d43]' 
                        : 'hover:bg-gray-50 text-[#5c4d43]'}
                  `}
                >
                  <span className="relative flex-shrink-0">
                    {item.icon}
                    {item.notification && !isLocked && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 border border-white" />
                    )}
                  </span>
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                  {isActive && item.id !== 'bgm' && (
                    <ChevronRight size={14} className="text-[#8b7b6d]" />
                  )}
                  {isLocked && (
                    <span className="text-[10px] text-gray-400">🔒</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PocketMenu;
