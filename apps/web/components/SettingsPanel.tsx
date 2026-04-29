'use client'

import { useEffect, useState } from 'react'
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
    description: '消息达到阈值时用 AI 生成摘要并保留最近消息，上下文更丰富但有额外 API 调用。',
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
  const [mounted, setMounted] = useState(false)

  // 进场动画
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setMounted(true))
    } else {
      setMounted(false)
    }
  }, [isOpen])

  // ESC 关闭
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/65 backdrop-blur-md z-40 transition-opacity duration-300 ${
          mounted ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-md glass-panel border-l border-[rgba(var(--border-color))] z-50 shadow-2xl transition-transform duration-400 ${
          mounted ? 'translate-x-0' : 'translate-x-full'
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

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[rgba(var(--border-color))]">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 bg-gradient-brand rounded-xl blur-md opacity-50" />
              <div className="relative w-full h-full rounded-xl bg-gradient-brand flex items-center justify-center shadow-neon">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gradient tracking-tight">设置中心</h2>
              <p className="text-[11px] text-[rgb(var(--text-muted))] font-mono uppercase tracking-wider mt-0.5">
                Control Panel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost w-9 h-9 !p-0 group"
            aria-label="关闭"
          >
            <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8 overflow-y-auto h-[calc(100%-85px)]">
          {/* 主题模式 */}
          <section className="animate-slide-up" style={{ animationDelay: '80ms', animationFillMode: 'backwards' }}>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-brand-soft border border-[rgba(var(--accent-cyan),0.25)] flex items-center justify-center">
                <svg className="w-4 h-4 text-[rgb(var(--accent-cyan))]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[rgb(var(--text-primary))]">主题模式</h3>
                <p className="text-[11px] text-[rgb(var(--text-muted))]">
                  当前：{resolvedTheme === 'dark' ? '深色模式' : '浅色模式'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {themes.map(({ value, label }) => {
                const active = theme === value
                return (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={`relative flex flex-col items-center gap-1.5 p-3.5 rounded-xl border transition-all duration-300 overflow-hidden ${
                      active
                        ? 'border-transparent text-white'
                        : 'border-[rgba(var(--border-color))] bg-[rgba(var(--bg-surface),0.4)] text-[rgb(var(--text-secondary))] hover:border-[rgba(var(--accent-cyan),0.3)] hover:bg-[rgba(var(--bg-surface),0.7)] hover:scale-[1.02] active:scale-95'
                    }`}
                  >
                    {active && (
                      <span className="absolute inset-0 bg-gradient-brand opacity-90" />
                    )}
                    <span className="relative">
                      {value === 'system' && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      )}
                      {value === 'light' && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      )}
                      {value === 'dark' && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                      )}
                    </span>
                    <span className="relative text-xs font-semibold">{label}</span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Memory 策略 */}
          <section className="animate-slide-up" style={{ animationDelay: '160ms', animationFillMode: 'backwards' }}>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-brand-soft border border-[rgba(var(--accent-violet),0.25)] flex items-center justify-center">
                <svg className="w-4 h-4 text-[rgb(var(--accent-violet))]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[rgb(var(--text-primary))]">Memory 策略</h3>
                <p className="text-[11px] text-[rgb(var(--text-muted))]">控制对话上下文管理方式</p>
              </div>
            </div>

            <div className="space-y-3">
              {memoryStrategies.map((strategy) => {
                const active = memoryStrategy === strategy.id
                return (
                  <button
                    key={strategy.id}
                    onClick={() => onMemoryStrategyChange(strategy.id)}
                    className={`relative w-full text-left rounded-xl p-4 border transition-all duration-300 overflow-hidden ${
                      active
                        ? 'border-transparent'
                        : 'border-[rgba(var(--border-color))] bg-[rgba(var(--bg-surface),0.4)] hover:bg-[rgba(var(--bg-surface),0.7)] hover:border-[rgba(var(--accent-violet),0.3)] hover:scale-[1.01] active:scale-[0.99]'
                    }`}
                  >
                    {active && (
                      <>
                        <span className="absolute inset-0 bg-gradient-brand-soft" />
                        <span
                          className="absolute inset-0 rounded-xl"
                          style={{
                            padding: '1px',
                            background:
                              'linear-gradient(135deg, rgba(6,182,212,0.6), rgba(139,92,246,0.6))',
                            WebkitMask:
                              'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                            WebkitMaskComposite: 'xor',
                            maskComposite: 'exclude',
                          }}
                        />
                      </>
                    )}
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                              active
                                ? 'border-[rgb(var(--accent-cyan))]'
                                : 'border-[rgba(var(--text-muted),0.5)]'
                            }`}
                          >
                            {active && <div className="w-1.5 h-1.5 rounded-full bg-gradient-brand animate-pulse" />}
                          </div>
                          <span className="text-sm font-bold text-[rgb(var(--text-primary))]">
                            {strategy.name}
                          </span>
                        </div>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                            strategy.badge === '推荐'
                              ? 'bg-gradient-brand text-white shadow-glow-cyan'
                              : 'bg-[rgba(var(--bg-surface),0.8)] text-[rgb(var(--text-muted))] border border-[rgba(var(--border-color))]'
                          }`}
                        >
                          {strategy.badge}
                        </span>
                      </div>
                      <p className="text-xs text-[rgb(var(--text-secondary))] mb-2 ml-6 leading-relaxed">
                        {strategy.description}
                      </p>
                      <div className="ml-6 flex flex-wrap gap-x-3 gap-y-1">
                        {strategy.details.map((detail) => (
                          <span
                            key={detail}
                            className="text-[10px] text-[rgb(var(--text-muted))] font-mono"
                          >
                            · {detail}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            <p className="text-[10px] text-[rgb(var(--text-muted))] opacity-70 mt-3 leading-relaxed italic">
              切换策略后新消息将使用新策略管理上下文，已有消息不受影响。
            </p>
          </section>

          {/* 多语言占位 */}
          <section className="animate-slide-up opacity-60" style={{ animationDelay: '240ms', animationFillMode: 'backwards' }}>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[rgba(var(--bg-surface),0.6)] border border-[rgba(var(--border-color))] flex items-center justify-center">
                <svg className="w-4 h-4 text-[rgb(var(--text-muted))]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[rgb(var(--text-muted))]">多语言</h3>
                <p className="text-[11px] text-[rgb(var(--text-muted))] opacity-70">即将推出</p>
              </div>
            </div>
            <div className="rounded-xl p-4 border border-dashed border-[rgba(var(--border-color))] bg-[rgba(var(--bg-surface),0.3)]">
              <p className="text-xs text-[rgb(var(--text-muted))]">
                中文 · English · 日本語 · 한국어
              </p>
            </div>
          </section>

          {/* 版本信息 */}
          <div className="pt-4 border-t border-[rgba(var(--border-color))]">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-[rgb(var(--text-muted))]">
                Quantum Nexus <span className="text-gradient font-bold">v0.2.0</span>
              </span>
              <span className="text-[rgb(var(--text-muted))]">AI × Web3</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
