import type { Message } from '@/types/chat'
import type { MemoryConfig, MemoryManager } from './types'
import { createMemoryConfig } from './config'

/**
 * L2 滑动窗口策略
 * 
 * 只保留最近 N 条消息，超出窗口的早期消息直接丢弃。
 * 与 L3 摘要压缩相比，实现更简单，无额外 LLM 调用，但会丢失历史信息。
 */
export class SlidingWindowMemory implements MemoryManager {
  private messages: Message[] = []
  private windowSize: number

  constructor(config?: Partial<MemoryConfig>) {
    const mergedConfig = createMemoryConfig(config)
    // 复用 keepRecentCount 作为窗口大小
    this.windowSize = mergedConfig.keepRecentCount
  }

  /**
   * 添加新消息
   */
  addMessage(message: Message): void {
    this.messages.push(message)
    // 滑动窗口无需触发压缩
  }

  /**
   * 获取当前上下文（仅返回窗口内的消息）
   */
  getMessages(): Message[] {
    return this.messages.slice(-this.windowSize)
  }

  /**
   * 滑动窗口策略不需要压缩
   */
  shouldCompress(): boolean {
    return false
  }

  /**
   * 空实现，滑动窗口无需压缩
   */
  async compress(): Promise<void> {
    // 无需实现
  }

  /**
   * 清空所有消息
   */
  clear(): void {
    this.messages = []
  }
}
