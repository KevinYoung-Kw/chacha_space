/**
 * VideoAvatar - 基于状态机的视频虚拟人物组件
 * 
 * 使用双缓冲策略实现无缝视频切换
 * 支持面板联动和一次性动作播放
 * 集成视频预加载服务，显示加载进度
 */

import React, { useEffect, useImperativeHandle, forwardRef, useCallback, useState } from 'react';
import { useCharacterStateMachine, StateUtils } from '../hooks/useCharacterStateMachine';
import { VideoStateID, StateChangeEvent, StateMachineConfig } from '../services/characterStateMachine';
import { videoPreloader, preloadAllVideos, PreloadProgress } from '../services/videoPreloader';
import { Smile, RefreshCw, Sparkles, Drama } from 'lucide-react';

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
  /** 重置活动计时器（用户有交互时调用） */
  resetActivityTimer: () => void;
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

  // 预加载进度状态
  const [preloadProgress, setPreloadProgress] = useState<PreloadProgress>({
    total: 0,
    loaded: 0,
    percent: 0,
    coreReady: videoPreloader.isCoreReady(),
  });

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
    resetActivityTimer,
  } = useCharacterStateMachine({
    config,
    onStateChange,
    autoPlay,
  });

  // 监听预加载进度
  useEffect(() => {
    const unsubscribe = videoPreloader.onProgress((progress) => {
      setPreloadProgress(progress);
    });
    
    // 如果核心视频已就绪，开始后台加载全部视频
    if (videoPreloader.isCoreReady()) {
      preloadAllVideos();
    }
    
    return unsubscribe;
  }, []);

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    focusLeft,
    focusRight,
    focusCenter,
    playAction,
    play,
    pause,
    getCurrentState: () => currentState,
    resetActivityTimer,
  }), [focusLeft, focusRight, focusCenter, playAction, play, pause, currentState, resetActivityTimer]);

  // 调试日志
  useEffect(() => {
    if (debug) {
      console.log('[VideoAvatar] State changed:', currentState);
    }
  }, [currentState, debug]);

  // 状态指示器样式
  const getStateIndicator = useCallback(() => {
    if (StateUtils.isIdle(currentState)) {
      return { icon: <Smile size={18} className="text-green-400" />, label: '待机中' };
    }
    if (StateUtils.isTransition(currentState)) {
      return { icon: <RefreshCw size={18} className="text-blue-400 animate-spin" />, label: '切换中' };
    }
    if (StateUtils.isAction(currentState)) {
      return { icon: <Sparkles size={18} className="text-yellow-400 animate-pulse" />, label: '执行动作' };
    }
    return { icon: <Drama size={18} className="text-purple-400" />, label: currentState };
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

      {/* 加载指示器 - 显示预加载进度 */}
      {(!isInitialized || !preloadProgress.coreReady) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-50/80 to-pink-50/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 px-6 text-center">
            {/* 加载动画 */}
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-4 border-purple-200 rounded-full" />
              <div 
                className="absolute inset-0 border-4 border-purple-500 rounded-full border-t-transparent animate-spin"
                style={{ animationDuration: '1s' }}
              />
              {/* 进度数字 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-purple-600 font-bold text-lg">
                  {preloadProgress.percent}%
                </span>
              </div>
            </div>
            
            {/* 加载文案 */}
            <div className="space-y-1">
              <span className="text-purple-600 font-medium block">
                {!preloadProgress.coreReady 
                  ? '正在唤醒叉叉...' 
                  : '准备就绪'}
              </span>
              <span className="text-purple-400 text-xs block">
                {preloadProgress.currentFile 
                  ? `加载 ${preloadProgress.currentFile.split('/').pop()}` 
                  : `已加载 ${preloadProgress.loaded}/${preloadProgress.total} 个资源`}
              </span>
            </div>
            
            {/* 进度条 */}
            <div className="w-48 h-2 bg-purple-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-300"
                style={{ width: `${preloadProgress.percent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 调试面板 */}
      {debug && (
        <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg font-mono z-50">
          <div className="flex items-center gap-2 mb-1">
            {indicator.icon}
            <span className="text-purple-300">{indicator.label}</span>
          </div>
          <div className="text-gray-400">State: {currentState}</div>
          <div className="text-gray-400">Initialized: {isInitialized ? '✓' : '✗'}</div>
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
