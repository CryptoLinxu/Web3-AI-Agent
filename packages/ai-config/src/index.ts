// AI 配置包 - 全局模型切换配置

// 类型导出
export * from './types'

// 配置管理
export * from './config'

// 工厂
export * from './factory'

// 提供商接口
export * from './providers/base'

// 具体提供商（按需导入）
export { OpenAIAdapter } from './providers/openai'
export type { OpenAIConfig } from './providers/openai'
export { AnthropicAdapter } from './providers/anthropic'
export type { AnthropicConfig } from './providers/anthropic'
