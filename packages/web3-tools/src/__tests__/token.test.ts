import { describe, it, expect, vi } from 'vitest'
import { getTokenInfo, getTokenBalance } from '../token'

// Mock dependencies
vi.mock('../tokens', () => ({
  findToken: vi.fn((chain: string, symbolOrAddress: string) => {
    // Handle address lookup (0x prefix)
    if (symbolOrAddress.startsWith('0x')) {
      // Match USDT address
      if (symbolOrAddress.toLowerCase() === '0xdac17f958d2ee523a2206206994597c13d831ec7') {
        return {
          chain: 'ethereum',
          symbol: 'USDT',
          name: 'Tether USD',
          decimals: 6,
          contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        }
      }
      // Unknown address - return undefined to test error handling
      return undefined
    }
    // Handle symbol lookup
    if (chain === 'ethereum' && symbolOrAddress.toUpperCase() === 'USDT') {
      return {
        chain: 'ethereum',
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
        contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      }
    }
    if (chain === 'ethereum' && symbolOrAddress.toUpperCase() === 'USDC') {
      return {
        chain: 'ethereum',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      }
    }
    return undefined
  }),
}))

vi.mock('../chains', () => ({
  getRpcUrl: vi.fn(() => 'https://eth.llamarpc.com'),
}))

vi.mock('ethers', () => ({
  ethers: {
    JsonRpcProvider: vi.fn(),
    Contract: vi.fn().mockImplementation(() => ({
      balanceOf: vi.fn().mockResolvedValue(BigInt('1000000')),
    })),
    formatUnits: vi.fn((value: bigint, decimals: number) => {
      return '1.0'
    }),
    isAddress: vi.fn((addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr)),
  },
}))

describe('getTokenInfo', () => {
  it('应返回 USDT 的 Token 信息', async () => {
    const result = await getTokenInfo('ethereum', 'USDT')
    expect(result.success).toBe(true)
    expect(result.data?.symbol).toBe('USDT')
    expect(result.data?.decimals).toBe(6)
  })

  it('应通过合约地址查询 Token 信息', async () => {
    const result = await getTokenInfo('ethereum', '0xdac17f958d2ee523a2206206994597c13d831ec7')
    expect(result.success).toBe(true)
  })

  it('不存在的 Token 应返回错误', async () => {
    const result = await getTokenInfo('ethereum', 'NONEXISTENT')
    expect(result.success).toBe(false)
    expect(result.error).toContain('未找到 Token')
  })

  it('非 EVM 链应返回错误', async () => {
    const result = await getTokenInfo('bitcoin', 'USDT')
    expect(result.success).toBe(false)
    expect(result.error).toContain('暂不支持')
  })
})

describe('getTokenBalance', () => {
  it('应查询 USDT 余额', async () => {
    const result = await getTokenBalance('ethereum', '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18', 'USDT')
    expect(result.success).toBe(true)
    expect(result.data?.unit).toBe('USDT')
  })

  it('不存在的 Token 应返回错误', async () => {
    const result = await getTokenBalance('ethereum', '0xtest', 'NONEXISTENT')
    expect(result.success).toBe(false)
    expect(result.error).toContain('未找到 Token')
  })

  it('非 EVM 链应返回错误', async () => {
    const result = await getTokenBalance('bitcoin', '0xtest', 'USDT')
    expect(result.success).toBe(false)
    expect(result.error).toContain('暂不支持')
  })
})
