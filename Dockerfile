# ==================== 构建阶段: 前端 ====================
FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend

# 复制前端依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci --legacy-peer-deps

# 复制前端源码（排除 backend 和 node_modules）
COPY index.html ./
COPY index.tsx ./
COPY App.tsx ./
COPY types.ts ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY components ./components
COPY services ./services
COPY config ./config
COPY hooks ./hooks
COPY public ./public

# 构建前端
RUN npm run build

# ==================== 构建阶段: 后端 ====================
FROM node:20-slim AS backend-builder

WORKDIR /app/backend

# 安装构建依赖（用于 better-sqlite3）
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

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
FROM ubuntu:22.04 AS production

# 设置时区
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 安装 Node.js 和必要的系统依赖
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    python3 \
    make \
    g++ \
    wget \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

WORKDIR /app

# 复制后端 package.json 并安装生产依赖
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --only=production

# 复制构建产物
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# 创建数据目录并设置权限
RUN mkdir -p /app/data && chmod 755 /app/data

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=7860
ENV DATABASE_PATH=/app/data/chacha.db
ENV STATIC_PATH=/app/frontend/dist

# 暴露端口
EXPOSE 7860

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:7860/api/health-check || exit 1

# 启动应用
CMD ["node", "dist/index.js"]
