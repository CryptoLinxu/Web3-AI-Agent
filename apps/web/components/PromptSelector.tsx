'use client'

import { PromptTemplate, getAllCategories, getPromptsByCategory } from '@/config/prompts'

interface PromptSelectorProps {
  onSelectPrompt: (prompt: PromptTemplate) => void
}

export default function PromptSelector({ onSelectPrompt }: PromptSelectorProps) {
  const categories = getAllCategories()

  return (
    <div className="space-y-6">
      {categories.map(({ category, icon, label }, catIdx) => {
        // 过滤掉 system 分类（不展示给用户）
        if (category === 'system') return null

        const prompts = getPromptsByCategory(category)
        if (prompts.length === 0) return null

        return (
          <div
            key={category}
            style={{ animation: `slide-up 0.4s ${catIdx * 60}ms backwards cubic-bezier(0.16, 1, 0.3, 1)` }}
          >
            {/* 分类标题 */}
            <div className="flex items-center gap-2.5 mb-3">
              <span className="relative flex items-center justify-center w-7 h-7 rounded-lg glass-subtle">
                <span className="text-sm">{icon}</span>
              </span>
              <h3 className="text-sm font-bold tracking-tight text-[rgb(var(--text-primary))]">
                {label}
              </h3>
              <span className="flex-1 h-px bg-gradient-to-r from-[rgb(var(--border-color))] to-transparent" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-[rgb(var(--text-muted))]">
                {prompts.length}
              </span>
            </div>

            {/* 提示词列表 */}
            <div className="space-y-2">
              {prompts.map((prompt, idx) => (
                <button
                  key={prompt.id}
                  onClick={() => onSelectPrompt(prompt)}
                  className="group relative w-full text-left overflow-hidden"
                  style={{ animation: `slide-up 0.3s ${(catIdx * 60) + (idx * 30) + 100}ms backwards cubic-bezier(0.16, 1, 0.3, 1)` }}
                >
                  {/* 卡片主体 */}
                  <div className="relative glass-subtle rounded-xl px-4 py-3 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:shadow-[0_8px_24px_-12px_rgba(139,92,246,0.35)]">
                    {/* Hover 渐变光带 */}
                    <span
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{
                        background: 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(139,92,246,0.08))',
                      }}
                    />
                    {/* 左侧激活条 */}
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 group-hover:h-8 rounded-r-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                      style={{
                        background:
                          'linear-gradient(180deg, rgb(var(--accent-cyan)), rgb(var(--accent-violet)))',
                      }}
                    />

                    <div className="relative flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[rgb(var(--text-primary))] truncate">
                          {prompt.title}
                        </p>
                        {prompt.description && (
                          <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5 truncate">
                            {prompt.description}
                          </p>
                        )}
                      </div>

                      {/* 箭头 */}
                      <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-[rgb(var(--bg-tertiary))] text-[rgb(var(--text-muted))] group-hover:bg-gradient-brand group-hover:text-white group-hover:shadow-neon transition-all duration-300 group-hover:translate-x-0.5">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
