'use client'

import { Message } from '@/types/chat'
import { ToolCallUIState } from '@/types/stream'

interface MessageItemProps {
  message: Message
  isStreaming?: boolean
  toolCalls?: ToolCallUIState[]
}

export default function MessageItem({ message, isStreaming, toolCalls: streamingToolCalls }: MessageItemProps) {
  const isUser = message.role === 'user'
  const isError = message.isError

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // 工具调用状态（优先使用流式工具调用）
  const displayToolCalls = streamingToolCalls || message.toolCalls || []

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
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-primary-400 animate-pulse" />
          )}
        </div>

        {/* 工具调用展示 */}
        {displayToolCalls.length > 0 && (
          <div className="mt-3 space-y-2">
            {displayToolCalls.map((toolCall) => {
              const isRunning = 'status' in toolCall && toolCall.status === 'running'
              const isDone = 'status' in toolCall && toolCall.status === 'done'
              
              return (
                <div
                  key={toolCall.id}
                  className="bg-black/30 rounded-md p-2 text-xs"
                >
                  <div className="flex items-center gap-2 text-primary-400 mb-1">
                    {isRunning ? (
                      <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    )}
                    <span className="font-medium">{toolCall.name}</span>
                    {isRunning && <span className="text-gray-400">正在执行...</span>}
                    {isDone && <span className="text-green-400">已完成</span>}
                  </div>
                  {toolCall.result !== undefined && (
                    <pre className="text-gray-400 overflow-x-auto">
                      {typeof toolCall.result === 'string' 
                        ? toolCall.result 
                        : JSON.stringify(toolCall.result, null, 2)}
                    </pre>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
