# Supabase 详细操作指南

本文档提供逐步的 Supabase 配置和部署操作说明。

---

## 📋 目录

1. [创建 Supabase 项目](#1-创建-supabase-项目)
2. [配置数据库](#2-配置数据库)
3. [配置认证设置](#3-配置认证设置)
4. [配置 Edge Functions 环境变量](#4-配置-edge-functions-环境变量)
5. [部署 Edge Functions](#5-部署-edge-functions)
6. [测试功能](#6-测试功能)
7. [常见问题解决](#7-常见问题解决)

---

## 1. 创建 Supabase 项目

### 步骤 1.1：注册和登录

1. 打开浏览器，访问：https://supabase.com
2. 点击右上角 **"Sign Up"** 按钮
3. 选择注册方式：
   - 使用 GitHub 账号（推荐，更快速）
   - 使用邮箱注册
4. 完成注册后，会自动跳转到控制台

### 步骤 1.2：创建新项目

1. 在 Supabase Dashboard 中，点击 **"New Project"**
2. 填写项目信息：
   ```
   Organization: 选择或创建一个组织
   Project Name: AI-Travel-Planner
   Database Password: 设置一个强密码（务必保存！）
   Region: 选择 Northeast Asia (Tokyo) 或 Southeast Asia (Singapore)
   Pricing Plan: Free（免费版足够开发使用）
   ```
3. 点击 **"Create new project"**
4. 等待 2-3 分钟，项目创建完成

### 步骤 1.3：获取项目凭证

项目创建完成后：

1. 在左侧菜单点击 **"Project Settings"**（设置图标 ⚙️）
2. 点击 **"API"** 标签
3. 复制以下信息并保存：

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3Mi...（很长的字符串）
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3Mi...（不要在前端使用！）
```

4. 在项目根目录的 `frontend/.env.local` 文件中填入：

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

---

## 2. 配置数据库

### 步骤 2.1：打开 SQL 编辑器

1. 在 Supabase Dashboard 左侧菜单，点击 **"SQL Editor"**
2. 点击 **"New Query"** 按钮

### 步骤 2.2：执行数据库脚本

1. 打开项目中的文件：`supabase/schema.sql`
2. 复制整个文件内容
3. 粘贴到 SQL 编辑器中
4. 点击右下角的 **"Run"** 按钮（或按 Cmd/Ctrl + Enter）
5. 等待执行完成，应该看到绿色的成功提示：
   ```
   Success. No rows returned
   ```

### 步骤 2.3：验证表创建

1. 在左侧菜单点击 **"Table Editor"**
2. 确认以下表已创建：
   - ✅ `profiles`
   - ✅ `trips`
   - ✅ `activities`
   - ✅ `expenses`

3. 点击任意表名，查看列结构，例如 `trips` 表应该有：
   - id (uuid)
   - user_id (uuid)
   - title (text)
   - destination (text)
   - start_date (date)
   - end_date (date)
   - budget (numeric)
   - status (text)
   - created_at (timestamptz)
   - updated_at (timestamptz)

### 步骤 2.4：验证 RLS 策略

1. 在 Table Editor 中选择 `trips` 表
2. 点击右上角的盾牌图标 **"RLS"**
3. 确认 RLS 已启用（显示 "RLS enabled"）
4. 应该看到 4 条策略：
   - Users can view their own trips
   - Users can create their own trips
   - Users can update their own trips
   - Users can delete their own trips

---

## 3. 配置认证设置

### 步骤 3.1：配置邮箱认证

1. 在左侧菜单点击 **"Authentication"**
2. 点击 **"Providers"** 标签
3. 找到 **"Email"**，确认已启用

### 步骤 3.2：配置重定向 URL

1. 点击 **"URL Configuration"** 标签
2. 填写以下配置：

```
Site URL: http://localhost:3000
Redirect URLs:
  - http://localhost:3000/**
  - http://localhost:3000/auth/callback
```

3. 点击 **"Save"**

### 步骤 3.3：（可选）禁用邮箱验证（仅开发环境）

如果你在开发环境中不想配置邮箱服务器，可以临时禁用邮箱验证：

1. 在 **"Authentication"** → **"Providers"** 中
2. 点击 **"Email"**
3. 找到 **"Confirm email"** 选项
4. 关闭此开关
5. 点击 **"Save"**

**⚠️ 警告：生产环境必须启用邮箱验证！**

### 步骤 3.4：配置邮件模板（生产环境）

1. 点击 **"Email Templates"** 标签
2. 编辑 **"Confirm signup"** 模板
3. 可以自定义邮件内容和样式
4. 测试邮件发送

---

## 4. 配置 Edge Functions 环境变量

### 步骤 4.1：安装 Supabase CLI

**macOS:**
```bash
brew install supabase/tap/supabase
```

**Windows:**
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Linux:**
```bash
brew install supabase/tap/supabase
# 或者
npm install -g supabase
```

验证安装：
```bash
supabase --version
```

### 步骤 4.2：登录 Supabase CLI

```bash
supabase login
```

这会打开浏览器，点击 **"Authorize"** 授权。

### 步骤 4.3：关联项目

1. 获取 Project Reference ID：
   - 在 Supabase Dashboard
   - **"Project Settings"** → **"General"**
   - 复制 **"Reference ID"**（例如：`abcdefghijklm`）

2. 在项目根目录执行：
```bash
cd /Users/kurfuerst/Coding/AI-SE/AI-Travel-Planner
supabase link --project-ref YOUR_PROJECT_REF_ID
```

### 步骤 4.4：配置 Secrets（重要！）

Edge Functions 需要以下 API Keys：

#### 4.4.1 配置 AI API Key

**选项 A：使用 Kimi（推荐，国内访问）**

1. 访问：https://platform.moonshot.cn/
2. 注册并登录
3. 点击 **"API Keys"** → **"创建新密钥"**
4. 复制 API Key（格式：`sk-...`）
5. 在终端执行：
```bash
supabase secrets set KIMI_API_KEY="sk-your-kimi-api-key-here"
```

**选项 B：使用 OpenAI GPT-4**

1. 访问：https://platform.openai.com/api-keys
2. 登录并创建 API Key
3. 在终端执行：
```bash
supabase secrets set OPENAI_API_KEY="sk-your-openai-api-key-here"
```

#### 4.4.2 配置高德地图 API Key

1. 访问：https://console.amap.com/
2. 登录并进入控制台
3. **"应用管理"** → **"我的应用"** → **"创建新应用"**
4. 填写应用信息：
   ```
   应用名称: AI旅行规划助手
   应用类型: Web端
   ```
5. 创建应用后，点击 **"添加 Key"**
6. 创建两个 Key：

   **Key 1: Web 服务 API**（用于后端）
   ```
   Key 名称: Web服务API
   服务平台: Web服务
   ```
   复制此 Key，执行：
   ```bash
   supabase secrets set AMAP_KEY="your-web-service-key"
   ```

   **Key 2: Web 端（JS API）**（用于前端）
   ```
   Key 名称: Web端JSAPI
   服务平台: Web端(JS API)
   ```
   复制此 Key，填入 `frontend/.env.local`：
   ```env
   NEXT_PUBLIC_AMAP_KEY="your-js-api-key"
   ```

#### 4.4.3 验证 Secrets 配置

```bash
supabase secrets list
```

应该看到：
```
KIMI_API_KEY (or OPENAI_API_KEY)
AMAP_KEY
```

---

## 5. 部署 Edge Functions

### 步骤 5.1：部署 generate-trip 函数

```bash
cd /Users/kurfuerst/Coding/AI-SE/AI-Travel-Planner
supabase functions deploy generate-trip
```

等待部署完成，应该看到：
```
✓ Deployed Function generate-trip
```

### 步骤 5.2：部署 record-expense-voice 函数

```bash
supabase functions deploy record-expense-voice
```

### 步骤 5.3：验证部署

1. 在 Supabase Dashboard，点击 **"Edge Functions"**
2. 应该看到两个函数，状态为 **"Active"**：
   - `generate-trip`
   - `record-expense-voice`

### 步骤 5.4：查看函数日志

点击任意函数名 → **"Logs"** 标签，可以查看实时日志。

---

## 6. 测试功能

### 步骤 6.1：启动前端应用

```bash
cd frontend
npm run dev
```

访问：http://localhost:3000

### 步骤 6.2：测试用户注册

1. 点击 **"注册"**
2. 填写：
   ```
   用户名: testuser
   邮箱: test@example.com
   密码: test123456
   ```
3. 点击 **"注册"**

如果启用了邮箱验证，需要：
1. 到 Supabase Dashboard → **"Authentication"** → **"Users"**
2. 找到刚注册的用户
3. 点击右侧的三个点 → **"Confirm Email"**

### 步骤 6.3：测试登录

1. 使用注册的邮箱和密码登录
2. 应该跳转到首页，看到 **"我的行程"** 和 **"创建新行程"** 按钮

### 步骤 6.4：测试创建行程

1. 点击 **"创建新行程"**
2. 填写：
   ```
   目的地: 日本东京
   出行日期: 选择未来的日期范围
   预算: 5000
   详细描述: 我想去东京旅游5天，喜欢动漫、美食和购物。想去秋叶原、涩谷、浅草寺等地方。
   ```
3. 点击 **"生成行程"**
4. 等待 15-30 秒（AI 生成需要时间）
5. 成功后会自动跳转到行程详情页

### 步骤 6.5：检查数据库

在 Supabase Dashboard → **"Table Editor"**：

1. 检查 `trips` 表，应该有一条新记录
2. 检查 `activities` 表，应该有多条活动记录

### 步骤 6.6：测试费用记录

1. 在行程详情页，点击 **"记录费用"**
2. 填写：
   ```
   金额: 50
   分类: 交通
   备注: 打车费用
   ```
3. 点击 **"保存"**
4. 应该在右侧费用统计中看到新增的记录

---

## 7. 常见问题解决

### 问题 1：Edge Function 调用失败

**症状：** 点击"生成行程"后报错："AI API 调用失败"

**解决方法：**

1. 检查 Secrets 是否配置：
   ```bash
   supabase secrets list
   ```

2. 查看函数日志：
   - Dashboard → Edge Functions → 选择函数 → Logs

3. 验证 API Key 是否有效：
   ```bash
   # 测试 Kimi API
   curl https://api.moonshot.cn/v1/models \
     -H "Authorization: Bearer YOUR_KIMI_KEY"
   
   # 测试 OpenAI API
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer YOUR_OPENAI_KEY"
   ```

### 问题 2：数据库权限错误

**症状：** "new row violates row-level security policy"

**解决方法：**

1. 确认用户已登录（检查浏览器控制台）
2. 重新执行 `schema.sql`：
   ```sql
   -- 在 SQL Editor 中执行
   DROP POLICY IF EXISTS "Users can create their own trips" ON trips;
   
   CREATE POLICY "Users can create their own trips"
     ON public.trips FOR INSERT
     WITH CHECK (auth.uid() = user_id);
   ```

### 问题 3：地图不显示

**症状：** 行程详情页地图区域空白

**解决方法：**

1. 检查浏览器控制台是否有错误
2. 验证 `NEXT_PUBLIC_AMAP_KEY` 是否正确配置
3. 在高德控制台添加域名白名单：
   - 开发环境：`localhost`
   - 生产环境：你的域名

4. 检查活动数据是否有经纬度：
   ```sql
   SELECT id, name, latitude, longitude 
   FROM activities 
   WHERE trip_id = 'YOUR_TRIP_ID';
   ```

### 问题 4：Supabase CLI 命令失败

**症状：** `supabase: command not found`

**解决方法：**

重新安装 CLI：
```bash
npm uninstall -g supabase
npm install -g supabase
```

或使用 npx：
```bash
npx supabase login
npx supabase functions deploy generate-trip
```

### 问题 5：AI 生成的行程格式错误

**症状：** "AI 返回的数据格式不正确"

**解决方法：**

1. 查看函数日志，查看 AI 的原始响应
2. 可能需要调整 Prompt，在 `generate-trip/index.ts` 中修改
3. 或者降低用户需求的复杂度，使用更简单的描述

---

## 8. 生产环境部署

### 步骤 8.1：部署前端到 Vercel

1. 提交代码到 GitHub：
   ```bash
   git add .
   git commit -m "feat: complete implementation"
   git push
   ```

2. 访问：https://vercel.com
3. 点击 **"Import Project"**
4. 选择你的 GitHub 仓库
5. 配置环境变量：
   ```
   NEXT_PUBLIC_SUPABASE_URL=你的Supabase URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase Anon Key
   NEXT_PUBLIC_AMAP_KEY=你的高德JS API Key
   ```
6. 点击 **"Deploy"**

### 步骤 8.2：更新 Supabase 配置

1. 获取 Vercel 域名（如：`your-app.vercel.app`）
2. 在 Supabase Dashboard：
   - **Authentication** → **URL Configuration**
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/**`

3. 在高德控制台：
   - 添加域名到 JS API Key 的白名单

### 步骤 8.3：启用邮箱验证

在生产环境，务必启用邮箱验证：
- **Authentication** → **Providers** → **Email**
- 启用 **"Confirm email"**

---

## 9. 监控和维护

### 查看使用情况

Dashboard → **"Usage"**
- 数据库大小
- API 请求次数
- Edge Functions 调用次数

### 查看日志

- **Database** → **"Logs"**：数据库查询日志
- **Edge Functions** → **"Logs"**：函数执行日志
- **Authentication** → **"Logs"**：认证事件日志

### 备份数据

```bash
# 导出数据库
supabase db dump -f backup.sql

# 恢复数据库
supabase db reset
psql -f backup.sql
```

---

## 10. 下一步

- [ ] 集成科大讯飞语音识别
- [ ] 添加行程分享功能
- [ ] 实现多人协作
- [ ] 添加更多 AI 功能（景点推荐、美食推荐等）
- [ ] 性能优化和缓存策略

---

**需要帮助？**
- Supabase 文档：https://supabase.com/docs
- Supabase Discord：https://discord.supabase.com
- 项目 Issues：提交到你的 GitHub 仓库

