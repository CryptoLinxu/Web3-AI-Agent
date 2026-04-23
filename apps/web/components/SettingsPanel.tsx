'use client'

import { useState } from 'react'
import { useTheme } from '@/lib/theme/ThemeContext'
import type { ThemeMode } from '@/lib/theme/types'

type MemoryStrategy = 'l3-compression' | 'l2-sliding-window'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  memoryStrategy: MemoryStrategy
  onMemoryStrategyChange: (strategy: MemoryStrategy) => void
}

const themes: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: '跟随系统' },
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
]

const memoryStrategies = [
  {
    id: 'l3-compression' as MemoryStrategy,
    name: 'L3 摘要压缩',
    description: '当消息达到阈值时，使用 AI 生成摘要，保留最近消息。上下文更丰富，但有额外 API 调用。',
    badge: '推荐',
    details: [
      '压缩阈值：10 条消息',
      '保留最近：5 条消息',
      '额外 API 调用：是',
      '上下文质量：高',
    ],
  },
  {
    id: 'l2-sliding-window' as MemoryStrategy,
    name: 'L2 滑动窗口',
    description: '只保留最近 N 条消息，超出自动丢弃。纯本地截断，无额外 API 开销。',
    badge: '轻量',
    details: [
      '窗口大小：最近 N 条',
      '额外 API 调用：否',
      '上下文质量：中',
      '性能开销：极低',
    ],
  },
]

export default function SettingsPanel({
  isOpen,
  onClose,
  memoryStrategy,
  onMemoryStrategyChange,
}: SettingsPanelProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-[rgb(var(--bg-primary))] border-l border-[rgb(var(--border-color))] z-50 shadow-2xl dark:shadow-[-8px_0_30px_-5px_rgba(124,58,237,0.15)] transform transition-transform duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[rgb(var(--border-color))]">
          <div>
            <h2 className="text-lg font-bold text-[rgb(var(--text-primary))]">设置</h2>
            <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5">自定义你的体验</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[rgba(var(--bg-tertiary))] transition-colors text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Settings Content */}
        <div className="p-6 space-y-8 overflow-y-auto h-[calc(100%-80px)]">
          {/* 主题切换 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-[rgb(var(--bg-tertiary))] flex items-center justify-center">
                <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">主题模式</h3>
                <p className="text-xs text-[rgb(var(--text-muted))]">{resolvedTheme === 'dark' ? '深色模式' : '浅色模式'}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {themes.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all ${
                    theme === value
                      ? 'border-primary-500 bg-primary-50 text-primary-600 dark:bg-transparent dark:border-primary-500 dark:text-primary-400'
                      : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100 dark:border-[rgb(var(--border-color))] dark:bg-transparent dark:text-[rgb(var(--text-muted))] dark:hover:border-[rgb(var(--text-muted))]'
                  }`}
                >
                  {value === 'system' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  )}
                  {value === 'light' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  )}
                  {value === 'dark' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Memory 策略选择 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-[rgb(var(--bg-tertiary))] flex items-center justify-center">
                <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">Memory 策略</h3>
                <p className="text-xs text-[rgb(var(--text-muted))]">控制对话上下文的管理方式</p>
              </div>
            </div>

            <div className="space-y-3">
              {memoryStrategies.map((strategy) => (
                <button
                  key={strategy.id}
                  onClick={() => onMemoryStrategyChange(strategy.id)}
                  className={`w-full text-left rounded-xl p-4 border transition-all duration-200 ${
                    memoryStrategy === strategy.id
                      ? 'bg-primary-50 border-primary-200 shadow-lg shadow-primary-500/5 dark:bg-transparent dark:border-primary-500/50'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300 dark:bg-transparent dark:border-[rgb(var(--border-color))] dark:hover:border-[rgb(var(--text-muted))]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {/* Radio indicator */}
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                          memoryStrategy === strategy.id
                            ? 'border-primary-500 dark:border-primary-400'
                            : 'border-gray-400 dark:border-gray-500'
                        }`}
                      >
                        {memoryStrategy === strategy.id && (
                          <div className="w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-[rgb(var(--text-primary))]">{strategy.name}</span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        strategy.badge === '推荐'
                          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                          : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {strategy.badge}
                    </span>
                  </div>
                  <p className="text-xs text-[rgb(var(--text-secondary))] mb-2 ml-6">{strategy.description}</p>
                  <div className="ml-6 flex flex-wrap gap-x-4 gap-y-1">
                    {strategy.details.map((detail) => (
                      <span key={detail} className="text-[10px] text-[rgb(var(--text-muted))]">
                        {detail}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            <p className="text-[10px] text-[rgb(var(--text-muted))] opacity-60 mt-3 leading-relaxed">
              切换策略后，新消息将使用新策略管理上下文。已有消息不受影响。
            </p>
          </section>

          {/* 未来设置项占位 */}
          
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[rgb(var(--bg-tertiary))] flex items-center justify-center">
                <svg className="w-4 h-4 text-[rgb(var(--text-muted))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[rgb(var(--text-muted))]">多语言</h3>
                <p className="text-xs text-[rgb(var(--text-muted))] opacity-60">即将推出</p>
              </div>
            </div>
            <div className="bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-color))] rounded-xl p-4 opacity-50">
              <p className="text-xs text-[rgb(var(--text-muted))]">支持中文、English、日本語等多语言切换</p>
            </div>
          </section>

          {/* 版本信息 */}
          <div className="pt-4 border-t border-[rgb(var(--border-color))]">
            <div className="flex items-center justify-between text-[10px] text-[rgb(var(--text-muted))]">
              <span>Web3 AI Agent v0.2.0</span>
              <span>Powered by AI + Web3</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
