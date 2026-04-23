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
