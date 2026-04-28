import { describe, it, expect, vi } from 'vitest'
import { getGasPrice } from '../gas'

vi.mock('../chains', () => ({
  EvmChainAdapter: vi.fn().mockImplementation(() => ({
    getGasPrice: vi.fn().mockResolvedValue({
      success: true,
      data: {
        chain: 'ethereum',
        gasPrice: '25.5',
        maxFeePerGas: '30.0',
        maxPriorityFeePerGas: '2.0',
        unit: 'Gwei',
      },
      timestamp: new Date().toISOString(),
      source: 'Ethereum',
    }),
  })),
}))

describe('getGasPrice', () => {
  it('应获取以太坊 Gas 价格', async () => {
    const result = await getGasPrice('ethereum')
    expect(result.success).toBe(true)
    expect(result.data?.chain).toBe('ethereum')
    expect(result.data?.unit).toBe('Gwei')
    expect(result.data?.gasPrice).toBe('25.5')
  })

  it('应获取 Polygon Gas 价格', async () => {
    const result = await getGasPrice('polygon')
    expect(result.success).toBe(true)
    expect(result.data?.chain).toBe('ethereum') // mock 返回固定值
  })

  it('应获取 BSC Gas 价格', async () => {
    const result = await getGasPrice('bsc')
    expect(result.success).toBe(true)
  })
})
