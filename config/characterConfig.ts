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
 * 所有视频已转换为透明背景 WebM 格式 (VP9 + Opus)
 * 详细动作清单请查看: /public/character/VIDEO_ACTIONS.md
 * 
 * 基础动作：
 * - action_1.webm: 待机中间（循环）
 * - action_2.webm: 过渡动画（中间 → 左边）
 * - action_3.webm: 待机左边（循环）
 * - action_4.webm: 过渡动画（左边 → 中间）
 * - action_5.webm: 说话/动作（单次）
 * - idle.webm: 默认待机动画（循环）
 * 
 * 情绪与动作：
 * - happy.webm, excited.webm, rage.webm, scared.webm, disapprove.webm
 * - singing.webm, listening_music.webm, jump.webm
 * - using_phone.webm, checking_phone.webm, taking_notes.webm
 */

// 视频路径常量
const VIDEO_PATHS = {
  // 基础状态
  IDLE_CENTER: '/character/action_1.webm',
  TRANS_C2L: '/character/action_2.webm',
  IDLE_LEFT: '/character/action_3.webm',
  TRANS_L2C: '/character/action_4.webm',
  ACTION_SPEAKING: '/character/action_5.webm',
  
  // 默认待机
  IDLE_DEFAULT: '/character/idle.webm',
  
  // 情绪表达
  EMOTION_HAPPY: '/character/happy.webm',
  EMOTION_EXCITED: '/character/excited.webm',
  EMOTION_RAGE: '/character/rage.webm',
  EMOTION_SCARED: '/character/scared.webm',
  EMOTION_DISAPPROVE: '/character/disapprove.webm',
  
  // 活动动作
  ACTION_SINGING: '/character/singing.webm',
  ACTION_LISTENING: '/character/listening_music.webm',
  ACTION_JUMP: '/character/jump.webm',
  ACTION_PHONE: '/character/using_phone.webm',
  ACTION_CHECK_PHONE: '/character/checking_phone.webm',
  ACTION_NOTES: '/character/taking_notes.webm',
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

  // 挥手动作（点击待办按钮时触发 - 使用默认待机动画）
  states.set(VideoStateID.ACTION_WAVE, {
    stateID: VideoStateID.ACTION_WAVE,
    videoSource: VIDEO_PATHS.IDLE_DEFAULT,
    isLoop: false,
    nextStateID: VideoStateID.IDLE_CENTER,
    preloadStates: [VideoStateID.IDLE_CENTER],
  });

  return {
    states,
    initialState: VideoStateID.IDLE_CENTER,
    defaultIdleState: VideoStateID.IDLE_CENTER,
  };
}

/**
 * 扩展配置示例：添加更多情绪和动作支持
 * 
 * 使用新的透明背景动作视频
 */
export function createFullConfig(): StateMachineConfig {
  const baseConfig = createCustomConfig();
  
  // 可以根据需要添加更多自定义动作状态
  // 例如添加情绪反应：
  /*
  baseConfig.states.set('ACTION_HAPPY' as VideoStateID, {
    stateID: 'ACTION_HAPPY' as VideoStateID,
    videoSource: VIDEO_PATHS.EMOTION_HAPPY,
    isLoop: false,
    nextStateID: VideoStateID.IDLE_CENTER,
    preloadStates: [VideoStateID.IDLE_CENTER],
  });
  
  baseConfig.states.set('ACTION_EXCITED' as VideoStateID, {
    stateID: 'ACTION_EXCITED' as VideoStateID,
    videoSource: VIDEO_PATHS.EMOTION_EXCITED,
    isLoop: false,
    nextStateID: VideoStateID.IDLE_CENTER,
    preloadStates: [VideoStateID.IDLE_CENTER],
  });
  */
  
  return baseConfig;
}

/**
 * 创建带有丰富情绪表达的配置
 * 包含所有情绪和活动动作
 */
export function createEmotionalConfig(): StateMachineConfig {
  const config = createCustomConfig();
  const { states } = config;
  
  // 情绪动作映射
  const emotionActions = [
    { id: 'ACTION_HAPPY', video: VIDEO_PATHS.EMOTION_HAPPY },
    { id: 'ACTION_EXCITED', video: VIDEO_PATHS.EMOTION_EXCITED },
    { id: 'ACTION_RAGE', video: VIDEO_PATHS.EMOTION_RAGE },
    { id: 'ACTION_SCARED', video: VIDEO_PATHS.EMOTION_SCARED },
    { id: 'ACTION_DISAPPROVE', video: VIDEO_PATHS.EMOTION_DISAPPROVE },
    { id: 'ACTION_SINGING', video: VIDEO_PATHS.ACTION_SINGING },
    { id: 'ACTION_LISTENING', video: VIDEO_PATHS.ACTION_LISTENING },
    { id: 'ACTION_JUMP', video: VIDEO_PATHS.ACTION_JUMP },
    { id: 'ACTION_PHONE', video: VIDEO_PATHS.ACTION_PHONE },
    { id: 'ACTION_CHECK_PHONE', video: VIDEO_PATHS.ACTION_CHECK_PHONE },
    { id: 'ACTION_NOTES', video: VIDEO_PATHS.ACTION_NOTES },
  ];
  
  // 添加所有情绪动作到状态机
  emotionActions.forEach(({ id, video }) => {
    states.set(id as VideoStateID, {
      stateID: id as VideoStateID,
      videoSource: video,
      isLoop: false,
      nextStateID: VideoStateID.IDLE_CENTER,
      preloadStates: [VideoStateID.IDLE_CENTER],
    });
  });
  
  return config;
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
