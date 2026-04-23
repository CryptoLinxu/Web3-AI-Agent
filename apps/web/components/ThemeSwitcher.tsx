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
      <label className="block text-sm font-medium text-gray-300">
        主题模式
      </label>
      <div className="grid grid-cols-3 gap-2">
        {themes.map(({ value, label, icon }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
              theme === value
                ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600 hover:bg-gray-800'
            }`}
          >
            <span className="text-lg">{icon}</span>
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500">
        当前：{resolvedTheme === 'dark' ? '深色模式' : '浅色模式'}
      </p>
    </div>
  )
}
