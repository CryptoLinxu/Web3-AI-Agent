import { describe, it, expect, vi } from 'vitest'
import { validateAddress, getExplorerUrl } from '../transfer'

describe('validateAddress', () => {
  it('应通过有效的以太坊地址', () => {
    expect(validateAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18')).toBe(true)
  })

  it('应拒绝非 0x 开头的地址', () => {
    expect(validateAddress('742d35Cc6634C0532925a3b844Bc9e7595f2bD18')).toBe(false)
  })

  it('应拒绝长度不足的地址', () => {
    expect(validateAddress('0x1234')).toBe(false)
  })

  it('应拒绝空字符串', () => {
    expect(validateAddress('')).toBe(false)
  })

  it('应拒绝无效字符的地址', () => {
    expect(validateAddress('0xGGGG35Cc6634C0532925a3b844Bc9e7595f2bD18')).toBe(false)
  })
})

describe('getExplorerUrl', () => {
  const txHash = '0xabc123def456'

  it('应生成以太坊浏览器链接', () => {
    const url = getExplorerUrl('ethereum', txHash)
    expect(url).toBe(`https://etherscan.io/tx/${txHash}`)
  })

  it('应生成 Polygon 浏览器链接', () => {
    const url = getExplorerUrl('polygon', txHash)
    expect(url).toBe(`https://polygonscan.com/tx/${txHash}`)
  })

  it('应生成 BSC 浏览器链接', () => {
    const url = getExplorerUrl('bsc', txHash)
    expect(url).toBe(`https://bscscan.com/tx/${txHash}`)
  })
})
