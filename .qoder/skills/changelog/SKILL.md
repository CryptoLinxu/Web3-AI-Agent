---
name: changelog
description: 在项目代码变更后自动记录 changelog，包含架构设计内容和变更详情。在 /update-map 执行时触发，用于维护项目变更历史，方便 AI 了解每次改动的上下文。触发场景：pipeline 执行完毕后、update-map 执行时、feat/patch/refactor 等交付型任务完成时。
---

# Changelog

## 作用

记录项目每次代码变更的完整历史，包括架构设计决策和变更详情，为后续 AI 任务提供上下文参考。

## 触发条件

- `/update-map` 执行时自动触发
- 仅在交付型任务（FEAT/PATCH/REFACTOR）完成后记录
- 探索型任务（DISCOVER/BOOTSTRAP/VERIFY）不记录

## 输入

- 当前任务的 pipeline 类型（FEAT/PATCH/REFACTOR）
- `/architect` 输出的架构设计内容（如执行）
- 代码变更摘要（从 git diff 或任务描述中提取）
- 任务完成状态

## 输出位置

`docs/changelog/` 目录下，按日期创建文件：
- 格式：`YYYY-MM-DD-{task-type}.md`
- 示例：`2026-04-21-feat-chat-integration.md`

## 记录格式

```markdown
# Changelog - {YYYY-MM-DD}

## 任务信息
- **类型**: [FEAT|PATCH|REFACTOR]
- **主题**: {任务标题}
- **Pipeline**: {执行的 pipeline 链路}
- **完成时间**: {时间戳}

## 架构设计

> 仅在执行了 /architect 时记录此部分

### 目标
{架构设计目标}

### 模块边界
{影响的模块和边界变化}

### 接口契约
{新增或修改的接口}

### 数据流/状态流
{关键流程变化}

### 风险点
{识别的风险和应对措施}

## 变更详情

### 新增
- {新增的功能/文件/模块}

### 修改
- {修改的内容和原因}

### 删除
- {删除的内容和原因}

### 修复
- {修复的问题}（仅 PATCH）

## 影响范围

- **影响模块**: {列出受影响的模块}
- **破坏性变更**: [是/否]
- **需要迁移**: [是/否]

## 上下文标记

> 为后续 AI 任务提供快速索引

**关键词**: {comma-separated keywords}
**相关文档**: {相关文档路径}
**后续建议**: {如果有未完成或需要注意的事项}
```

## 流程

1. **判断是否需要记录**
   - 检查当前任务类型是否为 FEAT/PATCH/REFACTOR
   - 探索型任务跳过记录

2. **收集变更信息**
   - 从任务上下文提取 pipeline 类型和主题
   - 检查是否执行了 /architect，如有则收集架构设计内容
   - 从 git diff 或任务描述中提取变更摘要

3. **生成 changelog 文件**
   - 在 `docs/changelog/` 创建文件
   - 按格式填写所有部分
   - 如某部分无内容（如 PATCH 无 architect），标注"无"或跳过

4. **更新索引**（可选）
   - 如项目根目录有 `CHANGELOG.md`，追加简要条目
   - 指向详细文档路径

## 边界

- 不记录探索型任务（DISCOVER/BOOTSTRAP）
- 不重复记录相同变更
- 不替代 `/digest` 的经验沉淀（digest 负责经验，changelog 负责变更事实）
- 不修改代码，仅记录文档

## 与 /update-map 的关系

- `/update-map` 负责更新项目状态和技能地图
- `/changelog` 负责记录变更历史和架构决策
- 两者互补，不混写内容
- 在 `/update-map` 流程中自动调用 `/changelog`

## 与 /digest 的关系

- `/digest` 记录：经验教训、最佳实践、踩坑记录
- `/changelog` 记录：变更事实、架构决策、接口变化
- 两者角度不同，都应在 pipeline 末尾执行

## 规则

1. 每次交付型任务必须记录 changelog
2. 架构设计内容必须完整记录（如执行了 architect）
3. 文件格式必须遵循标准模板
4. 关键词必须包含，便于后续 AI 检索
5. 破坏性变更必须明确标注
6. 如任务被拒绝或失败，不记录 changelog

## 示例

### FEAT 任务示例

```markdown
# Changelog - 2026-04-21

## 任务信息
- **类型**: FEAT
- **主题**: 添加 ETH 价格查询工具
- **Pipeline**: pm -> prd -> req -> check-in -> architect -> qa -> coder -> audit
- **完成时间**: 2026-04-21 14:30

## 架构设计

### 目标
为 Web3 工具集添加实时 ETH 价格查询能力，支持多数据源容错。

### 模块边界
- 新增 `packages/web3-tools/src/price/` 模块
- 不影响现有钱包和 gas 查询工具

### 接口契约
```typescript
interface PriceTool {
  getETHPrice(currency: 'USD' | 'CNY'): Promise<number>
}
```

### 数据流
用户请求 -> API路由 -> 价格工具 -> CoinGecko API (主) / Binance API (备) -> 返回结果

### 风险点
- API 限流：已实现缓存和降级策略
- 汇率波动：价格缓存 60 秒

## 变更详情

### 新增
- `packages/web3-tools/src/price/eth-price.ts` - ETH 价格查询实现
- `packages/web3-tools/src/price/data-sources.ts` - 多数据源管理
- `apps/web/app/api/tools/price/route.ts` - API 端点

### 修改
- `packages/web3-tools/src/index.ts` - 导出新工具

## 影响范围

- **影响模块**: web3-tools, web-api
- **破坏性变更**: 否
- **需要迁移**: 否

## 上下文标记

**关键词**: ETH价格,价格查询,CoinGecko,多数据源,web3-tools
**相关文档**: docs/Web3-AI-Agent-PRD-MVP.md
**后续建议**: 考虑添加更多币种支持
```
