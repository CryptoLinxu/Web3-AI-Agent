import { describe, it, expect, vi, beforeEach } from 'vitest'

// Use hoisted mock for node-fetch
const mockFetch = vi.hoisted(() => vi.fn())

// Mock node-fetch and https-proxy-agent before imports
vi.mock('node-fetch', () => ({
  default: mockFetch,
}))

vi.mock('https-proxy-agent', () => ({
  HttpsProxyAgent: vi.fn(),
}))

import { BitcoinAdapter } from '../../chains/bitcoin'

describe('BitcoinAdapter', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('validateAddress', () => {
    const adapter = new BitcoinAdapter()

    it('应验证有效的 P2PKH 地址（以 1 开头）', () => {
      expect(adapter.validateAddress('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')).toBe(true)
    })

    it('应验证有效的 P2SH 地址（以 3 开头）', () => {
      expect(adapter.validateAddress('3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy')).toBe(true)
    })

    it('应验证有效的 Bech32 地址（以 bc1 开头）', () => {
      expect(adapter.validateAddress('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq')).toBe(true)
    })

    it('应拒绝无效的地址', () => {
      expect(adapter.validateAddress('')).toBe(false)
      expect(adapter.validateAddress('abc')).toBe(false)
      expect(adapter.validateAddress('0x1234')).toBe(false)
      expect(adapter.validateAddress('1')).toBe(false)
      expect(adapter.validateAddress('bc1')).toBe(false)
    })
  })

  describe('getBalance', () => {
    const validAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'

    it('应返回 Blockchain.info 的余额', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ final_balance: 5000000000 }), // 50 BTC in satoshi
      })

      const adapter = new BitcoinAdapter()
      const result = await adapter.getBalance(validAddress)

      expect(result.success).toBe(true)
      expect(result.data?.chain).toBe('bitcoin')
      expect(result.data?.balance).toBe('50')
      expect(result.data?.unit).toBe('BTC')
      expect(result.data?.address).toBe(validAddress)
    })

    it('Blockchain.info 失败时应切换到 Blockchair', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: {
              [validAddress]: { address: { balance: 100000000 } }, // 1 BTC
            },
          }),
        })

      const adapter = new BitcoinAdapter()
      const result = await adapter.getBalance(validAddress)

      expect(result.success).toBe(true)
      expect(result.data?.balance).toBe('1')
    })

    it('所有数据源都失败时应返回错误', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const adapter = new BitcoinAdapter()
      const result = await adapter.getBalance(validAddress)

      expect(result.success).toBe(false)
      expect(result.error).toContain('所有 BTC 余额 API 都不可用')
    })

    it('无效地址格式应返回错误', async () => {
      const adapter = new BitcoinAdapter()
      const result = await adapter.getBalance('invalid')

      expect(result.success).toBe(false)
      expect(result.error).toContain('无效的 Bitcoin 地址格式')
    })
  })
})
