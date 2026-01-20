# 叉叉 AI 助手 - Docker 部署指南

## 📦 部署架构

- **前端**：React + Vite（构建成静态文件）
- **后端**：Node.js + Express（端口 7860）
- **数据库**：SQLite（持久化在 Docker volume）
- **部署方式**：单容器全栈部署

## 🔧 部署步骤

### 1. 准备服务器环境

确保服务器已安装：
- Docker（版本 20.10+）
- Docker Compose（版本 2.0+）

```bash
# 检查版本
docker --version
docker-compose --version
```

### 2. 上传代码到服务器

```bash
# 方式一：使用 git
ssh your-server
cd /path/to/deploy
git clone <your-repo-url>
cd hackathon

# 方式二：使用 scp（如果不用 git）
cd /Users/kevinyoung/Desktop/tata_hackton/tata_chacha/hackathon
tar -czf chacha.tar.gz --exclude=node_modules --exclude=dist --exclude=backend/dist --exclude=backend/node_modules .
scp chacha.tar.gz your-server:/path/to/deploy/
ssh your-server
cd /path/to/deploy
tar -xzf chacha.tar.gz
```

### 3. 配置环境变量

在项目根目录创建 `.env` 文件：

```bash
cd /path/to/deploy/hackathon
nano .env
```

粘贴以下内容并**修改为实际的 API 密钥**：

```env
# ==================== 必需配置 ====================

# MiniMax API 配置（必需，用于语音合成和AI对话）
# 获取地址: https://platform.minimaxi.com/
MINIMAX_API_KEY=your-actual-minimax-api-key
MINIMAX_GROUP_ID=your-actual-minimax-group-id

# ==================== 可选配置 ====================

# 高德地图 API（天气服务，可选）
AMAP_KEY=your-amap-key

# 阶跃星辰 API（情绪检测，可选）
STEPFUN_API_KEY=your-stepfun-key

# ==================== 安全配置 ====================

# JWT 密钥（生产环境必须修改！）
JWT_SECRET=chacha-$(openssl rand -hex 32)

# CORS 配置（如果有固定域名，改为具体域名）
CORS_ORIGIN=*
```

### 4. 构建并启动服务

```bash
# 构建 Docker 镜像
docker-compose build

# 启动服务（后台运行）
docker-compose up -d

# 查看日志
docker-compose logs -f chacha

# 检查服务状态
docker-compose ps
```

### 5. 配置反向代理（可选但推荐）

如果使用 Nginx 或 Caddy 作为反向代理：

#### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 可选：自动跳转 HTTPS
    # return 301 https://$server_name$request_uri;

    # 反向代理到 Docker 容器
    location / {
        proxy_pass http://localhost:7860;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Caddy 配置示例

```caddyfile
your-domain.com {
    reverse_proxy localhost:7860
}
```

### 6. 生成邀请码（首次使用）

邀请码生成接口**仅限本地服务器**访问，需要 SSH 到服务器执行：

```bash
# SSH 登录服务器
ssh your-server

# 生成 10 个邀请码
curl -X POST http://localhost:7860/api/auth/generate-invite \
  -H "Content-Type: application/json" \
  -d '{"count": 10}'

# 生成带过期时间的邀请码（7天后过期）
curl -X POST http://localhost:7860/api/auth/generate-invite \
  -H "Content-Type: application/json" \
  -d '{"count": 5, "expiresIn": 604800000}'
```

返回示例：
```json
{
  "success": true,
  "data": {
    "codes": ["ABC12345", "DEF67890", ...]
  }
}
```

## 🔄 更新部署

当代码有更新时：

```bash
# 停止服务
docker-compose down

# 更新代码（git 方式）
git pull

# 重新构建并启动
docker-compose build
docker-compose up -d

# 查看日志确认启动成功
docker-compose logs -f chacha
```

## 🐛 常见问题

### 1. 端口冲突

如果 7860 端口被占用，修改 `docker-compose.yml`：

```yaml
ports:
  - "8080:7860"  # 改为其他端口
```

### 2. 环境变量未生效

确认 `.env` 文件在项目根目录，且格式正确（无空格、无引号）。

重新构建：
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 3. 数据库迁移

如果需要重新初始化数据库：

```bash
# 删除旧数据（谨慎！）
docker-compose down -v

# 重新启动（会自动初始化）
docker-compose up -d
```

### 4. 查看实时日志

```bash
# 所有日志
docker-compose logs -f

# 只看最近 100 行
docker-compose logs --tail=100 -f chacha
```

### 5. 进入容器调试

```bash
docker exec -it chacha-assistant bash
```

## 📊 健康检查

访问以下 URL 检查服务状态：

```bash
# API 健康检查
curl http://your-domain.com/api/health-check

# 前端访问
open http://your-domain.com
```

## 🔒 安全建议

1. **修改 JWT_SECRET**：使用随机字符串，不要使用默认值
2. **限制 CORS**：生产环境将 `CORS_ORIGIN` 改为具体域名
3. **使用 HTTPS**：配置 SSL 证书（Let's Encrypt 免费）
4. **定期备份**：备份 `/var/lib/docker/volumes/hackathon_chacha-data`
5. **API 密钥保护**：不要将 `.env` 文件提交到 git

## 📝 监控与维护

```bash
# 查看容器资源使用
docker stats chacha-assistant

# 查看磁盘使用
docker system df

# 清理未使用的镜像
docker system prune -a
```

## 🆘 技术支持

如遇问题，请查看日志：
```bash
docker-compose logs chacha > chacha.log
```
