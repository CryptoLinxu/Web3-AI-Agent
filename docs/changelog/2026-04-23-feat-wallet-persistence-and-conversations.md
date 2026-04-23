# Changelog - 2026-04-23

## 任务信息
- **类型**: FEAT + PATCH
- **主题**: 钱包连接持久化与对话历史管理
- **Pipeline**: 问题修复迭代（多次 BUG 修复）
- **完成时间**: 2026-04-23 12:02

## 架构设计

### 目标
实现钱包连接跨页面刷新持久化，解决 SSR 环境下 walletConnect indexedDB 错误；新增对话历史管理功能，支持云端同步。

### 模块边界
- 新增 `apps/web/app/config.ts` - wagmi 配置（双配置策略）
- 新增 `apps/web/app/providers.tsx` - Web3 Provider 封装
- 新增 `apps/web/lib/supabase/` - Supabase 数据访问层
- 新增 `apps/web/components/ConversationHistory.tsx` - 对话历史侧边栏
- 新增 `apps/web/components/WalletConnectButton.tsx` - 钱包连接按钮
- 修改 `apps/web/app/layout.tsx` - 集成 SSR 状态提取
- 修改 `apps/web/app/page.tsx` - 对话管理逻辑

### 接口契约

```typescript
// config.ts - 双配置策略
export function getConfig(): Config  // SSR 基础配置（仅 injected）
export function getFullConfig(): Config  // 客户端完整配置（walletConnect + injected）

// conversations.ts - 对话管理
export async function createNewConversation(walletAddress: string, title?: string): Promise<string>
export async function getOrCreateConversation(walletAddress: string): Promise<string>
export async function loadMessages(conversationId: string): Promise<Message[]>
export async function saveMessages(conversationId: string, messages: Message[]): Promise<void>
export async function updateConversationTitle(id: string, title: string): Promise<void>
export function generateConversationTitle(message: string): string

// layout.tsx - SSR 状态提取
const initialState = cookieToInitialState(getConfig(), headers().get('cookie'))
```

### 数据流/状态流

**钱包连接持久化流程：**
1. 用户连接钱包 → wagmi 写入 cookie（cookieStorage）
2. 刷新页面 → layout.tsx 从 header 读取 cookie
3. cookieToInitialState 转换为 wagmi 初始状态
4. 传递给 WagmiProvider 的 initialState prop
5. wagmi 恢复连接状态，无需用户重新操作

**对话管理流程：**
1. 钱包连接 → 调用 getOrCreateConversation 获取/创建对话
2. 发送消息 → 后台异步保存到 Supabase
3. 第一条消息 → 自动生成标题并更新
4. 新建对话 → 创建新记录 + 增量更新侧边栏

### 风险点
- **walletConnect SSR 初始化**：walletConnect connector 在 SSR 阶段访问 indexedDB 会报错，采用双配置策略解决
- **cookie 大小限制**：cookie 有 4KB 限制，wagmi 只存储连接状态（connector 类型 + 地址），不会超标
- **Supabase 依赖**：对话持久化依赖 Supabase 服务，失败时降级到 localStorage（待实现）

## 变更详情

### 新增
- `apps/web/app/config.ts` - wagmi 双配置策略（SSR/客户端）
- `apps/web/app/providers.tsx` - Web3 Provider（WagmiProvider + RainbowKitProvider）
- `apps/web/lib/supabase/client.ts` - Supabase 客户端初始化
- `apps/web/lib/supabase/conversations.ts` - 对话和消息的数据访问层
- `apps/web/lib/supabase/types.ts` - Supabase 数据库类型定义
- `apps/web/components/ConversationHistory.tsx` - 对话历史侧边栏组件
- `apps/web/components/WalletConnectButton.tsx` - RainbowKit ConnectButton 封装
- `supabase/init.sql` - Supabase 数据库初始化脚本（conversations + messages 表）
- `apps/web/.eslintrc.json` - ESLint 配置
- `apps/web/QUICKSTART.md` - 快速启动指南
- `WALLET-LOGIN-SETUP.md` - 钱包登录配置文档

### 修改
- `apps/web/app/layout.tsx` - 从 Server Component 提取 cookie 状态，注入 WagmiProvider
- `apps/web/app/page.tsx` - 集成对话管理、标题生成、云端同步、侧边栏交互
- `apps/web/package.json` - 添加 @rainbow-me/rainbowkit, wagmi, @supabase/supabase-js 依赖
- `apps/web/.env.example` - 添加 WALLETCONNECT_PROJECT_ID 和 Supabase 环境变量
- `pnpm-lock.yaml` - 更新依赖锁文件

### 删除
- 无

### 修复
- **钱包连接丢失**：从 dynamic import ssr:false 改为 cookieStorage + cookieToInitialState 方案
- **indexedDB 错误**：walletConnect connector 不在 SSR 阶段初始化，改用双配置策略
- **对话标题固定**：实现基于用户消息的标题自动生成（前 30 字符）
- **列表刷新闪屏**：从全量重新加载改为增量更新（CustomEvent 传递完整数据）

## 影响范围

- **影响模块**: web-app, web3-wallet, supabase-integration, conversation-management
- **破坏性变更**: 否
- **需要迁移**: 是（需要执行 supabase/init.sql 创建数据库表）

## 上下文标记

**关键词**: wagmi,RainbowKit,cookieStorage,cookieToInitialState,SSR持久化,walletConnect,indexedDB,EIP-6963,Supabase,对话历史,标题生成,增量更新
**相关文档**: 
- WALLET-LOGIN-SETUP.md
- apps/web/QUICKSTART.md
- supabase/init.sql
- docs/Web3-AI-Agent-PRD-MVP.md

**后续建议**: 
1. 实现 Supabase 失败时的 localStorage 降级策略
2. 添加 walletConnect 扫码连接支持（需要解决 SSR 兼容性问题）
3. 对话标题生成可接入 AI 模型实现智能摘要
4. 添加对话搜索和过滤功能
5. 考虑添加对话导出/导入功能
