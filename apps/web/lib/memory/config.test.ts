import { describe, it, expect } from 'vitest'
import { createMemoryConfig, defaultMemoryConfig } from './config'

describe('defaultMemoryConfig', () => {
  it('应包含默认配置值', () => {
    expect(defaultMemoryConfig.compressThreshold).toBeGreaterThan(0)
    expect(defaultMemoryConfig.keepRecentCount).toBeGreaterThan(0)
  })
})

describe('createMemoryConfig', () => {
  it('无参数时应返回默认值', () => {
    const config = createMemoryConfig()
    expect(config.compressThreshold).toBe(defaultMemoryConfig.compressThreshold)
    expect(config.keepRecentCount).toBe(defaultMemoryConfig.keepRecentCount)
  })

  it('应合并局部覆盖', () => {
    const config = createMemoryConfig({ compressThreshold: 5 })
    expect(config.compressThreshold).toBe(5)
    expect(config.keepRecentCount).toBe(defaultMemoryConfig.keepRecentCount)
  })

  it('应合并全部覆盖', () => {
    const config = createMemoryConfig({
      compressThreshold: 3,
      keepRecentCount: 2,
      summaryModel: 'gpt-4',
    })
    expect(config.compressThreshold).toBe(3)
    expect(config.keepRecentCount).toBe(2)
    expect(config.summaryModel).toBe('gpt-4')
  })
})
