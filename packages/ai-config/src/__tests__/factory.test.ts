import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LLMFactory } from '../factory'

// Mock LLM 提供商适配器
vi.mock('../providers/openai', () => ({
  OpenAIAdapter: class MockOpenAI {
    readonly name = 'openai'
    chat = vi.fn()
    chatStream = vi.fn()
  },
}))

vi.mock('../providers/anthropic', () => ({
  AnthropicAdapter: class MockAnthropic {
    readonly name = 'anthropic'
    chat = vi.fn()
    chatStream = vi.fn()
  },
}))

// Mock config
vi.mock('../config', () => {
  const mockConfig = {
    defaultProvider: 'openai',
    providers: {
      openai: { provider: 'openai', apiKey: 'sk-test', model: 'gpt-4' },
      anthropic: { provider: 'anthropic', apiKey: 'sk-ant-test', model: 'claude-3-opus-20240229' },
    },
  }
  return {
    loadConfigFromEnv: vi.fn(() => mockConfig),
    validateConfig: vi.fn(),
    getProviderConfig: vi.fn((config: any, provider: string) => config.providers[provider]),
  }
})

describe('LLMFactory', () => {
  beforeEach(() => {
    LLMFactory.clearCache()
  })

  it('应能获取默认提供商', () => {
    const provider = LLMFactory.getProvider()
    expect(provider).toBeDefined()
    expect(provider.name).toBe('openai')
  })

  it('应能获取指定提供商', () => {
    const provider = LLMFactory.getProvider('anthropic')
    expect(provider).toBeDefined()
    expect(provider.name).toBe('anthropic')
  })

  it('应缓存提供商实例', () => {
    const provider1 = LLMFactory.getProvider('openai')
    const provider2 = LLMFactory.getProvider('openai')
    expect(provider1).toBe(provider2)
  })

  it('clearCache 应清除缓存', () => {
    const provider1 = LLMFactory.getProvider('openai')
    LLMFactory.clearCache()
    const provider2 = LLMFactory.getProvider('openai')
    expect(provider1).not.toBe(provider2)
  })

  it('应能注册自定义提供商', () => {
    // 先触发 initialize（注册默认提供商）
    LLMFactory.getProvider('openai')
    // 然后在 initialize 之后注册自定义工厂（覆盖已注册的）
    const customFactory = vi.fn(() => ({
      name: 'custom',
      chat: vi.fn(),
      chatStream: vi.fn(),
    }))
    LLMFactory.register('anthropic' as any, customFactory)
    LLMFactory.getProvider('anthropic' as any)
    expect(customFactory).toHaveBeenCalled()
  })

  it('getDefaultProvider 应返回默认提供商名称', () => {
    expect(LLMFactory.getDefaultProvider()).toBe('openai')
  })

  it('getConfiguredProviders 应返回已配置的提供商列表', () => {
    const providers = LLMFactory.getConfiguredProviders()
    expect(providers).toContain('openai')
    expect(providers).toContain('anthropic')
  })

  it('reloadConfig 应重新加载配置', () => {
    const provider1 = LLMFactory.getProvider('openai')
    LLMFactory.reloadConfig()
    const provider2 = LLMFactory.getProvider('openai')
    expect(provider1).not.toBe(provider2)
  })
})
