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

    // 直接删除对话，利用外键 ON DELETE CASCADE 自动删除消息
    // 如果对话不属于当前钱包，affected count 为 0
    const { data, error: deleteError } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)
      .eq('wallet_address', walletAddress)  // 双重条件确保只能删除自己的对话
      .select('id')
      .single()

    if (deleteError) {
      // PGRST116: 查询不到记录（对话不存在或不属于当前钱包）
      if (deleteError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: '对话不存在或无权删除' },
          { status: 404 }
        )
      }
      console.error('[delete-conversation] 删除失败:', deleteError)
      return NextResponse.json(
        { success: false, error: '删除对话失败' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: '对话不存在或无权删除' },
        { status: 404 }
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
