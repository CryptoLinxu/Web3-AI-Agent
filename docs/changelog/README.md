# Changelog 目录

本目录记录项目的所有代码变更历史，为 AI 和开发者提供完整的变更上下文。

## 文件命名规范

格式：`YYYY-MM-DD-{task-type}.md`

示例：
- `2026-04-21-feat-chat-integration.md`
- `2026-04-22-patch-fix-auth-bug.md`
- `2026-04-23-refactor-module-split.md`

## 任务类型

- `feat` - 新功能开发
- `patch` - Bug 修复
- `refactor` - 重构优化

## 记录内容

每次交付型任务（FEAT/PATCH/REFACTOR）完成后，`/update-map` 会自动调用 `/changelog` 技能生成记录。

记录包括：
- 任务基本信息（类型、主题、Pipeline）
- 架构设计内容（如执行了 `/architect`）
- 变更详情（新增、修改、删除、修复）
- 影响范围（破坏性变更、迁移需求）
- 上下文标记（关键词、相关文档、后续建议）

## 与 digest 的区别

- **Changelog**：记录变更事实（What changed）
- **Digest**：记录经验教训（What we learned）

两者互补，都在 pipeline 末尾执行。

## 使用场景

1. **AI 上下文理解**：后续 AI 任务可通过查阅 changelog 了解历史变更
2. **开发者追溯**：快速定位某次变更的设计决策和影响范围
3. **项目审计**：完整的项目演进历史记录

## 自动触发

Changelog 在以下场景自动记录：
- `/pipeline feat` 执行完毕后
- `/pipeline patch` 执行完毕后
- `/pipeline refactor` 执行完毕后
- `/update-map` 执行时（仅交付型任务）

> 探索型任务（DISCOVER/BOOTSTRAP/VERIFY）不记录 changelog

## 已补录历史记录

| 日期 | 文件 | 主题 | Commit |
|------|------|------|--------|
| 2026-04-17 | [2026-04-17-feat-project-init.md](2026-04-17-feat-project-init.md) | 项目初始化与全局模型切换 | 84e5498 |
| 2026-04-20 | [2026-04-20-feat-proxy-and-models.md](2026-04-20-feat-proxy-and-models.md) | AI模型配置与Web3工具代理支持 | 602fc02 |
| 2026-04-20 | [2026-04-20-feat-web3-tools-refactor.md](2026-04-20-feat-web3-tools-refactor.md) | Web3工具模块重构与直接调用 | 82a61e5 |
| 2026-04-20 | [2026-04-20-feat-function-calling-debug.md](2026-04-20-feat-function-calling-debug.md) | Function Calling调试日志 | e7a20ca |

> 补录时间：2026-04-21
> 补录说明：根据 git 历史还原架构设计和变更详情
