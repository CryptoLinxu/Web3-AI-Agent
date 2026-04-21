// 流式输出类型定义

/** 流式输出块（与后端 StreamChunk 一致） */
export interface StreamChunk {
  type: 'content' | 'tool_call' | 'done' | 'error'
  content?: string
  toolCall?: {
    id: string
    type: 'function'
    function: {
      name: string
      arguments: string
    }
  }
  error?: string
}

/** 工具调用 UI 状态 */
export interface ToolCallUIState {
  id: string
  name: string
  arguments: Record<string, unknown>
  status: 'pending' | 'running' | 'done' | 'error'
  result?: unknown
}

/** 流式 UI 状态 */
export interface StreamUIState {
  isStreaming: boolean
  content: string
  error: string | null
  toolCalls: ToolCallUIState[]
}
