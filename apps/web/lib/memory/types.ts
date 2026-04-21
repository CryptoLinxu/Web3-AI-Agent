import type { Message } from '@/types/chat'

export interface MemoryConfig {
  /** 触发压缩的消息数阈值（默认 10） */
  compressThreshold: number
  /** 保留的最近消息数（默认 5） */
  keepRecentCount: number
  /** 摘要用模型（可选，默认继承全局配置） */
  summaryModel?: string
}

export interface MemoryManager {
  /**
   * 添加新消息到记忆
   */
  addMessage(message: Message): void

  /**
   * 获取当前上下文（可能包含摘要）
   */
  getMessages(): Message[]

  /**
   * 判断是否需要压缩
   */
  shouldCompress(): boolean

  /**
   * 执行压缩（异步）
   */
  compress(): Promise<void>

  /**
   * 清空记忆
   */
  clear(): void
}
