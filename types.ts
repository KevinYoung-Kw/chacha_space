
export enum AssistantState {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  THINKING = 'THINKING',
  SPEAKING = 'SPEAKING',
  HAPPY = 'HAPPY'
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface TodoCategory {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  categoryId?: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  priority?: 'high' | 'medium' | 'low';
  deadline?: string;
  createdAt: string;
  updatedAt: string;
}

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
  // Extended fields for the detailed guide
  airQuality?: string;
  wind?: string;
  tips?: string[];
  dressing?: { layer: string; item: string }[];
}

export interface CustomSkill {
  id: string;
  trigger: string;
  response: string;
}

// Memory (记忆系统)
export interface Memory {
  id: string;
  userId: string;
  type: 'fact' | 'preference' | 'event' | 'relationship';
  content: string;
  importance: number; // 1-10 重要性评分
  lastAccessed: string;
  createdAt: string;
}

// User Profile from Onboarding
export interface UserProfile {
  name: string;
  gender: string;
  identity: string;
  expectations: string;
  onboardingComplete: boolean;
}

// Health Tracking
export interface WaterRecord {
  current: number; // ml
  goal: number;
  history: { time: string; amount: number; type: string }[];
}

export interface CalorieRecord {
  current: number; // kcal
  goal: number;
  macros: { protein: number; carbs: number; fat: number };
  history: { time: string; item: string; calories: number }[];
}

export interface SleepRecord {
  current: number; // hours
  goal: number;
  history: { day: string; hours: number }[];
}

export interface ExerciseRecord {
  current: number; // minutes
  goal: number;
  history: { day: string; minutes: number }[];
}

// Divination
export interface TarotResult {
  type: 'tarot';
  cards: { name: string; position: string; meaning: string; orientation: 'upright' | 'reversed' }[];
  analysis: string;
  advice: string;
}

// Gemini Tool Types
export interface ToolResponse {
  functionResponses: {
    id: string;
    name: string;
    response: object;
  }[];
}

// Voice Design
export interface Voice {
  id: string;
  name: string;
  category: 'preset' | 'custom';
  language?: string;
  tags?: string[];
}

// ==================== 好感度系统 ====================

// 好感度数据
export interface AffinityData {
  value: number; // 0-1000（总分）
  level: AffinityLevel; // v1-v10等级
  lastInteraction: number; // 最后交互时间戳
  totalInteractions: number; // 总交互次数
  history: AffinityEvent[]; // 好感度变化历史（可滚动查看）
}

export interface AffinityEvent {
  timestamp: number;
  change: number; // 变化值（正数增加，负数减少）
  reason: string; // 变化原因
  action: string; // 触发动作类型
}

// 好感度等级：v1-v10
export type AffinityLevel = 'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'v6' | 'v7' | 'v8' | 'v9' | 'v10';

// 好感度触发动作类型
export type AffinityActionType = 
  | 'todo_complete'      // 完成待办
  | 'todo_add'           // 添加待办
  | 'health_water'       // 记录喝水
  | 'health_goal'        // 完成健康目标
  | 'weather_check'      // 查询天气
  | 'fortune_draw'       // 占卜
  | 'daily_chat'         // 每日首次对话
  | 'positive_reply'     // 积极回复
  | 'negative_reply'     // 负面回复
  | 'no_interaction'     // 长时间不互动
  | 'test_boost';        // 测试提升（隐藏功能）
