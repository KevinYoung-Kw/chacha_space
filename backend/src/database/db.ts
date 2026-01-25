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
const db: Database.Database = new Database(config.database.path, {
  verbose: config.nodeEnv === 'development' ? console.log : undefined,
});

// 启用外键约束
db.pragma('foreign_keys = ON');

// 初始化数据库表结构
export function initDatabase(): void {
  console.log('[Database] Initializing database...');
  db.exec(SCHEMA);
  
  // 运行数据库迁移
  runMigrations();
  
  console.log('[Database] Database initialized successfully');
}

// 数据库迁移
function runMigrations(): void {
  console.log('[Database] Running migrations...');
  
  // 迁移 1: 添加 is_admin 字段到 users 表
  try {
    const columns = db.prepare("PRAGMA table_info(users)").all() as any[];
    const hasIsAdmin = columns.some(col => col.name === 'is_admin');
    
    if (!hasIsAdmin) {
      db.exec("ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0");
      console.log('[Database] Migration: Added is_admin column to users table');
    }
  } catch (err) {
    console.warn('[Database] Migration warning:', err);
  }
}

// 导出数据库实例
export { db };
export default db;
