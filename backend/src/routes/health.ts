/**
 * 健康数据 API 路由
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { authMiddleware } from '../middleware/auth';
import { ApiResponse, HealthSummary, HealthGoals } from '../types';

const router = Router();

router.use(authMiddleware); // JWT 认证

/**
 * GET /api/health/summary
 * 获取今日健康数据摘要
 */
router.get('/summary', (req: Request, res: Response<ApiResponse<HealthSummary>>) => {
  try {
    const userId = req.user!.userId;

    // 获取健康目标
    let goals = db.prepare(`
      SELECT water_goal, calories_goal, sleep_goal, exercise_goal
      FROM health_goals WHERE user_id = ?
    `).get(userId) as any;

    // 如果没有目标，创建默认值
    if (!goals) {
      // 先检查用户是否存在
      const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
      
      if (userExists) {
        db.prepare(`
          INSERT INTO health_goals (user_id) VALUES (?)
        `).run(userId);
        goals = { water_goal: 2000, calories_goal: 2000, sleep_goal: 8, exercise_goal: 30 };
      } else {
        // 用户不存在，返回错误
        return res.status(401).json({ success: false, error: '用户不存在，请重新登录' });
      }
    }

    // 获取今日数据的辅助函数
    const getTodayTotal = (type: string): number => {
      const result = db.prepare(`
        SELECT COALESCE(SUM(value), 0) as total
        FROM health_records
        WHERE user_id = ? AND type = ? AND date(recorded_at) = date('now')
      `).get(userId, type) as { total: number };
      return result.total;
    };

    // 获取历史记录（最近7天）
    const getHistory = (type: string): any[] => {
      return db.prepare(`
        SELECT value, metadata, recorded_at as recordedAt
        FROM health_records
        WHERE user_id = ? AND type = ? AND date(recorded_at) >= date('now', '-7 days')
        ORDER BY recorded_at DESC
        LIMIT 20
      `).all(userId, type) as any[];
    };

    // 获取昨晚睡眠
    const sleepRecord = db.prepare(`
      SELECT value
      FROM health_records
      WHERE user_id = ? AND type = 'sleep'
      ORDER BY recorded_at DESC LIMIT 1
    `).get(userId) as { value: number } | undefined;

    const summary: HealthSummary = {
      water: {
        current: getTodayTotal('water'),
        goal: goals.water_goal,
        history: getHistory('water')
      },
      calories: {
        current: getTodayTotal('calories'),
        goal: goals.calories_goal,
        // TODO: 实现营养素追踪，当前返回默认值
        macros: { protein: 0, carbs: 0, fat: 0 },
        history: getHistory('calories')
      },
      sleep: {
        current: sleepRecord?.value || 0,
        goal: goals.sleep_goal,
        history: getHistory('sleep')
      },
      exercise: {
        current: getTodayTotal('exercise'),
        goal: goals.exercise_goal,
        history: getHistory('exercise')
      }
    };

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('[Health] Summary error:', error);
    res.status(500).json({ success: false, error: '获取健康数据失败' });
  }
});

/**
 * POST /api/health/water
 * 记录喝水
 */
router.post('/water', (req: Request, res: Response<ApiResponse>) => {
  try {
    const userId = req.user!.userId;
    const { amount = 250 } = req.body;

    const id = uuidv4();
    db.prepare(`
      INSERT INTO health_records (id, user_id, type, value)
      VALUES (?, ?, 'water', ?)
    `).run(id, userId, amount);

    // 获取今日总量
    const result = db.prepare(`
      SELECT COALESCE(SUM(value), 0) as total
      FROM health_records
      WHERE user_id = ? AND type = 'water' AND date(recorded_at) = date('now')
    `).get(userId) as { total: number };

    // 获取目标
    const goals = db.prepare(`
      SELECT water_goal FROM health_goals WHERE user_id = ?
    `).get(userId) as { water_goal: number } || { water_goal: 2000 };

    res.json({
      success: true,
      data: {
        added: amount,
        current: result.total,
        goal: goals.water_goal,
        progress: Math.round((result.total / goals.water_goal) * 100)
      },
      message: `已记录 ${amount}ml 喝水`
    });
  } catch (error) {
    console.error('[Health] Water error:', error);
    res.status(500).json({ success: false, error: '记录失败' });
  }
});

/**
 * POST /api/health/calories
 * 记录热量
 */
router.post('/calories', (req: Request, res: Response<ApiResponse>) => {
  try {
    const userId = req.user!.userId;
    const { amount, item } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: '热量值必须大于0' });
    }

    const id = uuidv4();
    const metadata = item ? JSON.stringify({ item }) : null;

    db.prepare(`
      INSERT INTO health_records (id, user_id, type, value, metadata)
      VALUES (?, ?, 'calories', ?, ?)
    `).run(id, userId, amount, metadata);

    res.json({
      success: true,
      message: `已记录 ${amount}kcal${item ? ` (${item})` : ''}`
    });
  } catch (error) {
    console.error('[Health] Calories error:', error);
    res.status(500).json({ success: false, error: '记录失败' });
  }
});

/**
 * POST /api/health/sleep
 * 记录睡眠
 */
router.post('/sleep', (req: Request, res: Response<ApiResponse>) => {
  try {
    const userId = req.user!.userId;
    const { hours } = req.body;

    if (!hours || hours <= 0 || hours > 24) {
      return res.status(400).json({ success: false, error: '睡眠时长必须在0-24小时之间' });
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO health_records (id, user_id, type, value)
      VALUES (?, ?, 'sleep', ?)
    `).run(id, userId, hours);

    res.json({
      success: true,
      message: `已记录 ${hours}小时 睡眠`
    });
  } catch (error) {
    console.error('[Health] Sleep error:', error);
    res.status(500).json({ success: false, error: '记录失败' });
  }
});

/**
 * POST /api/health/exercise
 * 记录运动
 */
router.post('/exercise', (req: Request, res: Response<ApiResponse>) => {
  try {
    const userId = req.user!.userId;
    const { minutes, type: exerciseType } = req.body;

    if (!minutes || minutes <= 0) {
      return res.status(400).json({ success: false, error: '运动时长必须大于0' });
    }

    const id = uuidv4();
    const metadata = exerciseType ? JSON.stringify({ type: exerciseType }) : null;

    db.prepare(`
      INSERT INTO health_records (id, user_id, type, value, metadata)
      VALUES (?, ?, 'exercise', ?, ?)
    `).run(id, userId, minutes, metadata);

    res.json({
      success: true,
      message: `已记录 ${minutes}分钟${exerciseType ? ` ${exerciseType}` : ''} 运动`
    });
  } catch (error) {
    console.error('[Health] Exercise error:', error);
    res.status(500).json({ success: false, error: '记录失败' });
  }
});

/**
 * PUT /api/health/goals
 * 更新健康目标
 */
router.put('/goals', (req: Request, res: Response<ApiResponse<HealthGoals>>) => {
  try {
    const userId = req.user!.userId;
    const { waterGoal, caloriesGoal, sleepGoal, exerciseGoal } = req.body;

    db.prepare(`
      INSERT INTO health_goals (user_id, water_goal, calories_goal, sleep_goal, exercise_goal)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        water_goal = COALESCE(?, water_goal),
        calories_goal = COALESCE(?, calories_goal),
        sleep_goal = COALESCE(?, sleep_goal),
        exercise_goal = COALESCE(?, exercise_goal),
        updated_at = datetime('now')
    `).run(
      userId, waterGoal || 2000, caloriesGoal || 2000, sleepGoal || 8, exerciseGoal || 30,
      waterGoal, caloriesGoal, sleepGoal, exerciseGoal
    );

    const goals = db.prepare(`
      SELECT user_id as userId, water_goal as waterGoal, calories_goal as caloriesGoal,
             sleep_goal as sleepGoal, exercise_goal as exerciseGoal
      FROM health_goals WHERE user_id = ?
    `).get(userId) as HealthGoals;

    res.json({ success: true, data: goals, message: '目标已更新' });
  } catch (error) {
    console.error('[Health] Goals error:', error);
    res.status(500).json({ success: false, error: '更新目标失败' });
  }
});

export default router;
