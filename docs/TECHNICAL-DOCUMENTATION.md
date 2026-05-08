# Web3 AI Agent 技术文档

> 版本：v0.8.0 | 最后更新：2026-05-08

---

## 目录

- [一、技术栈与选型](#一技术栈与选型)
- [二、系统架构设计](#二系统架构设计)
- [三、Monorepo 与构建系统](#三monorepo-与构建系统)
- [四、AI Agent 核心模块](#四ai-agent-核心模块)
- [五、Web3 工具层](#五web3-工具层)
- [六、钱包与身份系统](#六钱包与身份系统)
- [七、转账系统架构](#七转账系统架构)
- [八、会话与数据持久化](#八会话与数据持久化)
- [九、前端 UI 架构](#九前端-ui-架构)
- [十、测试体系](#十测试体系)
- [十一、部署与 CI/CD](#十一部署与-cicd)
- [十二、环境变量配置](#十二环境变量配置)
- [十三、扩展指南](#十三扩展指南)

---

## 一、技术栈与选型

### 1.1 核心技术栈

| 类别 | 技术 | 版本 | 选型理由 |
|------|------|------|----------|
| 前端框架 | Next.js (App Router) | 14 | 全栈框架，API Routes 支持，Vercel 部署友好 |
| UI 框架 | React | 18 | 生态成熟，组件化开发 |
| 类型系统 | TypeScript | 5.x | 严格类型检查，IDE 智能提示 |
| 样式方案 | Tailwind CSS | 3.x | 原子化 CSS，快速 UI 开发，主题变量支持 |
| 包管理 | pnpm | 8.x | workspace monorepo 支持，磁盘效率高 |
| 构建系统 | Turborepo | 2.x | 增量构建，缓存策略，任务编排 |

### 1.2 AI 能力

| 技术 | 用途 |
|------|------|
| OpenAI API | GPT-3.5 / GPT-4 对话、Function Calling |
| Anthropic API | Claude 对话（备用 Provider） |
| LLMFactory | 工厂模式，环境变量驱动动态切换 Provider |

### 1.3 Web3 技术栈

| 技术 | 链 | 用途 |
|------|-----|------|
| ethers.js | EVM (ETH/Polygon/BSC) | 链上数据查询、ERC20 合约交互 |
| @solana/web3.js | Solana | SOL/SPL Token 转账、余额查询 |
| @solana/spl-token | Solana | SPL Token 标准库 |
| wagmi | EVM | React Hooks，链状态管理 |
| viem | EVM | 底层 RPC 客户端 |
| RainbowKit | EVM | 钱包连接 UI（9+ 钱包） |
| @solana/wallet-adapter | Solana | 钱包连接（Phantom/Solflare） |

### 1.4 数据与存储

| 技术 | 用途 |
|------|------|
| Supabase (PostgreSQL) | 对话持久化、转账记录、RLS 安全策略 |
| localStorage | 主题偏好、临时状态 |
| cookieStorage | 钱包连接状态持久化（wagmi） |

### 1.5 测试

| 技术 | 用途 |
|------|------|
| Vitest 3.2.4 | 单元测试（Monorepo Workspace） |
| @testing-library/react | 组件测试 |
| Playwright 1.59.x | E2E 端到端测试 |

---

## 二、系统架构设计

### 2.1 分层架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                          用户层 (User Layer)                         │
│  Chat UI · MessageList · TransferCard · SolanaTransferCard          │
│  UnifiedWalletButton · UnifiedWalletModal · ThemeSwitcher           │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                          API 层 (API Layer)                          │
│  POST /api/chat           (对话 + SSE 流式)                         │
│  POST /api/tools          (Web3 工具直接调用)                       │
│  GET  /api/health         (健康检查)                                │
│  POST /api/supabase/verify-ownership  (所有权验证)                  │
│  POST /api/supabase/delete-conversation (服务端删除)                │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                       Agent Core 层 (Agent Layer)                    │
│  Intent Classifier · Agent Loop · Memory Manager                    │
│  LLMFactory · createSystemPrompt · AI Intent Parser                 │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                          工具层 (Tools Layer)                        │
│  packages/web3-tools                                                │
│  getTokenPrice · getBalance · getGasPrice · getTokenInfo            │
│  getTokenBalance · createTransferCard                               │
│  ChainAdapter (EVM/BTC/Solana) · Token Registry                    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                          数据层 (Data Layer)                         │
│  OpenAI/Anthropic API · Binance/Huobi API                           │
│  Alchemy/Infura RPC · Supabase PostgreSQL                           │
│  Solana JSON-RPC · Blockchain.info API                              │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 数据流

#### 普通对话流（无工具调用）

```
用户输入 → POST /api/chat → LLMFactory.getProvider() → provider.chat()
  → AI 直接回复 → SSE stream / JSON → 前端展示
```

#### 工具调用流（两次 API 调用）

```
用户输入 → POST /api/chat → 第 1 次 provider.chat(messages, { tools })
  → AI 返回 tool_calls → 执行 Web3 工具函数 → 获取结果
  → 第 2 次 provider.chat(messagesWithToolResults)
  → AI 基于工具结果生成自然语言回复 → SSE stream / JSON → 前端展示
```

#### 转账流

```
用户输入 "转 1 SOL 到 xxx"
  → AI 识别转账意图 → 调用 createTransferCard 工具
  → 返回 transferData → SSE transfer_data 事件
  → 前端渲染 TransferCard / SolanaTransferCard
  → 用户确认 → wagmi/Solana wallet adapter 签名
  → 链上执行 → 状态更新 → Supabase 持久化
```

### 2.3 错误处理策略

| 错误类型 | HTTP 状态码 | 处理方式 | 用户感知 |
|----------|------------|----------|----------|
| 钱包地址格式无效 | 400 | 返回错误提示 | "无效的钱包地址格式" |
| 模型未配置 | 503 | 配置错误提示 | "模型配置错误: 未配置 OPENAI_API_KEY" |
| 工具执行失败 | 200 | 降级为说明性回复 | 工具返回 error，AI 用自然语言解释 |
| API 超时 | 500 | 前端自动重试（最多 2 次） | "请求超时，请重试" |
| 流式中断 | - | SSE error 事件 | "抱歉，处理您的请求时出现了错误" |
| 4xx 客户端错误 | 4xx | 不重试，直接展示 | 具体错误信息 |

### 2.4 安全边界

1. **只读查询优先**：价格、余额、Gas 等工具均为只读
2. **写操作需用户确认**：转账需用户在钱包中主动签名
3. **数据来源透明**：工具返回值标注 `source` 和 `timestamp`
4. **风险提示**：高风险问题返回数据参考 + 免责声明
5. **禁止伪造数据**：工具失败时 AI 不允许编造链上数据
6. **RLS 行级安全**：数据库按 `wallet_address` 隔离
7. **DELETE 双重验证**：应用层 verifyWalletContext + 服务端 verify-ownership

---

## 三、Monorepo 与构建系统

### 3.1 工作区结构

```
AI-Agent/
├── apps/
│   └── web/                    # @web3-ai-agent/web (Next.js 应用)
├── packages/
│   ├── ai-config/              # @web3-ai-agent/ai-config (AI 模型配置)
│   └── web3-tools/             # @web3-ai-agent/web3-tools (Web3 工具集)
├── pnpm-workspace.yaml         # workspace 声明
├── package.json                # 根 scripts + devDependencies
└── turbo.json                  # Turborepo 任务编排
```

### 3.2 依赖关系

```
apps/web
  ├── @web3-ai-agent/ai-config    (AI Provider)
  └── @web3-ai-agent/web3-tools   (Web3 工具)

packages/ai-config
  └── openai / @anthropic-ai/sdk

packages/web3-tools
  └── ethers / @solana/web3.js
```

### 3.3 构建命令

```bash
pnpm dev            # turbo run dev（并行启动所有包的 dev 模式）
pnpm build          # turbo run build（增量构建）
pnpm lint           # turbo run lint
pnpm test           # turbo run test（并行运行所有包的单元测试）
pnpm type-check     # turbo run type-check（并行类型检查）
pnpm test:e2e       # playwright test（E2E 测试）
```

### 3.4 包间引用

Monorepo 内包通过 workspace 协议引用：

```json
// apps/web/package.json
{
  "dependencies": {
    "@web3-ai-agent/ai-config": "workspace:*",
    "@web3-ai-agent/web3-tools": "workspace:*"
  }
}
```

---

## 四、AI Agent 核心模块

### 4.1 LLMFactory 工厂模式

**文件**: [packages/ai-config/src/factory.ts](file:///d:/2026/code/AI-Agent/packages/ai-config/src/factory.ts)

LLMFactory 负责创建和管理 AI Provider 实例：

```typescript
class LLMFactory {
  private static providers = new Map<ModelProvider, ProviderFactory>()
  private static instances = new Map<ModelProvider, ILLMProvider>()
  private static config = loadConfigFromEnv()

  // 注册 Provider
  static register(name: ModelProvider, factory: ProviderFactory): void

  // 获取 Provider 实例（单例缓存）
  static getProvider(name?: ModelProvider): ILLMProvider

  // 清除缓存（测试用）
  static clearCache(): void
}
```

内置 Provider：
- **OpenAIAdapter**：OpenAI GPT-3.5/GPT-4
- **AnthropicAdapter**：Anthropic Claude

切换方式：修改环境变量 `DEFAULT_MODEL_PROVIDER=openai|anthropic`

### 4.2 ILLMProvider 接口

**文件**: [packages/ai-config/src/providers/base.ts](file:///d:/2026/code/AI-Agent/packages/ai-config/src/providers/base.ts)

```typescript
interface ILLMProvider {
  readonly name: string
  chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse>
  chatStream(messages: Message[], options?: ChatOptions): StreamResponse
}
```

- `chat()`：同步对话，返回完整响应
- `chatStream()`：流式对话，返回 `AsyncIterable<StreamChunk>`

### 4.3 Agent Loop 实现

**文件**: [apps/web/app/api/chat/route.ts](file:///d:/2026/code/AI-Agent/apps/web/app/api/chat/route.ts)

Agent Loop 采用简化的 ReAct 模式：

```
第 1 次 API 调用:
  messages + tools → provider.chat() → response
  ├─ response.toolCalls 为空 → 直接返回 response.content
  └─ response.toolCalls 不为空 → 执行工具 → 第 2 次调用

工具执行:
  for (toolCall of response.toolCalls) {
    switch (functionName) {
      case 'getTokenPrice': result = await getTokenPrice(args.symbol)
      case 'getBalance':    result = await getBalance(args.chain, args.address)
      case 'getGasPrice':   result = await getGasPrice(args.chain)
      case 'getTokenInfo':  result = await getTokenInfo(args.chain, args.symbol)
      case 'getTokenBalance': result = await getTokenBalance(...)
      case 'createTransferCard': result = { transferData: {...} }
    }
  }

第 2 次 API 调用:
  messages + toolResults → provider.chat() → finalResponse
```

### 4.4 动态 System Prompt

```typescript
function createSystemPrompt(walletAddress?: string, chainId?: number): string
```

基础 prompt（`SYSTEM_PROMPT_BASE`）定义了 AI 的角色、能力边界和行为规范。当用户连接钱包后，动态注入：

```
## 当前用户信息
- 用户已连接钱包，地址为：0x...
- 当用户查询"我的余额"或"我的钱包"时，使用此地址
- 用户当前所在网络：Ethereum (ChainId: 1)
```

### 4.5 会话 Memory 管理

**目录**: [apps/web/lib/memory/](file:///d:/2026/code/AI-Agent/apps/web/lib/memory)

采用 Strategy 模式，支持多种 Memory 策略：

```typescript
interface MemoryManager {
  addMessage(message: Message): void
  getMessages(): Message[]
  shouldCompress(): boolean
  compress(): Promise<void>
  clear(): void
}
```

#### L2 滑动窗口（SlidingWindowMemory）

- 只保留最近 N 条消息
- 无 LLM 调用，零开销
- 57 行实现

#### L3 摘要压缩（SummaryCompressionMemory）

- 固定条数触发（默认 10 条），保留最近 5 条
- 异步调用 LLM 生成摘要，不阻塞用户输入
- 摘要作为 system 消息注入
- `isCompressing` 标志位防护并发

```
消息积累 → shouldCompress() → true
  → 异步 compress() → LLM 生成摘要
  → summary = 摘要, originalMessages = 最近 5 条
  → getMessages() → [摘要(system), ...最近5条]
```

---

## 五、Web3 工具层

### 5.1 包结构

**目录**: [packages/web3-tools/src/](file:///d:/2026/code/AI-Agent/packages/web3-tools/src)

```
src/
├── chains/                  # 链抽象层
│   ├── config.ts            # 链配置管理（RPC、浏览器链接）
│   ├── evm-adapter.ts       # EVM 适配器（ethers.js）
│   ├── bitcoin.ts           # Bitcoin 适配器（Blockchain.info API）
│   ├── solana.ts            # Solana 适配器（@solana/web3.js）
│   └── index.ts             # 模块导出
├── tokens/                  # Token 注册表
│   ├── registry.ts          # 11 个主流 Token，3 条 EVM 链
│   └── index.ts
├── balance.ts               # 多链余额查询
├── price.ts                 # 多链价格查询（Binance/Huobi 容错）
├── gas.ts                   # EVM Gas 查询（EIP-1559）
├── token.ts                 # Token 信息 + ERC20 余额查询
├── transfer.ts              # 转账工具（Gas 估算、地址验证）
├── types.ts                 # 类型定义
└── index.ts                 # 统一导出
```

### 5.2 类型系统

**文件**: [packages/web3-tools/src/types.ts](file:///d:/2026/code/AI-Agent/packages/web3-tools/src/types.ts)

```typescript
type EvmChainId = 'ethereum' | 'polygon' | 'bsc'
type NonEvmChainId = 'bitcoin' | 'solana'
type ChainId = EvmChainId | NonEvmChainId

interface ToolResult<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
  source: string
}

interface TokenPriceData { symbol, price, change24h, currency }
interface BalanceData { chain, address, balance, unit, decimals }
interface GasData { chain, gasPrice, maxFeePerGas, maxPriorityFeePerGas, unit }
interface TokenMetadata { chain, symbol, name, decimals, contractAddress }
```

### 5.3 链适配器模式

```typescript
interface ChainAdapter {
  getBalance(address: string): Promise<ToolResult<BalanceData>>
  getGasPrice?(): Promise<ToolResult<GasData>>   // 仅 EVM
  validateAddress(address: string): boolean
}
```

- **EvmChainAdapter**：统一处理 Ethereum/Polygon/BSC，通过 chainId 路由到不同 RPC
- **BitcoinAdapter**：Blockchain.info / Blockchair API
- **SolanaAdapter**：Solana JSON-RPC

### 5.4 工具清单

| 工具函数 | 输入 | 输出 | 数据源 |
|---------|------|------|--------|
| `getTokenPrice(symbol)` | ETH/BTC/SOL/MATIC/BNB | 价格、24h 涨跌 | Binance → Huobi 容错 |
| `getBalance(chain, address)` | chain + address | 余额、单位 | RPC 节点 |
| `getGasPrice(chain)` | ethereum/polygon/bsc | gasPrice、EIP-1559 | RPC 节点 |
| `getTokenInfo(chain, symbol)` | chain + symbol | 名称、合约、精度 | Token 注册表 |
| `getTokenBalance(chain, address, tokenSymbol)` | chain + address + symbol | ERC20 余额 | ERC20 balanceOf |
| `createTransferCard(to, tokenSymbol, amount, chain)` | 转账参数 | 转账卡片数据 | 前端渲染 |

### 5.5 Token 注册表

**文件**: [packages/web3-tools/src/tokens/registry.ts](file:///d:/2026/code/AI-Agent/packages/web3-tools/src/tokens/registry.ts)

支持 11 个主流 Token，覆盖 3 条 EVM 链：

| Token | Ethereum | Polygon | BSC | 精度 |
|-------|----------|---------|-----|------|
| USDT | ✅ | ✅ | ✅ | 6 |
| USDC | ✅ | ✅ | ✅ | 6 |
| DAI | ✅ | ✅ | ✅ | 18 |
| UNI | ✅ | ❌ | ❌ | 18 |
| LINK | ✅ | ✅ | ✅ | 18 |
| ... | ... | ... | ... | ... |

---

## 六、钱包与身份系统

### 6.1 双链钱包架构

项目采用双 Provider 并行架构，EVM 和 Solana 完全解耦：

```
providers.tsx
  └─ WagmiProvider (EVM)
       └─ RainbowKitProvider (EVM 钱包 UI)
            └─ ThemeProvider
                 └─ ConnectionProvider (Solana RPC)
                      └─ WalletProvider (Solana 钱包)
                           └─ WalletModalProvider
                                └─ {children}
```

### 6.2 EVM 钱包配置

**文件**: [apps/web/app/config.ts](file:///d:/2026/code/AI-Agent/apps/web/app/config.ts)

- **RainbowKit v2.2.10**：支持 9+ 钱包
- **wagmi v2.19.5**：React Hooks 链状态管理
- **双配置策略**：
  - `getConfig()`：SSR 基础配置（仅 injected connector）
  - `getFullConfig()`：客户端完整配置（walletConnect + 所有钱包）

SSR 兼容性问题解决：
- walletConnect connector 在 SSR 阶段访问 indexedDB 会报错
- 采用 cookieStorage + cookieToInitialState 方案
- 从 Server Component (layout.tsx) 提取 cookie 状态注入 WagmiProvider

支持的 EVM 链：Ethereum (1), Polygon (137), BSC (56)

### 6.3 Solana 钱包集成

- **@solana/wallet-adapter-react**：钱包连接 React 绑定
- **支持钱包**：Phantom、Solflare
- **Provider 嵌套**：ConnectionProvider → WalletProvider → WalletModalProvider

### 6.4 统一钱包 UI

**文件**: [apps/web/components/UnifiedWalletButton.tsx](file:///d:/2026/code/AI-Agent/apps/web/components/UnifiedWalletButton.tsx) + [UnifiedWalletModal.tsx](file:///d:/2026/code/AI-Agent/apps/web/components/UnifiedWalletModal.tsx)

```typescript
// useUnifiedWallet Hook 合并双链状态
interface UnifiedWalletContext {
  chain: 'evm' | 'solana' | 'none'
  address: string
  connected: boolean
  chainId?: number
  networkId?: string
  disconnect: () => void
}
```

优先级：EVM > Solana > None

钱包连接流程：
```
用户点击 Connect Wallet
  → UnifiedWalletModal 打开
  → 选择链类型（EVM / Solana）
  → EVM：直接触发 RainbowKit ConnectButton
  → Solana：显示钱包列表（Phantom/Solflare）
  → 连接成功 → useUnifiedWallet 合并状态
```

### 6.5 钱包上下文注入

连接钱包后，AI 自动感知用户身份：

```
wagmi useAccount() → address
  → page.tsx 传递 walletAddress 到 sendMessage()
  → useChatStream → POST /api/chat { walletAddress, chainId }
  → createSystemPrompt(walletAddress, chainId) → 动态注入 system prompt
  → AI 查询"我的余额"时自动使用当前地址
```

---

## 七、转账系统架构

### 7.1 适配器模式

**目录**: [apps/web/adapters/](file:///d:/2026/code/AI-Agent/apps/web/adapters)

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

| 实现 | 文件 | 支持功能 |
|------|------|---------|
| SolanaAdapter | adapters/solana/SolanaAdapter.ts (226 行) | SOL 转账、SPL Token 转账、余额查询、费用估算 |
| EVMAdapter | adapters/evm/EVMAdapter.ts (82 行) | 网络配置、地址校验（wagmi hooks 限制，转账逻辑在 TransferCard 中） |
| AdapterFactory | adapters/AdapterFactory.ts | 工厂模式，根据 networkId 创建对应适配器 |

### 7.2 转账卡片组件

#### TransferCard（EVM）

**文件**: [apps/web/components/cards/TransferCard.tsx](file:///d:/2026/code/AI-Agent/apps/web/components/cards/TransferCard.tsx)（338 行）

- ETH 原生转账（useSendTransaction）
- ERC20 Token 转账（useWriteContract）
- 完整 Approve 流程：allowance 查询 → approve 调用 → 交易监听 → 二次校验
- 状态管理：pending → signing → confirmed/failed
- Supabase 持久化

#### SolanaTransferCard（Solana）

**文件**: [apps/web/components/cards/SolanaTransferCard.tsx](file:///d:/2026/code/AI-Agent/apps/web/components/cards/SolanaTransferCard.tsx)（416 行）

- SOL 原生转账（SystemProgram.transfer）
- SPL Token 转账（createTransferInstruction）
- 无需 Approve（SPL Token 直接转账）
- Solscan 浏览器链接

### 7.3 条件渲染

**文件**: [apps/web/components/MessageItem.tsx](file:///d:/2026/code/AI-Agent/apps/web/components/MessageItem.tsx)

```typescript
const isSolana = message.transferData.chain === 'solana'
const CardComponent = isSolana ? SolanaTransferCard : TransferCard
```

### 7.4 AI 意图解析

**文件**: [apps/web/lib/ai-intent-parser.ts](file:///d:/2026/code/AI-Agent/apps/web/lib/ai-intent-parser.ts)

- `parseTransferIntent`：从 AI 回复中解析转账意图
- `checkNetworkConsistency`：校验用户当前网络与目标链是否一致

---

## 八、会话与数据持久化

### 8.1 Supabase 数据模型

#### conversations 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| wallet_address | TEXT | 钱包地址（隔离键） |
| title | TEXT | 对话标题 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

#### messages 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| conversation_id | UUID | 关联对话 |
| role | TEXT | user / assistant / system |
| content | TEXT | 消息内容 |
| created_at | TIMESTAMPTZ | 创建时间 |

#### transfer_cards 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| conversation_id | UUID | 关联对话 |
| from_address | TEXT | 发送地址 |
| to_address | TEXT | 接收地址 |
| token_symbol | TEXT | Token 符号 |
| amount | TEXT | 转账金额 |
| chain | TEXT | 链标识 |
| status | TEXT | pending/confirmed/failed |
| tx_hash | TEXT | 交易哈希 |

### 8.2 RLS 安全策略

- **开发环境**：`USING (true)` 临时放开
- **生产环境**：DELETE 策略升级为 `current_setting('app.current_wallet_address', true)` 严格模式
- **服务端双重验证**：
  1. `/api/supabase/verify-ownership`：数据库查询确认对话归属
  2. `/api/supabase/delete-conversation`：内置所有权验证后执行删除

### 8.3 对话管理流程

```
钱包连接 → getOrCreateConversation(walletAddress)
  → 侧边栏展示对话列表
  → 发送消息 → saveMessages(conversationId, messages)
  → 第一条消息 → generateConversationTitle() → updateConversationTitle()
  → 新建对话 → createNewConversation() → CustomEvent 增量更新侧边栏
  → 断开连接 → UI 清空，Supabase 数据保留
  → 重连 → loadConversationHistory() 恢复
```

---

## 九、前端 UI 架构

### 9.1 组件目录结构

```
components/
├── cards/                    # 卡片组件
│   ├── TransferCard.tsx      # EVM 转账卡片 (338 行)
│   ├── SolanaTransferCard.tsx # Solana 转账卡片 (416 行)
│   ├── DexSwapCard.tsx       # DexSwap 预留
│   └── index.ts              # 统一导出
├── ChatInput.tsx             # 聊天输入框
├── ConfirmDialog.tsx         # 自定义确认弹窗
├── ConversationHistory.tsx   # 对话历史侧边栏
├── EVMWalletList.tsx         # EVM 钱包列表
├── MarkdownRenderer.tsx      # Markdown 渲染
├── MessageItem.tsx           # 单条消息（条件渲染卡片）
├── MessageList.tsx           # 消息列表
├── PromptSelector.tsx        # 提示选择器
├── SettingsPanel.tsx         # 设置面板
├── SolanaWalletList.tsx      # Solana 钱包列表
├── ThemeSwitcher.tsx         # 主题切换
├── UnifiedWalletButton.tsx   # 统一钱包按钮
├── UnifiedWalletModal.tsx    # 统一钱包弹窗
└── WalletConnectButton.tsx   # RainbowKit 封装
```

### 9.2 主题系统

**目录**: [apps/web/lib/theme/](file:///d:/2026/code/AI-Agent/apps/web/lib/theme)

```typescript
type ThemeMode = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

interface ThemeContextType {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  resolvedTheme: ResolvedTheme
}
```

- CSS 变量架构（globals.css）
- localStorage 持久化
- 系统主题监听（prefers-color-scheme）
- 平滑过渡动画（transition-colors duration-300）
- SSR 闪烁修复：layout.tsx `<head>` 内联同步脚本

### 9.3 流式输出 Hook

**文件**: [apps/web/hooks/useChatStream.ts](file:///d:/2026/code/AI-Agent/apps/web/hooks/useChatStream.ts)

```typescript
interface UseChatStreamReturn {
  isStreaming: boolean
  content: string
  error: string | null
  toolCalls: ToolCallUIState[]
  transferData?: TransferData
  sendMessage: (messages, walletAddress?, chainId?) => Promise<{ content, toolCalls, transferData }>
  abort: () => void
}
```

关键参数：
- `MAX_RETRIES = 2`：最大重试次数
- `TIMEOUT_MS = 30000`：超时时间
- `THROTTLE_MS = 50`：节流更新间隔

SSE 解析流程：
```
fetch('/api/chat', { Accept: 'text/event-stream' })
  → response.body.getReader()
  → 按 \n\n 分割事件
  → JSON.parse(data) → StreamChunk
  → handleChunk() 按 type 分发
    → content: 拼接到 buffer，节流更新 UI
    → tool_call: 添加到 toolCalls
    → transfer_data: 同步到 ref + state
    → done: 最终更新，结束流
    → error: 设置错误状态
```

---

## 十、测试体系

### 10.1 单元测试

**框架**: Vitest 3.2.4 + vitest workspace

```
vitest.workspace.ts
├── apps/web/vitest.config.ts        (jsdom 环境)
├── packages/ai-config/vitest.config.ts (node 环境)
└── packages/web3-tools/vitest.config.ts (node 环境)
```

**统计**: 31 个测试文件，238 个测试用例，100% 通过率

| 模块 | 测试文件 | 测试用例 | 覆盖内容 |
|------|---------|---------|---------|
| apps/web | 17 | 130 | supabase(46), theme(10), memory(22), tokens(6), hooks(9), components(21), api(8) |
| packages/ai-config | 4 | 34 | config(11), factory(8), providers(15) |
| packages/web3-tools | 10 | 74 | balance(6), chains(20), gas(4), price(6), token(10), transfer(8), registry(8) |

### 10.2 Mock 策略

| 场景 | 方案 | 示例 |
|------|------|------|
| 外部 SDK | `vi.mock()` + `vi.hoisted()` | openai, @supabase/supabase-js |
| 浏览器 API | jsdom 内置 | fetch, localStorage |
| 定时器 | `vi.useFakeTimers()` | 5xx 重试延迟 |
| 链式调用 | 逐层 mock | `.from().select().eq()` |
| React Hook | `renderHook + act` | useChatStream |

### 10.3 E2E 测试

**框架**: Playwright 1.59.x

```
e2e/
├── basic.spec.ts       # 页面加载、主题切换 (3 tests)
├── api.spec.ts         # API 接口测试 (9 tests)
├── chat.spec.ts        # 对话功能测试 (3 tests)
└── transfer.spec.ts    # 转账卡片 UI (3 tests)
```

**统计**: 18 个 E2E 测试用例，全部通过

运行命令：
```bash
pnpm test:e2e           # 无头模式
pnpm test:e2e:ui        # UI 模式
pnpm test:e2e:headed    # 有头模式
pnpm test:e2e:report    # 查看报告
```

---

## 十一、部署与 CI/CD

### 11.1 部署方案

| 方案 | 适用场景 | 推荐度 |
|------|---------|--------|
| Vercel | 快速上线、个人项目 | ⭐⭐⭐⭐⭐ |
| Docker | 私有化部署 | ⭐⭐⭐⭐ |
| 传统服务器 | 企业级部署 | ⭐⭐⭐ |

Vercel 部署关键配置：
- Root Directory: `apps/web`
- Build Command: `pnpm install && pnpm build`
- Output Directory: `.next`

### 11.2 CI/CD 流水线

**配置**: [.github/workflows/ci-cd.yml](file:///d:/2026/code/AI-Agent/.github/workflows/ci-cd.yml)

```
Push to main / PR
  → lint-and-test 任务
    ├─ pnpm install
    ├─ pnpm type-check
    ├─ pnpm lint
    └─ pnpm test
  → deploy 任务（仅 main 分支）
    ├─ vercel pull
    ├─ vercel build
    └─ vercel deploy --prod
```

GitHub Secrets 配置：
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

---

## 十二、环境变量配置

### 12.1 AI 模型配置

| 变量 | 必填 | 说明 |
|------|------|------|
| `DEFAULT_MODEL_PROVIDER` | 是 | `openai` 或 `anthropic` |
| `OPENAI_API_KEY` | 条件 | OpenAI API 密钥 |
| `OPENAI_MODEL` | 否 | 默认 `gpt-3.5-turbo` |
| `ANTHROPIC_API_KEY` | 条件 | Anthropic API 密钥 |

### 12.2 Web3 配置

| 变量 | 必填 | 说明 |
|------|------|------|
| `ETHEREUM_RPC_URL` | 否 | Ethereum RPC 节点 |
| `POLYGON_RPC_URL` | 否 | Polygon RPC 节点 |
| `BSC_RPC_URL` | 否 | BSC RPC 节点 |
| `NEXT_PUBLIC_HARDHAT_RPC_URL` | 否 | Hardhat 本地 RPC |

### 12.3 钱包配置

| 变量 | 必填 | 说明 |
|------|------|------|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | 是 | WalletConnect 项目 ID |

### 12.4 Supabase 配置

| 变量 | 必填 | 说明 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 是 | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 是 | Supabase 匿名密钥 |
| `SUPABASE_SERVICE_ROLE_KEY` | 否 | 服务端删除 API 用 |

### 12.5 代理配置

| 变量 | 说明 |
|------|------|
| `HTTP_PROXY` | HTTP 代理（国内开发环境） |
| `HTTPS_PROXY` | HTTPS 代理（国内开发环境） |

---

## 十三、扩展指南

### 13.1 添加新的 AI Provider

1. 在 `packages/ai-config/src/providers/` 创建新适配器，继承 `BaseProvider`
2. 实现 `chat()` 和 `chatStream()` 方法
3. 在 `LLMFactory` 注册新 Provider
4. 在 `.env.example` 添加配置项

### 13.2 添加新的 Web3 工具

1. 在 `packages/web3-tools/src/` 创建工具函数
2. 返回统一的 `ToolResult<T>` 格式
3. 在 `packages/web3-tools/src/index.ts` 导出
4. 在 `apps/web/app/api/chat/route.ts` 添加工具定义和路由

### 13.3 添加新的链支持

1. 在 `packages/web3-tools/src/chains/` 创建新适配器，实现 `ChainAdapter` 接口
2. 在 `config.ts` 注册链配置
3. 更新 `types.ts` 的 `ChainId` 类型
4. 更新 `route.ts` 的工具定义 `enum` 值

### 13.4 添加新的转账链

1. 在 `apps/web/adapters/` 创建新适配器，继承 `TransferAdapter`
2. 实现 `getBalance()` / `sendTransfer()` / `estimateFee()` / `validateAddress()`
3. 在 `AdapterFactory` 注册新适配器
4. 创建对应的 TransferCard 组件
5. 在 `MessageItem` 添加条件渲染逻辑

### 13.5 添加新的 Memory 策略

1. 在 `apps/web/lib/memory/` 创建新实现，实现 `MemoryManager` 接口
2. 在 `config.ts` 添加策略配置
3. 在 `page.tsx` 切换使用新策略
