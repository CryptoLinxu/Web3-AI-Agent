'use client'

import { useState, useEffect, useCallback } from 'react'
import { ThemeContext } from './ThemeContext'
import type { ThemeMode, ResolvedTheme } from './types'

const THEME_STORAGE_KEY = 'web3-agent-theme'

/**
 * 获取主题初始化脚本（注入到 <head> 避免闪烁）
 */
export function getThemeInitScript(): string {
  return `
    (function(){
      var theme = localStorage.getItem('${THEME_STORAGE_KEY}') || 'dark';
      if (theme === 'system') {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      var resolved = theme;
      document.documentElement.setAttribute('data-theme', resolved);
      if (resolved === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    })();
  `
}

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // 从 localStorage 读取保存的主题，如果没有则默认 dark
  const savedTheme = (typeof window !== 'undefined' 
    ? localStorage.getItem(THEME_STORAGE_KEY) 
    : null) as ThemeMode | null
  const initialTheme = savedTheme || 'dark'
  
  const [theme, setThemeState] = useState<ThemeMode>(initialTheme)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(
    initialTheme === 'system' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : initialTheme
  )

  // 初始化主题 - 同步执行，避免闪烁
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null
    const initialTheme = savedTheme || 'dark'
    setThemeState(initialTheme)
    
    const resolved = resolveTheme(initialTheme)
    setResolvedTheme(resolved)
    document.documentElement.setAttribute('data-theme', resolved)
    if (resolved === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
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
    document.documentElement.setAttribute('data-theme', resolved)
    if (resolved === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
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
