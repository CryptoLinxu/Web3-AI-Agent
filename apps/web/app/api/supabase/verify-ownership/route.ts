import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * 验证对话所有权
 * 服务端验证：通过直接查询数据库确认对话属于指定钱包
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { conversationId, walletAddress } = body

    // 参数验证
    if (!conversationId || typeof conversationId !== 'string') {
      return NextResponse.json(
        { isOwner: false, error: '缺少 conversationId 参数' },
        { status: 400 }
      )
    }

    if (!walletAddress || typeof walletAddress !== 'string') {
      return NextResponse.json(
        { isOwner: false, error: '缺少 walletAddress 参数' },
        { status: 400 }
      )
    }

    // 验证钱包地址格式
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        { isOwner: false, error: '无效的钱包地址格式' },
        { status: 400 }
      )
    }

    // 优先使用 service_role 密钥（服务端特权访问，绕过 RLS）
    // 如果未配置，使用 anon 密钥（需要 RLS 策略允许 SELECT）
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl) {
      return NextResponse.json(
        { isOwner: false, error: 'Supabase 未配置' },
        { status: 500 }
      )
    }

    const supabaseKey = serviceRoleKey || anonKey
    if (!supabaseKey) {
      return NextResponse.json(
        { isOwner: false, error: 'Supabase 密钥未配置' },
        { status: 500 }
      )
    }

    // 创建服务端 Supabase 客户端
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 查询对话的 wallet_address
    const { data, error } = await supabase
      .from('conversations')
      .select('wallet_address')
      .eq('id', conversationId)
      .single()

    if (error || !data) {
      console.warn('[verify-ownership] 查询失败:', error?.message)
      return NextResponse.json(
        { isOwner: false, error: '对话不存在' },
        { status: 404 }
      )
    }

    // 验证所有权
    const isOwner = data.wallet_address === walletAddress

    if (!isOwner) {
      console.warn('[verify-ownership] 所有权验证失败:', {
        conversationId,
        expectedWallet: walletAddress,
        actualWallet: data.wallet_address,
      })
    }

    return NextResponse.json({ isOwner })
  } catch (error) {
    console.error('[verify-ownership] 服务器错误:', error)
    return NextResponse.json(
      { isOwner: false, error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
