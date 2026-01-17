/**
 * 数据库初始化脚本
 * 运行: npm run db:init
 */

import { initDatabase } from './db';

console.log('='.repeat(50));
console.log('叉叉 AI 助手 - 数据库初始化');
console.log('='.repeat(50));

try {
  initDatabase();
  console.log('\n✅ 数据库初始化完成！');
} catch (error) {
  console.error('\n❌ 数据库初始化失败:', error);
  process.exit(1);
}
