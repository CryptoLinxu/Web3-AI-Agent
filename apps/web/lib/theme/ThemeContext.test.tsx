import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from './ThemeProvider'

// 直接 import 触发 useTheme 的测试需要在 Provider 内外分别测
import { useTheme } from './ThemeContext'

describe('ThemeContext', () => {
  describe('useTheme', () => {
    it('在 Provider 外调用应抛出错误', () => {
      // 使用一个简单的组件来触发 useTheme
      function TestComponent() {
        useTheme()
        return null
      }

      // 渲染时没有 ThemeProvider 包裹，应抛出错误
      expect(() => render(<TestComponent />)).toThrow(
        'useTheme must be used within ThemeProvider'
      )
    })

    it('在 Provider 内调用应返回上下文', () => {
      function TestComponent() {
        const { theme, resolvedTheme } = useTheme()
        return (
          <div>
            <span data-testid="theme">{theme}</span>
            <span data-testid="resolved">{resolvedTheme}</span>
          </div>
        )
      }

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      // 默认主题应为 dark
      expect(screen.getByTestId('theme').textContent).toBe('dark')
    })
  })
})
