'use client'

import { useState } from 'react'
import ChatInput from '@/components/ChatInput'
import MessageList from '@/components/MessageList'
import { Message } from '@/types/chat'

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '你好！我是 Web3 AI Agent，可以帮你查询 ETH 价格、钱包余额、Gas 价格等信息。请问有什么可以帮你的？',
      timestamp: Date.now(),
    },
  ])
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async (content: string) => {
    // 添加用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
    }
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      // 调用 API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error('请求失败')
      }

      const data = await response.json()
      
      // 添加助手回复
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        timestamp: Date.now(),
        toolCalls: data.toolCalls,
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      // 添加错误消息
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，处理您的请求时出现了错误。请稍后重试。',
        timestamp: Date.now(),
        isError: true,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8">
      <div className="w-full max-w-4xl flex flex-col h-[calc(100vh-4rem)]">
        {/* Header */}
        <header className="flex items-center justify-between py-4 border-b border-crypto-border">
          <div>
            <h1 className="text-2xl font-bold text-white">Web3 AI Agent</h1>
            <p className="text-sm text-gray-400">MVP 版本 - 支持 ETH 价格、余额、Gas 查询</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm text-gray-400">在线</span>
          </div>
        </header>

        {/* Message List */}
        <div className="flex-1 overflow-hidden py-4">
          <MessageList messages={messages} isLoading={isLoading} />
        </div>

        {/* Input */}
        <div className="py-4 border-t border-crypto-border">
          <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
        </div>

        {/* Disclaimer */}
        <footer className="py-2 text-center text-xs text-gray-500">
          本工具仅供信息查询，不构成投资建议。请自行验证所有数据。
        </footer>
      </div>
    </main>
  )
}
