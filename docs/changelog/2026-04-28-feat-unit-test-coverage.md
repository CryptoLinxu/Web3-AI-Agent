# Changelog - 2026-04-28

## 任务信息
- **类型**: FEAT
- **主题**: 完整单元测试覆盖体系建设
- **Pipeline**: 测试体系规划 -> 架构设计 -> 分阶段实施 -> QA 验证 -> 全局验证
- **完成时间**: 2026-04-28 10:38

## 架构设计

### 目标
为项目建立完整的单元测试体系，覆盖 apps/web 和 packages 层核心逻辑，保证代码质量和防止回归。

### 模块边界
- **新增测试文件**: 31 个（apps/web 17个, packages/ai-config 4个, packages/web3-tools 10个）
- **新增配置文件**: 4 个（vitest.workspace.ts + 3个 vitest.config.ts）
- **不影响现有业务代码**，纯测试基础设施

### 技术选型

```
测试框架: Vitest v3.2.4
├── Monorepo: vitest workspace
├── apps/web: jsdom 环境 + @testing-library/react
├── packages/ai-config: node 环境
└── packages/web3-tools: node 环境

Mock 策略:
├── vi.mock() - 模块 mock
├── vi.hoisted() - 提前声明变量
├── vi.fn() - 函数 mock
└── vi.useFakeTimers() - 定时器控制
```

### 测试架构

```
vitest.workspace.ts
├── apps/web/vitest.config.ts (jsdom)
│   ├── lib/supabase/*.test.ts (46 tests)
│   ├── lib/theme/*.test.tsx (10 tests)
│   ├── lib/memory/*.test.ts (22 tests)
│   ├── lib/tokens.test.ts (6 tests)
│   ├── hooks/useChatStream.test.ts (9 tests)
│   ├── components/*.test.tsx (21 tests)
│   └── app/api/*/route.test.ts (8 tests)
├── packages/ai-config/vitest.config.ts (node)
│   └── src/__tests__/*.test.ts (34 tests)
└── packages/web3-tools/vitest.config.ts (node)
    └── src/__tests__/*.test.ts (74 tests)
```

### 关键设计决策

1. **Monorepo Workspace**: 使用 vitest workspace 而非单个配置，支持不同环境
2. **Mock 外部依赖**: 不 mock 被测逻辑，只 mock SDK/API/浏览器 API
3. **组件测试策略**: 测试用户可见行为，不测试实现细节
4. **异步测试模式**: 分步推进 fake timers，避免一次性推进导致超时

### 风险点
- **vi.mock hoisting 陷阱**: 变量必须用 vi.hoisted() 提前声明
- **链式调用 mock**: Supabase 需要完整 mock 每一层
- **React Hook 测试**: result.current 可能为 null，需要可选链访问

## 变更详情

### 新增测试文件 (31 个)

**apps/web (17 个):**
- `apps/web/test-setup.tsx` - 测试环境配置
- `apps/web/vitest.config.ts` - Vitest 配置
- `apps/web/lib/supabase/client.test.ts` - Supabase client 初始化
- `apps/web/lib/supabase/conversations.test.ts` - 对话 CRUD (28 tests)
- `apps/web/lib/supabase/transfers.test.ts` - 转账卡片管理
- `apps/web/lib/theme/ThemeContext.test.tsx` - 主题 Context
- `apps/web/lib/theme/ThemeProvider.test.tsx` - 主题 Provider (7 tests)
- `apps/web/lib/memory/config.test.ts` - 内存配置
- `apps/web/lib/memory/SlidingWindowMemory.test.ts` - 滑动窗口
- `apps/web/lib/memory/SummaryCompressionMemory.test.ts` - 摘要压缩
- `apps/web/lib/tokens.test.ts` - Token 列表过滤
- `apps/web/hooks/useChatStream.test.ts` - 流式对话 Hook (9 tests)
- `apps/web/components/ChatInput.test.tsx` - 输入组件 (5 tests)
- `apps/web/components/ConfirmDialog.test.tsx` - 确认对话框 (6 tests)
- `apps/web/components/ThemeSwitcher.test.tsx` - 主题切换 (3 tests)
- `apps/web/components/MarkdownRenderer.test.tsx` - Markdown 渲染 (6 tests)
- `apps/web/components/cards/DexSwapCard.test.tsx` - 兑换卡片
- `apps/web/app/api/health/route.test.ts` - 健康检查 API (3 tests)
- `apps/web/app/api/tools/route.test.ts` - 工具路由 API (5 tests)

**packages/ai-config (4 个):**
- `packages/ai-config/vitest.config.ts` - Vitest 配置
- `packages/ai-config/src/__tests__/config.test.ts` - 配置验证 (11 tests)
- `packages/ai-config/src/__tests__/factory.test.ts` - Provider 工厂 (8 tests)
- `packages/ai-config/src/__tests__/providers/base.test.ts` - 基类方法 (9 tests)
- `packages/ai-config/src/__tests__/providers/openai.test.ts` - OpenAI 适配器 (6 tests)

**packages/web3-tools (10 个):**
- `packages/web3-tools/vitest.config.ts` - Vitest 配置
- `packages/web3-tools/src/__tests__/balance.test.ts` - 余额查询 (6 tests)
- `packages/web3-tools/src/__tests__/gas.test.ts` - Gas 查询 (4 tests)
- `packages/web3-tools/src/__tests__/price.test.ts` - 价格查询 (6 tests)
- `packages/web3-tools/src/__tests__/token.test.ts` - Token 信息 (10 tests)
- `packages/web3-tools/src/__tests__/transfer.test.ts` - 转账工具 (8 tests)
- `packages/web3-tools/src/__tests__/chains/config.test.ts` - 链配置 (7 tests)
- `packages/web3-tools/src/__tests__/chains/evm-adapter.test.ts` - EVM 适配器 (11 tests)
- `packages/web3-tools/src/__tests__/chains/bitcoin.test.ts` - Bitcoin 适配器
- `packages/web3-tools/src/__tests__/chains/solana.test.ts` - Solana 适配器
- `packages/web3-tools/src/__tests__/tokens/registry.test.ts` - Token 注册表 (8 tests)

### 新增文档 (2 个)
- `docs/test-report.md` - 完整测试覆盖报告 (326 行)
- `docs/digest/2026-04-28-unit-test-coverage.md` - 复盘文档 (431 行)

### 修改配置 (4 个)
- `package.json` - 添加 vitest workspace 配置
- `apps/web/package.json` - 添加 @testing-library/react 依赖
- `packages/ai-config/package.json` - 添加 vitest 依赖
- `packages/web3-tools/package.json` - 添加 vitest 依赖

## 影响范围

- **影响模块**: 无（纯测试文件新增，不影响业务代码）
- **破坏性变更**: 否
- **需要迁移**: 否

## 测试统计

| 模块 | 测试文件 | 测试用例 | 通过率 |
|------|---------|---------|--------|
| apps/web | 17 | 130 | 100% ✅ |
| packages/ai-config | 4 | 34 | 100% ✅ |
| packages/web3-tools | 10 | 74 | 100% ✅ |
| **总计** | **31** | **238** | **100% ✅** |

## 上下文标记

**关键词**: 单元测试,Vitest,测试覆盖,Mock策略,React测试,组件测试,Monorepo,testing-library,238 tests
**相关文档**: 
- docs/test-report.md
- docs/digest/2026-04-28-unit-test-coverage.md
- docs/checklist/PROJECT-CHECKLIST.md
**后续建议**:
- 引入 @vitest/coverage-v8 精确测量覆盖率
- 补充 E2E 测试（Playwright/Cypress）
- 添加性能基准测试
- 持续维护测试用例随功能迭代
