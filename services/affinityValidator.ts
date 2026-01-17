/**
 * affinityValidator.ts - 好感度积分验证工具
 * 
 * 用于验证和修复好感度数据的完整性
 */

import { AffinityData, AffinityLevel } from '../types';
import { getAffinityLevel, AFFINITY_LEVELS, saveAffinityData } from './affinityService';

/**
 * 验证好感度数据的完整性
 */
export function validateAffinityData(data: AffinityData): {
  isValid: boolean;
  issues: string[];
  fixedData?: AffinityData;
} {
  const issues: string[] = [];
  const fixedData = { ...data };
  
  // 1. 检查积分值范围
  if (data.value < 0) {
    issues.push(`积分值不能为负数: ${data.value}`);
    fixedData.value = 0;
  }
  if (data.value > 1000) {
    issues.push(`积分值超过最大值: ${data.value} > 1000`);
    fixedData.value = 1000;
  }
  
  // 2. 检查等级是否与积分匹配
  const correctLevel = getAffinityLevel(data.value);
  if (data.level !== correctLevel) {
    const levelConfig = AFFINITY_LEVELS[data.level as AffinityLevel];
    const correctConfig = AFFINITY_LEVELS[correctLevel];
    issues.push(
      `等级不匹配: 当前等级${data.level} (范围: ${levelConfig?.min || 'N/A'}-${levelConfig?.max || 'N/A'}) ` +
      `与积分${data.value}不匹配，应该是${correctLevel} (范围: ${correctConfig.min}-${correctConfig.max})`
    );
    fixedData.level = correctLevel;
  }
  
  // 3. 检查历史记录中的积分变化总和
  const historySum = data.history.reduce((sum, event) => sum + event.change, 0);
  const expectedValue = 50 + historySum; // 初始值50 + 所有变化
  if (Math.abs(data.value - expectedValue) > 1) { // 允许1分的误差（浮点数）
    issues.push(
      `积分计算不一致: 当前值${data.value}，但根据历史记录计算应该是${expectedValue}，差异${Math.abs(data.value - expectedValue)}`
    );
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    fixedData: issues.length > 0 ? fixedData : undefined,
  };
}

/**
 * 修复好感度数据
 */
export function fixAffinityData(data: AffinityData): AffinityData {
  const validation = validateAffinityData(data);
  
  if (validation.fixedData) {
    console.log('[Affinity] 修复数据问题:', validation.issues);
    saveAffinityData(validation.fixedData);
    return validation.fixedData;
  }
  
  return data;
}

/**
 * 获取积分计算详情（用于调试）
 */
export function getAffinityCalculationDetails(data: AffinityData): {
  currentValue: number;
  currentLevel: AffinityLevel;
  levelRange: { min: number; max: number };
  historySum: number;
  expectedValue: number;
  difference: number;
} {
  const historySum = data.history.reduce((sum, event) => sum + event.change, 0);
  const expectedValue = 50 + historySum; // 初始值50
  const correctLevel = getAffinityLevel(data.value);
  const levelConfig = AFFINITY_LEVELS[correctLevel];
  
  return {
    currentValue: data.value,
    currentLevel: correctLevel,
    levelRange: levelConfig,
    historySum,
    expectedValue,
    difference: Math.abs(data.value - expectedValue),
  };
}
