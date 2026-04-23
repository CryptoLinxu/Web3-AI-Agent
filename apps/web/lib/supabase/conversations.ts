import { supabase, getWalletContext } from './client'
import type { Message } from '@/types/chat'

export interface ConversationSummary {
  id: string
  title: string | null
  updated_at: string
  message_count: number
}

/**
 * 验证当前钱包上下文
 * 所有查询前必须调用此函数
 */
function verifyWalletContext(walletAddress: string): void {
  const context = getWalletContext()
  if (!context) {
    throw new Error('Wallet context not set. Call setWalletContext() before querying.')
  }
  if (context !== walletAddress) {
    throw new Error(`Wallet mismatch: expected ${context}, got ${walletAddress}`)
  }
}

/**
 * 获取或创建当前钱包的最新对话
 */
export async function getOrCreateConversation(
  walletAddress: string
): Promise<string> {
  verifyWalletContext(walletAddress)
  
  // 尝试获取最新的对话
  const { data: existingConv } = await supabase
    .from('conversations')
    .select('id')
    .eq('wallet_address', walletAddress)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if ((existingConv as any)?.id) {
    return (existingConv as any).id
  }

  // 创建新对话
  const { data: newConv, error } = await supabase
    .from('conversations')
    .insert({
      wallet_address: walletAddress,
      title: '新对话',
    } as any)
    .select('id')
    .single()

  if (error || !(newConv as any)?.id) {
    throw new Error(`Failed to create conversation: ${error?.message}`)
  }

  return (newConv as any).id
}

/**
 * 创建新对话（总是创建新的，不返回已有的）
 */
export async function createNewConversation(
  walletAddress: string,
  title?: string
): Promise<string> {
  verifyWalletContext(walletAddress)
  
  const { data: newConv, error } = await supabase
    .from('conversations')
    .insert({
      wallet_address: walletAddress,
      title: title || '新对话',
    } as any)
    .select('id')
    .single()

  if (error || !(newConv as any)?.id) {
    throw new Error(`Failed to create new conversation: ${error?.message}`)
  }

  return (newConv as any).id
}

/**
 * 根据用户消息生成对话标题
 * 提取第一个问题的前 20 个字符
 */
export function generateConversationTitle(message: string): string {
  // 移除 markdown 格式和特殊字符
  const cleanMessage = message
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/\[.*?\]\(.*?\)/g, '')
    .replace(/\n/g, ' ')
    .trim()

  // 取前 30 个字符作为标题
  const maxLength = 30
  if (cleanMessage.length <= maxLength) {
    return cleanMessage
  }
  return cleanMessage.substring(0, maxLength) + '...'
}

/**
 * 保存消息列表到云端
 */
export async function saveMessages(
  conversationId: string,
  messages: Message[]
): Promise<void> {
  const messagesToInsert = messages.map((msg) => ({
    conversation_id: conversationId,
    role: msg.role,
    content: msg.content,
    metadata: {
      timestamp: msg.timestamp,
      toolCalls: msg.toolCalls || null,
      isError: msg.isError || false,
    },
  }))

  const { error } = await supabase.from('messages').insert(messagesToInsert as any)

  if (error) {
    throw new Error(`Failed to save messages: ${error.message}`)
  }
}

/**
 * 加载对话的所有消息
 */
export async function loadMessages(
  conversationId: string
): Promise<Message[]> {
  // 注意：此函数不直接验证 walletAddress
  // 调用方应确保 conversationId 属于当前钱包
  
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to load messages: ${error.message}`)
  }

  // 转换为 Message 格式
  return (
    (data as any[])?.map((row) => ({
      id: row.id,
      role: row.role,
      content: row.content,
      timestamp: row.metadata?.timestamp || new Date(row.created_at).getTime(),
      toolCalls: row.metadata?.toolCalls || undefined,
      isError: row.metadata?.isError || false,
    })) || []
  )
}

/**
 * 获取钱包的所有对话列表
 */
export async function getConversations(
  walletAddress: string
): Promise<ConversationSummary[]> {
  verifyWalletContext(walletAddress)
  
  // 获取对话列表
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('id, title, updated_at')
    .eq('wallet_address', walletAddress)
    .order('updated_at', { ascending: false })
    .limit(100)

  if (convError) {
    throw new Error(`Failed to get conversations: ${convError.message}`)
  }

  // 获取每个对话的消息数量
  const summaries: ConversationSummary[] = []

  for (const conv of (conversations as any[]) || []) {
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conv.id)

    summaries.push({
      id: conv.id,
      title: conv.title,
      updated_at: conv.updated_at,
      message_count: count || 0,
    })
  }

  return summaries
}

/**
 * 更新对话标题
 */
export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', conversationId)

  if (error) {
    throw new Error(`Failed to update conversation title: ${error.message}`)
  }
}

/**
 * 删除对话及其所有消息
 */
export async function deleteConversation(
  conversationId: string,
  walletAddress: string // 新增：必须提供钱包地址用于验证
): Promise<void> {
  verifyWalletContext(walletAddress)
  
  // 验证对话属于当前钱包
  const { data: conv, error: fetchError } = await supabase
    .from('conversations')
    .select('wallet_address')
    .eq('id', conversationId)
    .single()
  
  if (fetchError || !conv) {
    throw new Error('Conversation not found')
  }
  
  if ((conv as any).wallet_address !== walletAddress) {
    throw new Error('Unauthorized: conversation does not belong to this wallet')
  }
  
  // 先删除消息
  await supabase.from('messages').delete().eq('conversation_id', conversationId)

  // 再删除对话
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId)

  if (error) {
    throw new Error(`Failed to delete conversation: ${error.message}`)
  }
}
