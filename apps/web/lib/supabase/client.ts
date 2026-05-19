import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// 从环境变量读取配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// 创建 Supabase 客户端单例（使用 any 绕过类型检查）
export const supabase = createClient(supabaseUrl, supabaseAnonKey) as any

/**
 * 验证钱包地址格式
 * 支持 EVM (0x 开头, 42 位) 和 Solana (Base58, 32-44 位)
 */
export function validateWalletAddress(address: string): boolean {
  if (typeof address !== 'string' || !address) return false
  
  // EVM 地址: 0x 开头 + 40 位十六进制 = 42 位
  if (address.startsWith('0x') && address.length === 42) {
    return true
  }
  
  // Solana 地址: Base58 编码, 32-44 位字符
  // Base58 字符集: 123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
  if (base58Regex.test(address)) {
    return true
  }
  
  return false
}

/**
 * 当前会话的钱包地址（内存中存储）
 * 注意：这不是安全的 RLS 实现，只是应用层过滤
 * 生产环境必须使用 Supabase Auth + JWT
 */
let currentWalletAddress: string | null = null

/**
 * 设置当前钱包地址
 */
export function setWalletContext(walletAddress: string): void {
  if (!validateWalletAddress(walletAddress)) {
    throw new Error('Invalid wallet address format')
  }
  currentWalletAddress = walletAddress
}

/**
 * 获取当前钱包地址
 */
export function getWalletContext(): string | null {
  return currentWalletAddress
}

/**
 * 清除钱包上下文
 */
export function clearWalletContext(): void {
  currentWalletAddress = null
}
