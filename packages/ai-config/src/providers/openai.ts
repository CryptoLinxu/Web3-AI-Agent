import OpenAI from 'openai'
import { ILLMProvider } from './base'
import { Message, ChatOptions, ChatResponse, ToolCall, StreamChunk } from '../types'

export interface OpenAIConfig {
  apiKey: string
  model: string
  baseURL?: string
  temperature?: number
  maxTokens?: number
}

export class OpenAIAdapter implements ILLMProvider {
  readonly name = 'openai'
  private client: OpenAI
  private config: OpenAIConfig

  constructor(config: OpenAIConfig) {
    if (!config.apiKey) {
      throw new Error('OpenAI API Key 不能为空')
    }

    this.config = {
      temperature: 0.7,
      maxTokens: 2000,
      ...config,
    }

    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    })
  }

  async chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse> {
    try {
      // 转换消息格式
      const openaiMessages = messages.map((msg): OpenAI.Chat.ChatCompletionMessageParam => {
        if (msg.role === 'tool') {
          return {
            role: 'tool',
            content: msg.content,
            tool_call_id: msg.tool_call_id || '',
          }
        }
        if (msg.role === 'assistant' && msg.name) {
          return {
            role: 'assistant',
            content: msg.content,
            name: msg.name,
          }
        }
        return {
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content,
        }
      })

      // 转换工具定义
      const tools = options?.tools?.map((tool) => ({
        type: 'function' as const,
        function: {
          name: tool.function.name,
          description: tool.function.description,
          parameters: tool.function.parameters,
        },
      }))

      // 调用 OpenAI API
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: openaiMessages,
        tools: tools,
        tool_choice: tools ? 'auto' : undefined,
        temperature: options?.temperature ?? this.config.temperature,
        max_tokens: options?.maxTokens ?? this.config.maxTokens,
      })

      const choice = response.choices[0]
      const message = choice.message

      // 转换工具调用
      let toolCalls: ToolCall[] | undefined
      if (message.tool_calls && message.tool_calls.length > 0) {
        toolCalls = message.tool_calls.map((tc) => ({
          id: tc.id,
          type: 'function' as const,
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments,
          },
        }))
      }

      return {
        content: message.content,
        toolCalls,
        usage: response.usage
          ? {
              promptTokens: response.usage.prompt_tokens,
              completionTokens: response.usage.completion_tokens,
              totalTokens: response.usage.total_tokens,
            }
          : undefined,
      }
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        throw new Error(`OpenAI API 错误: ${error.message}`)
      }
      throw error
    }
  }

  async *chatStream(messages: Message[], options?: ChatOptions): AsyncGenerator<StreamChunk> {
    try {
      // 转换消息格式
      const openaiMessages = messages.map((msg): OpenAI.Chat.ChatCompletionMessageParam => {
        if (msg.role === 'tool') {
          return {
            role: 'tool',
            content: msg.content,
            tool_call_id: msg.tool_call_id || '',
          }
        }
        if (msg.role === 'assistant' && msg.name) {
          return {
            role: 'assistant',
            content: msg.content,
            name: msg.name,
          }
        }
        return {
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content,
        }
      })

      // 转换工具定义
      const tools = options?.tools?.map((tool) => ({
        type: 'function' as const,
        function: {
          name: tool.function.name,
          description: tool.function.description,
          parameters: tool.function.parameters,
        },
      }))

      // 调用 OpenAI 流式 API
      const stream = await this.client.chat.completions.create({
        model: this.config.model,
        messages: openaiMessages,
        tools: tools,
        tool_choice: tools ? 'auto' : undefined,
        temperature: options?.temperature ?? this.config.temperature,
        max_tokens: options?.maxTokens ?? this.config.maxTokens,
        stream: true,
      })

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta

        if (delta?.content) {
          yield { type: 'content', content: delta.content }
        }

        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            if (tc.function?.name && tc.function?.arguments) {
              yield {
                type: 'tool_call',
                toolCall: {
                  id: tc.id || '',
                  type: 'function',
                  function: {
                    name: tc.function.name,
                    arguments: tc.function.arguments,
                  },
                },
              }
            }
          }
        }
      }

      yield { type: 'done' }
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        yield { type: 'error', error: `OpenAI API 错误: ${error.message}` }
      } else {
        yield { type: 'error', error: error instanceof Error ? error.message : '未知错误' }
      }
    }
  }
}
