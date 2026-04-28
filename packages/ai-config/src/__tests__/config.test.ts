import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { loadConfigFromEnv, validateConfig, getProviderConfig } from '../config'
import type { AIConfig } from '../types'

describe('loadConfigFromEnv', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('应使用默认值当环境变量未设置', () => {
    delete process.env.OPENAI_API_KEY
    delete process.env.ANTHROPIC_API_KEY
    const config = loadConfigFromEnv()
    expect(config.defaultProvider).toBe('openai')
    expect(config.providers.openai).toBeUndefined()
    expect(config.providers.anthropic).toBeUndefined()
  })

  it('应正确读取 OpenAI 环境变量', () => {
    process.env.OPENAI_API_KEY = 'sk-test-key'
    process.env.OPENAI_MODEL = 'gpt-4'
    process.env.OPENAI_BASE_URL = 'https://custom.openai.com'
    process.env.OPENAI_TEMPERATURE = '0.7'
    process.env.OPENAI_MAX_TOKENS = '4096'

    const config = loadConfigFromEnv()
    expect(config.providers.openai).toBeDefined()
    expect(config.providers.openai!.apiKey).toBe('sk-test-key')
    expect(config.providers.openai!.model).toBe('gpt-4')
    expect(config.providers.openai!.baseURL).toBe('https://custom.openai.com')
    expect(config.providers.openai!.temperature).toBe(0.7)
    expect(config.providers.openai!.maxTokens).toBe(4096)
  })

  it('应正确读取 Anthropic 环境变量', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test'
    process.env.ANTHROPIC_MODEL = 'claude-3-opus-20240229'
    process.env.ANTHROPIC_BASE_URL = 'https://custom.anthropic.com'

    const config = loadConfigFromEnv()
    expect(config.providers.anthropic).toBeDefined()
    expect(config.providers.anthropic!.apiKey).toBe('sk-ant-test')
    expect(config.providers.anthropic!.model).toBe('claude-3-opus-20240229')
    expect(config.providers.anthropic!.baseURL).toBe('https://custom.anthropic.com')
  })

  it('应支持设置默认提供商', () => {
    process.env.DEFAULT_MODEL_PROVIDER = 'anthropic'
    process.env.OPENAI_API_KEY = 'sk-test'
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test'

    const config = loadConfigFromEnv()
    expect(config.defaultProvider).toBe('anthropic')
  })
})

describe('validateConfig', () => {
  it('应通过有效配置', () => {
    const config: AIConfig = {
      defaultProvider: 'openai',
      providers: {
        openai: {
          provider: 'openai',
          apiKey: 'sk-test',
          model: 'gpt-4',
        },
      },
    }
    expect(() => validateConfig(config)).not.toThrow()
  })

  it('当 defaultProvider 为空时应抛出错误', () => {
    const config = { defaultProvider: '', providers: {} } as unknown as AIConfig
    expect(() => validateConfig(config)).toThrow('未配置')
  })

  it('当提供商不受支持时应抛出错误', () => {
    const config = { defaultProvider: 'invalid', providers: {} } as unknown as AIConfig
    expect(() => validateConfig(config)).toThrow('不支持的模型提供商')
  })

  it('当默认提供商未配置时应抛出错误', () => {
    const config: AIConfig = {
      defaultProvider: 'openai',
      providers: {},
    }
    expect(() => validateConfig(config)).toThrow('未配置')
  })

  it('当 API Key 缺失时应抛出错误', () => {
    const config: AIConfig = {
      defaultProvider: 'openai',
      providers: {
        openai: {
          provider: 'openai',
          apiKey: '',
          model: 'gpt-4',
        },
      },
    }
    expect(() => validateConfig(config)).toThrow('API Key 未配置')
  })
})

describe('getProviderConfig', () => {
  it('应返回正确的提供商配置', () => {
    const config: AIConfig = {
      defaultProvider: 'openai',
      providers: {
        openai: {
          provider: 'openai',
          apiKey: 'sk-test',
          model: 'gpt-4',
        },
      },
    }

    const result = getProviderConfig(config, 'openai')
    expect(result.apiKey).toBe('sk-test')
    expect(result.model).toBe('gpt-4')
  })

  it('当提供商不存在时应抛出错误', () => {
    const config: AIConfig = {
      defaultProvider: 'openai',
      providers: {},
    }
    expect(() => getProviderConfig(config, 'openai')).toThrow('未配置')
  })
})
