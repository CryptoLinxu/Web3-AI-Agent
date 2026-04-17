'use client'

import { Message } from '@/types/chat'

interface MessageItemProps {
  message: Message
}

export default function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user'
  const isError = message.isError

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-primary-600 text-white'
            : isError
            ? 'bg-red-900/50 border border-red-700 text-red-100'
            : 'bg-crypto-card border border-crypto-border text-gray-100'
        }`}
      >
        {/* 消息头部 */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium opacity-70">
            {isUser ? '你' : 'Web3 AI Agent'}
          </span>
          <span className="text-xs opacity-50">
            {formatTime(message.timestamp)}
          </span>
        </div>

        {/* 消息内容 */}
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content}
        </div>

        {/* 工具调用展示 */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.toolCalls.map((toolCall) => (
              <div
                key={toolCall.id}
                className="bg-black/30 rounded-md p-2 text-xs"
              >
                <div className="flex items-center gap-2 text-primary-400 mb-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="font-medium">{toolCall.name}</span>
                </div>
                {toolCall.result !== undefined && (
                  <pre className="text-gray-400 overflow-x-auto">
                    {typeof toolCall.result === 'string' 
                      ? toolCall.result 
                      : JSON.stringify(toolCall.result, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
