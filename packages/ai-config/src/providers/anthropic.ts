import Anthropic from '@anthropic-ai/sdk'
import { ILLMProvider } from './base'
import { Message, ChatOptions, ChatResponse, Tool, ToolCall } from '../types'

export interface AnthropicConfig {
  apiKey: string
  model: string
  baseURL?: string
  temperature?: number
  maxTokens?: number
}

export class AnthropicAdapter implements ILLMProvider {
  readonly name = 'anthropic'
  private client: Anthropic
  private config: AnthropicConfig

  constructor(config: AnthropicConfig) {
    if (!config.apiKey) {
      throw new Error('Anthropic API Key 不能为空')
    }

    this.config = {
      temperature: 0.7,
      maxTokens: 2000,
      ...config,
    }

    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    })
  }

  async chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse> {
    try {
      // 分离系统消息和普通消息
      const systemMessage = messages.find((m) => m.role === 'system')
      const conversationMessages = messages.filter((m) => m.role !== 'system')

      // 转换消息格式为 Anthropic 格式
      const anthropicMessages = conversationMessages.map((msg) => {
        if (msg.role === 'tool') {
          return {
            role: 'user' as const,
            content: [
              {
                type: 'tool_result' as const,
                tool_use_id: msg.tool_call_id || '',
                content: msg.content,
              },
            ],
          }
        }

        // 处理可能的 tool_use 内容
        const content: Array<
          | { type: 'text'; text: string }
          | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
        > = [{ type: 'text' as const, text: msg.content }]

        return {
          role: msg.role as 'user' | 'assistant',
          content,
        }
      })

      // 转换工具定义
      const tools = options?.tools?.map((tool) => ({
        name: tool.function.name,
        description: tool.function.description,
        input_schema: tool.function.parameters,
      }))

      // 调用 Anthropic API
      const response = await this.client.messages.create({
        model: this.config.model,
        messages: anthropicMessages,
        system: systemMessage?.content,
        tools: tools,
        temperature: options?.temperature ?? this.config.temperature,
        max_tokens: (options?.maxTokens ?? this.config.maxTokens) || 2000,
      })

      // 转换响应
      const contentBlocks = response.content
      const textContent = contentBlocks
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('')

      const toolUseBlocks = contentBlocks.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      )

      const toolCalls: ToolCall[] | undefined =
        toolUseBlocks.length > 0
          ? toolUseBlocks.map((block) => ({
              id: block.id,
              type: 'function' as const,
              function: {
                name: block.name,
                arguments: JSON.stringify(block.input),
              },
            }))
          : undefined

      return {
        content: textContent || null,
        toolCalls,
        usage: response.usage
          ? {
              promptTokens: response.usage.input_tokens,
              completionTokens: response.usage.output_tokens,
              totalTokens: response.usage.input_tokens + response.usage.output_tokens,
            }
          : undefined,
      }
    } catch (error) {
      if (error instanceof Anthropic.APIError) {
        throw new Error(`Anthropic API 错误: ${error.message}`)
      }
      throw error
    }
  }
}
