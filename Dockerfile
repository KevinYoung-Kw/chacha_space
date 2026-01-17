# ==================== 构建阶段: 前端 ====================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# 复制前端依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制前端源码
COPY . .

# 构建前端
RUN npm run build

# ==================== 构建阶段: 后端 ====================
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

# 复制后端依赖文件
COPY backend/package*.json ./

# 安装依赖
RUN npm ci

# 复制后端源码
COPY backend/src ./src
COPY backend/tsconfig.json ./

# 构建后端
RUN npm run build

# ==================== 生产阶段 ====================
FROM node:20-alpine AS production

# 安装必要的系统依赖（用于 better-sqlite3）
RUN apk add --no-cache python3 make g++

WORKDIR /app

# 复制后端 package.json 并安装生产依赖
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --only=production

# 复制构建产物
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# 创建数据目录
RUN mkdir -p /app/data

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_PATH=/app/data/chacha.db

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health-check || exit 1

# 启动应用
CMD ["node", "dist/index.js"]
