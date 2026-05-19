# Web3 AI Agent 项目技术文档

> 版本: v0.8.0 | 最后更新: 2026-05-07 | 维护: AI Agent 开发团队

## 目录

1. [技术栈概览](#1-技术栈概览)
2. [Monorepo 架构](#2-monorepo-架构)
3. [系统架构设计](#3-系统架构设计)
4. [AI 模型集成 (ai-config)](#4-ai-模型集成-ai-config)
5. [Agent Loop 核心实现](#5-agent-loop-核心实现)
6. [SSE 流式输出](#6-sse-流式输出)
7. [Web3 工具层 (web3-tools)](#7-web3-工具层-web3-tools)
8. [钱包集成架构](#8-钱包集成架构)
9. [转账系统](#9-转账系统)
10. [会话管理系统](#10-会话管理系统)
11. [Memory 记忆管理](#11-memory-记忆管理)
12. [UI 组件架构](#12-ui-组件架构)
13. [Supabase 数据持久化](#13-supabase-数据持久化)
14. [RLS 行级安全策略](#14-rls-行级安全策略)
15. [测试体系](#15-测试体系)
16. [CI/CD 与部署](#16-cicd-与部署)
17. [x-ray Skills 技能系统](#17-x-ray-skills-技能系统)
18. [API 参考](#18-api-参考)

---

## 1. 技术栈概览

### 1.1 核心框架

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 前端框架 | Next.js (App Router) | 14.x | SSR/CSR 混合渲染、API Routes |
| UI 框架 | React | 18.x | 组件化 UI 开发 |
| 类型系统 | TypeScript | 5.x | 全栈类型安全 |
| 样式方案 | Tailwind CSS | 3.x | 原子化 CSS、响应式设计 |
| UI 组件库 | Radix UI | 最新 | 无障碍弹窗/按钮/Select 基础组件 |

### 1.2 AI/LLM 集成

| 技术 | 版本 | 用途 |
|------|------|------|
| openai | 6.x | OpenAI API SDK (GPT-4o, o4-mini, gpt-4.1) |
| @anthropic-ai/sdk | 1.x | Anthropic API SDK (Claude 4 Sonnet) |

### 1.3 Web3 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| ethers | 6.x | EVM 链 JSON-RPC 交互 |
| @solana/web3.js | 最新 | Solana 链交互、SPL Token 操作 |
| @solana/spl-token | 最新 | SPL Token 转账/余额 |
| @solana/wallet-adapter | 最新 | Solana 钱包连接 (Phantom/Solflare) |
| wagmi | 2.19.5 | EVM 钱包 React Hooks |
| viem | 最新 | EVM 底层工具库 |
| RainbowKit | 2.2.10 | EVM 钱包 UI 组件 (9+ 钱包) |

### 1.4 数据与存储

| 技术 | 用途 |
|------|------|
| @supabase/supabase-js | PostgreSQL + RLS 行级安全、对话/消息持久化 |
| localStorage | 主题偏好存储 |
| cookieStorage (wagmi) | 钱包连接状态 SSR 持久化 |

### 1.5 构建与工具链

| 技术 | 用途 |
|------|------|
| pnpm 8.x | 包管理 + Workspace Monorepo |
| Turborepo 2.x | 增量构建、任务编排、缓存 |
| ESLint | 代码规范 |
| Prettier | 代码格式化 |
| lint-staged + husky | Git Hooks |
| TypeScript `tsc --noEmit` | 类型检查 |

### 1.6 测试

| 技术 | 版本 | 用途 |
|------|------|------|
| Vitest | 3.2.4 | 单元测试 (Workspace 模式) |
| @testing-library/react | 最新 | 组件交互测试 |
| Playwright | 1.59.3 | E2E 端到端测试 |

### 1.7 运行时要求

- Node.js: >= 22
- pnpm: >= 8
- 推荐包管理器: pnpm

---

## 2. Monorepo 架构

### 2.1 工作区结构

```
web3-ai-agent/
├── apps/
│   └── web/                       # @web3-ai-agent/web (Next.js 应用)
│       ├── app/
│       │   ├── api/               # API Routes (chat, tools, health, supabase)
│       │   ├── globals.css        # 全局样式 + CSS 变量主题系统
│       │   ├── layout.tsx         # 根布局 (含 SSR 主题闪烁修复)
│       │   ├── page.tsx           # 聊天主界面
│       │   ├── config.ts          # wagmi 多钱包配置
│       │   └── providers.tsx      # 多 Provider 嵌套
│       ├── adapters/              # 转账适配器层
│       │   ├── TransferAdapter.ts # 抽象基类
│       │   ├── AdapterFactory.ts  # 工厂模式
│       │   ├── evm/EVMAdapter.ts  # EVM 适配器
│       │   └── solana/SolanaAdapter.ts # Solana 适配器
│       ├── components/            # UI 组件
│       │   ├── cards/             # 转账卡片 (TransferCard, SolanaTransferCard, DexSwapCard)
│       │   ├── unified/           # 统一钱包 UI
│       │   └── ui/                # 基础 UI (Select, Alert, ConfirmDialog)
│       ├── hooks/                 # 自定义 Hooks
│       │   ├── useChatStream.ts   # SSE 流式 Hook
│       │   ├── useUnifiedWallet.ts # 统一钱包 Hook
│       │   ├── useSettings.ts     # 全局设置管理
│       │   └── useSupabaseStorage.ts # Supabase CRUD
│       ├── lib/
│       │   ├── memory/            # Memory 管理 (SlidingWindow, SummaryCompression)
│       │   ├── theme/             # 主题系统 (ThemeProvider, ThemeContext, ThemeSwitcher)
│       │   └── supabase/          # Supabase 客户端
│       └── e2e/                   # Playwright E2E 测试
├── packages/
│   ├── ai-config/                 # @web3-ai-agent/ai-config
│   │   └── src/
│   │       ├── types.ts           # 共享类型定义
│   │       ├── config.ts          # 配置加载 (环境变量)
│   │       ├── factory.ts         # LLMFactory 工厂
│   │       └── providers/         # Provider 实现
│   │           ├── base.ts        # ILLMProvider 接口 + BaseProvider
│   │           ├── openai.ts      # OpenAI Adapter
│   │           └── anthropic.ts   # Anthropic Adapter
│   └── web3-tools/                # @web3-ai-agent/web3-tools
│       └── src/
│           ├── types.ts           # 共享类型
│           ├── balance.ts         # 多链余额查询
│           ├── price.ts           # 多链价格查询
│           ├── gas.ts             # Gas 价格查询
│           ├── token.ts           # Token 信息/余额
│           ├── transfer.ts        # 转账操作
│           ├── index.ts           # 统一导出
│           ├── chains/            # 链抽象层
│           │   ├── config.ts      # 链配置管理 (5+ 链)
│           │   ├── evm-adapter.ts # EVM 统一适配器
│           │   ├── bitcoin.ts     # BTC 适配器
│           │   └── solana.ts      # Solana 适配器
│           └── tokens/            # Token 注册表
│               └── registry.ts    # ERC20 Token 元数据
├── docs/                          # 项目文档
├── skills/                        # x-ray 技能配置
├── .github/workflows/             # CI/CD Pipeline
├── turbo.json                     # Turborepo 配置
├── pnpm-workspace.yaml            # pnpm 工作区配置
├── vitest.workspace.ts            # Vitest 工作区配置
└── playwright.config.ts           # Playwright 配置
```

### 2.2 包依赖关系

```
@web3-ai-agent/web (apps/web)
  ├── @web3-ai-agent/ai-config (workspace:*)
  └── @web3-ai-agent/web3-tools (workspace:*)
```

### 2.3 Turborepo 任务编排

- `build`: 包级构建，遵循依赖拓扑排序
- `dev`: 开发模式并行启动
- `lint`: ESLint 代码检查
- `test`: Vitest 单元测试
- `type-check`: TypeScript 类型检查

所有构建产物通过 `.gitignore` 排除，Turborepo 缓存 `.turbo/`。

### 2.4 开发工作流

| 命令 | 用途 |
|------|------|
| `pnpm dev` | 启动所有包的开发模式 |
| `pnpm build` | 生产构建 (增量) |
| `pnpm lint` | ESLint 检查 |
| `pnpm test` | 单元测试 (全部包) |
| `pnpm test:e2e` | E2E 测试 (Playwright) |
| `pnpm test:e2e:ui` | E2E 测试 UI 模式 |
| `pnpm test:e2e:report` | 查看测试报告 |
| `pnpm type-check` | TypeScript 类型检查 |

---

## 3. 系统架构设计

### 3.1 五层架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                          用户层 (User Layer)                         │
│  Chat UI · MessageList · TransferCard · SolanaTransferCard          │
│  UnifiedWalletButton · UnifiedWalletModal · ThemeSwitcher           │
└─────────────────────────────────────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────────┐
│                          API 层 (API Layer)                          │
│  POST /api/chat  · POST /api/tools  · GET /api/health              │
│  POST /api/supabase/verify-ownership                                │
│  POST /api/supabase/delete-conversation                             │
└─────────────────────────────────────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────────┐
│                       Agent Core 层 (Agent Layer)                    │
│  Intent Classifier · Agent Loop · Memory Manager · System Prompt    │
│  LLMFactory · AI Intent Parser · Wallet Context Injection           │
└─────────────────────────────────────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────────┐
│                        工具层 (Tools Layer)                          │
│  getTokenPrice · getBalance · getGasPrice · getTokenInfo            │
│  getTokenBalance · createTransferCard                               │
│  ChainAdapter · TransferAdapter · DexAggregator                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────────┐
│                         数据层 (Data Layer)                          │
│  OpenAI/Anthropic API · Binance/Huobi API · Alchemy/Infura RPC      │
│  Blockchain.info API · Solana JSON-RPC · Supabase PostgreSQL        │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 数据流 (Agent Loop)

```
用户输入 (自然语言)
  │
  ▼
POST /api/chat ──► LLMFactory.getProvider()
  │                     │
  │                     ▼
  │              第1次调用: provider.chat(messages, { tools })
  │                     │
  │              ┌──────┴──────┐
  │              │             │
  │          无需工具       需要工具 (toolCalls)
  │              │             │
  │              │      执行工具函数
  │              │             │
  │              │      工具结果注入消息
  │              │             │
  │              │      第2次调用: provider.chat(messages + toolResults)
  │              │             │
  │              ▼             ▼
  │         ┌──────────────────┐
  │         │   最终回复内容     │
  │         └──────────────────┘
  │                │
  │          ┌─────┴─────┐
  │          │           │
  │       SSE 流式     JSON 响应
  │          │           │
  ▼          ▼           ▼
useChatStream Hook ──► 渲染 UI
```

### 3.3 错误处理策略

| 错误类型 | 处理方式 |
|----------|----------|
| 模型 API Key 未配置 | 返回 503 + "模型配置错误" 提示 |
| 工具执行失败 | 返回 `{ success: false, error }` , AI 用自然语言解释 |
| SSE 流式错误 | 发送 `error` chunk，前端 Toast 提示 |
| 4xx 客户端错误 | 不重试，直接展示 |
| 5xx 服务端错误 | 前端自动重试最多 2 次 |
| 超时 (>30s) | AbortController 取消，提示重试 |

### 3.4 安全边界

- 所有区块链工具均为**只读查询**，不存在直接修改链上状态
- 转账操作需要用户在钱包中主动签名
- 工具返回数据标注 `source` 和 `timestamp`，AI 不允许编造链上数据
- 高风险问题返回数据参考 + 免责声明
- 钱包地址通过 System Prompt 注入，用户可确认 AI 使用的地址

---

## 4. AI 模型集成 (ai-config)

### 4.1 LLMFactory 工厂模式

`@web3-ai-agent/ai-config` 包实现了 Provider 工厂模式，核心类:

```
LLMFactory
  ├── providers: Map<string, ProviderFactory>    // 已注册的工厂
  ├── instances: Map<string, ILLMProvider>        // 单例缓存
  ├── config: LLMConfig                          // 环境变量配置
  │
  ├── register(name, factory)    // 注册 Provider
  ├── getProvider(name?)         // 获取 Provider 实例 (单例)
  ├── create(name)               // 创建新实例 (不缓存)
  ├── getProviderNames()         // 获取所有已注册名称
  └── clearCache()               // 清除缓存 (测试用)
```

### 4.2 ILLMProvider 接口

```typescript
interface ILLMProvider {
  readonly name: string
  chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse>
  chatStream(messages: Message[], options?: ChatOptions): AsyncGenerator<StreamChunk>
}
```

### 4.3 内置 Provider

| Provider | 模型 | 特点 |
|----------|------|------|
| OpenAI | GPT-4o, gpt-4.1, o4-mini | Function Calling, 流式输出, 工具调用 |
| Anthropic | Claude 4 Sonnet | 工具使用, 流式输出, 思维链 |

### 4.4 配置管理

通过环境变量驱动:

```bash
DEFAULT_MODEL_PROVIDER=openai|anthropic  # 默认 Provider
OPENAI_API_KEY=sk-xxx                    # OpenAI Key
OPENAI_BASE_URL=...                      # OpenAI Base URL (可选)
OPENAI_MODEL=gpt-4.1                     # OpenAI 模型
ANTHROPIC_API_KEY=sk-ant-xxx             # Anthropic Key
ANTHROPIC_MODEL=claude-4-sonnet          # Anthropic 模型
```

Provider 特性配置 (providers config):
- `supportsStreaming`: 是否支持流式输出
- `supportsTools`: 是否支持工具调用
- `maxTokens`: 最大输出 Token 数

### 4.5 消息类型

```typescript
type MessageRole = 'system' | 'user' | 'assistant' | 'tool'
type ContentType = 'text' | 'image_url' | 'tool_use' | 'tool_result'

interface Message {
  role: MessageRole
  content: string | ContentPart[]
  tool_calls?: ToolCall[]
  tool_call_id?: string
  name?: string
}
```

---

## 5. Agent Loop 核心实现

### 5.1 端到端流程

`apps/web/app/api/chat/route.ts` 实现了完整的 Agent Loop:

1. **请求解析**: 提取 messages, walletAddress, chainId
2. **钱包地址校验**: 如果提供则验证格式 (42 字符十六进制 / Solana Base58)
3. **动态 System Prompt**: 根据钱包地址生成上下文 Prompt
4. **第 1 次 LLM 调用**: 发送消息 + 工具定义，让模型决策
5. **工具执行**: 如果模型返回 toolCalls，逐个执行对应工具函数
6. **结果注入**: 将工具结果作为 `tool` role 消息注入对话
7. **第 2 次 LLM 调用**: 基于工具结果生成自然语言回复
8. **流式输出**: 通过 SSE 逐步推送到前端

### 5.2 工具注册表

```typescript
const tools: Tool[] = [
  { name: 'getTokenPrice',     description: '查询加密货币实时价格' },
  { name: 'getBalance',        description: '查询指定链上的钱包余额' },
  { name: 'getGasPrice',       description: '查询 EVM 链的 Gas 价格' },
  { name: 'getTokenInfo',      description: '查询 ERC20 Token 元数据' },
  { name: 'getTokenBalance',   description: '查询 ERC20 Token 余额' },
  { name: 'createTransferCard', description: '创建转账卡片' },
]
```

### 5.3 工具执行路由

```typescript
switch (functionName) {
  case 'getTokenPrice':       → web3-tools.getTokenPrice()
  case 'getBalance':          → web3-tools.getMultiChainBalance()
  case 'getGasPrice':         → web3-tools.getGasPrice()
  case 'getTokenInfo':        → web3-tools.getTokenInfo()
  case 'getTokenBalance':     → web3-tools.getTokenBalance()
  case 'createTransferCard':  → 返回前端渲染用的 transferData
}
```

### 5.4 动态 System Prompt

当用户连接钱包后，System Prompt 自动注入钱包上下文:

```
## 当前用户信息
- 用户已连接钱包，地址为: 0x...
- 当用户查询"我的余额"或"我的钱包"时，使用此地址
- 用户当前所在网络: [链名] (ChainId: [chainId])
```

---

## 6. SSE 流式输出

### 6.1 后端 SSE 协议

流式响应使用标准 SSE 格式:

```
event: chunk
data: {"type":"content","content":"你好"}

event: chunk
data: {"type":"tool_call","toolCall":{...}}

event: chunk
data: {"type":"transfer_data","transferData":{...}}

event: chunk
data: {"type":"done"}

event: chunk
data: {"type":"error","error":"错误信息"}
```

### 6.2 前端 useChatStream Hook

核心特性:

| 特性 | 参数 | 说明 |
|------|------|------|
| 自动重试 | `MAX_RETRIES = 2` | 5xx 错误自动重试 |
| 超时处理 | `TIMEOUT_MS = 30000` | 30 秒无响应自动取消 |
| 节流更新 | `THROTTLE_MS = 50` | 50ms 节流合并 UI 更新 |
| 主动中断 | `AbortController` | 用户可随时停止生成 |

### 6.3 StreamChunk 类型

```typescript
type StreamChunk =
  | { type: 'content'; content: string }
  | { type: 'tool_call'; toolCall: {...} }
  | { type: 'transfer_data'; transferData: {...} }
  | { type: 'done' }
  | { type: 'error'; error: string }
```

### 6.4 SSE 解析器 (SSEParser)

状态机解析 SSE 文本流:
- `parseLine()` → 按 `\n\n` 分割事件
- 解析 `event:` 和 `data:` 行
- 处理换行符转义 (`\\n` → `\n`)
- 处理截断 JSON 的容错

---

## 7. Web3 工具层 (web3-tools)

### 7.1 链抽象层

支持 5 条区块链:

| 链 | ChainId | 类型 | RPC/数据源 |
|----|---------|------|-----------|
| Ethereum | 1 | EVM | Alchemy JSON-RPC |
| Polygon | 137 | EVM | Alchemy JSON-RPC |
| BSC | 56 | EVM | Binance JSON-RPC |
| Hardhat | 31337 | EVM | 本地 Hardhat 节点 |
| Bitcoin | - | 非 EVM | Blockchain.info / Blockchair API |
| Solana | - | 非 EVM | Solana JSON-RPC |

### 7.2 多 RPC 容错

每条链配置多个 RPC 节点，支持自动切换:
- Ethereum: Alchemy + 自建 + 公共
- Polygon: Alchemy + QuickNode + 公共
- BSC: 自建节点 + 公共节点
- Hardhat: 本地 + 外网端口

### 7.3 工具函数一览

| 工具 | 文件 | 输入 | 输出 | 特点 |
|------|------|------|------|------|
| `getTokenPrice()` | price.ts | symbol (BTC/ETH/SOL 等) | ToolResult | 支持 Binance → Huobi 容错 |
| `getMultiChainBalance()` | balance.ts | chain, address | ToolResult | 统一接口，按链路由 |
| `getGasPrice()` | gas.ts | chain (EVM) | ToolResult | EIP-1559 三字段返回 |
| `getTokenInfo()` | token.ts | chain, symbol | ToolResult | 从 TokenRegistry 查询 |
| `getTokenBalance()` | token.ts | chain, address, tokenSymbol | ToolResult | 余额 + 价格 + USD 价值 |

### 7.4 Token 注册表

`packages/web3-tools/src/tokens/registry.ts` 维护了主流 ERC20 Token 的元数据:
- 包含合约地址、Decimals、Logo URI
- 支持多链同名 Token (USDT 在 ETH/Polygon/BSC 的不同合约地址)
- 通过 `getTokenInfo(chain, symbol)` 查询

### 7.5 类型定义

```typescript
type EvmChainId = 'ethereum' | 'polygon' | 'bsc'
type NonEvmChainId = 'bitcoin' | 'solana'
type ChainId = EvmChainId | NonEvmChainId

interface ToolResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
  source: string
}
```

---

## 8. 钱包集成架构

### 8.1 双链并行架构

项目同时支持 EVM 和 Solana 链的钱包连接:

**EVM (RainbowKit)**:
- RainbowKit 2.2.10 + wagmi 2.19.5
- 支持 9+ 钱包: MetaMask, WalletConnect, Coinbase, OKX, Binance, Rabby, Trust, Phantom EVM, 浏览器注入
- 3 条链: Ethereum (1), Polygon (137), BSC (56)

**Solana**:
- @solana/wallet-adapter-react
- 支持钱包: Phantom, Solflare
- 链: Solana Mainnet

### 8.2 统一钱包系统

```
UnifiedWalletButton ──► UnifiedWalletModal
                            │
                    ┌───────┼───────┐
                    │               │
              EVM 钱包列表    Solana 钱包列表
                    │               │
            RainbowKit Modal   WalletModal
                    │               │
                    ▼               ▼
              useAccount()    useWallet()
                    │               │
                    └───────┬───────┘
                            │
                    useUnifiedWallet()
                            │
                    ┌───────┼───────┐
                    │       │       │
                  chain  address  connected
```

### 8.3 Provider 嵌套顺序

```
QueryClientProvider (TanStack Query)
  └─ WagmiProvider (EVM 状态)
       └─ RainbowKitProvider (EVM UI)
            └─ ThemeProvider (全局主题)
                 └─ ConnectionProvider (Solana RPC)
                      └─ WalletProvider (Solana 钱包状态)
                           └─ WalletModalProvider (Solana 弹窗)
```

### 8.4 SSR 兼容策略

- **问题**: walletConnect connector 初始化时访问 `indexedDB`，SSR 环境不支持
- **方案**: 使用 `cookieStorage` + `cookieToInitialState` 实现 SSR 安全的状态恢复
- **layout.tsx**: 在 `<head>` 中插入同步脚本设置 `data-theme` 属性，防止主题闪烁

### 8.5 钱包上下文注入

连接钱包后，AI 自动获取钱包地址上下文:
- `page.tsx` 通过 `useAccount()` (EVM) 或 `useWallet()` (Solana) 获取地址
- 地址通过 `walletAddress` 参数传入 `sendMessage()`
- API Route 将地址注入 System Prompt
- AI 查询"我的余额"时自动使用该地址

---

## 9. 转账系统

### 9.1 适配器模式

```
TransferAdapter (抽象基类)
  ├── EVMAdapter      (ETH/Polygon/BSC 转账)
  └── SolanaAdapter   (SOL 转账)

AdapterFactory.createAdapter(networkId, walletParams?, chainId?)
```

### 9.2 转账卡片架构

**EVM 转账 (TransferCard)**:
- ETH 原生转账: `useSendTransaction` (wagmi)
- ERC20 转账: `useWriteContract` (wagmi) + ERC20 `transfer` ABI
- Approve 授权: `useWriteContract` + `useWaitForTransactionReceipt`
- 状态机: pending → signing → submitted → confirmed/failed

**Solana 转账 (SolanaTransferCard)**:
- SOL 原生: `SystemProgram.transfer`
- SPL Token: `createTransferInstruction` + `getAssociatedTokenAddress`
- 状态机: pending → sending → confirmed/failed

### 9.3 适配器接口

```typescript
abstract class TransferAdapter {
  abstract getNetworkId(): string
  abstract getNetworks(): NetworkConfig[]
  abstract getBalance(address: string, token?: string): Promise<string>
  abstract sendTransfer(params: TransferParams): Promise<TransferReceipt>
  abstract estimateFee(params: TransferParams): Promise<FeeEstimate>
  abstract validateAddress(address: string): boolean
}
```

### 9.4 TransferData 数据流

```
AI 返回 createTransferCard toolCall
  → API Route 提取 transferData
  → SSE 发送 transfer_data chunk
  → useChatStream 解析并存储
  → MessageItem 渲染 TransferCard/SolanaTransferCard
  → 用户确认 → 钱包签名 → 链上执行 → 结果回调 → Supabase 持久化
```

---

## 10. 会话管理系统

### 10.1 架构设计

```
SupabaseConversations (lib/supabase.ts)
  ├── getOrCreateConversation(walletAddress)
  ├── loadConversationHistory(conversationId)
  ├── saveMessages(conversationId, messages)
  ├── loadAllConversationsWithMessages()
  ├── deleteConversationWithOwnershipCheck()
  └── generateConversationTitle()
```

### 10.2 核心流程

1. **钱包连接** → `getOrCreateConversation(walletAddress)` 自动创建/获取对话
2. **用户发送消息** → `saveMessages()` 实时保存
3. **第一条消息** → `generateConversationTitle()` 自动生成标题 → 更新侧边栏
4. **新建对话** → `createNewConversation()` → CustomEvent 增量更新侧边栏
5. **重连** → `loadConversationHistory()` 恢复完整历史

### 10.3 侧边栏交互

- 对话列表展示: 标题 + 时间 + 预览
- 新建对话: CustomEvent `conversation-changed` 增量更新
- 删除对话: ConfirmDialog → 服务端双重验证 → 删除
- 数据隔离: 按 `wallet_address` 字段区分不同用户

---

## 11. Memory 记忆管理

### 11.1 策略模式架构

```
MemoryManager (接口)
  ├── L1 (Conversation Buffer) - 基础
  ├── L2 (Sliding Window) - 实现
  └── L3 (Summary Compression) - 实现

lib/memory/
  ├── types.ts              // MemoryManager 接口 + MessagePart 类型
  ├── SlidingWindowMemory.ts // L2: 滑动窗口
  └── SummaryCompressionMemory.ts // L3: 摘要压缩
```

### 11.2 L2 SlidingWindow

- 只保留最近 N 条消息
- 无 LLM 调用，零开销
- 配置项: `maxMessages`

### 11.3 L3 SummaryCompression

- **触发条件**: `compressThreshold` (默认 10 条)
- **压缩策略**: 保留最近 `keepRecentCount` (默认 5 条) + 生成摘要
- **异步压缩**: 使用 `isCompressing` 标志位防止并发
- **LLM 调用**: 通过 `/api/chat` 生成摘要
- **优势**: Token 消耗降低 ≥ 50%

---

## 12. UI 组件架构

### 12.1 核心组件

| 组件 | 文件 | 行数 | 职责 |
|------|------|------|------|
| ChatInput | ChatInput.tsx | ~100 | 输入框 + 发送按钮 + 连接状态提示 |
| MessageList | MessageList.tsx | ~150 | 消息列表容器 |
| MessageItem | MessageItem.tsx | ~200 | 单条消息渲染 + 转账卡片条件渲染 |
| TransferCard | cards/TransferCard.tsx | ~415 | EVM 转账交互卡片 |
| SolanaTransferCard | cards/SolanaTransferCard.tsx | ~416 | Solana 转账交互卡片 |
| UnifiedWalletButton | unified/UnifiedWalletButton.tsx | ~100 | 统一钱包连接按钮 |
| UnifiedWalletModal | unified/UnifiedWalletModal.tsx | ~160 | 钱包选择弹窗 |
| ThemeSwitcher | ThemeSwitcher.tsx | - | 主题切换 (Light/Dark/System) |
| ConversationHistory | ConversationHistory.tsx | - | 对话历史侧边栏 |
| PromptSelector | PromptSelector.tsx | - | 预设提示选择 |
| MarkdownRenderer | MarkdownRenderer.tsx | - | Markdown 渲染 |
| ConfirmDialog | ConfirmDialog.tsx | - | 确认弹窗 (替代浏览器 confirm) |
| SettingsPanel | SettingsPanel.tsx | - | 设置面板 |

### 12.2 主题系统

```
lib/theme/
  ├── ThemeContext.ts    // React Context
  ├── ThemeProvider.tsx  // Provider 实现
  └── ThemeSwitcher.tsx  // 切换组件

类型:
  ThemeMode = 'light' | 'dark' | 'system'
  ResolvedTheme = 'light' | 'dark'
```

特性:
- CSS 变量全局管理
- localStorage 持久化
- 系统主题监听
- 平滑过渡动画 (transition-colors)
- SSR 闪烁修复 (layout.tsx head script)

### 12.3 React Hooks 一览

| Hook | 文件 | 职责 |
|------|------|------|
| `useChatStream` | hooks/useChatStream.ts | SSE 流式对话 |
| `useUnifiedWallet` | hooks/useUnifiedWallet.ts | 统一钱包状态 |
| `useSettings` | hooks/useSettings.ts | 全局设置管理 |
| `useSupabaseStorage` | hooks/useSupabaseStorage.ts | Supabase CRUD |
| `useConversationSidebar` | hooks/useConversationSidebar.ts | 侧边栏状态 |
| `useTheme` | lib/theme/ | 主题切换 |

---

## 13. Supabase 数据持久化

### 13.1 数据模型

**conversations 表**:
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  title TEXT DEFAULT '新对话',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**messages 表**:
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT,
  tool_calls JSONB,
  tool_call_id TEXT,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 13.2 查询优化

- `loadAllConversationsWithMessages`: 单次查询 + 内存组装，避免 N+1
- 使用 `order` 排序: conversations 按 `updated_at DESC`, messages 按 `created_at ASC`

---

## 14. RLS 行级安全策略

### 14.1 开发阶段

```sql
-- 全部使用宽松策略
CREATE POLICY "Allow all" ON conversations FOR ALL USING (true);
CREATE POLICY "Allow all" ON messages FOR ALL USING (true);
```

### 14.2 生产阶段 (UPDATE/INSERT 保持宽松, DELETE 升级严格)

**messages DELETE 策略**:
```sql
CREATE POLICY "Users can delete own messages" ON messages
  FOR DELETE
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE wallet_address = current_setting('app.current_wallet_address', true)
    )
  );
```

### 14.3 服务端双重验证

DELETE 请求走两步:
1. `/api/supabase/verify-ownership` → 查询数据库确认对话归属
2. `/api/supabase/delete-conversation` → 内置 `verifyOwnership()` 函数再次校验

---

## 15. 测试体系

### 15.1 单元测试 (Vitest)

**统计**: 31 个测试文件 | 238 个测试用例 | 100% 通过率

**Workspace 配置** (`vitest.workspace.ts`):
```
apps/web/vitest.config.ts          → jsdom 环境
packages/ai-config/vitest.config.ts → node 环境
packages/web3-tools/vitest.config.ts → node 环境
```

**模块覆盖**:

| 模块 | 测试文件数 | 测试用例数 |
|------|-----------|-----------|
| apps/web | 17 | 130 |
| packages/ai-config | 4 | 34 |
| packages/web3-tools | 10 | 74 |

### 15.2 E2E 测试 (Playwright)

**统计**: 4 个测试文件 | 18 个用例

| 文件 | 用例数 | 覆盖范围 |
|------|--------|---------|
| basic.spec.ts | 3 | 页面加载、标题验证、主题切换 |
| api.spec.ts | 9 | Chat API、健康检查、工具调用、SSE 流式 |
| chat.spec.ts | 3 | 消息发送、聊天流程、工具执行 |
| transfer.spec.ts | 3 | 转账卡片渲染、组件结构 |

### 15.3 Mock 策略

| 外部依赖 | Mock 方式 |
|----------|----------|
| openai SDK | `vi.mock('openai')` + `vi.hoisted()` |
| @supabase/supabase-js | `vi.mock()` + 链式调用 mock |
| fetch | Vitest 内置 (jsdom) |
| setTimeout/setInterval | `vi.useFakeTimers()` |
| 匹配器 | `expect.extend(matchers)` from @testing-library |

---

## 16. CI/CD 与部署

### 16.1 GitHub Actions Pipeline

```yaml
Trigger: push to main / PR to main

Jobs:
  lint-and-test:
    - checkout
    - setup pnpm + Node.js 22
    - pnpm install
    - pnpm type-check
    - pnpm lint
    - pnpm test

  deploy: (仅 main 分支)
    - vercel pull --yes
    - vercel build
    - vercel deploy --prebuilt --prod
```

### 16.2 部署方案

| 平台 | 适用场景 | 特点 |
|------|---------|------|
| **Vercel** (推荐) | 快速上线、自动部署 | 全球 CDN、Edge Functions、Preview 部署 |
| **Docker** | 私有化部署 | 容器化、可复现、支持自定义基础设施 |
| **传统服务器** | 企业级部署 | PM2 进程管理、Nginx 反向代理 |

### 16.3 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `DEFAULT_MODEL_PROVIDER` | ✅ | AI Provider (openai/anthropic) |
| `OPENAI_API_KEY` | 条件 | OpenAI API Key |
| `ANTHROPIC_API_KEY` | 条件 | Anthropic API Key |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase 匿名密钥 |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | ✅ | WalletConnect 项目 ID |
| `ETHEREUM_RPC_URL` | 可选 | 以太坊 RPC |
| `POLYGON_RPC_URL` | 可选 | Polygon RPC |
| `BSC_RPC_URL` | 可选 | BSC RPC |
| `HTTP_PROXY` / `HTTPS_PROXY` | 可选 | 代理 (国内开发环境) |

---

## 17. x-ray Skills 技能系统

### 17.1 工作流

```
skills/x-ray/SKILL.md (入口)
  └─ origin (需求分析)
       └─ pipeline (路由)
            ├─ check-in (技术栈检测)
            ├─ architect (架构设计)
            ├─ coder (代码实现)
            └─ audit (审查)
```

### 17.2 文档输出规则

- 每个阶段生成独立文档，带日期时间戳和迭代编号
- 所有文档存放在 `docs/` 目录
- 架构决策必须在文档中明确记录，便于回溯

---

## 18. API 参考

### 18.1 POST /api/chat

AI 对话主接口，支持 SSE 流式和 JSON 两种响应模式。

**请求体**:
```typescript
{
  messages: Array<{ role: string; content: string }>
  walletAddress?: string   // 钱包地址 (42字符十六进制 / Solana Base58)
  chainId?: number         // 当前链 ID
}
```

**响应** (JSON 模式):
```typescript
{
  content: string
  toolCalls?: Array<{ id, name, arguments, result }>
  transferData?: { id, to, tokenSymbol, amount, chain, from, tokenAddress, status }
}
```

**响应** (SSE 模式): 逐行发送 `event: chunk\ndata: {...}\n\n`

### 18.2 GET /api/health

健康检查接口，返回模型配置状态。

### 18.3 POST /api/supabase/verify-ownership

验证对话所有权 (DELETE 前置校验)。

**请求体**:
```typescript
{
  conversationId: string
  walletAddress: string
}
```

### 18.4 POST /api/supabase/delete-conversation

服务端删除对话 (含内置所有权验证)。

**请求体**:
```typescript
{
  conversationId: string
  walletAddress: string
}
```

---

## 附录: 核心设计模式总结

| 模式 | 应用位置 | 说明 |
|------|---------|------|
| **Factory** | LLMFactory, AdapterFactory | 统一创建入口，支持扩展 |
| **Strategy** | Memory Manager | L2/L3 策略可切换 |
| **Adapter** | ChainAdapter, TransferAdapter | 统一多链接口 |
| **Provider** | ThemeProvider, WagmiProvider | React Context 状态共享 |
| **Singleton** | LLMFactory Instances | Provider 实例缓存 |
| **Observer** | CustomEvent (conversation-changed) | 侧边栏增量更新 |
| **Template Method** | BaseProvider | 提供商基类 + 子类实现 |
