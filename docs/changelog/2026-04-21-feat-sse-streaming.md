# Changelog - 2026-04-21

## 任务信息
- **类型**: FEAT
- **主题**: 实现聊天流式输出功能（SSE）
- **Pipeline**: FEAT（快速流程，含代码实现 + 文档更新）
- **完成时间**: 2026-04-21 13:40
- **Commit**: c366090

## 架构设计

### 目标
为 Web3 AI Agent 添加 SSE 流式输出支持，让用户能够实时看到 AI 回复的生成过程，提升交互体验。

### 模块边界
- `apps/web/app/api/chat/` - 后端 API 路由，处理 SSE 流式响应
- `packages/ai-config/src/providers/` - Provider 适配器，支持流式输出
- `packages/ai-config/src/types.ts` - 新增 StreamChunk 统一类型
- `apps/web/hooks/` - 前端 Hook，管理流式状态
- `apps/web/types/stream.ts` - 前端流式类型定义
- `apps/web/components/` - 消息组件，支持流式内容展示

### 接口契约

```typescript
// 后端统一流式输出块
interface StreamChunk {
  type: 'content' | 'tool_call' | 'done' | 'error'
  content?: string
  toolCall?: ToolCall
  error?: string
}

// 后端流式响应类型
export type StreamResponse = AsyncIterable<StreamChunk>

// 前端流式 UI 状态
interface StreamUIState {
  isStreaming: boolean
  content: string
  error: string | null
  toolCalls: ToolCallUIState[]
}

// 前端 Hook 返回接口
interface UseChatStreamReturn {
  isStreaming: boolean
  content: string
  error: string | null
  toolCalls: ToolCallUIState[]
  sendMessage: (messages: Array<{ role: string; content: string }>) => Promise<...>
  abort: () => void
}
```

### 数据流

**流式请求流程**：
1. 前端发送请求，设置 `Accept: text/event-stream` 请求头
2. 后端检测流式请求，创建 `ReadableStream`
3. Provider 适配器逐块生成 StreamChunk
4. 通过 `TextEncoder` 编码并推送到响应流
5. 前端 `EventSource` 或 `fetch + ReadableStream` 接收数据
6. `useChatStream` Hook 解析并更新 UI 状态

**工具调用流式场景**：
1. 第一次 API 调用：AI 决定调用工具（tool_call）
2. 工具执行结果回填
3. 第二次 API 调用：生成最终回复（content 流式推送）

### 风险点
- **浏览器兼容性**：EventSource 不支持自定义 headers，使用 fetch + ReadableStream 替代
- **错误处理**：流式过程中需要优雅处理中断、超时和错误
- **状态管理**：流式内容需要与现有消息列表正确合并
- **最大重试**：已设置 MAX_RETRIES = 2，避免无限重试
- **节流处理**：已设置 THROTTLE_MS = 50ms，减少 React 重渲染

## 变更详情

### 新增

#### 后端流式支持
- `packages/ai-config/src/types.ts` - 新增 StreamChunk 接口和 StreamResponse 类型
- `apps/web/app/api/chat/route.ts` - 新增 SSE 流式响应逻辑
  - 通过 Accept 头检测流式请求
  - ReadableStream 实现流式数据推送
  - 支持工具调用的流式场景

#### 前端流式 Hook
- `apps/web/hooks/useChatStream.ts` - **新增** SSE 流式消费 Hook
  - 管理流式状态（isStreaming, content, error, toolCalls）
  - sendMessage 方法发起流式请求
  - abort 方法中断流式输出
  - 自动重试机制（MAX_RETRIES = 2）
  - 超时处理（TIMEOUT_MS = 30000）
  - 节流更新（THROTTLE_MS = 50）

#### 前端类型定义
- `apps/web/types/stream.ts` - **新增** 流式输出类型定义
  - StreamChunk 前端类型
  - ToolCallUIState 工具调用 UI 状态
  - StreamUIState 流式 UI 状态

### 修改

#### Provider 适配器
- `packages/ai-config/src/providers/openai.ts` - 更新支持流式输出
- `packages/ai-config/src/providers/anthropic.ts` - 更新支持流式输出
- `packages/ai-config/src/providers/base.ts` - 更新基础接口支持流式

#### 前端组件
- `apps/web/app/page.tsx` - 集成 useChatStream Hook，支持流式交互
- `apps/web/components/MessageItem.tsx` - 支持流式内容实时展示
- `apps/web/components/MessageList.tsx` - 支持流式消息列表更新

## 影响范围

- **影响模块**: apps/web, packages/ai-config
- **破坏性变更**: 否（向后兼容，JSON 模式仍然支持）
- **需要迁移**: 否

## 上下文标记

**关键词**: SSE,流式输出,Streaming,ReadableStream,useChatStream,EventStream,实时响应,Provider适配器
**相关文档**:
- docs/Web3-AI-Agent-PRD-MVP.md（MVP 必做功能）
- docs/checklist/PROJECT-CHECKLIST.md
- skills/x-ray/MAP-V3.md
**后续建议**:
- 考虑添加流式输出的开关控制（用户可切换流式/非流式）
- 添加流式输出的视觉指示器（打字机效果、光标动画）
- 考虑支持 Server-Sent Events 原生 EventSource（简化实现）
