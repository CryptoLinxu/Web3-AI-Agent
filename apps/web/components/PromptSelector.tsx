'use client'

import { PromptTemplate, getAllCategories, getPromptsByCategory, PromptCategory } from '@/config/prompts'

interface PromptSelectorProps {
  onSelectPrompt: (prompt: PromptTemplate) => void
}

export default function PromptSelector({ onSelectPrompt }: PromptSelectorProps) {
  const categories = getAllCategories()

  return (
    <div className="space-y-6">
      {categories.map(({ category, icon, label }) => {
        // 过滤掉 system 分类（不展示给用户）
        if (category === 'system') return null

        const prompts = getPromptsByCategory(category)
        if (prompts.length === 0) return null

        return (
          <div key={category}>
            {/* 分类标题 */}
            <h3 className="text-sm font-semibold text-[rgb(var(--text-secondary))] mb-3 flex items-center gap-2">
              <span className="text-base">{icon}</span>
              <span>{label}</span>
            </h3>

            {/* 提示词列表 */}
            <div className="space-y-2">
              {prompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="group flex items-center justify-between p-3 rounded-lg bg-[rgb(var(--bg-secondary))] hover:bg-[rgb(var(--bg-tertiary))] border border-transparent hover:border-[rgb(var(--border-color))] transition-all duration-200"
                >
                  {/* 提示词信息 */}
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))] truncate">
                      {prompt.title}
                    </p>
                    {prompt.description && (
                      <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5 truncate">
                        {prompt.description}
                      </p>
                    )}
                  </div>

                  {/* 使用按钮 */}
                  <button
                    onClick={() => onSelectPrompt(prompt)}
                    className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500/10 hover:bg-primary-500/20 text-primary-600 hover:text-primary-700 flex items-center justify-center transition-all duration-200 opacity-60 group-hover:opacity-100"
                    title="使用此提示词"
                  >
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
                        d="M5 12h14M12 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
