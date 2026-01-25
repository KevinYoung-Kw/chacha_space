/**
 * videoPreloader.ts - 视频资源预加载和缓存服务
 * 
 * 功能：
 * 1. 核心视频优先加载（保证基本功能）
 * 2. 其他视频按需懒加载
 * 3. 使用 Cache API 持久化缓存
 * 4. 提供加载进度和状态
 * 5. 支持在登录/注册阶段预加载
 * 6. 容错机制 - 部分资源失败不影响整体使用
 */

// ==================== 类型定义 ====================

export interface VideoLoadState {
  url: string;
  status: 'pending' | 'loading' | 'loaded' | 'error' | 'skipped';
  progress: number; // 0-100
  blob?: Blob;
  objectUrl?: string;
  error?: string;
}

export interface PreloadProgress {
  total: number;
  loaded: number;
  failed: number;
  percent: number;
  coreReady: boolean; // 核心视频是否已全部加载
  currentFile?: string;
}

export type PreloadProgressCallback = (progress: PreloadProgress) => void;

// ==================== 配置常量 ====================

// 单个视频加载超时时间（毫秒）
const LOAD_TIMEOUT = 15000; // 15秒

// 核心视频加载总超时时间
const CORE_LOAD_TIMEOUT = 30000; // 30秒

// 最少需要加载成功的核心视频数量（至少1个才能使用）
const MIN_CORE_VIDEOS_REQUIRED = 1;

// ==================== 视频列表配置 ====================

// 核心视频 - 必须优先加载，保证基本功能
const CORE_VIDEOS = [
  '/character/idle_action_1.webm',  // 主待机动画
  '/character/happy.webm',           // 说话/开心动画
  '/character/excited.webm',         // 挥手动画
  '/character/observing.webm',       // 思考动画
  '/character/idle_action_4.webm',   // 过渡动画
];

// 常用视频 - 登录后立即加载
const COMMON_VIDEOS = [
  '/character/idle_action_3.webm',   // 左侧待机
  '/character/idle_alt.webm',        // 待机变体
  '/character/listening_v2.webm',    // 聆听
  '/character/taking_notes.webm',    // 记笔记
  '/character/shy.webm',             // 害羞
  '/character/sleeping.webm',        // 睡觉
  '/character/weather.webm',         // 天气
  '/character/tarot_reading.webm',   // 塔罗占卜
  '/character/drinking_water.webm',  // 喝水
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
  '/character/sleeping_long.webm',
  '/character/skill.webm',
  '/character/wind_blowing.webm',
  '/character/strong_wind.webm',
  '/character/wind_blowing_2.webm',
  '/character/dancing.webm',
  '/character/dancing_2.webm',
  '/character/surprised_observe.webm',
  '/character/excited_v2.webm',
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
   * 
   * 容错机制：
   * - 设置总超时时间，超时后即使未全部加载也标记为就绪
   * - 只要有 MIN_CORE_VIDEOS_REQUIRED 个视频加载成功就算就绪
   */
  public async preloadCore(onProgress?: PreloadProgressCallback): Promise<void> {
    if (this.coreReady) {
      console.log('[VideoPreloader] 核心视频已就绪，跳过预加载');
      onProgress?.(this.getProgress());
      return;
    }
    
    if (onProgress) {
      this.progressCallbacks.add(onProgress);
    }
    
    console.log('[VideoPreloader] 开始预加载核心视频...');
    
    // 设置总超时
    const timeoutPromise = new Promise<void>((resolve) => {
      setTimeout(() => {
        console.warn('[VideoPreloader] ⚠️ 核心视频加载超时，继续使用已加载的资源');
        resolve();
      }, CORE_LOAD_TIMEOUT);
    });
    
    // 先尝试从缓存恢复
    await this.restoreFromCache(CORE_VIDEOS);
    
    // 检查已加载数量
    const loadedCount = CORE_VIDEOS.filter(url => 
      this.loadStates.get(url)?.status === 'loaded'
    ).length;
    
    if (loadedCount >= MIN_CORE_VIDEOS_REQUIRED) {
      console.log(`[VideoPreloader] ✓ 核心视频已从缓存恢复 (${loadedCount}/${CORE_VIDEOS.length})`);
      this.coreReady = true;
      this.emitProgress();
      if (onProgress) this.progressCallbacks.delete(onProgress);
      return;
    }
    
    // 加载未缓存的核心视频
    const unloadedCore = CORE_VIDEOS.filter(url => {
      const state = this.loadStates.get(url);
      return state?.status !== 'loaded';
    });
    
    // 并行加载，带超时保护
    const loadPromise = Promise.all(
      unloadedCore.map(url => this.loadVideoWithTimeout(url, LOAD_TIMEOUT))
    );
    
    // 等待加载完成或超时
    await Promise.race([loadPromise, timeoutPromise]);
    
    // 统计结果
    const finalLoadedCount = CORE_VIDEOS.filter(url => 
      this.loadStates.get(url)?.status === 'loaded'
    ).length;
    
    // 只要有足够的核心视频就标记为就绪
    if (finalLoadedCount >= MIN_CORE_VIDEOS_REQUIRED) {
      this.coreReady = true;
      console.log(`[VideoPreloader] ✓ 核心视频加载完成 (${finalLoadedCount}/${CORE_VIDEOS.length})`);
    } else {
      // 即使没有加载成功也标记为就绪，让用户可以使用（会使用原始URL）
      this.coreReady = true;
      console.warn(`[VideoPreloader] ⚠️ 核心视频加载不完整，但仍允许使用 (${finalLoadedCount}/${CORE_VIDEOS.length})`);
    }
    
    this.emitProgress();
    
    if (onProgress) {
      this.progressCallbacks.delete(onProgress);
    }
  }
  
  /**
   * 带超时的视频加载
   */
  private async loadVideoWithTimeout(url: string, timeout: number): Promise<void> {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        const state = this.loadStates.get(url);
        if (state && state.status === 'loading') {
          state.status = 'skipped';
          state.error = '加载超时';
          console.warn(`[VideoPreloader] ⚠️ 超时跳过: ${url.split('/').pop()}`);
        }
        resolve();
      }, timeout);
      
      this.loadVideo(url).finally(() => {
        clearTimeout(timeoutId);
        resolve();
      });
    });
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
    const failed = allVideos.filter(url => {
      const status = this.loadStates.get(url)?.status;
      return status === 'error' || status === 'skipped';
    }).length;
    
    // 计算进度时，失败的也算处理完成
    const processed = loaded + failed;
    
    return {
      total: allVideos.length,
      loaded,
      failed,
      percent: Math.round((processed / allVideos.length) * 100),
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
   * 获取缓存统计信息
   */
  public async getCacheStats(): Promise<{ cached: number; total: number; sizeKB: number }> {
    const allVideos = [...CORE_VIDEOS, ...COMMON_VIDEOS, ...EXTENDED_VIDEOS];
    let cached = 0;
    let totalSize = 0;
    
    if ('caches' in window) {
      try {
        const cache = await caches.open(this.CACHE_NAME);
        for (const url of allVideos) {
          const cacheKey = this.getCacheKey(url);
          const response = await cache.match(cacheKey);
          if (response) {
            cached++;
            const blob = await response.clone().blob();
            totalSize += blob.size;
          }
        }
      } catch (err) {
        console.warn('[VideoPreloader] 获取缓存统计失败:', err);
      }
    }
    
    return {
      cached,
      total: allVideos.length,
      sizeKB: Math.round(totalSize / 1024),
    };
  }
  
  /**
   * 打印缓存状态到控制台
   */
  public async logCacheStatus(): Promise<void> {
    const stats = await this.getCacheStats();
    const loaded = this.getProgress().loaded;
    
    console.log(`[VideoPreloader] 📊 缓存状态:`);
    console.log(`  - 浏览器持久缓存: ${stats.cached}/${stats.total} 个视频 (${stats.sizeKB} KB)`);
    console.log(`  - 内存缓存: ${loaded}/${stats.total} 个视频`);
    console.log(`  - 核心视频就绪: ${this.coreReady ? '✓' : '✗'}`);
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
   * 获取完整的缓存键（确保一致性）
   */
  private getCacheKey(url: string): string {
    // 将相对路径转换为完整 URL，确保缓存键一致
    if (url.startsWith('/')) {
      return new URL(url, window.location.origin).href;
    }
    return url;
  }
  
  /**
   * 从 Cache API 恢复视频
   */
  private async restoreFromCache(urls: string[]): Promise<void> {
    if (!('caches' in window)) {
      console.log('[VideoPreloader] 浏览器不支持 Cache API');
      return;
    }
    
    try {
      const cache = await caches.open(this.CACHE_NAME);
      
      for (const url of urls) {
        const state = this.loadStates.get(url);
        if (!state || state.status === 'loaded') continue;
        
        // 使用完整 URL 作为缓存键
        const cacheKey = this.getCacheKey(url);
        const response = await cache.match(cacheKey);
        
        if (response) {
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          
          state.status = 'loaded';
          state.progress = 100;
          state.blob = blob;
          state.objectUrl = objectUrl;
          
          console.log(`[VideoPreloader] ✓ 从浏览器缓存恢复: ${url.split('/').pop()}`);
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
    if (!state) {
      // 如果状态不存在，创建一个
      this.loadStates.set(url, {
        url,
        status: 'pending',
        progress: 0,
      });
    }
    
    const currentState = this.loadStates.get(url)!;
    
    // 已加载或已失败则跳过
    if (currentState.status === 'loaded' || currentState.status === 'error' || currentState.status === 'skipped') {
      return;
    }
    
    currentState.status = 'loading';
    this.emitProgress(url);
    
    try {
      // 使用 AbortController 实现请求超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), LOAD_TIMEOUT);
      
      const response = await fetch(url, { 
        signal: controller.signal,
        cache: 'force-cache' // 优先使用浏览器缓存
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      // 获取内容长度用于进度计算
      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      
      // 读取响应体
      const reader = response.body?.getReader();
      if (!reader) {
        // 如果无法使用流式读取，使用 arrayBuffer
        const buffer = await response.arrayBuffer();
        const blob = new Blob([buffer], { type: 'video/webm' });
        const objectUrl = URL.createObjectURL(blob);
        
        currentState.status = 'loaded';
        currentState.progress = 100;
        currentState.blob = blob;
        currentState.objectUrl = objectUrl;
        
        await this.saveToCache(url, blob);
        console.log(`[VideoPreloader] ✓ 已加载: ${url.split('/').pop()}`);
        this.emitProgress(url);
        return;
      }
      
      const chunks: BlobPart[] = [];
      let loaded = 0;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // 转换为 ArrayBuffer 以兼容 BlobPart
        chunks.push(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength));
        loaded += value.length;
        
        // 更新进度
        if (total > 0) {
          currentState.progress = Math.round((loaded / total) * 100);
          // 不要太频繁触发进度更新
          if (currentState.progress % 10 === 0) {
            this.emitProgress(url);
          }
        }
      }
      
      // 合并数据块
      const blob = new Blob(chunks, { type: 'video/webm' });
      const objectUrl = URL.createObjectURL(blob);
      
      currentState.status = 'loaded';
      currentState.progress = 100;
      currentState.blob = blob;
      currentState.objectUrl = objectUrl;
      
      // 保存到 Cache API（不阻塞）
      this.saveToCache(url, blob).catch(() => {});
      
      console.log(`[VideoPreloader] ✓ 已加载: ${url.split('/').pop()}`);
      this.emitProgress(url);
      
    } catch (err: any) {
      currentState.status = 'error';
      currentState.error = err.name === 'AbortError' ? '加载超时' : err.message;
      console.warn(`[VideoPreloader] ✗ 加载失败: ${url.split('/').pop()} - ${currentState.error}`);
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
      // 使用完整 URL 作为缓存键，确保与恢复时一致
      const cacheKey = this.getCacheKey(url);
      await cache.put(cacheKey, response);
      console.log(`[VideoPreloader] 💾 已缓存到浏览器: ${url.split('/').pop()}`);
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
