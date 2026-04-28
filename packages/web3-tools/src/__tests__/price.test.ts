import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Use vi.hoisted() to create mock before vi.mock factories
const mockFetch = vi.hoisted(() => vi.fn())

// Mock node-fetch (default export) and https-proxy-agent before imports
vi.mock('node-fetch', () => ({
  default: mockFetch,
}))

vi.mock('https-proxy-agent', () => ({
  HttpsProxyAgent: vi.fn(),
}))

import { getTokenPrice, getETHPrice, getBTCPrice } from '../price'

describe('getTokenPrice', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('不支持的币种应返回错误', async () => {
    const result = await getTokenPrice('DOGE')
    expect(result.success).toBe(false)
    expect(result.error).toContain('不支持的币种')
  })

  it('应成功获取 ETH 价格（Binance 数据源）', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ price: '3500.50' }),
    })

    const result = await getTokenPrice('ETH')
    expect(result.success).toBe(true)
    expect(result.data?.symbol).toBe('ETH')
    expect(result.data?.price).toBe(3500.50)
    expect(result.source).toBe('Binance CN')
  })

  it('Binance 失败时应切换到 Huobi 数据源', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ tick: { close: 3400, open: 3300 } }),
      })

    const result = await getTokenPrice('ETH')
    expect(result.success).toBe(true)
    expect(result.data?.price).toBe(3400)
    expect(result.data?.change24h).toBeCloseTo(3.03, 1)
    expect(result.source).toBe('Huobi')
  })

  it('所有数据源都失败时应返回错误', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    const result = await getTokenPrice('ETH')
    expect(result.success).toBe(false)
    expect(result.error).toContain('所有数据源均失败')
  })
})

describe('getETHPrice (deprecated)', () => {
  it('应委派到 getTokenPrice', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ price: '3500' }),
    })

    const result = await getETHPrice()
    expect(result.success).toBe(true)
    expect(result.data?.symbol).toBe('ETH')
  })
})

describe('getBTCPrice (deprecated)', () => {
  it('应委派到 getTokenPrice', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ price: '65000' }),
    })

    const result = await getBTCPrice()
    expect(result.success).toBe(true)
    expect(result.data?.symbol).toBe('BTC')
  })
})
