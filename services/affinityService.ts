/**
 * affinityService.ts - 好感度系统服务（后端版本）
 * 
 * 基于现有功能模块（待办、健康、天气、占卜）和角色动作的好感度系统
 * 数据存储在后端数据库，支持跨设备同步
 */

import { AffinityData, AffinityEvent, AffinityLevel, AffinityActionType } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

// 好感度等级阈值（v1-v10，每个等级100分）
export const AFFINITY_LEVELS: Record<AffinityLevel, { min: number; max: number; name: string }> = {
  v1: { min: 0, max: 100, name: '初识' },
  v2: { min: 100, max: 200, name: '熟悉' },
  v3: { min: 200, max: 300, name: '友好' },
  v4: { min: 300, max: 400, name: '亲近' },
  v5: { min: 400, max: 500, name: '信任' },
  v6: { min: 500, max: 600, name: '默契' },
  v7: { min: 600, max: 700, name: '亲密' },
  v8: { min: 700, max: 800, name: '挚友' },
  v9: { min: 800, max: 900, name: '知己' },
  v10: { min: 900, max: 1000, name: '至交' },
};

/**
 * 获取好感度等级
 */
export function getAffinityLevel(value: number): AffinityLevel {
  const clampedValue = Math.max(0, Math.min(1000, Math.floor(value)));
  
  const levels: AffinityLevel[] = ['v10', 'v9', 'v8', 'v7', 'v6', 'v5', 'v4', 'v3', 'v2', 'v1'];
  for (const level of levels) {
    const levelConfig = AFFINITY_LEVELS[level];
    if (level === 'v10') {
      if (clampedValue >= levelConfig.min && clampedValue <= levelConfig.max) {
        return level;
      }
    } else {
      if (clampedValue >= levelConfig.min && clampedValue < levelConfig.max) {
        return level;
      }
    }
  }
  
  return 'v1';
}

/**
 * 获取等级名称
 */
export function getLevelName(level: AffinityLevel): string {
  return AFFINITY_LEVELS[level].name;
}

/**
 * 获取 token
 */
function getToken(): string | null {
  return localStorage.getItem('chacha_token');
}

/**
 * 获取或创建设备ID
 */
function getDeviceId(): string {
  let deviceId = localStorage.getItem('chacha_device_id');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('chacha_device_id', deviceId);
  }
  return deviceId;
}

/**
 * 获取通用请求头
 */
function getHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Device-Id': getDeviceId(),
  };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * 初始化好感度数据（本地默认值）
 */
export function initAffinityData(): AffinityData {
  return {
    value: 50,
    level: 'v1',
    lastInteraction: Date.now(),
    totalInteractions: 0,
    history: [],
  };
}

/**
 * 从后端加载好感度数据
 */
export async function loadAffinityData(): Promise<AffinityData> {
  try {
    const response = await fetch(`${API_BASE_URL}/affinity`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Affinity] Load failed:', response.status, errorText);
      throw new Error(`Failed to load affinity data: ${response.status}`);
    }

    const result = await response.json();
    if (result.success && result.data) {
      return result.data;
    }

    return initAffinityData();
  } catch (error) {
    console.error('[Affinity] Load error:', error);
    return initAffinityData();
  }
}

/**
 * 保存好感度数据到后端（仅用于兼容性，实际通过 updateAffinity 更新）
 */
export function saveAffinityData(data: AffinityData): void {
  // 后端版本不需要手动保存，数据通过 API 自动同步
  console.log('[Affinity] Data saved to backend automatically');
}

/**
 * 更新好感度
 * @param actionType 触发动作类型
 * @param customReason 自定义原因（可选）
 * @returns 返回更新后的好感度数据和触发的情感动作
 */
export async function updateAffinity(
  actionType: AffinityActionType,
  customReason?: string
): Promise<{ data: AffinityData; emotion?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/affinity/update`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: actionType,
        customReason,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Affinity] Update failed:', response.status, errorText);
      throw new Error(`Failed to update affinity: ${response.status}`);
    }

    const result = await response.json();
    if (result.success && result.data) {
      // 根据动作类型返回对应的情感
      const emotionMap: Record<string, string> = {
        'todo_complete': 'ACTION_HAPPY',
        'todo_add': 'ACTION_NOTES',
        'health_water': 'ACTION_HAPPY',
        'health_goal': 'ACTION_EXCITED',
        'weather_check': 'ACTION_CHECK_PHONE',
        'fortune_draw': 'ACTION_EXCITED',
        'daily_chat': 'ACTION_HAPPY',
        'positive_reply': 'ACTION_HAPPY',
        'negative_reply': 'ACTION_DISAPPROVE',
        'no_interaction': 'ACTION_DISAPPROVE',
      };

      return {
        data: result.data,
        emotion: emotionMap[actionType],
      };
    }

    return { data: initAffinityData() };
  } catch (error) {
    console.error('[Affinity] Update error:', error);
    return { data: initAffinityData() };
  }
}

/**
 * 获取好感度相关的角色反应文本
 */
export function getAffinityReaction(level: AffinityLevel, actionType: AffinityActionType): string {
  const levelNum = parseInt(level.replace('v', ''));
  
  let reactions: Record<string, string[]>;
  
  if (levelNum <= 3) {
    reactions = {
      todo_complete: ['完成了呢...', '继续加油吧', '做得不错'],
      health_water: ['记得多喝水', '保持健康很重要'],
      fortune_draw: ['占卜结果如何？', '一起看看吧'],
      default: ['嗯...', '好的', '知道了'],
    };
  } else if (levelNum <= 6) {
    reactions = {
      todo_complete: ['完成啦！真棒～', '效率很高呢', '继续保持！'],
      health_water: ['补充水分很重要呢～', '保持健康习惯！'],
      fortune_draw: ['一起探索神秘的力量吧！', '占卜结果如何？'],
      default: ['好的呀', '没问题', '一起努力吧'],
    };
  } else {
    reactions = {
      todo_complete: ['太厉害了！为你骄傲～', '效率超高的！', '完美完成！'],
      health_water: ['太棒了！保持这个好习惯～', '你真的很自律呢！'],
      fortune_draw: ['好期待占卜结果！', '一起看看未来会怎样～'],
      default: ['太棒了！', '你真的很棒！', '为你感到开心～'],
    };
  }
  
  const actionReactions = reactions[actionType] || reactions.default;
  return actionReactions[Math.floor(Math.random() * actionReactions.length)];
}

/**
 * 根据好感度等级获取角色动作
 */
export function getAffinityEmotion(level: AffinityLevel, actionType: AffinityActionType): string | undefined {
  const emotionMap: Record<string, string> = {
    'todo_complete': 'ACTION_HAPPY',
    'todo_add': 'ACTION_NOTES',
    'health_water': 'ACTION_HAPPY',
    'health_goal': 'ACTION_EXCITED',
    'weather_check': 'ACTION_CHECK_PHONE',
    'fortune_draw': 'ACTION_EXCITED',
    'daily_chat': 'ACTION_HAPPY',
    'positive_reply': 'ACTION_HAPPY',
    'negative_reply': 'ACTION_DISAPPROVE',
    'no_interaction': 'ACTION_DISAPPROVE',
  };
  
  return emotionMap[actionType];
}

/**
 * 获取好感度统计信息
 */
export function getAffinityStats(data: AffinityData): {
  value: number;
  level: AffinityLevel;
  progress: number;
  currentLevelExp: number;
  nextLevelExpNeeded: number;
  nextLevel: AffinityLevel | null;
  nextLevelThreshold: number | null;
} {
  let level = data.level;
  if (!level || !AFFINITY_LEVELS[level as AffinityLevel]) {
    level = getAffinityLevel(data.value);
  }
  
  const levelConfig = AFFINITY_LEVELS[level as AffinityLevel];
  if (!levelConfig) {
    level = 'v1';
    const defaultConfig = AFFINITY_LEVELS[level];
    return {
      value: data.value,
      level,
      progress: 0,
      currentLevelExp: 0,
      nextLevelExpNeeded: 100,
      nextLevel: 'v2',
      nextLevelThreshold: defaultConfig.max,
    };
  }
  
  const currentLevelExp = data.value - levelConfig.min;
  const nextLevelExpNeeded = levelConfig.max - levelConfig.min;
  const progress = nextLevelExpNeeded > 0 
    ? (currentLevelExp / nextLevelExpNeeded) * 100 
    : 100;
  
  let nextLevel: AffinityLevel | null = null;
  let nextLevelThreshold: number | null = null;
  
  const levelNum = parseInt(level.replace('v', ''));
  if (!isNaN(levelNum) && levelNum < 10) {
    nextLevel = `v${levelNum + 1}` as AffinityLevel;
    nextLevelThreshold = AFFINITY_LEVELS[nextLevel]?.min || null;
  }
  
  return {
    value: data.value,
    level: level as AffinityLevel,
    progress: Math.round(progress),
    currentLevelExp: Math.max(0, currentLevelExp),
    nextLevelExpNeeded: nextLevelExpNeeded > 0 ? nextLevelExpNeeded : 100,
    nextLevel,
    nextLevelThreshold,
  };
}
