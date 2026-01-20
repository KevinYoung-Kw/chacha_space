/**
 * 前端 API 服务
 * 统一的后端 API 调用
 */

// API 基础地址
// 生产环境使用相对路径（前后端同源），开发环境使用 localhost:3001
const getApiBaseUrl = (): string => {
  // 检查是否有环境变量指定
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl) return envUrl;
  
  // 生产环境使用相对路径
  if ((import.meta as any).env?.PROD) {
    return '/api';
  }
  
  // 开发环境使用本地后端
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

// ==================== 类型定义 ====================

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  gender?: string;
  identity?: string;
  expectations?: string;
}

interface AuthResponse {
  token: string;
  user: UserProfile;
  sessionId: string;
  isNewUser?: boolean;
  needsNickname?: boolean;
}

interface ChatResponse {
  content: string;
  sessionId: string;
  actions: { type: string; data: any }[];
}

interface TodoCategory {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
}

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  categoryId?: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  priority?: string;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
}

interface HealthSummary {
  water: { current: number; goal: number; history: any[] };
  calories: { 
    current: number; 
    goal: number; 
    macros: { protein: number; carbs: number; fat: number }; 
    history: any[] 
  };
  sleep: { current: number; goal: number; history: any[] };
  exercise: { current: number; goal: number; history: any[] };
}

interface WeatherData {
  city: string;
  temp: number;
  condition: string;
  humidity: number;
  forecast: any[];
  tips?: string[];
}

interface Memory {
  id: string;
  userId: string;
  type: 'fact' | 'preference' | 'event' | 'relationship';
  content: string;
  importance: number;
  lastAccessed: string;
  createdAt: string;
}

// ==================== Token 管理 ====================

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
  if (token) {
    localStorage.setItem('chacha_token', token);
  } else {
    localStorage.removeItem('chacha_token');
  }
}

export function getAuthToken(): string | null {
  if (!authToken) {
    authToken = localStorage.getItem('chacha_token');
  }
  return authToken;
}

export function clearAuth(): void {
  authToken = null;
  localStorage.removeItem('chacha_token');
  localStorage.removeItem('chacha_user');
  localStorage.removeItem('chacha_session');
}

// 设备ID管理（移到这里以便 request 函数使用）
function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem('chacha_device_id');
  if (!deviceId) {
    // 生成唯一设备ID
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('chacha_device_id', deviceId);
  }
  return deviceId;
}

// ==================== 基础请求方法 ====================

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  const deviceId = getOrCreateDeviceId();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-Device-Id': deviceId, // 始终发送设备ID作为后备身份标识
    ...options.headers,
  };
  
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    console.log(`[API] 请求 ${endpoint} - 已携带认证 token`);
  } else {
    console.log(`[API] 请求 ${endpoint} - 未携带认证 token`);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // 处理未授权
    if (response.status === 401) {
      // 静默处理认证检查失败（避免控制台警告）
      if (endpoint === '/auth/profile') {
        console.log('[API] 认证检查: Token 无效或已过期');
      } else {
        console.warn('[API] 未授权访问:', endpoint);
      }
      clearAuth();
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      
      // 返回统一的未授权响应
      return {
        success: false,
        error: '请先登录',
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[API] Request error: ${endpoint}`, error);
    return {
      success: false,
      error: '网络请求失败，请检查网络连接',
    };
  }
}

// ==================== 认证 API ====================

export const authApi = {
  /**
   * 快速登录（基于设备ID，无需注册）
   */
  async quickLogin(): Promise<ApiResponse<AuthResponse>> {
    const deviceId = getOrCreateDeviceId();
    const result = await request<AuthResponse>('/auth/quick-login', {
      method: 'POST',
      body: JSON.stringify({ deviceId }),
    });
    
    if (result.success && result.data) {
      setAuthToken(result.data.token);
      localStorage.setItem('chacha_user', JSON.stringify(result.data.user));
      localStorage.setItem('chacha_session', result.data.sessionId);
    }
    
    return result;
  },

  /**
   * 检查昵称是否可用
   */
  async checkNickname(nickname: string): Promise<ApiResponse<{ available: boolean; nickname: string }>> {
    return request<{ available: boolean; nickname: string }>('/auth/check-nickname', {
      method: 'POST',
      body: JSON.stringify({ nickname }),
    });
  },

  /**
   * 设置昵称
   */
  async setNickname(nickname: string): Promise<ApiResponse<UserProfile>> {
    const result = await request<UserProfile>('/auth/set-nickname', {
      method: 'POST',
      body: JSON.stringify({ nickname }),
    });
    
    if (result.success && result.data) {
      // 更新本地存储的用户信息
      localStorage.setItem('chacha_user', JSON.stringify(result.data));
    }
    
    return result;
  },

  /**
   * 用户注册（保留旧接口）
   */
  async register(data: {
    email: string;
    password: string;
    name: string;
    gender?: string;
    identity?: string;
    expectations?: string;
  }): Promise<ApiResponse<AuthResponse>> {
    const result = await request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (result.success && result.data) {
      setAuthToken(result.data.token);
      localStorage.setItem('chacha_user', JSON.stringify(result.data.user));
      localStorage.setItem('chacha_session', result.data.sessionId);
    }
    
    return result;
  },

  /**
   * 用户登录（保留旧接口）
   */
  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    const result = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (result.success && result.data) {
      setAuthToken(result.data.token);
      localStorage.setItem('chacha_user', JSON.stringify(result.data.user));
      localStorage.setItem('chacha_session', result.data.sessionId);
    }
    
    return result;
  },

  /**
   * 获取用户信息
   */
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    return request<UserProfile>('/auth/profile');
  },

  /**
   * 更新用户信息
   */
  async updateProfile(data: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    return request<UserProfile>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * 登出
   */
  logout(): void {
    clearAuth();
  },

  /**
   * 检查是否已登录
   */
  isAuthenticated(): boolean {
    return !!getAuthToken();
  },

  /**
   * 获取本地存储的用户信息
   */
  getStoredUser(): UserProfile | null {
    const stored = localStorage.getItem('chacha_user');
    return stored ? JSON.parse(stored) : null;
  },

  /**
   * 获取当前会话 ID
   */
  getSessionId(): string | null {
    return localStorage.getItem('chacha_session');
  },
};

// ==================== 对话 API ====================

export const chatApi = {
  /**
   * 发送消息
   */
  async sendMessage(message: string, sessionId?: string): Promise<ApiResponse<ChatResponse>> {
    return request<ChatResponse>('/chat/message', {
      method: 'POST',
      body: JSON.stringify({ 
        message, 
        sessionId: sessionId || authApi.getSessionId() 
      }),
    });
  },

  /**
   * 获取对话历史
   */
  async getHistory(sessionId: string, limit: number = 50): Promise<ApiResponse<any[]>> {
    return request<any[]>(`/chat/history?sessionId=${sessionId}&limit=${limit}`);
  },

  /**
   * 获取会话列表
   */
  async getSessions(limit: number = 10): Promise<ApiResponse<any[]>> {
    return request<any[]>(`/chat/sessions?limit=${limit}`);
  },

  /**
   * 创建新会话
   */
  async createSession(title?: string): Promise<ApiResponse<any>> {
    return request<any>('/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  },
};

// ==================== 待办 API ====================

// ==================== 分类 API ====================

export const categoryApi = {
  /**
   * 获取分类列表
   */
  async getList(): Promise<ApiResponse<TodoCategory[]>> {
    return request<TodoCategory[]>('/categories');
  },

  /**
   * 创建分类
   */
  async create(data: { name: string; icon?: string; color?: string }): Promise<ApiResponse<TodoCategory>> {
    return request<TodoCategory>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * 更新分类
   */
  async update(id: string, data: { name?: string; icon?: string; color?: string }): Promise<ApiResponse<TodoCategory>> {
    return request<TodoCategory>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * 删除分类
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return request<void>(`/categories/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== 待办 API ====================

export const todoApi = {
  /**
   * 获取待办列表
   */
  async getList(showCompleted: boolean = false): Promise<ApiResponse<TodoItem[]>> {
    return request<TodoItem[]>(`/todos?showCompleted=${showCompleted}`);
  },

  /**
   * 创建待办
   */
  async create(data: { text: string; priority?: string; categoryId?: string; deadline?: string }): Promise<ApiResponse<TodoItem>> {
    return request<TodoItem>('/todos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * 更新待办
   */
  async update(id: string, data: Partial<TodoItem>): Promise<ApiResponse<TodoItem>> {
    return request<TodoItem>(`/todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * 切换完成状态
   */
  async toggle(id: string): Promise<ApiResponse<TodoItem>> {
    return request<TodoItem>(`/todos/${id}/toggle`, {
      method: 'PATCH',
    });
  },

  /**
   * 删除待办
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return request<void>(`/todos/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== 健康 API ====================

export const healthApi = {
  /**
   * 获取健康摘要
   */
  async getSummary(): Promise<ApiResponse<HealthSummary>> {
    return request<HealthSummary>('/health/summary');
  },

  /**
   * 记录喝水
   */
  async addWater(amount: number = 250): Promise<ApiResponse<any>> {
    return request<any>('/health/water', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },

  /**
   * 记录热量
   */
  async addCalories(amount: number, item?: string): Promise<ApiResponse<any>> {
    return request<any>('/health/calories', {
      method: 'POST',
      body: JSON.stringify({ amount, item }),
    });
  },

  /**
   * 记录睡眠
   */
  async addSleep(hours: number): Promise<ApiResponse<any>> {
    return request<any>('/health/sleep', {
      method: 'POST',
      body: JSON.stringify({ hours }),
    });
  },

  /**
   * 记录运动
   */
  async addExercise(minutes: number, type?: string): Promise<ApiResponse<any>> {
    return request<any>('/health/exercise', {
      method: 'POST',
      body: JSON.stringify({ minutes, type }),
    });
  },

  /**
   * 更新健康目标
   */
  async updateGoals(goals: {
    waterGoal?: number;
    caloriesGoal?: number;
    sleepGoal?: number;
    exerciseGoal?: number;
  }): Promise<ApiResponse<any>> {
    return request<any>('/health/goals', {
      method: 'PUT',
      body: JSON.stringify(goals),
    });
  },
};

// ==================== 天气 API ====================

export const weatherApi = {
  /**
   * 根据城市获取天气
   */
  async getByCity(city: string): Promise<ApiResponse<WeatherData>> {
    return request<WeatherData>(`/weather/city/${encodeURIComponent(city)}`);
  },

  /**
   * 根据经纬度获取天气
   */
  async getByLocation(lat: number, lng: number): Promise<ApiResponse<WeatherData>> {
    return request<WeatherData>(`/weather/location?lat=${lat}&lng=${lng}`);
  },

  /**
   * 自动获取天气
   */
  async getAuto(): Promise<ApiResponse<WeatherData>> {
    return request<WeatherData>('/weather/auto');
  },
};

// ==================== TTS API ====================

export const ttsApi = {
  /**
   * 合成语音
   */
  async synthesize(text: string, voiceId?: string): Promise<ArrayBuffer | null> {
    const token = getAuthToken();
    const deviceId = getOrCreateDeviceId();

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Device-Id': deviceId,
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('[TTS] 请求语音合成 - 已携带认证 token');
      } else {
        console.warn('[TTS] 请求语音合成 - 未携带认证 token（可能导致 401 错误）');
      }

      const response = await fetch(`${API_BASE_URL}/tts/synthesize`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text, voiceId }),
      });

      if (!response.ok) {
        // 详细的错误日志
        if (response.status === 401) {
          console.log('[TTS] 认证失败 - 需要登录');
        } else if (response.status === 500) {
          const errorData = await response.json().catch(() => null);
          console.error('[TTS] 服务器错误:', errorData?.error || '未知错误');
        } else {
          console.error('[TTS] 请求失败:', response.status, response.statusText);
        }
        return null;
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error('[TTS] Synthesize error:', error);
      return null;
    }
  },

  /**
   * 获取可用声音列表
   */
  async getVoices(): Promise<ApiResponse<any[]>> {
    return request<any[]>('/tts/voices');
  },
};

// ==================== 情绪/动画 API ====================

export interface EmotionDetectResponse {
  action: string;
  description: string;
  emotion: 'positive' | 'negative' | 'neutral';
  confidence: 'high' | 'low';
}

export interface ActionInfo {
  name: string;
  description: string;
  emotion: string;
}

export const emotionApi = {
  /**
   * 检测用户输入的情绪并返回推荐的动画
   */
  async detect(message: string): Promise<ApiResponse<EmotionDetectResponse>> {
    return request<EmotionDetectResponse>('/emotion/detect', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  /**
   * 获取所有可用的动画列表
   */
  async getActions(): Promise<ApiResponse<ActionInfo[]>> {
    return request<ActionInfo[]>('/emotion/actions');
  },
};

// ==================== 记忆 API ====================

export const memoryApi = {
  /**
   * 获取记忆列表
   */
  async getList(page: number = 1, pageSize: number = 20): Promise<ApiResponse<{
    memories: Memory[];
    total: number;
    page: number;
    totalPages: number;
  }>> {
    return request(`/memories?page=${page}&pageSize=${pageSize}`);
  },

  /**
   * 获取相关记忆
   */
  async getRelevant(limit: number = 10): Promise<ApiResponse<Memory[]>> {
    return request<Memory[]>(`/memories/relevant?limit=${limit}`);
  },

  /**
   * 添加记忆
   */
  async create(data: { 
    content: string; 
    type: 'fact' | 'preference' | 'event' | 'relationship';
    importance?: number;
  }): Promise<ApiResponse<Memory>> {
    return request<Memory>('/memories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * 删除记忆
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return request<void>(`/memories/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== 导出所有 API ====================

export const api = {
  auth: authApi,
  chat: chatApi,
  category: categoryApi,
  todo: todoApi,
  health: healthApi,
  weather: weatherApi,
  tts: ttsApi,
  memory: memoryApi,
  emotion: emotionApi,
};

export default api;
