import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { generateToken, authMiddleware } from '../middleware/auth';
import { ApiResponse, UserProfile } from '../types';

const router = Router();

/**
 * 创建用户的默认数据（健康目标、分类、会话）
 */
function createDefaultUserData(userId: string): string {
  // 创建默认健康目标
  db.prepare(`
    INSERT INTO health_goals (user_id) VALUES (?)
  `).run(userId);

  // 创建默认待办分类
  const defaultCategories = [
    { id: uuidv4(), name: '工作', icon: 'Briefcase', color: 'bg-blue-500', sortOrder: 1 },
    { id: uuidv4(), name: '健康', icon: 'Heart', color: 'bg-green-500', sortOrder: 2 },
    { id: uuidv4(), name: '开发', icon: 'Code', color: 'bg-purple-500', sortOrder: 3 },
    { id: uuidv4(), name: '创作', icon: 'PenTool', color: 'bg-orange-500', sortOrder: 4 },
  ];

  const categoryStmt = db.prepare(`
    INSERT INTO todo_categories (id, user_id, name, icon, color, is_default, sort_order, created_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, datetime('now'))
  `);

  for (const cat of defaultCategories) {
    categoryStmt.run(cat.id, userId, cat.name, cat.icon, cat.color, cat.sortOrder);
  }

  // 创建默认会话
  const sessionId = uuidv4();
  db.prepare(`
    INSERT INTO conversation_sessions (id, user_id, title)
    VALUES (?, ?, ?)
  `).run(sessionId, userId, '初始对话');

  return sessionId;
}

/**
 * POST /api/auth/check-invite
 * 检查邀请码是否有效
 */
router.post('/check-invite', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode || inviteCode.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: '邀请码不能为空',
      });
    }

    const code = inviteCode.trim().toUpperCase();

    // 检查邀请码是否存在且未使用
    const invite = db.prepare(`
      SELECT code, used_by, expires_at FROM invite_codes WHERE code = ?
    `).get(code) as any;

    if (!invite) {
      return res.json({
        success: true,
        data: {
          valid: false,
          message: '邀请码不存在',
        },
      });
    }

    if (invite.used_by) {
      return res.json({
        success: true,
        data: {
          valid: false,
          message: '邀请码已被使用',
        },
      });
    }

    // 检查是否过期
    if (invite.expires_at) {
      const expiresAt = new Date(invite.expires_at);
      if (expiresAt < new Date()) {
        return res.json({
          success: true,
          data: {
            valid: false,
            message: '邀请码已过期',
          },
        });
      }
    }

    res.json({
      success: true,
      data: {
        valid: true,
        message: '邀请码有效',
      },
    });
  } catch (error) {
    console.error('[Auth] Check invite error:', error);
    res.status(500).json({
      success: false,
      error: '检查邀请码失败',
    });
  }
});

/**
 * POST /api/auth/generate-invite
 * 生成邀请码（批量）
 * 权限：仅允许来自 localhost 的请求
 */
router.post('/generate-invite', async (req: Request, res: Response<ApiResponse>) => {
  try {
    // 权限检查：只允许来自 localhost 的请求
    const clientIp = req.ip || req.socket.remoteAddress || '';
    const isLocalhost = 
      clientIp === '127.0.0.1' || 
      clientIp === '::1' || 
      clientIp === '::ffff:127.0.0.1' ||
      clientIp.startsWith('127.') ||
      clientIp === 'localhost';

    if (!isLocalhost) {
      console.warn(`[Auth] 非法访问邀请码生成接口，IP: ${clientIp}`);
      return res.status(403).json({
        success: false,
        error: '此接口仅限本地服务器访问',
      });
    }

    const { count = 1, expiresIn } = req.body;

    if (count < 1 || count > 100) {
      return res.status(400).json({
        success: false,
        error: '生成数量应在1-100之间',
      });
    }

    const codes: string[] = [];
    const expiresAt = expiresIn 
      ? new Date(Date.now() + expiresIn * 1000).toISOString() 
      : null;

    const stmt = db.prepare(`
      INSERT INTO invite_codes (code, created_by, expires_at)
      VALUES (?, NULL, ?)
    `);

    for (let i = 0; i < count; i++) {
      // 生成8位大写字母+数字组合
      const code = generateInviteCode();
      try {
        stmt.run(code, expiresAt);
        codes.push(code);
      } catch (err) {
        // 如果重复，重试
        console.warn(`[Auth] Invite code collision: ${code}, retrying...`);
        i--;
      }
    }

    res.json({
      success: true,
      data: {
        codes,
        count: codes.length,
        expiresAt,
      },
      message: `成功生成 ${codes.length} 个邀请码`,
    });
  } catch (error) {
    console.error('[Auth] Generate invite error:', error);
    res.status(500).json({
      success: false,
      error: '生成邀请码失败',
    });
  }
});

/**
 * 生成邀请码（8位大写字母+数字）
 */
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * POST /api/auth/register
 * 用户注册（需要邀请码）
 */
router.post('/register', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { email, password, name, inviteCode, gender, identity, expectations } = req.body;

    // 验证必填字段
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: '邮箱和密码不能为空',
      });
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: '邮箱格式不正确',
      });
    }

    // 昵称验证
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: '昵称不能为空',
      });
    }

    // 密码长度验证
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: '密码长度至少6位',
      });
    }

    // 邀请码验证
    if (!inviteCode || inviteCode.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: '邀请码不能为空',
      });
    }

    const code = inviteCode.trim().toUpperCase();
    const invite = db.prepare(`
      SELECT code, used_by, expires_at FROM invite_codes WHERE code = ?
    `).get(code) as any;

    if (!invite) {
      return res.status(400).json({
        success: false,
        error: '邀请码不存在',
      });
    }

    if (invite.used_by) {
      return res.status(400).json({
        success: false,
        error: '邀请码已被使用',
      });
    }

    // 检查邀请码是否过期
    if (invite.expires_at) {
      const expiresAt = new Date(invite.expires_at);
      if (expiresAt < new Date()) {
        return res.status(400).json({
          success: false,
          error: '邀请码已过期',
        });
      }
    }

    // 检查邮箱是否已存在
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: '该邮箱已被注册',
      });
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 创建用户
    const userId = uuidv4();
    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, gender, identity, expectations)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, email, passwordHash, name, gender, identity, expectations);

    const sessionId = createDefaultUserData(userId);

    // 标记邀请码为已使用
    db.prepare(`
      UPDATE invite_codes SET used_by = ?, used_at = datetime('now') WHERE code = ?
    `).run(userId, code);

    // 生成 Token
    const token = generateToken({ userId, email });

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: userId,
          email,
          name,
          gender,
          identity,
          expectations,
        },
        sessionId,
      },
      message: '注册成功！欢迎使用叉叉助手~',
    });
  } catch (error) {
    console.error('[Auth] Register error:', error);
    res.status(500).json({
      success: false,
      error: '注册失败，请稍后重试',
    });
  }
});

/**
 * POST /api/auth/login
 * 用户登录（保留旧接口）
 */
router.post('/login', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: '邮箱和密码不能为空',
      });
    }

    // 查找用户
    const user = db.prepare(`
      SELECT id, email, password_hash, name, gender, identity, expectations
      FROM users WHERE email = ?
    `).get(email) as any;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: '邮箱或密码错误',
      });
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: '邮箱或密码错误',
      });
    }

    // 获取或创建会话
    let session = db.prepare(`
      SELECT id FROM conversation_sessions 
      WHERE user_id = ? 
      ORDER BY updated_at DESC LIMIT 1
    `).get(user.id) as any;

    if (!session) {
      const sessionId = uuidv4();
      db.prepare(`
        INSERT INTO conversation_sessions (id, user_id, title)
        VALUES (?, ?, ?)
      `).run(sessionId, user.id, '新对话');
      session = { id: sessionId };
    }

    // 生成 Token
    const token = generateToken({ userId: user.id, email: user.email });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          gender: user.gender,
          identity: user.identity,
          expectations: user.expectations,
        },
        sessionId: session.id,
      },
      message: '登录成功！',
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({
      success: false,
      error: '登录失败，请稍后重试',
    });
  }
});

/**
 * GET /api/auth/profile
 * 获取当前用户信息
 */
router.get('/profile', authMiddleware, (req: Request, res: Response<ApiResponse<UserProfile>>) => {
  try {
    const user = db.prepare(`
      SELECT id, email, name, gender, identity, expectations
      FROM users WHERE id = ?
    `).get(req.user!.userId) as UserProfile | undefined;

    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('[Auth] Profile error:', error);
    res.status(500).json({
      success: false,
      error: '获取用户信息失败',
    });
  }
});

/**
 * PUT /api/auth/profile
 * 更新用户信息
 */
router.put('/profile', authMiddleware, (req: Request, res: Response<ApiResponse<UserProfile>>) => {
  try {
    const { name, gender, identity, expectations } = req.body;
    const userId = req.user!.userId;

    db.prepare(`
      UPDATE users SET name = ?, gender = ?, identity = ?, expectations = ?
      WHERE id = ?
    `).run(name, gender, identity, expectations, userId);

    const user = db.prepare(`
      SELECT id, username, name, gender, identity, expectations
      FROM users WHERE id = ?
    `).get(userId) as UserProfile;

    res.json({
      success: true,
      data: user,
      message: '资料更新成功！',
    });
  } catch (error) {
    console.error('[Auth] Update profile error:', error);
    res.status(500).json({
      success: false,
      error: '更新失败',
    });
  }
});

export default router;
