/**
 * TTS 语音合成 API 路由
 */

import { Router, Request, Response } from 'express';
import { generateSpeech } from '../services/minimax';
import { authMiddleware } from '../middleware/auth';
import { ApiResponse } from '../types';

const router = Router();

// 所有路由都需要认证
router.use(authMiddleware); // JWT 认证

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

    console.log(`[TTS] 开始合成语音，文本长度: ${text.length}, 音色: ${voiceId || '默认'}`);
    
    const audioBuffer = await generateSpeech(text, voiceId);

    if (!audioBuffer) {
      console.error('[TTS] 语音合成失败 - 请检查后端日志中的 [MiniMax TTS] 错误信息');
      return res.status(500).json({
        success: false,
        error: '语音合成失败 - 请检查服务器日志确认 MINIMAX_API_KEY 是否配置正确'
      });
    }

    console.log(`[TTS] 语音合成成功，大小: ${(audioBuffer.byteLength / 1024).toFixed(2)} KB`);
    
    // 返回音频数据
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.byteLength.toString());
    res.send(Buffer.from(audioBuffer));

  } catch (error: any) {
    console.error('[TTS] Synthesize error:', error?.message || error);
    
    // 根据错误类型返回不同的错误信息
    let errorMessage = '语音合成失败';
    if (error?.message?.includes('API')) {
      errorMessage = 'MiniMax API 调用失败，请检查配置';
    } else if (error?.message?.includes('network')) {
      errorMessage = '网络连接失败';
    }
    
    res.status(500).json({ 
      success: false, 
      error: errorMessage 
    });
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
