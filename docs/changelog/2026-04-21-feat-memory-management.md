# Changelog - 2026-04-21

## 任务信息
- **类型**: FEAT
- **主题**: 最小会话 Memory 管理（L3 摘要压缩模式）
- **Pipeline**: origin -> pipeline(FEAT) -> prd -> req -> check-in -> architect -> qa -> coder -> audit -> digest -> update-map
- **完成时间**: 2026-04-21 18:00
- **Audit 评分**: 82/100（通过）

## 架构设计

### 目标
实现 L3 摘要压缩模式的会话 Memory 管理，在单次对话内定期将早期历史消息合并为摘要，降低 Token 消耗 ≥ 50%，同时采用 Strategy 模式预留 L2/L4 扩展接口。

### 模块边界
- 新增 `apps/web/lib/memory/` 模块（独立目录）
- 修改 `apps/web/app/page.tsx`（替换 `useState` 为 `MemoryManager`）
- 不影响 `apps/web/app/api/chat/route.ts`（API 层无需改动）
- 不影响 `packages/ai-config/`（LLM 调用层不受影响）

### 接口契约

```typescript
// MemoryManager 接口（Strategy 模式）
interface MemoryManager {
  addMessage(message: Message): void
  getMessages(): Message[]
  shouldCompress(): boolean
  compress(): Promise<void>
  clear(): void
}

// 配置接口
interface MemoryConfig {
  compressThreshold: number    // 触发压缩的消息数阈值（默认 10）
  keepRecentCount: number      // 保留的最近消息数（默认 5）
  summaryModel?: string        // 摘要用模型（可选）
}
```

### 数据流/状态流

```
用户输入
  │
  ▼
page.tsx 调用 memoryManager.addMessage(userMessage)
  │
  ▼
SummaryCompressionMemory 内部状态更新
  │
  ├─ shouldCompress() → 判断是否 ≥ threshold
  │   │
  │   ├─ false → getMessages() 返回完整历史
  │   │
  │   └─ true → 后台异步 compress()
  │       │
  │       ▼
  │       调用 LLM 生成摘要（/api/chat）
  │       │
  │       ▼
  │       更新状态: summary = 摘要, originalMessages = 最近 N 条
  │
  └─ getMessages() → [摘要(system), ...最近N条]
      │
      ▼
  发送到 /api/chat → AI 回复
```

### 风险点
| 风险 | 影响 | 应对措施 |
|------|------|---------|
| 摘要信息丢失 | AI 回复质量下降 | 保留最近 5 条原始消息 |
| 压缩失败 | 上下文不一致 | 降级保留完整历史，下次重试 |
| fetch 无超时 | 阻塞 > 2 秒 | 待补充 AbortController（Audit P0） |
| 并发压缩 | 状态混乱 | `isCompressing` 标志位防护 |

## 变更详情

### 新增
- `apps/web/lib/memory/types.ts` - MemoryManager 接口和 MemoryConfig 类型定义
- `apps/web/lib/memory/config.ts` - 配置管理模块（支持环境变量）
- `apps/web/lib/memory/SummaryCompressionMemory.ts` - L3 摘要压缩实现（109 行）
- `apps/web/lib/memory/index.ts` - 模块统一导出

### 修改
- `apps/web/app/page.tsx` - 替换 `useState<Message[]>` 为 `SummaryCompressionMemory` 实例
  - 新增：`memoryManager.addMessage()` 调用
  - 修改：`sendMessage()` 使用 `memoryManager.getMessages()` 获取上下文
  - 优化：AI 回复自动添加到 MemoryManager

### 删除
- 无

### 修复
- 无（FEAT 任务）

## 影响范围

- **影响模块**: apps/web (UI 层、Memory 管理层)
- **破坏性变更**: 否（向后兼容，仅内部管理逻辑变化）
- **需要迁移**: 否（用户无感知）

## 性能指标

| 指标 | 目标 | 当前状态 |
|------|------|---------|
| Token 消耗降低 | ≥ 50% | 待手动验证 |
| 压缩响应时间 | ≤ 2 秒 | 待手动验证（缺少超时控制） |
| 前端卡顿 | < 50ms | 待手动验证 |

## 技术决策

### 为什么选择固定条数触发而非 Token 阈值？
- ✅ 实现简单，性能可预测
- ✅ MVP 阶段足够
- ⚠️ 后续可扩展为 Token 阈值（更精确）

### 为什么采用 Strategy 模式？
- ✅ 支持 L2/L3/L4 策略无缝切换
- ✅ 符合开闭原则（对扩展开放，对修改封闭）
- ✅ 便于单元测试（可 Mock 不同策略）

### 为什么摘要作为 system 消息？
- ✅ LLM 对 system 角色赋予高权重
- ✅ 符合 OpenAI/Anthropic 的消息格式规范
- ✅ 不占用用户/助手消息配额

## 上下文标记

**关键词**: Memory管理,摘要压缩,L3,Strategy模式,Token优化,上下文管理,异步压缩
**相关文档**: 
- docs/Web3-AI-Agent-PRD-MVP.md（MVP 必做范围）
- docs/checklist/PROJECT-CHECKLIST.md（项目清单更新）
- docs/AI-Agent-核心概念学习指南.md（Memory 概念讲解）
**后续建议**: 
1. 补充 fetch 超时控制（AbortController，5 秒超时）
2. 添加 Memory 单元测试（压缩逻辑、边界条件、并发安全）
3. 手动验证 Token 降低效果（30 轮对话对比测试）
4. 实现 L2 SlidingWindowMemory 对比效果
5. 预留 L4 RAGMemory 扩展（向量数据库集成）
