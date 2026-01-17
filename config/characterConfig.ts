/**
 * characterConfig.ts - 视频人物状态机配置
 * 
 * 这个文件定义了视频文件与状态的映射关系
 * 根据实际的视频内容修改此配置
 * 
 * 新增功能：
 * - 空闲检测：30秒无操作播放随机待机，2分钟无操作播放睡觉
 * - 情绪选择：根据用户输入智能选择动画
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
 * - idle_action_1.webm: 默认待机动画（循环）
 * 
 * 情绪与动作：
 * - happy.webm, excited.webm, rage.webm, scared.webm, disapprove.webm
 * - singing.webm, listening_music.webm, jump.webm
 * - using_phone.webm, checking_phone.webm, taking_notes.webm
 * - crying.webm, shy.webm, angry_arms_crossed.webm, shouting.webm
 * - sleeping.webm, listening_v2.webm
 * - idle_alt.webm, idle_action_1.webm, idle_action_3.webm
 */

// 视频路径常量
const VIDEO_PATHS = {
  // 基础状态
  IDLE_CENTER: '/character/idle_action_1.webm',  // 使用 idle_action_1.webm 作为主待机
  TRANS_C2L: '/character/action_2.webm',
  IDLE_LEFT: '/character/action_3.webm',
  TRANS_L2C: '/character/action_4.webm',
  ACTION_SPEAKING: '/character/action_5.webm',
  
  // 默认待机
  IDLE_DEFAULT: '/character/idle_action_1.webm',
  
  // 情绪表达 - 正面
  EMOTION_HAPPY: '/character/happy.webm',
  EMOTION_EXCITED: '/character/excited.webm',
  ACTION_JUMP: '/character/jump.webm',
  
  // 情绪表达 - 负面
  EMOTION_RAGE: '/character/rage.webm',
  EMOTION_SCARED: '/character/scared.webm',
  EMOTION_DISAPPROVE: '/character/disapprove.webm',
  EMOTION_CRYING: '/character/crying.webm',
  EMOTION_SHY: '/character/shy.webm',
  ACTION_ANGRY_CROSS: '/character/angry_arms_crossed.webm',
  ACTION_SHOUTING: '/character/shouting.webm',
  
  // 活动状态
  ACTION_SLEEPING: '/character/sleeping.webm',
  ACTION_LISTENING_V2: '/character/listening_v2.webm',
  ACTION_SINGING: '/character/singing.webm',
  ACTION_LISTENING: '/character/listening_music.webm',
  ACTION_PHONE: '/character/using_phone.webm',
  ACTION_CHECK_PHONE: '/character/checking_phone.webm',
  ACTION_NOTES: '/character/taking_notes.webm',
  
  // 待机变体（用于随机待机）
  IDLE_ALT: '/character/idle_alt.webm',
  IDLE_ACTION_1: '/character/idle_action_1.webm',
  IDLE_ACTION_3: '/character/idle_action_3.webm',
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
 * 包含所有情绪和活动动作，以及空闲检测配置
 */
export function createEmotionalConfig(): StateMachineConfig {
  const config = createCustomConfig();
  const { states } = config;
  
  // 情绪动作映射 - 所有可用的动画
  const emotionActions = [
    // 情绪 - 正面
    { id: 'ACTION_HAPPY', video: VIDEO_PATHS.EMOTION_HAPPY },
    { id: 'ACTION_EXCITED', video: VIDEO_PATHS.EMOTION_EXCITED },
    { id: 'ACTION_JUMP', video: VIDEO_PATHS.ACTION_JUMP },
    
    // 情绪 - 负面
    { id: 'ACTION_RAGE', video: VIDEO_PATHS.EMOTION_RAGE },
    { id: 'ACTION_SCARED', video: VIDEO_PATHS.EMOTION_SCARED },
    { id: 'ACTION_DISAPPROVE', video: VIDEO_PATHS.EMOTION_DISAPPROVE },
    { id: 'ACTION_CRYING', video: VIDEO_PATHS.EMOTION_CRYING },
    { id: 'ACTION_SHY', video: VIDEO_PATHS.EMOTION_SHY },
    { id: 'ACTION_ANGRY_CROSS', video: VIDEO_PATHS.ACTION_ANGRY_CROSS },
    { id: 'ACTION_SHOUTING', video: VIDEO_PATHS.ACTION_SHOUTING },
    
    // 活动状态
    { id: 'ACTION_SINGING', video: VIDEO_PATHS.ACTION_SINGING },
    { id: 'ACTION_LISTENING_MUSIC', video: VIDEO_PATHS.ACTION_LISTENING },
    { id: 'ACTION_PHONE', video: VIDEO_PATHS.ACTION_PHONE },
    { id: 'ACTION_CHECK_PHONE', video: VIDEO_PATHS.ACTION_CHECK_PHONE },
    { id: 'ACTION_NOTES', video: VIDEO_PATHS.ACTION_NOTES },
    { id: 'ACTION_SLEEPING', video: VIDEO_PATHS.ACTION_SLEEPING },
    { id: 'ACTION_LISTENING_V2', video: VIDEO_PATHS.ACTION_LISTENING_V2 },
    
    // 待机变体（用于随机待机动画）
    { id: 'ACTION_IDLE_ALT', video: VIDEO_PATHS.IDLE_ALT },
    { id: 'ACTION_IDLE_1', video: VIDEO_PATHS.IDLE_ACTION_1 },
    { id: 'ACTION_IDLE_3', video: VIDEO_PATHS.IDLE_ACTION_3 },
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
  
  // 添加空闲超时配置
  return {
    ...config,
    idleTimeout: {
      randomIdleDelay: 30000,   // 30秒无操作 -> 随机待机动画
      sleepDelay: 120000,       // 2分钟无操作 -> 睡觉动画
      randomIdleActions: [
        'idle_alt',      // 备选待机
        'idle_1',        // 待机动作1
        'idle_3',        // 待机动作3
        'listening_v2',  // 倾听
        'check_phone',   // 查手机
      ]
    }
  };
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
