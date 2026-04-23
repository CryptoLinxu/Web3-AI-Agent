'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
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

type MemoryStrategy = 'l3-compression' | 'l2-sliding-window'

export default function Home() {
  // 钱包状态
  const { address, isConnected } = useAccount()
  
  // Supabase 同步状态
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '你好！我是 **Web3 AI Agent** 🌐\n\n我可以帮你查询以下信息：\n\n- **价格查询**：ETH、BTC、SOL、MATIC、BNB 实时价格\n- **余额查询**：Ethereum、Polygon、BSC、Bitcoin、Solana 链上余额\n- **Gas 查询**：EVM 链 Gas 费用\n- **Token 查询**：主流 Token 合约地址和元数据\n\n试试问我：“ETH 现在多少钱？”',
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
      // 设置钱包上下文（用于 Supabase RLS）
      setWalletContext(address)
      loadConversationHistory(address)
    } else if (!isConnected) {
      // 断开连接时清空 UI，保留 Supabase 数据
      setConversationId(null)
      clearWalletContext()
      memoryManager.clear()  // 清空内存
      setMessages([  // 显示欢迎消息
        {
          id: 'welcome',
          role: 'assistant',
          content: '你好！我是 **Web3 AI Agent** 🌐\n\n我可以帮你查询以下信息：\n\n- **价格查询**：ETH、BTC、SOL、MATIC、BNB 实时价格\n- **余额查询**：Ethereum、Polygon、BSC、Bitcoin、Solana 链上余额\n- **Gas 查询**：EVM 链 Gas 费用\n- **Token 查询**：主流 Token 合约地址和元数据\n\n试试问我：“ETH 现在多少钱？”',
          timestamp: Date.now(),
        },
      ])
    }
  }, [isConnected, address])

  // 加载对话历史
  const loadConversationHistory = async (walletAddress: string) => {
    try {
      setIsSyncing(true)
      const convId = await conversationService.getOrCreateConversation(walletAddress)
      setConversationId(convId)

      // 加载历史消息
      const historyMessages = await conversationService.loadMessages(convId)
      
      if (historyMessages.length > 0) {
        // 有历史消息，加载到 MemoryManager
        memoryManager.clear()
        historyMessages.forEach(msg => memoryManager.addMessage(msg))
        setMessages(historyMessages)
      } else {
        // 无历史消息，保持欢迎消息
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: '你好！我是 **Web3 AI Agent** 🌐\n\n我可以帮你查询以下信息：\n\n- **价格查询**：ETH、BTC、SOL、MATIC、BNB 实时价格\n- **余额查询**：Ethereum、Polygon、BSC、Bitcoin、Solana 链上余额\n- **Gas 查询**：EVM 链 Gas 费用\n- **Token 查询**：主流 Token 合约地址和元数据\n\n试试问我：“ETH 现在多少钱？”',
            timestamp: Date.now(),
          },
        ])
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error)
      // 失败时保持当前状态
    } finally {
      setIsSyncing(false)
    }
  }

  // 保存消息到 Supabase（防抖）
  const saveMessagesToCloud = useCallback(async (msgs: Message[]) => {
    if (!conversationId || !isConnected) return

    try {
      await conversationService.saveMessages(conversationId, msgs)
    } catch (error) {
      console.error('Failed to save messages to cloud:', error)
      // TODO: 降级到 localStorage
    }
  }, [conversationId, isConnected])

  // 新建对话
  const handleNewConversation = async () => {
    if (!isConnected || !address) return
  
    try {
      setIsSyncing(true)
      // 创建真正的新对话（不是获取已有的）
      const newConvId = await conversationService.createNewConversation(address)
      setConversationId(newConvId)
        
      // 清空当前消息和内存
      memoryManager.clear()
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: '你好！我是 **Web3 AI Agent** 🌐\n\n我可以帮你查询以下信息：\n\n- **价格查询**：ETH、BTC、SOL、MATIC、BNB 实时价格\n- **余额查询**：Ethereum、Polygon、BSC、Bitcoin、Solana 链上余额\n- **Gas 查询**：EVM 链 Gas 费用\n- **Token 查询**：主流 Token 合约地址和元数据\n\n试试问我：“ETH 现在多少钱？”',
          timestamp: Date.now(),
        },
      ])
        
      // 通知侧边栏添加新对话（不重新加载整个列表）
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

  // 选择对话
  const handleSelectConversation = (id: string, loadedMessages: Message[]) => {
    setConversationId(id)
    if (loadedMessages.length > 0) {
      memoryManager.clear()
      loadedMessages.forEach(msg => memoryManager.addMessage(msg))
      setMessages(loadedMessages)
    }
  }

  // 实时更新流式消息内容
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

    // 如果是对话的第一条消息，自动生成标题
    const isFirstMessage = messages.length <= 1 || 
      (messages.length === 2 && messages[0]?.id === 'welcome')
    
    if (isFirstMessage && conversationId && isConnected) {
      try {
        const title = conversationService.generateConversationTitle(content)
        await conversationService.updateConversationTitle(conversationId, title)
        // 通知侧边栏更新标题
        window.dispatchEvent(new CustomEvent('conversation-title-updated', {
          detail: { id: conversationId, title }
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
        isConnected && address ? address : undefined // 注入钱包地址
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
      }
      memoryManager.addMessage(assistantMessage)

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId ? assistantMessage : m
        )
      )

      // 后台异步保存到 Supabase（不阻塞 UI）
      const allMessages = memoryManager.getMessages()
      saveMessagesToCloud(allMessages)
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
    <main className="flex min-h-screen relative overflow-hidden bg-[rgb(var(--background-start-rgb))] text-[rgb(var(--text-primary))] transition-colors duration-300">
      {/* 背景装饰 */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[rgba(var(--accent-color),0.03)] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/3 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[rgba(var(--accent-color),0.02)] rounded-full blur-3xl" />
      </div>

      {/* 侧边栏 */}
      <ConversationHistory
        activeConversationId={conversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
      />

      {/* 主内容 */}
      <div className="relative z-10 flex-1 flex flex-col h-screen">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-[rgb(var(--border-color))] bg-[rgb(var(--header-bg))]">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-[rgb(var(--text-primary))] tracking-tight">
                Web3 AI Agent
              </h1>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-xs text-[rgb(var(--text-muted))]">5 条链 · 5 种币 · 11 Token</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Memory 策略指示器 */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-color))] h-9">
              <svg className="w-3.5 h-3.5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="text-xs text-[rgb(var(--text-secondary))] font-medium">
                {memoryStrategy === 'l3-compression' ? 'L3 摘要' : 'L2 窗口'}
              </span>
            </div>

            {/* 钱包连接按钮 */}
            <WalletConnectButton />

            {/* Settings 按钮 */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-lg hover:bg-[rgba(var(--bg-tertiary))] transition-colors text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]"
              title="设置"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </header>

        {/* Message List */}
        <div className="flex-1 overflow-hidden">
          <MessageList
            messages={messages}
            isLoading={isLoading}
            streamingMessageId={streamingMessageId}
            isStreaming={isStreaming}
          />
        </div>

        {/* Input */}
        <div className="px-[10%] py-4">
          <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        memoryStrategy={memoryStrategy}
        onMemoryStrategyChange={handleMemoryStrategyChange}
      />
    </main>
  )
}
