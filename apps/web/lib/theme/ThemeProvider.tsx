'use client'

import { useState, useEffect, useCallback } from 'react'
import { ThemeContext } from './ThemeContext'
import type { ThemeMode, ResolvedTheme } from './types'

const THEME_STORAGE_KEY = 'web3-agent-theme'

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>('dark')
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark')

  // 初始化主题
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null
    const initialTheme = savedTheme || 'dark'
    setThemeState(initialTheme)
  }, [])

  // 解析主题（system 模式跟随系统）
  const resolveTheme = useCallback((mode: ThemeMode): ResolvedTheme => {
    if (mode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return mode
  }, [])

  // 监听系统主题变化
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = () => {
      setResolvedTheme(resolveTheme('system'))
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, resolveTheme])

  // 更新 resolvedTheme 和 DOM
  useEffect(() => {
    const resolved = resolveTheme(theme)
    setResolvedTheme(resolved)
    
    // 更新 HTML 属性
    document.documentElement.setAttribute('data-theme', resolved)
    
    // 存储到 localStorage
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme, resolveTheme])

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
