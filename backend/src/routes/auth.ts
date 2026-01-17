import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { generateToken, authMiddleware } from '../middleware/auth';
import { ApiResponse, UserProfile } from '../types';

const router = Router();

/**
 * POST /api/auth/register
 * 用户注册
 */
router.post('/register', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { email, password, name, gender, identity, expectations } = req.body;

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
    const stmt = db.prepare(`
      INSERT INTO users (id, email, password_hash, name, gender, identity, expectations)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(userId, email, passwordHash, name, gender, identity, expectations);

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
 * 用户登录
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
