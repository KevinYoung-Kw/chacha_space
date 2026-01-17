import express, { Request, Response } from 'express';
import multer from 'multer';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { optionalAuthMiddleware } from '../middleware/auth';
import { config } from '../config';

const router = express.Router();

// 配置文件上传（存储在内存中）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// 阶跃星辰语音识别（使用可选认证，允许未登录用户使用）
router.post('/speech-to-text', optionalAuthMiddleware, upload.single('audio'), async (req: Request, res: Response) => {
  try {
    console.log('[STT] 收到语音识别请求');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '未接收到音频文件'
      });
    }

    const apiKey = process.env.STEPFUN_API_KEY || config.stepfun?.apiKey;
    if (!apiKey) {
      console.error('[STT] 未配置 STEPFUN_API_KEY');
      return res.status(500).json({
        success: false,
        error: '服务配置错误'
      });
    }

    console.log('[STT] 音频大小:', (req.file.size / 1024).toFixed(2), 'KB');
    console.log('[STT] 音频类型:', req.file.mimetype);

    // 创建 FormData
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: 'audio.webm',
      contentType: req.file.mimetype,
    });
    formData.append('model', 'step-asr');

    console.log('[STT] 发送到阶跃星辰 API...');

    // 调用阶跃星辰语音转写 API
    const response = await fetch('https://api.stepfun.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        ...formData.getHeaders(),
      },
      body: formData as any,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[STT] API 错误:', response.status, errorText);
      throw new Error(`API 返回错误: ${response.status}`);
    }

    const data = await response.json() as { text?: string };
    console.log('[STT] 识别成功:', data.text);

    res.json({
      success: true,
      text: data.text || ''
    });
  } catch (error: any) {
    console.error('[STT] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || '语音识别失败'
    });
  }
});

export default router;
