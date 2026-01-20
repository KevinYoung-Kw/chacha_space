/**
 * 情绪检测 API 路由
 * 使用 MiniMax AI 根据用户输入内容智能选择合适的动画播放
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { ApiResponse } from '../types';
import { config } from '../config';

const router = Router();

// 所有路由都需要认证
router.use(authMiddleware); // JWT 认证

// ==================== 可用动画列表 ====================

/**
 * 所有可用的动画动作
 * 与前端 characterStateMachine.ts 中的 actionMap 对应
 */
const AVAILABLE_ACTIONS = {
  // 待机相关
  idle: { description: '默认待机', emotion: 'neutral' },
  idle_alt: { description: '备选待机', emotion: 'neutral' },
  idle_1: { description: '待机动作1', emotion: 'neutral' },
  idle_3: { description: '待机动作3', emotion: 'neutral' },
  
  // 正面情绪
  happy: { description: '开心/增加好感度', emotion: 'positive' },
  excited: { description: '激动/兴奋', emotion: 'positive' },
  jump: { description: '跳跃/欢快', emotion: 'positive' },
  
  // 负面情绪
  crying: { description: '哭泣/悲伤', emotion: 'negative' },
  shy: { description: '害羞/尴尬', emotion: 'negative' },
  scared: { description: '害怕/紧张', emotion: 'negative' },
  angry: { description: '生气', emotion: 'negative' },
  angry_cross: { description: '插手生气', emotion: 'negative' },
  rage: { description: '无能狂怒', emotion: 'negative' },
  disapprove: { description: '不认可/拒绝', emotion: 'negative' },
  shouting: { description: '大声喊话', emotion: 'negative' },
  
  // 活动状态
  sleeping: { description: '睡觉/休息', emotion: 'neutral' },
  listening: { description: '听音乐', emotion: 'positive' },
  listening_v2: { description: '倾听', emotion: 'neutral' },
  singing: { description: '唱歌', emotion: 'positive' },
  phone: { description: '玩手机', emotion: 'neutral' },
  check_phone: { description: '查手机', emotion: 'neutral' },
  notes: { description: '记笔记', emotion: 'neutral' },
  
  // 交互动作
  speaking: { description: '说话', emotion: 'neutral' },
  thinking: { description: '思考', emotion: 'neutral' },
  wave: { description: '挥手', emotion: 'positive' },
  nod: { description: '点头', emotion: 'positive' },
} as const;

type ActionName = keyof typeof AVAILABLE_ACTIONS;

// MiniMax API 响应类型
interface MinimaxResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

// ==================== AI 情绪检测 ====================

/**
 * 使用 MiniMax AI 检测用户输入的情绪并推荐动画
 */
async function detectEmotionWithAI(userMessage: string): Promise<ActionName> {
  try {
    const apiKey = config.minimax.apiKey;
    const groupId = config.minimax.groupId;

    if (!apiKey || !groupId) {
      console.warn('[Emotion] MiniMax API not configured, using fallback');
      return fallbackEmotionDetection(userMessage);
    }

    // 构建动画列表描述
    const actionsList = Object.entries(AVAILABLE_ACTIONS)
      .map(([name, info]) => `- ${name}: ${info.description} (${info.emotion})`)
      .join('\n');

    // 系统提示词：让 AI 分析用户情绪并选择动画
    const systemPrompt = `你是一个情绪分析助手。根据用户的输入，分析其情绪状态，然后从以下动画列表中选择最合适的一个动画名称。

可用动画列表：
${actionsList}

要求：
1. 仔细分析用户输入的情绪色彩（正面/负面/中性）
2. 从动画列表中选择最贴合用户情绪的动画
3. 只返回动画名称，不要任何解释，例如：happy 或 crying
4. 如果用户在问问题，返回 listening_v2
5. 如果用户在打招呼，返回 wave
6. 如果情绪不明显，返回 speaking`;

    const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'abab6.5s-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.3, // 降低随机性，提高准确性
        max_tokens: 20,   // 只需要返回动画名称
      }),
    });

    if (!response.ok) {
      console.error('[Emotion] MiniMax API error:', response.status);
      return fallbackEmotionDetection(userMessage);
    }

    const data = await response.json() as MinimaxResponse;
    const aiResponse = data.choices?.[0]?.message?.content?.trim() || '';
    
    // 提取动画名称（AI 可能返回带解释的文本，需要提取）
    const actionName = extractActionName(aiResponse);
    
    // 验证返回的动画名称是否有效
    if (actionName && actionName in AVAILABLE_ACTIONS) {
      console.log(`[Emotion] AI detected: ${actionName} from message: "${userMessage}"`);
      return actionName as ActionName;
    }

    console.warn('[Emotion] AI returned invalid action:', aiResponse);
    return fallbackEmotionDetection(userMessage);

  } catch (error) {
    console.error('[Emotion] AI detection error:', error);
    return fallbackEmotionDetection(userMessage);
  }
}

/**
 * 从 AI 返回的文本中提取动画名称
 */
function extractActionName(text: string): string {
  const lowerText = text.toLowerCase().trim();
  
  // 尝试匹配所有可用的动画名称
  for (const actionName of Object.keys(AVAILABLE_ACTIONS)) {
    if (lowerText.includes(actionName)) {
      return actionName;
    }
  }
  
  return lowerText;
}

/**
 * 简单的回退检测（当 AI 不可用时使用）
 */
function fallbackEmotionDetection(text: string): ActionName {
  const lowerText = text.toLowerCase();
  
  // 简单的规则匹配
  if (text.endsWith('?') || text.endsWith('？')) return 'listening_v2';
  if (text.endsWith('!') || text.endsWith('！')) return 'excited';
  if (lowerText.includes('开心') || lowerText.includes('高兴')) return 'happy';
  if (lowerText.includes('难过') || lowerText.includes('伤心')) return 'crying';
  if (lowerText.includes('生气') || lowerText.includes('愤怒')) return 'angry';
  if (lowerText.includes('害怕') || lowerText.includes('紧张')) return 'scared';
  if (lowerText.includes('害羞') || lowerText.includes('尴尬')) return 'shy';
  if (lowerText.includes('你好') || lowerText.includes('嗨')) return 'wave';
  if (lowerText.includes('睡觉') || lowerText.includes('困')) return 'sleeping';
  if (lowerText.includes('唱歌')) return 'singing';
  
  // 默认返回 speaking
  return 'speaking';
}

// ==================== API 路由 ====================

/**
 * POST /api/emotion/detect
 * 使用 AI 检测用户输入的情绪并返回推荐的动画
 */
router.post('/detect', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: '消息内容不能为空' 
      });
    }

    // 使用 AI 检测情绪
    const detectedAction = await detectEmotionWithAI(message);
    const actionInfo = AVAILABLE_ACTIONS[detectedAction];

    res.json({
      success: true,
      data: {
        action: detectedAction,
        description: actionInfo.description,
        emotion: actionInfo.emotion,
        confidence: 'high'
      }
    });

  } catch (error) {
    console.error('[Emotion] Detection error:', error);
    res.status(500).json({ 
      success: false, 
      error: '情绪检测失败' 
    });
  }
});

/**
 * GET /api/emotion/actions
 * 获取所有可用的动画列表
 */
router.get('/actions', (_req: Request, res: Response<ApiResponse>) => {
  const actions = Object.entries(AVAILABLE_ACTIONS).map(([name, info]) => ({
    name,
    ...info
  }));
  
  res.json({
    success: true,
    data: actions
  });
});

export default router;
