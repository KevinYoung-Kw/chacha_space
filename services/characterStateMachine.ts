/**
 * VirtualCharacterStateMachine - 虚拟人物视频状态机
 * 
 * 核心功能：
 * 1. 有限状态机 (FSM) 管理人物行为状态
 * 2. 双缓冲策略实现无缝视频切换
 * 3. 预加载机制确保零延迟过渡
 * 4. 支持强制打断和自动跳转
 * 5. 空闲检测 - 长时间不操作自动播放睡觉/随机待机动画
 * 6. 智能情绪选择 - 根据用户输入选择合适的动画
 * 7. 集成视频预加载服务，优先使用缓存的视频
 */

import { videoPreloader, loadVideoOnDemand } from './videoPreloader';

// ==================== 类型定义 ====================

/** 视频状态唯一标识枚举 */
export enum VideoStateID {
  // 待机状态 (循环)
  IDLE_CENTER = 'IDLE_CENTER',
  IDLE_LEFT = 'IDLE_LEFT',
  IDLE_RIGHT = 'IDLE_RIGHT',
  
  // 过渡状态 (单次播放)
  TRANS_CENTER_TO_LEFT = 'TRANS_CENTER_TO_LEFT',
  TRANS_LEFT_TO_CENTER = 'TRANS_LEFT_TO_CENTER',
  TRANS_CENTER_TO_RIGHT = 'TRANS_CENTER_TO_RIGHT',
  TRANS_RIGHT_TO_CENTER = 'TRANS_RIGHT_TO_CENTER',
  
  // 一次性动作状态
  ACTION_WAVE = 'ACTION_WAVE',
  ACTION_NOD = 'ACTION_NOD',
  ACTION_THINKING = 'ACTION_THINKING',
  ACTION_SPEAKING = 'ACTION_SPEAKING',
  
  // 情绪与动作
  ACTION_CRYING = 'ACTION_CRYING',
  ACTION_SHY = 'ACTION_SHY',
  ACTION_SHOUTING = 'ACTION_SHOUTING',
  ACTION_SLEEPING = 'ACTION_SLEEPING',
  ACTION_ANGRY_CROSS = 'ACTION_ANGRY_CROSS',
  ACTION_LISTENING_V2 = 'ACTION_LISTENING_V2',
  ACTION_IDLE_ALT = 'ACTION_IDLE_ALT',
  ACTION_IDLE_1 = 'ACTION_IDLE_1',
  ACTION_IDLE_3 = 'ACTION_IDLE_3',
  
  // 新增：完整情绪动作
  ACTION_HAPPY = 'ACTION_HAPPY',
  ACTION_EXCITED = 'ACTION_EXCITED',
  ACTION_RAGE = 'ACTION_RAGE',
  ACTION_SCARED = 'ACTION_SCARED',
  ACTION_DISAPPROVE = 'ACTION_DISAPPROVE',
  ACTION_SINGING = 'ACTION_SINGING',
  ACTION_LISTENING_MUSIC = 'ACTION_LISTENING_MUSIC',
  ACTION_JUMP = 'ACTION_JUMP',
  ACTION_PHONE = 'ACTION_PHONE',
  ACTION_CHECK_PHONE = 'ACTION_CHECK_PHONE',
  ACTION_NOTES = 'ACTION_NOTES',
  
  // 新增：天气相关
  ACTION_WEATHER = 'ACTION_WEATHER',
  
  // 新增：技能相关
  ACTION_SKILL = 'ACTION_SKILL',
  
  // 新增：风相关
  ACTION_WIND_BLOWING = 'ACTION_WIND_BLOWING',
  ACTION_STRONG_WIND = 'ACTION_STRONG_WIND',
  ACTION_WIND_BLOWING_2 = 'ACTION_WIND_BLOWING_2',
  
  // 新增：跳舞相关
  ACTION_DANCING = 'ACTION_DANCING',
  ACTION_DANCING_2 = 'ACTION_DANCING_2',
  
  // 新增：塔罗相关
  ACTION_TAROT_READING = 'ACTION_TAROT_READING',
  
  // 新增：其他动作
  ACTION_SLEEPING_LONG = 'ACTION_SLEEPING_LONG',
  ACTION_SURPRISED_OBSERVE = 'ACTION_SURPRISED_OBSERVE',
  ACTION_DRINKING_WATER = 'ACTION_DRINKING_WATER',
  ACTION_OBSERVING = 'ACTION_OBSERVING',
  ACTION_IDLE_4 = 'ACTION_IDLE_4',
}

/** 可用的情绪/动作名称（用于 API 返回） */
export type EmotionActionName = 
  | 'idle' | 'idle_alt' | 'idle_1' | 'idle_3' | 'idle_4'
  | 'happy' | 'excited' | 'crying' | 'shy' | 'scared'
  | 'angry' | 'angry_cross' | 'rage' | 'disapprove' | 'shouting'
  | 'sleeping' | 'sleeping_long' | 'listening' | 'listening_v2'
  | 'singing' | 'jump' | 'phone' | 'check_phone' | 'notes'
  | 'speaking' | 'thinking' | 'wave' | 'nod'
  | 'weather'
  | 'skill'
  | 'wind_blowing' | 'strong_wind' | 'wind_blowing_2'
  | 'dancing' | 'dancing_2'
  | 'tarot_reading'
  | 'surprised_observe' | 'drinking_water'
  | 'observing';

/** 视频状态对象 */
export interface VideoState {
  /** 状态唯一标识 */
  stateID: VideoStateID;
  /** 视频文件路径/URL */
  videoSource: string;
  /** 是否循环播放 */
  isLoop: boolean;
  /** 当 isLoop=false 时，视频结束后自动跳转的目标状态 */
  nextStateID: VideoStateID | null;
  /** 可选：预加载的相邻状态（用于优化加载） */
  preloadStates?: VideoStateID[];
}

/** 状态机配置 */
export interface StateMachineConfig {
  /** 所有状态定义 */
  states: Map<VideoStateID, VideoState>;
  /** 初始状态 */
  initialState: VideoStateID;
  /** 默认回归状态（用于 Action 结束后返回） */
  defaultIdleState: VideoStateID;
  /** 空闲超时配置 */
  idleTimeout?: {
    /** 多少毫秒后触发随机待机动画（默认 30 秒） */
    randomIdleDelay: number;
    /** 多少毫秒后触发睡觉动画（默认 2 分钟） */
    sleepDelay: number;
    /** 随机待机可选动画列表 */
    randomIdleActions: string[];
  };
}

/** 状态变化事件回调 */
export interface StateChangeEvent {
  previousState: VideoStateID | null;
  currentState: VideoStateID;
  isInterrupted: boolean;
  timestamp: number;
}

/** 状态机事件监听器 */
export type StateChangeListener = (event: StateChangeEvent) => void;

/** 视频元素管理器（双缓冲） */
interface VideoBuffer {
  element: HTMLVideoElement;
  currentState: VideoStateID | null;
  isActive: boolean;
  isReady: boolean;
}

// ==================== 默认配置 ====================

/**
 * 创建默认状态配置
 * 使用透明背景 WebM 格式视频 (VP9 + Opus)
 * 详细动作清单: /public/character/VIDEO_ACTIONS.md
 */
export function createDefaultConfig(): StateMachineConfig {
  const states = new Map<VideoStateID, VideoState>();

  // 待机状态 - 中间 (循环) - 使用 action_1.webm
  states.set(VideoStateID.IDLE_CENTER, {
    stateID: VideoStateID.IDLE_CENTER,
    videoSource: '/character/action_1.webm',
    isLoop: true,
    nextStateID: null,
    preloadStates: [VideoStateID.TRANS_CENTER_TO_LEFT, VideoStateID.TRANS_CENTER_TO_RIGHT],
  });

  // 过渡：中间 → 左边 (单次) - 使用 action_2.webm
  states.set(VideoStateID.TRANS_CENTER_TO_LEFT, {
    stateID: VideoStateID.TRANS_CENTER_TO_LEFT,
    videoSource: '/character/action_2.webm',
    isLoop: false,
    nextStateID: VideoStateID.IDLE_LEFT,
    preloadStates: [VideoStateID.IDLE_LEFT],
  });

  // 待机状态 - 左边 (循环) - 使用 action_3.webm
  states.set(VideoStateID.IDLE_LEFT, {
    stateID: VideoStateID.IDLE_LEFT,
    videoSource: '/character/action_3.webm',
    isLoop: true,
    nextStateID: null,
    preloadStates: [VideoStateID.TRANS_LEFT_TO_CENTER],
  });

  // 过渡：左边 → 中间 (单次) - 使用 action_4.webm
  states.set(VideoStateID.TRANS_LEFT_TO_CENTER, {
    stateID: VideoStateID.TRANS_LEFT_TO_CENTER,
    videoSource: '/character/action_4.webm',
    isLoop: false,
    nextStateID: VideoStateID.IDLE_CENTER,
    preloadStates: [VideoStateID.IDLE_CENTER],
  });

  // 一次性动作 - 说话 - 使用 action_5.webm
  states.set(VideoStateID.ACTION_SPEAKING, {
    stateID: VideoStateID.ACTION_SPEAKING,
    videoSource: '/character/action_5.webm',
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

// ==================== 核心状态机类 ====================

export class VirtualCharacterStateMachine {
  private config: StateMachineConfig;
  private currentStateID: VideoStateID;
  private previousIdleState: VideoStateID; // 用于 Action 结束后恢复
  
  // 双缓冲视频元素
  private bufferA: VideoBuffer | null = null;
  private bufferB: VideoBuffer | null = null;
  private activeBuffer: 'A' | 'B' = 'A';
  
  // 预加载缓存
  private preloadCache: Map<VideoStateID, HTMLVideoElement> = new Map();
  
  // 事件监听器
  private listeners: Set<StateChangeListener> = new Set();
  
  // 打断标记
  private interruptFlag: boolean = false;
  private transitionLock: boolean = false;
  
  // 空闲计时器
  private lastActivityTime: number = Date.now();
  private idleCheckInterval: ReturnType<typeof setInterval> | null = null;
  private isInIdleMode: boolean = false; // 是否已进入空闲模式（正在播放随机待机或睡觉）

  constructor(config?: StateMachineConfig) {
    this.config = config || createDefaultConfig();
    this.currentStateID = this.config.initialState;
    this.previousIdleState = this.config.defaultIdleState;
  }
  
  // ==================== 空闲检测 ====================
  
  /**
   * 重置活动时间（用户有交互时调用）
   */
  public resetActivityTimer(): void {
    this.lastActivityTime = Date.now();
    this.isInIdleMode = false;
  }
  
  /**
   * 启动空闲检测
   */
  public startIdleDetection(): void {
    if (this.idleCheckInterval) return;
    
    const timeout = this.config.idleTimeout || {
      randomIdleDelay: 30000,  // 30秒
      sleepDelay: 120000,      // 2分钟
      randomIdleActions: ['idle_alt', 'idle_1', 'idle_3', 'listening_v2']
    };
    
    this.idleCheckInterval = setInterval(() => {
      // 如果正在执行非循环动作，不检测空闲
      if (!this.isIdleState(this.currentStateID) && !this.isInIdleMode) {
        return;
      }
      
      const idleTime = Date.now() - this.lastActivityTime;
      
      // 超过睡觉延迟 -> 播放睡觉（随机选择普通睡觉或长睡眠）
      if (idleTime >= timeout.sleepDelay && !this.isInIdleMode) {
        // 80% 概率播放普通睡觉，20% 概率播放长睡眠
        const sleepAction = Math.random() < 0.8 ? 'sleeping' : 'sleeping_long';
        this.isInIdleMode = true;
        this.playAction(sleepAction);
      }
      // 超过随机待机延迟 -> 播放随机待机动画
      else if (idleTime >= timeout.randomIdleDelay && !this.isInIdleMode) {
        const randomAction = timeout.randomIdleActions[
          Math.floor(Math.random() * timeout.randomIdleActions.length)
        ];
        this.isInIdleMode = true;
        this.playAction(randomAction);
      }
    }, 5000); // 每5秒检查一次
  }
  
  /**
   * 停止空闲检测
   */
  public stopIdleDetection(): void {
    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
      this.idleCheckInterval = null;
    }
  }

  // ==================== 初始化 ====================

  /**
   * 初始化状态机，绑定视频元素
   * @param containerElement 容器元素（用于创建双缓冲视频）
   */
  public initialize(containerElement: HTMLElement): void {
    
    // 创建双缓冲视频元素
    this.bufferA = this.createVideoBuffer('buffer-a');
    this.bufferB = this.createVideoBuffer('buffer-b');

    // 添加到容器
    containerElement.appendChild(this.bufferA.element);
    containerElement.appendChild(this.bufferB.element);

    // 设置初始状态
    this.loadVideoToBuffer(this.bufferA, this.currentStateID);
    this.bufferA.isActive = true;
    this.bufferA.element.style.opacity = '1';
    this.bufferA.element.style.zIndex = '2';
    this.bufferA.element.style.pointerEvents = 'none';
    
    this.bufferB.element.style.opacity = '0';
    this.bufferB.element.style.zIndex = '1';
    this.bufferB.element.style.pointerEvents = 'none';

    // 预加载相邻状态
    this.preloadAdjacentStates(this.currentStateID);
    
    // 启动空闲检测
    this.startIdleDetection();

  }

  /**
   * 创建视频缓冲元素
   */
  private createVideoBuffer(id: string): VideoBuffer {
    const video = document.createElement('video');
    video.id = id;
    video.className = 'absolute inset-0 w-full h-full object-contain transition-opacity duration-100';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.autoplay = true; // 添加 autoplay 属性
    video.setAttribute('webkit-playsinline', 'true'); // iOS 支持
    video.setAttribute('x5-playsinline', 'true'); // 微信/QQ 浏览器支持
    video.setAttribute('x5-video-player-type', 'h5'); // 微信内置浏览器支持
    
    // 设置视频样式确保可见
    video.style.backgroundColor = 'transparent';
    video.style.objectFit = 'contain';
    
    // 关键：监听视频结束事件
    video.addEventListener('ended', () => this.handleVideoEnded(id));
    
    // 监听可播放事件
    video.addEventListener('canplaythrough', () => {
      const buffer = id === 'buffer-a' ? this.bufferA : this.bufferB;
      if (buffer) {
        buffer.isReady = true;
        // 自动尝试播放
        if (buffer.isActive) {
          video.play().catch(() => {});
        }
      }
    });

    // 监听错误事件
    video.addEventListener('error', (e) => {
      const buffer = id === 'buffer-a' ? this.bufferA : this.bufferB;
      
      // 标记视频加载失败，不要尝试重新加载（避免无限循环）
      if (buffer) {
        buffer.isReady = false;
      }
    });

    // 监听加载元数据事件
    video.addEventListener('loadedmetadata', () => {
    });

    return {
      element: video,
      currentState: null,
      isActive: false,
      isReady: false,
    };
  }

  /**
   * 预加载相邻状态视频
   * 优先使用全局预加载服务
   */
  private preloadAdjacentStates(stateID: VideoStateID): void {
    const state = this.config.states.get(stateID);
    if (!state?.preloadStates) return;

    state.preloadStates.forEach(preloadStateID => {
      // 如果本地缓存已有，跳过
      if (this.preloadCache.has(preloadStateID)) return;

      const preloadState = this.config.states.get(preloadStateID);
      if (!preloadState) return;

      // 检查全局预加载服务是否已缓存
      if (videoPreloader.isVideoLoaded(preloadState.videoSource)) {
        return; // 已由全局服务缓存
      }

      // 触发全局预加载服务按需加载
      loadVideoOnDemand(preloadState.videoSource).catch(() => {
        // 如果全局服务加载失败，回退到本地预加载
        const preloadVideo = document.createElement('video');
        preloadVideo.src = preloadState.videoSource;
        preloadVideo.preload = 'auto';
        preloadVideo.muted = true;
        preloadVideo.load();
        this.preloadCache.set(preloadStateID, preloadVideo);
      });
    });
  }

  /**
   * 加载视频到缓冲区
   * 优先使用预加载服务缓存的视频
   */
  private loadVideoToBuffer(buffer: VideoBuffer, stateID: VideoStateID): void {
    const state = this.config.states.get(stateID);
    if (!state) {
      return;
    }

    buffer.currentState = stateID;
    buffer.isReady = false;
    buffer.element.loop = state.isLoop;
    
    // 优先检查全局预加载服务的缓存
    const cachedUrl = videoPreloader.getVideoUrl(state.videoSource);
    if (cachedUrl) {
      buffer.element.src = cachedUrl;
      // 注意：不要在这里设置 isReady = true，等待视频元素真正准备好
      console.log(`[StateMachine] 使用缓存视频: ${state.videoSource.split('/').pop()}`);
    }
    // 其次检查本地预加载缓存
    else {
      const cachedVideo = this.preloadCache.get(stateID);
      if (cachedVideo && cachedVideo.readyState >= 3) {
        buffer.element.src = cachedVideo.src;
      } else {
        // 按需加载视频（直接使用原始 URL）
        buffer.element.src = state.videoSource;
        // 异步触发预加载服务加载此视频（供下次使用）
        loadVideoOnDemand(state.videoSource).catch(() => {});
      }
    }
    
    buffer.element.load();
  }

  // ==================== 状态切换核心逻辑 ====================

  /**
   * 切换到指定状态（核心方法）
   * @param targetStateID 目标状态
   * @param isInterrupt 是否为打断操作
   * @param retryCount 重试次数（内部使用）
   */
  private async transitionTo(targetStateID: VideoStateID, isInterrupt: boolean = false, retryCount: number = 0): Promise<void> {
    const MAX_RETRIES = 2;
    
    // 防止递归过深
    if (retryCount > MAX_RETRIES) {
      console.warn('[StateMachine] 达到最大重试次数，停止切换');
      this.interruptFlag = false;
      return;
    }
    
    // 获取目标状态配置
    const targetState = this.config.states.get(targetStateID);
    if (!targetState) {
      console.warn(`[StateMachine] 状态 ${targetStateID} 不存在`);
      return;
    }

    // 设置打断标记
    if (isInterrupt) {
      this.interruptFlag = true;
    }

    // 获取当前活动缓冲区和待命缓冲区
    const currentBuffer = this.activeBuffer === 'A' ? this.bufferA : this.bufferB;
    const nextBuffer = this.activeBuffer === 'A' ? this.bufferB : this.bufferA;

    if (!currentBuffer || !nextBuffer) {
      return;
    }

    // 记录之前的状态
    const previousState = this.currentStateID;

    // 如果当前是待机状态，记录下来用于 Action 恢复
    if (this.isIdleState(previousState)) {
      this.previousIdleState = previousState;
    }

    // 预加载下一个视频到待命缓冲区
    this.loadVideoToBuffer(nextBuffer, targetStateID);

    // 等待下一个视频准备就绪（增加超时时间到 5 秒）
    await this.waitForVideoReady(nextBuffer, 5000);

    // 检查视频是否真的准备好了
    if (nextBuffer.element.error || !nextBuffer.isReady) {
      console.warn(`[StateMachine] 视频加载失败: ${targetState.videoSource.split('/').pop()}`);
      
      // 如果当前 buffer 还在正常播放，就保持当前状态
      if (currentBuffer.element && !currentBuffer.element.error && 
          currentBuffer.element.readyState >= 2 && !currentBuffer.element.paused) {
        console.log('[StateMachine] 保持当前状态，当前视频仍在播放');
        this.interruptFlag = false;
        return;
      }
      
      // 查找一个已加载的回退动画
      const fallbackState = this.getFallbackAnimation();
      if (fallbackState && fallbackState !== targetStateID) {
        console.log(`[StateMachine] 使用回退动画: ${fallbackState}`);
        setTimeout(() => {
          this.transitionTo(fallbackState, true, retryCount + 1);
        }, 50);
        return;
      }
      
      // 最后的尝试：直接使用原始 URL
      console.warn('[StateMachine] 尝试直接使用原始 URL');
      nextBuffer.element.src = targetState.videoSource;
      nextBuffer.element.load();
      
      // 再等待一次
      await this.waitForVideoReady(nextBuffer, 3000);
      if (!nextBuffer.isReady) {
        console.error('[StateMachine] 视频加载彻底失败，放弃切换');
        this.interruptFlag = false;
        return;
      }
    }

    // 检查是否被新的打断取消
    if (this.interruptFlag && !isInterrupt) {
      return;
    }

    // 执行无缝切换
    await this.performSeamlessSwitch(currentBuffer, nextBuffer);

    // 更新状态
    this.currentStateID = targetStateID;
    this.interruptFlag = false;

    // 切换活动缓冲区标记
    this.activeBuffer = this.activeBuffer === 'A' ? 'B' : 'A';

    // 播放新视频
    try {
      await nextBuffer.element.play();
    } catch (e) {
      console.warn('[StateMachine] 自动播放被阻止，等待用户交互');
      // 当自动播放被阻止时，添加一次性点击监听器来恢复播放
      const resumePlayback = async () => {
        try {
          await nextBuffer.element.play();
          document.removeEventListener('click', resumePlayback);
          document.removeEventListener('touchstart', resumePlayback);
        } catch (err) {
        }
      };
      document.addEventListener('click', resumePlayback, { once: true });
      document.addEventListener('touchstart', resumePlayback, { once: true });
    }

    // 预加载下一个可能的状态
    this.preloadAdjacentStates(targetStateID);

    // 触发状态变化事件
    this.emitStateChange({
      previousState,
      currentState: targetStateID,
      isInterrupted: isInterrupt,
      timestamp: Date.now(),
    });
  }

  /**
   * 等待视频准备就绪
   */
  private waitForVideoReady(buffer: VideoBuffer, timeout: number): Promise<void> {
    return new Promise((resolve) => {
      // 如果已经准备好（readyState >= 2 表示有足够数据开始播放）
      if (buffer.element.readyState >= 2) {
        buffer.isReady = true;
        resolve();
        return;
      }

      let resolved = false;
      
      // 监听多个事件
      const onReady = () => {
        if (!resolved && buffer.element.readyState >= 2) {
          resolved = true;
          buffer.isReady = true;
          cleanup();
          resolve();
        }
      };

      // 监听错误事件
      const onError = () => {
        if (!resolved) {
          resolved = true;
          buffer.isReady = false;
          cleanup();
          resolve();
        }
      };

      const cleanup = () => {
        buffer.element.removeEventListener('canplay', onReady);
        buffer.element.removeEventListener('canplaythrough', onReady);
        buffer.element.removeEventListener('loadeddata', onReady);
        buffer.element.removeEventListener('error', onError);
      };

      buffer.element.addEventListener('canplay', onReady);
      buffer.element.addEventListener('canplaythrough', onReady);
      buffer.element.addEventListener('loadeddata', onReady);
      buffer.element.addEventListener('error', onError);

      // 超时保护
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          // 超时时检查当前状态
          buffer.isReady = buffer.element.readyState >= 2;
          resolve();
        }
      }, timeout);

      // 轮询检查（作为备用，每100ms检查一次）
      const checkInterval = setInterval(() => {
        if (resolved) {
          clearInterval(checkInterval);
          return;
        }
        
        if (buffer.element.readyState >= 2) {
          resolved = true;
          buffer.isReady = true;
          cleanup();
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }
  
  /**
   * 获取一个已加载的回退动画
   * 用于当目标动画加载失败时
   */
  private getFallbackAnimation(): VideoStateID | null {
    // 优先级列表：优先选择已缓存的动画
    const fallbackOrder: VideoStateID[] = [
      VideoStateID.IDLE_CENTER,
      VideoStateID.ACTION_IDLE_1,
      VideoStateID.ACTION_HAPPY,
      VideoStateID.ACTION_IDLE_ALT,
      VideoStateID.ACTION_IDLE_3,
    ];
    
    for (const stateID of fallbackOrder) {
      const state = this.config.states.get(stateID);
      if (state && videoPreloader.isVideoLoaded(state.videoSource)) {
        return stateID;
      }
    }
    
    // 如果没有缓存的动画，返回 IDLE_CENTER（会直接使用原始 URL）
    return VideoStateID.IDLE_CENTER;
  }
  
  /**
   * 根据动作类型查找已缓存的替代动画
   * 会尝试找同类型的已缓存动画
   */
  private findCachedAlternative(actionName: string, actionMap: Record<string, VideoStateID>): VideoStateID | null {
    // 定义动作分类和替代优先级
    const actionCategories: Record<string, string[]> = {
      // 正面情绪
      positive: ['happy', 'excited', 'jump', 'dancing', 'dancing_2', 'singing'],
      // 负面情绪
      negative: ['shy', 'crying', 'scared', 'angry', 'rage', 'disapprove', 'shouting'],
      // 待机/倾听
      idle: ['idle_1', 'idle_3', 'idle_4', 'idle_alt', 'listening_v2', 'observing'],
      // 说话/思考
      speaking: ['speaking', 'thinking', 'happy', 'nod'],
      // 功能性动作
      functional: ['weather', 'tarot_reading', 'notes', 'check_phone', 'phone', 'drinking_water'],
    };
    
    // 找到当前动作所属的分类
    let category: string | null = null;
    for (const [cat, actions] of Object.entries(actionCategories)) {
      if (actions.includes(actionName)) {
        category = cat;
        break;
      }
    }
    
    // 如果找不到分类，默认使用 speaking 分类
    if (!category) {
      category = 'speaking';
    }
    
    // 在同分类中查找已缓存的动画
    const categoryActions = actionCategories[category] || [];
    for (const altAction of categoryActions) {
      if (altAction === actionName) continue; // 跳过原动作
      
      const altStateID = actionMap[altAction];
      if (!altStateID) continue;
      
      const altState = this.config.states.get(altStateID);
      if (altState && videoPreloader.isVideoLoaded(altState.videoSource)) {
        return altStateID;
      }
    }
    
    // 如果同分类没有找到，尝试使用通用的替代动画
    const universalFallbacks: VideoStateID[] = [
      VideoStateID.ACTION_HAPPY,
      VideoStateID.ACTION_IDLE_1,
      VideoStateID.ACTION_LISTENING_V2,
    ];
    
    for (const fallbackID of universalFallbacks) {
      const fallbackState = this.config.states.get(fallbackID);
      if (fallbackState && videoPreloader.isVideoLoaded(fallbackState.videoSource)) {
        return fallbackID;
      }
    }
    
    // 没有找到合适的替代，返回 null（让调用者使用原始动画）
    return null;
  }

  /**
   * 执行无缝视频切换（关键：确保零黑屏）
   */
  private async performSeamlessSwitch(
    currentBuffer: VideoBuffer, 
    nextBuffer: VideoBuffer
  ): Promise<void> {
    return new Promise((resolve) => {
      // 确保下一个视频定位到开头
      nextBuffer.element.currentTime = 0;

      // 使用 requestAnimationFrame 确保在同一帧内完成切换
      requestAnimationFrame(() => {
        // 立即显示新视频
        nextBuffer.element.style.opacity = '1';
        nextBuffer.element.style.zIndex = '2';
        nextBuffer.isActive = true;

        // 延迟隐藏旧视频（确保重叠期间无黑屏）
        requestAnimationFrame(() => {
          currentBuffer.element.style.opacity = '0';
          currentBuffer.element.style.zIndex = '1';
          currentBuffer.isActive = false;
          currentBuffer.element.pause();
          
          resolve();
        });
      });
    });
  }

  /**
   * 处理视频结束事件
   */
  private handleVideoEnded(bufferId: string): void {
    const buffer = bufferId === 'buffer-a' ? this.bufferA : this.bufferB;
    if (!buffer || !buffer.isActive) return;

    const currentState = this.config.states.get(this.currentStateID);
    if (!currentState) return;

    // 如果有自动跳转目标，执行跳转
    if (!currentState.isLoop && currentState.nextStateID) {
      this.transitionTo(currentState.nextStateID, false);
      return;
    }

    // 特殊处理：如果当前是待机动画且没有 nextStateID，播放完后随机选择下一个待机动画
    const idleAnimationPattern = /^(IDLE_CENTER|ACTION_(IDLE_|LISTENING_V2|OBSERVING))/;
    if (idleAnimationPattern.test(this.currentStateID) && !currentState.isLoop && !currentState.nextStateID) {
      const nextIdleAnimation = this.getRandomIdleAnimation();
      this.playAction(nextIdleAnimation);
    }
  }

  /**
   * 判断是否为待机状态
   */
  private isIdleState(stateID: VideoStateID): boolean {
    return stateID.startsWith('IDLE_');
  }
  
  /**
   * 获取随机待机动画
   */
  private getRandomIdleAnimation(): string {
    const idleAnimations = [
      'idle_1',
      'idle_3', 
      'idle_4',
      'idle_alt',
      'listening_v2',
      'observing',
    ];
    return idleAnimations[Math.floor(Math.random() * idleAnimations.length)];
  }

  // ==================== 公共 API ====================

  /**
   * 场景 A：聚焦左侧（打开左侧面板）
   */
  public focusLeft(): void {
    this.resetActivityTimer(); // 重置活动计时器
    
    // 如果已经在左边，不做任何事
    if (this.currentStateID === VideoStateID.IDLE_LEFT) return;
    
    // 打断当前状态，开始过渡
    this.transitionTo(VideoStateID.TRANS_CENTER_TO_LEFT, true);
  }

  /**
   * 场景 B：聚焦右侧（打开右侧面板）
   */
  public focusRight(): void {
    this.resetActivityTimer(); // 重置活动计时器
    
    // 如果已经在右边，不做任何事
    if (this.currentStateID === VideoStateID.IDLE_RIGHT) return;
    
    // 使用中间到右边的过渡（如果有配置的话）
    const transState = this.config.states.get(VideoStateID.TRANS_CENTER_TO_RIGHT);
    if (transState) {
      this.transitionTo(VideoStateID.TRANS_CENTER_TO_RIGHT, true);
    }
  }

  /**
   * 场景 C：聚焦中间（关闭面板，返回默认）
   */
  public focusCenter(): void {
    this.resetActivityTimer(); // 重置活动计时器
    
    // 如果已经在中间，不做任何事
    if (this.currentStateID === VideoStateID.IDLE_CENTER) return;
    
    // 根据当前位置选择过渡路径
    if (this.currentStateID === VideoStateID.IDLE_LEFT || 
        this.currentStateID === VideoStateID.TRANS_CENTER_TO_LEFT) {
      this.transitionTo(VideoStateID.TRANS_LEFT_TO_CENTER, true);
    } else if (this.currentStateID === VideoStateID.IDLE_RIGHT ||
               this.currentStateID === VideoStateID.TRANS_CENTER_TO_RIGHT) {
      const transState = this.config.states.get(VideoStateID.TRANS_RIGHT_TO_CENTER);
      if (transState) {
        this.transitionTo(VideoStateID.TRANS_RIGHT_TO_CENTER, true);
      } else {
        // 没有配置过渡，直接跳转
        this.transitionTo(VideoStateID.IDLE_CENTER, true);
      }
    } else {
      // 其他情况直接跳转到中间
      this.transitionTo(VideoStateID.IDLE_CENTER, true);
    }
  }

  /**
   * 场景 D：播放一次性动作
   * @param actionName 动作名称
   * @param timeout 超时时间（毫秒），超时后自动回退到待机状态
   */
  public playAction(actionName: string, timeout: number = 8000): void {
    
    // 重置活动计时器（除了自动播放的随机待机动画）
    if (!this.isInIdleMode) {
      this.resetActivityTimer();
    }
    
    // 映射动作名称到状态
    const actionMap: Record<string, VideoStateID> = {
      // 基础动作
      'wave': VideoStateID.ACTION_WAVE,
      'nod': VideoStateID.ACTION_NOD,
      'thinking': VideoStateID.ACTION_THINKING,
      'speaking': VideoStateID.ACTION_SPEAKING,
      
      // 待机变体
      'idle_alt': VideoStateID.ACTION_IDLE_ALT,
      'idle_1': VideoStateID.ACTION_IDLE_1,
      'idle_3': VideoStateID.ACTION_IDLE_3,
      'idle_4': VideoStateID.ACTION_IDLE_4,
      
      // 情绪 - 正面
      'happy': VideoStateID.ACTION_HAPPY,
      'excited': VideoStateID.ACTION_EXCITED,
      'jump': VideoStateID.ACTION_JUMP,
      
      // 情绪 - 负面
      'crying': VideoStateID.ACTION_CRYING,
      'shy': VideoStateID.ACTION_SHY,
      'scared': VideoStateID.ACTION_SCARED,
      'angry': VideoStateID.ACTION_ANGRY_CROSS,
      'angry_cross': VideoStateID.ACTION_ANGRY_CROSS,
      'rage': VideoStateID.ACTION_RAGE,
      'disapprove': VideoStateID.ACTION_DISAPPROVE,
      'shouting': VideoStateID.ACTION_SHOUTING,
      
      // 活动状态
      'sleeping': VideoStateID.ACTION_SLEEPING,
      'sleeping_long': VideoStateID.ACTION_SLEEPING_LONG,
      'listening': VideoStateID.ACTION_LISTENING_MUSIC,
      'listening_music': VideoStateID.ACTION_LISTENING_MUSIC,
      'listening_v2': VideoStateID.ACTION_LISTENING_V2,
      'singing': VideoStateID.ACTION_SINGING,
      'phone': VideoStateID.ACTION_PHONE,
      'check_phone': VideoStateID.ACTION_CHECK_PHONE,
      'notes': VideoStateID.ACTION_NOTES,
      
      // 天气相关
      'weather': VideoStateID.ACTION_WEATHER,
      
      // 技能相关
      'skill': VideoStateID.ACTION_SKILL,
      
      // 风相关
      'wind_blowing': VideoStateID.ACTION_WIND_BLOWING,
      'strong_wind': VideoStateID.ACTION_STRONG_WIND,
      'wind_blowing_2': VideoStateID.ACTION_WIND_BLOWING_2,
      
      // 跳舞相关
      'dancing': VideoStateID.ACTION_DANCING,
      'dancing_2': VideoStateID.ACTION_DANCING_2,
      
      // 塔罗相关
      'tarot_reading': VideoStateID.ACTION_TAROT_READING,
      
      // 其他动作
      'surprised_observe': VideoStateID.ACTION_SURPRISED_OBSERVE,
      'drinking_water': VideoStateID.ACTION_DRINKING_WATER,
      'observing': VideoStateID.ACTION_OBSERVING,
    };

    let actionStateID = actionMap[actionName];
    if (!actionStateID) {
      console.warn(`[StateMachine] 未知动作: ${actionName}，使用默认动画`);
      actionStateID = VideoStateID.ACTION_HAPPY; // 默认使用 happy 动画
    }

    // 检查状态是否存在
    let actionState = this.config.states.get(actionStateID);
    if (!actionState) {
      console.warn(`[StateMachine] 动作状态 ${actionStateID} 未配置`);
      return;
    }
    
    // 检查目标动画是否已缓存，如果未缓存则选择替代动画
    if (!videoPreloader.isVideoLoaded(actionState.videoSource)) {
      const fallbackAction = this.findCachedAlternative(actionName, actionMap);
      if (fallbackAction && fallbackAction !== actionStateID) {
        console.log(`[StateMachine] 动画 ${actionName} 未缓存，使用替代: ${fallbackAction}`);
        actionStateID = fallbackAction;
        actionState = this.config.states.get(actionStateID)!;
      }
    }

    // 修改动作状态的 nextStateID 为当前待机状态
    actionState.nextStateID = this.previousIdleState;

    // 设置超时保护 - 如果动作播放超时，自动回退到待机状态
    const actionTimeoutId = setTimeout(() => {
      // 检查当前是否还在这个动作状态
      if (this.currentStateID === actionStateID) {
        console.warn(`[StateMachine] 动作 ${actionName} 超时，回退到待机状态`);
        this.transitionTo(this.previousIdleState || VideoStateID.IDLE_CENTER, true);
      }
    }, timeout);
    
    // 添加一次性状态变化监听器，在动作完成后清除超时
    const cleanup = this.addStateChangeListener((event) => {
      if (event.previousState === actionStateID) {
        clearTimeout(actionTimeoutId);
        cleanup();
      }
    });

    // 执行动作
    this.transitionTo(actionStateID, true);
  }

  /**
   * 获取当前状态
   */
  public getCurrentState(): VideoStateID {
    return this.currentStateID;
  }

  /**
   * 添加状态变化监听器
   */
  public addStateChangeListener(listener: StateChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 触发状态变化事件
   */
  private emitStateChange(event: StateChangeEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (e) {
      }
    });
  }

  /**
   * 销毁状态机，清理资源
   */
  public destroy(): void {
    // 停止空闲检测
    this.stopIdleDetection();
    
    // 停止所有视频
    if (this.bufferA) {
      this.bufferA.element.pause();
      this.bufferA.element.remove();
    }
    if (this.bufferB) {
      this.bufferB.element.pause();
      this.bufferB.element.remove();
    }

    // 清理预加载缓存
    this.preloadCache.forEach(video => {
      video.pause();
      video.src = '';
    });
    this.preloadCache.clear();

    // 清理监听器
    this.listeners.clear();
  }

  /**
   * 手动触发播放（用于解决浏览器自动播放限制）
   */
  public async play(): Promise<void> {
    const activeBuffer = this.activeBuffer === 'A' ? this.bufferA : this.bufferB;
    if (activeBuffer) {
      try {
        await activeBuffer.element.play();
      } catch (e) {
      }
    }
  }

  /**
   * 暂停播放
   */
  public pause(): void {
    const activeBuffer = this.activeBuffer === 'A' ? this.bufferA : this.bufferB;
    if (activeBuffer) {
      activeBuffer.element.pause();
    }
  }

  /**
   * 更新配置（用于动态修改视频映射）
   */
  public updateConfig(newConfig: Partial<StateMachineConfig>): void {
    if (newConfig.states) {
      newConfig.states.forEach((state, id) => {
        this.config.states.set(id, state);
      });
    }
    if (newConfig.defaultIdleState) {
      this.config.defaultIdleState = newConfig.defaultIdleState;
    }
  }
}

// ==================== 导出默认实例工厂 ====================

export function createCharacterStateMachine(config?: StateMachineConfig): VirtualCharacterStateMachine {
  return new VirtualCharacterStateMachine(config);
}
