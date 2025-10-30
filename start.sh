#!/bin/bash

# AI 旅行规划助手 - 快速启动脚本

set -e

echo "🚀 AI 旅行规划助手 - 快速启动"
echo "================================"
echo ""

# 检查是否在项目根目录
if [ ! -f "README.md" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未安装 Node.js，请先安装：https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"

# 检查环境变量文件
if [ ! -f "frontend/.env.local" ]; then
    echo ""
    echo "⚠️  未找到环境变量文件"
    echo "📝 创建 frontend/.env.local 文件..."
    cp frontend/.env.local.example frontend/.env.local
    echo ""
    echo "⚙️  请编辑 frontend/.env.local 文件，填入你的配置："
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "   - NEXT_PUBLIC_AMAP_KEY"
    echo ""
    echo "配置完成后，请重新运行此脚本"
    exit 1
fi

# 检查依赖
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 安装前端依赖..."
    cd frontend
    npm install
    cd ..
    echo "✅ 依赖安装完成"
else
    echo "✅ 依赖已安装"
fi

echo ""
echo "🌐 启动开发服务器..."
echo "   访问: http://localhost:3000"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

cd frontend
npm run dev

