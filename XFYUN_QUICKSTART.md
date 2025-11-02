# 科大讯飞语音识别 - 快速配置

## 1分钟快速配置指南

### 第一步：获取科大讯飞凭证（5分钟）

1. **注册账号**
   - 访问：https://www.xfyun.cn/
   - 点击"注册/登录" → 手机号注册

2. **创建应用**
   - 登录后进入控制台：https://console.xfyun.cn/
   - 点击"创建新应用"
   - 应用名称：AI旅行规划（随意）
   - 应用平台：Web

3. **开通服务**
   - 在应用中添加"语音听写（流式版）"服务
   - 免费开通，无需付费

4. **获取凭证**
   - 在应用详情页找到"接口认证信息"
   - 复制三个值：
     - APPID
     - APIKey
     - APISecret

### 第二步：配置项目（1分钟）

编辑 `frontend/.env.local` 文件：

```bash
# 添加以下三行（替换为你的真实凭证）
NEXT_PUBLIC_XFYUN_APP_ID=你的APPID
NEXT_PUBLIC_XFYUN_API_KEY=你的APIKey
NEXT_PUBLIC_XFYUN_API_SECRET=你的APISecret
```

### 第三步：重启服务器

```bash
# 停止当前服务器（Ctrl+C）
# 重新启动
cd frontend
npm run dev
```

### 第四步：测试

1. 访问：http://localhost:3000/plan
2. 点击"语音输入"按钮
3. 允许麦克风权限
4. 开始说话测试！

## 常见问题

**Q: 提示"语音识别服务未配置"？**
A: 检查环境变量是否正确配置，确保重启了服务器。

**Q: WebSocket连接失败？**
A: 检查APPID/APIKey/APISecret是否正确，确保在控制台开通了服务。

**Q: 识别不准确？**
A: 在安静环境中使用，说普通话，语速适中。

## 详细文档

查看完整配置指南：[XFYUN_SETUP_GUIDE.md](./XFYUN_SETUP_GUIDE.md)

## 技术优势

✅ 无需VPN，国内直连
✅ 识别准确度高
✅ 免费额度充足（每日500次）
✅ 支持实时转写
✅ 智能字段提取

开始使用吧！🎤

