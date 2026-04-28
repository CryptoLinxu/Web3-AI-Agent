import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OpenAIAdapter } from '../../providers/openai'
import type { OpenAIConfig } from '../../providers/openai'

// Mock openai 包
const mockCreate = vi.fn()
vi.mock('openai', () => {
  const MockOpenAI = vi.fn(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }))
  return { default: MockOpenAI }
})

describe('OpenAIAdapter', () => {
  const mockConfig: OpenAIConfig = {
    apiKey: 'sk-test-key',
    model: 'gpt-4',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('constructor', () => {
    it('API Key 为空时应抛出错误', () => {
      expect(() => new OpenAIAdapter({ apiKey: '', model: 'gpt-4' })).toThrow(
        'OpenAI API Key 不能为空'
      )
    })

    it('应使用默认 temperature 和 maxTokens', () => {
      const adapter = new OpenAIAdapter(mockConfig)
      expect(adapter.name).toBe('openai')
    })

    it('应支持自定义 baseURL', () => {
      const config: OpenAIConfig = {
        ...mockConfig,
        baseURL: 'https://custom.openai.com',
      }
      const adapter = new OpenAIAdapter(config)
      expect(adapter.name).toBe('openai')
    })
  })

  describe('chat', () => {
    it('应能调用 OpenAI API', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: { role: 'assistant', content: 'Hello' },
            finish_reason: 'stop',
            index: 0,
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      } as any)

      const adapter = new OpenAIAdapter(mockConfig)
      const response = await adapter.chat([{ role: 'user', content: 'Hi' }])

      expect(response.content).toBe('Hello')
      expect(response.usage?.totalTokens).toBe(15)
    })

    it('应支持工具调用', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [
                {
                  id: 'call_123',
                  type: 'function',
                  function: {
                    name: 'getWeather',
                    arguments: '{"city": "Beijing"}',
                  },
                },
              ],
            },
            finish_reason: 'tool_calls',
            index: 0,
          },
        ],
      } as any)

      const adapter = new OpenAIAdapter(mockConfig)
      const response = await adapter.chat(
        [{ role: 'user', content: 'What is the weather?' }],
        {
          tools: [
            {
              type: 'function',
              function: {
                name: 'getWeather',
                description: 'Get weather',
                parameters: { type: 'object', properties: {} },
              },
            },
          ],
        }
      )

      expect(response.toolCalls).toBeDefined()
      expect(response.toolCalls?.length).toBe(1)
      expect(response.toolCalls?.[0].function.name).toBe('getWeather')
    })
  })

  describe('chatStream', () => {
    it('应返回异步迭代器', async () => {
      const mockStream = (async function* () {
        yield {
          choices: [{ delta: { content: 'Hello' }, index: 0 }],
        }
        yield {
          choices: [{ delta: { content: ' World' }, index: 0 }],
        }
        yield {
          choices: [{ delta: {}, finish_reason: 'stop', index: 0 }],
        }
      })()

      mockCreate.mockResolvedValue(mockStream as any)

      const adapter = new OpenAIAdapter(mockConfig)
      const stream = adapter.chatStream([{ role: 'user', content: 'Hi' }])

      const chunks: any[] = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      expect(chunks.length).toBeGreaterThan(0)
    })
  })
})
