# AI 旅行规划助手

基于 Supabase 全栈架构的智能旅行规划应用，使用 AI 大模型自动生成个性化旅行计划。

## 特性

- 🤖 **AI 智能规划**：基于 GPT-4/Kimi 大模型，根据需求自动生成详细行程
- 🗺️ **地图可视化**：集成高德地图，直观展示景点位置和路线
- 💰 **预算管理**：智能记账，实时追踪旅行开销
- 🎤 **语音记录**：支持语音输入需求和记录费用（可选）
- 🔐 **安全可靠**：基于 Supabase 的行级安全策略，数据完全隔离
- 📱 **响应式设计**：完美适配桌面和移动设备

## 技术栈

- **前端**：Next.js 15, TypeScript, Ant Design, Tailwind CSS
- **后端**：Supabase (PostgreSQL + Edge Functions)
- **AI 模型**：OpenAI GPT-4 / Moonshot Kimi
- **地图**：高德地图 JS API
- **状态管理**：Zustand
- **部署**：Vercel (前端) + Supabase (后端)

## 快速开始

### 前置要求

- Node.js 18+
- npm 或 yarn
- Supabase 账号
- OpenAI/Kimi API Key
- 高德地图 API Key

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <your-repo-url>
   cd AI-Travel-Planner
   ```

2. **安装前端依赖**
   ```bash
   cd frontend
   npm install
   ```

3. **配置环境变量**
   
   复制 `.env.local.example` 为 `.env.local` 并填入配置：
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_AMAP_KEY=your_amap_js_api_key
   ```

4. **配置 Supabase**
   
   - 创建 Supabase 项目
   - 在 SQL Editor 中执行 `supabase/schema.sql`
   - 配置 Edge Functions Secrets
   - 部署 Edge Functions
   
   详细步骤请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)

5. **启动开发服务器**
   ```bash
   npm run dev
   ```
   
   访问 `http://localhost:3000`

## 部署指南

完整的部署指南请参阅 [DEPLOYMENT.md](./DEPLOYMENT.md)，包括：

- ✅ Supabase 项目创建和配置
- ✅ 数据库表结构设置
- ✅ Edge Functions 部署
- ✅ 第三方 API 配置（OpenAI、高德地图等）
- ✅ 前端部署到 Vercel
- ✅ 常见问题解决

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

## 功能展示

### 1. 智能行程生成

用户输入目的地、日期和需求描述，AI 自动生成包含景点、餐厅、交通等的完整行程计划。

### 2. 地图可视化

在地图上标注所有活动地点，直观查看位置分布和路线。

### 3. 费用管理

手动或语音记录每笔开销，实时统计总支出和预算剩余。

### 4. 行程管理

查看所有历史行程，支持编辑和删除，行程状态跟踪。

## 开发路线图

- [x] 基础行程生成功能
- [x] 地图集成
- [x] 费用记录
- [x] 用户认证
- [ ] 语音识别完整集成
- [ ] 行程分享功能
- [ ] 多人协作规划
- [ ] 移动端 App
- [ ] 离线支持

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 致谢

- [Supabase](https://supabase.com) - 提供强大的 BaaS 平台
- [Next.js](https://nextjs.org) - React 框架
- [OpenAI](https://openai.com) - AI 模型支持
- [高德地图](https://lbs.amap.com) - 地图服务

