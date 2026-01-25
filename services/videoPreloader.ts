/**
 * videoPreloader.ts - 视频资源预加载和缓存服务
 * 
 * 功能：
 * 1. 核心视频优先加载（保证基本功能）
 * 2. 其他视频按需懒加载
 * 3. 使用 Cache API 持久化缓存
 * 4. 提供加载进度和状态
 * 5. 支持在登录/注册阶段预加载
 */

// ==================== 类型定义 ====================

export interface VideoLoadState {
  url: string;
  status: 'pending' | 'loading' | 'loaded' | 'error';
  progress: number; // 0-100
  blob?: Blob;
  objectUrl?: string;
  error?: string;
}

export interface PreloadProgress {
  total: number;
  loaded: number;
  percent: number;
  coreReady: boolean; // 核心视频是否已全部加载
  currentFile?: string;
}

export type PreloadProgressCallback = (progress: PreloadProgress) => void;

// ==================== 视频列表配置 ====================

// 核心视频 - 必须优先加载，保证基本功能
const CORE_VIDEOS = [
  '/character/idle_action_1.webm',  // 主待机动画
  '/character/happy.webm',           // 说话/开心动画
  '/character/idle_action_3.webm',   // 左侧待机
];

// 常用视频 - 登录后立即加载
const COMMON_VIDEOS = [
  '/character/idle_alt.webm',
  '/character/idle_action_4.webm',
  '/character/listening_v2.webm',
  '/character/thinking.webm',        // 实际是 taking_notes.webm
  '/character/taking_notes.webm',
  '/character/shy.webm',
  '/character/excited.webm',
];

// 扩展视频 - 按需懒加载
const EXTENDED_VIDEOS = [
  '/character/crying.webm',
  '/character/scared.webm',
  '/character/rage.webm',
  '/character/disapprove.webm',
  '/character/angry_arms_crossed.webm',
  '/character/shouting.webm',
  '/character/singing.webm',
  '/character/listening_music.webm',
  '/character/jump.webm',
  '/character/using_phone.webm',
  '/character/checking_phone.webm',
  '/character/sleeping.webm',
  '/character/sleeping_long.webm',
  '/character/weather.webm',
  '/character/skill.webm',
  '/character/wind_blowing.webm',
  '/character/strong_wind.webm',
  '/character/wind_blowing_2.webm',
  '/character/dancing.webm',
  '/character/dancing_2.webm',
  '/character/tarot_reading.webm',
  '/character/surprised_observe.webm',
  '/character/drinking_water.webm',
  '/character/observing.webm',
];

// ==================== 单例类 ====================

class VideoPreloaderService {
  private static instance: VideoPreloaderService;
  
  // 视频加载状态
  private loadStates: Map<string, VideoLoadState> = new Map();
  
  // 进度回调
  private progressCallbacks: Set<PreloadProgressCallback> = new Set();
  
  // Cache API 缓存名称
  private readonly CACHE_NAME = 'chacha-video-cache-v1';
  
  // 是否正在预加载
  private isPreloading = false;
  
  // 核心视频是否就绪
  private coreReady = false;
  
  private constructor() {
    // 初始化所有视频状态
    [...CORE_VIDEOS, ...COMMON_VIDEOS, ...EXTENDED_VIDEOS].forEach(url => {
      this.loadStates.set(url, {
        url,
        status: 'pending',
        progress: 0,
      });
    });
  }
  
  public static getInstance(): VideoPreloaderService {
    if (!VideoPreloaderService.instance) {
      VideoPreloaderService.instance = new VideoPreloaderService();
    }
    return VideoPreloaderService.instance;
  }
  
  // ==================== 公共 API ====================
  
  /**
   * 开始预加载核心视频
   * 在登录/注册页面调用，确保进入主界面时核心视频已就绪
   */
  public async preloadCore(onProgress?: PreloadProgressCallback): Promise<void> {
    if (onProgress) {
      this.progressCallbacks.add(onProgress);
    }
    
    console.log('[VideoPreloader] 开始预加载核心视频...');
    
    // 先尝试从缓存恢复
    await this.restoreFromCache(CORE_VIDEOS);
    
    // 加载未缓存的核心视频
    const unloadedCore = CORE_VIDEOS.filter(url => {
      const state = this.loadStates.get(url);
      return state?.status !== 'loaded';
    });
    
    if (unloadedCore.length === 0) {
      console.log('[VideoPreloader] ✓ 核心视频已全部缓存');
      this.coreReady = true;
      this.emitProgress();
      return;
    }
    
    // 并行加载核心视频
    await Promise.all(unloadedCore.map(url => this.loadVideo(url)));
    
    this.coreReady = true;
    console.log('[VideoPreloader] ✓ 核心视频加载完成');
    this.emitProgress();
    
    if (onProgress) {
      this.progressCallbacks.delete(onProgress);
    }
  }
  
  /**
   * 开始预加载常用视频（在核心视频加载完成后调用）
   */
  public async preloadCommon(): Promise<void> {
    if (!this.coreReady) {
      await this.preloadCore();
    }
    
    console.log('[VideoPreloader] 开始预加载常用视频...');
    
    // 先尝试从缓存恢复
    await this.restoreFromCache(COMMON_VIDEOS);
    
    // 加载未缓存的常用视频
    const unloaded = COMMON_VIDEOS.filter(url => {
      const state = this.loadStates.get(url);
      return state?.status !== 'loaded';
    });
    
    // 串行加载，避免带宽竞争
    for (const url of unloaded) {
      await this.loadVideo(url);
    }
    
    console.log('[VideoPreloader] ✓ 常用视频加载完成');
  }
  
  /**
   * 预加载全部视频（后台静默加载）
   */
  public async preloadAll(): Promise<void> {
    if (this.isPreloading) return;
    this.isPreloading = true;
    
    try {
      await this.preloadCore();
      await this.preloadCommon();
      
      console.log('[VideoPreloader] 开始后台加载扩展视频...');
      
      // 先尝试从缓存恢复
      await this.restoreFromCache(EXTENDED_VIDEOS);
      
      // 加载未缓存的扩展视频（低优先级，串行）
      const unloaded = EXTENDED_VIDEOS.filter(url => {
        const state = this.loadStates.get(url);
        return state?.status !== 'loaded';
      });
      
      for (const url of unloaded) {
        // 使用 requestIdleCallback 在空闲时加载
        await new Promise<void>(resolve => {
          if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
              this.loadVideo(url).finally(resolve);
            }, { timeout: 5000 });
          } else {
            setTimeout(() => {
              this.loadVideo(url).finally(resolve);
            }, 100);
          }
        });
      }
      
      console.log('[VideoPreloader] ✓ 全部视频加载完成');
    } finally {
      this.isPreloading = false;
    }
  }
  
  /**
   * 按需加载单个视频
   */
  public async loadVideoOnDemand(url: string): Promise<string | null> {
    const state = this.loadStates.get(url);
    
    // 已加载，直接返回
    if (state?.status === 'loaded' && state.objectUrl) {
      return state.objectUrl;
    }
    
    // 正在加载，等待完成
    if (state?.status === 'loading') {
      return new Promise(resolve => {
        const checkInterval = setInterval(() => {
          const currentState = this.loadStates.get(url);
          if (currentState?.status === 'loaded' && currentState.objectUrl) {
            clearInterval(checkInterval);
            resolve(currentState.objectUrl);
          } else if (currentState?.status === 'error') {
            clearInterval(checkInterval);
            resolve(null);
          }
        }, 100);
      });
    }
    
    // 开始加载
    await this.loadVideo(url);
    return this.loadStates.get(url)?.objectUrl || null;
  }
  
  /**
   * 获取视频的 Object URL（如果已加载）
   */
  public getVideoUrl(originalUrl: string): string | null {
    const state = this.loadStates.get(originalUrl);
    return state?.objectUrl || null;
  }
  
  /**
   * 检查视频是否已加载
   */
  public isVideoLoaded(url: string): boolean {
    const state = this.loadStates.get(url);
    return state?.status === 'loaded';
  }
  
  /**
   * 检查核心视频是否就绪
   */
  public isCoreReady(): boolean {
    return this.coreReady;
  }
  
  /**
   * 获取当前加载进度
   */
  public getProgress(): PreloadProgress {
    const allVideos = [...CORE_VIDEOS, ...COMMON_VIDEOS, ...EXTENDED_VIDEOS];
    const loaded = allVideos.filter(url => this.loadStates.get(url)?.status === 'loaded').length;
    
    return {
      total: allVideos.length,
      loaded,
      percent: Math.round((loaded / allVideos.length) * 100),
      coreReady: this.coreReady,
    };
  }
  
  /**
   * 添加进度回调
   */
  public onProgress(callback: PreloadProgressCallback): () => void {
    this.progressCallbacks.add(callback);
    // 立即触发一次
    callback(this.getProgress());
    return () => this.progressCallbacks.delete(callback);
  }
  
  /**
   * 清除所有缓存
   */
  public async clearCache(): Promise<void> {
    // 清除 Object URLs
    this.loadStates.forEach(state => {
      if (state.objectUrl) {
        URL.revokeObjectURL(state.objectUrl);
      }
      state.status = 'pending';
      state.progress = 0;
      state.blob = undefined;
      state.objectUrl = undefined;
    });
    
    // 清除 Cache API 缓存
    if ('caches' in window) {
      await caches.delete(this.CACHE_NAME);
    }
    
    this.coreReady = false;
    console.log('[VideoPreloader] 缓存已清除');
  }
  
  // ==================== 内部方法 ====================
  
  /**
   * 从 Cache API 恢复视频
   */
  private async restoreFromCache(urls: string[]): Promise<void> {
    if (!('caches' in window)) return;
    
    try {
      const cache = await caches.open(this.CACHE_NAME);
      
      for (const url of urls) {
        const state = this.loadStates.get(url);
        if (!state || state.status === 'loaded') continue;
        
        const response = await cache.match(url);
        if (response) {
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          
          state.status = 'loaded';
          state.progress = 100;
          state.blob = blob;
          state.objectUrl = objectUrl;
          
          console.log(`[VideoPreloader] 从缓存恢复: ${url}`);
        }
      }
    } catch (err) {
      console.warn('[VideoPreloader] 缓存恢复失败:', err);
    }
  }
  
  /**
   * 加载单个视频
   */
  private async loadVideo(url: string): Promise<void> {
    const state = this.loadStates.get(url);
    if (!state) return;
    
    // 已加载则跳过
    if (state.status === 'loaded') return;
    
    state.status = 'loading';
    this.emitProgress(url);
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      // 获取内容长度用于进度计算
      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      
      // 读取响应体
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应体');
      }
      
      const chunks: Uint8Array[] = [];
      let loaded = 0;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        chunks.push(value);
        loaded += value.length;
        
        // 更新进度
        if (total > 0) {
          state.progress = Math.round((loaded / total) * 100);
          this.emitProgress(url);
        }
      }
      
      // 合并数据块
      const blob = new Blob(chunks, { type: 'video/webm' });
      const objectUrl = URL.createObjectURL(blob);
      
      state.status = 'loaded';
      state.progress = 100;
      state.blob = blob;
      state.objectUrl = objectUrl;
      
      // 保存到 Cache API
      await this.saveToCache(url, blob);
      
      console.log(`[VideoPreloader] ✓ 已加载: ${url.split('/').pop()}`);
      this.emitProgress(url);
      
    } catch (err: any) {
      state.status = 'error';
      state.error = err.message;
      console.error(`[VideoPreloader] ✗ 加载失败: ${url}`, err.message);
      this.emitProgress(url);
    }
  }
  
  /**
   * 保存到 Cache API
   */
  private async saveToCache(url: string, blob: Blob): Promise<void> {
    if (!('caches' in window)) return;
    
    try {
      const cache = await caches.open(this.CACHE_NAME);
      const response = new Response(blob, {
        headers: { 'Content-Type': 'video/webm' }
      });
      await cache.put(url, response);
    } catch (err) {
      console.warn(`[VideoPreloader] 缓存保存失败: ${url}`, err);
    }
  }
  
  /**
   * 触发进度回调
   */
  private emitProgress(currentFile?: string): void {
    const progress = this.getProgress();
    if (currentFile) {
      progress.currentFile = currentFile;
    }
    
    this.progressCallbacks.forEach(cb => {
      try {
        cb(progress);
      } catch (err) {
        console.error('[VideoPreloader] 进度回调错误:', err);
      }
    });
  }
}

// ==================== 导出单例 ====================

export const videoPreloader = VideoPreloaderService.getInstance();

// 便捷函数
export const preloadCoreVideos = (onProgress?: PreloadProgressCallback) => 
  videoPreloader.preloadCore(onProgress);

export const preloadAllVideos = () => 
  videoPreloader.preloadAll();

export const getVideoUrl = (url: string) => 
  videoPreloader.getVideoUrl(url);

export const loadVideoOnDemand = (url: string) => 
  videoPreloader.loadVideoOnDemand(url);

export const isCoreReady = () => 
  videoPreloader.isCoreReady();

export default videoPreloader;
