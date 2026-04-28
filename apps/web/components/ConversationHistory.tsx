'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
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
  const { address, isConnected } = useAccount()
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // 加载对话列表
  useEffect(() => {
    if (isConnected && address) {
      setWalletContext(address)
      loadConversations(address)
    } else {
      setConversations([])
    }
  }, [isConnected, address])

  // 监听新建对话事件 - 只添加新项，不重新加载整个列表
  useEffect(() => {
    const handleNewConversation = (event: Event) => {
      const customEvent = event as CustomEvent
      const newConv = customEvent.detail
      if (newConv) {
        // 直接添加到列表头部，不重新加载
        setConversations((prev) => [newConv, ...prev])
      }
    }
    window.addEventListener('conversation-created', handleNewConversation)
    
    // 监听标题更新事件
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
      
      // Step 1: 服务端验证所有权
      const verifyRes = await fetch('/api/supabase/verify-ownership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: pendingDeleteId,
          walletAddress: address,
        }),
      })
      
      const verifyData = await verifyRes.json()
      
      if (!verifyData.isOwner) {
        throw new Error(verifyData.error || '无权删除此对话')
      }
      
      // Step 2: 服务端删除对话
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
        onNewConversation()
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

  // 格式化相对时间
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

  if (!isConnected) return null

  return (
    <>
      {/* 移动端切换按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 bottom-20 z-50 lg:hidden w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-lg"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* 侧边栏 */}
      <aside
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed lg:static left-0 top-0 h-screen w-72 bg-[rgb(var(--sidebar-bg))] border-r border-[rgb(var(--border-color))] z-40 transition-transform duration-300 flex flex-col`}
      >
        {/* 头部 */}
        <div className="p-4 border-b border-[rgb(var(--border-color))]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))]">对话历史</h2>
            <button
              onClick={onNewConversation}
              className="p-1.5 rounded-lg bg-primary-600/20 text-primary-600 hover:bg-primary-600/30 transition-colors"
              title="新对话"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-[rgb(var(--text-muted))] truncate">
            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
          </p>
        </div>

        {/* 对话列表 */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-[rgb(var(--text-muted))]">暂无对话历史</p>
              <p className="text-xs text-[rgb(var(--text-muted))] opacity-60 mt-1">点击上方 + 开始新对话</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => handleSelect(conv.id)}
                className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                  activeConversationId === conv.id
                    ? 'bg-[rgb(var(--user-message-bg))] border-l-2 border-l-primary-500'
                    : 'hover:bg-[rgb(var(--bg-tertiary))] border border-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))] truncate">
                      {conv.title || '新对话'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-[rgb(var(--text-muted))]">
                        {conv.message_count} 条消息
                      </span>
                      <span className="text-xs text-[rgb(var(--text-muted))] opacity-60">
                        {formatTime(conv.updated_at)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-[rgb(var(--text-muted))] hover:text-red-500 transition-all"
                    title="删除"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 底部 */}
        <div className="p-3 border-t border-[rgb(var(--border-color))]">
          <p className="text-xs text-[rgb(var(--text-muted))] opacity-60 text-center">
            共 {conversations.length} 个对话
          </p>
        </div>
      </aside>

      {/* 移动端遮罩 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
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
