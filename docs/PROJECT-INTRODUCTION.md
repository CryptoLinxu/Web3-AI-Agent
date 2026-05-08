# Web3 AI Agent - 项目介绍

## 项目概览

Web3 AI Agent 是一个面向 Web3 开发者和用户的智能助手项目，通过自然语言交互实现链上数据查询、转账操作等 Web3 场景的自动化处理。项目验证的核心理念是：构建一个能够理解用户意图、调用 Web3 工具、返回可信结果，并具备最小风险边界的 AI Agent。

## 项目背景

本项目服务于个人转型目标：从 **Web3 前端工程师** 升级为 **AI 应用工程师 / Agent 工程师**。项目既是学习载体，也是未来可展示的作品集基础。

产品层面，本项目要验证的不是"做一个聊天页面"，而是"做一个真正理解 Web3 领域的 AI Agent"。

## 目标用户

### Web3 普通用户
- 有钱包地址，但不熟悉链上数据查询
- 希望通过自然语言快速获取余额、价格、Gas 等信息
- 不希望阅读复杂区块浏览器页面

### 转型中的开发者
- 需要一个可持续迭代的项目作为学习主线
- 需要用项目反向组织对 Agent 的理解
- 需要形成文档、架构、测试与实现的完整闭环

## 核心能力

### 对话系统
- 基础聊天界面，支持 Markdown 渲染
- SSE 流式输出，实时展示 AI 回复
- 多模型支持：OpenAI GPT、Anthropic Claude，通过工厂模式动态切换
- 钱包上下文自动注入，AI 可感知用户当前钱包地址和网络

### Web3 工具集
- **多链价格查询**：ETH、BTC、SOL、MATIC、BNB，多数据源容错
- **多链余额查询**：Ethereum、Polygon、BSC、Bitcoin、Solana，链适配器模式
- **多链 Gas 查询**：EVM 链（Ethereum、Polygon、BSC），支持 EIP-1559
- **Token 信息查询**：11 个主流 Token 注册表，3 条 EVM 链
- **ERC20 余额查询**：支持 USDT、USDC、DAI 等 Token 的链上余额
- **转账卡片生成**：支持 EVM 和 Solana 双链转账操作

### Agent 能力
- **Agent Loop**：基于 ReAct 模式的简化版，理解 → 决策 → 执行 → 回复
- **Function Calling**：工具定义、注册、调用、结果回填完整流程
- **会话 Memory**：滑动窗口（L2）和摘要压缩（L3）两种策略

### 钱包与身份
- **多链钱包连接**：EVM（RainbowKit，支持 9+ 钱包）+ Solana（@solana/wallet-adapter，Phantom、Solflare）
- **统一钱包入口**：UnifiedWalletButton + UnifiedWalletModal，双链类型选择
- **对话持久化**：Supabase PostgreSQL，按钱包地址隔离，支持历史对话查看、切换、删除
- **RLS 安全策略**：行级安全，服务端所有权验证，DELETE 双验证

### 转账功能
- **EVM 转账**：TransferCard 组件，支持 ETH 和 ERC20 Token，含 Approve 完整流程
- **Solana 转账**：SolanaTransferCard 组件，支持 SOL 和 SPL Token（USDT、USDC）
- **适配器模式**：TransferAdapter 抽象接口，SolanaAdapter / EVMAdapter 实现，AdapterFactory 工厂模式
- **Supabase 持久化**：转账记录自动保存

### 风险控制
- 所有工具均为只读查询或用户主动触发的写操作
- 高风险问题返回数据参考 + 风险提示，不提供交易建议
- 数据来源透明标注，工具失败时禁止模型伪造结果
- 所有回复附带免责声明

## 技术栈

| 类别 | 技术 | 版本/说明 |
|------|------|-----------|
| 前端框架 | Next.js | 14，App Router |
| UI 框架 | React | 18 |
| 类型系统 | TypeScript | 5.x，严格模式 |
| 样式方案 | Tailwind CSS | 原子化 CSS |
| 包管理 | pnpm | 8.x，workspace monorepo |
| 构建系统 | Turborepo | 2.x |
| AI 能力 | OpenAI API / Anthropic API | GPT-3.5/GPT-4/Claude |
| Web3 (EVM) | wagmi + viem | 2.x |
| Web3 (Solana) | @solana/web3.js + @solana/spl-token | 1.98.x / 0.4.x |
| 钱包 (EVM) | RainbowKit | 2.2.10 |
| 钱包 (Solana) | @solana/wallet-adapter | 0.15.x |
| 数据库 | Supabase (PostgreSQL) | 云端数据库 + RLS |
| 测试 (单元) | Vitest | 3.2.4 |
| 测试 (E2E) | Playwright | 1.59.x |
| 部署 | Vercel | 推荐方案 |
| CI/CD | GitHub Actions | 自动化流水线 |

## 项目结构

```
AI-Agent/
├── apps/
│   └── web/                        # Next.js Web 应用
│       ├── app/                    # Next.js App Router
│       │   ├── api/                # API 路由
│       │   │   ├── chat/           # 聊天接口
│       │   │   ├── tools/          # 工具调用接口
│       │   │   ├── health/         # 健康检查
│       │   │   └── supabase/       # Supabase 服务端 API
│       │   ├── page.tsx            # 主页面
│       │   ├── layout.tsx          # 布局
│       │   └── providers.tsx       # 全局 Provider
│       ├── adapters/               # 转账适配器层
│       │   ├── TransferAdapter.ts  # 抽象接口
│       │   ├── solana/             # Solana 适配器
│       │   ├── evm/                # EVM 适配器
│       │   └── AdapterFactory.ts   # 工厂模式
│       ├── components/             # UI 组件
│       │   ├── cards/              # 转账/交易卡片
│       │   ├── MessageList.tsx     # 消息列表
│       │   ├── MessageItem.tsx     # 消息项
│       │   ├── ChatInput.tsx       # 聊天输入
│       │   ├── UnifiedWallet*.tsx  # 统一钱包组件
│       │   └── ...
│       ├── hooks/                  # React Hooks
│       ├── lib/                    # 核心库
│       │   ├── memory/             # 会话 Memory 管理
│       │   ├── supabase/           # Supabase 客户端
│       │   ├── theme/              # 主题系统
│       │   └── wallet/             # 钱包抽象层
│       ├── config/                 # 配置文件
│       ├── types/                  # TypeScript 类型
│       └── utils/                  # 工具函数
├── packages/
│   ├── ai-config/                  # AI 模型配置包
│   │   └── src/
│   │       ├── providers/          # OpenAI/Anthropic 适配器
│   │       ├── factory.ts          # LLMFactory 工厂
│   │       ├── config.ts           # 配置加载
│   │       └── types.ts            # 类型定义
│   └── web3-tools/                 # Web3 工具包
│       └── src/
│           ├── chains/             # 链适配器
│           ├── tokens/             # Token 注册表
│           ├── balance.ts          # 余额查询
│           ├── price.ts            # 价格查询
│           ├── gas.ts              # Gas 查询
│           ├── token.ts            # Token 信息
│           └── transfer.ts         # 转账工具
├── docs/                           # 项目文档
├── skills/                         # Skill 体系
│   └── x-ray/                      # x-ray 技能系统
├── e2e/                            # E2E 测试
├── ARCHITECTURE.md                 # 架构设计
├── package.json                    # 根 package.json
├── pnpm-workspace.yaml             # Monorepo 配置
└── playwright.config.ts            # Playwright 配置
```

## 系统架构

```
┌─────────────────────────────────────────────────┐
│                   用户层                         │
│  Chat UI · MessageList · TransferCard           │
│  SolanaTransferCard · UnifiedWalletButton       │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│                   API 层                         │
│  /api/chat (SSE 流式) · /api/tools · /api/health │
│  /api/supabase/verify-ownership                 │
│  /api/supabase/delete-conversation              │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│               Agent Core 层                      │
│  Intent Classifier · Agent Loop · Memory Manager │
│  LLMFactory · createSystemPrompt                │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│                   工具层                         │
│  packages/web3-tools                             │
│  getTokenPrice · getBalance · getGasPrice       │
│  getTokenInfo · getTokenBalance · createTransferCard │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│                   数据层                         │
│  OpenAI/Anthropic API · Binance/Huobi API       │
│  Alchemy/Infura RPC · Supabase PostgreSQL       │
└─────────────────────────────────────────────────┘
```

## 核心使用场景

### 场景 1：查询实时价格
> 用户："ETH 现在价格是多少？"

Agent 识别价格查询意图 → 调用 `getTokenPrice("ETH")` → 返回结构化结果，标注数据来源。

### 场景 2：查询地址余额
> 用户："帮我查一下 0x742d35Cc... 的 ETH 余额"

Agent 识别余额查询意图 → 调用 `getBalance("ethereum", "0x742d35Cc...")` → 返回余额结果。

### 场景 3：上下文感知查询
> 用户先连接钱包，然后问："我的余额是多少？"

Agent 通过 system prompt 中注入的钱包地址自动查询，无需用户手动输入地址。

### 场景 4：转账操作
> 用户："帮我转 1 SOL 到 xxx"

Agent 识别转账意图 → 调用 `createTransferCard` → 前端渲染 SolanaTransferCard → 用户确认签名 → 链上执行。

### 场景 5：风险边界处理
> 用户："你帮我判断现在该不该重仓买 ETH"

Agent 不给出交易建议，提供数据参考 + 风险提示 + 免责声明。

## 当前状态

- **项目版本**：v0.8.0
- **当前阶段**：Solana 多链钱包支持 + 转账适配器架构已完成
- **测试覆盖**：31 个测试文件，238 个测试用例，100% 通过率
- **E2E 测试**：18 个用例覆盖 API、对话、转账、基础功能

## 快速开始

### 环境要求
- Node.js >= 18
- pnpm >= 8

### 安装与运行

```bash
# 安装依赖
pnpm install

# 配置环境变量
cp apps/web/.env.example apps/web/.env.local
# 编辑 .env.local 填入配置

# 启动开发服务器
pnpm dev
```

访问 http://localhost:3000

### 运行测试

```bash
# 单元测试
pnpm test

# E2E 测试
pnpm test:e2e

# 类型检查
pnpm type-check
```
