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

import { SolanaAdapter } from '../../chains/solana'

describe('SolanaAdapter', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('constructor', () => {
    it('应使用默认 RPC URL', () => {
      const adapter = new SolanaAdapter()
      expect(adapter).toBeDefined()
    })

    it('应接受自定义 RPC URL', () => {
      const adapter = new SolanaAdapter('https://custom.solana.rpc')
      expect(adapter).toBeDefined()
    })
  })

  describe('validateAddress', () => {
    const adapter = new SolanaAdapter()

    it('应验证有效的 Solana 地址（Base58, 32-44 字符）', () => {
      expect(adapter.validateAddress('7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtVQ')).toBe(true)
      expect(adapter.validateAddress('11111111111111111111111111111111')).toBe(true)
    })

    it('应拒绝过短的地址', () => {
      expect(adapter.validateAddress('abc')).toBe(false)
      expect(adapter.validateAddress('1')).toBe(false)
    })

    it('应拒绝包含 0/O/I/l 等混淆字符的地址', () => {
      // Solana 使用 Base58，不包含 0/O/I/l
      expect(adapter.validateAddress('0xinvalid')).toBe(false)
      expect(adapter.validateAddress('O1234567890123456789012345678901234567890')).toBe(false)
    })

    it('应拒绝空字符串', () => {
      expect(adapter.validateAddress('')).toBe(false)
    })
  })

  describe('getBalance', () => {
    const validAddress = '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtVQ'

    beforeEach(() => {
      // Default: valid RPC response (10 SOL = 10000000000 lamports)
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          result: { value: 10000000000 },
          id: 1,
        }),
      })
    })

    it('应返回 SOL 余额', async () => {
      const adapter = new SolanaAdapter()
      const result = await adapter.getBalance(validAddress)

      expect(result.success).toBe(true)
      expect(result.data?.chain).toBe('solana')
      expect(result.data?.balance).toBe('10')
      expect(result.data?.unit).toBe('SOL')
      expect(result.data?.decimals).toBe(9)
      expect(result.data?.address).toBe(validAddress)
      expect(result.source).toBe('Solana RPC')
    })

    it('应发送正确的 JSON-RPC 请求体', async () => {
      const adapter = new SolanaAdapter()
      await adapter.getBalance(validAddress)

      const callArg = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callArg.method).toBe('getBalance')
      expect(callArg.params[0]).toBe(validAddress)
      expect(callArg.jsonrpc).toBe('2.0')
      expect(callArg.id).toBe(1)
    })

    it('无效地址应返回错误', async () => {
      const adapter = new SolanaAdapter()
      const result = await adapter.getBalance('invalid')

      expect(result.success).toBe(false)
      expect(result.error).toContain('无效的 Solana 地址格式')
    })

    it('HTTP 错误应返回错误', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
      })

      const adapter = new SolanaAdapter()
      const result = await adapter.getBalance(validAddress)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Solana RPC HTTP 429')
    })

    it('RPC 返回错误应返回错误', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          result: null,
          error: { message: 'Invalid params' },
          id: 1,
        }),
      })

      const adapter = new SolanaAdapter()
      const result = await adapter.getBalance(validAddress)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Solana RPC 错误')
    })
  })
})
