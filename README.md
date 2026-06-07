# 🌲 SpeakForest · 英语森友镇
###demo链接七牛云项目 http://xhslink.com/o/88PvyCn4EPi 
打开【小红书】，这篇笔记超精彩
> 在对话中成长，让英语成为你的力量

AI 驱动的英语口语陪练应用，星露谷风格像素游戏界面。

## ✨ 功能特点

- 🎭 **6个真实场景**: 咖啡点餐、面试、购物、问路、商务会议、旅游
- 🎤 **实时语音对话**: 浏览器 Web Speech API + Whisper 双重支持  
- 📊 **发音评测**: 多维度评分（发音/流利度/语调/完整度）
- ✏️ **实时语法纠错**: AI 即时检测并温和纠正
- 📈 **课后总结**: XP 系统、成长树、能力雷达图
- 🎮 **游戏化设计**: 经验值、等级、成就系统

## 🚀 快速启动

### 1. 配置 API Key

```bash
# 后端目录
cd backend
cp .env.example .env
# 编辑 .env，填入你的 Anthropic API Key
```

### 2. 启动后端

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

### 4. 打开浏览器

```
http://localhost:3000
```

## 🎯 比赛演示流程

1. **首页**: 展示森友镇地图，选择场景
2. **对话**: 点击麦克风，与 NPC 自然对话
3. **评分**: 右侧实时显示发音评分
4. **总结**: 对话结束后查看课后报告

## 📁 项目结构

```
SpeakForest/
├── frontend/                 # Next.js + TailwindCSS
│   └── src/
│       ├── app/              # 页面路由
│       ├── components/       # UI 组件
│       ├── store/            # Zustand 状态管理
│       └── lib/              # API 工具
│
├── backend/                  # FastAPI
│   ├── main.py               # API 路由
│   ├── ai_agent.py           # AI 交互 (Claude + Whisper)
│   ├── database.py           # SQLite 数据层
│   └── requirements.txt
│
└── README.md
```

## 🛠️ 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Next.js 14, TailwindCSS, Zustand |
| 后端 | FastAPI, Python 3.11 |
| AI 对话 | Claude (claude-opus-4-5) |
| 语音转文字 | Web Speech API + Whisper |
| 数据库 | SQLite |

## 💡 无 API Key 演示模式

即使没有配置 API Key，应用也会自动降级到**演示模式**：
- 使用预设的 NPC 回复脚本
- 生成模拟的发音评分数据
- 完整展示 UI/UX 流程

