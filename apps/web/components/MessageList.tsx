'use client'

import { useRef, useEffect } from 'react'
import { Message } from '@/types/chat'
import { ToolCallUIState } from '@/types/stream'
import MessageItem from './MessageItem'

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
  streamingMessageId?: string | null
  isStreaming?: boolean
  streamingToolCalls?: ToolCallUIState[]
  conversationId?: string
}

export default function MessageList({
  messages,
  isLoading,
  streamingMessageId,
  isStreaming,
  streamingToolCalls,
  conversationId
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto"
    >
      <div className="px-4 sm:px-8 lg:px-[10%] py-6 space-y-5">
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            isStreaming={isStreaming && message.id === streamingMessageId}
            toolCalls={message.id === streamingMessageId ? streamingToolCalls : undefined}
            conversationId={conversationId}
          />
        ))}

        {isLoading && (
          <div className="flex items-center gap-3 pl-12 py-2 animate-slide-up">
            <div className="flex gap-1.5">
              <span
                className="w-2 h-2 rounded-full bg-gradient-brand animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <span
                className="w-2 h-2 rounded-full bg-gradient-brand animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <span
                className="w-2 h-2 rounded-full bg-gradient-brand animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </div>
            <span className="text-xs text-[rgb(var(--text-muted))] font-mono uppercase tracking-wider">
              AI thinking…
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
