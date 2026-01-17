/**
 * useCharacterStateMachine - React Hook for Virtual Character State Machine
 * 
 * 提供响应式的状态机管理，自动处理生命周期和清理
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { 
  VirtualCharacterStateMachine, 
  createCharacterStateMachine, 
  VideoStateID, 
  StateMachineConfig,
  StateChangeEvent 
} from '../services/characterStateMachine';

export interface UseCharacterStateMachineOptions {
  /** 自定义配置 */
  config?: StateMachineConfig;
  /** 状态变化回调 */
  onStateChange?: (event: StateChangeEvent) => void;
  /** 自动播放 */
  autoPlay?: boolean;
}

export interface UseCharacterStateMachineReturn {
  /** 容器 ref，绑定到 DOM 元素 */
  containerRef: React.RefObject<HTMLDivElement>;
  /** 当前状态 ID */
  currentState: VideoStateID;
  /** 是否已初始化 */
  isInitialized: boolean;
  /** 聚焦左侧 */
  focusLeft: () => void;
  /** 聚焦右侧 */
  focusRight: () => void;
  /** 聚焦中间 */
  focusCenter: () => void;
  /** 播放一次性动作 */
  playAction: (actionName: string) => void;
  /** 手动触发播放 */
  play: () => Promise<void>;
  /** 暂停 */
  pause: () => void;
  /** 状态机实例（高级用法） */
  stateMachine: VirtualCharacterStateMachine | null;
}

export function useCharacterStateMachine(
  options: UseCharacterStateMachineOptions = {}
): UseCharacterStateMachineReturn {
  const { config, onStateChange, autoPlay = true } = options;
  
  const containerRef = useRef<HTMLDivElement>(null);
  const stateMachineRef = useRef<VirtualCharacterStateMachine | null>(null);
  
  const [currentState, setCurrentState] = useState<VideoStateID>(VideoStateID.IDLE_CENTER);
  const [isInitialized, setIsInitialized] = useState(false);

  // 初始化状态机
  useEffect(() => {
    if (!containerRef.current) return;

    // 创建状态机实例
    const sm = createCharacterStateMachine(config);
    stateMachineRef.current = sm;

    // 初始化
    sm.initialize(containerRef.current);
    setIsInitialized(true);

    // 添加状态变化监听
    const unsubscribe = sm.addStateChangeListener((event) => {
      setCurrentState(event.currentState);
      onStateChange?.(event);
    });

    // 自动播放
    if (autoPlay) {
      // 需要用户交互才能自动播放，所以监听一次点击事件
      const handleFirstInteraction = () => {
        sm.play();
        document.removeEventListener('click', handleFirstInteraction);
        document.removeEventListener('touchstart', handleFirstInteraction);
        document.removeEventListener('keydown', handleFirstInteraction);
      };
      
      // 尝试直接播放
      sm.play().catch(() => {
        // 如果失败，等待用户交互
        document.addEventListener('click', handleFirstInteraction);
        document.addEventListener('touchstart', handleFirstInteraction);
        document.addEventListener('keydown', handleFirstInteraction);
      });
    }

    // 清理
    return () => {
      unsubscribe();
      sm.destroy();
      stateMachineRef.current = null;
      setIsInitialized(false);
    };
  }, [config, autoPlay]);

  // 更新 onStateChange 回调（避免重新初始化）
  useEffect(() => {
    if (!stateMachineRef.current || !onStateChange) return;

    const unsubscribe = stateMachineRef.current.addStateChangeListener(onStateChange);
    return unsubscribe;
  }, [onStateChange]);

  // 封装 API 方法
  const focusLeft = useCallback(() => {
    stateMachineRef.current?.focusLeft();
  }, []);

  const focusRight = useCallback(() => {
    stateMachineRef.current?.focusRight();
  }, []);

  const focusCenter = useCallback(() => {
    stateMachineRef.current?.focusCenter();
  }, []);

  const playAction = useCallback((actionName: string) => {
    stateMachineRef.current?.playAction(actionName);
  }, []);

  const play = useCallback(async () => {
    await stateMachineRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    stateMachineRef.current?.pause();
  }, []);

  return {
    containerRef,
    currentState,
    isInitialized,
    focusLeft,
    focusRight,
    focusCenter,
    playAction,
    play,
    pause,
    stateMachine: stateMachineRef.current,
  };
}

// 便捷的状态判断工具函数
export const StateUtils = {
  isIdle: (state: VideoStateID) => state.startsWith('IDLE_'),
  isTransition: (state: VideoStateID) => state.startsWith('TRANS_'),
  isAction: (state: VideoStateID) => state.startsWith('ACTION_'),
  isLeft: (state: VideoStateID) => state.includes('LEFT'),
  isRight: (state: VideoStateID) => state.includes('RIGHT'),
  isCenter: (state: VideoStateID) => state.includes('CENTER') && !state.includes('TO_'),
};

export default useCharacterStateMachine;
