/**
 * TTS 语音合成 API 路由
 */

import { Router, Request, Response } from 'express';
import { generateSpeech } from '../services/minimax';
import { authMiddleware } from '../middleware/auth';
import { ApiResponse } from '../types';

const router = Router();

// 移除认证中间件，允许任何人访问
// router.use(authMiddleware);

/**
 * POST /api/tts/synthesize
 * 合成语音
 */
router.post('/synthesize', async (req: Request, res: Response) => {
  try {
    const { text, voiceId } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: '文本内容不能为空'
      });
    }

    // 限制文本长度
    if (text.length > 2000) {
      return res.status(400).json({
        success: false,
        error: '文本长度不能超过2000字符'
      });
    }

    const audioBuffer = await generateSpeech(text, voiceId);

    if (!audioBuffer) {
      return res.status(500).json({
        success: false,
        error: '语音合成失败'
      });
    }

    // 返回音频数据
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.byteLength.toString());
    res.send(Buffer.from(audioBuffer));

  } catch (error) {
    console.error('[TTS] Synthesize error:', error);
    res.status(500).json({ success: false, error: '语音合成失败' });
  }
});

/**
 * GET /api/tts/voices
 * 获取可用的声音列表
 */
router.get('/voices', (req: Request, res: Response<ApiResponse>) => {
  // MiniMax 预设声音列表
  const voices = [
    { id: 'female-shaonv', name: '少女音', category: 'preset', language: 'zh' },
    { id: 'female-yujie', name: '御姐音', category: 'preset', language: 'zh' },
    { id: 'female-chengshu', name: '成熟女声', category: 'preset', language: 'zh' },
    { id: 'female-tianmei', name: '甜美女声', category: 'preset', language: 'zh' },
    { id: 'male-qingnian', name: '青年男声', category: 'preset', language: 'zh' },
    { id: 'male-jingying', name: '精英男声', category: 'preset', language: 'zh' },
    { id: 'male-badao', name: '霸道男声', category: 'preset', language: 'zh' },
    { id: 'male-qingsong', name: '轻松男声', category: 'preset', language: 'zh' },
  ];

  res.json({ success: true, data: voices });
});

export default router;
