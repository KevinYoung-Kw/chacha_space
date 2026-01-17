/**
 * affinityService.ts - 好感度系统服务
 * 
 * 基于现有功能模块（待办、健康、天气、占卜）和角色动作的好感度系统
 */

import { AffinityData, AffinityEvent, AffinityLevel, AffinityActionType } from '../types';
import { fixAffinityData } from './affinityValidator';

const STORAGE_KEY = 'chacha_affinity';
const MAX_HISTORY = 200; // 最多保存200条历史记录（支持滚动查看）

// 好感度变化规则配置
const AFFINITY_RULES: Record<AffinityActionType, { change: number; reason: string; emotion?: string }> = {
  // 待办相关
  todo_complete: { 
    change: 5, 
    reason: '完成了待办事项，真棒！',
    emotion: 'ACTION_HAPPY'
  },
  todo_add: { 
    change: 2, 
    reason: '添加了新的待办，一起努力吧！',
    emotion: 'ACTION_NOTES'
  },
  
  // 健康相关
  health_water: { 
    change: 3, 
    reason: '记得补充水分，很健康呢～',
    emotion: 'ACTION_HAPPY'
  },
  health_goal: { 
    change: 8, 
    reason: '完成了健康目标，太厉害了！',
    emotion: 'ACTION_EXCITED'
  },
  
  // 天气相关
  weather_check: { 
    change: 1, 
    reason: '关心天气变化，很贴心呢',
    emotion: 'ACTION_CHECK_PHONE'
  },
  
  // 占卜相关
  fortune_draw: { 
    change: 4, 
    reason: '一起探索神秘的力量～',
    emotion: 'ACTION_EXCITED'
  },
  
  // 对话相关
  daily_chat: { 
    change: 2, 
    reason: '今天也来聊天了，很开心！',
    emotion: 'ACTION_HAPPY'
  },
  positive_reply: { 
    change: 1, 
    reason: '收到积极的反馈',
    emotion: 'ACTION_HAPPY'
  },
  negative_reply: { 
    change: -3, 
    reason: '收到负面反馈',
    emotion: 'ACTION_DISAPPROVE'
  },
  
  // 不互动惩罚
  no_interaction: { 
    change: -1, 
    reason: '好久没来聊天了...',
    emotion: 'ACTION_DISAPPROVE'
  },
};

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
 * 根据积分值返回对应的等级（v1-v10）
 * 
 * 等级范围：
 * v1: 0-99, v2: 100-199, v3: 200-299, v4: 300-399, v5: 400-499,
 * v6: 500-599, v7: 600-699, v8: 700-799, v9: 800-899, v10: 900-1000
 */
export function getAffinityLevel(value: number): AffinityLevel {
  // 确保值在有效范围内
  const clampedValue = Math.max(0, Math.min(1000, Math.floor(value)));
  
  // 从高到低检查等级（确保高等级优先匹配）
  const levels: AffinityLevel[] = ['v10', 'v9', 'v8', 'v7', 'v6', 'v5', 'v4', 'v3', 'v2', 'v1'];
  for (const level of levels) {
    const levelConfig = AFFINITY_LEVELS[level];
    // 检查值是否在当前等级的范围内
    // v1-v9: [min, max)，v10: [min, max]（包含最大值）
    if (level === 'v10') {
      if (clampedValue >= levelConfig.min && clampedValue <= levelConfig.max) {
        console.log(`[Affinity] 等级计算: ${clampedValue}分 -> ${level} (范围: ${levelConfig.min}-${levelConfig.max})`);
        return level;
      }
    } else {
      if (clampedValue >= levelConfig.min && clampedValue < levelConfig.max) {
        console.log(`[Affinity] 等级计算: ${clampedValue}分 -> ${level} (范围: ${levelConfig.min}-${levelConfig.max})`);
        return level;
      }
    }
  }
  
  // 默认返回v1
  console.warn(`[Affinity] 无法确定等级，使用默认v1 (积分: ${clampedValue})`);
  return 'v1';
}

/**
 * 获取等级名称
 */
export function getLevelName(level: AffinityLevel): string {
  return AFFINITY_LEVELS[level].name;
}

/**
 * 初始化好感度数据
 */
export function initAffinityData(): AffinityData {
  return {
    value: 50, // 初始值50（v1等级）
    level: 'v1',
    lastInteraction: Date.now(),
    totalInteractions: 0,
    history: [],
  };
}

/**
 * 从本地存储加载好感度数据
 */
export function loadAffinityData(): AffinityData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored) as any;
      
      // 数据迁移：将旧格式（low/medium/high）转换为新格式（v1-v10）
      let migratedData: AffinityData;
      
      if (data.level && (data.level === 'low' || data.level === 'medium' || data.level === 'high')) {
        // 旧格式迁移
        let oldValue = data.value || 50;
        
        // 将旧的好感度值（0-100）转换为新值（0-1000）
        // 旧值映射：low(0-40) -> v1(0-100), medium(40-70) -> v2-v3(100-300), high(70-100) -> v4-v5(300-500)
        if (oldValue <= 40) {
          // low -> v1
          oldValue = Math.floor((oldValue / 40) * 100);
        } else if (oldValue <= 70) {
          // medium -> v2-v3
          oldValue = 100 + Math.floor(((oldValue - 40) / 30) * 200);
        } else {
          // high -> v4-v5
          oldValue = 300 + Math.floor(((oldValue - 70) / 30) * 200);
        }
        
        migratedData = {
          value: Math.max(0, Math.min(1000, oldValue)),
          level: getAffinityLevel(oldValue),
          lastInteraction: data.lastInteraction || Date.now(),
          totalInteractions: data.totalInteractions || 0,
          history: data.history || [],
        };
        
        // 保存迁移后的数据
        saveAffinityData(migratedData);
      } else {
        // 新格式，直接使用
        migratedData = data as AffinityData;
        
        // 强制重新计算等级，确保等级与积分值匹配
        const correctLevel = getAffinityLevel(migratedData.value);
        if (migratedData.level !== correctLevel) {
          console.warn(`[Affinity] 等级不匹配，自动修正: ${migratedData.level} -> ${correctLevel} (积分: ${migratedData.value})`);
          console.warn(`[Affinity] 等级${migratedData.level}的范围应该是: ${AFFINITY_LEVELS[migratedData.level as AffinityLevel]?.min || 'N/A'}-${AFFINITY_LEVELS[migratedData.level as AffinityLevel]?.max || 'N/A'}`);
          console.warn(`[Affinity] 等级${correctLevel}的范围是: ${AFFINITY_LEVELS[correctLevel].min}-${AFFINITY_LEVELS[correctLevel].max}`);
          migratedData.level = correctLevel;
          saveAffinityData(migratedData);
        }
      }
      
      // 检查是否需要应用长时间不互动的惩罚
      const now = Date.now();
      const hoursSinceLastInteraction = (now - migratedData.lastInteraction) / (1000 * 60 * 60);
      
      // 如果超过24小时没有互动，每天减少1点好感度（最多减少5点）
      if (hoursSinceLastInteraction > 24) {
        const daysPassed = Math.floor(hoursSinceLastInteraction / 24);
        const penalty = Math.min(daysPassed, 5); // 最多减少5点
        if (penalty > 0) {
          migratedData.value = Math.max(0, migratedData.value - penalty);
          migratedData.level = getAffinityLevel(migratedData.value);
          migratedData.history.push({
            timestamp: now,
            change: -penalty,
            reason: `超过${daysPassed}天没有互动`,
            action: 'no_interaction',
          });
          // 保持历史记录在限制内
          if (migratedData.history.length > MAX_HISTORY) {
            migratedData.history = migratedData.history.slice(-MAX_HISTORY);
          }
          saveAffinityData(migratedData);
        }
      }
      
      // 验证并修复数据
      const fixedData = fixAffinityData(migratedData);
      return fixedData;
    }
  } catch (error) {
    console.error('Failed to load affinity data:', error);
  }
  return initAffinityData();
}

/**
 * 保存好感度数据到本地存储
 */
export function saveAffinityData(data: AffinityData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save affinity data:', error);
  }
}

/**
 * 更新好感度
 * @param actionType 触发动作类型
 * @param customReason 自定义原因（可选）
 * @returns 返回更新后的好感度数据和触发的情感动作
 */
export function updateAffinity(
  actionType: AffinityActionType,
  customReason?: string
): { data: AffinityData; emotion?: string } {
  const data = loadAffinityData();
  const rule = AFFINITY_RULES[actionType];
  
  if (!rule) {
    console.warn(`Unknown affinity action type: ${actionType}`);
    return { data };
  }
  
  // 计算新值（限制在0-1000范围内）
  const oldValue = data.value;
  const newValue = Math.max(0, Math.min(1000, oldValue + rule.change));
  const oldLevel = data.level;
  const newLevel = getAffinityLevel(newValue);
  
  // 验证计算是否正确
  if (oldValue + rule.change !== newValue && (oldValue + rule.change < 0 || oldValue + rule.change > 1000)) {
    console.log(`[Affinity] 积分被限制: ${oldValue} + ${rule.change} = ${oldValue + rule.change} -> ${newValue}`);
  }
  
  // 创建事件记录
  const event: AffinityEvent = {
    timestamp: Date.now(),
    change: rule.change,
    reason: customReason || rule.reason,
    action: actionType,
  };
  
  // 更新数据
  data.value = newValue;
  data.level = newLevel;
  data.lastInteraction = Date.now();
  data.totalInteractions += 1;
  data.history.push(event);
  
  // 如果等级发生变化，记录日志
  if (oldLevel !== newLevel) {
    console.log(`[Affinity] 等级提升: ${oldLevel} -> ${newLevel} (积分: ${oldValue} -> ${newValue})`);
  }
  
  // 保持历史记录在限制内
  if (data.history.length > MAX_HISTORY) {
    data.history = data.history.slice(-MAX_HISTORY);
  }
  
  // 保存到本地存储
  saveAffinityData(data);
  
  // 如果等级发生变化，返回特殊标记
  const levelChanged = oldLevel !== newLevel;
  
  return {
    data,
    emotion: rule.emotion,
  };
}

/**
 * 获取好感度相关的角色反应文本
 */
export function getAffinityReaction(level: AffinityLevel, actionType: AffinityActionType): string {
  // 根据等级范围分组反应
  const levelNum = parseInt(level.replace('v', ''));
  
  let reactions: Record<string, string[]>;
  
  if (levelNum <= 3) {
    // v1-v3: 初识阶段
    reactions = {
      todo_complete: ['完成了呢...', '继续加油吧', '做得不错'],
      health_water: ['记得多喝水', '保持健康很重要'],
      fortune_draw: ['占卜结果如何？', '一起看看吧'],
      default: ['嗯...', '好的', '知道了'],
    };
  } else if (levelNum <= 6) {
    // v4-v6: 友好阶段
    reactions = {
      todo_complete: ['完成啦！真棒～', '效率很高呢', '继续保持！'],
      health_water: ['补充水分很重要呢～', '保持健康习惯！'],
      fortune_draw: ['一起探索神秘的力量吧！', '占卜结果如何？'],
      default: ['好的呀', '没问题', '一起努力吧'],
    };
  } else {
    // v7-v10: 亲密阶段
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
  const rule = AFFINITY_RULES[actionType];
  if (rule?.emotion) {
    return rule.emotion;
  }
  
  // 根据好感度等级返回默认动作
  const levelNum = parseInt(level.replace('v', ''));
  
  if (levelNum <= 3) {
    return 'ACTION_DISAPPROVE';
  } else if (levelNum <= 6) {
    return 'ACTION_HAPPY';
  } else {
    return 'ACTION_EXCITED';
  }
}

/**
 * 获取好感度统计信息
 */
export function getAffinityStats(data: AffinityData): {
  value: number;
  level: AffinityLevel;
  progress: number; // 当前等级进度 0-100
  nextLevel: AffinityLevel | null;
  nextLevelThreshold: number | null;
} {
  // 确保level有效，如果无效则重新计算
  let level = data.level;
  if (!level || !AFFINITY_LEVELS[level as AffinityLevel]) {
    level = getAffinityLevel(data.value);
  }
  
  const levelConfig = AFFINITY_LEVELS[level as AffinityLevel];
  if (!levelConfig) {
    // 如果还是无效，使用v1作为默认值
    level = 'v1';
    const defaultConfig = AFFINITY_LEVELS[level];
    return {
      value: data.value,
      level,
      progress: 0,
      nextLevel: 'v2',
      nextLevelThreshold: defaultConfig.max,
    };
  }
  
  // 计算当前等级内的进度
  const range = levelConfig.max - levelConfig.min;
  const progress = range > 0 
    ? ((data.value - levelConfig.min) / range) * 100 
    : 100;
  
  // 下一个等级
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
    nextLevel,
    nextLevelThreshold,
  };
}
