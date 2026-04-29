# 钱包登录 + 对话历史持久化功能

## 功能概述

本次更新为 Web3 AI Agent 添加了：
1. **钱包登录**：支持 MetaMask、WalletConnect 等主流钱包
2. **个人信息展示**：显示钱包地址、ENS 域名、头像
3. **对话历史云端持久化**：使用 Supabase 存储，支持跨设备同步

## 前置准备

### 1. 获取 WalletConnect Project ID

访问 https://cloud.walletconnect.com 注册并创建项目，获取 Project ID。

### 2. 创建 Supabase 项目

1. 访问 https://supabase.com 注册账号
2. 创建新项目
3. 在项目设置中获取：
   - Project URL
   - anon public key

### 3. 初始化数据库

在 Supabase SQL Editor 中执行 `supabase/init.sql` 脚本。

### 4. 配置环境变量

复制 `.env.example` 为 `.env.local` 并填写：

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000

## 技术栈

- **钱包连接**：RainbowKit v2 + Wagmi v2 + Viem v2
- **云端数据库**：Supabase (PostgreSQL)
- **状态管理**：React Query v5
- **框架**：Next.js 14 (App Router)

## 数据结构

### conversations 表
- `id`: UUID
- `wallet_address`: 钱包地址（0x 开头 42 字符）
- `title`: 对话标题
- `created_at`: 创建时间
- `updated_at`: 更新时间

### messages 表
- `id`: UUID
- `conversation_id`: 关联对话 ID
- `role`: 消息角色（user/assistant/system）
- `content`: 消息内容
- `metadata`: 扩展字段（timestamp, toolCalls, isError）
- `created_at`: 创建时间

## 功能特性

### 钱包连接
- ✅ 支持 MetaMask、WalletConnect、Coinbase Wallet 等
- ✅ 显示 ENS 域名和头像（如有）
- ✅ 地址复制、区块浏览器跳转
- ✅ 网络切换提示

### 对话同步
- ✅ 钱包连接后自动加载历史
- ✅ 消息发送后自动保存到云端
- ✅ 切换钱包自动切换对话历史
- ✅ 断开连接清空内存历史

### 降级策略
- ✅ Supabase 不可用时降级到本地
- ✅ 网络超时自动中断
- ✅ 错误友好提示

## 下一步计划

- [ ] 对话历史列表侧边栏
- [ ] 新建/删除对话功能
- [ ] 离线缓存支持
- [ ] 多对话管理

## 注意事项

1. **国内网络**：Supabase 可能需要代理访问
2. **免费额度**：Supabase 免费套餐 500MB 存储
3. **隐私安全**：仅存储钱包地址，不存储私钥/签名
