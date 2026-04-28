# Web3 AI Agent Skill Map V3

> 最后更新：2026-04-28（第四版）
> 当前版本：v0.7.0
> 当前阶段：E2E测试框架+文档体系完成 → 9 E2E tests 8/9 通过

## 项目状态速览

| 模块 | 状态 | 说明 |
|------|------|------|
| 项目初始化 | ✅ 完成 | Monorepo + Next.js + Web3 工具 |
| 模型切换功能 | ✅ 完成 | 支持 OpenAI/Anthropic，Audit 99分 |
| Chat UI | ✅ 完成 | 基础对话 + 工具调用 + 流式输出 |
| 工具代码重构 | ✅ 完成 | 代码迁移至 packages/web3-tools，Audit 95分 |
| BTC 价格工具 | ✅ 完成 | 支持 Binance/Huobi 双数据源，Audit 98分 |
| SSE 流式后端 | ✅ 完成 | 双模型流式输出，Audit 93分 |
| SSE 流式前端 | ✅ 完成 | 前端消费 Hook + 流式渲染，Audit 95分 |
| Memory 管理 | ✅ 完成 | L2 滑动窗口 + L3 摘要压缩，Strategy 模式，QA 全通过 |
| **钱包登录** | ✅ 完成 | RainbowKit + Wagmi v2，支持 MetaMask/WalletConnect |
| **对话持久化** | ✅ 完成 | Supabase PostgreSQL，自动保存/加载 |
| **对话历史 UI** | ✅ 完成 | 侧边栏展示、切换、删除、新建 |
| **安全加固** | ✅ 完成 | RLS 策略 + 钱包地址隔离，Audit 88分 |
| **删除弹窗** | ✅ 完成 | ConfirmDialog 自定义组件 + Loading 状态 |
| **断开清空** | ✅ 完成 | 客户端 UI 清空 + Supabase 数据保留 |
| **全局主题系统** | ✅ 完成 | Light/Dark/System 三模式，CSS 变量架构，Audit 94分 |
| **钱包上下文注入** | ✅ 完成 | AI 自动感知钱包地址，system prompt 动态生成 |
| **转账卡片** | ✅ 完成 | AI 识别转账意图生成卡片，支持 ETH+ERC20 转账，数据持久化 |
| **Token 配置** | ✅ 完成 | 多链 Token 注册表，支持原生币和 ERC20 |
| **ERC20 余额查询** | ✅ 完成 | getTokenBalance 链上查询，支持 USDT/USDC/DAI，正确精度 |
| 单元测试体系 | ✅ 完成 | Vitest monorepo workspace，31 文件 238 tests 100% 通过 |
| **ERC20 Approve 流程** | ✅ 完成 | TransferCard 完整授权流程，二次 allowance 校验 |
| **API 参考文档** | ✅ 完成 | docs/API-REFERENCE.md，聊天/工具/健康检查/SSE 协议 |
| **部署文档更新** | ✅ 完成 | Supabase 配置、环境变量扩充、表结构说明 |
| **E2E 测试框架** | ✅ 完成 | Playwright chromium，9 E2E tests 8/9 通过 |
| 待验证 | 🔄 待办 | 浏览器验收、Anthropic 验证 |
| 待补充 | ⏳ 待办 | CI/CD |

## 已完成能力清单

### 核心功能
- ✅ **Chat UI**：基础聊天界面，消息列表，工具结果展示
- ✅ **多模型支持**：OpenAI + Anthropic 双模型切换
- ✅ **Web3 工具**：ETH/BTC/SOL/MATIC/BNB 价格、多链余额、Gas 价格、Token 信息、ERC20 余额查询
- ✅ **Agent Loop**：意图识别 → 工具调用 → 结果回填 → 回复生成
- ✅ **工具调用**：6 组核心 Web3 工具已接入（5 链/5 种原生币/11 Token/ERC20 余额查询）
- ✅ **SSE 流式后端**：双模型流式输出，支持 content/tool_call/done/error 事件
- ✅ **SSE 流式前端**：useChatStream Hook + 流式渲染，50ms 节流，30s 超时
- ✅ **钱包登录**：RainbowKit + Wagmi v2，支持 MetaMask/WalletConnect/EIP-6963
- ✅ **对话持久化**：Supabase PostgreSQL，自动保存/加载对话历史
- ✅ **对话历史管理**：侧边栏展示、切换、删除、新建对话
- ✅ **删除弹窗**：ConfirmDialog 自定义组件，紫色主题 + Loading 状态
- ✅ **断开清空**：钱包断开时清空 UI，保留 Supabase 数据，重连自动恢复
- ✅ **钱包上下文注入**：AI 自动感知钱包地址，查询“我的余额”时无需手动输入
- ✅ **转账卡片**：AI 识别转账意图，生成 TransferCard 组件，支持 ETH 原生转账和 ERC20 Token 转账
- ✅ **ERC20 余额查询**：通过 getTokenBalance 工具链上查询 USDT/USDC/DAI 等 Token 余额，使用正确精度格式化，解决 AI 幻觉问题

### 项目治理
- ✅ **Changelog 体系**：完整变更记录，AI 上下文追溯
- ✅ **Project Checklist**：功能清单 + 未来规划 + 优先级建议，项目自我进化
- ✅ **Skill Map**：技能地图实时更新，下一步入口清晰

### 安全与数据
- ✅ **Supabase 集成**：PostgreSQL 云端存储，实时同步
- ✅ **RLS 策略**：应用层钱包地址隔离，防止跨钱包数据访问
- ✅ **钱包上下文验证**：所有查询前强制验证 walletAddress
- ✅ **删除操作保护**：验证对话所有权，防止误删
- ✅ **密钥管理**：移除 .env.example 中的硬编码密钥
- ⚠️ **生产 RLS**：当前为应用层防护，生产需升级 Supabase Auth + JWT
- ✅ **MemoryManager 接口**：Strategy 模式，支持 L2/L3/L4 策略切换
- ✅ **L2 滑动窗口**：只保留最近 N 条，无 LLM 调用，实现简单（57 行）
- ✅ **L3 摘要压缩**：固定条数触发，保留最近 N 条，异步压缩（109 行）
- ✅ **配置化管理**：环境变量支持，工厂函数创建实例
- ⚠️ **前端集成**：当前仅使用 L3，L2 待后续添加切换 UI

### UI/UX 增强
- ✅ **全局主题系统**：Light/Dark/System 三模式切换
  - CSS 变量架构（globals.css）
  - ThemeProvider + ThemeContext + useTheme
  - localStorage 持久化 + 系统主题监听
  - 全局组件主题适配（page, ChatInput, ConversationHistory, SettingsPanel）
  - RainbowKit 钱包按钮主题动态切换
  - Audit 评分：94/100
- ✅ **删除弹窗美化**：ConfirmDialog 自定义组件
  - 紫色主题、圆角、毛玻璃背景
  - ESC 键关闭 + 点击遮罩关闭
  - Loading 状态（旋转图标 + 禁用按钮）
  - 支持 variant（danger/warning/info）
- ✅ **断开连接优化**：客户端 UI 清空 + 欢迎消息
- ⚠️ **SSR 主题闪烁**：刷新页面短暂看到默认主题（~100ms，P3 优化项）

### 工程能力 (v0.6.0)
- ✅ **Monorepo**：pnpm workspace + turbo 构建
- ✅ **类型安全**：TypeScript 全项目覆盖
- ✅ **配置管理**：环境变量驱动模型切换
- ✅ **统一接口**：`ILLMProvider` 适配器模式
- ✅ **工具模块化**：Web3 工具集中管理，直接导入调用
- ✅ **流式接口**：`chatStream()` 方法 + SSE/JSON 双模式响应
- ✅ **前端 SSE 消费**：ReadableStream + 事件解析 + 节流更新
- ✅ **链抽象层**：ChainConfig + ChainAdapter 接口，EVM 链统一处理
- ✅ **主题系统架构**：lib/theme/ 完整架构（types, Context, Provider）
- ✅ **卡片组件架构**：apps/web/components/cards/ 独立目录，支持可扩展卡片类型 (TransferCard, DexSwapCard)
- ✅ **单元测试体系**：Vitest v3.2.4 monorepo workspace
  - apps/web（130 tests）：supabase、theme、memory、tokens、hooks、components、api
  - packages/ai-config（34 tests）：config、factory、providers
  - packages/web3-tools（74 tests）：balance、chains、gas、price、token、transfer
  - Mock 策略：vi.mock() + vi.hoisted() + vi.fn()
  - 组件测试：@testing-library/react + jsdom
  - 详见：docs/test-report.md、docs/digest/2026-04-28-unit-test-coverage.md

### 文档体系
- ✅ [README.md](/README.md) - 项目总览
- ✅ [ARCHITECTURE.md](/ARCHITECTURE.md) - 架构设计
- ✅ [PRD-MVP.md](/docs/Web3-AI-Agent-PRD-MVP.md) - 产品需求
- ✅ [里程碑 Checklist](/docs/Web3-AI-Agent-项目里程碑-Checklist.md) - 进度跟踪
- ✅ [docs/changelog/](/docs/changelog/README.md) - 变更历史记录
- ✅ [docs/checklist/](/docs/checklist/PROJECT-CHECKLIST.md) - 项目清单与规划
- ✅ **转账工具**：packages/web3-tools/src/transfer.ts (99行)
- ✅ [supabase/migrations/](/supabase/migrations/) - 数据库迁移脚本 (transfer_cards 表)
- ✅ [Skill Map](/skills/x-ray/MAP-V3.md) - 技能地图
- ✅ [supabase/init.sql](/supabase/init.sql) - 数据库初始化脚本

### 工程能力
- ✅ **Monorepo**：pnpm workspace + turbo 构建
- ✅ **类型安全**：TypeScript 全项目覆盖
- ✅ **配置管理**：环境变量驱动模型切换
- ✅ **统一接口**：`ILLMProvider` 适配器模式
- ✅ **工具模块化**：Web3 工具集中管理，直接导入调用
- ✅ **流式接口**：`chatStream()` 方法 + SSE/JSON 双模式响应
- ✅ **前端 SSE 消费**：ReadableStream + 事件解析 + 节流更新
- ✅ **链抽象层**：ChainConfig + ChainAdapter 接口，EVM 链统一处理
- ✅ **主题系统架构**：lib/theme/ 完整架构（types, Context, Provider）

```bash
# 1. 安装依赖
pnpm install

# 2. 配置环境变量
cp apps/web/.env.example apps/web/.env.local
# 编辑 .env.local 填入：
# - NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - OPENAI_API_KEY 或 ANTHROPIC_API_KEY

# 3. 启动开发服务器
pnpm dev
# 访问 http://localhost:3000
```

代码中使用：
```typescript
// Web3 工具调用
import { getBalance, getTokenPrice } from 'web3-tools'
const balance = await getBalance('ethereum', '0x...')

// AI 对话（带钱包上下文）
import { LLMFactory } from '@web3-ai-agent/ai-config'
const provider = LLMFactory.getProvider()
const response = await provider.chat(messages, { 
  tools,
  walletAddress: '0x...' // 可选，AI 会自动感知
})

// 对话持久化
import * as conversationService from '@/lib/supabase/conversations'
await conversationService.saveMessage(convId, message)

// 主题切换
import { useTheme } from '@/lib/theme/ThemeContext'
const { theme, setTheme, resolvedTheme } = useTheme()
setTheme('light') // 'light' | 'dark' | 'system'
```

## 项目结构

```
AI-Agent/
├── apps/
│   └── web/                    # Next.js Web 应用
│       ├── app/
│       │   ├── api/
│       │   │   ├── chat/       # 对话 API（使用 ai-config）
│       │   │   └── tools/      # 工具 API
│       │   └── page.tsx        # Chat UI（集成 MemoryManager）
│       ├── components/
│       │   ├── cards/          # 转账卡片组件目录
│       │   │   ├── TransferCard.tsx    # 转账卡片核心组件 (338行)
│       │   │   ├── DexSwapCard.tsx     # DexSwap 卡片预留
│       │   │   └── index.ts            # 统一导出
│       │   ├── MessageItem.tsx # 消息项（渲染卡片）
│       │   └── ...
│       ├── lib/
│       │   ├── memory/         # Memory 管理模块
│       │   ├── supabase/       # Supabase 数据访问层
│       │   │   ├── conversations.ts    # 对话 CRUD
│       │   │   └── transfers.ts        # 转账卡片 CRUD (146行)
│       │   ├── tokens.ts       # Token 配置管理
│       │   └── theme/          # 主题系统
│       ├── types/
│       │   ├── chat.ts         # 聊天类型（含 transferData）
│       │   ├── stream.ts       # SSE 流式类型（含 transfer_data）
│       │   └── transfer.ts     # 转账类型定义
│       └── .env.example        # 多模型配置示例
│       │       ├── types.ts    # MemoryManager 接口
│       │       ├── config.ts   # 配置管理
│       │       ├── SummaryCompressionMemory.ts  # L3 实现
│       │       └── index.ts    # 模块导出
│       └── .env.example        # 多模型配置示例
├── packages/
│   ├── ai-config/              # AI 模型配置包
│   │   ├── src/
│   │   │   ├── types.ts        # 统一类型定义
│   │   │   ├── config.ts       # 配置管理
│   │   │   ├── factory.ts      # LLM 工厂
│   │   │   └── providers/      # 提供商适配器
│   │   │       ├── openai.ts   # OpenAI 适配器
│   │   │       └── anthropic.ts # Anthropic 适配器
│   │   └── package.json
│   └── web3-tools/             # Web3 工具包
├── docs/                       # 项目文档
├── skills/x-ray/               # Skill 体系
└── README.md
```

## 待办事项（下一步）

### 高优先级
- [x] **ERC20 Approve 流程**：实现完整的 Token 授权流程 (P0) — 已完成，代码已实现完整
- [x] **测试覆盖**：为核心功能添加单元测试和集成测试（含 Memory 管理、Supabase 数据层、getTokenBalance）— 已完成
- [x] **部署文档**：补充生产环境部署指南 — 已完成
- [x] **API 文档**：补充详细 API 接口文档 — 已完成
- [ ] **Anthropic 验证**：实际测试 Anthropic 工具调用链
- [ ] **浏览器验收**：测试主题切换、钱包上下文、删除弹窗、断开清空、转账卡片

### 中优先级
- [ ] **生产 RLS 升级**：Supabase Auth + JWT（生产部署前必须）
- [ ] **消除 SSR 主题闪烁**：layout.tsx 添加同步脚本（20 分钟）
- [ ] **E2E 测试完善**：添加钱包连接和转账卡片 E2E 测试

### 低优先级
- [ ] **钱包地址格式验证**：route.ts 添加正则验证（10 分钟）
- [ ] **CSS 变量命名冲突**：添加项目前缀 --w3a-*（15 分钟）
- [ ] **CI/CD**：自动化测试和部署流程
- [ ] **监控告警**：运行时监控和错误告警

## 下一步建议入口

- `/origin` - 新任务入口
- `/browser-verify` - 浏览器验收测试（验证主题切换、钱包上下文、删除弹窗、转账卡片）
- `/explore` - 探索项目现状
- `/pipeline feat` - 开发新功能（如自定义主题色、多语言支持、RAG 知识库）
- `/pipeline patch` - 修复 SSR 主题闪烁、添加钱包地址验证、完善 E2E 测试

## 历史状态

> 2026-04-28：E2E 测试框架 + 文档体系完成（v0.7.0）→ Playwright chromium 9 tests 8/9 通过，API 文档 674 行，部署文档更新（Supabase），ERC20 Approve 流程验证完成，新增 changelog
> 2026-04-28：单元测试全覆盖完成（v0.6.0）→ 31 文件 238 tests 100% 通过，测试报告+复盘文档
> 2026-04-24：新增 getTokenBalance 工具（v0.5.1）→ 链上查询 ERC20 Token（USDT/USDC/DAI）余额，使用正确精度格式化，解决 AI 把 ETH 余额误标为 USDT/USDC 的幻觉问题，Web3 工具从 5 组增至 6 组
> 2026-04-24：Web3 转账卡片功能完成（v0.5.0）→ 支持 ETH+ERC20 转账、数据持久化、状态恢复、卡片可扩展架构，新增 7 文件 14 修改
> 2026-04-23：UI 增强与全局主题系统 + 钱包上下文注入完成（v0.4.0，Audit 94分）→ 删除弹窗/断开清空/浅色主题/walletAddress 注入，用户体验全面提升
> 2026-04-23：Memory 管理 L2 滑动窗口策略完成（QA 10/10 通过）→ L2+L3 双策略并存，Strategy 模式验证成功
> 2026-04-21：Memory 管理（L3 摘要压缩）完成（Audit 82分）→ MVP 核心功能基本完成，MVP 完成率 95%
> 2026-04-21：project-checklist 体系建立完成 → 项目自我进化能力形成，后续规划清晰
> 2026-04-21：SSE 流式输出功能提交（前后端完整实现）→ 用户可实时看到 AI 回复生成过程
> 2026-04-17：SSE 流式输出前端完成（Audit 95分）→ 全链路流式实现
> 2026-04-17：BTC 价格工具完成（Audit 98分）→ 支持 Binance/Huobi 双数据源  
> 2026-04-17：Web3 工具重构完成（Audit 95分）→ 代码结构优化，待功能测试验证  
> 2026-04-17：全局模型切换功能已完成（Audit 99分）→ 可继续其他功能开发或测试验证  
> 2026-04-17：阶段 1 完成（项目初始化）→ 准备进入阶段 2（PRD 已就绪）

## 项目状态速览

| 模块 | 状态 | 说明 |
|------|------|------|
| 项目初始化 | ✅ 完成 | Monorepo + Next.js + Web3 工具 |
| 模型切换功能 | ✅ 完成 | 支持 OpenAI/Anthropic，Audit 99分 |
| Chat UI | ✅ 可用 | 基础对话 + 工具调用 |
| 待测试 | 🔄 待验证 | Anthropic 工具调用需实际测试 |

## 新增能力

- **多模型支持**：通过 `packages/ai-config` 包统一管理
- **配置驱动**：环境变量切换模型，无需改代码
- **统一接口**：`ILLMProvider` 接口屏蔽 SDK 差异
- **工厂模式**：`LLMFactory` 管理模型实例生命周期

## 使用方式

```bash
# 配置环境变量
DEFAULT_MODEL_PROVIDER=openai  # 或 anthropic
OPENAI_API_KEY=your_key

# 启动开发服务器
pnpm dev
```

代码中使用：
```typescript
import { LLMFactory } from '@web3-ai-agent/ai-config'
const provider = LLMFactory.getProvider()
const response = await provider.chat(messages, { tools })
```

## 下一步建议入口

- `/origin` - 新任务入口
- `/browser-verify` - 浏览器验收测试
- `/explore` - 探索项目现状
- `/pipeline feat` - 继续开发新功能（如流式响应）
- `/pipeline patch` - 修复测试中发现的问题

## 0. ASCII 总流程图

```text
+------------------+
|      origin      |
|  一级任务识别入口  |
+---------+--------+
          |
          v
+------------------------------+
| 任务类型判断                  |
| DISCOVER / BOOTSTRAP /       |
| DEFINE / DELIVER-* /         |
| VERIFY-GOVERN                |
+---+------------+-------------+
    |            |
    |            +-----------------------------------------------+
    |                                                            |
    v                                                            v
+-----------+                                           +------------------+
| DISCOVER   |                                           | VERIFY/GOVERN    |
| explore    |                                           | qa / audit /     |
+-----------+                                           | browser-verify / |
                                                        | resolve-doc-...  |
                                                        | digest /         |
                                                        | update-map       |
                                                        +------------------+

    +------------------------------------------------------------+
    |                                                            |
    v                                                            v
+-------------+                                          +------------------+
| BOOTSTRAP   |                                          | DEFINE           |
| init-docs   |                                          | pm / prd / req   |
| ->          |                                          | -> check-in      |
| update-map  |                                          +------------------+
+-------------+

    +-----------------------------------------------------------------------+
    | 只有交付型任务进入 pipeline                                             |
    v
+--------------------------------------------------------------------------+
|                              pipeline                                    |
|                 FEAT / PATCH / REFACTOR 二级执行分流                      |
+-------------------+---------------------------+--------------------------+
                    |                           |
                    |                           |
                    v                           v
      +---------------------------+   +---------------------------+
      |      DELIVER-FEAT         |   |      DELIVER-PATCH        |
      | pm(按需) -> prd -> req    |   | req                       |
      | -> check-in               |   | -> check-in               |
      | -> architect -> qa        |   | -> coder -> qa           |
      | -> coder -> audit         |   | -> digest -> update-map  |
      | -> digest -> update-map   |   |                           |
      +-------------+-------------+   +-------------+-------------+
                    |                               |
                    |                               |
                    v                               v
            +------------------+          +------------------------------+
            | browser-verify   |          | 按需插入                     |
            | 前端/可视交互按需 |          | architect / audit /         |
            | 插入 audit 后     |          | browser-verify / prd        |
            +------------------+          +------------------------------+

                    +--------------------------------------------------+
                    |
                    v
          +-----------------------------+
          |    DELIVER-REFACTOR         |
          | req -> check-in             |
          | -> architect -> qa          |
          | -> coder -> audit           |
          | -> digest -> update-map     |
          +--------------+--------------+
                         |
                         v
              +------------------------------+
              | 按需插入                     |
              | prd / browser-verify         |
              +------------------------------+
```

## 1. 一级路由

```text
origin -> {DISCOVER | BOOTSTRAP | DEFINE | DELIVER-FEAT | DELIVER-PATCH | DELIVER-REFACTOR | VERIFY/GOVERN}
```

## 2. 二级路由

只有交付型任务进入 pipeline：

```text
DELIVER-FEAT -> pipeline(FEAT)
DELIVER-PATCH -> pipeline(PATCH)
DELIVER-REFACTOR -> pipeline(REFACTOR)
```

## 3. 三类交付流程

### FEAT

```text
origin -> pipeline(FEAT) -> pm(按需) -> prd -> req -> check-in -> architect -> qa -> coder -> audit -> digest -> update-map
```

### PATCH

```text
origin -> pipeline(PATCH) -> req -> check-in -> coder -> qa -> digest -> update-map
```

按需插入：
- `architect`
- `audit`
- `browser-verify`
- `prd`

### REFACTOR

```text
origin -> pipeline(REFACTOR) -> req -> check-in -> architect -> qa -> coder -> audit -> digest -> update-map
```

按需插入：
- `prd`
- `browser-verify`

## 4. 非交付任务流程

### DISCOVER

```text
origin -> explore
```

### BOOTSTRAP

```text
origin -> init-docs -> update-map
```

### DEFINE

```text
origin -> pm/prd/req -> check-in
```

### VERIFY / GOVERN

```text
origin -> qa / audit / browser-verify / resolve-doc-conflicts / digest / update-map
```

## 5. 固定规则

1. 没有 `origin` 判断，不直接进入 skill。
2. 没有 `check-in` 输出，不进入 `architect / qa / coder`。
3. `check-in` 只对实施型任务强制。
4. `PATCH` 默认不走 `pm / prd`。
5. `REFACTOR` 默认不走 `pm`。
6. `FEAT` 默认必须有 `prd + req`。

## 下一步建议

### 🎯 推荐入口（按优先级）

1. **已完成：ERC20 Approve 完整流程** ✅
   - TransferCard 已实现完整授权流程，二次 allowance 校验
   - 无需额外开发

2. **浏览器验收** (`/browser-verify`)
   - 验证转账卡片功能（ETH 转账、ERC20 转账、状态恢复）
   - 验证主题切换（Light/Dark/System）
   - 验证钱包上下文注入（查询“我的余额”）
   - 验证删除弹窗和断开清空
   - 测试多钱包切换场景

3. **消除 SSR 主题闪烁** (`/pipeline patch`)
   - layout.tsx 的 <head> 添加同步脚本
   - 预计 20 分钟

4. **添加钱包地址格式验证** (`/pipeline patch`)
   - route.ts 添加正则验证 `/^0x[a-fA-F0-9]{40}$/`
   - 预计 10 分钟

5. **完善 E2E 测试覆盖** (`/pipeline feat`)
   - 添加钱包连接 E2E 测试
   - 添加转账卡片完整流程 E2E 测试
   - 添加 ERC20 approve + transfer 端到端测试

### ⚠️ 生产前必须完成

- [x] 实现 ERC20 Approve 完整流程（P0，生产环境必须）— 已验证完成
- [x] 编写部署文档 — 已完成
- [x] 添加错误边界和加载状态
- [x] 优化首屏加载性能（钱包 SDK 按需加载）
- [ ] 配置 CI/CD 流程
