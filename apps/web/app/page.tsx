'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount, useChainId } from 'wagmi'
import ChatInput from '@/components/ChatInput'
import MessageList from '@/components/MessageList'
import SettingsPanel from '@/components/SettingsPanel'
import WalletConnectButton from '@/components/WalletConnectButton'
import ConversationHistory from '@/components/ConversationHistory'
import { Message } from '@/types/chat'
import { useChatStream } from '@/hooks/useChatStream'
import { SummaryCompressionMemory } from '@/lib/memory/SummaryCompressionMemory'
import { SlidingWindowMemory } from '@/lib/memory/SlidingWindowMemory'
import type { MemoryManager } from '@/lib/memory/types'
import * as conversationService from '@/lib/supabase/conversations'
import { setWalletContext, clearWalletContext } from '@/lib/supabase/client'
import { supabase } from '@/lib/supabase/client'

type MemoryStrategy = 'l3-compression' | 'l2-sliding-window'

const WELCOME_CONTENT = `你好！我是 **Web3 AI Agent** 🌐

我可以帮你查询以下信息：

- **价格查询**：ETH、BTC、SOL、MATIC、BNB 实时价格
- **余额查询**：Ethereum、Polygon、BSC、Bitcoin、Solana 链上余额
- **Gas 查询**：EVM 链 Gas 费用
- **Token 查询**：主流 Token 合约地址和元数据

试试问我："ETH 现在多少钱？"`

export default function Home() {
  // 钱包状态
  const { address, isConnected } = useAccount()
  const chainId = useChainId() // 获取当前链 ID

  // Supabase 同步状态
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: WELCOME_CONTENT,
      timestamp: Date.now(),
    },
  ])

  // Memory 策略管理
  const [memoryStrategy, setMemoryStrategy] = useState<MemoryStrategy>('l3-compression')
  const [memoryManager, setMemoryManager] = useState<MemoryManager>(() => new SummaryCompressionMemory())

  // Settings 面板
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)

  const {
    isStreaming,
    content: streamingContent,
    error: streamError,
    sendMessage,
  } = useChatStream()

  // 切换 Memory 策略
  const handleMemoryStrategyChange = useCallback((strategy: MemoryStrategy) => {
    setMemoryStrategy(strategy)
    if (strategy === 'l3-compression') {
      setMemoryManager(new SummaryCompressionMemory())
    } else {
      setMemoryManager(new SlidingWindowMemory())
    }
  }, [])

  // 钱包连接时加载历史
  useEffect(() => {
    if (isConnected && address) {
      setWalletContext(address)
      loadConversationHistory(address)
    } else if (!isConnected) {
      setConversationId(null)
      clearWalletContext()
      memoryManager.clear()
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: WELCOME_CONTENT,
          timestamp: Date.now(),
        },
      ])
    }
  }, [isConnected, address])

  const loadConversationHistory = async (walletAddress: string) => {
    try {
      setIsSyncing(true)
      
      // 只查询最新对话，不创建
      const convId = await conversationService.getLatestConversation(walletAddress)
      
      if (convId) {
        // 有历史对话，加载
        setConversationId(convId)
        const historyMessages = await conversationService.loadMessages(convId)

        if (historyMessages.length > 0) {
          memoryManager.clear()
          historyMessages.forEach(msg => memoryManager.addMessage(msg))
          setMessages(historyMessages)
        } else {
          // 对话存在但无消息，显示欢迎页
          setMessages([
            {
              id: 'welcome',
              role: 'assistant',
              content: WELCOME_CONTENT,
              timestamp: Date.now(),
            },
          ])
        }
      } else {
        // 无历史对话，不创建，conversationId 保持 null
        setConversationId(null)
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: WELCOME_CONTENT,
            timestamp: Date.now(),
          },
        ])
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error)
      setConversationId(null)
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: WELCOME_CONTENT,
          timestamp: Date.now(),
        },
      ])
    } finally {
      setIsSyncing(false)
    }
  }

  const saveMessagesToCloud = useCallback(async (msgs: Message[]) => {
    if (!conversationId || !isConnected) return

    try {
      await conversationService.saveMessages(conversationId, msgs)

      if (address) {
        const transferMessages = msgs.filter(m => m.transferData && m.role === 'assistant')

        for (const msg of transferMessages) {
          if (msg.transferData) {
            try {
              const { createTransferCard } = await import('@/lib/supabase/transfers')
              const cardId = await createTransferCard({
                conversationId,
                messageId: msg.id,
                fromAddress: msg.transferData!.from,
                toAddress: msg.transferData!.to,
                tokenSymbol: msg.transferData!.tokenSymbol,
                tokenAddress: msg.transferData!.tokenAddress,
                amount: msg.transferData!.amount,
                chain: msg.transferData!.chain
              })
            } catch (err) {
              console.error('Failed to save transfer card:', err)
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to save messages to cloud:', error)
    }
  }, [conversationId, isConnected, address])

  const handleNewConversation = async () => {
    if (!isConnected || !address) return

    try {
      setIsSyncing(true)
      const newConvId = await conversationService.createNewConversation(address)
      setConversationId(newConvId)

      memoryManager.clear()
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: WELCOME_CONTENT,
          timestamp: Date.now(),
        },
      ])

      window.dispatchEvent(new CustomEvent('conversation-created', {
        detail: {
          id: newConvId,
          title: '新对话',
          updated_at: new Date().toISOString(),
          message_count: 0,
        }
      }))
    } catch (error) {
      console.error('Failed to create new conversation:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleSelectConversation = (id: string, loadedMessages: Message[]) => {
    setConversationId(id || null) // 空字符串转为 null
    memoryManager.clear()

    if (loadedMessages.length > 0) {
      loadedMessages.forEach(msg => memoryManager.addMessage(msg))
      setMessages(loadedMessages)
    } else {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: WELCOME_CONTENT,
          timestamp: Date.now(),
        },
      ])
    }
  }

  useEffect(() => {
    if (streamingMessageId && isStreaming) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamingMessageId ? { ...m, content: streamingContent } : m
        )
      )
    }
  }, [streamingContent, streamingMessageId, isStreaming])

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
    }
    memoryManager.addMessage(userMessage)

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    const isFirstMessage = messages.length <= 1 ||
      (messages.length === 2 && messages[0]?.id === 'welcome')

    // 用于保存消息的 conversationId（可能是新创建的）
    let activeConvId = conversationId

    // 如果是首次对话且 conversationId 为空，先创建对话
    if (isFirstMessage && !conversationId && isConnected && address) {
      try {
        const title = conversationService.generateConversationTitle(content)
        const newConvId = await conversationService.createNewConversation(address, title)
        setConversationId(newConvId)
        activeConvId = newConvId // 直接使用新创建的 ID
        
        // 通知历史列表更新
        window.dispatchEvent(new CustomEvent('conversation-created', {
          detail: {
            id: newConvId,
            title,
            updated_at: new Date().toISOString(),
            message_count: 1,
          }
        }))
      } catch (error) {
        console.error('Failed to create conversation:', error)
        // 创建失败不阻断对话，只是不保存
      }
    }

    // 更新标题逻辑（只在已有 conversationId 时）
    if (isFirstMessage && activeConvId && isConnected) {
      try {
        const title = conversationService.generateConversationTitle(content)
        await conversationService.updateConversationTitle(activeConvId, title)
        window.dispatchEvent(new CustomEvent('conversation-title-updated', {
          detail: { id: activeConvId, title }
        }))
      } catch (error) {
        console.error('Failed to update conversation title:', error)
      }
    }

    const assistantMessageId = (Date.now() + 1).toString()
    setStreamingMessageId(assistantMessageId)
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      },
    ])

    try {
      const contextMessages = memoryManager.getMessages()

      const result = await sendMessage(
        contextMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        isConnected && address ? address : undefined,
        chainId  // 传递当前链 ID
      )

      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: result.content,
        timestamp: Date.now(),
        toolCalls: result.toolCalls.length > 0
          ? result.toolCalls.map((tc) => ({
              id: tc.id,
              name: tc.name,
              arguments: tc.arguments,
              result: tc.result,
            }))
          : undefined,
        transferData: result.transferData ? {
          ...result.transferData,
          id: assistantMessageId,
          status: result.transferData.status || 'pending',
        } : undefined,
      }

      memoryManager.addMessage(assistantMessage)

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId ? assistantMessage : m
        )
      )

      // 使用 activeConvId 确保消息保存到正确的对话
      if (activeConvId && isConnected) {
        const allMessages = memoryManager.getMessages()
        try {
          await conversationService.saveMessages(activeConvId, allMessages)

          if (address) {
            const transferMessages = allMessages.filter(m => m.transferData && m.role === 'assistant')

            for (const msg of transferMessages) {
              if (msg.transferData) {
                try {
                  const { createTransferCard } = await import('@/lib/supabase/transfers')
                  const cardId = await createTransferCard({
                    conversationId: activeConvId,
                    messageId: msg.id,
                    fromAddress: msg.transferData!.from,
                    toAddress: msg.transferData!.to,
                    tokenSymbol: msg.transferData!.tokenSymbol,
                    tokenAddress: msg.transferData!.tokenAddress,
                    amount: msg.transferData!.amount,
                    chain: msg.transferData!.chain
                  })
                } catch (err) {
                  console.error('Failed to save transfer card:', err)
                }
              }
            }
          }
        } catch (error) {
          console.error('Failed to save messages to cloud:', error)
        }
      }
    } catch (error) {
      const errorMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: streamError || '抱歉，处理您的请求时出现了错误。请稍后重试。',
        timestamp: Date.now(),
        isError: true,
      }
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantMessageId ? errorMessage : m))
      )
    } finally {
      setIsLoading(false)
      setStreamingMessageId(null)
    }
  }

  return (
    <main className="flex min-h-screen relative overflow-hidden text-[rgb(var(--text-primary))]">
      {/* ===== 背景装饰：浮动光球 + 扫描线 ===== */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* 浮动光球 */}
        <div
          className="absolute top-[-15%] left-[10%] w-[520px] h-[520px] rounded-full blur-3xl opacity-60 animate-float"
          style={{ background: 'radial-gradient(circle, rgba(var(--accent-cyan), 0.22), transparent 70%)' }}
        />
        <div
          className="absolute bottom-[-10%] right-[5%] w-[600px] h-[600px] rounded-full blur-3xl opacity-50 animate-float-slow"
          style={{ background: 'radial-gradient(circle, rgba(var(--accent-violet), 0.25), transparent 70%)' }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-[360px] h-[360px] rounded-full blur-3xl opacity-40 animate-pulse-glow"
          style={{ background: 'radial-gradient(circle, rgba(var(--accent-cyan), 0.15), transparent 70%)' }}
        />
        {/* 顶部扫描线 */}
        <div
          className="absolute top-0 left-0 right-0 h-px opacity-70"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(var(--accent-cyan), 0.6), rgba(var(--accent-violet), 0.6), transparent)',
          }}
        />
      </div>

      {/* ===== 侧边栏 ===== */}
      <ConversationHistory
        activeConversationId={conversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
      />

      {/* ===== 主内容 ===== */}
      <div className="relative z-10 flex-1 flex flex-col h-screen">
        {/* Header - 玻璃拟态 + 渐变品牌 */}
        <header className="relative flex items-center justify-between px-6 py-4 glass-panel border-b border-[rgba(var(--border-color))] sticky top-0 z-20">
          {/* 底部渐变线 */}
          <div
            className="absolute bottom-0 left-0 right-0 h-px opacity-50"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(var(--accent-cyan), 0.5), rgba(var(--accent-violet), 0.5), transparent)',
            }}
          />

          {/* 左侧：品牌 */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-brand rounded-xl blur-md opacity-60 animate-pulse-glow" />
              <div className="relative w-11 h-11 rounded-xl bg-gradient-brand flex items-center justify-center shadow-neon">
                <svg className="w-5 h-5 text-white drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[17px] font-bold tracking-tight text-gradient">
                  Quantum Nexus
                </h1>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md font-mono font-semibold uppercase tracking-widest bg-gradient-brand-soft text-[rgb(var(--accent-violet))] border border-[rgba(var(--accent-violet),0.3)]">
                  AI · Web3
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="relative flex items-center justify-center w-2 h-2">
                  <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-60 animate-ping" />
                  <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </span>
                <span className="text-[11px] text-[rgb(var(--text-muted))] font-medium">
                  5 Chains · 11 Tokens · Online
                </span>
              </div>
            </div>
          </div>

          {/* 右侧：策略指示器 + 钱包 + 设置 */}
          <div className="flex items-center gap-2.5">
            {/* Memory 策略胶囊 */}
            <div className="hidden sm:flex items-center gap-2 h-9 px-3.5 rounded-xl glass-subtle border border-[rgba(var(--border-color))] hover:border-[rgba(var(--accent-cyan),0.4)] transition-all duration-300 group cursor-default">
              <svg className="w-3.5 h-3.5 text-[rgb(var(--accent-cyan))] group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="text-[11px] font-semibold tracking-wide text-[rgb(var(--text-secondary))]">
                {memoryStrategy === 'l3-compression' ? 'L3 · SUMMARY' : 'L2 · WINDOW'}
              </span>
            </div>

            {/* 钱包连接按钮 */}
            <WalletConnectButton />

            {/* 设置按钮 */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="btn-ghost w-9 h-9 !p-0 relative group"
              title="设置"
              aria-label="打开设置"
            >
              <svg className="w-[18px] h-[18px] group-hover:rotate-90 transition-transform duration-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </header>

        {/* Message List */}
        <div className="flex-1 overflow-hidden relative">
          <MessageList
            messages={messages}
            isLoading={isLoading}
            streamingMessageId={streamingMessageId}
            isStreaming={isStreaming}
            conversationId={conversationId || undefined}
          />
        </div>

        {/* Input */}
        <div className="px-4 sm:px-8 lg:px-[10%] py-4 pb-5">
          <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>

      {/* ===== Settings Panel ===== */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        memoryStrategy={memoryStrategy}
        onMemoryStrategyChange={handleMemoryStrategyChange}
      />
    </main>
  )
}
