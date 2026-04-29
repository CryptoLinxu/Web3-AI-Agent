'use client'

import { useState, KeyboardEvent, useRef } from 'react'
import { PromptTemplate } from '@/config/prompts'
import PromptSelectorModal from './PromptSelectorModal'

interface ChatInputProps {
  onSend: (message: string) => void
  isLoading: boolean
}

export default function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [input, setInput] = useState('')
  const [isPromptSelectorOpen, setIsPromptSelectorOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    if (!input.trim() || isLoading) return
    onSend(input.trim())
    setInput('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handlePromptSelect = (prompt: PromptTemplate) => {
    setInput(prompt.content)
    setIsPromptSelectorOpen(false)
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 100)
  }

  const canSend = input.trim().length > 0 && !isLoading

  return (
    <div className="relative">
      {/* 输入容器 - 带聚焦渐变边框 */}
      <div
        className={`relative rounded-2xl transition-all duration-300 ${
          isFocused ? 'shadow-neon' : ''
        }`}
      >
        {/* 聚焦时显示的流动渐变边框 */}
        <div
          className={`absolute -inset-px rounded-2xl pointer-events-none transition-opacity duration-300 ${
            isFocused ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            background:
              'linear-gradient(135deg, rgba(6,182,212,0.6), rgba(139,92,246,0.6), rgba(6,182,212,0.4))',
            backgroundSize: '300% 300%',
            animation: isFocused ? 'gradient-flow 6s ease infinite' : 'none',
            WebkitMask:
              'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            padding: '1px',
          }}
        />

        <div
          className={`relative flex items-end gap-3 glass-panel rounded-2xl p-2 border transition-all duration-300 ${
            isFocused
              ? 'border-transparent'
              : 'border-[rgba(var(--border-color))] hover:border-[rgba(var(--accent-cyan),0.3)]'
          }`}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="问我任何 Web3 问题，例如：ETH 现在多少钱？"
            className="flex-1 bg-transparent text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-muted))] resize-none outline-none min-h-[44px] max-h-[200px] py-2.5 px-4 text-sm leading-relaxed"
            rows={1}
            disabled={isLoading}
          />

          {/* 发送按钮 */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={`relative flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 overflow-hidden ${
              canSend
                ? 'bg-gradient-brand text-white shadow-neon hover:shadow-neon-strong hover:scale-105 active:scale-95'
                : 'bg-[rgba(var(--bg-surface),0.5)] text-[rgb(var(--text-muted))] cursor-not-allowed'
            }`}
            title="发送 (Enter)"
            aria-label="发送消息"
          >
            {canSend && (
              <span
                className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.2), transparent 60%)',
                }}
              />
            )}
            {isLoading ? (
              <svg className="animate-spin w-5 h-5 relative" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 relative" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* 底部工具栏 */}
      <div className="flex items-center justify-between mt-2.5 px-1">
        <button
          onClick={() => setIsPromptSelectorOpen(true)}
          className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-subtle border border-[rgba(var(--border-color))] hover:border-[rgba(var(--accent-violet),0.4)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          title="快捷提示词"
        >
          <svg className="w-3.5 h-3.5 text-[rgb(var(--accent-violet))] group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-[11px] font-semibold text-[rgb(var(--text-secondary))] group-hover:text-[rgb(var(--text-primary))] transition-colors">
            提示词模板
          </span>
        </button>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1 text-[10px] text-[rgb(var(--text-muted))]">
            <kbd className="px-1.5 py-0.5 rounded bg-[rgba(var(--bg-surface),0.6)] border border-[rgba(var(--border-color))] font-mono text-[9px]">
              Enter
            </kbd>
            <span>发送</span>
            <span className="mx-1">·</span>
            <kbd className="px-1.5 py-0.5 rounded bg-[rgba(var(--bg-surface),0.6)] border border-[rgba(var(--border-color))] font-mono text-[9px]">
              ⇧↵
            </kbd>
            <span>换行</span>
          </div>
          <p className="text-[10px] text-[rgb(var(--text-muted))] italic">数据仅供参考</p>
        </div>
      </div>

      {/* 提示词选择器弹窗 */}
      <PromptSelectorModal
        isOpen={isPromptSelectorOpen}
        onClose={() => setIsPromptSelectorOpen(false)}
        onSelectPrompt={handlePromptSelect}
      />
    </div>
  )
}
