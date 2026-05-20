# Web3 AI Agent

一个能够理解用户意图、调用 Web3 工具、返回可信结果，并具备最小风险边界的 AI Agent。

## 项目简介

Web3 AI Agent 是一个面向 Web3 开发者和用户的智能助手项目，通过自然语言交互实现链上数据查询、转账操作等 Web3 场景的自动化处理。项目验证的核心理念是：构建一个能够理解用户意图、调用 Web3 工具、返回可信结果，并具备最小风险边界的 AI Agent

## 核心能力

- **多模型对话**：支持 OpenAI GPT / Anthropic Claude，流式输出 + SSE 实时推送
- **Agent Loop**：理解用户意图，自主决策工具调用，循环执行直到任务完成
- **Web3 工具集**：多链价格/余额/Gas/Token 查询，覆盖 ETH/BTC/SOL/MATIC/BNB
- **链上转账**：EVM + Solana 双链转账卡片，含 ERC20 Approve 完整流程
- **多链钱包**：RainbowKit（EVM）+ Solana wallet-adapter，统一钱包状态管理
- **对话持久化**：Supabase 云端存储，对话历史侧边栏（创建/切换/删除）
- **Memory 管理**：L2 滑动窗口 + L3 摘要压缩双策略，可切换
- **提示词模板**：20+ 预设提示词，按分类一键填充
- **安全加固**：RLS 行级安全、服务端所有权验证、钱包地址隔离

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Next.js 14 (App Router) + React 18 + TypeScript |
| 样式 | Tailwind CSS + CSS 变量主题系统 |
| AI | OpenAI API + Anthropic SDK（双 Provider 工厂模式） |
| Web3 | wagmi + viem + RainbowKit（EVM），@solana/web3.js + wallet-adapter（Solana） |
| 数据库 | Supabase（PostgreSQL + RLS） |
| 测试 | Vitest（单元测试）+ Playwright（E2E） |
| 构建 | pnpm workspace + Turborepo 2.x |
| 部署 | Vercel + GitHub Actions CI/CD |

## 项目结构

```
AI-Agent/
├── apps/
│   └── web/                    # Next.js Web 应用
│       ├── adapters/           # 转账适配器（TransferAdapter / SolanaAdapter / EVMAdapter）
│       ├── app/                # App Router 页面 + API Routes
│       │   └── api/            # chat / tools / health / supabase
│       ├── components/         # UI 组件（20+）
│       │   └── cards/          # 转账卡片（TransferCard / SolanaTransferCard / DexSwapCard）
│       ├── config/             # 提示词模板 + Solana 链配置
│       ├── hooks/              # useChatStream / useUnifiedWallet
│       ├── lib/                # memory（L2/L3）/ supabase / theme / wallet
│       ├── types/              # chat / stream / transfer 类型定义
│       └── utils/              # 地址校验工具
├── packages/
│   ├── ai-config/              # AI Provider 抽象层（OpenAI + Anthropic + LLMFactory）
│   └── web3-tools/             # Web3 工具集（价格/余额/Gas/Token/转账 + 链适配器）
├── e2e/                        # Playwright E2E 测试
├── supabase/                   # 数据库迁移脚本
├── docs/                       # 项目文档（PRD / 部署 / API / Changelog）
├── skills/                     # x-ray 技能体系 V3（SDLC 自动化）
└── .github/workflows/          # CI/CD Pipeline
```

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

```bash
cp apps/web/.env.example apps/web/.env.local
# 编辑 .env.local 填入你的配置
```

必需的环境变量：

| 变量 | 说明 |
|------|------|
| `DEFAULT_MODEL_PROVIDER` | AI Provider（`openai` / `anthropic`） |
| `OPENAI_API_KEY` | OpenAI API Key（使用 OpenAI 时必需） |
| `ANTHROPIC_API_KEY` | Anthropic API Key（使用 Claude 时必需） |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect 项目 ID |

### 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000

### 运行测试

```bash
pnpm test          # 单元测试（Vitest）
pnpm test:e2e      # E2E 测试（Playwright）
pnpm type-check    # 类型检查
pnpm lint          # 代码规范检查
```

## 文档索引

| 文档 | 说明 |
|------|------|
| [CHANGELOG](./docs/CHANGELOG.md) | 完整变更历史（v0.1.0 ~ v0.9.0） |
| [ROADMAP-CHECKLIST](./docs/ROADMAP-CHECKLIST.md) | 路线图与检查清单 |
| [TECHNICAL-DOCUMENTATION](./docs/TECHNICAL-DOCUMENTATION.md) | 技术文档（1000+ 行） |
| [API-REFERENCE](./docs/API-REFERENCE.md) | API 参考文档 |
| [DEPLOYMENT](./docs/DEPLOYMENT.md) | 部署文档（Vercel / Docker / 传统服务器） |
| [E2E-TESTING](./docs/E2E-TESTING.md) | E2E 测试文档 |
| [CI-CD-SETUP-GUIDE](./docs/CI-CD-SETUP-GUIDE.md) | CI/CD 配置指南 |

## 开发规范

本项目采用 Skill 驱动的开发流程：

1. **任何任务从 `origin` 进入** - 使用 `/origin` 命令启动
2. **交付型任务走 pipeline** - `/pipeline feat|patch|refactor`
3. **实施前必须经过 check-in** - 确认问题、边界、方案

## 当前状态

- **版本**: v0.9.0
- **已完成**: Phase 1 ~ Phase 8（项目初始化、对话能力、Web3 工具、钱包系统、转账功能、Solana 多链、测试体系、安全加固）
- **进行中**: Phase 9（用户体验优化）、Phase 10（生产就绪）
- 详见 [ROADMAP-CHECKLIST](./docs/ROADMAP-CHECKLIST.md)

## License

MIT
