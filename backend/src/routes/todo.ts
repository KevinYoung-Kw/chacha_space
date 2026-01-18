/**
 * 待办事项 API 路由
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { authMiddleware } from '../middleware/auth';
import { ApiResponse, TodoItem } from '../types';

const router = Router();

// router.use(authMiddleware); // 移除认证

/**
 * GET /api/todos
 * 获取待办列表
 */
router.get('/', (req: Request, res: Response<ApiResponse<TodoItem[]>>) => {
  try {
    const userId = req.user!.userId;
    const showCompleted = req.query.showCompleted === 'true';

    let query = `
      SELECT 
        t.id, 
        t.user_id as userId, 
        t.text, 
        t.completed, 
        t.category_id as categoryId,
        c.name as categoryName,
        c.icon as categoryIcon,
        c.color as categoryColor,
        t.priority, 
        t.deadline,
        t.created_at as createdAt, 
        t.updated_at as updatedAt
      FROM todos t
      LEFT JOIN todo_categories c ON t.category_id = c.id
      WHERE t.user_id = ?
    `;

    if (!showCompleted) {
      query += ' AND t.completed = 0';
    }

    query += ` ORDER BY 
      CASE 
        WHEN t.deadline IS NOT NULL AND t.deadline < datetime('now') THEN 0
        WHEN t.deadline IS NOT NULL THEN 1
        ELSE 2
      END,
      CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END,
      t.deadline ASC,
      t.created_at DESC
    `;

    const todos = db.prepare(query).all(userId) as TodoItem[];

    res.json({ success: true, data: todos });
  } catch (error) {
    console.error('[Todo] List error:', error);
    res.status(500).json({ success: false, error: '获取待办列表失败' });
  }
});

/**
 * POST /api/todos
 * 创建待办
 */
router.post('/', (req: Request, res: Response<ApiResponse<TodoItem>>) => {
  try {
    const userId = req.user!.userId;
    const { text, priority, categoryId, deadline } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ success: false, error: '待办内容不能为空' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO todos (id, user_id, text, priority, category_id, deadline, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, text.trim(), priority || 'medium', categoryId, deadline, now, now);

    // 获取分类信息
    const categoryInfo = categoryId ? db.prepare(`
      SELECT name, icon, color FROM todo_categories WHERE id = ?
    `).get(categoryId) as { name: string; icon: string; color: string } | undefined : undefined;

    const todo: TodoItem = {
      id,
      userId,
      text: text.trim(),
      completed: false,
      priority: priority || 'medium',
      categoryId,
      categoryName: categoryInfo?.name,
      categoryIcon: categoryInfo?.icon,
      categoryColor: categoryInfo?.color,
      deadline,
      createdAt: now,
      updatedAt: now
    };

    res.status(201).json({ success: true, data: todo, message: '待办已添加' });
  } catch (error) {
    console.error('[Todo] Create error:', error);
    res.status(500).json({ success: false, error: '创建待办失败' });
  }
});

/**
 * PUT /api/todos/:id
 * 更新待办
 */
router.put('/:id', (req: Request, res: Response<ApiResponse<TodoItem>>) => {
  try {
    const userId = req.user!.userId;
    const todoId = req.params.id;
    const { text, priority, categoryId, deadline, completed } = req.body;

    // 验证所有权
    const existing = db.prepare(`
      SELECT id FROM todos WHERE id = ? AND user_id = ?
    `).get(todoId, userId);

    if (!existing) {
      return res.status(404).json({ success: false, error: '待办不存在' });
    }

    db.prepare(`
      UPDATE todos 
      SET text = COALESCE(?, text),
          priority = COALESCE(?, priority),
          category_id = COALESCE(?, category_id),
          deadline = COALESCE(?, deadline),
          completed = COALESCE(?, completed),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(text, priority, categoryId, deadline, completed !== undefined ? (completed ? 1 : 0) : null, todoId);

    const todo = db.prepare(`
      SELECT 
        t.id, 
        t.user_id as userId, 
        t.text, 
        t.completed, 
        t.category_id as categoryId,
        c.name as categoryName,
        c.icon as categoryIcon,
        c.color as categoryColor,
        t.priority, 
        t.deadline,
        t.created_at as createdAt, 
        t.updated_at as updatedAt
      FROM todos t
      LEFT JOIN todo_categories c ON t.category_id = c.id
      WHERE t.id = ?
    `).get(todoId) as TodoItem;

    res.json({ success: true, data: todo });
  } catch (error) {
    console.error('[Todo] Update error:', error);
    res.status(500).json({ success: false, error: '更新待办失败' });
  }
});

/**
 * PATCH /api/todos/:id/toggle
 * 切换完成状态
 */
router.patch('/:id/toggle', (req: Request, res: Response<ApiResponse<TodoItem>>) => {
  try {
    const userId = req.user!.userId;
    const todoId = req.params.id;

    const result = db.prepare(`
      UPDATE todos SET completed = 1 - completed, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(todoId, userId);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: '待办不存在' });
    }

    const todo = db.prepare(`
      SELECT 
        t.id, 
        t.user_id as userId, 
        t.text, 
        t.completed, 
        t.category_id as categoryId,
        c.name as categoryName,
        c.icon as categoryIcon,
        c.color as categoryColor,
        t.priority, 
        t.deadline,
        t.created_at as createdAt, 
        t.updated_at as updatedAt
      FROM todos t
      LEFT JOIN todo_categories c ON t.category_id = c.id
      WHERE t.id = ?
    `).get(todoId) as TodoItem;

    res.json({ success: true, data: todo });
  } catch (error) {
    console.error('[Todo] Toggle error:', error);
    res.status(500).json({ success: false, error: '切换状态失败' });
  }
});

/**
 * DELETE /api/todos/:id
 * 删除待办
 */
router.delete('/:id', (req: Request, res: Response<ApiResponse>) => {
  try {
    const userId = req.user!.userId;
    const todoId = req.params.id;

    const result = db.prepare(`
      DELETE FROM todos WHERE id = ? AND user_id = ?
    `).run(todoId, userId);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: '待办不存在' });
    }

    res.json({ success: true, message: '待办已删除' });
  } catch (error) {
    console.error('[Todo] Delete error:', error);
    res.status(500).json({ success: false, error: '删除待办失败' });
  }
});

export default router;
