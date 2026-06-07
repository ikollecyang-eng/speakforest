#!/bin/bash
# SpeakForest 一键启动脚本 (Mac)
# 用法: chmod +x start.sh && ./start.sh

echo "🌲 SpeakForest 启动中..."

# 检查 .env
if [ ! -f backend/.env ]; then
    echo "⚠️  未找到 backend/.env，复制模板..."
    cp backend/.env.example backend/.env
    echo "📝 请编辑 backend/.env 填入 ANTHROPIC_API_KEY"
fi

# 启动后端
echo "🐍 启动 FastAPI 后端..."
cd backend
pip install -r requirements.txt -q
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 2

# 启动前端
echo "⚛️  启动 Next.js 前端..."
cd frontend
npm install -q
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ SpeakForest 已启动!"
echo "   前端: http://localhost:3000"
echo "   后端: http://localhost:8000"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待中断
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '已停止'; exit" INT
wait
