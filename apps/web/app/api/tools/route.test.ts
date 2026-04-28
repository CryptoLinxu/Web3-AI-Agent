import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/tools/route'
import * as web3Tools from '@web3-ai-agent/web3-tools'

// Mock web3-tools
vi.mock('@web3-ai-agent/web3-tools', () => ({
  getTokenPrice: vi.fn(),
  getBalance: vi.fn(),
  getGasPrice: vi.fn(),
  getTokenBalance: vi.fn(),
}))

// Mock NextRequest
const createMockRequest = (body: any) => ({
  json: vi.fn().mockResolvedValue(body),
})

describe('POST /api/tools', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getTokenPrice 应调用 web3-tools.getTokenPrice', async () => {
    vi.mocked(web3Tools.getTokenPrice).mockResolvedValue({
      success: true,
      price: 3000,
      symbol: 'ETH',
      timestamp: new Date().toISOString(),
      source: 'CoinGecko',
    })

    const request = createMockRequest({
      name: 'getTokenPrice',
      arguments: { symbol: 'ETH' },
    }) as any

    const response = await POST(request)
    const data = await response.json()

    expect(web3Tools.getTokenPrice).toHaveBeenCalledWith('ETH')
    expect(data.success).toBe(true)
    expect(data.price).toBe(3000)
  })

  it('getBalance 应调用 web3-tools.getBalance', async () => {
    vi.mocked(web3Tools.getBalance).mockResolvedValue({
      success: true,
      balance: '1.5',
      symbol: 'ETH',
      address: '0x123',
      chain: 'ethereum',
    })

    const request = createMockRequest({
      name: 'getBalance',
      arguments: { chain: 'ethereum', address: '0x123' },
    }) as any

    const response = await POST(request)
    const data = await response.json()

    expect(web3Tools.getBalance).toHaveBeenCalledWith('ethereum', '0x123')
    expect(data.success).toBe(true)
  })

  it('getGasPrice 应调用 web3-tools.getGasPrice', async () => {
    vi.mocked(web3Tools.getGasPrice).mockResolvedValue({
      success: true,
      gasPrice: '20',
      chain: 'ethereum',
    })

    const request = createMockRequest({
      name: 'getGasPrice',
      arguments: { chain: 'ethereum' },
    }) as any

    const response = await POST(request)
    const data = await response.json()

    expect(web3Tools.getGasPrice).toHaveBeenCalledWith('ethereum')
    expect(data.success).toBe(true)
  })

  it('未知工具应返回错误', async () => {
    const request = createMockRequest({
      name: 'unknownTool',
      arguments: {},
    }) as any

    const response = await POST(request)
    const data = await response.json()

    expect(data.success).toBe(false)
    expect(data.error).toContain('未知工具')
  })

  it('工具执行失败应返回 500 错误', async () => {
    vi.mocked(web3Tools.getTokenPrice).mockRejectedValue(new Error('Network error'))

    const request = createMockRequest({
      name: 'getTokenPrice',
      arguments: { symbol: 'ETH' },
    }) as any

    const response = await POST(request)
    
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe(true)
    expect(data.message).toContain('Network error')
  })
})
