# AI 旅行规划助手 - 部署指南

## 项目概述

这是一个基于 Supabase 全栈架构的 AI 旅行规划应用，使用 Next.js 作为前端框架，Supabase 提供后端服务（数据库、认证、Edge Functions）。

## 技术栈

### 前端
- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **UI 库**: Ant Design
- **状态管理**: Zustand
- **地图**: 高德地图 JS API
- **样式**: Tailwind CSS

### 后端
- **BaaS 平台**: Supabase
- **数据库**: PostgreSQL
- **认证**: Supabase Auth
- **Serverless 函数**: Supabase Edge Functions (Deno)

### 第三方服务
- **大语言模型**: OpenAI GPT-4 / Kimi
- **地图服务**: 高德地图
- **语音识别**: 科大讯飞（可选）

---

## Supabase 配置步骤

### 1. 创建 Supabase 项目

1. 访问 [https://supabase.com](https://supabase.com) 并登录
2. 点击 "New Project" 创建新项目
3. 填写项目信息：
   - **Project Name**: AI-Travel-Planner
   - **Database Password**: 设置一个强密码（请保存好）
   - **Region**: 选择��您最近的区域（建议选择 Northeast Asia (Tokyo) 或 Southeast Asia (Singapore)）
4. 等待项目创建完成（约 2 分钟）

### 2. 获取项目凭证

项目创建完成后：

1. 进入项目主页
2. 点击左侧菜单的 "Project Settings" (设置图标)
3. 点击 "API" 选项卡
4. 复制以下信息：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: 以 `eyJ...` 开头的长字符串

### 3. 配置数据库

#### 方法一：使用 SQL 编辑器（推荐）

1. 在 Supabase 控制台左侧菜单点击 "SQL Editor"
2. 点击 "New Query"
3. 复制 `/Users/kurfuerst/Coding/AI-SE/AI-Travel-Planner/supabase/schema.sql` 文件的全部内容
4. 粘贴到编辑器中
5. 点击 "Run" 按钮执行 SQL
6. 确认所有语句执行成功（应该看到绿色的成功提示）

#### 验证数据库表

1. 点击左侧菜单的 "Table Editor"
2. 确认以下表已创建：
   - `profiles`
   - `trips`
   - `activities`
   - `expenses`

### 4. 配置 Edge Functions 密钥

Edge Functions 需要访问第三方 API，我们需要配置环境变量：

1. 在 Supabase 控制台，点击左侧菜单的 "Edge Functions"
2. 点击 "Manage secrets"
3. 添加以下密钥：

| 密钥名称 | 说明 | 获取方式 |
|---------|------|---------|
| `OPENAI_API_KEY` 或 `KIMI_API_KEY` | AI 模型 API Key | 从 [OpenAI](https://platform.openai.com/api-keys) 或 [Kimi](https://platform.moonshot.cn/) 获取 |
| `AMAP_KEY` | 高德地图 Web 服务 API Key | 从[高德开放平台](https://console.amap.com/)获取 |
| `XFYUN_APP_ID`<br>`XFYUN_API_KEY`<br>`XFYUN_API_SECRET` | 科大讯飞语音识别（可选��� | 从[科大讯飞开放平台](https://www.xfyun.cn/)获取 |

**添加密钥示例**：
```bash
# 在终端中使用 Supabase CLI 添加
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set AMAP_KEY=your_amap_key
```

### 5. 部署 Edge Functions

#### 安装 Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# 或使用 npm
npm install -g supabase
```

#### 登录 Supabase

```bash
supabase login
```

这会打开浏览器，请按提示完成登录。

#### 关联项目

```bash
cd /Users/kurfuerst/Coding/AI-SE/AI-Travel-Planner
supabase link --project-ref YOUR_PROJECT_REF
```

**获取 PROJECT_REF**：
- 在 Supabase 控制台的 Project Settings → General → Reference ID

#### 部署函数

```bash
# 部署 generate-trip 函数
supabase functions deploy generate-trip

# 部署 record-expense-voice 函数
supabase functions deploy record-expense-voice
```

#### 验证部署

1. 在 Supabase 控制台的 "Edge Functions" 页面
2. 确认看到两个函数：
   - `generate-trip`
   - `record-expense-voice`
3. 状态显示为 "Active"

---

## 前端配置步骤

### 1. 配置环境变量

编辑 `/Users/kurfuerst/Coding/AI-SE/AI-Travel-Planner/frontend/.env.local` 文件：

```env
# Supabase 配置（从步骤 2 获取）
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# 高德地图 JS API Key（前端使用）
NEXT_PUBLIC_AMAP_KEY=your_amap_js_api_key
```

**注意**：
- 高德地图需要两个 Key：
  - **Web 服务 API Key**：用于 Edge Functions（后端调用）
  - **Web 端（JS API）Key**：用于前端地图显示
- 两个 Key 需要分别在高德开放平台创建

### 2. 安装依赖并启动

```bash
cd /Users/kurfuerst/Coding/AI-SE/AI-Travel-Planner/frontend
npm install
npm run dev
```

应用将在 `http://localhost:3000` 启动。

---

## 第三方 API 配置指南

### OpenAI API

1. 访问 [https://platform.openai.com/signup](https://platform.openai.com/signup)
2. 注册并验证账号
3. 前往 [API Keys](https://platform.openai.com/api-keys)
4. 点击 "Create new secret key"
5. 复制密钥（只显示一次，请保存好）
6. 配置到 Supabase Secrets: `OPENAI_API_KEY`

### Kimi API（国内替代方案）

1. 访问 [https://platform.moonshot.cn/](https://platform.moonshot.cn/)
2. 注册并登录
3. 在控制台创建 API Key
4. 配置到 Supabase Secrets: `KIMI_API_KEY`

**Edge Function 修改**：如使用 Kimi，需修改 `generate-trip/index.ts` 中的 API 端点：

```typescript
// 将 OpenAI 端点
const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {

// 改为 Kimi 端点
const aiResponse = await fetch('https://api.moonshot.cn/v1/chat/completions', {
```

### 高德地图 API

#### 创建应用

1. 访问 [https://console.amap.com/](https://console.amap.com/)
2. 登录并进入控制台
3. 点击 "应用管理" → "我的应用" → "创建新应用"
4. 填写应用信息并提交

#### 添加 Key

为同一个应用添加两个 Key：

**Key 1: Web 服务 API**
- **Key 名称**: Web服务
- **服务平台**: Web服务
- 用途：Edge Functions 后端调用
- 配置到 Supabase Secrets: `AMAP_KEY`

**Key 2: Web 端（JS API）**
- **Key 名称**: Web端
- **服务平台**: Web端（JS API）
- 填写前端域名（开发时可填 `localhost`）
- 用途：前端地图显示
- 配置到前端环境变量: `NEXT_PUBLIC_AMAP_KEY`

### 科大讯飞语音识别（可选）

1. 访问 [https://www.xfyun.cn/](https://www.xfyun.cn/)
2. 注册并创建应用
3. 开通 "语音听写（流式版）" 服务
4. 获取 APPID、APIKey、APISecret
5. 配置到 Supabase Secrets

---

## 测试应用

### 1. 注册和登录

1. 访问 `http://localhost:3000`
2. 点击 "注册"
3. 填写邮箱和密码
4. 查收验证邮件（Supabase 默认会发送验证邮件）
5. 点击邮件中的链接完成验证
6. 返回应用并登录

**注意**：如果未收到邮件，请检查：
- 垃圾邮件文件夹
- Supabase 控制台 → Authentication → Email Templates
- 可以临时禁用邮箱验证：Authentication → Providers → Email → "Confirm email" 设为 OFF

### 2. 创建行程

1. 登录后点击 "创建新行程"
2. 填写：
   - 目的地：例如 "日本东京"
   - 出行日期：选择日期范围
   - 预算：例如 5000
   - 详细描述：例如 "我想去东京旅游5天，喜欢动漫和美食"
3. 点击 "生成行程"
4. 等待 AI 生成（可能需要 10-30 秒）
5. 自动跳转到行程详情页

### 3. 查看行程

- 行程列表：`/trips`
- 行程详情：点击任意行程卡片
- 查看地图上的景点标记
- 查看每日活动安排

### 4. 记录费用

1. 在行程详情页点击 "记录费用"
2. 填写金额、分类和备注
3. 查看费用统计和预算剩余

---

## 部署到生产环境

### 部署前端到 Vercel

1. 将代码推送到 GitHub
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. 访问 [https://vercel.com](https://vercel.com)
3. 点击 "Import Project"
4. 选择您的 GitHub 仓库
5. 配置环境变量（与 `.env.local` 相同）
6. 点击 "Deploy"

### 配置生产环境域名

1. Vercel 部署完成后，会提供一个域名（如 `your-app.vercel.app`）
2. 在高德地图控制台，将该域名添加到 Web 端（JS API）Key 的白名单中
3. 在 Supabase 控制台，Authentication → URL Configuration，添加：
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: `https://your-app.vercel.app/**`

---

## 常见问题

### Q1: Edge Function 调用失败

**检查清单**：
- 函数是否部署成功？（Supabase 控制台 Edge Functions 页面）
- Secrets 是否配置正确？（`supabase secrets list`）
- API Key 是否有效？（尝试直接调用 API 测试）
- 查看函数日志：Supabase 控制台 → Edge Functions → 选择函数 → Logs

### Q2: 数据库权限错误

**可能原因**：
- RLS 策略未正确配置
- 用户未登录或 token 过期

**解决方法**：
- 重新执行 `schema.sql`
- 检查浏览器控制台是否有认证错误
- 尝试退出登录再重新登录

### Q3: 地图不显示

**检查清单**：
- 高德地图 Key 是否正确配置？
- 域名是否在白名单中？
- 浏览器控制台是否有错误？
- 活动数据是否包含经纬度？

### Q4: AI 生成的行程不理想

**优化建议**：
- 提供更详细的描述（兴趣、偏好、人数等）
- 在 Edge Function 中调整 Prompt
- 调整 AI 模型参数（temperature、max_tokens）

---

## 项目结构

```
AI-Travel-Planner/
├── frontend/                 # Next.js 前端应用
│   ├── app/                 # App Router 页面
│   │   ├── page.tsx        # 首页
│   │   ├── auth/           # 认证页面
│   │   ├── plan/           # 创建行程
│   │   └── trips/          # 行程列表和详情
│   ├── lib/                # 工具库
│   │   └── supabaseClient.ts
│   ├── hooks/              # 自定义 Hooks
│   ├── store/              # Zustand 状态管理
│   └── .env.local          # 环境变量
└── supabase/                # Supabase 配置
    ├── schema.sql           # 数据库 Schema
    └── functions/           # Edge Functions
        ├── generate-trip/
        └── record-expense-voice/
```

---

## 下一步优化建议

1. **语音识别集成**：完整实现科大讯飞语音识别功能
2. **实时协作**：利用 Supabase Realtime 实现多人协作规划
3. **图片上传**：添加景点照片、票据照片等
4. **社交分享**：生成行程分享图片或链接
5. **离线支持**：使用 PWA 技术支持离线访问
6. **多语言支持**：i18n 国际化
7. **性能优化**：添加缓存、懒加载等

---

## 联系与支持

如有问题，请查阅：
- [Supabase 文档](https://supabase.com/docs)
- [Next.js 文档](https://nextjs.org/docs)
- [高德地图 API 文档](https://lbs.amap.com/api/javascript-api/summary)

