import { describe, it, expect, vi } from 'vitest'
import { getBalance } from '../balance'

// Mock chain adapters
vi.mock('../chains', () => ({
  EvmChainAdapter: vi.fn().mockImplementation(() => ({
    getBalance: vi.fn().mockResolvedValue({
      success: true,
      data: { chain: 'ethereum', address: '0xtest', balance: '1.5', unit: 'ETH', decimals: 18 },
      timestamp: new Date().toISOString(),
      source: 'Ethereum',
    }),
  })),
  BitcoinAdapter: vi.fn().mockImplementation(() => ({
    getBalance: vi.fn().mockResolvedValue({
      success: true,
      data: { chain: 'bitcoin', address: '1test', balance: '0.5', unit: 'BTC', decimals: 8 },
      timestamp: new Date().toISOString(),
      source: 'Bitcoin API',
    }),
  })),
  SolanaAdapter: vi.fn().mockImplementation(() => ({
    getBalance: vi.fn().mockResolvedValue({
      success: true,
      data: { chain: 'solana', address: 'soltest', balance: '10', unit: 'SOL', decimals: 9 },
      timestamp: new Date().toISOString(),
      source: 'Solana RPC',
    }),
  })),
}))

describe('getBalance', () => {
  it('应查询以太坊余额', async () => {
    const result = await getBalance('ethereum', '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18')
    expect(result.success).toBe(true)
    expect(result.data?.unit).toBe('ETH')
  })

  it('应查询比特币余额', async () => {
    const result = await getBalance('bitcoin', '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')
    expect(result.success).toBe(true)
    expect(result.data?.unit).toBe('BTC')
  })

  it('应查询 Solana 余额', async () => {
    const result = await getBalance('solana', '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtVQ')
    expect(result.success).toBe(true)
    expect(result.data?.unit).toBe('SOL')
  })

  it('不支持的链应返回错误', async () => {
    const result = await getBalance('invalid' as any, '0xtest')
    expect(result.success).toBe(false)
    expect(result.error).toContain('不支持的链')
  })
})
