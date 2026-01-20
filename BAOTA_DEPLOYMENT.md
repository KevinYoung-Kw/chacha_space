# 叉叉 AI 助手 - 宝塔面板 Docker 部署指南

## 📋 项目端口配置

| 环境 | 端口 | 说明 |
|------|------|------|
| **容器内部端口** | 7860 | 后端服务端口（固定，不建议修改） |
| **服务器映射端口** | 建议 7860 或 8091 | 可根据服务器实际情况调整 |

---

## 🚀 宝塔面板部署步骤

### 第一步：上传项目代码

#### 方式一：通过 Git（推荐）

1. 在宝塔面板点击 **"软件商店"** -> 安装 **"Git"**
2. SSH 连接服务器（或使用宝塔终端）：

```bash
cd /www/wwwroot
git clone <your-repo-url> chacha-assistant
cd chacha-assistant
```

#### 方式二：手动上传

1. 在宝塔面板 **"文件"** -> 进入 `/www/wwwroot`
2. 创建文件夹 `chacha-assistant`
3. 上传项目文件（建议打包成 `.tar.gz` 后上传再解压）

---

### 第二步：配置环境变量

在项目根目录 `/www/wwwroot/chacha-assistant` 创建 `.env` 文件：

1. 在宝塔面板 **"文件"** 中进入项目目录
2. 点击 **"新建文件"** -> 文件名 `.env`
3. 编辑内容（**必须填入真实的 API 密钥！**）：

```env
# ==================== 必需配置 ====================

# MiniMax API 配置（必需）
# 获取地址: https://platform.minimaxi.com/
MINIMAX_API_KEY=你的实际API密钥
MINIMAX_GROUP_ID=你的实际GroupID

# ==================== 安全配置 ====================

# JWT 密钥（生产环境必须修改！）
# 可以用这个命令生成: openssl rand -hex 32
JWT_SECRET=你生成的随机密钥

# ==================== 可选配置 ====================

# 高德地图 API（可选）
AMAP_KEY=

# 阶跃星辰 API（可选）
STEPFUN_API_KEY=

# ==================== 服务配置 ====================

NODE_ENV=production
PORT=7860
DATABASE_PATH=/app/data/chacha.db
STATIC_PATH=/app/backend/frontend/dist
CORS_ORIGIN=*
```

---

### 第三步：通过宝塔面板部署 Docker

#### 3.1 安装 Docker

1. 点击左侧 **"软件商店"**
2. 搜索 **"Docker"** 和 **"Docker Compose"**
3. 点击安装

#### 3.2 添加 Docker 项目

1. 点击左侧 **"Docker"** 菜单
2. 点击 **"项目"** 标签
3. 点击 **"添加项目"** 按钮

#### 3.3 填写项目配置

| 配置项 | 填写内容 |
|--------|----------|
| **项目名称** | `chacha-assistant` |
| **项目路径** | `/www/wwwroot/chacha-assistant` |
| **部署方式** | 选择 **"Docker Compose"**（推荐） |
| **Compose 文件** | `docker-compose.yml`（自动检测） |

#### 3.4 端口映射配置

宝塔会自动读取 `docker-compose.yml` 中的端口配置：

- **容器端口**：`7860`（自动识别）
- **服务器端口**：
  - 默认：`7860`
  - 如果 7860 被占用，可以改为：`8091`、`8080` 等

**修改端口方法**（如果需要）：
编辑 `docker-compose.yml` 第 11 行：
```yaml
ports:
  - "8091:7860"  # 服务器端口:容器端口
```

#### 3.5 启动项目

1. 确认配置无误
2. 点击 **"确定"** 按钮
3. 宝塔会自动：
   - 构建 Docker 镜像（首次需要 5-10 分钟）
   - 创建容器
   - 启动服务

---

### 第四步：配置网站访问（可选但推荐）

#### 4.1 创建网站

1. 点击左侧 **"网站"** 菜单
2. 点击 **"添加站点"**
3. 填写配置：

| 配置项 | 填写内容 |
|--------|----------|
| **域名** | 你的域名（如：`chacha.yourdomain.com`）或 IP |
| **根目录** | 随意（不会用到） |
| **PHP 版本** | 纯静态 |

#### 4.2 配置反向代理

1. 在网站列表中，点击刚创建的网站 **"设置"**
2. 点击 **"反向代理"** 标签
3. 点击 **"添加反向代理"**
4. 填写配置：

| 配置项 | 填写内容 |
|--------|----------|
| **代理名称** | `chacha-api` |
| **目标 URL** | `http://127.0.0.1:7860`（或你的实际端口） |
| **发送域名** | `$host` |
| **内容替换** | 留空 |

高级配置（点击"配置文件"直接编辑）：
```nginx
location / {
    proxy_pass http://127.0.0.1:7860;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

#### 4.3 配置 SSL（推荐）

1. 在网站设置中，点击 **"SSL"** 标签
2. 选择 **"Let's Encrypt"**
3. 输入邮箱，点击申请
4. 强制 HTTPS：开启 **"强制 HTTPS"** 开关

---

### 第五步：生成邀请码

邀请码生成接口**仅限服务器本地访问**（安全措施）。

**重要**：必须通过 **SSH 登录到服务器**后执行，远程调用会被拒绝。

#### 方式一：使用脚本（推荐）

```bash
# SSH 登录到服务器后
cd /www/wwwroot/chacha-assistant
chmod +x generate-invite-codes.sh
./generate-invite-codes.sh -c 10
```

#### 方式二：使用 curl

```bash
# SSH 登录到服务器后
curl -X POST http://localhost:7860/api/auth/generate-invite \
  -H "Content-Type: application/json" \
  -d '{"count": 10}'
```

#### 常见问题：端口 3001 连接失败

如果遇到 `Failed to connect to localhost port 3001`，说明使用了开发环境端口。

**解决方案**：使用生产环境端口 `7860`：
```bash
curl -X POST http://localhost:7860/api/auth/generate-invite \
  -H "Content-Type: application/json" \
  -d '{"count": 10}'
```

---

## 🔍 监控与维护

### 查看容器状态

1. **宝塔面板方式**：
   - 点击 **"Docker"** -> **"容器"**
   - 查看 `chacha-assistant` 容器状态

2. **命令行方式**：
```bash
docker ps | grep chacha
docker-compose ps
```

### 查看日志

1. **宝塔面板方式**：
   - 点击 **"Docker"** -> **"容器"**
   - 点击容器名称 -> **"日志"**

2. **命令行方式**：
```bash
cd /www/wwwroot/chacha-assistant
docker-compose logs -f chacha
```

### 重启服务

1. **宝塔面板方式**：
   - 点击 **"Docker"** -> **"容器"**
   - 点击容器操作 -> **"重启"**

2. **命令行方式**：
```bash
cd /www/wwwroot/chacha-assistant
docker-compose restart
```

### 更新代码

```bash
cd /www/wwwroot/chacha-assistant

# 拉取最新代码
git pull

# 重新构建并启动
docker-compose down
docker-compose build
docker-compose up -d
```

---

## 🐛 常见问题

### 1. 端口被占用

**错误提示**：`Bind for 0.0.0.0:7860 failed: port is already allocated`

**解决方案**：
编辑 `docker-compose.yml`，修改端口映射：
```yaml
ports:
  - "8091:7860"  # 改为未被占用的端口
```

### 2. 构建失败

**可能原因**：网络问题、内存不足

**解决方案**：
```bash
# 清理缓存重新构建
docker-compose down
docker system prune -a
docker-compose build --no-cache
docker-compose up -d
```

### 3. 前端访问不到后端

**检查项**：
1. 确认容器正常运行：`docker ps`
2. 确认端口正确映射：`docker port chacha-assistant`
3. 检查防火墙：宝塔 **"安全"** -> 放行端口
4. 查看日志：`docker-compose logs chacha`

### 4. API 密钥未生效

**检查项**：
1. 确认 `.env` 文件在**项目根目录**（与 `docker-compose.yml` 同级）
2. 确认环境变量无空格、无引号
3. 重新构建：`docker-compose down && docker-compose up -d`

### 5. 邀请码生成被拒绝

**错误提示**：`{"success":false,"error":"此接口仅限本地服务器访问"}`

**原因**：必须在服务器本地执行（安全限制）

**解决方案**：
1. 确认你已经 **SSH 登录到服务器**
2. 确认使用的是正确的端口（Docker 是 `7860`，不是 `3001`）
3. 如果问题仍然存在，查看日志：
   ```bash
   docker-compose logs chacha | grep "邀请码生成请求"
   ```
4. 日志会显示实际的 IP 信息，如果看到非本地 IP，请联系技术支持

---

## 📞 技术支持

启动后访问：
- **前端页面**：`http://服务器IP:7860`（或你的域名）
- **健康检查**：`http://服务器IP:7860/api/health-check`

查看启动日志确认配置状态：
```bash
docker-compose logs chacha | grep "环境变量检查"
```

应该看到类似输出：
```
🔍 环境变量检查...
   NODE_ENV: production
   PORT: 7860
   MINIMAX_API_KEY: ✓ 已配置
   ...
```
