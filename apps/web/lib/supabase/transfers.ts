// 转账卡片数据 CRUD 操作

import { supabase } from './client'
import type { TransferData, TransferStatus, ChainId } from '@/types/transfer'

export interface CreateTransferCardParams {
  conversationId: string
  messageId: string
  fromAddress: string
  toAddress: string
  tokenSymbol: string
  tokenAddress?: string
  amount: string
  chain: ChainId
}

/**
 * 创建转账卡片记录
 */
export async function createTransferCard(params: CreateTransferCardParams): Promise<string> {
  // 使用 upsert 避免重复插入
  const { data, error } = await supabase
    .from('transfer_cards')
    .upsert({
      id: params.messageId,  // 使用 message_id 作为主键
      conversation_id: params.conversationId,
      message_id: params.messageId,
      from_address: params.fromAddress,
      to_address: params.toAddress,
      token_symbol: params.tokenSymbol,
      token_address: params.tokenAddress,
      amount: params.amount,
      chain: params.chain,
      status: 'pending'
    }, {
      onConflict: 'id',
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`创建转账记录失败: ${error.message}`)
  }

  return data.id
}

/**
 * 更新转账卡片状态
 */
export async function updateTransferCardStatus(
  cardId: string,
  status: TransferStatus,
  txHash?: string,
  errorMessage?: string
): Promise<void> {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString()
  }

  if (txHash !== undefined) {
    updateData.tx_hash = txHash
  }

  if (errorMessage !== undefined) {
    updateData.error_message = errorMessage
  }

  const { error } = await supabase
    .from('transfer_cards')
    .update(updateData)
    .eq('id', cardId)

  if (error) {
    console.error('Failed to update transfer card status:', error)
    throw new Error(`更新转账状态失败: ${error.message}`)
  }
}

/**
 * 加载对话的所有转账卡片
 */
export async function loadTransferCards(conversationId: string): Promise<TransferData[]> {
  const { data, error } = await supabase
    .from('transfer_cards')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to load transfer cards:', error)
    return []
  }

  // 转换为 TransferData 格式
  return data.map((card: any) => ({
    id: card.id,
    from: card.from_address,
    to: card.to_address,
    tokenSymbol: card.token_symbol,
    tokenAddress: card.token_address || undefined,
    amount: card.amount,
    chain: card.chain as ChainId,
    status: card.status as TransferStatus,
    txHash: card.tx_hash || undefined,
    error: card.error_message || undefined
  }))
}

/**
 * 根据 message_id 查找转账卡片
 */
export async function findTransferCardByMessageId(
  conversationId: string,
  messageId: string
): Promise<TransferData | null> {
  const { data, error } = await supabase
    .from('transfer_cards')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('message_id', messageId)
    .single()

  if (error || !data) {
    return null
  }

  return {
    id: data.id,
    from: data.from_address,
    to: data.to_address,
    tokenSymbol: data.token_symbol,
    tokenAddress: data.token_address || undefined,
    amount: data.amount,
    chain: data.chain as ChainId,
    status: data.status as TransferStatus,
    txHash: data.tx_hash || undefined,
    error: data.error_message || undefined
  }
}
