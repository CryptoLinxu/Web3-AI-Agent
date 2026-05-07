'use client'

import { Message } from '@/types/chat'
import { ToolCallUIState } from '@/types/stream'
import MarkdownRenderer from './MarkdownRenderer'
import { TransferCard, SolanaTransferCard } from '@/components/cards'

interface MessageItemProps {
  message: Message
  isStreaming?: boolean
  toolCalls?: ToolCallUIState[]
  conversationId?: string
}

export default function MessageItem({ message, isStreaming, toolCalls: streamingToolCalls, conversationId }: MessageItemProps) {
  const isUser = message.role === 'user'
  const isError = message.isError

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const displayToolCalls = streamingToolCalls || message.toolCalls || []

  const toolNameMap: Record<string, string> = {
    getTokenPrice: '价格查询',
    getBalance: '余额查询',
    getGasPrice: 'Gas 查询',
    getTokenInfo: 'Token 查询',
    getETHPrice: 'ETH 价格',
    getBTCPrice: 'BTC 价格',
    getWalletBalance: '钱包余额',
    getEthGasPrice: 'Gas 价格',
    createTransferCard: '转账卡片',
  }

  const getToolDisplayName = (name: string) => toolNameMap[name] || name

  // AI 头像 - 带外发光
  const AIAvatar = ({ small = false }: { small?: boolean }) => (
    <div className={`relative flex-shrink-0 ${small ? 'w-8 h-8' : 'w-9 h-9'}`}>
      <div className="absolute inset-0 bg-gradient-brand rounded-xl blur-md opacity-60" />
      <div className="relative w-full h-full rounded-xl bg-gradient-brand flex items-center justify-center shadow-neon">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
    </div>
  )

  // 转账卡片消息
  if (message.transferData) {
    // 根据 chain 字段选择对应的卡片组件
    const isSolana = message.transferData.chain === 'solana'
    const CardComponent = isSolana ? SolanaTransferCard : TransferCard

    return (
      <div className="flex justify-start group animate-slide-up">
        <div className="mr-3 mt-1">
          <AIAvatar small />
        </div>

        <div className="max-w-[80%] min-w-[300px]">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold text-gradient tracking-wide">
              Quantum AI
            </span>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-mono">
              {formatTime(message.timestamp)}
            </span>
          </div>

          <CardComponent
            data={message.transferData}
            conversationId={conversationId}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} group animate-slide-up`}>
      {!isUser && (
        <div className="mr-3 mt-1">
          <AIAvatar />
        </div>
      )}

      <div className="max-w-[80%]">
        {/* 消息头部 */}
        <div className={`flex items-center gap-2 mb-1.5 ${isUser ? 'justify-end' : ''}`}>
          <span
            className={`text-[11px] font-bold tracking-wide ${
              isUser ? 'text-[rgb(var(--accent-violet))]' : 'text-gradient'
            }`}
          >
            {isUser ? 'You' : 'Quantum AI'}
          </span>
          <span className="text-[10px] text-[rgb(var(--text-muted))] font-mono">
            {formatTime(message.timestamp)}
          </span>
        </div>

        {/* 消息气泡 */}
        <div
          className={`relative rounded-2xl px-4 py-3 transition-all duration-300 ${
            isUser
              ? 'bg-gradient-to-br from-[rgba(var(--accent-violet),0.18)] to-[rgba(var(--accent-cyan),0.12)] border border-[rgba(var(--accent-violet),0.25)] text-[rgb(var(--text-primary))] rounded-br-sm hover:border-[rgba(var(--accent-violet),0.4)] hover:shadow-glow-violet'
              : isError
              ? 'bg-[rgba(var(--danger),0.08)] border border-[rgba(var(--danger),0.3)] text-[rgb(var(--danger))] rounded-bl-sm'
              : 'glass-panel border border-[rgba(var(--border-color))] text-[rgb(var(--text-primary))] rounded-bl-sm hover:border-[rgba(var(--accent-cyan),0.25)] hover:shadow-glow-cyan'
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
              <span className="streaming-cursor" />
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
                    className={`tool-call-card rounded-xl p-3 text-xs border transition-all duration-300 ${
                      isRunning
                        ? 'bg-[rgba(var(--accent-cyan),0.08)] border-[rgba(var(--accent-cyan),0.35)]'
                        : 'bg-[rgba(var(--bg-surface),0.5)] border-[rgba(var(--border-color))] hover:border-[rgba(var(--accent-violet),0.35)]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isRunning ? (
                        <div className="relative w-4 h-4">
                          <div className="absolute inset-0 rounded-full border-2 border-[rgba(var(--accent-cyan),0.25)]" />
                          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[rgb(var(--accent-cyan))] animate-spin" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-[rgba(var(--success),0.2)] flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-[rgb(var(--success))]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      <span className="font-bold text-[rgb(var(--accent-cyan))] text-xs">
                        {getToolDisplayName(toolCall.name)}
                      </span>
                      <span className="text-[rgb(var(--text-muted))] font-mono text-[10px]">
                        #{toolCall.name}
                      </span>
                      {isRunning && (
                        <span className="ml-auto text-[rgb(var(--accent-cyan))] text-[10px] animate-pulse font-mono uppercase tracking-wider">
                          running
                        </span>
                      )}
                      {isDone && (
                        <span className="ml-auto text-[rgb(var(--success))] text-[10px] font-mono uppercase tracking-wider">
                          done
                        </span>
                      )}
                    </div>
                    {toolCall.result !== undefined && (
                      <div className="mt-2 pl-6 text-[rgb(var(--text-muted))] font-mono text-[11px] leading-relaxed overflow-x-auto">
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

      {/* User 头像 */}
      {isUser && (
        <div className="ml-3 mt-1 flex-shrink-0">
          <div className="relative w-9 h-9">
            <div
              className="absolute inset-0 rounded-xl blur-md opacity-50"
              style={{
                background:
                  'linear-gradient(135deg, rgb(var(--user-avatar-from)), rgb(var(--user-avatar-to)))',
              }}
            />
            <div
              className="relative w-full h-full rounded-xl flex items-center justify-center shadow-glow-violet"
              style={{
                background:
                  'linear-gradient(135deg, rgb(var(--user-avatar-from)), rgb(var(--user-avatar-to)))',
              }}
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
