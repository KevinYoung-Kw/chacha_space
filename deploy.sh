#!/bin/bash

# 叉叉 AI 助手 - 快速部署脚本
# 用于在服务器上快速部署或更新应用

set -e  # 遇到错误立即退出

echo "🚀 开始部署叉叉 AI 助手..."

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查 .env 文件
if [ ! -f .env ]; then
    echo -e "${RED}❌ 错误: .env 文件不存在！${NC}"
    echo "请先创建 .env 文件并配置 API 密钥"
    echo "参考 env.example 文件"
    exit 1
fi

# 检查必需的环境变量
if ! grep -q "MINIMAX_API_KEY=.*[^-]" .env; then
    echo -e "${YELLOW}⚠️  警告: MINIMAX_API_KEY 未配置${NC}"
    echo "语音合成和 AI 对话功能将不可用"
fi

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ 错误: Docker 未安装${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ 错误: Docker Compose 未安装${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 环境检查通过${NC}"

# 停止旧服务
echo "🛑 停止旧服务..."
docker-compose down

# 构建新镜像
echo "🔨 构建 Docker 镜像..."
docker-compose build

# 启动服务
echo "▶️  启动服务..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 健康检查
echo "🏥 健康检查..."
MAX_RETRIES=10
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -sf http://localhost:7860/api/health-check > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 服务启动成功！${NC}"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo -e "${GREEN}🎉 部署完成！${NC}"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "📍 访问地址: http://localhost:7860"
        echo "📝 查看日志: docker-compose logs -f chacha"
        echo "📊 容器状态: docker-compose ps"
        echo ""
        echo -e "${YELLOW}🔑 首次使用需要生成邀请码:${NC}"
        echo "   curl -X POST http://localhost:7860/api/auth/generate-invite -H \"Content-Type: application/json\" -d '{\"count\": 10}'"
        echo ""
        exit 0
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "等待服务响应... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 3
done

echo -e "${RED}❌ 服务启动失败，请查看日志:${NC}"
echo "   docker-compose logs chacha"
exit 1
