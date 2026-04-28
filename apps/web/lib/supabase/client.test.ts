import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Set env vars before module imports
vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
})

// Mock @supabase/supabase-js
const mockCreateClient = vi.hoisted(() => vi.fn(() => ({
  from: vi.fn(),
})))

vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}))

import {
  validateWalletAddress,
  setWalletContext,
  getWalletContext,
  clearWalletContext,
  supabase,
} from './client'

describe('validateWalletAddress', () => {
  it('应验证有效的 0x 地址（42 字符）', () => {
    expect(validateWalletAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18')).toBe(true)
  })

  it('应拒绝非 0x 开头的地址', () => {
    expect(validateWalletAddress('742d35Cc6634C0532925a3b844Bc9e7595f2bD18')).toBe(false)
  })

  it('应拒绝长度不符的地址', () => {
    expect(validateWalletAddress('0x1234')).toBe(false)
  })

  it('应拒绝空字符串', () => {
    expect(validateWalletAddress('')).toBe(false)
  })

  it('应拒绝非字符串类型', () => {
    expect(validateWalletAddress(null as any)).toBe(false)
    expect(validateWalletAddress(undefined as any)).toBe(false)
  })
})

describe('setWalletContext / getWalletContext / clearWalletContext', () => {
  beforeEach(() => {
    clearWalletContext()
  })

  it('设置后应能获取钱包地址', () => {
    setWalletContext('0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18')
    expect(getWalletContext()).toBe('0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18')
  })

  it('无效地址应抛出错误', () => {
    expect(() => setWalletContext('invalid')).toThrow('Invalid wallet address')
  })

  it('清除后应返回 null', () => {
    setWalletContext('0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18')
    clearWalletContext()
    expect(getWalletContext()).toBeNull()
  })

  it('初始状态应为 null', () => {
    expect(getWalletContext()).toBeNull()
  })
})

describe('supabase client', () => {
  it('应调用 createClient 创建实例', () => {
    expect(mockCreateClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key'
    )
  })

  it('supabase 应包含 from 方法', () => {
    expect(typeof supabase.from).toBe('function')
  })
})
