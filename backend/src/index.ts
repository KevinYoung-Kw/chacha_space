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
import adminRoutes from './routes/admin';
import dailyRoutes from './routes/daily';

// 导入工具
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from './database/db';

// 创建 Express 应用
const app = express();

// ==================== 中间件 ====================

// CORS 配置
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Id'],
  exposedHeaders: ['Authorization'],
  maxAge: 86400, // 预检请求缓存24小时
}));

// JSON 解析
app.use(express.json({ limit: '10mb' }));

// 请求日志
if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
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
app.use('/api/admin', adminRoutes);
app.use('/api/daily', dailyRoutes);

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
  const fs = require('fs');
  
  // 静态资源路径（支持多种部署目录）
  const staticCandidates = [
    process.env.STATIC_PATH,
    path.join(process.cwd(), 'frontend/dist'),
    path.join(__dirname, '../frontend/dist'),
    path.join(__dirname, '../../frontend/dist'),
  ].filter(Boolean);
  
  const staticPath = staticCandidates.find((candidate: string) => fs.existsSync(candidate));
  
  if (staticPath) {
    console.log(`[Static] 服务静态文件目录: ${staticPath}`);
    app.use(express.static(staticPath));
    
    // 所有其他路由返回前端应用
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(staticPath, 'index.html'));
      }
    });
  } else {
    console.error('[Static] 未找到前端构建产物，请检查 STATIC_PATH 或镜像构建是否包含 frontend/dist');
    console.error('[Static] 尝试路径:', staticCandidates);
  }
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

// ==================== 管理员初始化 ====================

/**
 * 自动创建或更新管理员账户
 * 根据环境变量 ADMIN_EMAIL 和 ADMIN_PASSWORD 配置
 */
async function initializeAdmin(): Promise<void> {
  const { email, password } = config.admin;
  
  if (!email || !password) {
    console.log('[Admin] ⚠️  未配置管理员账户（ADMIN_EMAIL 和 ADMIN_PASSWORD）');
    return;
  }
  
  if (password.length < 6) {
    console.log('[Admin] ⚠️  管理员密码太短（至少6位），跳过创建');
    return;
  }
  
  try {
    // 检查管理员是否存在
    const existingAdmin = db.prepare(`
      SELECT id, password_hash FROM users WHERE email = ?
    `).get(email) as { id: string; password_hash: string } | undefined;
    
    const passwordHash = await bcrypt.hash(password, 10);
    
    if (existingAdmin) {
      // 更新密码和管理员标志
      db.prepare(`
        UPDATE users SET password_hash = ?, is_admin = 1, updated_at = datetime('now')
        WHERE email = ?
      `).run(passwordHash, email);
      console.log(`[Admin] ✓ 管理员账户已更新: ${email}`);
    } else {
      // 创建新管理员
      const adminId = uuidv4();
      db.prepare(`
        INSERT INTO users (id, email, password_hash, name, is_admin, created_at, updated_at)
        VALUES (?, ?, ?, '管理员', 1, datetime('now'), datetime('now'))
      `).run(adminId, email, passwordHash);
      console.log(`[Admin] ✓ 管理员账户已创建: ${email}`);
    }
  } catch (error) {
    console.error('[Admin] ✗ 管理员初始化失败:', error);
  }
}

// ==================== 启动服务器 ====================

async function start() {
  try {
    // 环境变量诊断
    console.log('');
    console.log('🔍 环境变量检查...');
    console.log(`   NODE_ENV: ${config.nodeEnv}`);
    console.log(`   PORT: ${config.port}`);
    console.log(`   DATABASE_PATH: ${config.database.path}`);
    console.log(`   JWT_SECRET: ${config.jwtSecret !== 'chacha-secret-key-change-in-production' ? '✓ 已自定义' : '⚠️ 使用默认值（不安全）'}`);
    console.log(`   MINIMAX_API_KEY: ${config.minimax.apiKey ? '✓ 已配置' : '✗ 未配置'}`);
    console.log(`   MINIMAX_GROUP_ID: ${config.minimax.groupId ? '✓ 已配置' : '✗ 未配置'}`);
    console.log(`   AMAP_KEY: ${config.amap.apiKey ? '✓ 已配置' : '- 未配置（可选）'}`);
    console.log(`   STEPFUN_API_KEY: ${config.stepfun.apiKey ? '✓ 已配置' : '- 未配置（可选）'}`);
    console.log(`   ADMIN_EMAIL: ${config.admin.email ? '✓ 已配置' : '- 未配置'}`);
    console.log(`   CORS_ORIGIN: ${config.cors.origin}`);
    
    // 检查必需的环境变量
    const warnings: string[] = [];
    if (!config.minimax.apiKey || !config.minimax.groupId) {
      warnings.push('⚠️  MiniMax API 未配置，AI对话和语音合成功能将不可用');
      warnings.push('   请在 .env 文件中配置 MINIMAX_API_KEY 和 MINIMAX_GROUP_ID');
    }
    if (config.jwtSecret === 'chacha-secret-key-change-in-production' && config.nodeEnv === 'production') {
      warnings.push('⚠️  生产环境使用默认 JWT_SECRET，存在安全风险！');
    }
    
    if (warnings.length > 0) {
      console.log('');
      console.log('⚠️  警告:');
      warnings.forEach(w => console.log(`   ${w}`));
    }
    console.log('');

    // 初始化数据库
    initDatabase();
    console.log('✅ 数据库初始化完成');

    // 初始化管理员账户
    await initializeAdmin();

    // 启动服务器
    app.listen(config.port, () => {
      console.log('');
      console.log('╔═══════════════════════════════════════════════════╗');
      console.log('║       叉叉 AI 助手后端服务启动成功！                ║');
      console.log('╠═══════════════════════════════════════════════════╣');
      console.log(`║  🚀 服务地址: http://localhost:${config.port}              ║`);
      console.log(`║  📦 环境: ${config.nodeEnv.padEnd(39)}║`);
      console.log(`║  🗄️  数据库: ${config.database.path.split('/').pop()?.padEnd(33)}║`);
      console.log(`║  🔑 JWT: ${config.jwtSecret !== 'chacha-secret-key-change-in-production' ? '已配置' : '默认值'}                            ║`);
      console.log(`║  🤖 MiniMax: ${config.minimax.apiKey ? '✓ 已配置' : '✗ 未配置'}                       ║`);
      console.log('╚═══════════════════════════════════════════════════╝');
      console.log('');
      console.log('📋 可用的 API 端点:');
      console.log('  POST   /api/auth/register          - 用户注册（需邀请码）');
      console.log('  POST   /api/auth/login             - 用户登录');
      console.log('  GET    /api/auth/profile           - 获取用户信息');
      console.log('  POST   /api/chat/message           - AI 对话');
      console.log('  GET    /api/todos                  - 获取待办列表');
      console.log('  GET    /api/health/summary         - 获取健康数据');
      console.log('  GET    /api/weather/city/:name     - 获取天气');
      console.log('  POST   /api/tts/synthesize         - 语音合成');
      console.log('  GET    /api/memories               - 获取记忆列表');
      console.log('  POST   /api/emotion/detect         - 情绪检测');
      console.log('  GET    /api/affinity               - 获取好感度');
      console.log('  GET    /api/health-check           - 健康检查');
      console.log('');
      console.log('🔐 管理员 API 端点:');
      console.log('  POST   /api/admin/login            - 管理员登录');
      console.log('  GET    /api/admin/stats            - 获取统计数据');
      console.log('  GET    /api/admin/invite-codes     - 获取邀请码列表');
      console.log('  POST   /api/admin/invite-codes     - 生成邀请码');
      console.log('  DELETE /api/admin/invite-codes/:code - 删除邀请码');
      console.log('  GET    /api/admin/users            - 获取用户列表');
      console.log('  DELETE /api/admin/users/:id        - 删除用户');
      console.log('');
      
      if (config.admin.email) {
        console.log(`💡 管理后台: ${config.nodeEnv === 'production' ? '访问 /admin' : `http://localhost:${config.port}/admin`}`);
        console.log('');
      } else {
        console.log('💡 提示: 配置 ADMIN_EMAIL 和 ADMIN_PASSWORD 环境变量启用管理后台');
        console.log('');
      }
    });
  } catch (error) {
    console.error('❌ 服务启动失败:', error);
    process.exit(1);
  }
}

start();
