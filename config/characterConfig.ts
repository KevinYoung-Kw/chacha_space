/**
 * characterConfig.ts - 视频人物状态机配置
 * 
 * 这个文件定义了视频文件与状态的映射关系
 * 根据实际的视频内容修改此配置
 */

import { VideoStateID, VideoState, StateMachineConfig } from '../services/characterStateMachine';

/**
 * 视频文件映射说明：
 * 
 * 根据 /public/character/ 目录下的视频文件：
 * - 1.mp4: 待机中间（循环）
 * - 2.mp4: 过渡动画（中间 → 左边）
 * - 3.mp4: 待机左边（循环）
 * - 4.mp4: 过渡动画（左边 → 中间）
 * - 5.mp4: 说话/动作（单次）
 * 
 * 请根据实际视频内容调整下面的映射！
 */

// 视频路径常量
const VIDEO_PATHS = {
  IDLE_CENTER: '/character/1.mp4',
  TRANS_C2L: '/character/2.mp4',
  IDLE_LEFT: '/character/3.mp4',
  TRANS_L2C: '/character/4.mp4',
  ACTION_SPEAKING: '/character/5.mp4',
} as const;

/**
 * 创建自定义状态配置
 * 
 * 使用方法：
 * ```tsx
 * import { createCustomConfig } from './config/characterConfig';
 * 
 * <VideoAvatar config={createCustomConfig()} />
 * ```
 */
export function createCustomConfig(): StateMachineConfig {
  const states = new Map<VideoStateID, VideoState>();

  // ========== 待机状态（循环播放）==========
  
  // 中间待机
  states.set(VideoStateID.IDLE_CENTER, {
    stateID: VideoStateID.IDLE_CENTER,
    videoSource: VIDEO_PATHS.IDLE_CENTER,
    isLoop: true,
    nextStateID: null,
    preloadStates: [VideoStateID.TRANS_CENTER_TO_LEFT],
  });

  // 左边待机
  states.set(VideoStateID.IDLE_LEFT, {
    stateID: VideoStateID.IDLE_LEFT,
    videoSource: VIDEO_PATHS.IDLE_LEFT,
    isLoop: true,
    nextStateID: null,
    preloadStates: [VideoStateID.TRANS_LEFT_TO_CENTER],
  });

  // ========== 过渡状态（单次播放，自动跳转）==========
  
  // 中间 → 左边
  states.set(VideoStateID.TRANS_CENTER_TO_LEFT, {
    stateID: VideoStateID.TRANS_CENTER_TO_LEFT,
    videoSource: VIDEO_PATHS.TRANS_C2L,
    isLoop: false,
    nextStateID: VideoStateID.IDLE_LEFT,
    preloadStates: [VideoStateID.IDLE_LEFT],
  });

  // 左边 → 中间
  states.set(VideoStateID.TRANS_LEFT_TO_CENTER, {
    stateID: VideoStateID.TRANS_LEFT_TO_CENTER,
    videoSource: VIDEO_PATHS.TRANS_L2C,
    isLoop: false,
    nextStateID: VideoStateID.IDLE_CENTER,
    preloadStates: [VideoStateID.IDLE_CENTER],
  });

  // ========== 动作状态（单次播放，返回待机）==========
  
  // 说话动作
  states.set(VideoStateID.ACTION_SPEAKING, {
    stateID: VideoStateID.ACTION_SPEAKING,
    videoSource: VIDEO_PATHS.ACTION_SPEAKING,
    isLoop: false,
    nextStateID: VideoStateID.IDLE_CENTER, // 动作结束后返回中间待机
    preloadStates: [VideoStateID.IDLE_CENTER],
  });

  return {
    states,
    initialState: VideoStateID.IDLE_CENTER,
    defaultIdleState: VideoStateID.IDLE_CENTER,
  };
}

/**
 * 扩展配置示例：添加右侧面板支持
 * 
 * 如果有更多视频文件，可以添加右侧相关状态：
 */
export function createFullConfig(): StateMachineConfig {
  const baseConfig = createCustomConfig();
  
  // 示例：添加右侧状态（需要对应的视频文件）
  // baseConfig.states.set(VideoStateID.IDLE_RIGHT, { ... });
  // baseConfig.states.set(VideoStateID.TRANS_CENTER_TO_RIGHT, { ... });
  // baseConfig.states.set(VideoStateID.TRANS_RIGHT_TO_CENTER, { ... });
  
  return baseConfig;
}

/**
 * 调试配置：使用占位视频
 */
export function createDebugConfig(): StateMachineConfig {
  const config = createCustomConfig();
  
  // 可以在这里替换为测试视频
  // config.states.get(VideoStateID.IDLE_CENTER)!.videoSource = '/test/idle.mp4';
  
  return config;
}

export default createCustomConfig;
