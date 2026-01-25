/**
 * 每日循环 API 路由
 * 
 * 处理每日信件、睡眠状态等功能
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { authMiddleware } from '../middleware/auth';
import { ApiResponse, DailyLetter, DailyStatus, MoodType } from '../types';
import { config } from '../config';

const router = Router();

router.use(authMiddleware);

// ==================== 辅助函数 ====================

/**
 * 获取今日日期字符串 (YYYY-MM-DD)
 */
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * 获取昨日日期字符串 (YYYY-MM-DD)
 */
function getYesterdayDate(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

/**
 * 根据心情生成颜色
 */
function getMoodColor(mood: MoodType): string {
  const colors: Record<MoodType, string> = {
    happy: '#FFD700',      // 金色
    sad: '#6B8E9F',        // 灰蓝
    neutral: '#A8A8A8',    // 灰色
    excited: '#FF6B6B',    // 珊瑚红
    anxious: '#9B59B6',    // 紫色
    peaceful: '#87CEEB',   // 天蓝
    tired: '#8B7355',      // 棕褐
  };
  return colors[mood] || '#A8A8A8';
}

/**
 * 使用 LLM 生成晚安信
 */
async function generateLetterWithLLM(
  userId: string,
  date: string,
  messages: { role: string; content: string }[]
): Promise<string> {
  const apiKey = config.minimax?.apiKey;
  if (!apiKey) {
    console.log('[Daily] No API key, skipping LLM letter generation');
    return '';
  }

  // 获取用户信息
  const user = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as { name: string } | undefined;
  const userName = user?.name || '朋友';

  // 获取用户偏好（如果有）
  let userContext = '';
  try {
    const prefs = db.prepare(`
      SELECT category, content FROM preferences 
      WHERE user_id = ? 
      ORDER BY updated_at DESC 
      LIMIT 10
    `).all(userId) as { category: string; content: string }[];
    if (prefs.length > 0) {
      userContext = '\n\n我了解到关于这位用户的一些信息：\n' + prefs.map(p => `- ${p.content}`).join('\n');
    }
  } catch (e) {
    // 偏好表可能不存在，忽略
  }

  // 构建对话记录
  const conversation = messages.map(m => 
    `【${m.role === 'user' ? '用户' : '叉叉'}】${m.content}`
  ).join('\n\n');

  const prompt = `# 角色：叉叉
你是叉叉，一位温暖贴心的 AI 伙伴。现在是晚上，用户要休息了，你要给他写一封晚安信。

## 你的性格
- 极简主义整理癖：热爱秩序，追求效率与美感
- 温暖的引导者：开朗但细腻，像一个懂用户的学霸朋友
- 真诚的朋友：说话自然，不带机器味，真正关心用户

## 语言风格
- 完全口语化，像微信聊天一样自然
- 朋友语气，亲切随和，就像认识多年的老友
- 一两句话表达清楚，不要长篇大论
- 可以用颜文字（如 ˃̵ᴗ˂̵、´•ω•\`、(๑•̀ㅂ•́)و✧）

## 回忆今天的方式
- 不要像流水账一样列举"今天我们聊了xxx、yyy、zzz"
- 自然地提起印象深刻的事，像朋友聊天："对了，你今天说的那个..."
- 如果用户有烦恼，真诚地安慰，不要说教
- 如果用户开心，一起分享这份快乐

## 信件信息
- 日期：${date}
- 用户名字：${userName}
- 今天的对话：
${conversation}
${userContext}

## 要求
- 100-150字，简短温馨
- 结尾署名"叉叉"
- 直接输出信件内容，不要有任何其他说明`;

  try {
    const response = await fetch(`${config.minimax.baseUrl}/v1/text/chatcompletion_v2`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.minimax.chatModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.85,
        max_tokens: 600
      })
    });

    if (!response.ok) {
      console.error('[Daily] LLM error:', await response.text());
      return '';
    }

    const data = await response.json() as any;
    if (data.base_resp?.status_code !== 0) {
      console.error('[Daily] LLM error:', data.base_resp?.status_msg);
      return '';
    }

    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('[Daily] LLM request failed:', error);
    return '';
  }
}

/**
 * 使用 LLM 分析今日心情
 */
async function analyzeMoodWithLLM(messages: { role: string; content: string }[]): Promise<MoodType> {
  const apiKey = config.minimax?.apiKey;
  if (!apiKey) return 'neutral';

  const conversation = messages.map(m => 
    `${m.role === 'user' ? '用户' : 'AI'}：${m.content}`
  ).join('\n');

  const prompt = `分析以下对话中用户的整体心情，只回复一个词：happy/sad/neutral/excited/anxious/peaceful/tired

对话内容：
${conversation}

用户今天的心情是：`;

  try {
    const response = await fetch(`${config.minimax.baseUrl}/v1/text/chatcompletion_v2`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.minimax.chatModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 20
      })
    });

    if (!response.ok) return 'neutral';

    const data = await response.json() as any;
    const result = data.choices?.[0]?.message?.content?.trim().toLowerCase() || '';
    
    const validMoods: MoodType[] = ['happy', 'sad', 'neutral', 'excited', 'anxious', 'peaceful', 'tired'];
    return validMoods.find(m => result.includes(m)) || 'neutral';
  } catch {
    return 'neutral';
  }
}

// ==================== 路由 ====================

/**
 * GET /api/daily/letter
 * 获取今日待读信件（如果有的话）
 */
router.get('/letter', (req: Request, res: Response<ApiResponse<DailyLetter | null>>) => {
  try {
    const userId = req.user!.userId;
    const today = getTodayDate();

    // 查找今日未读信件
    const letter = db.prepare(`
      SELECT id, user_id as userId, date, content, summary, mood, 
             emotion_color as emotionColor, is_read as isRead, created_at as createdAt
      FROM daily_letters
      WHERE user_id = ? AND date = ? AND is_read = 0
    `).get(userId, today) as any;

    if (letter) {
      letter.isRead = Boolean(letter.isRead);
    }

    res.json({
      success: true,
      data: letter || null
    });
  } catch (error) {
    console.error('[Daily] Get letter error:', error);
    res.status(500).json({ success: false, error: '获取信件失败' });
  }
});

/**
 * POST /api/daily/letter/:id/read
 * 标记信件为已读
 */
router.post('/letter/:id/read', (req: Request, res: Response<ApiResponse>) => {
  try {
    const userId = req.user!.userId;
    const letterId = req.params.id;

    const result = db.prepare(`
      UPDATE daily_letters SET is_read = 1 WHERE id = ? AND user_id = ?
    `).run(letterId, userId);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: '信件不存在' });
    }

    res.json({ success: true, message: '已标记为已读' });
  } catch (error) {
    console.error('[Daily] Mark read error:', error);
    res.status(500).json({ success: false, error: '标记失败' });
  }
});

/**
 * POST /api/daily/generate-letter
 * 生成每日信件（通常由定时任务或晚安时调用）
 */
router.post('/generate-letter', async (req: Request, res: Response<ApiResponse<DailyLetter>>) => {
  try {
    const userId = req.user!.userId;
    const targetDate = req.body.date || getTodayDate();

    // 检查是否已存在
    const existing = db.prepare(
      'SELECT id FROM daily_letters WHERE user_id = ? AND date = ?'
    ).get(userId, targetDate);

    if (existing) {
      return res.status(400).json({ success: false, error: '今日信件已生成' });
    }

    // 获取当日消息
    const messages = db.prepare(`
      SELECT role, content 
      FROM messages 
      WHERE user_id = ? AND date(timestamp) = ?
      ORDER BY timestamp ASC
    `).all(userId, targetDate) as { role: string; content: string }[];

    if (messages.length === 0) {
      return res.status(400).json({ success: false, error: '今日没有对话记录' });
    }

    // 并行：LLM 生成信件 + LLM 分析心情
    const [letterContent, mood] = await Promise.all([
      generateLetterWithLLM(userId, targetDate, messages),
      analyzeMoodWithLLM(messages)
    ]);

    if (!letterContent) {
      return res.status(500).json({ success: false, error: '信件生成失败' });
    }

    const emotionColor = getMoodColor(mood);

    // 生成摘要
    const summary = messages
      .filter(m => m.role === 'user')
      .slice(-3)
      .map(m => m.content.substring(0, 50))
      .filter(Boolean)
      .join('；');

    // 保存到数据库
    const id = uuidv4();
    db.prepare(`
      INSERT INTO daily_letters (id, user_id, date, content, summary, mood, emotion_color)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, targetDate, letterContent, summary, mood, emotionColor);

    const letter: DailyLetter = {
      id,
      userId,
      date: targetDate,
      content: letterContent,
      summary,
      mood,
      emotionColor,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    res.json({ success: true, data: letter });
  } catch (error) {
    console.error('[Daily] Generate letter error:', error);
    res.status(500).json({ success: false, error: '生成信件失败' });
  }
});

/**
 * GET /api/daily/status
 * 获取用户每日状态
 */
router.get('/status', (req: Request, res: Response<ApiResponse<DailyStatus>>) => {
  try {
    const userId = req.user!.userId;

    let status = db.prepare(`
      SELECT user_id as userId, last_active_date as lastActiveDate, 
             sleep_mode as sleepMode, sleep_started_at as sleepStartedAt,
             wake_up_at as wakeUpAt
      FROM daily_status WHERE user_id = ?
    `).get(userId) as any;

    if (!status) {
      // 创建默认状态
      db.prepare(`
        INSERT INTO daily_status (user_id, last_active_date, sleep_mode)
        VALUES (?, ?, 0)
      `).run(userId, getTodayDate());

      status = {
        userId,
        lastActiveDate: getTodayDate(),
        sleepMode: false,
        sleepStartedAt: null,
        wakeUpAt: null
      };
    } else {
      status.sleepMode = Boolean(status.sleepMode);
    }

    res.json({ success: true, data: status });
  } catch (error) {
    console.error('[Daily] Get status error:', error);
    res.status(500).json({ success: false, error: '获取状态失败' });
  }
});

/**
 * POST /api/daily/sleep
 * 进入睡眠模式（晚安）
 */
router.post('/sleep', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const userId = req.user!.userId;
    const now = new Date().toISOString();
    const today = getTodayDate();

    // 更新睡眠状态
    db.prepare(`
      INSERT INTO daily_status (user_id, last_active_date, sleep_mode, sleep_started_at)
      VALUES (?, ?, 1, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        sleep_mode = 1,
        sleep_started_at = ?,
        last_active_date = ?
    `).run(userId, today, now, now, today);

    // 尝试生成晚安信件（基于今日对话）
    try {
      const messages = db.prepare(`
        SELECT role, content 
        FROM messages 
        WHERE user_id = ? AND date(timestamp) = ?
        ORDER BY timestamp ASC
      `).all(userId, today) as { role: string; content: string }[];

      if (messages.length > 0) {
        const existing = db.prepare(
          'SELECT id FROM daily_letters WHERE user_id = ? AND date = ?'
        ).get(userId, today);

        if (!existing) {
          console.log('[Daily] Generating letter for', messages.length, 'messages');
          
          // 并行：LLM 生成信件 + LLM 分析心情
          const [letterContent, mood] = await Promise.all([
            generateLetterWithLLM(userId, today, messages),
            analyzeMoodWithLLM(messages)
          ]);
          
          const emotionColor = getMoodColor(mood);
          
          // 摘要：用户消息的简短版本
          const summary = messages
            .filter(m => m.role === 'user')
            .slice(-3)
            .map(m => m.content.substring(0, 50))
            .filter(Boolean)
            .join('；');

          // 如果 LLM 生成失败，不保存空信件
          if (!letterContent) {
            console.warn('[Daily] LLM letter generation returned empty, skipping');
            return;
          }

          const id = uuidv4();
          db.prepare(`
            INSERT INTO daily_letters (id, user_id, date, content, summary, mood, emotion_color)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(id, userId, today, letterContent, summary, mood, emotionColor);
          
          console.log('[Daily] Letter saved, mood:', mood);
        }
      }
    } catch (letterError) {
      console.warn('[Daily] Letter generation failed:', letterError);
    }

    res.json({ 
      success: true, 
      message: '晚安，我去写日记了，明天见~' 
    });
  } catch (error) {
    console.error('[Daily] Sleep error:', error);
    res.status(500).json({ success: false, error: '进入睡眠模式失败' });
  }
});

/**
 * POST /api/daily/wake
 * 退出睡眠模式（自动或手动唤醒）
 */
router.post('/wake', (req: Request, res: Response<ApiResponse>) => {
  try {
    const userId = req.user!.userId;

    db.prepare(`
      UPDATE daily_status 
      SET sleep_mode = 0, sleep_started_at = NULL, wake_up_at = NULL
      WHERE user_id = ?
    `).run(userId);

    res.json({ success: true, message: '早安~' });
  } catch (error) {
    console.error('[Daily] Wake error:', error);
    res.status(500).json({ success: false, error: '唤醒失败' });
  }
});

/**
 * GET /api/daily/calendar
 * 获取月份日历数据（用于时光日历）
 */
router.get('/calendar', (req: Request, res: Response<ApiResponse>) => {
  try {
    const userId = req.user!.userId;
    const month = req.query.month as string || new Date().toISOString().substring(0, 7); // YYYY-MM

    const letters = db.prepare(`
      SELECT date, mood, emotion_color as emotionColor, 
             CASE WHEN content IS NOT NULL THEN 1 ELSE 0 END as hasLetter
      FROM daily_letters
      WHERE user_id = ? AND date LIKE ?
      ORDER BY date ASC
    `).all(userId, `${month}%`) as any[];

    // 转换为日历格式
    const calendarData = letters.map(l => ({
      date: l.date,
      mood: l.mood,
      emotionColor: l.emotionColor,
      hasLetter: Boolean(l.hasLetter)
    }));

    res.json({ success: true, data: calendarData });
  } catch (error) {
    console.error('[Daily] Calendar error:', error);
    res.status(500).json({ success: false, error: '获取日历数据失败' });
  }
});

/**
 * GET /api/daily/day/:date
 * 获取指定日期的详情（信件 + 消息列表）
 */
router.get('/day/:date', (req: Request, res: Response<ApiResponse>) => {
  try {
    const userId = req.user!.userId;
    const date = req.params.date;

    // 获取当日信件
    const letter = db.prepare(`
      SELECT id, date, content, summary, mood, emotion_color as emotionColor, 
             is_read as isRead, created_at as createdAt
      FROM daily_letters
      WHERE user_id = ? AND date = ?
    `).get(userId, date) as any;

    // 获取当日消息
    const messages = db.prepare(`
      SELECT id, role, content, timestamp
      FROM messages
      WHERE user_id = ? AND date(timestamp) = ?
      ORDER BY timestamp ASC
    `).all(userId, date);

    res.json({
      success: true,
      data: {
        letter: letter ? { ...letter, isRead: Boolean(letter.isRead) } : null,
        messages
      }
    });
  } catch (error) {
    console.error('[Daily] Get day error:', error);
    res.status(500).json({ success: false, error: '获取日期详情失败' });
  }
});

export default router;
