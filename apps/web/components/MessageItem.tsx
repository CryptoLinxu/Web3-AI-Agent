'use client'

import { Message } from '@/types/chat'
import { ToolCallUIState } from '@/types/stream'
import MarkdownRenderer from './MarkdownRenderer'

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

  // 工具调用状态
  const displayToolCalls = streamingToolCalls || message.toolCalls || []

  // 工具名称映射
  const toolNameMap: Record<string, string> = {
    getTokenPrice: '价格查询',
    getBalance: '余额查询',
    getGasPrice: 'Gas 查询',
    getTokenInfo: 'Token 查询',
    getETHPrice: 'ETH 价格',
    getBTCPrice: 'BTC 价格',
    getWalletBalance: '钱包余额',
    getEthGasPrice: 'Gas 价格',
  }

  const getToolDisplayName = (name: string) => toolNameMap[name] || name

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}>
      {/* AI Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 mr-3 mt-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
      )}

      <div className={`max-w-[80%] ${isUser ? '' : ''}`}>
        {/* 消息头部 */}
        <div className={`flex items-center gap-2 mb-1.5 ${isUser ? 'justify-end' : ''}`}>
          <span className={`text-xs font-medium ${isUser ? 'text-primary-400' : 'text-gray-400'}`}>
            {isUser ? '你' : 'Web3 AI'}
          </span>
          <span className="text-xs text-gray-500">
            {formatTime(message.timestamp)}
          </span>
        </div>

        {/* 消息气泡 */}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-br-md shadow-lg shadow-primary-600/20'
              : isError
              ? 'bg-red-900/30 border border-red-800/50 text-red-100 rounded-bl-md'
              : 'bg-white/[0.04] border border-white/[0.06] text-gray-100 rounded-bl-md backdrop-blur-sm'
          }`}
        >
          {/* 消息内容 */}
          <div className="text-sm leading-relaxed">
            {isUser ? (
              <div className="whitespace-pre-wrap">{message.content}</div>
            ) : (
              <MarkdownRenderer content={message.content} />
            )}
            {isStreaming && (
              <span className="inline-block w-2 h-5 ml-0.5 bg-primary-400 animate-pulse rounded-sm" />
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
                    className={`rounded-xl p-3 text-xs border ${
                      isRunning
                        ? 'bg-primary-500/5 border-primary-500/20'
                        : 'bg-white/[0.02] border-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      {isRunning ? (
                        <div className="w-4 h-4 rounded-full border-2 border-primary-400 border-t-transparent animate-spin" />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      <span className="font-semibold text-primary-400">
                        {getToolDisplayName(toolCall.name)}
                      </span>
                      <span className="text-gray-500 font-mono text-[10px]">#{toolCall.name}</span>
                      {isRunning && (
                        <span className="ml-auto text-primary-400/70 animate-pulse">执行中...</span>
                      )}
                      {isDone && (
                        <span className="ml-auto text-green-400/70">完成</span>
                      )}
                    </div>
                    {toolCall.result !== undefined && (
                      <div className="mt-1.5 pl-6 text-gray-400 font-mono text-[11px] leading-relaxed overflow-x-auto">
                        {typeof toolCall.result === 'string'
                          ? toolCall.result
                          : JSON.stringify(toolCall.result, null, 2)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0 ml-3 mt-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}
