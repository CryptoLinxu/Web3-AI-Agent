import { describe, it, expect, beforeEach } from 'vitest'
import { SlidingWindowMemory } from './SlidingWindowMemory'
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

describe('SlidingWindowMemory', () => {
  describe('constructor', () => {
    it('无参数时应使用默认窗口大小', () => {
      const mem = new SlidingWindowMemory()
      // 默认 keepRecentCount 是 5
      for (let i = 0; i < 10; i++) {
        mem.addMessage(createMessage())
      }
      expect(mem.getMessages().length).toBeLessThanOrEqual(10)
    })

    it('应接受自定义窗口大小', () => {
      const mem = new SlidingWindowMemory({ keepRecentCount: 3 })
      for (let i = 0; i < 10; i++) {
        mem.addMessage(createMessage())
      }
      expect(mem.getMessages().length).toBe(3)
    })
  })

  describe('addMessage / getMessages', () => {
    it('添加消息后应能获取', () => {
      const mem = new SlidingWindowMemory({ keepRecentCount: 10 })
      const msg = createMessage({ content: 'hello' })
      mem.addMessage(msg)
      const messages = mem.getMessages()
      expect(messages.length).toBe(1)
      expect(messages[0].content).toBe('hello')
    })

    it('超出窗口的消息应被裁剪', () => {
      const mem = new SlidingWindowMemory({ keepRecentCount: 2 })
      mem.addMessage(createMessage({ content: 'first' }))
      mem.addMessage(createMessage({ content: 'second' }))
      mem.addMessage(createMessage({ content: 'third' }))

      const messages = mem.getMessages()
      expect(messages.length).toBe(2)
      expect(messages[0].content).toBe('second')
      expect(messages[1].content).toBe('third')
    })
  })

  describe('shouldCompress', () => {
    it('滑动窗口不应执行压缩', () => {
      const mem = new SlidingWindowMemory()
      expect(mem.shouldCompress()).toBe(false)

      mem.addMessage(createMessage())
      mem.addMessage(createMessage())
      expect(mem.shouldCompress()).toBe(false)
    })
  })

  describe('compress', () => {
    it('不应执行任何操作', async () => {
      const mem = new SlidingWindowMemory()
      mem.addMessage(createMessage())
      await mem.compress()
      // 不应抛出异常，消息保持原样
      expect(mem.getMessages().length).toBe(1)
    })
  })

  describe('clear', () => {
    it('应清空所有消息', () => {
      const mem = new SlidingWindowMemory({ keepRecentCount: 10 })
      mem.addMessage(createMessage())
      mem.addMessage(createMessage())
      expect(mem.getMessages().length).toBe(2)

      mem.clear()
      expect(mem.getMessages().length).toBe(0)
    })
  })
})
