import { describe, it, expect } from 'vitest'
import { getTokenConfig, isNativeToken, TOKENS } from './tokens'

describe('getTokenConfig', () => {
  it('应返回以太坊 USDT 配置', () => {
    const token = getTokenConfig('ethereum', 'USDT')
    expect(token).toBeDefined()
    expect(token!.symbol).toBe('USDT')
    expect(token!.decimals).toBe(6)
    expect(token!.address).toMatch(/^0x[a-fA-F0-9]{40}$/)
  })

  it('应返回 Polygon USDC 配置', () => {
    const token = getTokenConfig('polygon', 'USDC')
    expect(token).toBeDefined()
    expect(token!.symbol).toBe('USDC')
    expect(token!.decimals).toBe(6)
  })

  it('应返回 BSC USDT 配置', () => {
    const token = getTokenConfig('bsc', 'USDT')
    expect(token).toBeDefined()
    expect(token!.symbol).toBe('USDT')
    expect(token!.decimals).toBe(18) // BSC USDT 是 18 位精度
  })

  it('应返回 DAI 配置（仅在以太坊上）', () => {
    const token = getTokenConfig('ethereum', 'DAI')
    expect(token).toBeDefined()
    expect(token!.symbol).toBe('DAI')
    expect(token!.decimals).toBe(18)
  })

  it('不存在的 chain 应返回 undefined', () => {
    expect(getTokenConfig('invalid-chain', 'USDT')).toBeUndefined()
  })

  it('不存在的 symbol 应返回 undefined', () => {
    expect(getTokenConfig('ethereum', 'NONEXISTENT')).toBeUndefined()
  })

  it('symbol 查找区分大小写', () => {
    // JavaScript 对象键查找默认区分大小写
    expect(getTokenConfig('ethereum', 'usdt')).toBeUndefined()
  })
})

describe('isNativeToken', () => {
  it('ETH 应被视为原生币', () => {
    expect(isNativeToken('ETH')).toBe(true)
  })

  it('MATIC 应被视为原生币', () => {
    expect(isNativeToken('MATIC')).toBe(true)
  })

  it('BNB 应被视为原生币', () => {
    expect(isNativeToken('BNB')).toBe(true)
  })

  it('大小写不敏感', () => {
    expect(isNativeToken('eth')).toBe(true)
    expect(isNativeToken('matic')).toBe(true)
    expect(isNativeToken('bnb')).toBe(true)
  })

  it('非原生币应返回 false', () => {
    expect(isNativeToken('USDT')).toBe(false)
    expect(isNativeToken('BTC')).toBe(false)
    expect(isNativeToken('SOL')).toBe(false)
  })

  it('空字符串应返回 false', () => {
    expect(isNativeToken('')).toBe(false)
  })
})
