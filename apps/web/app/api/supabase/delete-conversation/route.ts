import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * 服务端删除对话
 * 使用 service_role 密钥执行删除操作（绕过 RLS）
 * 前端验证所有权后再调用此接口
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { conversationId, walletAddress } = body

    // 参数验证
    if (!conversationId || typeof conversationId !== 'string') {
      return NextResponse.json(
        { success: false, error: '缺少 conversationId 参数' },
        { status: 400 }
      )
    }

    if (!walletAddress || typeof walletAddress !== 'string') {
      return NextResponse.json(
        { success: false, error: '缺少 walletAddress 参数' },
        { status: 400 }
      )
    }

    // 验证钱包地址格式
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        { success: false, error: '无效的钱包地址格式' },
        { status: 400 }
      )
    }

    // 初始化服务端 Supabase 客户端
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl) {
      return NextResponse.json(
        { success: false, error: 'Supabase 未配置' },
        { status: 500 }
      )
    }

    const supabaseKey = serviceRoleKey || anonKey
    if (!supabaseKey) {
      return NextResponse.json(
        { success: false, error: 'Supabase 密钥未配置' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Step 1: 验证对话所有权
    const { data: conv, error: queryError } = await supabase
      .from('conversations')
      .select('wallet_address')
      .eq('id', conversationId)
      .single()

    if (queryError || !conv) {
      return NextResponse.json(
        { success: false, error: '对话不存在' },
        { status: 404 }
      )
    }

    if (conv.wallet_address !== walletAddress) {
      console.warn('[delete-conversation] 所有权验证失败:', {
        conversationId,
        expectedWallet: walletAddress,
        actualWallet: conv.wallet_address,
      })
      return NextResponse.json(
        { success: false, error: '无权删除此对话' },
        { status: 403 }
      )
    }

    // Step 2: 删除消息（外键关联，需先删）
    const { error: deleteMessagesError } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', conversationId)

    if (deleteMessagesError) {
      console.error('[delete-conversation] 删除消息失败:', deleteMessagesError)
      return NextResponse.json(
        { success: false, error: '删除消息失败' },
        { status: 500 }
      )
    }

    // Step 3: 删除对话
    const { error: deleteConvError } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)

    if (deleteConvError) {
      console.error('[delete-conversation] 删除对话失败:', deleteConvError)
      return NextResponse.json(
        { success: false, error: '删除对话失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[delete-conversation] 服务器错误:', error)
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
