import { describe, it, expect, vi, beforeEach } from 'vitest'

// Set env vars before module imports
vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
})

// Mock the supabase client module
const mockWalletContext = vi.hoisted(() => {
  let context: string | null = null
  return {
    getWalletContext: vi.fn(() => context),
    setWalletContext: vi.fn((addr: string) => { context = addr }),
    clearWalletContext: vi.fn(() => { context = null }),
  }
})

vi.mock('./client', () => ({
  supabase: new Proxy({ from: vi.fn() }, {
    get(target: any, prop: string) {
      if (prop === 'from') {
        return target.from
      }
      return undefined
    },
  }),
  getWalletContext: mockWalletContext.getWalletContext,
  setWalletContext: mockWalletContext.setWalletContext,
  clearWalletContext: mockWalletContext.clearWalletContext,
}))

import {
  createTransferCard,
  updateTransferCardStatus,
  loadTransferCards,
  findTransferCardByMessageId,
} from './transfers'

describe('createTransferCard', () => {
  it('应成功创建转账卡片', async () => {
    const mockFrom = vi.fn().mockReturnThis()
    const mockSelect = vi.fn().mockReturnThis()
    const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'card-123' }, error: null })

    const { supabase } = await import('./client')
    ;(supabase.from as any).mockReturnValue({
      upsert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: mockSingle,
        }),
      }),
    })

    const id = await createTransferCard({
      conversationId: 'conv-1',
      messageId: 'msg-1',
      fromAddress: '0xfrom',
      toAddress: '0xto',
      tokenSymbol: 'USDT',
      amount: '100',
      chain: 'ethereum',
    })

    expect(id).toBe('card-123')
    expect(supabase.from).toHaveBeenCalledWith('transfer_cards')
  })
})

describe('updateTransferCardStatus', () => {
  it('应更新状态和 txHash', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null })
    const mockUpdate = vi.fn(() => ({ eq: mockEq }))

    const { supabase } = await import('./client')
    ;(supabase.from as any).mockReturnValue({ update: mockUpdate })

    await updateTransferCardStatus('card-1', 'confirmed', '0xtxhash')

    expect(supabase.from).toHaveBeenCalledWith('transfer_cards')
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'confirmed', tx_hash: '0xtxhash' })
    )
  })

  it('应更新错误信息', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null })
    const mockUpdate = vi.fn(() => ({ eq: mockEq }))

    const { supabase } = await import('./client')
    ;(supabase.from as any).mockReturnValue({ update: mockUpdate })

    await updateTransferCardStatus('card-1', 'failed', undefined, 'Insufficient balance')

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed', error_message: 'Insufficient balance' })
    )
  })

  it('更新失败时应抛出错误', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: { message: 'DB error' } })
    const mockUpdate = vi.fn(() => ({ eq: mockEq }))

    const { supabase } = await import('./client')
    ;(supabase.from as any).mockReturnValue({ update: mockUpdate })

    await expect(updateTransferCardStatus('card-1', 'confirmed'))
      .rejects.toThrow('更新转账状态失败')
  })
})

describe('loadTransferCards', () => {
  it('应加载对话的所有转账卡片', async () => {
    const mockOrder = vi.fn().mockResolvedValue({
      error: null,
      data: [
        {
          id: 'card-1',
          from_address: '0xfrom',
          to_address: '0xto',
          token_symbol: 'USDT',
          amount: '100',
          chain: 'ethereum',
          status: 'pending',
        },
      ],
    })
    const mockEq = vi.fn(() => ({ order: mockOrder }))
    const mockSelect = vi.fn(() => ({ eq: mockEq }))

    const { supabase } = await import('./client')
    ;(supabase.from as any).mockReturnValue({ select: mockSelect })

    const cards = await loadTransferCards('conv-1')

    expect(cards.length).toBe(1)
    expect(cards[0].tokenSymbol).toBe('USDT')
    expect(cards[0].status).toBe('pending')
  })

  it('加载失败应返回空数组', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ error: { message: 'Error' }, data: null })
    const mockEq = vi.fn(() => ({ order: mockOrder }))
    const mockSelect = vi.fn(() => ({ eq: mockEq }))

    const { supabase } = await import('./client')
    ;(supabase.from as any).mockReturnValue({ select: mockSelect })

    const cards = await loadTransferCards('conv-1')
    expect(cards).toEqual([])
  })
})

describe('findTransferCardByMessageId', () => {
  it('找到时应返回转账卡片', async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      error: null,
      data: {
        id: 'card-1',
        message_id: 'msg-1',
        from_address: '0xfrom',
        to_address: '0xto',
        token_symbol: 'USDT',
        amount: '100',
        chain: 'ethereum',
        status: 'pending',
      },
    })
    const mockEq2 = vi.fn(() => ({ single: mockSingle }))
    const mockEq1 = vi.fn(() => ({ eq: mockEq2 }))
    const mockSelect = vi.fn(() => ({ eq: mockEq1 }))

    const { supabase } = await import('./client')
    ;(supabase.from as any).mockReturnValue({ select: mockSelect })

    const card = await findTransferCardByMessageId('conv-1', 'msg-1')
    expect(card).not.toBeNull()
    expect(card!.tokenSymbol).toBe('USDT')
  })

  it('未找到时应返回 null', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ error: { message: 'Not found' }, data: null })
    const mockEq2 = vi.fn(() => ({ single: mockSingle }))
    const mockEq1 = vi.fn(() => ({ eq: mockEq2 }))
    const mockSelect = vi.fn(() => ({ eq: mockEq1 }))

    const { supabase } = await import('./client')
    ;(supabase.from as any).mockReturnValue({ select: mockSelect })

    const card = await findTransferCardByMessageId('conv-1', 'nonexistent')
    expect(card).toBeNull()
  })
})
