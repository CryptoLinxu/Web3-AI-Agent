import { ILLMProvider } from './providers/base'
import { OpenAIAdapter, OpenAIConfig } from './providers/openai'
import { AnthropicAdapter, AnthropicConfig } from './providers/anthropic'
import { ModelProvider } from './types'
import { loadConfigFromEnv, validateConfig, getProviderConfig } from './config'

/**
 * 提供商工厂函数类型
 */
type ProviderFactory = (config: unknown) => ILLMProvider

/**
 * LLM 提供商工厂
 * 负责创建和管理模型提供商实例
 */
export class LLMFactory {
  private static providers = new Map<ModelProvider, ProviderFactory>()
  private static instances = new Map<ModelProvider, ILLMProvider>()
  private static initialized = false
  private static config = loadConfigFromEnv()

  /**
   * 初始化工厂
   * 注册内置提供商
   */
  private static initialize(): void {
    if (this.initialized) return

    // 注册 OpenAI 提供商
    this.register('openai', (config) => {
      return new OpenAIAdapter(config as OpenAIConfig)
    })

    // 注册 Anthropic 提供商
    this.register('anthropic', (config) => {
      return new AnthropicAdapter(config as AnthropicConfig)
    })

    // 验证配置
    validateConfig(this.config)

    this.initialized = true
  }

  /**
   * 注册自定义提供商
   * @param name - 提供商名称
   * @param factory - 提供商创建函数
   */
  static register(name: ModelProvider, factory: ProviderFactory): void {
    this.providers.set(name, factory)
  }

  /**
   * 获取提供商实例
   * @param name - 提供商名称，不传则使用默认提供商
   * @returns 提供商实例
   */
  static getProvider(name?: ModelProvider): ILLMProvider {
    this.initialize()

    const providerName = name || this.config.defaultProvider

    // 检查缓存
    const cached = this.instances.get(providerName)
    if (cached) {
      return cached
    }

    // 创建新实例
    const factory = this.providers.get(providerName)
    if (!factory) {
      throw new Error(`未找到提供商: ${providerName}`)
    }

    const config = getProviderConfig(this.config, providerName)
    const instance = factory(config)

    // 缓存实例
    this.instances.set(providerName, instance)

    return instance
  }

  /**
   * 获取默认提供商名称
   */
  static getDefaultProvider(): ModelProvider {
    this.initialize()
    return this.config.defaultProvider
  }

  /**
   * 获取已配置的提供商列表
   */
  static getConfiguredProviders(): ModelProvider[] {
    this.initialize()
    return Object.keys(this.config.providers) as ModelProvider[]
  }

  /**
   * 清除缓存（主要用于测试）
   */
  static clearCache(): void {
    this.instances.clear()
    this.initialized = false
    this.config = loadConfigFromEnv()
  }

  /**
   * 重新加载配置
   */
  static reloadConfig(): void {
    this.clearCache()
    this.initialize()
  }
}
