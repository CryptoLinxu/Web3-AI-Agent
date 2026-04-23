'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { StreamChunk, ToolCallUIState } from '@/types/stream'
import { Message } from '@/types/chat'

interface UseChatStreamReturn {
  isStreaming: boolean
  content: string
  error: string | null
  toolCalls: ToolCallUIState[]
  sendMessage: (messages: Array<{ role: string; content: string }>, walletAddress?: string) => Promise<{ content: string; toolCalls: ToolCallUIState[] }>
  abort: () => void
}

const MAX_RETRIES = 2
const TIMEOUT_MS = 30000
const THROTTLE_MS = 50

/**
 * SSE 流式消费 Hook
 * 
 * 使用示例：
 * const { isStreaming, content, sendMessage } = useChatStream()
 * await sendMessage(messages)
 */
export function useChatStream(): UseChatStreamReturn {
  const [isStreaming, setIsStreaming] = useState(false)
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [toolCalls, setToolCalls] = useState<ToolCallUIState[]>([])

  const abortControllerRef = useRef<AbortController | null>(null)
  const contentBufferRef = useRef('')
  const lastUpdateTimeRef = useRef(0)
  const throttledUpdateRef = useRef<number | null>(null)
  const toolCallsBufferRef = useRef<ToolCallUIState[]>([])

  // 清理函数
  useEffect(() => {
    return () => {
      abort()
    }
  }, [])

  // 节流更新内容
  const throttledUpdateContent = useCallback(() => {
    const now = Date.now()
    if (now - lastUpdateTimeRef.current >= THROTTLE_MS) {
      setContent(contentBufferRef.current)
      lastUpdateTimeRef.current = now
    } else if (!throttledUpdateRef.current) {
      throttledUpdateRef.current = window.setTimeout(() => {
        setContent(contentBufferRef.current)
        lastUpdateTimeRef.current = Date.now()
        throttledUpdateRef.current = null
      }, THROTTLE_MS)
    }
  }, [])

  // 解析 SSE 事件
  const parseSSEEvent = useCallback((text: string): StreamChunk | null => {
    try {
      // 查找 data: 行（匹配到行尾或字符串结尾）
      const dataMatch = text.match(/data:\s*(.+)/)
      if (!dataMatch) return null

      const jsonData = dataMatch[1].trim()
      return JSON.parse(jsonData) as StreamChunk
    } catch {
      console.warn('SSE 事件解析失败:', text)
      return null
    }
  }, [])

  // 消费 SSE 流
  const consumeStream = useCallback(async (response: Response): Promise<void> => {
    if (!response.body) {
      throw new Error('响应体为空')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          // 处理缓冲区剩余数据
          if (buffer.trim()) {
            const event = parseSSEEvent(buffer)
            if (event) handleChunk(event)
          }
          break
        }

        buffer += decoder.decode(value, { stream: true })

        // 按 \n\n 分割事件
        const events = buffer.split('\n\n')
        buffer = events.pop() || '' // 保留未完整的事件

        for (const eventText of events) {
          if (!eventText.trim()) continue

          const event = parseSSEEvent(eventText)
          if (event) {
            handleChunk(event)
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }, [parseSSEEvent])

  // 处理流式块
  const handleChunk = useCallback((chunk: StreamChunk) => {
    switch (chunk.type) {
      case 'content':
        if (chunk.content) {
          contentBufferRef.current += chunk.content
          throttledUpdateContent()
        }
        break

      case 'tool_call':
        if (chunk.toolCall) {
          let args: Record<string, unknown> = {}
          try {
            args = JSON.parse(chunk.toolCall.function.arguments)
          } catch {
            console.error('工具参数解析失败:', chunk.toolCall.function.arguments)
          }
          const toolCall: ToolCallUIState = {
            id: chunk.toolCall.id,
            name: chunk.toolCall.function.name,
            arguments: args,
            status: 'running',
          }
          // 同时更新 ref 和 state
          toolCallsBufferRef.current = [...toolCallsBufferRef.current, toolCall]
          setToolCalls((prev) => [...prev, toolCall])
        }
        break

      case 'done':
        // 确保最终内容被设置（同步更新，避免节流延迟）
        if (throttledUpdateRef.current) {
          clearTimeout(throttledUpdateRef.current)
          throttledUpdateRef.current = null
        }
        setContent(contentBufferRef.current)
        setIsStreaming(false)
        break

      case 'error':
        setError(chunk.error || '未知错误')
        setIsStreaming(false)
        break
    }
  }, [throttledUpdateContent])

  // 发送消息
  const sendMessage = useCallback(async (messages: Array<{ role: string; content: string }>, walletAddress?: string): Promise<{ content: string; toolCalls: ToolCallUIState[] }> => {
    // 重置状态
    setIsStreaming(true)
    setContent('')
    setError(null)
    setToolCalls([])
    contentBufferRef.current = ''
    lastUpdateTimeRef.current = 0

    let retryCount = 0
    // 重置工具调用收集缓冲区
    toolCallsBufferRef.current = []

    while (retryCount <= MAX_RETRIES) {
      // 每次重试前重置缓冲区和状态
      contentBufferRef.current = ''
      lastUpdateTimeRef.current = 0
      setContent('')
      // 注意：不重置 setToolCalls，保留已收集的工具调用状态

      // 每次重试创建新的 AbortController
      abortControllerRef.current = new AbortController()

      try {
        const controller = abortControllerRef.current
        const timeoutId = setTimeout(() => controller?.abort(), TIMEOUT_MS)

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
          },
          body: JSON.stringify({ messages, walletAddress }),
          signal: controller?.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          // 4xx 客户端错误不重试
          if (response.status >= 400 && response.status < 500) {
            throw new Error(`客户端错误 ${response.status}: ${response.statusText}`)
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        await consumeStream(response)

        // 同步返回最终结果（避免 React state 延迟）
        return {
          content: contentBufferRef.current,
          toolCalls: toolCallsBufferRef.current,
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : '未知错误'

        // 如果是主动中止，不重试
        if (err instanceof DOMException && err.name === 'AbortError') {
          setError('请求已取消')
          setIsStreaming(false)
          return { content: contentBufferRef.current, toolCalls: toolCallsBufferRef.current }
        }

        // 客户端错误不重试
        if (errorMessage.startsWith('客户端错误')) {
          setError(`请求失败: ${errorMessage}`)
          setIsStreaming(false)
          return { content: contentBufferRef.current, toolCalls: toolCallsBufferRef.current }
        }

        retryCount++
        if (retryCount > MAX_RETRIES) {
          setError(`请求失败: ${errorMessage}`)
          setIsStreaming(false)
          return { content: contentBufferRef.current, toolCalls: toolCallsBufferRef.current }
        }

        // 等待 1s 后重试
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    // 理论上不会执行到这里，但 TypeScript 需要返回值
    return { content: contentBufferRef.current, toolCalls: toolCallsBufferRef.current }
  }, [consumeStream])

  // 中止请求
  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    // 清理节流定时器
    if (throttledUpdateRef.current) {
      clearTimeout(throttledUpdateRef.current)
      throttledUpdateRef.current = null
    }

    setIsStreaming(false)
  }, [])

  // 实时更新消息内容
  const updateStreamingMessage = useCallback(
    (messageId: string, setMessages: React.Dispatch<React.SetStateAction<Message[]>>) => {
      const interval = setInterval(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, content: contentBufferRef.current } : m
          )
        )
      }, THROTTLE_MS)

      return () => clearInterval(interval)
    },
    []
  )

  return {
    isStreaming,
    content,
    error,
    toolCalls,
    sendMessage,
    abort,
  }
}
