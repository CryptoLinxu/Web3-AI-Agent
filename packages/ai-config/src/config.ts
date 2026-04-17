import { ModelProvider, ModelConfig, AIConfig } from './types'

/**
 * 从环境变量读取模型配置
 */
export function loadConfigFromEnv(): AIConfig {
  const defaultProvider = (process.env.DEFAULT_MODEL_PROVIDER as ModelProvider) || 'openai'

  const providers: AIConfig['providers'] = {}

  // OpenAI 配置
  const openaiApiKey = process.env.OPENAI_API_KEY
  const openaiModel = process.env.OPENAI_MODEL || 'gpt-3.5-turbo'
  const openaiBaseURL = process.env.OPENAI_BASE_URL

  if (openaiApiKey) {
    providers.openai = {
      provider: 'openai',
      apiKey: openaiApiKey,
      model: openaiModel,
      baseURL: openaiBaseURL,
      temperature: process.env.OPENAI_TEMPERATURE
        ? parseFloat(process.env.OPENAI_TEMPERATURE)
        : undefined,
      maxTokens: process.env.OPENAI_MAX_TOKENS
        ? parseInt(process.env.OPENAI_MAX_TOKENS, 10)
        : undefined,
    }
  }

  // Anthropic 配置
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY
  const anthropicModel = process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229'
  const anthropicBaseURL = process.env.ANTHROPIC_BASE_URL

  if (anthropicApiKey) {
    providers.anthropic = {
      provider: 'anthropic',
      apiKey: anthropicApiKey,
      model: anthropicModel,
      baseURL: anthropicBaseURL,
      temperature: process.env.ANTHROPIC_TEMPERATURE
        ? parseFloat(process.env.ANTHROPIC_TEMPERATURE)
        : undefined,
      maxTokens: process.env.ANTHROPIC_MAX_TOKENS
        ? parseInt(process.env.ANTHROPIC_MAX_TOKENS, 10)
        : undefined,
    }
  }

  return {
    defaultProvider,
    providers,
  }
}

/**
 * 验证配置
 */
export function validateConfig(config: AIConfig): void {
  // 验证默认提供商
  if (!config.defaultProvider) {
    throw new Error('DEFAULT_MODEL_PROVIDER 未配置')
  }

  const validProviders: ModelProvider[] = ['openai', 'anthropic']
  if (!validProviders.includes(config.defaultProvider)) {
    throw new Error(
      `不支持的模型提供商: ${config.defaultProvider}。支持的提供商: ${validProviders.join(', ')}`
    )
  }

  // 验证默认提供商是否已配置
  const defaultProviderConfig = config.providers[config.defaultProvider]
  if (!defaultProviderConfig) {
    throw new Error(
      `默认提供商 ${config.defaultProvider} 未配置。请检查对应的环境变量。`
    )
  }

  // 验证 API Key
  if (!defaultProviderConfig.apiKey) {
    throw new Error(
      `${config.defaultProvider} 的 API Key 未配置`
    )
  }
}

/**
 * 获取指定提供商的配置
 */
export function getProviderConfig(
  config: AIConfig,
  provider: ModelProvider
): ModelConfig {
  const providerConfig = config.providers[provider]

  if (!providerConfig) {
    throw new Error(
      `提供商 ${provider} 未配置。请检查环境变量。`
    )
  }

  return providerConfig
}
