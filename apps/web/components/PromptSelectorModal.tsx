'use client'

import { useEffect } from 'react'
import { PromptTemplate } from '@/config/prompts'
import PromptSelector from './PromptSelector'

interface PromptSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectPrompt: (prompt: PromptTemplate) => void
}

export default function PromptSelectorModal({
  isOpen,
  onClose,
  onSelectPrompt,
}: PromptSelectorModalProps) {
  // ESC 键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className={`
        fixed z-50
        // 桌面端：居中弹窗
        md:inset-0 md:flex md:items-center md:justify-center md:p-4
        // 移动端：底部抽屉
        inset-x-0 bottom-0 p-4
      `}
    >
      {/* 遮罩层 */}
      <div
        className={`
          absolute inset-0 bg-black/50
          transition-opacity duration-300 ease-out
          ${isOpen ? 'opacity-100' : 'opacity-0'}
        `}
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div
        className={`
          relative z-10 w-full
          // 桌面端样式
          md:max-w-2xl md:max-h-[80vh] md:rounded-2xl
          // 移动端样式
          max-h-[90vh] rounded-t-2xl
          // 通用样式
          bg-[rgb(var(--bg-primary))]
          shadow-2xl
          transition-all duration-300 ease-out
          ${isOpen
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-4'
          }
        `}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgb(var(--border-color))]">
          <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
            提示词模板
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
            title="关闭"
          >
            <svg
              className="w-5 h-5 text-[rgb(var(--text-muted))]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 内容区（可滚动） */}
        <div className="overflow-y-auto max-h-[calc(80vh-60px)] md:max-h-[calc(80vh-73px)] p-6">
          <PromptSelector onSelectPrompt={onSelectPrompt} />
        </div>
      </div>
    </div>
  )
}
