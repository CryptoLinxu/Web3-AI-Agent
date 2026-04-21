# Changelog - 2026-04-20 (3/3)

## 任务信息
- **类型**: FEAT
- **主题**: 添加 Function Calling 调试日志
- **Pipeline**: PATCH（小功能优化）
- **完成时间**: 2026-04-20 18:28
- **Commit**: e7a20ca

## 架构设计

> 此任务为局部优化，未涉及结构变化，无独立架构设计。

## 变更详情

### 新增

#### 调试日志
在 `apps/web/app/api/chat/route.ts` 添加完整的 Function Calling 调试日志：

**第 1 次 API 调用日志**：
- 打印发送给 AI 的消息（含 system prompt 和用户输入）
- 打印工具定义列表
- 打印 AI 的回复（toolCalls 决定）

**第 2 次 API 调用日志**：
- 打印带工具结果的消息（含 role: 'tool' 消息）
- 打印 AI 的最终自然语言回复

### 修改
- `apps/web/app/api/chat/route.ts`（+18 行）
  - 在 Function Calling 的关键节点添加 console.log

### 删除
- 无

## 影响范围

- **影响模块**: apps/web/app/api/chat
- **破坏性变更**: 否
- **需要迁移**: 否

## 上下文标记

**关键词**: Function Calling,调试日志,Agent Loop,工具调用,两次API调用,学习辅助
**相关文档**: 
- apps/web/app/api/chat/route.ts
- docs/AI-Agent-核心概念学习指南.md（Agent Loop 相关章节）
**后续建议**: 
- 生产环境应考虑使用日志库（如 winston）替代 console.log
- 可添加日志级别控制（DEBUG/INFO/ERROR）

## 用途说明

此功能主要用于：
1. **学习辅助**：帮助开发者理解 Function Calling 的完整执行流程
2. **调试支持**：观察 Agent Loop 机制的两次 API 调用细节
3. **问题排查**：快速定位工具调用失败的原因
