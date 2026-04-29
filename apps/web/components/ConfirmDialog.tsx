'use client'

import { useEffect, useState } from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setMounted(true))
    } else {
      setMounted(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  const variantConfig = {
    danger: {
      iconBg: 'bg-[rgba(var(--danger),0.15)]',
      iconColor: 'text-[rgb(var(--danger))]',
      iconRing: 'ring-[rgba(var(--danger),0.3)]',
      confirmBtn:
        'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400 shadow-[0_4px_20px_rgba(239,68,68,0.35)] hover:shadow-[0_8px_30px_rgba(239,68,68,0.5)]',
    },
    warning: {
      iconBg: 'bg-[rgba(var(--warning),0.15)]',
      iconColor: 'text-[rgb(var(--warning))]',
      iconRing: 'ring-[rgba(var(--warning),0.3)]',
      confirmBtn:
        'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-[0_4px_20px_rgba(251,191,36,0.35)]',
    },
    info: {
      iconBg: 'bg-gradient-brand-soft',
      iconColor: 'text-[rgb(var(--accent-cyan))]',
      iconRing: 'ring-[rgba(var(--accent-cyan),0.3)]',
      confirmBtn: 'btn-primary',
    },
  }

  const config = variantConfig[variant]

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      {/* 遮罩 */}
      <div
        className={`absolute inset-0 bg-black/65 backdrop-blur-md transition-opacity duration-300 ${
          mounted ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* 弹窗 */}
      <div
        className={`relative z-10 w-full max-w-md glass-panel rounded-2xl border border-[rgba(var(--border-color))] shadow-2xl overflow-hidden transition-all duration-300 ${
          mounted ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部光带 */}
        <div
          className="absolute top-0 left-0 right-0 h-px opacity-70"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(var(--accent-cyan), 0.6), rgba(var(--accent-violet), 0.6), transparent)',
          }}
        />

        {/* 图标 + 标题 */}
        <div className="px-6 pt-6 pb-4 flex items-start gap-4">
          <div className={`flex-shrink-0 w-11 h-11 rounded-xl ${config.iconBg} ring-1 ${config.iconRing} flex items-center justify-center`}>
            <svg className={`w-5 h-5 ${config.iconColor}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1 pt-0.5">
            <h3 className="text-base font-bold text-[rgb(var(--text-primary))]">{title}</h3>
            <p className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed mt-1.5">
              {message}
            </p>
          </div>
        </div>

        {/* 按钮区 */}
        <div className="px-6 pb-6 flex justify-end gap-2.5">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl glass-subtle border border-[rgba(var(--border-color))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:border-[rgba(var(--accent-violet),0.3)] transition-all duration-300 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.03] active:scale-95"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`relative px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.03] active:scale-95 overflow-hidden ${config.confirmBtn}`}
          >
            {isLoading && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {isLoading ? '处理中...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
