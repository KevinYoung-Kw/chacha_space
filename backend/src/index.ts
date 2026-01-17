/**
 * 叉叉 AI 助手后端服务
 * 
 * 启动命令:
 *   开发模式: npm run dev
 *   生产模式: npm run build && npm start
 */

import express from 'express';
import cors from 'cors';
import { config } from './config';
import { initDatabase } from './database/db';

// 导入路由
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat';
import todoRoutes from './routes/todo';
import categoryRoutes from './routes/category';
import healthRoutes from './routes/health';
import weatherRoutes from './routes/weather';
import ttsRoutes from './routes/tts';
import sttRoutes from './routes/stt';
import memoryRoutes from './routes/memory';
import emotionRoutes from './routes/emotion';
import affinityRoutes from './routes/affinity';

// 创建 Express 应用
const app = express();

// ==================== 中间件 ====================

// CORS 配置
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// JSON 解析
app.use(express.json({ limit: '10mb' }));

// 请求日志
if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ==================== API 路由 ====================

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/tts', ttsRoutes);
app.use('/api', sttRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/emotion', emotionRoutes);
app.use('/api/affinity', affinityRoutes);

// ==================== 健康检查 ====================

app.get('/api/health-check', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// ==================== 静态文件（生产环境）====================

if (config.nodeEnv === 'production') {
  const path = require('path');
  
  // 服务前端静态文件
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
  
  // 所有其他路由返回前端应用
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
    }
  });
}

// ==================== 错误处理 ====================

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Error]', err);
  res.status(500).json({
    success: false,
    error: config.nodeEnv === 'development' ? err.message : '服务器内部错误',
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在',
  });
});

// ==================== 启动服务器 ====================

async function start() {
  try {
    // 初始化数据库
    initDatabase();
    console.log('✅ 数据库初始化完成');

    // 启动服务器
    app.listen(config.port, () => {
      console.log('');
      console.log('╔═══════════════════════════════════════════════════╗');
      console.log('║       叉叉 AI 助手后端服务启动成功！                ║');
      console.log('╠═══════════════════════════════════════════════════╣');
      console.log(`║  🚀 服务地址: http://localhost:${config.port}              ║`);
      console.log(`║  📦 环境: ${config.nodeEnv.padEnd(39)}║`);
      console.log(`║  🔑 JWT: ${config.jwtSecret ? '已配置' : '使用默认值'}                          ║`);
      console.log(`║  🤖 MiniMax: ${config.minimax.apiKey ? '已配置' : '未配置'}                        ║`);
      console.log('╚═══════════════════════════════════════════════════╝');
      console.log('');
      console.log('可用的 API 端点:');
      console.log('  POST   /api/auth/register   - 用户注册');
      console.log('  POST   /api/auth/login      - 用户登录');
      console.log('  GET    /api/auth/profile    - 获取用户信息');
      console.log('  POST   /api/chat/message    - 发送消息');
      console.log('  GET    /api/todos           - 获取待办列表');
      console.log('  GET    /api/health/summary  - 获取健康数据');
      console.log('  GET    /api/weather/city/:name - 获取天气');
      console.log('  POST   /api/tts/synthesize  - 语音合成');
      console.log('  GET    /api/memories        - 获取记忆列表');
      console.log('  POST   /api/emotion/detect  - 情绪检测（动画选择）');
      console.log('  GET    /api/emotion/actions - 获取可用动画列表');
      console.log('');
    });
  } catch (error) {
    console.error('❌ 服务启动失败:', error);
    process.exit(1);
  }
}

start();
