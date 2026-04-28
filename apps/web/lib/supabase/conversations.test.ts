import { describe, it, expect, vi, beforeEach } from 'vitest'

// Set env vars before module imports
vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
})

// Mock the supabase client module
const mockWalletContext = vi.hoisted(() => {
  let context: string | null = '0x1234567890123456789012345678901234567890'
  return {
    getWalletContext: vi.fn(() => context),
    setWalletContext: vi.fn((addr: string) => { context = addr }),
    clearWalletContext: vi.fn(() => { context = null }),
    setContext: (val: string | null) => { context = val },
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
  getOrCreateConversation,
  createNewConversation,
  generateConversationTitle,
  saveMessages,
  loadMessages,
  getConversations,
  updateConversationTitle,
  deleteConversation,
} from './conversations'
import type { Message } from '@/types/chat'

const WALLET = '0x1234567890123456789012345678901234567890'

describe('generateConversationTitle', () => {
  it('短消息应直接返回', () => {
    const title = generateConversationTitle('Hello')
    expect(title).toBe('Hello')
  })

  it('空消息应返回空字符串', () => {
    const title = generateConversationTitle('')
    expect(title).toBe('')
  })

  it('应去除 Markdown 加粗标记', () => {
    const title = generateConversationTitle('**Hello** World')
    expect(title).toBe('Hello World')
  })

  it('应去除 Markdown 链接', () => {
    const title = generateConversationTitle('Check [this](https://example.com) out')
    // 删除链接后,前后空格可能留下双空格
    expect(title).toBe('Check  out')
  })

  it('长消息应截断到 30 字符并添加省略号', () => {
    const longMsg = '这是一个非常非常非常非常非常非常非常长的消息内容超过三十个字了哦'
    const title = generateConversationTitle(longMsg)
    expect(title.length).toBe(33) // 30 chars + '...'
    expect(title.endsWith('...')).toBe(true)
  })

  it('应替换换行符为空格', () => {
    const title = generateConversationTitle('line1\nline2\nline3')
    expect(title).toBe('line1 line2 line3')
  })

  it('空格和换行混合时应 trim', () => {
    const title = generateConversationTitle('  \n  hello  \n  ')
    expect(title).toBe('hello')
  })
})

describe('getOrCreateConversation', () => {
  beforeEach(() => {
    mockWalletContext.setContext(WALLET)
  })

  it('钱包上下文未设置时应抛出错误', async () => {
    mockWalletContext.setContext(null)
    await expect(getOrCreateConversation(WALLET))
      .rejects.toThrow('Wallet context not set')
  })

  it('钱包地址不匹配时应抛出错误', async () => {
    await expect(getOrCreateConversation('0x0000000000000000000000000000000000000000'))
      .rejects.toThrow('Wallet mismatch')
  })

  it('有现有对话时应返回最新对话 ID', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'conv-1' }, error: null })
    const mockLimit = vi.fn(() => ({ single: mockSingle }))
    const mockOrder = vi.fn(() => ({ limit: mockLimit }))
    const mockEq = vi.fn(() => ({ order: mockOrder }))
    const mockSelect = vi.fn(() => ({ eq: mockEq }))

    const { supabase } = await import('./client')
    ;(supabase.from as any).mockReturnValue({ select: mockSelect })

    const id = await getOrCreateConversation(WALLET)
    expect(id).toBe('conv-1')
    expect(supabase.from).toHaveBeenCalledWith('conversations')
  })

  it('无现有对话时应创建新对话', async () => {
    const mockSingleExisting = vi.fn().mockResolvedValue({ data: null, error: null })
    const mockLimit = vi.fn(() => ({ single: mockSingleExisting }))
    const mockOrder = vi.fn(() => ({ limit: mockLimit }))
    const mockEq = vi.fn(() => ({ order: mockOrder }))
    const mockSelect = vi.fn(() => ({ eq: mockEq }))

    // 第二个调用: insert...select...single
    const mockSingleNew = vi.fn().mockResolvedValue({ data: { id: 'conv-new' }, error: null })
    const mockSelectNew = vi.fn(() => ({ single: mockSingleNew }))
    const mockInsert = vi.fn(() => ({ select: mockSelectNew }))

    // 使用数组跟踪调用
    let callCount = 0
    const { supabase } = await import('./client')
    // 重置 mock 并替换 from 的行为
    ;(supabase.from as any).mockReset()
    ;(supabase.from as any).mockImplementation((table: string) => {
      callCount++
      if (callCount === 1) {
        // 第一次 from('conversations') - 查找
        return { select: mockSelect }
      }
      // 第二次 from('conversations') - 插入
      return { insert: mockInsert }
    })

    const id = await getOrCreateConversation(WALLET)
    expect(id).toBe('conv-new')
  })

  it('创建对话失败时应抛出错误', async () => {
    const mockSingleExisting = vi.fn().mockResolvedValue({ data: null, error: null })
    const mockLimit = vi.fn(() => ({ single: mockSingleExisting }))
    const mockOrder = vi.fn(() => ({ limit: mockLimit }))
    const mockEq = vi.fn(() => ({ order: mockOrder }))
    const mockSelect = vi.fn(() => ({ eq: mockEq }))

    const mockSingleNew = vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } })
    const mockSelectNew = vi.fn(() => ({ single: mockSingleNew }))
    const mockInsert = vi.fn(() => ({ select: mockSelectNew }))

    let callCount = 0
    const { supabase } = await import('./client')
    ;(supabase.from as any).mockReset()
    ;(supabase.from as any).mockImplementation(() => {
      callCount++
      if (callCount === 1) return { select: mockSelect }
      return { insert: mockInsert }
    })

    await expect(getOrCreateConversation(WALLET)).rejects.toThrow('Failed to create conversation')
  })
})

describe('createNewConversation', () => {
  beforeEach(() => {
    mockWalletContext.setContext(WALLET)
  })

  it('应创建新对话并返回 ID', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'conv-new' }, error: null })
    const mockSelect = vi.fn(() => ({ single: mockSingle }))
    const mockInsert = vi.fn(() => ({ select: mockSelect }))

    const { supabase } = await import('./client')
    ;(supabase.from as any).mockReturnValue({ insert: mockInsert })

    const id = await createNewConversation(WALLET)
    expect(id).toBe('conv-new')
    expect(supabase.from).toHaveBeenCalledWith('conversations')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ wallet_address: WALLET, title: '新对话' })
    )
  })

  it('应接受自定义标题', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'conv-title' }, error: null })
    const mockSelect = vi.fn(() => ({ single: mockSingle }))
    const mockInsert = vi.fn(() => ({ select: mockSelect }))

    const { supabase } = await import('./client')
    ;(supabase.from as any).mockReturnValue({ insert: mockInsert })

    await createNewConversation(WALLET, 'Test Title')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Test Title' })
    )
  })

  it('创建失败时应抛出错误', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } })
    const mockSelect = vi.fn(() => ({ single: mockSingle }))
    const mockInsert = vi.fn(() => ({ select: mockSelect }))

    const { supabase } = await import('./client')
    ;(supabase.from as any).mockReturnValue({ insert: mockInsert })

    await expect(createNewConversation(WALLET)).rejects.toThrow('Failed to create new conversation')
  })
})

describe('saveMessages', () => {
  it('应成功保存消息', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null })
    const mockFrom = vi.fn(() => ({ upsert: mockUpsert }))

    const { supabase } = await import('./client')
    ;(supabase.from as any).mockReturnValue({ upsert: mockUpsert })

    const messages: Message[] = [
      { id: 'msg-1', role: 'user', content: 'Hello', timestamp: 1000 },
      { id: 'msg-2', role: 'assistant', content: 'Hi', timestamp: 2000 },
    ]

    await saveMessages('conv-1', messages)

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 'msg-1', conversation_id: 'conv-1', role: 'user' }),
        expect.objectContaining({ id: 'msg-2', conversation_id: 'conv-1', role: 'assistant' }),
      ]),
      expect.objectContaining({ onConflict: 'id' })
    )
  })

  it('保存失败时应抛出错误', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: { message: 'DB error' } })

    const { supabase } = await import('./client')
    ;(supabase.from as any).mockReturnValue({ upsert: mockUpsert })

    await expect(saveMessages('conv-1', [])).rejects.toThrow('Failed to save messages')
  })
})

describe('loadMessages', () => {
  it('应加载消息（不含转账卡片）', async () => {
    const mockOrder = vi.fn().mockResolvedValue({
      error: null,
      data: [
        { id: 'msg-1', role: 'user', content: 'Hello', created_at: '2024-01-01T00:00:00Z', metadata: { timestamp: 1000 } },
      ],
    })
    const mockEq = vi.fn(() => ({ order: mockOrder }))
    const mockSelect = vi.fn(() => ({ eq: mockEq }))

    // 第二个查询（transfer_cards）返回空
    const mockTransferEq = vi.fn().mockResolvedValue({ data: [], error: null })
    const mockTransferSelect = vi.fn(() => ({ eq: mockTransferEq }))

    let callCount = 0
    const { supabase } = await import('./client')
    ;(supabase.from as any).mockReset()
    ;(supabase.from as any).mockImplementation((table: string) => {
      callCount++
      if (table === 'messages') return { select: mockSelect }
      if (table === 'transfer_cards') return { select: mockTransferSelect }
      return {}
    })

    const messages = await loadMessages('conv-1')
    expect(messages.length).toBe(1)
    expect(messages[0].id).toBe('msg-1')
    expect(messages[0].role).toBe('user')
    expect(messages[0].content).toBe('Hello')
    expect(messages[0].transferData).toBeUndefined()
  })

  it('应加载消息并附加转账卡片', async () => {
    const mockOrder = vi.fn().mockResolvedValue({
      error: null,
      data: [
        { id: 'msg-1', role: 'user', content: 'Send USDT', created_at: '2024-01-01T00:00:00Z', metadata: { timestamp: 1000 } },
      ],
    })
    const mockEq = vi.fn(() => ({ order: mockOrder }))
    const mockSelect = vi.fn(() => ({ eq: mockEq }))

    // transfer_cards 查询返回数据
    const mockTransferEq = vi.fn().mockResolvedValue({
      data: [
        { id: 'card-1', message_id: 'msg-1', from_address: '0xfrom', to_address: '0xto',
          token_symbol: 'USDT', amount: '100', chain: 'ethereum', status: 'confirmed',
          tx_hash: '0xtx', error_message: null },
      ],
      error: null,
    })
    const mockTransferSelect = vi.fn(() => ({ eq: mockTransferEq }))

    let callCount = 0
    const { supabase } = await import('./client')
    ;(supabase.from as any).mockReset()
    ;(supabase.from as any).mockImplementation((table: string) => {
      callCount++
      if (table === 'messages') return { select: mockSelect }
      if (table === 'transfer_cards') return { select: mockTransferSelect }
      return {}
    })

    const messages = await loadMessages('conv-1')
    expect(messages.length).toBe(1)
    expect(messages[0].transferData).toBeDefined()
    expect(messages[0].transferData!.tokenSymbol).toBe('USDT')
    expect(messages[0].transferData!.txHash).toBe('0xtx')
  })

  it('消息查询失败时应抛出错误', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ error: { message: 'DB error' }, data: null })
    const mockEq = vi.fn(() => ({ order: mockOrder }))
    const mockSelect = vi.fn(() => ({ eq: mockEq }))

    const { supabase } = await import('./client')
    ;(supabase.from as any).mockReturnValue({ select: mockSelect })

    await expect(loadMessages('conv-1')).rejects.toThrow('Failed to load messages')
  })
})

describe('getConversations', () => {
  beforeEach(() => {
    mockWalletContext.setContext(WALLET)
  })

  it('应返回对话列表及消息数量', async () => {
    // conversations 查询: select(...).eq(...).order(...).limit(100)
    const mockConvLimit = vi.fn().mockResolvedValue({
      error: null,
      data: [
        { id: 'conv-1', title: 'Chat 1', updated_at: '2024-01-01T00:00:00Z' },
      ],
    })
    const mockConvOrder = vi.fn(() => ({ limit: mockConvLimit }))
    const mockConvEq = vi.fn(() => ({ order: mockConvOrder }))
    const mockConvSelect = vi.fn(() => ({ eq: mockConvEq }))

    // messages count 查询: select('*', { count: 'exact', head: true }).eq('conversation_id', conv.id)
    const mockMsgEq = vi.fn().mockResolvedValue({ count: 5, error: null })
    const mockMsgSelect = vi.fn(() => ({ eq: mockMsgEq }))

    let callCount = 0
    const { supabase } = await import('./client')
    ;(supabase.from as any).mockReset()
    ;(supabase.from as any).mockImplementation((table: string) => {
      callCount++
      if (table === 'conversations') return { select: mockConvSelect }
      if (table === 'messages') return { select: mockMsgSelect }
      return {}
    })

    const summaries = await getConversations(WALLET)
    expect(summaries.length).toBe(1)
    expect(summaries[0].id).toBe('conv-1')
    expect(summaries[0].message_count).toBe(5)
  })

  it('对话列表为空时应返回空数组', async () => {
    const mockConvLimit = vi.fn().mockResolvedValue({ error: null, data: [] })
    const mockConvOrder = vi.fn(() => ({ limit: mockConvLimit }))
    const mockConvEq = vi.fn(() => ({ order: mockConvOrder }))
    const mockConvSelect = vi.fn(() => ({ eq: mockConvEq }))

    const { supabase } = await import('./client')
    ;(supabase.from as any).mockReturnValue({ select: mockConvSelect })

    const summaries = await getConversations(WALLET)
    expect(summaries).toEqual([])
  })

  it('对话查询失败时应抛出错误', async () => {
    const mockConvLimit = vi.fn().mockResolvedValue({ error: { message: 'Error' }, data: null })
    const mockConvOrder = vi.fn(() => ({ limit: mockConvLimit }))
    const mockConvEq = vi.fn(() => ({ order: mockConvOrder }))
    const mockConvSelect = vi.fn(() => ({ eq: mockConvEq }))

    const { supabase } = await import('./client')
    ;(supabase.from as any).mockReturnValue({ select: mockConvSelect })

    await expect(getConversations(WALLET)).rejects.toThrow('Failed to get conversations')
  })
})

describe('updateConversationTitle', () => {
  it('应成功更新标题', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null })
    const mockUpdate = vi.fn(() => ({ eq: mockEq }))

    const { supabase } = await import('./client')
    ;(supabase.from as any).mockReturnValue({ update: mockUpdate })

    await updateConversationTitle('conv-1', 'New Title')
    expect(supabase.from).toHaveBeenCalledWith('conversations')
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'New Title' })
    )
  })

  it('更新失败时应抛出错误', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: { message: 'DB error' } })
    const mockUpdate = vi.fn(() => ({ eq: mockEq }))

    const { supabase } = await import('./client')
    ;(supabase.from as any).mockReturnValue({ update: mockUpdate })

    await expect(updateConversationTitle('conv-1', 'Title')).rejects.toThrow('Failed to update conversation title')
  })
})

describe('deleteConversation', () => {
  beforeEach(() => {
    mockWalletContext.setContext(WALLET)
  })

  it('应成功删除对话及其消息', async () => {
    // verify: select wallet_address
    const mockSingle = vi.fn().mockResolvedValue({ data: { wallet_address: WALLET }, error: null })
    const mockVerifyEq = vi.fn(() => ({ single: mockSingle }))
    const mockVerifySelect = vi.fn(() => ({ eq: mockVerifyEq }))

    // delete messages
    const mockMsgDeleteEq = vi.fn().mockResolvedValue({ error: null })
    const mockMsgDelete = vi.fn(() => ({ eq: mockMsgDeleteEq }))

    // delete conversation
    const mockConvDeleteEq = vi.fn().mockResolvedValue({ error: null })
    const mockConvDelete = vi.fn(() => ({ eq: mockConvDeleteEq }))

    let callCount = 0
    const { supabase } = await import('./client')
    ;(supabase.from as any).mockReset()
    ;(supabase.from as any).mockImplementation((table: string) => {
      callCount++
      if (callCount === 1) {
        // conversations select (verify ownership)
        return { select: mockVerifySelect }
      }
      if (callCount === 2) {
        // messages delete
        return { delete: mockMsgDelete }
      }
      // conversations delete
      return { delete: mockConvDelete }
    })

    await deleteConversation('conv-1', WALLET)
    expect(mockSingle).toHaveBeenCalled()
    expect(mockConvDelete).toHaveBeenCalled()
  })

  it('对话不存在时应抛出错误', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
    const mockEq = vi.fn(() => ({ single: mockSingle }))
    const mockSelect = vi.fn(() => ({ eq: mockEq }))

    const { supabase } = await import('./client')
    ;(supabase.from as any).mockReturnValue({ select: mockSelect })

    await expect(deleteConversation('conv-nonexist', WALLET)).rejects.toThrow('Conversation not found')
  })

  it('对话不属于当前钱包时应抛出错误', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: { wallet_address: '0xother' }, error: null })
    const mockEq = vi.fn(() => ({ single: mockSingle }))
    const mockSelect = vi.fn(() => ({ eq: mockEq }))

    const { supabase } = await import('./client')
    ;(supabase.from as any).mockReturnValue({ select: mockSelect })

    await expect(deleteConversation('conv-1', WALLET)).rejects.toThrow('Unauthorized')
  })
})
