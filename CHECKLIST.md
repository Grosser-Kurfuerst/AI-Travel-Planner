# AI 旅行规划助手 - 部署任务清单

使用此清单确保所有配置步骤都已完成。

---

## ✅ Supabase 配置

### 1. 创建项目
- [ ] 访问 https://supabase.com 并登录
- [ ] 创建新项目 "AI-Travel-Planner"
- [ ] 选择合适的区域（Tokyo 或 Singapore）
- [ ] 保存数据库密码

### 2. 获取凭证
- [ ] 复制 Project URL
- [ ] 复制 anon/public key
- [ ] 填入 `frontend/.env.local`

### 3. 配置数据库
- [ ] 打开 SQL Editor
- [ ] 执行 `supabase/schema.sql` 脚本
- [ ] 验证 4 个表已创建：profiles, trips, activities, expenses
- [ ] 确认 RLS 策略已启用

### 4. 配置认证
- [ ] 启用 Email 认证
- [ ] 配置 Redirect URLs: `http://localhost:3000/**`
- [ ] （可选）开发环境临时禁用邮箱验证

### 5. 安装 Supabase CLI
- [ ] 安装 CLI: `brew install supabase/tap/supabase`
- [ ] 登录: `supabase login`
- [ ] 关联项目: `supabase link --project-ref YOUR_REF`

### 6. 配置 Secrets
- [ ] 配置 AI API Key:
  - [ ] Kimi: `supabase secrets set KIMI_API_KEY="sk-..."`
  - [ ] 或 OpenAI: `supabase secrets set OPENAI_API_KEY="sk-..."`
- [ ] 配置高德地图 Web 服务 Key: `supabase secrets set AMAP_KEY="..."`
- [ ] 验证: `supabase secrets list`

### 7. 部署 Edge Functions
- [ ] 部署 generate-trip: `supabase functions deploy generate-trip`
- [ ] 部署 record-expense-voice: `supabase functions deploy record-expense-voice`
- [ ] 在 Dashboard 中确认函数状态为 "Active"

---

## 🎨 第三方 API 配置

### OpenAI / Kimi API
- [ ] 注册账号
  - [ ] Kimi: https://platform.moonshot.cn/
  - [ ] 或 OpenAI: https://platform.openai.com/
- [ ] 创建 API Key
- [ ] 添加到 Supabase Secrets

### 高德地图 API
- [ ] 访问 https://console.amap.com/
- [ ] 创建应用
- [ ] 创建 Web 服务 API Key（用于后端）
  - [ ] 添加到 Supabase Secrets
- [ ] 创建 Web 端 JS API Key（用于前端）
  - [ ] 添加到 `frontend/.env.local`
  - [ ] 添加域名白名单: `localhost`

---

## 💻 前端配置

### 1. 安装依赖
- [ ] `cd frontend`
- [ ] `npm install`

### 2. 配置环境变量
- [ ] 复制 `.env.local.example` 为 `.env.local`
- [ ] 填入 Supabase URL
- [ ] 填入 Supabase Anon Key
- [ ] 填入高德地图 JS API Key

### 3. 运行检查
- [ ] `node check-env.js`
- [ ] 确认所有检查通过

---

## 🧪 功能测试

### 1. 启动应用
- [ ] 运行 `./start.sh` 或 `cd frontend && npm run dev`
- [ ] 访问 http://localhost:3000

### 2. 测试认证
- [ ] 注册新账号
- [ ] （如需要）在 Supabase Dashboard 验证邮箱
- [ ] 登录成功

### 3. 测试行程生成
- [ ] 点击"创建新行程"
- [ ] 填写完整信息（目的地、日期、预算、详细描述）
- [ ] 点击"生成行程"
- [ ] 等待 15-30 秒
- [ ] 成功跳转到行程详情页

### 4. 验证数据
- [ ] 在 Supabase Table Editor 中查看 `trips` 表
- [ ] 查看 `activities` 表，确认有活动记录
- [ ] 确认每个活动有地理位置信息（latitude/longitude）

### 5. 测试地图
- [ ] 在行程详情页查看地图
- [ ] 确认景点标记正确显示
- [ ] 地图可以正常缩放和移动

### 6. 测试费用记录
- [ ] 点击"记录费用"
- [ ] 填写金额、分类、备注
- [ ] 保存成功
- [ ] 在费用统计中看到更新

---

## 🚀 生产环境部署（可选）

### Vercel 部署
- [ ] 提交代码到 GitHub
- [ ] 在 Vercel 导入项目
- [ ] 配置环境变量
- [ ] 部署成功
- [ ] 获取生产域名

### 更新配置
- [ ] 在 Supabase 更新 Redirect URLs
- [ ] 在高德地图添加生产域名到白名单
- [ ] 启用邮箱验证

---

## 📊 监控和维护

- [ ] 定期查看 Supabase Usage
- [ ] 查看 Edge Functions Logs
- [ ] 备份重要数据
- [ ] 监控 API 配额使用情况

---

## 🐛 常见问题排查

如果遇到问题，按以下顺序检查：

1. **Edge Function 调用失败**
   - [ ] 检查 Secrets 是否配置正确
   - [ ] 查看函数 Logs
   - [ ] 测试 API Key 是否有效

2. **数据库权限错误**
   - [ ] 确认用户已登录
   - [ ] 重新执行 RLS 策略 SQL

3. **地图不显示**
   - [ ] 检查 JS API Key 是否正确
   - [ ] 确认域名在白名单中
   - [ ] 查看浏览器控制台错误

4. **AI 生成失败**
   - [ ] 查看 Edge Function Logs
   - [ ] 确认 API Key 有余额
   - [ ] 尝试简化用户输入

---

## 📝 备注

完成日期: __________

部署人员: __________

项目 URL: __________

备注:

