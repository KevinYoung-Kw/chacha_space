import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload, ApiResponse } from '../types';

/**
 * 扩展 Express Request 以包含 user 属性
 */
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/**
 * JWT 认证中间件
 * 验证请求头中的 Bearer Token
 */
export const authMiddleware = (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  // 跳过 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    next();
    return;
  }

  const authHeader = req.headers.authorization;

  // 添加详细日志，帮助调试
  if (!authHeader) {
    console.log(`[Auth] 未提供 Authorization 头 - ${req.method} ${req.path}`);
    console.log('[Auth] Headers:', JSON.stringify(req.headers, null, 2));
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: '未提供认证令牌',
    });
    return;
  }

  const token = authHeader.substring(7); // 去掉 "Bearer " 前缀

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: '认证令牌已过期',
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: '无效的认证令牌',
      });
    } else {
      res.status(500).json({
        success: false,
        error: '认证验证失败',
      });
    }
  }
};

/**
 * 可选认证中间件
 * 如果提供了 Token 则验证，否则继续
 */
export const optionalAuthMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
      req.user = decoded;
    } catch {
      // 忽略无效 token，继续请求
    }
  }

  next();
};

/**
 * 生成 JWT Token
 */
export const generateToken = (payload: { userId: string; email: string }): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as string | number,
  } as jwt.SignOptions);
};

export default authMiddleware;
