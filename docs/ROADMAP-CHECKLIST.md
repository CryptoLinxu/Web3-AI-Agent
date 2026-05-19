# Web3 AI Agent 路线图与检查清单

> 版本：v0.8.0 | 最后更新：2026-05-08

---

## 一、项目里程碑总览

```
Phase 1: 项目初始化          [████████████████████] ✅ 完成
Phase 2: 核心对话能力         [████████████████████] ✅ 完成
Phase 3: Web3 工具集          [████████████████████] ✅ 完成
Phase 4: 钱包与身份系统       [████████████████████] ✅ 完成
Phase 5: 转账功能             [████████████████████] ✅ 完成
Phase 6: 多链扩展 (Solana)    [████████████████████] ✅ 完成
Phase 7: 测试与质量保障       [████████████████████] ✅ 完成
Phase 8: 安全加固             [████████████████████] ✅ 完成
Phase 9: 用户体验优化         [██████░░░░░░░░░░░░░░] 🔄 进行中
Phase 10: 生产就绪            [██░░░░░░░░░░░░░░░░░░] ⏳ 待开始
```

---

## 二、已完成阶段 Checklist

### Phase 1：项目初始化 ✅

- [x] Monorepo 结构搭建（pnpm workspace + turbo 2.x）
- [x] Next.js 14 Web 应用基础框架
- [x] TypeScript 严格模式配置
- [x] Tailwind CSS 样式方案
- [x] 环境变量策略（.env.example）
- [x] AI 配置模块（packages/ai-config）：OpenAI + Anthropic Provider
- [x] LLMFactory 工厂模式
- [x] Web3 工具模块（packages/web3-tools）
- [x] x-ray 技能体系 V3
- [x] 项目文档体系建立

### Phase 2：核心对话能力 ✅

- [x] 聊天界面（Chat UI + MessageList + ChatInput）
- [x] Agent Loop v1（意图识别 → 工具调用 → 结果回填 → 回复生成）
- [x] Function Calling 完整流程
- [x] SSE 流式输出（ReadableStream + useChatStream Hook）
- [x] 节流更新（50ms）+ 自动重试（2 次）+ 超时处理（30s）
- [x] 多模型支持（OpenAI GPT / Anthropic Claude，环境变量切换）
- [x] 动态 system prompt（钱包上下文 + 网络上下文注入）
- [x] Markdown 渲染

### Phase 3：Web3 工具集 ✅

- [x] 多链价格查询：ETH/BTC/SOL/MATIC/BNB（Binance → Huobi 容错）
- [x] 多链余额查询：Ethereum/Polygon/BSC/Bitcoin/Solana
- [x] 多链 Gas 查询：EVM 链 EIP-1559 支持
- [x] Token 信息查询：11 个主流 Token 注册表
- [x] ERC20 Token 余额查询（getTokenBalance，balanceOf 链上查询）
- [x] 链抽象层（ChainAdapter 接口 + EVM/BTC/Solana 适配器）
- [x] HTTP 代理支持（HTTPS_PROXY，国内网络适配）
- [x] 多数据源容错机制

### Phase 4：钱包与身份系统 ✅

- [x] RainbowKit v2.2.10（EVM 钱包：MetaMask/WalletConnect/Coinbase/OKX/Binance 等 9+）
- [x] SSR 兼容性（cookieStorage + cookieToInitialState）
- [x] Supabase 对话持久化（conversations + messages 表）
- [x] 对话历史侧边栏（展示、切换、删除、新建）
- [x] 钱包上下文注入（AI 自动感知用户地址）
- [x] 断开连接清空 UI + 保留云端数据
- [x] 对话标题自动生成

### Phase 5：转账功能 ✅

- [x] TransferCard 组件（ETH 原生转账 + ERC20 Token 转账）
- [x] ERC20 Approve 完整流程（allowance 查询 → approve → 二次校验 → transfer）
- [x] createTransferCard AI 工具
- [x] SSE transfer_data 事件
- [x] Supabase 转账记录持久化
- [x] 转账状态管理（pending → signing → confirmed/failed）
- [x] 区块链浏览器链接集成

### Phase 6：多链扩展（Solana）✅

- [x] @solana/wallet-adapter 集成（Phantom/Solflare）
- [x] 统一钱包 UI（UnifiedWalletButton + UnifiedWalletModal）
- [x] useUnifiedWallet Hook（EVM/Solana 状态合并）
- [x] TransferAdapter 抽象接口 + AdapterFactory 工厂
- [x] SolanaAdapter 实现（SOL + SPL Token）
- [x] SolanaTransferCard 组件（416 行）
- [x] AI 意图解析器（parseTransferIntent + checkNetworkConsistency）
- [x] 地址校验工具（EVM + Solana 双格式）
- [x] MessageItem 条件渲染（chain 字段自动选择卡片）

### Phase 7：测试与质量保障 ✅

- [x] 单元测试体系（Vitest v3.2.4 Monorepo Workspace）
- [x] 31 个测试文件，238 个测试用例，100% 通过率
- [x] E2E 测试框架（Playwright 1.59.x）
- [x] 18 个 E2E 测试用例（API、对话、转账、基础功能）
- [x] 浏览器验收测试（7/7 通过）
- [x] Mock 策略完善（vi.mock + vi.hoisted + fake timers）

### Phase 8：安全加固 ✅

- [x] RLS 行级安全策略
- [x] 服务端所有权验证 API（verify-ownership）
- [x] 服务端删除 API（delete-conversation）
- [x] DELETE 双重验证（应用层 + 数据库层）
- [x] 生产 RLS Migration（current_setting 严格模式）
- [x] 钱包地址格式验证
- [x] 高风险问题风险提示与免责声明

---

## 三、当前阶段 Checklist

### Phase 9：用户体验优化 🔄

- [ ] **Anthropic 工具调用验证**
  - 验证多模型兼容性
  - 依赖 Anthropic API Key

- [ ] **错误边界和加载状态**
  - 钱包连接失败 UI 反馈
  - 网络错误 UI 反馈
  - 数据加载中状态

- [ ] **首屏性能优化**
  - 钱包 SDK 按需加载
  - 动态 import
  - Bundle 分析

- [ ] **更多浏览器验收测试**
  - 多钱包切换
  - 对话切换
  - 主题切换
  - 转账卡片完整流程

---

## 四、短期路线图（1-2 个月）

### 4.1 功能增强

- [ ] **自定义主题色**
  - 科技蓝、加密紫、暗夜绿等方案
  - 主题系统架构已完成，可扩展
  - 优先级：P1

- [ ] **多语言支持**
  - 中文、English、日本語切换
  - 优先级：P1

- [ ] **ERC20 Approve 完整流程验证**
  - TransferCard 授权流程端到端验证
  - 优先级：P0

- [ ] **钱包余额快捷查询**
  - 侧边栏显示当前钱包各链余额概览
  - 优先级：P1

- [ ] **对话标题 AI 生成**
  - 基于对话内容自动生成有意义的标题
  - 当前：基于首条消息截取（30 字符）
  - 优先级：P1

### 4.2 架构优化

- [ ] **console.log 替换为日志库**
  - winston / pino
  - 日志级别控制
  - 优先级：P1

- [ ] **错误处理统一化**
  - 各工具错误处理标准化
  - 统一错误码体系
  - 优先级：P1

- [ ] **RLS 策略全面升级为数据库层**
  - 当前 DELETE 已升级，SELECT/INSERT/UPDATE 仍为应用层
  - Supabase Auth + JWT 完整方案
  - 优先级：P0（生产前必须）

---

## 五、中期路线图（3-6 个月）

### 5.1 智能增强

- [ ] **RAG 知识库接入**
  - 支持协议文档和投研报告查询
  - 技术选型：向量数据库 + Embedding API
  - 优先级：P1

- [ ] **长期用户偏好 Memory**
  - 记住用户常用地址、偏好币种
  - L4 Memory 策略
  - 优先级：P1

- [ ] **更完整的风险控制**
  - 增强安全性和可信度
  - 自动化安全审计
  - 优先级：P0

### 5.2 功能扩展

- [ ] **多链支持扩展**
  - Arbitrum、Optimism、zkSync 等 L2
  - 基础架构已完成，可扩展
  - 优先级：P2

- [ ] **Mock 交易工具**
  - 模拟交易执行（不真实上链）
  - 优先级：P2

- [ ] **对话搜索**
  - 搜索历史对话内容
  - 优先级：P2

- [ ] **批量转账支持**
  - 一次操作转账给多个地址
  - 优先级：P2

---

## 六、长期愿景（6 个月+）

### 6.1 工程化

- [ ] **CI/CD 完善**
  - GitHub Actions 完整流水线
  - PR 预览部署
  - 自动化安全扫描
  - 优先级：P1

- [ ] **监控与可观测性**
  - Vercel Analytics 集成
  - 错误追踪（Sentry）
  - 性能监控
  - 优先级：P1

### 6.2 产品化

- [ ] **多 Agent 协作**
  - 复杂任务分解和协作
  - 优先级：P2

- [ ] **完整后台管理系统**
  - 用户管理、数据统计
  - 优先级：P2

- [ ] **自动交易执行**
  - 真实链上操作（高风险，需严格安全审计）
  - 优先级：P3

---

## 七、技术债务清单

| 编号 | 问题 | 影响 | 优先级 | 状态 |
|------|------|------|--------|------|
| TD-1 | RLS 策略未全面升级为数据库层 | 数据安全 | P0 | 部分完成（DELETE 已升级） |
| TD-2 | console.log 调试日志未替换 | 日志级别控制、性能 | P1 | 待处理 |
| TD-3 | 错误处理不统一 | 可维护性 | P1 | 待处理 |
| TD-4 | SSR 主题闪烁（~100ms） | 用户体验 | P2 | 已有内联脚本缓解 |
| TD-5 | Supabase 失败无 localStorage 降级 | 可用性 | P2 | 待处理 |
| TD-6 | CSS 变量命名可能与第三方库冲突 | 可维护性 | P3 | 待处理 |

---

## 八、验收标准

### MVP 验收标准

- [x] 用户可通过自然语言触发至少 2 个 Web3 工具
- [x] 工具结果可用于生成最终自然语言回复
- [x] 至少支持一次完整 Agent Loop
- [x] 系统支持基础流式输出
- [x] 会话可保留最小上下文
- [x] 高风险问题会触发风险提示与免责声明
- [x] 工具失败时不会输出伪造数据
- [x] 文档体系足以指导后续实现

### 项目完成标准

- [x] 文档体系完整
- [x] PRD 完整且可执行
- [x] Skill 体系完整且能串起全流程
- [x] MVP 可运行
- [ ] 生产环境部署验证
- [ ] CI/CD 流水线完整
- [ ] 安全审计通过
