import type { Message } from '@/types/chat'
import type { MemoryConfig, MemoryManager } from './types'
import { createMemoryConfig } from './config'

export class SummaryCompressionMemory implements MemoryManager {
  private originalMessages: Message[] = []
  private summary: string | null = null
  private config: MemoryConfig
  private isCompressing: boolean = false

  constructor(config?: Partial<MemoryConfig>) {
    this.config = createMemoryConfig(config)
  }

  addMessage(message: Message): void {
    this.originalMessages.push(message)
    
    // 自动触发压缩（非阻塞）
    if (this.shouldCompress() && !this.isCompressing) {
      this.compress()
    }
  }

  getMessages(): Message[] {
    const messages: Message[] = []
    
    // 如果有摘要，添加为 system 消息
    if (this.summary) {
      messages.push({
        id: 'summary',
        role: 'system',
        content: `[对话摘要] ${this.summary}`,
        timestamp: Date.now(),
      })
    }
    
    // 添加最近的 N 条原始消息
    const recentMessages = this.originalMessages.slice(-this.config.keepRecentCount)
    messages.push(...recentMessages)
    
    return messages
  }

  shouldCompress(): boolean {
    return this.originalMessages.length >= this.config.compressThreshold
  }

  async compress(): Promise<void> {
    if (this.isCompressing || !this.shouldCompress()) return
    
    this.isCompressing = true

    try {
      // 计算需要压缩的消息范围
      const messagesToCompress = this.originalMessages.slice(
        0,
        this.originalMessages.length - this.config.keepRecentCount
      )

      if (messagesToCompress.length === 0) return

      // 调用 LLM 生成摘要
      const summary = await this.generateSummary(messagesToCompress)

      // 更新状态
      this.summary = summary
      this.originalMessages = this.originalMessages.slice(-this.config.keepRecentCount)
    } catch (error) {
      console.error('[Memory] Compression failed:', error)
      // 失败时保留完整历史，下次重试
    } finally {
      this.isCompressing = false
    }
  }

  private async generateSummary(messages: Message[]): Promise<string> {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: '请将以下对话历史压缩为一段简洁的摘要，保留关键信息（用户意图、工具调用结果、重要结论）。用中文输出，不超过 200 字。',
            },
            ...messages,
          ],
          ...(this.config.summaryModel && { model: this.config.summaryModel }),
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.choices?.[0]?.message?.content ?? '对话历史摘要'
    } catch (error) {
      console.error('[Memory] Failed to generate summary:', error)
      return '用户进行了多轮对话，涉及多个主题和工具调用。'
    }
  }

  clear(): void {
    this.originalMessages = []
    this.summary = null
    this.isCompressing = false
  }
}
