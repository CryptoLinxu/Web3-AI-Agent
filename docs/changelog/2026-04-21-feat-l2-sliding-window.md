# Changelog - 2026-04-21

## 任务信息
- **类型**: FEAT
- **主题**: L2 滑动窗口策略（SlidingWindowMemory）
- **Pipeline**: origin -> pipeline(FEAT) -> req -> check-in -> coder -> qa -> digest -> update-map
- **完成时间**: 2026-04-21 19:00
- **QA 验证**: 10/10 全部通过

## 架构设计

### 目标
实现 L2 滑动窗口策略，作为 `MemoryManager` 接口的第二个实现，与 L3 摘要压缩策略并存，为后续用户选择不同策略预留能力。

### 模块边界
- 新增：`apps/web/lib/memory/SlidingWindowMemory.ts`
- 修改：`apps/web/lib/memory/index.ts`（增加导出）
- **不修改**：`apps/web/app/page.tsx`（保持使用 L3 策略）
- **不修改**：L3 实现和配置模块

### 接口契约
复用已有 `MemoryManager` 接口：
```typescript
interface MemoryManager {
  addMessage(message: Message): void
  getMessages(): Message[]
  shouldCompress(): boolean
  compress(): Promise<void>
  clear(): void
}
```

### 数据流/状态流
```
用户输入
  │
  ▼
SlidingWindowMemory.addMessage(message)
  │
  ▼
messages.push(message)
  │
  ▼
getMessages() → messages.slice(-windowSize)
  │
  ▼
返回最近 N 条消息（丢弃早期历史）
```

### 风险点
| 风险 | 影响 | 应对措施 |
|------|------|---------|
| 早期信息完全丢失 | 长对话上下文断裂 | 仅适用于短对话场景，L3 更适合长对话 |
| 窗口大小配置不当 | 保留过多/过少消息 | 默认 5 条，可通过环境变量调整 |

## 变更详情

### 新增
- `apps/web/lib/memory/SlidingWindowMemory.ts` - L2 滑动窗口实现（57 行）

### 修改
- `apps/web/lib/memory/index.ts` - 增加 `export { SlidingWindowMemory }`

### 删除
- 无

### 修复
- 无

## 影响范围

- **影响模块**: apps/web/lib/memory/
- **破坏性变更**: 否（纯新增，向后兼容）
- **需要迁移**: 否（前端未切换，仍使用 L3）

## 技术决策

### 为什么复用 keepRecentCount 作为窗口大小？
- ✅ 减少配置项，降低复杂度
- ✅ L2/L3 窗口语义一致（都是"保留最近 N 条"）
- ⚠️ 后续如需独立配置，可新增 `windowSize` 字段

### 为什么 shouldCompress() 返回 false？
- ✅ 滑动窗口策略无需压缩
- ✅ 符合接口契约（提供安全的空实现，而非抛异常）
- ✅ 调用方可统一检查 `if (memoryManager.shouldCompress())` 而不必关心策略类型

## 上下文标记

**关键词**: L2滑动窗口,SlidingWindowMemory,Strategy模式,Memory管理,无LLM调用
**相关文档**: 
- docs/checklist/PROJECT-CHECKLIST.md（项目清单更新）
- skills/x-ray/MAP-V3.md（技能地图更新）
- docs/changelog/2026-04-21-feat-memory-management.md（L3 变更记录）
**后续建议**: 
1. 添加策略切换 UI（用户选择 L2/L3）
2. 补充单元测试（SlidingWindowMemory.test.ts）
3. 对比 L2/L3 在实际对话中的 Token 消耗差异
