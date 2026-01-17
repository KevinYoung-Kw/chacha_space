import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from '../config';
import SCHEMA from './schema';

// 确保数据目录存在
const dataDir = path.dirname(config.database.path);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 创建数据库连接
const db = new Database(config.database.path, {
  verbose: config.nodeEnv === 'development' ? console.log : undefined,
});

// 启用外键约束
db.pragma('foreign_keys = ON');

// 初始化数据库表结构
export function initDatabase(): void {
  console.log('[Database] Initializing database...');
  db.exec(SCHEMA);
  console.log('[Database] Database initialized successfully');
}

// 导出数据库实例
export { db };
export default db;
