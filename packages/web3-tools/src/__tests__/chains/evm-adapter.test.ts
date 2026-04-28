import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { EvmChainConfig } from '../../types'

// Mock ethers before imports
vi.mock('ethers', () => ({
  ethers: {
    JsonRpcProvider: vi.fn(),
    formatEther: vi.fn(),
    formatUnits: vi.fn(),
    isAddress: vi.fn(),
  },
}))

// Mock chain config (use vi.hoisted for hoist-compatible references)
const mockGetChainConfig = vi.hoisted(() => vi.fn())
const mockGetRpcUrl = vi.hoisted(() => vi.fn())
vi.mock('../../chains/config', () => ({
  getChainConfig: mockGetChainConfig,
  getRpcUrl: mockGetRpcUrl,
}))

import { EvmChainAdapter } from '../../chains/evm-adapter'
import { ethers } from 'ethers'

const mockEthConfig: EvmChainConfig = {
  id: 'ethereum',
  name: 'Ethereum',
  nativeToken: 'ETH',
  chainId: 1,
  rpcUrls: ['https://eth.llamarpc.com'],
  explorerUrl: 'https://etherscan.io',
}

const mockPolygonConfig: EvmChainConfig = {
  id: 'polygon',
  name: 'Polygon',
  nativeToken: 'MATIC',
  chainId: 137,
  rpcUrls: ['https://polygon-rpc.com'],
  explorerUrl: 'https://polygonscan.com',
}

describe('EvmChainAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetChainConfig.mockReset()
    mockGetRpcUrl.mockReset()
  })

  describe('constructor', () => {
    it('应使用链配置创建 provider', () => {
      mockGetChainConfig.mockReturnValue(mockEthConfig)
      mockGetRpcUrl.mockReturnValue('https://eth.llamarpc.com')

      const adapter = new EvmChainAdapter('ethereum')

      expect(mockGetChainConfig).toHaveBeenCalledWith('ethereum')
      expect(mockGetRpcUrl).toHaveBeenCalledWith('ethereum', undefined)
      expect(ethers.JsonRpcProvider).toHaveBeenCalledWith('https://eth.llamarpc.com')
      expect(adapter).toBeDefined()
    })

    it('应接受自定义 RPC URL', () => {
      mockGetChainConfig.mockReturnValue(mockEthConfig)
      mockGetRpcUrl.mockReturnValue('https://custom.rpc.com')

      const adapter = new EvmChainAdapter('ethereum', 'https://custom.rpc.com')

      expect(mockGetRpcUrl).toHaveBeenCalledWith('ethereum', 'https://custom.rpc.com')
      expect(ethers.JsonRpcProvider).toHaveBeenCalledWith('https://custom.rpc.com')
    })

    it('应使用 Polygon 链配置', () => {
      mockGetChainConfig.mockReturnValue(mockPolygonConfig)
      mockGetRpcUrl.mockReturnValue('https://polygon-rpc.com')

      const adapter = new EvmChainAdapter('polygon')

      expect(mockGetChainConfig).toHaveBeenCalledWith('polygon')
      expect(ethers.JsonRpcProvider).toHaveBeenCalledWith('https://polygon-rpc.com')
    })
  })

  describe('getBalance', () => {
    const validAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18'

    beforeEach(() => {
      mockGetChainConfig.mockReturnValue(mockEthConfig)
      mockGetRpcUrl.mockReturnValue('https://eth.llamarpc.com')
      // Default: valid address
      ;(ethers.isAddress as any).mockReturnValue(true)
      // Default provider mock
      ;(ethers.JsonRpcProvider as any).mockReturnValue({
        getBalance: vi.fn().mockResolvedValue(BigInt('1500000000000000000')), // 1.5 ETH
      })
      ;(ethers.formatEther as any).mockReturnValue('1.5')
    })

    it('应返回有效地址的余额', async () => {
      const adapter = new EvmChainAdapter('ethereum')
      const result = await adapter.getBalance(validAddress)

      expect(result.success).toBe(true)
      expect(result.data?.chain).toBe('ethereum')
      expect(result.data?.balance).toBe('1.5')
      expect(result.data?.unit).toBe('ETH')
      expect(result.data?.decimals).toBe(18)
      expect(result.data?.address).toBe(validAddress)
      expect(result.source).toBe('Ethereum')
    })

    it('无效地址应返回错误', async () => {
      ;(ethers.isAddress as any).mockReturnValue(false)

      const adapter = new EvmChainAdapter('ethereum')
      const result = await adapter.getBalance('0xinvalid')

      expect(result.success).toBe(false)
      expect(result.error).toContain('无效的')
      expect(result.error).toContain('地址格式')
    })

    it('provider 异常时应返回错误', async () => {
      const mockProvider = {
        getBalance: vi.fn().mockRejectedValue(new Error('RPC connection failed')),
      }
      ;(ethers.JsonRpcProvider as any).mockReturnValue(mockProvider)

      const adapter = new EvmChainAdapter('ethereum')
      const result = await adapter.getBalance(validAddress)

      expect(result.success).toBe(false)
      expect(result.error).toBe('RPC connection failed')
    })
  })

  describe('getGasPrice', () => {
    beforeEach(() => {
      mockGetChainConfig.mockReturnValue(mockEthConfig)
      mockGetRpcUrl.mockReturnValue('https://eth.llamarpc.com')
      ;(ethers.JsonRpcProvider as ReturnType<typeof vi.fn>).mockReturnValue({
        getFeeData: vi.fn().mockResolvedValue({
          gasPrice: BigInt('25000000000'), // 25 Gwei
          maxFeePerGas: BigInt('30000000000'), // 30 Gwei
          maxPriorityFeePerGas: BigInt('2000000000'), // 2 Gwei
        }),
      })
      ;(ethers.formatUnits as any)
        .mockReturnValueOnce('25.5')
        .mockReturnValueOnce('30.0')
        .mockReturnValueOnce('2.0')
    })

    it('应返回完整的 Gas 数据', async () => {
      const adapter = new EvmChainAdapter('ethereum')
      const result = await adapter.getGasPrice()

      expect(result.success).toBe(true)
      expect(result.data?.chain).toBe('ethereum')
      expect(result.data?.gasPrice).toBe('25.5')
      expect(result.data?.maxFeePerGas).toBe('30.0')
      expect(result.data?.maxPriorityFeePerGas).toBe('2.0')
      expect(result.data?.unit).toBe('Gwei')
      expect(result.source).toBe('Ethereum')
    })

    it('provider 异常时应返回错误', async () => {
      const mockProvider = {
        getFeeData: vi.fn().mockRejectedValue(new Error('RPC error')),
      }
      ;(ethers.JsonRpcProvider as any).mockReturnValue(mockProvider)

      const adapter = new EvmChainAdapter('ethereum')
      const result = await adapter.getGasPrice()

      expect(result.success).toBe(false)
      expect(result.error).toBe('RPC error')
    })
  })

  describe('validateAddress', () => {
    beforeEach(() => {
      mockGetChainConfig.mockReturnValue(mockEthConfig)
      mockGetRpcUrl.mockReturnValue('https://eth.llamarpc.com')
    })

    it('有效地址应返回 true', () => {
      ;(ethers.isAddress as any).mockReturnValue(true)
      const adapter = new EvmChainAdapter('ethereum')

      expect(adapter.validateAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18')).toBe(true)
    })

    it('无效地址应返回 false', () => {
      ;(ethers.isAddress as any).mockReturnValue(false)
      const adapter = new EvmChainAdapter('ethereum')

      expect(adapter.validateAddress('0xinvalid')).toBe(false)
    })

    it('ethers.isAddress 抛出异常时应返回 false', () => {
      ;(ethers.isAddress as any).mockImplementation(() => {
        throw new Error('Invalid address')
      })
      const adapter = new EvmChainAdapter('ethereum')

      expect(adapter.validateAddress('0xbad')).toBe(false)
    })
  })
})
