import dotenv from 'dotenv';
import path from 'path';

// 加载 .env 文件
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
  // 服务器配置
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // JWT 配置
  jwtSecret: process.env.JWT_SECRET || 'chacha-secret-key-change-in-production',
  jwtExpiresIn: '7d',
  
  // MiniMax API 配置
  minimax: {
    apiKey: process.env.MINIMAX_API_KEY || '',
    groupId: process.env.MINIMAX_GROUP_ID || '',
    baseUrl: 'https://api.minimaxi.com',
    chatModel: 'MiniMax-M2.1',
    ttsModel: 'speech-2.6-hd',
    defaultVoiceId: 'female-shaonv',
  },
  
  // 高德地图 API
  amap: {
    apiKey: process.env.AMAP_KEY || '',
    baseUrl: 'https://restapi.amap.com/v3',
  },
  
  // 阶跃星辰 API
  stepfun: {
    apiKey: process.env.STEPFUN_API_KEY || '',
    baseUrl: 'https://api.stepfun.com',
  },
  
  // 数据库配置
  database: {
    path: process.env.DATABASE_PATH || path.resolve(__dirname, '../data/chacha.db'),
  },
  
  // CORS 配置
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
};

export default config;
