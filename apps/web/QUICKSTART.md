# 快速启动指南

## 启动项目

### 1. 进入正确目录

```bash
cd d:\2026\code\AI-Agent\apps\web
```

### 2. 启动开发服务器

```bash
pnpm dev
```

### 3. 访问应用

打开浏览器访问：**http://localhost:3000**

---

## 常见问题

### Q1: `indexedDB is not defined` 错误

**原因**：RainbowKit 在服务端渲染时尝试访问浏览器 API

**解决**：已修复，Providers 组件现在会等待客户端挂载后再渲染钱包功能

### Q2: 模块找不到错误

**解决**：确保在 `apps/web` 目录下执行命令，而不是项目根目录

### Q3: 钱包连接失败

**检查清单**：
1. ✅ 已配置 `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
2. ✅ 已安装 MetaMask 或其他钱包插件
3. ✅ 浏览器支持 Web3 钱包

---

## 功能验证

### 测试钱包连接

1. 访问 http://localhost:3000
2. 点击右上角"连接钱包"按钮
3. 选择 MetaMask 或其他钱包
4. 确认连接

### 测试对话保存

1. 连接钱包后，发送一条消息
2. 刷新页面
3. 对话历史应该自动恢复

---

## 环境变量检查

确保 `.env.local` 文件包含：

```bash
# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 技术支持

如遇问题，请检查：
- 终端是否有错误输出
- 浏览器控制台是否有报错
- 环境变量是否正确配置
