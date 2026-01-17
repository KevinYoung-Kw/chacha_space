/**
 * Memory Service - 记忆管理服务
 * 
 * 用于记录和管理叉叉的记忆片段（通过后端API）
 */

import { memoryApi } from './api';

// 前端展示用的记忆类型
export interface FrontendMemory {
  id: string;
  content: string;
  type: 'thought' | 'feeling' | 'interaction' | 'observation';
  timestamp: number;
}

// 后端API的记忆类型
type BackendMemoryType = 'fact' | 'preference' | 'event' | 'relationship';

// 类型映射：前端 -> 后端
const typeToBackend: Record<FrontendMemory['type'], BackendMemoryType> = {
  'thought': 'fact',
  'feeling': 'preference',
  'interaction': 'event',
  'observation': 'fact'
};

// 类型映射：后端 -> 前端
const typeToFrontend: Record<BackendMemoryType, FrontendMemory['type']> = {
  'fact': 'thought',
  'preference': 'feeling',
  'event': 'interaction',
  'relationship': 'observation'
};

/**
 * 加载所有记忆（从后端API）
 */
export async function loadMemories(): Promise<FrontendMemory[]> {
  try {
    const result = await memoryApi.getList(1, 50);
    if (result.success && result.data) {
      // 将后端记忆转换为前端格式
      return result.data.memories.map(m => ({
        id: m.id,
        content: m.content,
        type: typeToFrontend[m.type as BackendMemoryType] || 'thought',
        timestamp: new Date(m.createdAt).getTime()
      }));
    }
  } catch (e) {
    console.error('[Memory] Failed to load memories:', e);
  }
  return [];
}

// ==================== 前端不主动生成记忆 ====================
// 所有记忆由后端AI通过 saveMemory 工具自动记录
// 这样可以确保记忆的质量和相关性，避免重复和无意义的记录
