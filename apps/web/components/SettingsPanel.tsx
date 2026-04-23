'use client'

import { useState } from 'react'
import { ThemeSwitcher } from './ThemeSwitcher'

type MemoryStrategy = 'l3-compression' | 'l2-sliding-window'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  memoryStrategy: MemoryStrategy
  onMemoryStrategyChange: (strategy: MemoryStrategy) => void
}

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
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-[rgb(var(--bg-primary))] backdrop-blur-xl border-l border-[rgba(var(--border-color))] z-50 shadow-2xl transform transition-transform duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[rgba(var(--border-color))]">
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
          <ThemeSwitcher />

          {/* Memory 策略选择 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[rgba(var(--accent-color),0.1)] flex items-center justify-center">
                <svg className="w-4 h-4 text-[rgb(var(--accent-color))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      ? 'bg-[rgba(var(--accent-color),0.1)] border-[rgba(var(--accent-color),0.3)] shadow-lg shadow-[rgba(var(--accent-color),0.05)]'
                      : 'bg-[rgba(var(--bg-secondary),0.5)] border-[rgba(var(--border-color))] hover:bg-[rgba(var(--bg-secondary),0.8)] hover:border-[rgba(var(--border-color))]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {/* Radio indicator */}
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                          memoryStrategy === strategy.id
                            ? 'border-[rgb(var(--accent-color))]'
                            : 'border-[rgb(var(--text-muted))]'
                        }`}
                      >
                        {memoryStrategy === strategy.id && (
                          <div className="w-2 h-2 rounded-full bg-[rgb(var(--accent-color))]" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-[rgb(var(--text-primary))]">{strategy.name}</span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        strategy.badge === '推荐'
                          ? 'bg-[rgba(var(--accent-color),0.2)] text-[rgb(var(--accent-color))]'
                          : 'bg-[rgba(var(--bg-tertiary))] text-[rgb(var(--text-muted))]'
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
              <div className="w-8 h-8 rounded-lg bg-gray-700/50 flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500">主题色</h3>
                <p className="text-xs text-gray-600">即将推出</p>
              </div>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 opacity-50">
              <p className="text-xs text-gray-600">支持自定义主题色，包括科技蓝、加密紫、暗夜绿等方案</p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gray-700/50 flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500">多语言</h3>
                <p className="text-xs text-gray-600">即将推出</p>
              </div>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 opacity-50">
              <p className="text-xs text-gray-600">支持中文、English、日本語等多语言切换</p>
            </div>
          </section>

          {/* 版本信息 */}
          <div className="pt-4 border-t border-white/[0.04]">
            <div className="flex items-center justify-between text-[10px] text-gray-600">
              <span>Web3 AI Agent v0.2.0</span>
              <span>Powered by AI + Web3</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
