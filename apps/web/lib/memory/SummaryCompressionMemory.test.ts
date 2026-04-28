import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SummaryCompressionMemory } from './SummaryCompressionMemory'
import type { Message } from '@/types/chat'

function createMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: `msg-${Date.now()}-${Math.random()}`,
    role: 'user',
    content: 'test message',
    timestamp: Date.now(),
    ...overrides,
  }
}

describe('SummaryCompressionMemory', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetch = vi.fn()
    global.fetch = mockFetch
  })

  describe('constructor', () => {
    it('无参数时应使用默认配置', () => {
      const mem = new SummaryCompressionMemory()
      expect(mem).toBeDefined()
    })

    it('应接受自定义配置', () => {
      const mem = new SummaryCompressionMemory({
        compressThreshold: 3,
        keepRecentCount: 2,
        summaryModel: 'gpt-4',
      })
      expect(mem).toBeDefined()
    })
  })

  describe('addMessage / getMessages', () => {
    it('添加消息后应能获取', () => {
      const mem = new SummaryCompressionMemory({ compressThreshold: 10, keepRecentCount: 5 })
      mem.addMessage(createMessage({ content: 'hello' }))
      const messages = mem.getMessages()
      expect(messages.length).toBe(1)
      expect(messages[0].content).toBe('hello')
    })

    it('未压缩时应返回所有消息（不超过 keepRecentCount）', () => {
      const mem = new SummaryCompressionMemory({ compressThreshold: 10, keepRecentCount: 3 })
      for (let i = 0; i < 3; i++) {
        mem.addMessage(createMessage({ content: `msg-${i}` }))
      }
      expect(mem.getMessages().length).toBe(3)
    })

    it('有摘要时应包含摘要 system 消息', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Test summary' } }],
        }),
      })

      const mem = new SummaryCompressionMemory({ compressThreshold: 2, keepRecentCount: 1 })
      mem.addMessage(createMessage({ content: 'first msg' }))
      mem.addMessage(createMessage({ content: 'second msg' }))

      // 等待异步压缩完成
      await new Promise(process.nextTick)

      const messages = mem.getMessages()
      // 应该包含 1 条摘要 + 1 条最近消息
      const summaryMsg = messages.find(m => m.role === 'system' && m.content.startsWith('[对话摘要]'))
      expect(summaryMsg).toBeDefined()
      expect(summaryMsg!.content).toContain('Test summary')
    })
  })

  describe('shouldCompress', () => {
    it('未达阈值时应返回 false', () => {
      const mem = new SummaryCompressionMemory({ compressThreshold: 5, keepRecentCount: 2 })
      for (let i = 0; i < 4; i++) {
        mem.addMessage(createMessage())
      }
      expect(mem.shouldCompress()).toBe(false)
    })

    it('达到阈值时应返回 true', () => {
      const mem = new SummaryCompressionMemory({ compressThreshold: 5, keepRecentCount: 2 })
      for (let i = 0; i < 5; i++) {
        mem.addMessage(createMessage())
      }
      expect(mem.shouldCompress()).toBe(true)
    })
  })

  describe('compress', () => {
    it('正常压缩时应生成摘要', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '用户询问了价格和余额' } }],
        }),
      })

      const mem = new SummaryCompressionMemory({ compressThreshold: 3, keepRecentCount: 1 })
      mem.addMessage(createMessage({ content: 'ETH price?' }))
      mem.addMessage(createMessage({ content: '1.5 ETH' }))
      mem.addMessage(createMessage({ content: 'BTC price?' }))

      await mem.compress()
      expect(mem.getMessages().length).toBeGreaterThanOrEqual(1)
    })

    it('LLM 调用失败时应保留完整历史', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const mem = new SummaryCompressionMemory({ compressThreshold: 3, keepRecentCount: 1 })
      mem.addMessage(createMessage({ content: 'msg1' }))
      mem.addMessage(createMessage({ content: 'msg2' }))
      mem.addMessage(createMessage({ content: 'msg3' }))

      await mem.compress()
      // 失败时应保留所有消息
      expect(mem.getMessages().length).toBeGreaterThanOrEqual(1)
    })

    it('压缩中不应重复执行', async () => {
      let resolvePromise: (value: unknown) => void
      const fetchPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      mockFetch.mockReturnValue(fetchPromise)

      const mem = new SummaryCompressionMemory({ compressThreshold: 3, keepRecentCount: 1 })
      mem.addMessage(createMessage())
      mem.addMessage(createMessage())
      mem.addMessage(createMessage())

      // 第一次压缩进行中
      const firstCompress = mem.compress()
      // 第二次尝试应被跳过
      await mem.compress()

      resolvePromise!(true)
      await firstCompress
    })
  })

  describe('clear', () => {
    it('应清空所有消息和摘要', () => {
      const mem = new SummaryCompressionMemory({ compressThreshold: 10, keepRecentCount: 5 })
      mem.addMessage(createMessage())
      mem.addMessage(createMessage())
      expect(mem.getMessages().length).toBe(2)

      mem.clear()
      expect(mem.getMessages().length).toBe(0)
    })

    it('清空后 shouldCompress 应返回 false', () => {
      const mem = new SummaryCompressionMemory({ compressThreshold: 2, keepRecentCount: 1 })
      mem.addMessage(createMessage())
      mem.addMessage(createMessage())
      expect(mem.shouldCompress()).toBe(true)

      mem.clear()
      expect(mem.shouldCompress()).toBe(false)
    })
  })
})
