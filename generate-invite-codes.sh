#!/bin/bash

# 叉叉 AI 助手 - 邀请码生成脚本
# 仅能在服务器本地运行（安全限制）

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔑 叉叉 AI 助手 - 邀请码生成器${NC}"
echo ""

# 默认值
COUNT=10
PORT=7860

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--count)
            COUNT="$2"
            shift 2
            ;;
        -p|--port)
            PORT="$2"
            shift 2
            ;;
        -h|--help)
            echo "用法: $0 [选项]"
            echo ""
            echo "选项:"
            echo "  -c, --count NUM    生成邀请码数量（默认: 10）"
            echo "  -p, --port PORT    服务端口（默认: 7860）"
            echo "  -h, --help         显示帮助信息"
            echo ""
            echo "示例:"
            echo "  $0                     # 生成 10 个邀请码"
            echo "  $0 -c 20               # 生成 20 个邀请码"
            echo "  $0 -c 5 -p 8080        # 在端口 8080 上生成 5 个邀请码"
            exit 0
            ;;
        *)
            echo "未知选项: $1"
            echo "使用 -h 或 --help 查看帮助"
            exit 1
            ;;
    esac
done

# 检查服务是否运行
if ! curl -sf http://localhost:$PORT/api/health-check > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  警告: 服务未运行或无法访问 (端口 $PORT)${NC}"
    echo "请确认服务已启动: docker-compose ps"
    exit 1
fi

echo "正在生成 $COUNT 个邀请码..."
echo ""

# 调用 API 生成邀请码
RESPONSE=$(curl -s -X POST http://localhost:$PORT/api/auth/generate-invite \
  -H "Content-Type: application/json" \
  -d "{\"count\": $COUNT}")

# 检查是否成功
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ 成功生成 $COUNT 个邀请码！${NC}"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${GREEN}📋 邀请码列表:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # 提取并格式化邀请码
    echo "$RESPONSE" | grep -o '"[A-Z0-9]\{8\}"' | tr -d '"' | nl -w2 -s'. '
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo -e "${YELLOW}💡 提示:${NC}"
    echo "  • 每个邀请码只能使用一次"
    echo "  • 请妥善保管邀请码"
    echo "  • 建议将邀请码保存到文件:"
    echo "    $0 -c $COUNT | grep -E '^[[:space:]]*[0-9]+\\.' > invite-codes.txt"
    echo ""
else
    echo -e "${YELLOW}❌ 生成失败${NC}"
    echo "错误信息:"
    echo "$RESPONSE" | grep -o '"error":"[^"]*"' || echo "$RESPONSE"
    echo ""
    echo -e "${YELLOW}可能的原因:${NC}"
    echo "  1. 此脚本只能在服务器本地运行（安全限制）"
    echo "  2. 服务未正常启动"
    echo "  3. 端口配置错误"
    exit 1
fi
