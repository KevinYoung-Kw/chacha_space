/**
 * 用户服务
 * 统一管理用户创建和查询
 */

import { db } from '../database/db';

/**
 * 确保用户存在（用于设备ID模式）
 * 如果用户不存在，自动创建
 */
export function ensureUserExists(userId: string, email?: string): void {
  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!existing) {
    const userEmail = email || `${userId}@device.local`;
    db.prepare(`
      INSERT INTO users (id, email, name, password_hash, created_at, updated_at)
      VALUES (?, ?, '访客用户', '', datetime('now'), datetime('now'))
    `).run(userId, userEmail);
    console.log(`[User] 自动创建用户: ${userId}`);
  }
}

/**
 * 获取用户信息
 */
export function getUser(userId: string): any {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
}

/**
 * 更新用户昵称
 */
export function updateUserName(userId: string, name: string): void {
  db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, userId);
}

export default {
  ensureUserExists,
  getUser,
  updateUserName,
};
