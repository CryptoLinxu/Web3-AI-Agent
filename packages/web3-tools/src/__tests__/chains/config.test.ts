import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import { getChainConfig, getRpcUrl, CHAIN_CONFIGS } from '../../chains/config'
import type { EvmChainConfig } from '../../types'

describe('getChainConfig', () => {
  it('应返回以太坊链配置', () => {
    const config = getChainConfig('ethereum') as EvmChainConfig
    expect(config.id).toBe('ethereum')
    expect(config.name).toBe('Ethereum')
    expect(config.nativeToken).toBe('ETH')
    expect(config.chainId).toBe(1)
    expect(config.explorerUrl).toBe('https://etherscan.io')
    expect('rpcUrls' in config).toBe(true)
  })

  it('应返回 Polygon 链配置', () => {
    const config = getChainConfig('polygon') as EvmChainConfig
    expect(config.id).toBe('polygon')
    expect(config.nativeToken).toBe('MATIC')
    expect(config.chainId).toBe(137)
  })

  it('应返回 BSC 链配置', () => {
    const config = getChainConfig('bsc') as EvmChainConfig
    expect(config.id).toBe('bsc')
    expect(config.nativeToken).toBe('BNB')
    expect(config.chainId).toBe(56)
  })

  it('不支持的链应抛出错误', () => {
    expect(() => getChainConfig('invalid' as any)).toThrow('不支持的链')
  })
})

describe('getRpcUrl', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('应返回自定义 RPC URL', () => {
    const url = getRpcUrl('ethereum', 'https://custom.rpc.com')
    expect(url).toBe('https://custom.rpc.com')
  })

  it('未设置自定义 URL 时应返回默认值', () => {
    delete process.env.ETHEREUM_RPC_URL
    const url = getRpcUrl('ethereum')
    expect(url).toBe((CHAIN_CONFIGS.ethereum as EvmChainConfig).rpcUrls[0])
  })

  it('应优先使用环境变量中的 RPC URL', async () => {
    // CHAIN_CONFIGS 在模块加载时已通过 process.env 初始化,
    // 使用 vi.resetModules() + 动态 import 确保环境变量生效
    vi.resetModules()
    process.env.BSC_RPC_URL = 'https://env.bsc.rpc'

    const { getRpcUrl: getRpcUrlDynamic } = await import('../../chains/config')
    const url = getRpcUrlDynamic('bsc')
    expect(url).toBe('https://env.bsc.rpc')
  })
})
