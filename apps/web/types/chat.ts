import { TransferData } from './transfer'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  toolCalls?: ToolCall[]
  isError?: boolean
  transferData?: TransferData  // 转账卡片数据
}

export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
  result?: unknown
}

export interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
  }>
  walletAddress?: string // 当前登录的钱包地址（可选）
}

export interface ChatResponse {
  content: string
  toolCalls?: ToolCall[]
}
