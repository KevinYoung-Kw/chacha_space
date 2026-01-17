
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

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  category?: 'health' | 'work' | 'dev' | 'content';
  priority?: 'high' | 'medium' | 'low';
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
