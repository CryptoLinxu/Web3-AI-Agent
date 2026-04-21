# Changelog 补录指南

本文档说明如何为项目历史上已完成的功能补充 changelog 记录。

## 为什么需要补录

- 为 AI 提供完整的项目演进上下文
- 记录历史架构决策和设计思路
- 方便后续开发追溯变更原因

## 补录原则

1. **只补录交付型任务**（FEAT/PATCH/REFACTOR）
2. **探索型任务不补录**（文档学习、调研等）
3. **按时间顺序补录**，便于追溯
4. **基于 git 历史和现有文档**还原信息

## 补录流程

### 方法一：使用 `/changelog` 技能手动补录

1. **查看 git 历史**
   ```bash
   git log --oneline --since="2026-04-01"
   ```

2. **识别交付型提交**
   - `feat:` - 新功能
   - `fix:` - Bug 修复
   - `refactor:` - 重构

3. **收集信息**
   - 查看提交详情：`git show <commit-hash>`
   - 查看相关文档：`docs/` 目录下的 PRD、设计文档等
   - 查看代码变更：影响哪些模块

4. **创建 changelog 文件**
   - 在 `docs/changelog/` 目录下创建文件
   - 命名格式：`YYYY-MM-DD-{task-type}-{brief-desc}.md`
   - 按标准模板填写内容

### 方法二：批量补录脚本（推荐）

可以编写脚本自动分析 git 历史并生成 changelog 草稿。

## 历史功能清单

根据 git 历史，以下是需要补录的主要功能：

| 日期 | 类型 | 主题 | Commit |
|------|------|------|--------|
| 2026-04-20 | FEAT | Function Calling 调试日志 | e7a20ca |
| 2026-04-20 | FEAT | Web3 工具模块重构与代理支持 | 82a61e5 |
| 2026-04-20 | FEAT | AI 模型配置与 Web3 工具代理 | 602fc02 |
| 2026-04-17 | FEAT | 项目初始化与模型切换支持 | 84e5498 |

## 补录示例

### 示例 1：项目初始化

```markdown
# Changelog - 2026-04-17

## 任务信息
- **类型**: FEAT
- **主题**: 项目初始化与全局模型切换支持
- **Pipeline**: 初始化项目（无完整 pipeline）
- **完成时间**: 2026-04-17
- **Commit**: 84e5498

## 架构设计

### 目标
建立 Web3 AI Agent 项目基础架构，支持 Monorepo 结构和全局 AI 模型切换能力。

### 模块边界
- `apps/web/` - Next.js Web 应用
- `packages/ai-config/` - AI 模型配置管理
- `packages/web3-tools/` - Web3 工具集
- `skills/x-ray/` - AI Agent 技能体系

### 接口契约
```typescript
// AI 模型配置接口
interface AIModelConfig {
  provider: string
  apiKey: string
  model: string
}
```

### 数据流
用户选择模型 -> 更新 .env -> 服务端读取配置 -> 调用对应 AI API

## 变更详情

### 新增
- Monorepo 项目结构（pnpm workspace）
- Next.js Web 应用基础框架
- AI 模型配置模块
- 全局模型切换功能
- x-ray 技能体系 v3

## 影响范围

- **影响模块**: 全部（项目初始化）
- **破坏性变更**: 否
- **需要迁移**: 否

## 上下文标记

**关键词**: 项目初始化,Monorepo,模型切换,AI配置,Next.js
**相关文档**: ARCHITECTURE.md, README.md
**后续建议**: 无
```

### 示例 2：Web3 工具重构

```markdown
# Changelog - 2026-04-20

## 任务信息
- **类型**: FEAT
- **主题**: Web3 工具模块重构与代理支持
- **Pipeline**: FEAT（快速流程）
- **完成时间**: 2026-04-20
- **Commit**: 82a61e5

## 架构设计

### 目标
重构 web3-tools 模块，解决国内网络访问问题，添加 HTTP 代理支持。

### 模块边界
- 重构 `packages/web3-tools/src/tools/` 目录结构
- 新增代理配置管理
- 不影响上层 API 调用接口

### 接口契约
保持不变（内部重构）

### 数据流
工具调用 -> 检查代理配置 -> 使用代理发起 HTTP 请求 -> 返回结果

### 风险点
- 代理配置错误可能导致请求失败
- 已添加错误处理和降级策略

## 变更详情

### 新增
- HTTP 代理支持
- 多数据源容错机制

### 修改
- 重构 ETH 价格查询工具
- 重构钱包余额查询工具
- 重构 Gas 价格查询工具

### 修复
- 解决国内网络无法访问 CoinGecko API 的问题

## 影响范围

- **影响模块**: packages/web3-tools
- **破坏性变更**: 否
- **需要迁移**: 否

## 上下文标记

**关键词**: web3-tools,HTTP代理,网络容错,重构,CoinGecko
**相关文档**: docs/Web3-AI-Agent-PRD-MVP.md
**后续建议**: 考虑添加更多数据源
```

## 补录检查清单

补录完成后，确认：

- [ ] 文件命名符合规范（YYYY-MM-DD-{type}-{desc}.md）
- [ ] 包含完整的任务信息
- [ ] 架构设计部分已填写（如有）
- [ ] 变更详情准确反映 git diff
- [ ] 关键词包含便于 AI 检索
- [ ] 相关文档路径正确
- [ ] 按时间顺序排列（最早的在前）

## 批量补录建议

如果需要补录大量历史功能：

1. **按周分组**：同一周的功能可以合并到一个 changelog 文件
2. **优先级排序**：
   - P0：核心架构变更（项目初始化、模块拆分）
   - P1：重要功能（Web3 工具、AI 配置）
   - P2：小功能和优化
3. **利用现有文档**：从 PRD、设计文档、学习笔记中提取信息

## 自动化补录（未来优化）

可以考虑创建 `/backfill-changelog` 技能：
- 自动分析 git 历史
- 识别交付型提交
- 生成 changelog 草稿
- 人工审核后提交
