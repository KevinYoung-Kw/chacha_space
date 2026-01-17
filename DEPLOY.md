# 叉叉 AI 助手 - 部署指南

## 🚀 魔搭社区（ModelScope）部署

### 1. 环境变量配置

部署到魔搭社区时，您需要在平台的 **环境变量配置界面** 添加以下敏感信息：

#### 必需的环境变量：

| 变量名 | 说明 | 获取方式 |
|--------|------|----------|
| `MINIMAX_API_KEY` | MiniMax API 密钥 | [MiniMax 开放平台](https://platform.minimaxi.com/) 注册获取 |
| `MINIMAX_GROUP_ID` | MiniMax 组 ID | MiniMax 控制台获取 |

#### 可选的环境变量：

| 变量名 | 说明 | 获取方式 |
|--------|------|----------|
| `AMAP_KEY` | 高德地图 API Key（天气服务） | [高德开放平台](https://console.amap.com/) |
| `STEPFUN_API_KEY` | 阶跃星辰 API（情绪分析） | [阶跃星辰官网](https://platform.stepfun.com/) |
| `JWT_SECRET` | JWT 签名密钥 | 自定义安全字符串（默认已配置） |

### 2. 部署步骤

#### 方式一：通过魔搭社区 Web 界面

1. 登录 [魔搭社区](https://modelscope.cn/)
2. 创建新的 **Space**
3. 选择 **Docker** 类型
4. 连接您的 Git 仓库
5. 在 **环境变量** 设置中添加：
   - `MINIMAX_API_KEY`: 你的MiniMax密钥
   - `MINIMAX_GROUP_ID`: 你的MiniMax组ID
   - `AMAP_KEY`: 你的高德地图密钥（可选）
   - `STEPFUN_API_KEY`: 你的阶跃星辰密钥（可选）

6. 系统会自动读取 `ms_deploy.json` 进行构建
7. 等待构建完成（约 5-10 分钟）
8. 访问您的 Space URL

#### 方式二：修改 ms_deploy.json（不推荐）

**⚠️ 警告：** 不要将真实的 API Key 直接写入 `ms_deploy.json` 并提交到代码仓库！

如果必须在配置文件中指定，请将真实的 Key 替换占位符后再部署：

```json
{
  "name": "MINIMAX_API_KEY",
  "value": "你的真实MiniMax密钥"
}
```

### 3. ms_deploy.json 配置说明

当前配置：

```json
{
  "sdk_type": "docker",           // 使用 Docker 部署
  "resource_configuration": "platform/2v-cpu-16g-mem",  // 2核CPU + 16G内存
  "port": 7860,                    // 服务端口
  "environment_variables": [...]   // 环境变量列表
}
```

**占位符说明：**
- `${MINIMAX_API_KEY}` - 这是一个占位符
- 部署时需要在魔搭平台的环境变量界面填入真实值
- 或者直接替换为真实的 API Key（但不要提交到 Git）

### 4. 本地测试

在本地测试 Docker 镜像：

```bash
# 1. 构建镜像
docker build -t chacha-assistant .

# 2. 运行容器（需要提供环境变量）
docker run -p 7860:7860 \
  -e MINIMAX_API_KEY=你的密钥 \
  -e MINIMAX_GROUP_ID=你的组ID \
  -e AMAP_KEY=你的高德密钥 \
  -d chacha-assistant

# 3. 查看日志
docker logs -f 容器ID

# 4. 访问
open http://localhost:7860
```

### 5. 使用 docker-compose（本地开发）

创建 `.env` 文件（不要提交到 Git）：

```bash
MINIMAX_API_KEY=你的MiniMax密钥
MINIMAX_GROUP_ID=你的MiniMax组ID
AMAP_KEY=你的高德地图密钥
STEPFUN_API_KEY=你的阶跃星辰密钥
JWT_SECRET=你的自定义JWT密钥
```

然后运行：

```bash
docker-compose up -d
```

### 6. 验证部署

部署成功后，访问以下端点检查：

- **健康检查**: `https://your-space.modelscope.cn/api/health-check`
- **前端页面**: `https://your-space.modelscope.cn/`

如果返回以下内容说明后端服务正常：

```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2024-01-18T...",
  "environment": "production"
}
```

### 7. 常见问题

#### Q: MiniMax API 调用失败？
A: 检查 `MINIMAX_API_KEY` 和 `MINIMAX_GROUP_ID` 是否正确配置

#### Q: 天气功能不工作？
A: 需要配置 `AMAP_KEY`，或者使用免费的 Open-Meteo API（默认）

#### Q: 数据会丢失吗？
A: 数据库存储在 `/app/data/chacha.db`，建议使用持久化卷

#### Q: 如何更新 API Key？
A: 在魔搭平台的环境变量设置中修改，然后重启 Space

---

## 📞 技术支持

如有问题，请参考：
- [MiniMax 文档](https://platform.minimaxi.com/document)
- [魔搭社区文档](https://modelscope.cn/docs)
- 项目 README.md
