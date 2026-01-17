/**
 * VideoAvatar - 基于状态机的视频虚拟人物组件
 * 
 * 使用双缓冲策略实现无缝视频切换
 * 支持面板联动和一次性动作播放
 */

import React, { useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { useCharacterStateMachine, StateUtils } from '../hooks/useCharacterStateMachine';
import { VideoStateID, StateChangeEvent, StateMachineConfig } from '../services/characterStateMachine';

// ==================== 类型定义 ====================

export interface VideoAvatarProps {
  /** 自定义配置 */
  config?: StateMachineConfig;
  /** 自定义样式类名 */
  className?: string;
  /** 容器样式 */
  style?: React.CSSProperties;
  /** 状态变化回调 */
  onStateChange?: (event: StateChangeEvent) => void;
  /** 是否自动播放 */
  autoPlay?: boolean;
  /** 是否显示调试信息 */
  debug?: boolean;
}

export interface VideoAvatarRef {
  /** 聚焦左侧（适配左侧面板打开） */
  focusLeft: () => void;
  /** 聚焦右侧（适配右侧面板打开） */
  focusRight: () => void;
  /** 聚焦中间（所有面板关闭） */
  focusCenter: () => void;
  /** 播放一次性动作 */
  playAction: (actionName: string) => void;
  /** 手动播放 */
  play: () => Promise<void>;
  /** 暂停 */
  pause: () => void;
  /** 获取当前状态 */
  getCurrentState: () => VideoStateID;
}

// ==================== 组件实现 ====================

const VideoAvatar = forwardRef<VideoAvatarRef, VideoAvatarProps>((props, ref) => {
  const { 
    config, 
    className = '', 
    style,
    onStateChange, 
    autoPlay = true,
    debug = false 
  } = props;

  const {
    containerRef,
    currentState,
    isInitialized,
    focusLeft,
    focusRight,
    focusCenter,
    playAction,
    play,
    pause,
  } = useCharacterStateMachine({
    config,
    onStateChange,
    autoPlay,
  });

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    focusLeft,
    focusRight,
    focusCenter,
    playAction,
    play,
    pause,
    getCurrentState: () => currentState,
  }), [focusLeft, focusRight, focusCenter, playAction, play, pause, currentState]);

  // 调试日志
  useEffect(() => {
    if (debug) {
      console.log('[VideoAvatar] State changed:', currentState);
    }
  }, [currentState, debug]);

  // 状态指示器样式
  const getStateIndicator = useCallback(() => {
    if (StateUtils.isIdle(currentState)) {
      return { emoji: '😊', label: '待机中' };
    }
    if (StateUtils.isTransition(currentState)) {
      return { emoji: '🔄', label: '切换中' };
    }
    if (StateUtils.isAction(currentState)) {
      return { emoji: '✨', label: '执行动作' };
    }
    return { emoji: '🎭', label: currentState };
  }, [currentState]);

  const indicator = getStateIndicator();

  return (
    <div 
      className={`video-avatar-container relative ${className}`}
      style={{
        ...style,
        overflow: 'hidden',
      }}
    >
      {/* 视频缓冲区容器 */}
      <div 
        ref={containerRef as React.RefObject<HTMLDivElement>}
        className="absolute inset-0 flex items-center justify-center"
        style={{
          // 确保视频容器填满父元素
          width: '100%',
          height: '100%',
        }}
      />

      {/* 加载指示器 */}
      {!isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-50/80 to-pink-50/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
            <span className="text-purple-600 font-medium animate-pulse">加载虚拟形象...</span>
          </div>
        </div>
      )}

      {/* 调试面板 */}
      {debug && (
        <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg font-mono z-50">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{indicator.emoji}</span>
            <span className="text-purple-300">{indicator.label}</span>
          </div>
          <div className="text-gray-400">State: {currentState}</div>
          <div className="text-gray-400">Initialized: {isInitialized ? '✓' : '✗'}</div>
        </div>
      )}

      {/* 状态气泡（可选，用于生产环境的轻量提示） */}
      {isInitialized && StateUtils.isAction(currentState) && (
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-full px-4 py-2 shadow-lg animate-bounce z-40">
          <span className="text-lg">{indicator.emoji}</span>
        </div>
      )}

      {/* 交互提示层（首次点击播放） */}
      {isInitialized && (
        <div 
          className="absolute inset-0 cursor-pointer z-10"
          onClick={() => play()}
          style={{ pointerEvents: 'none' }} // 仅在需要时启用
        />
      )}

      {/* 内置样式 */}
      <style>{`
        .video-avatar-container video {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          transition: opacity 0.1s ease-out;
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        .video-avatar-shimmer {
          background: linear-gradient(
            90deg,
            rgba(255,255,255,0) 0%,
            rgba(255,255,255,0.2) 50%,
            rgba(255,255,255,0) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
});

VideoAvatar.displayName = 'VideoAvatar';

export default VideoAvatar;

// ==================== 便捷组件 ====================

/**
 * SimpleVideoAvatar - 简化版，不需要 ref 控制
 * 直接通过 props 控制聚焦方向
 */
export interface SimpleVideoAvatarProps extends Omit<VideoAvatarProps, 'ref'> {
  /** 当前聚焦方向 */
  focus?: 'left' | 'center' | 'right';
  /** 当前动作（设置后自动播放） */
  action?: string | null;
}

export const SimpleVideoAvatar: React.FC<SimpleVideoAvatarProps> = ({
  focus = 'center',
  action = null,
  ...props
}) => {
  const avatarRef = React.useRef<VideoAvatarRef>(null);

  // 响应 focus 变化
  useEffect(() => {
    if (!avatarRef.current) return;

    switch (focus) {
      case 'left':
        avatarRef.current.focusLeft();
        break;
      case 'right':
        avatarRef.current.focusRight();
        break;
      case 'center':
      default:
        avatarRef.current.focusCenter();
        break;
    }
  }, [focus]);

  // 响应 action 变化
  useEffect(() => {
    if (!avatarRef.current || !action) return;
    avatarRef.current.playAction(action);
  }, [action]);

  return <VideoAvatar ref={avatarRef} {...props} />;
};
