import { Message, ChatOptions, ChatResponse, StreamResponse } from '../types'

/**
 * LLM 提供商基础接口
 * 所有模型适配器必须实现此接口
 */
export interface ILLMProvider {
  /** 提供商名称 */
  readonly name: string

  /**
   * 执行对话
   * @param messages - 消息列表
   * @param options - 对话选项
   * @returns 对话响应
   */
  chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse>

  /**
   * 执行流式对话
   * @param messages - 消息列表
   * @param options - 对话选项
   * @returns 流式响应
   */
  chatStream(messages: Message[], options?: ChatOptions): StreamResponse
}

/**
 * 提供商创建函数类型
 */
export type ProviderFactory = () => ILLMProvider

/**
 * 提供商基类
 * 提供通用功能，具体提供商继承此类
 */
export abstract class BaseProvider implements ILLMProvider {
  abstract readonly name: string

  abstract chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse>

  abstract chatStream(messages: Message[], options?: ChatOptions): StreamResponse

  /**
   * 验证消息格式
   */
  protected validateMessages(messages: Message[]): void {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('消息列表不能为空')
    }

    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        throw new Error('消息必须包含 role 和 content')
      }
    }
  }

  /**
   * 验证工具定义
   */
  protected validateTools(tools?: Tool[]): void {
    if (!tools) return

    for (const tool of tools) {
      if (tool.type !== 'function' || !tool.function?.name) {
        throw new Error('工具定义格式无效')
      }
    }
  }
}

// 重新导入 Tool 类型
import { Tool } from '../types'
