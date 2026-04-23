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
 */
export function validateWalletAddress(address: string): boolean {
  return typeof address === 'string' && 
         address.startsWith('0x') && 
         address.length === 42
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
