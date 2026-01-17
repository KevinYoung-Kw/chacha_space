/**
 * SQLite 数据库表结构定义
 */

export const SCHEMA = `
-- ==================== 用户表 ====================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '用户',
  gender TEXT,
  identity TEXT,
  expectations TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 邮箱索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ==================== 待办分类表 ====================
CREATE TABLE IF NOT EXISTS todo_categories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'List', -- Lucide icon name
  color TEXT DEFAULT 'bg-gray-500',
  is_default INTEGER DEFAULT 0, -- 是否为系统默认分类
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, name)
);

-- 分类索引
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON todo_categories(user_id);

-- ==================== 待办事项表 ====================
CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  text TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  category_id TEXT, -- 关联到分类表
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('high', 'medium', 'low')),
  deadline TEXT, -- 截止日期 ISO 8601 格式
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES todo_categories(id) ON DELETE SET NULL
);

-- 用户待办索引
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_category_id ON todos(category_id);
CREATE INDEX IF NOT EXISTS idx_todos_deadline ON todos(deadline);

-- ==================== 健康目标表 ====================
CREATE TABLE IF NOT EXISTS health_goals (
  user_id TEXT PRIMARY KEY,
  water_goal INTEGER DEFAULT 2000,
  calories_goal INTEGER DEFAULT 2000,
  sleep_goal INTEGER DEFAULT 8,
  exercise_goal INTEGER DEFAULT 30,
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==================== 健康记录表 ====================
CREATE TABLE IF NOT EXISTS health_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('water', 'calories', 'sleep', 'exercise')),
  value REAL NOT NULL,
  metadata TEXT, -- JSON 格式存储额外信息
  recorded_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 健康记录索引
CREATE INDEX IF NOT EXISTS idx_health_records_user_id ON health_records(user_id);
CREATE INDEX IF NOT EXISTS idx_health_records_type ON health_records(type);
CREATE INDEX IF NOT EXISTS idx_health_records_recorded_at ON health_records(recorded_at);

-- ==================== 对话会话表 ====================
CREATE TABLE IF NOT EXISTS conversation_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT,
  summary TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 会话索引
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON conversation_sessions(user_id);

-- ==================== 对话消息表 ====================
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  timestamp TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES conversation_sessions(id) ON DELETE CASCADE
);

-- 消息索引
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);

-- ==================== 长期记忆表 ====================
CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('fact', 'preference', 'event', 'relationship')),
  content TEXT NOT NULL,
  importance INTEGER DEFAULT 5 CHECK(importance BETWEEN 1 AND 10),
  embedding TEXT, -- 用于向量搜索的嵌入（预留）
  last_accessed TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 记忆索引
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);
CREATE INDEX IF NOT EXISTS idx_memories_importance ON memories(importance);

-- ==================== 天气缓存表（可选）====================
CREATE TABLE IF NOT EXISTS weather_cache (
  city TEXT PRIMARY KEY,
  data TEXT NOT NULL, -- JSON 格式
  cached_at TEXT DEFAULT (datetime('now'))
);

-- ==================== 触发器：自动更新 updated_at ====================
CREATE TRIGGER IF NOT EXISTS update_users_updated_at 
AFTER UPDATE ON users
BEGIN
  UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_todos_updated_at 
AFTER UPDATE ON todos
BEGIN
  UPDATE todos SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_sessions_updated_at 
AFTER UPDATE ON conversation_sessions
BEGIN
  UPDATE conversation_sessions SET updated_at = datetime('now') WHERE id = NEW.id;
END;
`;

export default SCHEMA;
