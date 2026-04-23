'use client'

import { useTheme } from '@/lib/theme/ThemeContext'
import type { ThemeMode } from '@/lib/theme/types'

export function ThemeSwitcher() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const themes: { value: ThemeMode; label: string; icon: string }[] = [
    { value: 'system', label: '跟随系统', icon: '🖥️' },
    { value: 'light', label: '浅色', icon: '☀️' },
    { value: 'dark', label: '深色', icon: '🌙' },
  ]

  return (
    <div className="space-y-3">
      <label className="block text-sm font-bold text-[rgb(var(--text-secondary))]">
        主题模式
      </label>
      <div className="grid grid-cols-3 gap-2">
        {themes.map(({ value, label, icon }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
              theme === value
                ? 'border-primary-500 bg-primary-50 text-primary-600'
                : 'border-[rgb(var(--border-color))] bg-[rgb(var(--bg-secondary))] text-[rgb(var(--text-muted))] hover:border-[rgb(var(--text-muted))] hover:bg-[rgb(var(--bg-tertiary))]'
            }`}
          >
            <span className="text-lg">{icon}</span>
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-[rgb(var(--text-muted))] opacity-60">
        当前：{resolvedTheme === 'dark' ? '深色模式' : '浅色模式'}
      </p>
    </div>
  )
}
