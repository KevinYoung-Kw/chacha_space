import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth';
import { adminMiddleware, isAdmin } from '../middleware/adminAuth';
import { ApiResponse } from '../types';

const router = Router();

// ==================== 管理员登录 ====================

/**
 * POST /api/admin/login
 * 管理员登录
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

    // 查询用户
    const user = db.prepare(`
      SELECT id, email, password_hash, name, is_admin 
      FROM users 
      WHERE email = ?
    `).get(email) as any;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: '邮箱或密码错误',
      });
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: '邮箱或密码错误',
      });
    }

    // 验证是否为管理员
    if (user.is_admin !== 1) {
      return res.status(403).json({
        success: false,
        error: '该账户没有管理员权限',
      });
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
          isAdmin: true,
        },
      },
    });
  } catch (error) {
    console.error('[Admin] Login error:', error);
    res.status(500).json({
      success: false,
      error: '登录失败',
    });
  }
});

// ==================== 统计数据 ====================

/**
 * GET /api/admin/stats
 * 获取统计数据
 */
router.get('/stats', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    // 用户统计
    const userStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN date(created_at) = date('now') THEN 1 ELSE 0 END) as today,
        SUM(CASE WHEN date(created_at) >= date('now', '-7 days') THEN 1 ELSE 0 END) as week
      FROM users
      WHERE is_admin = 0 OR is_admin IS NULL
    `).get() as any;

    // 邀请码统计
    const inviteStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN used_by IS NOT NULL THEN 1 ELSE 0 END) as used,
        SUM(CASE WHEN used_by IS NULL THEN 1 ELSE 0 END) as available
      FROM invite_codes
    `).get() as any;

    // 待办统计
    const todoStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed
      FROM todos
    `).get() as any;

    // 对话统计
    const chatStats = db.prepare(`
      SELECT 
        COUNT(*) as totalMessages,
        COUNT(DISTINCT session_id) as totalSessions
      FROM messages
    `).get() as any;

    // 最近注册用户
    const recentUsers = db.prepare(`
      SELECT id, email, name, created_at
      FROM users
      WHERE is_admin = 0 OR is_admin IS NULL
      ORDER BY created_at DESC
      LIMIT 5
    `).all() as any[];

    res.json({
      success: true,
      data: {
        users: {
          total: userStats.total || 0,
          today: userStats.today || 0,
          week: userStats.week || 0,
        },
        inviteCodes: {
          total: inviteStats.total || 0,
          used: inviteStats.used || 0,
          available: inviteStats.available || 0,
        },
        todos: {
          total: todoStats.total || 0,
          completed: todoStats.completed || 0,
        },
        chats: {
          totalMessages: chatStats.totalMessages || 0,
          totalSessions: chatStats.totalSessions || 0,
        },
        recentUsers,
      },
    });
  } catch (error) {
    console.error('[Admin] Stats error:', error);
    res.status(500).json({
      success: false,
      error: '获取统计数据失败',
    });
  }
});

// ==================== 邀请码管理 ====================

/**
 * GET /api/admin/invite-codes
 * 获取邀请码列表
 */
router.get('/invite-codes', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const status = req.query.status as string; // 'all' | 'used' | 'available'
    const offset = (page - 1) * pageSize;

    let whereClause = '';
    if (status === 'used') {
      whereClause = 'WHERE used_by IS NOT NULL';
    } else if (status === 'available') {
      whereClause = 'WHERE used_by IS NULL';
    }

    // 获取总数
    const countResult = db.prepare(`
      SELECT COUNT(*) as total FROM invite_codes ${whereClause}
    `).get() as { total: number };

    // 获取邀请码列表
    const inviteCodes = db.prepare(`
      SELECT 
        ic.code,
        ic.created_at,
        ic.used_at,
        ic.expires_at,
        u.email as used_by_email,
        u.name as used_by_name
      FROM invite_codes ic
      LEFT JOIN users u ON ic.used_by = u.id
      ${whereClause}
      ORDER BY ic.created_at DESC
      LIMIT ? OFFSET ?
    `).all(pageSize, offset) as any[];

    res.json({
      success: true,
      data: {
        inviteCodes,
        pagination: {
          page,
          pageSize,
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('[Admin] Get invite codes error:', error);
    res.status(500).json({
      success: false,
      error: '获取邀请码列表失败',
    });
  }
});

/**
 * POST /api/admin/invite-codes
 * 批量生成邀请码
 */
router.post('/invite-codes', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const { count = 10, expiresIn } = req.body;
    const adminUserId = req.user?.userId;

    if (count < 1 || count > 100) {
      return res.status(400).json({
        success: false,
        error: '数量必须在 1-100 之间',
      });
    }

    const expiresAt = expiresIn 
      ? new Date(Date.now() + expiresIn * 1000).toISOString() 
      : null;

    const stmt = db.prepare(`
      INSERT INTO invite_codes (code, created_by, expires_at)
      VALUES (?, ?, ?)
    `);

    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // 生成8位大写字母+数字组合
      const code = uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
      stmt.run(code, adminUserId, expiresAt);
      codes.push(code);
    }

    console.log(`[Admin] Generated ${codes.length} invite codes by ${adminUserId}`);

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
    console.error('[Admin] Generate invite codes error:', error);
    res.status(500).json({
      success: false,
      error: '生成邀请码失败',
    });
  }
});

/**
 * DELETE /api/admin/invite-codes/:code
 * 删除邀请码
 */
router.delete('/invite-codes/:code', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const { code } = req.params;

    const result = db.prepare(`
      DELETE FROM invite_codes WHERE code = ?
    `).run(code);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: '邀请码不存在',
      });
    }

    console.log(`[Admin] Deleted invite code: ${code}`);

    res.json({
      success: true,
      message: '邀请码已删除',
    });
  } catch (error) {
    console.error('[Admin] Delete invite code error:', error);
    res.status(500).json({
      success: false,
      error: '删除邀请码失败',
    });
  }
});

// ==================== 用户管理 ====================

/**
 * GET /api/admin/users
 * 获取用户列表
 */
router.get('/users', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const search = req.query.search as string;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE (is_admin = 0 OR is_admin IS NULL)';
    const params: any[] = [];

    if (search) {
      whereClause += ' AND (email LIKE ? OR name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // 获取总数
    const countResult = db.prepare(`
      SELECT COUNT(*) as total FROM users ${whereClause}
    `).get(...params) as { total: number };

    // 获取用户列表
    const users = db.prepare(`
      SELECT 
        u.id,
        u.email,
        u.name,
        u.gender,
        u.created_at,
        a.value as affinity_value,
        a.level as affinity_level,
        (SELECT COUNT(*) FROM todos WHERE user_id = u.id) as todo_count,
        (SELECT COUNT(*) FROM messages WHERE user_id = u.id) as message_count
      FROM users u
      LEFT JOIN affinity a ON u.id = a.user_id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset) as any[];

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          pageSize,
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('[Admin] Get users error:', error);
    res.status(500).json({
      success: false,
      error: '获取用户列表失败',
    });
  }
});

/**
 * DELETE /api/admin/users/:id
 * 删除用户
 */
router.delete('/users/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const adminUserId = req.user?.userId;

    // 不能删除自己
    if (id === adminUserId) {
      return res.status(400).json({
        success: false,
        error: '不能删除自己的账户',
      });
    }

    // 检查用户是否存在
    const user = db.prepare(`
      SELECT id, is_admin FROM users WHERE id = ?
    `).get(id) as any;

    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在',
      });
    }

    // 不能删除其他管理员
    if (user.is_admin === 1) {
      return res.status(403).json({
        success: false,
        error: '不能删除管理员账户',
      });
    }

    // 删除用户（级联删除相关数据）
    db.prepare('DELETE FROM users WHERE id = ?').run(id);

    console.log(`[Admin] Deleted user: ${id} by ${adminUserId}`);

    res.json({
      success: true,
      message: '用户已删除',
    });
  } catch (error) {
    console.error('[Admin] Delete user error:', error);
    res.status(500).json({
      success: false,
      error: '删除用户失败',
    });
  }
});

/**
 * GET /api/admin/users/:id
 * 获取用户详情
 */
router.get('/users/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;

    const user = db.prepare(`
      SELECT 
        u.id,
        u.email,
        u.name,
        u.gender,
        u.identity,
        u.expectations,
        u.created_at,
        u.updated_at,
        a.value as affinity_value,
        a.level as affinity_level,
        a.total_interactions
      FROM users u
      LEFT JOIN affinity a ON u.id = a.user_id
      WHERE u.id = ?
    `).get(id) as any;

    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在',
      });
    }

    // 获取用户统计
    const stats = {
      todos: db.prepare('SELECT COUNT(*) as count FROM todos WHERE user_id = ?').get(id) as any,
      messages: db.prepare('SELECT COUNT(*) as count FROM messages WHERE user_id = ?').get(id) as any,
      memories: db.prepare('SELECT COUNT(*) as count FROM memories WHERE user_id = ?').get(id) as any,
    };

    res.json({
      success: true,
      data: {
        ...user,
        stats: {
          todos: stats.todos?.count || 0,
          messages: stats.messages?.count || 0,
          memories: stats.memories?.count || 0,
        },
      },
    });
  } catch (error) {
    console.error('[Admin] Get user detail error:', error);
    res.status(500).json({
      success: false,
      error: '获取用户详情失败',
    });
  }
});

export default router;
