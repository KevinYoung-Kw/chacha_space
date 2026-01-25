import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { db } from '../database/db';
import { ApiResponse } from '../types';

/**
 * 管理员权限中间件
 * 验证当前用户是否为管理员
 * 必须在 authMiddleware 之后使用
 */
export const adminMiddleware = (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  // 必须先经过认证中间件
  if (!req.user || !req.user.userId) {
    res.status(401).json({
      success: false,
      error: '未登录',
    });
    return;
  }

  try {
    // 查询用户是否为管理员
    const user = db.prepare(`
      SELECT is_admin FROM users WHERE id = ?
    `).get(req.user.userId) as { is_admin: number } | undefined;

    if (!user || user.is_admin !== 1) {
      res.status(403).json({
        success: false,
        error: '需要管理员权限',
      });
      return;
    }

    next();
  } catch (error) {
    console.error('[AdminAuth] Error:', error);
    res.status(500).json({
      success: false,
      error: '权限验证失败',
    });
  }
};

/**
 * 检查用户是否为管理员
 */
export function isAdmin(userId: string): boolean {
  try {
    const user = db.prepare(`
      SELECT is_admin FROM users WHERE id = ?
    `).get(userId) as { is_admin: number } | undefined;
    
    return user?.is_admin === 1;
  } catch {
    return false;
  }
}

export default adminMiddleware;
