'use client'

import { useState, useEffect } from 'react'
import { useUnifiedWallet } from '@/hooks/useUnifiedWallet'
import * as conversationService from '@/lib/supabase/conversations'
import type { ConversationSummary } from '@/lib/supabase/conversations'
import { setWalletContext } from '@/lib/supabase/client'
import { ConfirmDialog } from './ConfirmDialog'

interface ConversationHistoryProps {
  activeConversationId: string | null
  onSelectConversation: (id: string, messages: any[]) => void
  onNewConversation: () => void
}

export default function ConversationHistory({
  activeConversationId,
  onSelectConversation,
  onNewConversation,
}: ConversationHistoryProps) {
  const { connected, address, chain } = useUnifiedWallet()
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (connected && address) {
      setWalletContext(address)
      loadConversations(address)
    } else {
      setConversations([])
    }
  }, [connected, address])

  useEffect(() => {
    const handleNewConversation = (event: Event) => {
      const customEvent = event as CustomEvent
      const newConv = customEvent.detail
      if (newConv) {
        setConversations((prev) => [newConv, ...prev])
      }
    }
    window.addEventListener('conversation-created', handleNewConversation)

    const handleTitleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent
      const { id, title } = customEvent.detail
      setConversations((prev) =>
        prev.map((conv) => (conv.id === id ? { ...conv, title } : conv))
      )
    }
    window.addEventListener('conversation-title-updated', handleTitleUpdate)

    return () => {
      window.removeEventListener('conversation-created', handleNewConversation)
      window.removeEventListener('conversation-title-updated', handleTitleUpdate)
    }
  }, [])

  const loadConversations = async (walletAddress: string) => {
    try {
      setIsLoading(true)
      const list = await conversationService.getConversations(walletAddress)
      setConversations(list)
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = async (id: string) => {
    if (!address) return
    try {
      setWalletContext(address)
      const messages = await conversationService.loadMessages(id)
      onSelectConversation(id, messages)
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setPendingDeleteId(id)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!pendingDeleteId || !address) return

    try {
      setIsDeleting(true)
      setWalletContext(address)

      const deleteRes = await fetch('/api/supabase/delete-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: pendingDeleteId,
          walletAddress: address,
        }),
      })

      const deleteData = await deleteRes.json()

      if (!deleteData.success) {
        throw new Error(deleteData.error || '删除对话失败')
      }

      setConversations((prev) => prev.filter((c) => c.id !== pendingDeleteId))

      if (activeConversationId === pendingDeleteId) {
        onSelectConversation('', [])
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    } finally {
      setIsDeleting(false)
      setPendingDeleteId(null)
      setShowDeleteDialog(false)
    }
  }

  const handleDeleteCancel = () => {
    setPendingDeleteId(null)
    setShowDeleteDialog(false)
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString('zh-CN')
  }

  if (!connected) return null

  return (
    <>
      {/* 移动端切换按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 bottom-20 z-50 lg:hidden w-12 h-12 rounded-full bg-gradient-brand text-white flex items-center justify-center shadow-neon hover:shadow-neon-strong transition-all duration-300 hover:scale-110 active:scale-95"
        aria-label="切换侧边栏"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* 侧边栏 */}
      <aside
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed lg:static left-0 top-0 h-screen w-72 glass-panel border-r border-[rgba(var(--border-color))] z-40 transition-transform duration-400 flex flex-col`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* 头部 */}
        <div className="relative px-5 pt-5 pb-4 border-b border-[rgba(var(--border-color))]">
          {/* 顶部光带 */}
          <div
            className="absolute top-0 left-0 right-0 h-px opacity-60"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(var(--accent-cyan), 0.6), transparent)',
            }}
          />

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[rgb(var(--accent-cyan))]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h2 className="text-[13px] font-bold uppercase tracking-wider text-[rgb(var(--text-primary))]">
                对话历史
              </h2>
            </div>
            <button
              onClick={onNewConversation}
              className="group relative w-8 h-8 rounded-lg overflow-hidden bg-gradient-brand-soft border border-[rgba(var(--accent-cyan),0.3)] hover:border-[rgba(var(--accent-cyan),0.6)] text-[rgb(var(--accent-cyan))] hover:text-white transition-all duration-300 hover:scale-110 active:scale-95"
              title="新对话"
              aria-label="新建对话"
            >
              <span className="absolute inset-0 bg-gradient-brand opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <svg className="relative w-4 h-4 mx-auto" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* 地址胶囊 */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[rgba(var(--bg-surface),0.6)] border border-[rgba(var(--border-color))]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono text-[rgb(var(--text-secondary))] truncate flex-1">
              {address ? `${address.slice(0, 8)}...${address.slice(-6)}` : ''}
            </span>
          </div>
        </div>

        {/* 对话列表 */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 rounded-full border-2 border-[rgba(var(--accent-cyan),0.2)]" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[rgb(var(--accent-cyan))] animate-spin" />
              </div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 px-4 animate-scale-in">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-brand-soft border border-[rgba(var(--accent-cyan),0.2)] flex items-center justify-center">
                <svg className="w-7 h-7 text-[rgb(var(--accent-cyan))]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-xs text-[rgb(var(--text-secondary))] font-medium">暂无对话</p>
              <p className="text-[10px] text-[rgb(var(--text-muted))] mt-1">点击 + 开始对话</p>
            </div>
          ) : (
            conversations.map((conv, idx) => {
              const isActive = activeConversationId === conv.id
              return (
                <div
                  key={conv.id}
                  onClick={() => handleSelect(conv.id)}
                  className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-300 overflow-hidden ${
                    isActive
                      ? 'bg-gradient-brand-soft border border-[rgba(var(--accent-violet),0.4)] shadow-glow-violet'
                      : 'border border-transparent hover:border-[rgba(var(--border-color))] hover:bg-[rgba(var(--bg-surface),0.5)]'
                  }`}
                  style={{
                    animation: `slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 30}ms backwards`,
                  }}
                >
                  {/* 激活指示条 */}
                  {isActive && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full"
                      style={{
                        background:
                          'linear-gradient(180deg, rgb(var(--accent-cyan)), rgb(var(--accent-violet)))',
                      }}
                    />
                  )}

                  <div className="flex items-start justify-between gap-2 relative">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isActive ? 'text-[rgb(var(--text-primary))]' : 'text-[rgb(var(--text-secondary))] group-hover:text-[rgb(var(--text-primary))]'} transition-colors`}>
                        {conv.title || '新对话'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[rgba(var(--accent-cyan),0.1)] text-[rgb(var(--accent-cyan))] font-mono font-semibold">
                          {conv.message_count}
                        </span>
                        <span className="text-[10px] text-[rgb(var(--text-muted))]">
                          {formatTime(conv.updated_at)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(conv.id, e)}
                      className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-[rgb(var(--text-muted))] hover:bg-[rgba(var(--danger),0.15)] hover:text-[rgb(var(--danger))] transition-all duration-200 hover:scale-110 active:scale-95"
                      title="删除"
                      aria-label="删除对话"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* 底部 */}
        <div className="px-4 py-3 border-t border-[rgba(var(--border-color))]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[rgb(var(--text-muted))]">
              Total
            </span>
            <span className="text-[11px] font-bold font-mono text-gradient">
              {conversations.length.toString().padStart(2, '0')}
            </span>
          </div>
        </div>
      </aside>

      {/* 移动端遮罩 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden animate-scale-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="删除对话"
        message="确定要删除这个对话吗？此操作不可撤销。"
        confirmText="删除"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  )
}
