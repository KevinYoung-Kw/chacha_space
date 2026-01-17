/**
 * 记忆系统 API 路由
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getAllMemories,
  saveMemory,
  deleteMemory,
  getRelevantMemories
} from '../services/memory';
import { ApiResponse, Memory } from '../types';

const router = Router();

router.use(authMiddleware);

/**
 * GET /api/memories
 * 获取所有记忆（分页）
 */
router.get('/', (req: Request, res: Response<ApiResponse>) => {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const result = getAllMemories(userId, page, pageSize);

    res.json({
      success: true,
      data: {
        memories: result.memories,
        total: result.total,
        page,
        pageSize,
        totalPages: Math.ceil(result.total / pageSize)
      }
    });
  } catch (error) {
    console.error('[Memory] List error:', error);
    res.status(500).json({ success: false, error: '获取记忆列表失败' });
  }
});

/**
 * GET /api/memories/relevant
 * 获取相关记忆（用于上下文）
 */
router.get('/relevant', (req: Request, res: Response<ApiResponse<Memory[]>>) => {
  try {
    const userId = req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 10;

    const memories = getRelevantMemories(userId, limit);

    res.json({ success: true, data: memories });
  } catch (error) {
    console.error('[Memory] Relevant error:', error);
    res.status(500).json({ success: false, error: '获取记忆失败' });
  }
});

/**
 * POST /api/memories
 * 添加新记忆
 */
router.post('/', (req: Request, res: Response<ApiResponse<Memory>>) => {
  try {
    const userId = req.user!.userId;
    const { content, type, importance } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, error: '记忆内容不能为空' });
    }

    if (!type || !['fact', 'preference', 'event', 'relationship'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: '记忆类型必须是 fact, preference, event 或 relationship'
      });
    }

    const memory = saveMemory(userId, content, type, importance || 5);

    res.status(201).json({
      success: true,
      data: memory,
      message: '记忆已保存'
    });
  } catch (error) {
    console.error('[Memory] Create error:', error);
    res.status(500).json({ success: false, error: '保存记忆失败' });
  }
});

/**
 * DELETE /api/memories/:id
 * 删除记忆
 */
router.delete('/:id', (req: Request, res: Response<ApiResponse>) => {
  try {
    const userId = req.user!.userId;
    const memoryId = req.params.id;

    const deleted = deleteMemory(userId, memoryId);

    if (!deleted) {
      return res.status(404).json({ success: false, error: '记忆不存在' });
    }

    res.json({ success: true, message: '记忆已删除' });
  } catch (error) {
    console.error('[Memory] Delete error:', error);
    res.status(500).json({ success: false, error: '删除记忆失败' });
  }
});

export default router;
