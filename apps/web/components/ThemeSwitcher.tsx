'use client'

import { useTheme } from '@/lib/theme/ThemeContext'
import type { ThemeMode } from '@/lib/theme/types'

interface ThemeOption {
  value: ThemeMode
  label: string
  icon: JSX.Element
}

const ICONS: Record<ThemeMode, JSX.Element> = {
  system: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="12" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 20h8M12 16v4" />
    </svg>
  ),
  light: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="4" strokeLinecap="round" strokeLinejoin="round" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41"
      />
    </svg>
  ),
  dark: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
}

export function ThemeSwitcher() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const themes: ThemeOption[] = [
    { value: 'system', label: '跟随系统', icon: ICONS.system },
    { value: 'light', label: '浅色', icon: ICONS.light },
    { value: 'dark', label: '深色', icon: ICONS.dark },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono uppercase tracking-wider text-[rgb(var(--text-muted))]">
          Theme Mode
        </label>
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full glass-subtle">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background:
                resolvedTheme === 'dark'
                  ? 'rgb(var(--accent-violet))'
                  : 'rgb(var(--accent-cyan))',
            }}
          />
          <span className="text-[10px] font-semibold text-[rgb(var(--text-secondary))]">
            {resolvedTheme === 'dark' ? 'Dark' : 'Light'}
          </span>
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {themes.map(({ value, label, icon }) => {
          const active = theme === value
          return (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className="group relative overflow-hidden rounded-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
              aria-pressed={active}
            >
              {/* 激活渐变背景 */}
              <span
                className={`absolute inset-0 transition-opacity duration-300 ${
                  active ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ background: 'linear-gradient(135deg, rgb(var(--accent-cyan)), rgb(var(--accent-violet)))' }}
              />
              {/* 非激活玻璃层 */}
              <span
                className={`absolute inset-0 transition-opacity duration-300 ${
                  active ? 'opacity-0' : 'opacity-100'
                } glass-subtle`}
              />
              {/* Hover 高光 */}
              {!active && (
                <span
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(139,92,246,0.1))' }}
                />
              )}

              <div className="relative flex flex-col items-center justify-center gap-1.5 px-2 py-3">
                <span
                  className={`transition-colors duration-300 ${
                    active ? 'text-white' : 'text-[rgb(var(--text-secondary))] group-hover:text-[rgb(var(--text-primary))]'
                  }`}
                >
                  {icon}
                </span>
                <span
                  className={`text-[11px] font-semibold tracking-wide transition-colors duration-300 ${
                    active ? 'text-white' : 'text-[rgb(var(--text-secondary))]'
                  }`}
                >
                  {label}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
