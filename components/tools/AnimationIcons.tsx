import React from 'react';

// 通用图标属性
interface IconProps {
  className?: string;
  size?: number;
}

// 基础 SVG 包装器
const SvgIcon: React.FC<IconProps & { children: React.ReactNode }> = ({ 
  className = '', 
  size = 24, 
  children 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    {children}
  </svg>
);

// ==================== 待机动作 ====================

export const IconIdleAlt: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="9" cy="9" r="1" fill="currentColor" />
    <circle cx="15" cy="9" r="1" fill="currentColor" />
    <path d="M9 16h6" />
  </SvgIcon>
);

export const IconIdle1: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 9h.01" />
    <path d="M16 9h.01" />
    <path d="M10 16s1-1 2-1 2 1 2 1" />
    <path d="M16 4l2-2" />
  </SvgIcon>
);

export const IconIdle3: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 9h.01" />
    <path d="M16 9h.01" />
    <path d="M12 16a4 4 0 0 0 0-4 4 4 0 0 0 0 4Z" />
    <path d="M6 4l2 2" />
  </SvgIcon>
);

export const IconListeningV2: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9 9h.01" />
    <path d="M15 9h.01" />
    <path d="M12 17c2.5 0 3-2 3-2H9s.5 2 3 2Z" />
    <path d="M22 10s-2-2-4 0" />
  </SvgIcon>
);

// ==================== 正面情绪 ====================

export const IconHappy: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
  </SvgIcon>
);

export const IconExcited: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 13s1.5 3 4 3 4-3 4-3" />
    <path d="M9 8l1 2" />
    <path d="M15 8l-1 2" />
    <path d="M12 16v-2" />
  </SvgIcon>
);

export const IconJump: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <circle cx="12" cy="8" r="5" />
    <path d="M8 15l-2 4" />
    <path d="M16 15l2 4" />
    <path d="M12 13v6" />
    <path d="M5 21h14" />
  </SvgIcon>
);

export const IconWave: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9 9h.01" />
    <path d="M15 9h.01" />
    <path d="M12 16a4 4 0 0 0 4-2" />
    <path d="M18 5l2-2" />
  </SvgIcon>
);

export const IconNod: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 9h.01" />
    <path d="M16 9h.01" />
    <path d="M12 16c-1 0-2-.5-2-1s1-1 2-1 2 .5 2 1-1 1-2 1Z" />
    <path d="M12 5v2" />
  </SvgIcon>
);

// ==================== 负面情绪 ====================

export const IconCrying: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 15s1.5-2 4-2 4 2 4 2" />
    <path d="M9 9l.01 0" />
    <path d="M15 9l.01 0" />
    <path d="M9 18l0 2" />
    <path d="M15 18l0 2" />
  </SvgIcon>
);

export const IconShy: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="8" y1="12" x2="8" y2="12" strokeWidth="2" />
    <line x1="16" y1="12" x2="16" y2="12" strokeWidth="2" />
    <path d="M9 16s1.5-1 3-1 3 1 3 1" />
    <path d="M4 14l2-2" />
    <path d="M20 14l-2-2" />
  </SvgIcon>
);

export const IconScared: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="9" cy="9" r="2" />
    <circle cx="15" cy="9" r="2" />
    <path d="M8 16h8" />
    <path d="M12 2v2" />
  </SvgIcon>
);

export const IconAngry: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 16s1.5-2 4-2 4 2 4 2" />
    <path d="M7.5 8L10 9" />
    <path d="M16.5 8L14 9" />
    <line x1="9" y1="10" x2="9" y2="10" />
    <line x1="15" y1="10" x2="15" y2="10" />
  </SvgIcon>
);

export const IconAngryCross: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <circle cx="12" cy="8" r="5" />
    <path d="M9 16l6 6" />
    <path d="M15 16l-6 6" />
    <path d="M7.5 5L10 6" />
    <path d="M16.5 5L14 6" />
  </SvgIcon>
);

export const IconRage: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M12 2l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4z" />
    <path d="M9 15l-1 2" />
    <path d="M15 15l1 2" />
    <path d="M8 10l2 2" />
    <path d="M16 10l-2 2" />
    <path d="M12 18v2" />
  </SvgIcon>
);

export const IconDisapprove: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 15h8" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
    <path d="M17 13l2-2" />
  </SvgIcon>
);

export const IconShouting: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9 9h.01" />
    <path d="M15 9h.01" />
    <path d="M8 15a4 4 0 0 0 8 0" />
    <path d="M16 5l3-3" />
    <path d="M8 5L5 2" />
  </SvgIcon>
);

// ==================== 活动状态 ====================

export const IconSleeping: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M21 21H3l9-18 9 18z" stroke="none" fill="none" />
    <path d="M10 13l4 4m0-4l-4 4" />
    <path d="M2 12h20" stroke="none" /> 
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12h.01" />
    <path d="M16 12h.01" />
    <path d="M12 16h0" />
    <path d="M17 6l3-3" />
    <path d="M17 10l2-2" />
  </SvgIcon>
);
// ZZZ icon actually
export const IconZzz: React.FC<IconProps> = (props) => (
    <SvgIcon {...props}>
        <path d="M4 12h6l-6 8h6" />
        <path d="M14 4h6l-6 8h6" />
    </SvgIcon>
);


export const IconSinging: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9 9h.01" />
    <path d="M15 9h.01" />
    <circle cx="12" cy="16" r="2" />
    <path d="M22 6l-2 3" />
    <path d="M20 2l-1 2" />
  </SvgIcon>
);

export const IconListening: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="M12 15s1.5 1 3 1 3-1 3-1" />
    <path d="M9 9h.01" />
    <path d="M15 9h.01" />
    <path d="M5 9v6" />
    <path d="M19 9v6" />
  </SvgIcon>
);

export const IconPhone: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12" y2="18" />
  </SvgIcon>
);

export const IconCheckPhone: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <path d="M12 18h.01" />
    <path d="M10 6h4" />
    <path d="M10 10h4" />
    <path d="M10 14h2" />
  </SvgIcon>
);

export const IconNotes: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </SvgIcon>
);

// ==================== 交互动作 ====================

export const IconSpeaking: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9 9h.01" />
    <path d="M15 9h.01" />
    <path d="M10 15h4" />
    <path d="M22 2l-4 4" />
  </SvgIcon>
);

export const IconThinking: React.FC<IconProps> = (props) => (
  <SvgIcon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9 9h.01" />
    <path d="M15 9h.01" />
    <path d="M8 16h8" />
    <circle cx="20" cy="4" r="2" />
    <circle cx="16" cy="6" r="1" />
  </SvgIcon>
);

// 图标映射表
export const ANIMATION_ICONS: Record<string, React.FC<IconProps>> = {
  idle_alt: IconIdleAlt,
  idle_1: IconIdle1,
  idle_3: IconIdle3,
  listening_v2: IconListeningV2,
  
  happy: IconHappy,
  excited: IconExcited,
  jump: IconJump,
  wave: IconWave,
  nod: IconNod,
  
  crying: IconCrying,
  shy: IconShy,
  scared: IconScared,
  angry: IconAngry,
  angry_cross: IconAngryCross,
  rage: IconRage,
  disapprove: IconDisapprove,
  shouting: IconShouting,
  
  sleeping: IconZzz,
  singing: IconSinging,
  listening: IconListening,
  phone: IconPhone,
  check_phone: IconCheckPhone,
  notes: IconNotes,
  
  speaking: IconSpeaking,
  thinking: IconThinking,
};
