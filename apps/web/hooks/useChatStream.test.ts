import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useChatStream } from './useChatStream'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useChatStream', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('初始 isStreaming 应为 false', () => {
      const { result } = renderHook(() => useChatStream())
      expect(result.current?.isStreaming).toBe(false)
    })

    it('初始 content 应为空', () => {
      const { result } = renderHook(() => useChatStream())
      expect(result.current?.content).toBe('')
    })

    it('初始 error 应为 null', () => {
      const { result } = renderHook(() => useChatStream())
      expect(result.current?.error).toBeNull()
    })

    it('初始 toolCalls 应为空数组', () => {
      const { result } = renderHook(() => useChatStream())
      expect(result.current?.toolCalls).toEqual([])
    })

    it('初始 transferData 应为 undefined', () => {
      const { result } = renderHook(() => useChatStream())
      expect(result.current?.transferData).toBeUndefined()
    })
  })

  describe('sendMessage', () => {
    it('成功请求应返回内容', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder()
          controller.enqueue(encoder.encode('event: chunk\ndata: {"type":"content","content":"Hello"}\n\n'))
          controller.enqueue(encoder.encode('event: chunk\ndata: {"type":"done"}\n\n'))
          controller.close()
        },
      })

      mockFetch.mockResolvedValue({
        ok: true,
        body: mockStream,
        status: 200,
        statusText: 'OK',
      })

      const { result } = renderHook(() => useChatStream())

      let response: any
      await act(async () => {
        response = await result.current!.sendMessage([
          { role: 'user', content: 'Hello' },
        ])
      })

      expect(response).toBeDefined()
      expect(response.content).toBe('Hello')
    })

    it('4xx 客户端错误不应重试', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      })

      const { result } = renderHook(() => useChatStream())

      await act(async () => {
        await result.current!.sendMessage([
          { role: 'user', content: 'Hello' },
        ])
      })

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(result.current?.error).toContain('客户端错误')
    })

    it('5xx 服务器错误应重试 MAX_RETRIES 次', async () => {
      mockFetch.mockRejectedValue(new Error('Internal Server Error'))

      const { result } = renderHook(() => useChatStream())

      await act(async () => {
        const promise = result.current!.sendMessage([
          { role: 'user', content: 'Hello' },
        ])
        // 重试间隔 1s，最多 2 次重试
        await vi.advanceTimersByTimeAsync(100)
        await vi.advanceTimersByTimeAsync(1500)
        await vi.advanceTimersByTimeAsync(1500)
        await promise
      })

      // 初始 1 次 + 2 次重试 = 3 次
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })
  })

  describe('abort', () => {
    it('应重置 isStreaming 状态', () => {
      const { result } = renderHook(() => useChatStream())
      
      act(() => {
        result.current?.abort()
      })

      expect(result.current?.isStreaming).toBe(false)
    })
  })
})
