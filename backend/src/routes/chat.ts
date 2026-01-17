/**
 * 对话 API 路由
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { authMiddleware } from '../middleware/auth';
import { generateChatResponse, generateFinalResponse, ToolCall } from '../services/minimax';
import { getWeatherForCity } from '../services/weather';
import {
  saveMessage,
  getSessionMessages,
  getRelevantMemories,
  saveMemory,
  createSession,
  getSessions,
  buildContext
} from '../services/memory';
import { ApiResponse, TodoItem, TodoCategory, HealthSummary, TarotResult, TarotCard } from '../types';

const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

// ==================== 塔罗牌数据 ====================

// 塔罗牌数据库 - 包含正位和逆位含义
const TAROT_CARDS_DB = [
  { name: "愚者 The Fool", upright: "新的开始、冒险、纯真、自由", reversed: "鲁莽、冒险过度、不成熟" },
  { name: "魔术师 The Magician", upright: "技能、创造力、意志力、自信", reversed: "欺骗、操纵、能力不足" },
  { name: "女祭司 The High Priestess", upright: "直觉、神秘、内在智慧", reversed: "隐藏的信息、不信任直觉" },
  { name: "皇后 The Empress", upright: "丰盛、美丽、母性、创造", reversed: "依赖、创造力受阻、过度保护" },
  { name: "皇帝 The Emperor", upright: "权威、结构、领导力、稳定", reversed: "专制、缺乏纪律、过于刚硬" },
  { name: "教皇 The Hierophant", upright: "传统、指导、信仰、教育", reversed: "打破常规、个人信念、叛逆" },
  { name: "恋人 The Lovers", upright: "爱情、和谐、选择、吸引", reversed: "不和谐、价值观冲突、犹豫不决" },
  { name: "战车 The Chariot", upright: "胜利、决心、控制、意志力", reversed: "缺乏方向、失控、攻击性" },
  { name: "力量 Strength", upright: "勇气、内在力量、耐心、同情", reversed: "自我怀疑、软弱、缺乏自信" },
  { name: "隐士 The Hermit", upright: "内省、寻求真理、智慧、指引", reversed: "孤立、逃避、拒绝帮助" },
  { name: "命运之轮 Wheel of Fortune", upright: "好运、命运、转折点、机遇", reversed: "厄运、抗拒改变、失去控制" },
  { name: "正义 Justice", upright: "公平、真相、因果、责任", reversed: "不公、逃避责任、偏见" },
  { name: "倒吊人 The Hanged Man", upright: "牺牲、新视角、等待、放手", reversed: "拖延、无谓牺牲、固执" },
  { name: "死神 Death", upright: "结束、转变、新生、蜕变", reversed: "抗拒改变、停滞、恐惧" },
  { name: "节制 Temperance", upright: "平衡、耐心、和谐、适度", reversed: "失衡、过度、缺乏耐心" },
  { name: "恶魔 The Devil", upright: "束缚、物质主义、诱惑、阴影", reversed: "解脱、恢复控制、觉醒" },
  { name: "塔 The Tower", upright: "突变、启示、觉醒、解放", reversed: "逃避灾难、恐惧改变、延迟" },
  { name: "星星 The Star", upright: "希望、灵感、宁静、信心", reversed: "失望、缺乏信心、悲观" },
  { name: "月亮 The Moon", upright: "直觉、潜意识、幻象、梦境", reversed: "困惑消散、面对恐惧、清醒" },
  { name: "太阳 The Sun", upright: "快乐、成功、活力、乐观", reversed: "暂时挫折、缺乏热情、过度乐观" },
  { name: "审判 Judgement", upright: "觉醒、重生、内在召唤、宽恕", reversed: "自我怀疑、逃避召唤、后悔" },
  { name: "世界 The World", upright: "完成、整合、成就、圆满", reversed: "不完整、缺乏closure、延迟" },
];

function drawTarotCards(): TarotResult {
  // 随机洗牌
  const shuffled = [...TAROT_CARDS_DB].sort(() => Math.random() - 0.5);
  const positions = ['过去', '现在', '未来'];
  
  // 抽取3张牌，随机正位/逆位
  const cards: TarotCard[] = shuffled.slice(0, 3).map((card, index) => {
    const isReversed = Math.random() > 0.6; // 40% 概率逆位
    return {
      name: card.name,
      position: positions[index],
      meaning: isReversed ? card.reversed : card.upright,
      orientation: isReversed ? 'reversed' : 'upright'
    };
  });

  // 生成解读
  const analysis = cards.map(c => 
    `${c.position}位置的「${c.name}」(${c.orientation === 'upright' ? '正位' : '逆位'})：${c.meaning}`
  ).join(' ');

  // 根据牌面生成建议
  const hasReversed = cards.some(c => c.orientation === 'reversed');
  const advice = hasReversed 
    ? "牌面显示可能会遇到一些挑战，但这也是成长的机会。保持耐心，相信自己的力量。"
    : "整体运势不错，继续保持积极的心态，好运会眷顾你的！";

  return {
    type: 'tarot',
    cards,
    analysis,
    advice
  };
}

// ==================== 辅助函数 ====================

function getUserTodos(userId: string): TodoItem[] {
  return db.prepare(`
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
    WHERE t.user_id = ? AND t.completed = 0
    ORDER BY 
      CASE 
        WHEN t.deadline IS NOT NULL AND t.deadline < datetime('now') THEN 0
        WHEN t.deadline IS NOT NULL THEN 1
        ELSE 2
      END,
      CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END,
      t.deadline ASC,
      t.created_at DESC
    LIMIT 10
  `).all(userId) as TodoItem[];
}

function getUserCategories(userId: string): TodoCategory[] {
  return db.prepare(`
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
}

function getUserHealthSummary(userId: string): HealthSummary {
  // 获取健康目标
  const goals = db.prepare(`
    SELECT water_goal, calories_goal, sleep_goal, exercise_goal
    FROM health_goals WHERE user_id = ?
  `).get(userId) as any || { water_goal: 2000, calories_goal: 2000, sleep_goal: 8, exercise_goal: 30 };

  // 获取今日数据
  const today = new Date().toISOString().split('T')[0];
  
  const getToday = (type: string) => {
    const result = db.prepare(`
      SELECT COALESCE(SUM(value), 0) as total
      FROM health_records
      WHERE user_id = ? AND type = ? AND date(recorded_at) = date('now')
    `).get(userId, type) as { total: number };
    return result.total;
  };

  // 获取昨晚睡眠
  const sleepRecord = db.prepare(`
    SELECT value
    FROM health_records
    WHERE user_id = ? AND type = 'sleep'
    ORDER BY recorded_at DESC LIMIT 1
  `).get(userId) as { value: number } | undefined;

  return {
    water: { current: getToday('water'), goal: goals.water_goal, history: [] },
    calories: { 
      current: getToday('calories'), 
      goal: goals.calories_goal, 
      macros: { protein: 0, carbs: 0, fat: 0 },
      history: [] 
    },
    sleep: { current: sleepRecord?.value || 0, goal: goals.sleep_goal, history: [] },
    exercise: { current: getToday('exercise'), goal: goals.exercise_goal, history: [] }
  };
}

// ==================== 路由 ====================

/**
 * POST /api/chat/message
 * 发送消息并获取 AI 回复
 */
router.post('/message', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const userId = req.user!.userId;
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: '消息内容不能为空' });
    }

    // 获取或创建会话
    let activeSessionId = sessionId;
    if (!activeSessionId) {
      const sessions = getSessions(userId, 1);
      if (sessions.length > 0) {
        activeSessionId = sessions[0].id;
      } else {
        const newSession = createSession(userId);
        activeSessionId = newSession.id;
      }
    }

    // 保存用户消息
    saveMessage(userId, activeSessionId, 'user', message);

    // 获取用户名
    const user = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as { name: string };

    // 构建上下文
    const { history, memories } = buildContext(userId);
    const todos = getUserTodos(userId);
    const categories = getUserCategories(userId);
    const healthData = getUserHealthSummary(userId);

    // 生成 AI 回复
    const response = await generateChatResponse(
      history,
      message,
      {
        userName: user.name,
        todos,
        categories,
        healthData,
        memories
      }
    );

    // 处理工具调用
    const toolResults: { name: string; result: any }[] = [];
    const actions: { type: string; data: any }[] = [];

    for (const toolCall of response.toolCalls) {
      const result = await executeToolCall(userId, toolCall, healthData);
      toolResults.push({ name: toolCall.name, result: result.data });
      if (result.action) {
        actions.push(result.action);
      }
    }

    // 如果有工具调用，生成最终回复
    let finalContent = response.content;
    if (toolResults.length > 0) {
      finalContent = await generateFinalResponse(
        history,
        toolResults,
        { userName: user.name, todos, categories, healthData, memories }
      );
    }

    // 保存 AI 回复
    saveMessage(userId, activeSessionId, 'assistant', finalContent);

    // 尝试从对话中提取记忆
    // extractMemoriesFromMessage(userId, message, 'user');

    res.json({
      success: true,
      data: {
        content: finalContent,
        sessionId: activeSessionId,
        actions
      }
    });

  } catch (error) {
    console.error('[Chat] Message error:', error);
    res.status(500).json({ success: false, error: '消息处理失败' });
  }
});

/**
 * 执行工具调用
 */
async function executeToolCall(
  userId: string,
  toolCall: ToolCall,
  currentHealth: HealthSummary
): Promise<{ data: any; action?: { type: string; data: any } }> {
  const { name, arguments: args } = toolCall;

  switch (name) {
    case 'addTodo': {
      const id = uuidv4();
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO todos (id, user_id, text, priority, category_id, deadline, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, userId, args.item, args.priority || 'medium', args.categoryId, args.deadline, now, now);
      
      // 获取分类名称用于提示
      let categoryName = '';
      if (args.categoryId) {
        const category = db.prepare('SELECT name FROM todo_categories WHERE id = ?').get(args.categoryId) as { name: string } | undefined;
        categoryName = category ? ` [${category.name}]` : '';
      }
      
      return {
        data: { success: true, message: `待办「${args.item}」已添加${categoryName}${args.deadline ? `，截止时间：${new Date(args.deadline).toLocaleString('zh-CN')}` : ''}` },
        action: { type: 'openPanel', data: 'todo' }
      };
    }

    case 'toggleTodo': {
      const todo = db.prepare(`
        SELECT id FROM todos WHERE user_id = ? AND text LIKE ?
      `).get(userId, `%${args.text}%`) as { id: string } | undefined;
      
      if (todo) {
        db.prepare('UPDATE todos SET completed = 1 - completed WHERE id = ?').run(todo.id);
        return {
          data: { success: true, message: `已切换「${args.text}」的完成状态` },
          action: { type: 'openPanel', data: 'todo' }
        };
      }
      return { data: { success: false, message: `没找到包含「${args.text}」的待办` } };
    }

    case 'deleteTodo': {
      const result = db.prepare(`
        DELETE FROM todos WHERE user_id = ? AND text LIKE ?
      `).run(userId, `%${args.text}%`);
      return {
        data: result.changes > 0
          ? { success: true, message: `已删除「${args.text}」` }
          : { success: false, message: `没找到包含「${args.text}」的待办` },
        action: result.changes > 0 ? { type: 'openPanel', data: 'todo' } : undefined
      };
    }

    case 'getWeather': {
      const weather = await getWeatherForCity(args.city);
      if (weather) {
        return {
          data: { success: true, ...weather },
          action: { type: 'setWeather', data: weather }
        };
      }
      return { data: { success: false, error: `找不到城市「${args.city}」` } };
    }

    case 'addWater': {
      const amount = args.amount || 250;
      const id = uuidv4();
      db.prepare(`
        INSERT INTO health_records (id, user_id, type, value)
        VALUES (?, ?, 'water', ?)
      `).run(id, userId, amount);

      const newTotal = currentHealth.water.current + amount;
      return {
        data: {
          success: true,
          added: amount,
          current: newTotal,
          goal: currentHealth.water.goal,
          progress: Math.round((newTotal / currentHealth.water.goal) * 100)
        },
        action: { type: 'updateHealth', data: { water: { current: newTotal } } }
      };
    }

    case 'getHealthStatus': {
      return {
        data: {
          water: `${currentHealth.water.current}/${currentHealth.water.goal}ml`,
          calories: `${currentHealth.calories.current}/${currentHealth.calories.goal}kcal`,
          sleep: `${currentHealth.sleep.current}/${currentHealth.sleep.goal}小时`,
          exercise: `${currentHealth.exercise.current}/${currentHealth.exercise.goal}分钟`
        },
        action: { type: 'openPanel', data: 'health' }
      };
    }

    case 'drawTarot': {
      const result = drawTarotCards();
      return {
        data: {
          success: true,
          question: args.question || '今日运势',
          cards: result.cards.map(c => `${c.name}(${c.orientation === 'upright' ? '正位' : '逆位'})`).join('、'),
          briefAnalysis: result.analysis.slice(0, 100) + '...'
        },
        action: { type: 'setTarot', data: result }
      };
    }

    case 'openPanel': {
      return {
        data: { success: true, panel: args.panel },
        action: { type: 'openPanel', data: args.panel }
      };
    }

    case 'saveMemory': {
      const memory = saveMemory(userId, args.content, args.type, args.importance || 5);
      return { data: { success: true, memoryId: memory.id } };
    }

    default:
      return { data: { error: `未知工具: ${name}` } };
  }
}

/**
 * GET /api/chat/history
 * 获取对话历史
 */
router.get('/history', (req: Request, res: Response<ApiResponse>) => {
  try {
    const userId = req.user!.userId;
    const sessionId = req.query.sessionId as string;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!sessionId) {
      return res.status(400).json({ success: false, error: '缺少 sessionId' });
    }

    const messages = getSessionMessages(sessionId, limit);

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('[Chat] History error:', error);
    res.status(500).json({ success: false, error: '获取历史失败' });
  }
});

/**
 * GET /api/chat/sessions
 * 获取会话列表
 */
router.get('/sessions', (req: Request, res: Response<ApiResponse>) => {
  try {
    const userId = req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 10;

    const sessions = getSessions(userId, limit);

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('[Chat] Sessions error:', error);
    res.status(500).json({ success: false, error: '获取会话列表失败' });
  }
});

/**
 * POST /api/chat/sessions
 * 创建新会话
 */
router.post('/sessions', (req: Request, res: Response<ApiResponse>) => {
  try {
    const userId = req.user!.userId;
    const { title } = req.body;

    const session = createSession(userId, title);

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('[Chat] Create session error:', error);
    res.status(500).json({ success: false, error: '创建会话失败' });
  }
});

export default router;
