'use client'

import { useState, KeyboardEvent } from 'react'

interface ChatInputProps {
  onSend: (message: string) => void
  isLoading: boolean
}

export default function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [input, setInput] = useState('')

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

  return (
    <div className="relative">
      <div className="flex items-end gap-3 bg-[rgba(var(--bg-secondary),0.5)] border border-[rgba(var(--border-color))] rounded-2xl p-2 focus-within:border-[rgba(var(--accent-color),0.3)] focus-within:bg-[rgba(var(--bg-secondary),0.8)] transition-all duration-200 shadow-lg shadow-black/10">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="询问 Web3 相关问题，如 ETH 价格、钱包余额..."
          className="flex-1 bg-transparent text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-muted))] resize-none outline-none min-h-[44px] max-h-[200px] py-2.5 px-4 text-sm leading-relaxed"
          rows={1}
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="flex-shrink-0 p-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white transition-all duration-200 shadow-lg shadow-primary-500/20 disabled:shadow-none"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          )}
        </button>
      </div>
      <div className="flex items-center justify-between mt-2 px-2">
        <p className="text-[10px] text-gray-600">Enter 发送 · Shift+Enter 换行</p>
        <p className="text-[10px] text-gray-600">数据仅供参考，不构成投资建议</p>
      </div>
    </div>
  )
}
