/**
 * 好感度系统 API 路由
 */

import { Router, Response } from 'express';
import { db } from '../database/db';
import { defaultUserMiddleware, AuthRequest } from '../middleware/auth';
import { ApiResponse, AffinityData, AffinityEvent, AffinityLevel, AffinityActionType } from '../types';

const router = Router();

// 所有路由都需要认证
router.use(defaultUserMiddleware); // 无认证模式，使用默认用户

// 好感度等级阈值（v1-v10，每个等级100分）
const AFFINITY_LEVELS: Record<AffinityLevel, { min: number; max: number; name: string }> = {
  v1: { min: 0, max: 100, name: '初识' },
  v2: { min: 100, max: 200, name: '熟悉' },
  v3: { min: 200, max: 300, name: '友好' },
  v4: { min: 300, max: 400, name: '亲近' },
  v5: { min: 400, max: 500, name: '信任' },
  v6: { min: 500, max: 600, name: '默契' },
  v7: { min: 600, max: 700, name: '亲密' },
  v8: { min: 700, max: 800, name: '挚友' },
  v9: { min: 800, max: 900, name: '知己' },
  v10: { min: 900, max: 1000, name: '至交' },
};

// 好感度变化规则配置
const AFFINITY_RULES: Record<AffinityActionType, { change: number; reason: string }> = {
  todo_complete: { change: 5, reason: '完成了待办事项，真棒！' },
  todo_add: { change: 2, reason: '添加了新的待办，一起努力吧！' },
  health_water: { change: 3, reason: '记得补充水分，很健康呢～' },
  health_goal: { change: 8, reason: '完成了健康目标，太厉害了！' },
  weather_check: { change: 1, reason: '关心天气变化，很贴心呢' },
  fortune_draw: { change: 4, reason: '一起探索神秘的力量～' },
  daily_chat: { change: 2, reason: '今天也来聊天了，很开心！' },
  positive_reply: { change: 1, reason: '收到积极的反馈' },
  negative_reply: { change: -3, reason: '收到负面反馈' },
  no_interaction: { change: -1, reason: '好久没来聊天了...' },
};

/**
 * 获取好感度等级
 */
function getAffinityLevel(value: number): AffinityLevel {
  const clampedValue = Math.max(0, Math.min(1000, Math.floor(value)));
  
  const levels: AffinityLevel[] = ['v10', 'v9', 'v8', 'v7', 'v6', 'v5', 'v4', 'v3', 'v2', 'v1'];
  for (const level of levels) {
    const levelConfig = AFFINITY_LEVELS[level];
    if (level === 'v10') {
      if (clampedValue >= levelConfig.min && clampedValue <= levelConfig.max) {
        return level;
      }
    } else {
      if (clampedValue >= levelConfig.min && clampedValue < levelConfig.max) {
        return level;
      }
    }
  }
  
  return 'v1';
}

/**
 * 初始化用户好感度数据
 */
function initAffinityData(userId: string): void {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO affinity (user_id, value, level, last_interaction, total_interactions)
    VALUES (?, 50, 'v1', ?, 0)
  `);
  stmt.run(userId, Date.now());
}

/**
 * GET /api/affinity
 * 获取当前用户的好感度数据
 */
router.get('/', (req: AuthRequest, res: Response<ApiResponse<AffinityData>>) => {
  try {
    const userId = req.user!.userId;
    
    // 确保用户有好感度数据
    initAffinityData(userId);
    
    // 获取好感度数据
    const affinity = db.prepare(`
      SELECT value, level, last_interaction as lastInteraction, total_interactions as totalInteractions
      FROM affinity
      WHERE user_id = ?
    `).get(userId) as any;
    
    // 获取历史记录（最近200条）
    const history = db.prepare(`
      SELECT timestamp, change, reason, action
      FROM affinity_history
      WHERE user_id = ?
      ORDER BY timestamp DESC
      LIMIT 200
    `).all(userId) as AffinityEvent[];
    
    const data: AffinityData = {
      value: affinity.value,
      level: affinity.level as AffinityLevel,
      lastInteraction: affinity.lastInteraction,
      totalInteractions: affinity.totalInteractions,
      history: history.reverse(), // 反转为正序
    };
    
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[Affinity] Get error:', error);
    res.status(500).json({
      success: false,
      error: '获取好感度数据失败',
    });
  }
});

/**
 * POST /api/affinity/update
 * 更新好感度
 */
router.post('/update', (req: AuthRequest, res: Response<ApiResponse<AffinityData>>) => {
  try {
    const userId = req.user!.userId;
    const { action, customReason } = req.body;
    
    if (!action || !AFFINITY_RULES[action as AffinityActionType]) {
      return res.status(400).json({
        success: false,
        error: '无效的动作类型',
      });
    }
    
    // 确保用户有好感度数据
    initAffinityData(userId);
    
    // 获取当前好感度
    const current = db.prepare(`
      SELECT value, level, total_interactions as totalInteractions
      FROM affinity
      WHERE user_id = ?
    `).get(userId) as any;
    
    const rule = AFFINITY_RULES[action as AffinityActionType];
    const newValue = Math.max(0, Math.min(1000, current.value + rule.change));
    const newLevel = getAffinityLevel(newValue);
    const now = Date.now();
    
    // 更新好感度
    db.prepare(`
      UPDATE affinity
      SET value = ?, level = ?, last_interaction = ?, total_interactions = ?
      WHERE user_id = ?
    `).run(newValue, newLevel, now, current.totalInteractions + 1, userId);
    
    // 记录历史
    db.prepare(`
      INSERT INTO affinity_history (user_id, timestamp, change, reason, action)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, now, rule.change, customReason || rule.reason, action);
    
    // 获取更新后的历史记录
    const history = db.prepare(`
      SELECT timestamp, change, reason, action
      FROM affinity_history
      WHERE user_id = ?
      ORDER BY timestamp DESC
      LIMIT 200
    `).all(userId) as AffinityEvent[];
    
    const data: AffinityData = {
      value: newValue,
      level: newLevel,
      lastInteraction: now,
      totalInteractions: current.totalInteractions + 1,
      history: history.reverse(),
    };
    
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[Affinity] Update error:', error);
    res.status(500).json({
      success: false,
      error: '更新好感度失败',
    });
  }
});

/**
 * GET /api/affinity/history
 * 获取好感度历史记录
 */
router.get('/history', (req: AuthRequest, res: Response<ApiResponse<AffinityEvent[]>>) => {
  try {
    const userId = req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 200;
    
    const history = db.prepare(`
      SELECT timestamp, change, reason, action
      FROM affinity_history
      WHERE user_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(userId, limit) as AffinityEvent[];
    
    res.json({
      success: true,
      data: history.reverse(),
    });
  } catch (error) {
    console.error('[Affinity] Get history error:', error);
    res.status(500).json({
      success: false,
      error: '获取历史记录失败',
    });
  }
});

export default router;
