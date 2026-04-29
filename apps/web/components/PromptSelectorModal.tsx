'use client'

import { useEffect, useState } from 'react'
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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setMounted(true))
    } else {
      setMounted(false)
    }
  }, [isOpen])

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
      className="fixed z-[55] md:inset-0 md:flex md:items-center md:justify-center md:p-4 inset-x-0 bottom-0 p-4"
    >
      {/* 遮罩 */}
      <div
        className={`absolute inset-0 bg-black/65 backdrop-blur-md transition-opacity duration-300 ${
          mounted ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* 弹窗 */}
      <div
        className={`relative z-10 w-full md:max-w-2xl md:max-h-[82vh] md:rounded-2xl max-h-[90vh] rounded-t-2xl glass-panel border border-[rgba(var(--border-color))] shadow-2xl overflow-hidden transition-all duration-400 ${
          mounted
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 md:scale-95 md:translate-y-2 translate-y-8'
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* 顶部渐变光带 */}
        <div
          className="absolute top-0 left-0 right-0 h-px opacity-80"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(var(--accent-cyan), 0.6), rgba(var(--accent-violet), 0.6), transparent)',
          }}
        />

        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(var(--border-color))]">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9">
              <div className="absolute inset-0 bg-gradient-brand rounded-xl blur-md opacity-50" />
              <div className="relative w-full h-full rounded-xl bg-gradient-brand flex items-center justify-center shadow-neon">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div>
              <h2 className="text-base font-bold text-gradient tracking-tight">
                提示词模板
              </h2>
              <p className="text-[10px] font-mono uppercase tracking-wider text-[rgb(var(--text-muted))] mt-0.5">
                Quick Prompts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost w-9 h-9 !p-0 group"
            title="关闭"
            aria-label="关闭"
          >
            <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容区 */}
        <div className="overflow-y-auto max-h-[calc(90vh-72px)] md:max-h-[calc(82vh-72px)] p-6">
          <PromptSelector onSelectPrompt={onSelectPrompt} />
        </div>
      </div>
    </div>
  )
}
