/**
 * 待办分类路由
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { defaultUserMiddleware } from '../middleware/auth';
import { db } from '../database/db';
import { ApiResponse, TodoCategory } from '../types';

const router = Router();

// 所有路由都需要认证
router.use(defaultUserMiddleware); // 无认证模式，使用默认用户

// ==================== 获取用户的所有分类 ====================
router.get('/', (req: Request, res: Response<ApiResponse<TodoCategory[]>>) => {
  try {
    const userId = req.user!.userId;

    const categories = db.prepare(`
      SELECT 
        id, 
        user_id as userId, 
        name, 
        icon, 
        color,
        is_default as isDefault,
        sort_order as sortOrder,
        created_at as createdAt
      FROM todo_categories
      WHERE user_id = ?
      ORDER BY sort_order ASC, created_at ASC
    `).all(userId) as TodoCategory[];

    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('[Category] List error:', error);
    res.status(500).json({ success: false, error: '获取分类列表失败' });
  }
});

// ==================== 创建新分类 ====================
router.post('/', (req: Request, res: Response<ApiResponse<TodoCategory>>) => {
  try {
    const userId = req.user!.userId;
    const { name, icon, color } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: '分类名称不能为空' });
    }

    // 检查是否已存在同名分类
    const existing = db.prepare(`
      SELECT id FROM todo_categories WHERE user_id = ? AND name = ?
    `).get(userId, name.trim());

    if (existing) {
      return res.status(400).json({ success: false, error: '该分类已存在' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    // 获取当前最大排序值
    const maxSort = db.prepare(`
      SELECT COALESCE(MAX(sort_order), 0) as max FROM todo_categories WHERE user_id = ?
    `).get(userId) as { max: number };

    db.prepare(`
      INSERT INTO todo_categories (id, user_id, name, icon, color, is_default, sort_order, created_at)
      VALUES (?, ?, ?, ?, ?, 0, ?, ?)
    `).run(id, userId, name.trim(), icon || 'List', color || 'bg-gray-500', maxSort.max + 1, now);

    const category: TodoCategory = {
      id,
      userId,
      name: name.trim(),
      icon: icon || 'List',
      color: color || 'bg-gray-500',
      isDefault: false,
      sortOrder: maxSort.max + 1,
      createdAt: now
    };

    res.status(201).json({ 
      success: true, 
      data: category,
      message: `分类「${name}」已创建` 
    });
  } catch (error) {
    console.error('[Category] Create error:', error);
    res.status(500).json({ success: false, error: '创建分类失败' });
  }
});

// ==================== 更新分类 ====================
router.put('/:id', (req: Request, res: Response<ApiResponse<TodoCategory>>) => {
  try {
    const userId = req.user!.userId;
    const categoryId = req.params.id;
    const { name, icon, color } = req.body;

    // 验证所有权
    const existing = db.prepare(`
      SELECT id, is_default FROM todo_categories WHERE id = ? AND user_id = ?
    `).get(categoryId, userId) as { id: string; is_default: number } | undefined;

    if (!existing) {
      return res.status(404).json({ success: false, error: '分类不存在' });
    }

    if (existing.is_default) {
      return res.status(400).json({ success: false, error: '无法修改系统默认分类' });
    }

    db.prepare(`
      UPDATE todo_categories 
      SET name = COALESCE(?, name),
          icon = COALESCE(?, icon),
          color = COALESCE(?, color)
      WHERE id = ?
    `).run(name, icon, color, categoryId);

    const category = db.prepare(`
      SELECT 
        id, 
        user_id as userId, 
        name, 
        icon, 
        color,
        is_default as isDefault,
        sort_order as sortOrder,
        created_at as createdAt
      FROM todo_categories WHERE id = ?
    `).get(categoryId) as TodoCategory;

    res.json({ success: true, data: category });
  } catch (error) {
    console.error('[Category] Update error:', error);
    res.status(500).json({ success: false, error: '更新分类失败' });
  }
});

// ==================== 删除分类 ====================
router.delete('/:id', (req: Request, res: Response<ApiResponse>) => {
  try {
    const userId = req.user!.userId;
    const categoryId = req.params.id;

    // 验证所有权
    const existing = db.prepare(`
      SELECT id, is_default, name FROM todo_categories WHERE id = ? AND user_id = ?
    `).get(categoryId, userId) as { id: string; is_default: number; name: string } | undefined;

    if (!existing) {
      return res.status(404).json({ success: false, error: '分类不存在' });
    }

    if (existing.is_default) {
      return res.status(400).json({ success: false, error: '无法删除系统默认分类' });
    }

    // 删除分类（关联的待办会自动设置 category_id 为 NULL）
    db.prepare('DELETE FROM todo_categories WHERE id = ?').run(categoryId);

    res.json({ 
      success: true, 
      message: `分类「${existing.name}」已删除` 
    });
  } catch (error) {
    console.error('[Category] Delete error:', error);
    res.status(500).json({ success: false, error: '删除分类失败' });
  }
});

export default router;
