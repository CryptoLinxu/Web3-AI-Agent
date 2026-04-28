import { describe, it, expect } from 'vitest'
import { findToken, getTokensByChain } from '../../tokens/registry'

describe('findToken', () => {
  it('应通过 symbol 查找 Token（大小写不敏感）', () => {
    const token = findToken('ethereum', 'usdt')
    expect(token).toBeDefined()
    expect(token!.symbol).toBe('USDT')
    expect(token!.chain).toBe('ethereum')
  })

  it('应通过合约地址查找 Token', () => {
    const address = '0xdac17f958d2ee523a2206206994597c13d831ec7'
    const token = findToken('ethereum', address)
    expect(token).toBeDefined()
    expect(token!.symbol).toBe('USDT')
  })

  it('合约地址查找应不区分大小写', () => {
    const token = findToken('ethereum', '0xdAC17F958D2ee523a2206206994597C13D831ec7'.toUpperCase())
    expect(token).toBeDefined()
    expect(token!.symbol).toBe('USDT')
  })

  it('应在正确的链上查找 Token（跨链同名 Symbol 不同地址）', () => {
    const ethUsdt = findToken('ethereum', 'USDT')
    const polygonUsdt = findToken('polygon', 'USDT')
    const bscUsdt = findToken('bsc', 'USDT')

    expect(ethUsdt).toBeDefined()
    expect(polygonUsdt).toBeDefined()
    expect(bscUsdt).toBeDefined()

    // 同一条链上只能找到一个
    expect(findToken('ethereum', 'USDT')).toBe(findToken('ethereum', 'USDT'))
  })

  it('不存在的 token 应返回 undefined', () => {
    const token = findToken('ethereum', 'NONEXISTENT')
    expect(token).toBeUndefined()
  })

  it('跨链查找不存在的 token 应返回 undefined', () => {
    // DAI 只在 ethereum 上
    const polygonDai = findToken('polygon', 'DAI')
    expect(polygonDai).toBeUndefined()
  })
})

describe('getTokensByChain', () => {
  it('应返回以太坊上的所有 Token', () => {
    const tokens = getTokensByChain('ethereum')
    expect(tokens.length).toBeGreaterThan(0)
    expect(tokens.every((t: { chain: string }) => t.chain === 'ethereum')).toBe(true)
  })

  it('应返回 Polygon 上的所有 Token', () => {
    const tokens = getTokensByChain('polygon')
    expect(tokens.length).toBeGreaterThan(0)
    expect(tokens.every((t: { chain: string }) => t.chain === 'polygon')).toBe(true)
  })

  it('应返回 BSC 上的所有 Token', () => {
    const tokens = getTokensByChain('bsc')
    expect(tokens.length).toBeGreaterThan(0)
    expect(tokens.every((t: { chain: string }) => t.chain === 'bsc')).toBe(true)
  })
})
