/**
 * 记忆系统服务
 * 管理用户的长期记忆和上下文
 */

import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { Memory, Message, ConversationSession } from '../types';

// ==================== 长期记忆管理 ====================

/**
 * 保存一条新记忆
 */
export function saveMemory(
  userId: string,
  content: string,
  type: Memory['type'],
  importance: number = 5
): Memory {
  const id = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO memories (id, user_id, type, content, importance, created_at, last_accessed)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, type, content, importance, now, now);

  return {
    id,
    userId,
    type,
    content,
    importance,
    lastAccessed: now,
    createdAt: now
  };
}

/**
 * 获取用户的相关记忆
 * 按重要性和最近访问时间排序
 */
export function getRelevantMemories(userId: string, limit: number = 10): Memory[] {
  const memories = db.prepare(`
    SELECT id, user_id as userId, type, content, importance, 
           last_accessed as lastAccessed, created_at as createdAt
    FROM memories
    WHERE user_id = ?
    ORDER BY importance DESC, last_accessed DESC
    LIMIT ?
  `).all(userId, limit) as Memory[];

  // 更新访问时间
  if (memories.length > 0) {
    const ids = memories.map(m => m.id);
    db.prepare(`
      UPDATE memories SET last_accessed = datetime('now')
      WHERE id IN (${ids.map(() => '?').join(',')})
    `).run(...ids);
  }

  return memories;
}

/**
 * 删除记忆
 */
export function deleteMemory(userId: string, memoryId: string): boolean {
  const result = db.prepare(`
    DELETE FROM memories WHERE id = ? AND user_id = ?
  `).run(memoryId, userId);
  return result.changes > 0;
}

/**
 * 获取所有记忆（分页）
 */
export function getAllMemories(
  userId: string,
  page: number = 1,
  pageSize: number = 20
): { memories: Memory[]; total: number } {
  const offset = (page - 1) * pageSize;

  const memories = db.prepare(`
    SELECT id, user_id as userId, type, content, importance,
           last_accessed as lastAccessed, created_at as createdAt
    FROM memories
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(userId, pageSize, offset) as Memory[];

  const total = (db.prepare(`
    SELECT COUNT(*) as count FROM memories WHERE user_id = ?
  `).get(userId) as { count: number }).count;

  return { memories, total };
}

// ==================== 对话会话管理 ====================

/**
 * 创建新会话
 */
export function createSession(userId: string, title?: string): ConversationSession {
  const id = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO conversation_sessions (id, user_id, title, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, userId, title || '新对话', now, now);

  return { id, userId, title, createdAt: now, updatedAt: now };
}

/**
 * 获取用户的会话列表
 */
export function getSessions(userId: string, limit: number = 10): ConversationSession[] {
  return db.prepare(`
    SELECT id, user_id as userId, title, summary, 
           created_at as createdAt, updated_at as updatedAt
    FROM conversation_sessions
    WHERE user_id = ?
    ORDER BY updated_at DESC
    LIMIT ?
  `).all(userId, limit) as ConversationSession[];
}

/**
 * 更新会话摘要
 */
export function updateSessionSummary(sessionId: string, summary: string): void {
  db.prepare(`
    UPDATE conversation_sessions SET summary = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(summary, sessionId);
}

// ==================== 对话消息管理 ====================

/**
 * 保存消息
 */
export function saveMessage(
  userId: string,
  sessionId: string,
  role: Message['role'],
  content: string
): Message {
  const id = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO messages (id, user_id, session_id, role, content, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, userId, sessionId, role, content, now);

  // 更新会话的 updated_at
  db.prepare(`
    UPDATE conversation_sessions SET updated_at = ? WHERE id = ?
  `).run(now, sessionId);

  return { id, userId, sessionId, role, content, timestamp: now };
}

/**
 * 获取会话的消息历史
 */
export function getSessionMessages(
  sessionId: string,
  limit: number = 50
): Message[] {
  return db.prepare(`
    SELECT id, user_id as userId, session_id as sessionId, role, content, timestamp
    FROM messages
    WHERE session_id = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(sessionId, limit).reverse() as Message[];
}

/**
 * 获取最近的对话历史（用于上下文）
 */
export function getRecentHistory(
  userId: string,
  limit: number = 20
): { role: string; content: string }[] {
  const messages = db.prepare(`
    SELECT role, content
    FROM messages
    WHERE user_id = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(userId, limit) as { role: string; content: string }[];

  return messages.reverse();
}

// ==================== 上下文工程 ====================

/**
 * 获取近 N 天的每日摘要（滑动窗口热数据）
 */
export function getRecentDaySummaries(userId: string, days: number = 7): {
  date: string;
  summary: string | null;
  mood: string | null;
}[] {
  const summaries = db.prepare(`
    SELECT date, summary, mood
    FROM daily_letters
    WHERE user_id = ?
    AND date >= date('now', '-' || ? || ' days')
    ORDER BY date DESC
  `).all(userId, days) as { date: string; summary: string | null; mood: string | null }[];

  return summaries;
}

/**
 * 搜索历史消息（按需 RAG 检索）
 */
export function searchMessages(
  userId: string,
  query: string,
  dateRange?: { start: string; end: string },
  limit: number = 10
): { role: string; content: string; timestamp: string }[] {
  let sql = `
    SELECT role, content, timestamp
    FROM messages
    WHERE user_id = ? AND content LIKE ?
  `;
  const params: any[] = [userId, `%${query}%`];

  if (dateRange) {
    sql += ` AND date(timestamp) BETWEEN ? AND ?`;
    params.push(dateRange.start, dateRange.end);
  }

  sql += ` ORDER BY timestamp DESC LIMIT ?`;
  params.push(limit);

  return db.prepare(sql).all(...params) as { role: string; content: string; timestamp: string }[];
}

/**
 * 构建完整的对话上下文（增强版：滑动窗口 + 热数据）
 * 
 * 包含：
 * 1. 近 7 天每日摘要（Hot Context）- 保持连续性感知
 * 2. 当前会话详细历史
 * 3. 高重要性记忆
 */
export function buildContext(userId: string): {
  history: { role: string; content: string }[];
  memories: Memory[];
  recentSummaries: { date: string; summary: string | null; mood: string | null }[];
} {
  // 1. 近 7 天摘要（滑动窗口热数据）
  const recentSummaries = getRecentDaySummaries(userId, 7);

  // 2. 当前会话详细历史（最近 20 条）
  const history = getRecentHistory(userId, 20);

  // 3. 高重要性记忆（最相关的 10 条）
  const memories = getRelevantMemories(userId, 10);

  return { history, memories, recentSummaries };
}

/**
 * 构建带有 RAG 结果的上下文
 * 当用户查询旧事或细节时调用
 */
export function buildContextWithRAG(
  userId: string,
  query: string,
  dateRange?: { start: string; end: string }
): {
  history: { role: string; content: string }[];
  memories: Memory[];
  recentSummaries: { date: string; summary: string | null; mood: string | null }[];
  searchResults: { role: string; content: string; timestamp: string }[];
} {
  const baseContext = buildContext(userId);
  const searchResults = searchMessages(userId, query, dateRange, 5);

  return {
    ...baseContext,
    searchResults
  };
}

/**
 * 从对话中提取记忆（简单规则匹配）
 * 实际应用中可以使用 AI 来判断
 */
export function extractMemoriesFromMessage(
  userId: string,
  content: string,
  role: 'user' | 'assistant'
): void {
  // 只处理用户消息
  if (role !== 'user') return;

  // 简单的规则匹配示例
  const preferencePatterns = [
    /我喜欢(.+)/,
    /我不喜欢(.+)/,
    /我爱(.+)/,
    /我讨厌(.+)/,
    /我最喜欢的(.+)是(.+)/,
  ];

  const factPatterns = [
    /我是(.+)/,
    /我在(.+)工作/,
    /我住在(.+)/,
    /我的(.+)是(.+)/,
  ];

  const relationshipPatterns = [
    /我的(.+)(叫|是)(.+)/,
    /(.+)是我的(.+)/,
  ];

  // 检查偏好
  for (const pattern of preferencePatterns) {
    const match = content.match(pattern);
    if (match) {
      saveMemory(userId, content, 'preference', 6);
      return;
    }
  }

  // 检查事实
  for (const pattern of factPatterns) {
    const match = content.match(pattern);
    if (match) {
      saveMemory(userId, content, 'fact', 7);
      return;
    }
  }

  // 检查关系
  for (const pattern of relationshipPatterns) {
    const match = content.match(pattern);
    if (match) {
      saveMemory(userId, content, 'relationship', 8);
      return;
    }
  }
}
