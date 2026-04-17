// AI 模型配置类型定义

/** 支持的模型提供商 */
export type ModelProvider = 'openai' | 'anthropic'

/** 消息角色 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool'

/** 消息 */
export interface Message {
  role: MessageRole
  content: string
  tool_call_id?: string
  name?: string
}

/** 工具定义 */
export interface Tool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, unknown>
      required?: string[]
    }
  }
}

/** 工具调用 */
export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

/** 对话选项 */
export interface ChatOptions {
  tools?: Tool[]
  temperature?: number
  maxTokens?: number
}

/** 对话响应 */
export interface ChatResponse {
  content: string | null
  toolCalls?: ToolCall[]
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

/** 模型配置 */
export interface ModelConfig {
  provider: ModelProvider
  apiKey: string
  model: string
  baseURL?: string
  temperature?: number
  maxTokens?: number
}

/** AI 全局配置 */
export interface AIConfig {
  defaultProvider: ModelProvider
  providers: Partial<Record<ModelProvider, ModelConfig>>
}

/** 提供商配置映射（从环境变量读取） */
export interface ProviderEnvConfig {
  openai: {
    apiKey: string
    model: string
    baseURL?: string
  }
  anthropic: {
    apiKey: string
    model: string
    baseURL?: string
  }
}
