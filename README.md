# AI 旅行规划助手

基于 Supabase 全栈架构的智能旅行规划应用，使用 AI 大模型自动生成个性化旅行计划。

## 特性

- **AI 智能规划**：基于 Kimi 大模型，根据需求自动生成详细行程
- **地图可视化**：集成高德地图，直观展示景点位置和路线
- **预算管理**：智能记账，实时追踪旅行开销
- **语音输入**：支持科大讯飞语音识别，智能提取目的地、日期、预算等信息
- **智能解析**：自动从语音中识别结构化信息，自动填充表单字段
- **安全可靠**：基于 Supabase 的行级安全策略，数据完全隔离
- **响应式设计**：完美适配桌面和移动设备

## 技术栈

- **前端**：Next.js 15, TypeScript, Ant Design, Tailwind CSS
- **后端**：Supabase (PostgreSQL + Edge Functions)
- **语音识别**：科大讯飞语音听写（WebSocket实时）
- **AI 模型**：Moonshot Kimi
- **地图**：高德地图 JS API
- **状态管理**：Zustand
- **部署**：Vercel (前端) + Supabase (后端)

## 快速开始

### 前置要求

- Node.js 18+
- npm 或 yarn
- Supabase 账号
- 科大讯飞 API 凭证（用于语音识别功能）
- Kimi API Key
- 高德地图 API Key

### 详细步骤

#### 1. 克隆项目
```bash
git clone <your-repo-url>
cd AI-Travel-Planner
```

#### 2. 配置 Supabase（必读！）

**请仔细阅读并按照 [SUPABASE_GUIDE.md](./SUPABASE_GUIDE.md) 进行配置**

包括：
- 创建 Supabase 项目
- 执行数据库 SQL 脚本
- 配置 Edge Functions Secrets
- 部署 Edge Functions

#### 3. 安装前端依赖
```bash
cd frontend
npm install
```

#### 4. 配置前端环境变量

复制示例文件：
```bash
cp frontend/.env.local.example frontend/.env.local
```

编辑 `frontend/.env.local`，填入你的配置：
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
NEXT_PUBLIC_AMAP_KEY=your_amap_js_api_key
```

#### 5. 检查配置
```bash
node check-env.js
```

如果所有检查通过，继续下一步。

#### 6. 启动开发服务器

**方式 1：使用快速启动脚本（推荐）**
```bash
./start.sh
```

**方式 2：手动启动**
```bash
cd frontend
npm run dev
```

访问 `http://localhost:3000`

### 第一次使用

1. **注册账号**
   - 访问首页，点击"注册"
   - 填写邮箱和密码
   - 如果启用了邮箱验证，需要验证邮箱

2. **创建第一个行程**
   - 登录后点击"创建新行程"
   - 填写目的地、日期、预算
   - 在"详细描述"中：
     - **方式 1**：手动输入旅行需求
     - **方式 2**：点击 🎤 "语音输入"按钮，说出您的需求（推荐）
   - 详细描述示例：
     ```
     我想去日本东京旅游5天，喜欢动漫文化和美食。
     希望去秋叶原、涩谷、新宿等地方。
     想品尝地道的拉面和寿司。
     预算5000元左右。
     ```
   - 点击"生成行程"，等待 15-30 秒

3. **查看行程**
   - 生成完成后自动跳转到行程详情页
   - 查看每日活动安排
   - 在地图上查看景点位置

4. **记录费用**
   - 在行程详情页点击"记录费用"
   - 填写金额、分类和备注
   - 实时查看预算使用情况

## 部署指南

完整的部署指南请参阅 [DEPLOYMENT.md](./DEPLOYMENT.md)，包括：

- Supabase 项目创建和配置
- 数据库表结构设置
- Edge Functions 部署
- 第三方 API 配置（OpenAI、高德地图等）
- 前端部署到 Vercel
- 常见问题解决

## 项目结构

```
AI-Travel-Planner/
├── frontend/                 # Next.js 前端应用
│   ├── app/                 # 页面路由
│   ├── lib/                 # 工具库
│   ├── hooks/               # React Hooks
│   └── store/               # 状态管理
├── supabase/                # Supabase 配置
│   ├── schema.sql           # 数据库结构
│   └── functions/           # Edge Functions
│       ├── generate-trip/   # 生成行程
│       └── record-expense-voice/  # 语音记账
└── DEPLOYMENT.md            # 详细部署指南
```


