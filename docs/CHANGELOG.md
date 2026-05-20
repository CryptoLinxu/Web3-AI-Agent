# Web3 AI Agent 更新日志

本文档记录项目的完整变更历史，按时间倒序排列。

---

## v0.9.0 - 2026-05-19

### CI 修复 + Solana 分支合并

**类型**: FIX + MERGE | **提交**: 2bf12ef, 54283e8

#### 测试修复

- 修复适配器工厂测试用例导入方式（`require()` → ES `import`）
- Vitest 环境下 CommonJS `require()` 绕过 Vite 模块解析器，导致 `@` 路径别名无法识别
- 全部 13 个适配器测试用例通过

#### 分支合并

- 合并 Solana 多链钱包支持与转账功能到主线
- 更新项目文档

---

## v0.8.1 - 2026-05-08

### 文档体系重构

**类型**: REFACTOR | **提交**: 7121ea1 ~ f7d84f3 | **影响模块**: docs/

#### 文档结构调整

- 重构文档体系，合并重复内容，优化结构
- 迁移文档目录到 `content` 子目录
- 清理 Regenerate 生成的旧文档结构
- 添加 `_index.md` 索引文件兼容 Repo Wiki 识别
- 文档适配 Repo Wiki 索引机制

---

## v0.8.0 - 2026-05-07

### Solana 多链钱包支持 + 转账适配器架构

**类型**: FEAT | **提交**: be80246 | **分支**: solana-transfer

#### Solana 钱包适配器架构

新增完整的 Solana 网络支持，采用适配器模式实现 EVM/Solana 双链解耦：

- **TransferAdapter 抽象接口**：定义统一的 `getNetworkId()` / `getBalance()` / `sendTransfer()` / `estimateFee()` / `validateAddress()` 方法
- **SolanaAdapter 实现**（226 行）：支持 SOL 本币和 SPL Token（USDT、USDC）转账
- **EVMAdapter 实现**（82 行）：网络配置和地址校验
- **AdapterFactory 工厂模式**：根据 chain 类型自动创建对应适配器
- **AI 意图解析器**：`parseTransferIntent` + `checkNetworkConsistency` 自动识别转账网络
- **地址校验工具**：EVM（`/^0x[a-fA-F0-9]{40}$/`）和 Solana（`/^[1-9A-HJ-NP-Za-km-z]{32,44}$/`）双格式验证

#### 统一钱包 UI

- **UnifiedWalletButton**：统一钱包连接入口，支持 EVM/Solana 双链选择
- **UnifiedWalletModal**：钱包选择弹窗，EVM 直接触发 RainbowKit，Solana 展示钱包列表
- **useUnifiedWallet Hook**：合并 RainbowKit（EVM）和 @solana/wallet-adapter（Solana）状态，优先级：EVM > Solana > None

#### SolanaTransferCard 组件

- 完整的 Solana 转账卡片（416 行），支持 SOL 和 SPL Token
- 状态管理：pending → signing → confirmed/failed
- 余额查询和校验、错误处理、Supabase 持久化
- Solscan 浏览器链接集成
- MessageItem 条件渲染：根据 `chain` 字段自动选择 TransferCard 或 SolanaTransferCard

#### 钱包连接弹窗 UI 优化

- 去除中间选择步骤，点击后直接触发钱包连接
- 双主题样式隔离（浅色/深色）
- 光晕效果（紫色 + 青色双色 shadow）
- 断开按钮专业化（红色危险操作样式 + SVG 图标）

#### 新增依赖

- `@solana/web3.js` v1.98.4、`@solana/spl-token` v0.4.14
- `@solana/wallet-adapter-react` v0.15.39、`@solana/wallet-adapter-wallets` v0.19.38

#### 测试验证

- 类型检查：3/3 packages 全部通过
- 浏览器验收：10/10 全部通过
- 适配器单元测试：13 个用例，11 个通过

---

## v0.7.3 - 2026-04-30

### CI/CD Pipeline + Vercel 部署 + 钱包连接优化

**类型**: FEAT + FIX | **提交**: 222c955 ~ bade282 | **影响模块**: .github, vercel.json, apps/web

#### CI/CD 自动化部署

- **GitHub Actions Workflow**（`.github/workflows/ci-cd.yml`）：
  - 触发条件：push 到 main 分支或创建 PR
  - `lint-and-test` 任务：类型检查 + Lint + 单元测试
  - `deploy` 任务：Vercel 生产部署（仅 main 分支 push）
  - pnpm + Node.js 18 环境配置
- **Vercel 配置**（`vercel.json`）：构建命令、安装命令、框架识别

#### Vercel 部署修复（10+ 次迭代）

- 修复 Monorepo 架构生产环境依赖模型配置错误
- 修复 Tailwind CSS 在 Vercel 构建环境找不到的问题（devDependencies 不安装）
- 创建 `.npmrc` 解决 pnpm 隔离依赖问题
- 添加 `baseUrl` 修复 `@` 路径别名，改用精确 Tailwind 提升规则
- 修复 lockfile 同步问题（ERR_PNPM_OUTDATED_LOCKFILE）
- 降级 Vitest 到 3.1.0 修复 ESM 兼容性错误
- 修复 ERR_REQUIRE_ESM + jsdom/Vitest CI 崩溃的完整修复
- 修复依赖链 ESM / CJS 混用冲突
- 修复 8 个失败的单元测试
- 新增 `Vercel 部署 FAQ` 文档（366 行，6 个常见问题详解）

#### 钱包连接体验优化

- **RainbowKit connectorsForWallets**：使用官方 API 优化钱包连接体验
- **自定义钱包列表**：优化未安装钱包的引导体验
- **依赖修复**：添加 `@coinbase/wallet-sdk` 和 `@base-org/account` 依赖解决模块编译错误

---

## v0.7.2 - 2026-04-29

### Hardhat 本地网络支持 + 对话按需创建 + 系统 UI 重构

**类型**: FEAT + REFACTOR | **影响模块**: web3-tools, web-app

#### Hardhat 本地网络支持

- 扩展 `EvmChainId` 类型新增 `'hardhat'`（chainId: 31337）
- 链配置添加 Hardhat RPC 地址（默认 `http://127.0.0.1:8545`）
- wagmi 配置添加 Hardhat 链定义和传输层
- TransferCard 支持 Hardhat 网络展示
- 环境变量 `NEXT_PUBLIC_HARDHAT_RPC_URL` 支持自定义 RPC

#### 对话历史按需创建机制

- 重构对话创建逻辑：连接钱包时只查询最新对话，不再自动创建空对话
- 首次发送消息时才创建对话记录，避免数据库中产生大量空对话
- 无历史对话时显示欢迎页面，保持界面简洁
- `getLatestConversation()` 新增查询接口（仅查询不创建）

#### 系统 UI 重构

- 全面重构系统 UI 组件结构
- 清理 Hardhat 相关模块（Hardhat 添加后移除）
- 移除 Sepolia 测试网配置
- 测试状态：74/74 tests passed

---

## v0.6.1 - 2026-04-28

### 提示词模板管理 + Token Logo 展示 + Bug 修复

**类型**: FEAT + FIX | **提交**: c264fe0 ~ 5eb7dad | **影响模块**: apps/web

#### 提示词模板系统

- **PromptSelector 组件**：按分类（价格/余额/Gas/Token/转账）展示快捷提示词列表
- **PromptSelectorModal 弹窗**：沉浸式弹窗体验，ESC 键关闭，动画过渡
- **prompts.ts 配置**：集中管理 20+ 个预设提示词模板，支持分类过滤和 ID 查询
- **ChatInput 集成**：输入框新增"提示词模板"按钮，一键填充常用查询
- 分类元数据系统（图标 + 标签）

#### Token Logo 展示优化

- MarkdownRenderer 智能识别 Token Logo 图片（alt 含 logo/icon 或空 alt）
- Logo 图片行内渲染，16x16 尺寸 + `object-contain`
- 图片加载失败时静默隐藏（onError → display:none）

#### Favicon

- 添加 `/public/favicon.ico` 网站图标
- layout.tsx 配置 icon、shortcut、apple 三种 favicon 引用

#### Bug 修复

- 修复对话删除和切换时的两个交互 bug
- 修复转账卡片状态刷新后回退为"待确认"的问题
- 修复 Supabase RLS 迁移文件兼容性问题

---

## v0.7.2 - 2026-04-28

### P1 全量交付：RLS 升级 + E2E 覆盖完善

**类型**: PATCH | **安全增强 + 测试覆盖**

#### RLS 升级方案

- **服务端所有权验证 API**：`/api/supabase/verify-ownership`，数据库查询确认对话归属
- **服务端删除 API**：`/api/supabase/delete-conversation`，内置所有权验证
- **前端双重验证**：verify-ownership → delete-conversation 两步验证
- **生产 RLS Migration**：DELETE 策略升级为 `current_setting` 严格模式
- **部署文档**：新增生产环境 RLS 升级指南

#### E2E 测试覆盖完善

- 钱包上下文验证：有效/无效地址、不传地址 3 个场景
- verify-ownership API：无效参数/不存在对话/无效格式 3 个场景
- 转账卡片 UI：发送指令/卡片显示/不完整指令 3 个场景
- 总测试数：9 → 18 个，全部通过（53.0s）

#### 其他修复

- 钱包地址格式验证（isValidWalletAddress）
- SSR 主题闪烁修复

---

### 单元测试全覆盖体系

**类型**: FEAT | **版本**: v0.6.0

#### 测试体系

- **Vitest v3.2.4** Monorepo Workspace 配置
- **31 个测试文件**，**238 个测试用例**，**100% 通过率**
- 执行时间 ~10.5s

#### 模块分布

| 模块 | 测试文件 | 测试用例 |
|------|---------|---------|
| apps/web（supabase、theme、memory、tokens、hooks、components、api） | 17 | 130 |
| packages/ai-config（config、factory、providers） | 4 | 34 |
| packages/web3-tools（balance、chains、gas、price、token、transfer） | 10 | 74 |

#### Mock 策略

- 外部 SDK：`vi.mock()` + `vi.hoisted()`（OpenAI、Supabase）
- 定时器：`vi.useFakeTimers()` + `advanceTimersByTimeAsync()`
- 链式调用：逐层 mock（Supabase `.from().select().eq()`）
- 组件测试：`@testing-library/react` + `user-event`

#### 关键经验

- Supabase 链式调用 mock 需要完整 mock 每一层
- React Hook 测试中 result.current 可能为 null，需可选链
- vi.mock hoisting 陷阱：变量必须用 vi.hoisted() 提前声明

---

### E2E 测试框架 + 文档体系

**类型**: FEAT | **版本**: v0.7.0

- Playwright E2E 测试框架搭建
- 4 个测试文件：basic.spec.ts、api.spec.ts、chat.spec.ts、transfer.spec.ts
- 18 个 E2E 测试用例覆盖 API、对话、转账、基础功能
- E2E-TESTING.md 文档（466 行）
- 对话超时修复：淘汰 waitForTimeout，改用条件等待（textarea disabled/enabled 状态检测）
- 测试套件超时提升至 120s

---

### API 参考文档 + 部署文档更新

**类型**: FEAT

- **API-REFERENCE.md**（674 行）：/api/chat、/api/tools、/api/health、SSE 流式协议
- **DEPLOYMENT.md** v1.1：Supabase 数据库配置章节、环境变量扩充、RLS 升级指南

---

## v0.5.0 - 2026-04-24

### ERC20 Token 余额查询

**类型**: FEAT

- 新工具 `getTokenBalance(chain, address, tokenSymbol)`
- 通过 ERC20 `balanceOf` 链上查询，支持 USDT/USDC/DAI 等 Token
- 精度处理正确（USDT/USDC=6 位，DAI=18 位）
- AI 工具定义 + 独立 API 路由
- 解决 AI 把 ETH 余额误标为 USDT/USDC 的幻觉问题

---

### Web3 转账卡片功能

**类型**: FEAT | **版本**: v0.4.0

#### TransferCard 组件

- 338 行完整转账卡片组件
- 支持 ETH 原生转账和 ERC20 Token 转账
- 完整 Approve 流程：allowance 查询 → approve 调用 → 交易监听 → 二次校验
- 新增 `approving` 状态和授权 UI 按钮
- 新增 `TransferStatus` 类型添加 `approving` 状态
- 使用 `useReadContract` 检查授权额度，allowance 不足时自动显示授权步骤
- 状态管理：pending → signing → confirmed/failed
- Supabase 持久化：createTransferCard / updateTransferStatus / getTransferCardsByConversation

#### 转账工具

- `packages/web3-tools/src/transfer.ts`（99 行）
- Gas 估算、地址验证、区块链浏览器链接生成

#### AI 工具

- `createTransferCard` 工具定义，支持 EVM 和 Solana
- SSE `transfer_data` 事件类型
- useChatStream 新增 transfer_data 事件处理

#### 集成与修复

- 集成 AI 工具调用与前端覆查（chat API ↔ TransferCard 数据流）
- 修复 RainbowKit SSR hydration 警告
- 扩展 `ERC20_ABI` 增加 `allowance` 和 `approve` 方法
- 配置与数据库迁移（Supabase schema）

---

## v0.3.0 - 2026-04-23

### 钱包连接 + 对话持久化

**类型**: FEAT | **提交**: e11c285

#### 钱包连接

- **RainbowKit v2.2.10** + **Wagmi v2.19.5**
- 支持 MetaMask、WalletConnect、EIP-6963 自动发现
- OKX、Binance、Gate 等扩展钱包支持
- SSR 兼容性：cookieStorage + cookieToInitialState 方案
- 钱包连接状态持久化（刷新不丢失）
- 双配置策略：SSR 基础配置 / 客户端完整配置

#### Supabase 对话持久化

- PostgreSQL 云端数据库
- conversations 表 + messages 表 + transfer_cards 表
- RLS 行级安全策略
- 对话历史侧边栏（展示、切换、删除、新建）
- 钱包连接时自动加载历史对话
- 对话标题自动生成（基于首条消息前 30 字符）
- 增量更新（CustomEvent 传递数据，不重复加载）

#### 断开连接清空

- 客户端 UI 清空（memoryManager.clear + 欢迎消息）
- 保留 Supabase 云端数据
- 重连自动恢复最新对话

---

### UI 增强与全局主题系统

**类型**: FEAT | **Audit 评分**: 94/100

#### Markdown 渲染

- **MarkdownRenderer 组件**（222 行）：基于 `react-markdown` + `remark-gfm`
- 完整语法支持：标题、列表、加粗/斜体、代码块、链接、引用、表格、图片
- 双主题样式隔离（浅色/深色），品牌渐变色标记（cyan + violet）
- 链接自动 `target="_blank"` + 外部图标
- 代码块圆角背景 + 语法高亮区域
- AI 消息自动使用 Markdown 渲染，用户消息保留纯文本

#### Settings 面板

- **SettingsPanel 组件**（319 行）：右侧滑入式设置面板
- 主题模式切换（跟随系统/浅色/深色）三选一
- Memory 策略切换（L3 摘要压缩/L2 滑动窗口）二选一
- 多语言占位区（预留中英文切换）
- 版本信息展示
- 进场/退场动画（cubic-bezier 缓动 + 渐变光带）
- ESC 键关闭 + 点击遮罩关闭

#### ConfirmDialog 组件

- 自定义确认弹窗，替代原生 `confirm()`
- 紫色主题、圆角、毛玻璃背景
- ESC 键关闭 + 点击遮罩关闭
- Loading 状态（旋转图标 + 禁用按钮）
- 支持 variant（danger/warning/info）

#### 全局主题系统

- CSS 变量主题架构（globals.css）
- 3 种模式：Light / Dark / System
- ThemeProvider + ThemeContext + useTheme
- localStorage 持久化 + 系统主题监听（prefers-color-scheme）
- 全局组件主题适配
- RainbowKit 钱包按钮主题动态切换
- 平滑过渡动画（transition-colors duration-300）

#### 钱包上下文注入

- AI 自动感知用户钱包地址
- `createSystemPrompt(walletAddress, chainId)` 动态生成
- 用户查询"我的余额"时自动使用当前地址

---

## v0.2.0 - 2026-04-22

### 多链 Web3 工具架构重构

**类型**: FEAT + REFACTOR | **4 阶段重构**

#### 架构升级

将硬编码的单链/单币种工具重构为可扩展的多链架构：

- **链抽象层**：`packages/web3-tools/src/chains/`（配置 + 适配器模式）
  - EvmChainAdapter（Ethereum、Polygon、BSC）
  - BitcoinAdapter（Blockchain.info / Blockchair API）
  - SolanaAdapter（Solana JSON-RPC）
- **Token 注册表**：11 个主流 Token，3 条 EVM 链
- **工具参数化**：
  - `getTokenPrice(symbol)` → 5 种币种
  - `getBalance(chain, address)` → 5 条链
  - `getGasPrice(chain)` → 3 条 EVM 链
  - `getTokenInfo(chain, symbolOrAddress)` → Token 元数据查询
- **向后兼容**：旧函数标记 `@deprecated`，委托给新函数

#### 数据源容错

- 多数据源：Binance → Huobi
- 多 RPC 节点容错
- 代理支持（HTTPS_PROXY）

---

## v0.1.1 - 2026-04-21

### 最小会话 Memory 管理

**类型**: FEAT | **Audit 评分**: 82/100

#### L3 摘要压缩模式

- **MemoryManager 接口**：Strategy 模式，支持 L2/L3/L4 扩展
- **SummaryCompressionMemory 实现**（109 行）
  - 固定条数触发（默认 10 条），保留最近 5 条
  - 异步压缩，不阻塞用户输入
  - isCompressing 标志位防护并发
  - 摘要作为 system 消息注入
- **配置化管理**：compressThreshold、keepRecentCount、summaryModel
- **环境变量支持**

#### L2 滑动窗口策略

- SlidingWindowMemory 实现（57 行）
- 只保留最近 N 条，无 LLM 调用
- QA 验证 10/10 通过

---

### SSE 流式输出功能

**类型**: FEAT | **提交**: c366090

#### 后端

- `StreamChunk` 统一类型：content / tool_call / transfer_data / error
- `ReadableStream` 流式数据推送
- Accept 头检测流式请求
- 支持工具调用的流式场景（两次 API 调用）

#### 前端

- **useChatStream Hook**：管理流式状态
  - sendMessage 发起流式请求
  - abort 中断流式输出
  - 自动重试（MAX_RETRIES = 2）
  - 超时处理（TIMEOUT_MS = 30000）
  - 节流更新（THROTTLE_MS = 50ms）
- MessageItem / MessageList 流式内容实时展示
- 浏览器兼容：fetch + ReadableStream（非 EventSource）

---

## v0.1.0 - 2026-04-20

### AI 模型配置与 Web3 工具代理支持

**类型**: FEAT | **提交**: 602fc02

- HTTP 代理支持（HTTPS_PROXY），解决国内网络环境访问问题
- DeepSeek / 通义千问 国产模型配置示例
- ETH 价格查询多数据源容错（Binance → Huobi，移除 CoinGecko）
- node-fetch + https-proxy-agent 替代原生 fetch

---

### Web3 工具模块重构与直接调用

**类型**: FEAT | **提交**: 82a61e5

- Web3 工具从 API 路由层迁移至独立包直接调用
- Chat API 直接 import 工具函数，减少 HTTP 开销
- 数据源完全替换为国内可访问 API
- 简化 `/api/tools` 路由层职责

---

### Function Calling 调试日志

**类型**: FEAT | **提交**: e7a20ca

- Function Calling 完整调试日志支持
- 工具调用参数、返回值、错误信息可观测

---

## v0.1.0 - 2026-04-17

### 项目初始化与全局模型切换

**类型**: FEAT | **提交**: 84e5498 | **Pipeline 评分**: 99/100

#### 核心架构

- **Monorepo 结构**：pnpm workspace + turbo 2.x
- **Next.js Web 应用**：App Router、API Routes
- **AI 模型配置模块**（packages/ai-config）
  - OpenAI Provider 适配器
  - Anthropic Provider 适配器
  - LLMFactory 动态工厂
  - 全局模型切换（环境变量驱动）
- **Web3 工具模块**（packages/web3-tools）
  - ETH 价格查询（CoinGecko API）
  - 钱包余额查询
  - Gas 价格查询
- **TypeScript** 全项目覆盖，严格类型检查

#### Agent 能力

- Agent Loop v1：意图识别 → 工具调用决策 → 结果回填 → 自然语言回复
- Function Calling：工具定义、注册、调用完整流程
- 错误处理与降级回复
- 风险提示与免责声明

#### 技能体系

- x-ray 技能体系 V3（完整 SDLC 自动化）
  - 主技能：origin, pipeline
  - 定义技能：pm, prd, req
  - 设计技能：architect, qa
  - 实现技能：coder, audit
  - 辅助技能：explore, check-in, digest, update-map 等

#### API 端点

- `/api/chat` - 聊天接口
- `/api/tools` - Web3 工具接口
- `/api/health` - 健康检查

---

## 版本统计

| 指标 | 数值 |
|------|------|
| 总版本数 | v0.1.0 ~ v0.9.0 |
| 变更记录 | 23 条 |
| FEAT | 20 |
| PATCH | 1 |
| REFACTOR | 2 |
| MERGE | 1 |
| 活跃周期 | 2026-04-17 ~ 2026-05-19（33 天） |

## 模块变更频率

| 模块 | 变更次数 | 主要变更 |
|------|---------|---------|
| apps/web（UI/组件/Hooks） | 15 | 转账卡片、钱包、主题、流式输出、提示词管理、Markdown 渲染 |
| packages/web3-tools | 6 | 多链架构、Token 余额、转账工具 |
| packages/ai-config | 3 | 多模型、代理支持、流式输出 |
| .github/workflows | 3 | CI/CD Pipeline、Vercel 自动部署 |
| e2e/ | 2 | E2E 测试框架、覆盖完善 |
| supabase/ | 2 | 数据库初始化、RLS 升级 |
| docs/ | 3 | 文档体系重构、Repo Wiki 适配 |
| skills/x-ray | 1 | 技能体系 V3 |
