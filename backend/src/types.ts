// ==================== 用户相关 ====================

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  gender?: string;
  identity?: string;
  expectations?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  gender?: string;
  identity?: string;
  expectations?: string;
}

// ==================== 待办事项 ====================

export interface TodoCategory {
  id: string;
  userId: string;
  name: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind class
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface TodoItem {
  id: string;
  userId: string;
  text: string;
  completed: boolean;
  categoryId?: string;
  categoryName?: string; // 用于前端显示
  categoryIcon?: string;
  categoryColor?: string;
  priority?: 'high' | 'medium' | 'low';
  deadline?: string; // 截止日期 ISO 8601 格式
  createdAt: string;
  updatedAt: string;
}

// ==================== 健康数据 ====================

export interface HealthRecord {
  id: string;
  userId: string;
  type: 'water' | 'calories' | 'sleep' | 'exercise';
  value: number;
  metadata?: string; // JSON 字符串
  recordedAt: string;
}

export interface HealthGoals {
  userId: string;
  waterGoal: number;
  caloriesGoal: number;
  sleepGoal: number;
  exerciseGoal: number;
}

export interface HealthSummary {
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

// ==================== 对话记忆 ====================

export interface Message {
  id: string;
  userId: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface Memory {
  id: string;
  userId: string;
  type: 'fact' | 'preference' | 'event' | 'relationship';
  content: string;
  importance: number; // 1-10 重要性评分
  lastAccessed: string;
  createdAt: string;
}

export interface ConversationSession {
  id: string;
  userId: string;
  title?: string;
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== 天气数据 ====================

export interface ForecastDay {
  day: string;
  min: number;
  max: number;
  condition: string;
}

export interface WeatherData {
  city: string;
  temp: number;
  condition: string;
  humidity: number;
  forecast: ForecastDay[];
  airQuality?: string;
  wind?: string;
  tips?: string[];
}

// ==================== 占卜结果 ====================

export interface TarotCard {
  name: string;
  position: string;
  meaning: string;
  orientation: 'upright' | 'reversed';
}

export interface TarotResult {
  type: 'tarot';
  cards: TarotCard[];
  analysis: string;
  advice: string;
}

// ==================== 好感度系统 ====================

export type AffinityLevel = 'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'v6' | 'v7' | 'v8' | 'v9' | 'v10';

export type AffinityActionType = 
  | 'todo_complete'
  | 'todo_add'
  | 'health_water'
  | 'health_goal'
  | 'weather_check'
  | 'fortune_draw'
  | 'daily_chat'
  | 'positive_reply'
  | 'negative_reply'
  | 'no_interaction'
  | 'test_boost';

export interface AffinityEvent {
  timestamp: number;
  change: number;
  reason: string;
  action: string;
}

export interface AffinityData {
  value: number; // 0-1000
  level: AffinityLevel;
  lastInteraction: number;
  totalInteractions: number;
  history: AffinityEvent[];
}

// ==================== API 响应 ====================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ==================== JWT Payload ====================

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// ==================== 请求扩展 ====================

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
