import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { ThemeProvider, getThemeInitScript } from './ThemeProvider'
import { useTheme } from './ThemeContext'

describe('getThemeInitScript', () => {
  it('应生成包含主题初始化代码的字符串', () => {
    const script = getThemeInitScript()
    expect(script).toContain('localStorage')
    expect(script).toContain('web3-agent-theme')
    expect(script).toContain('document.documentElement')
  })

  it('应包含 dark 为默认主题的逻辑', () => {
    const script = getThemeInitScript()
    expect(script).toContain("'dark'")
  })
})

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    // 清除 DOM 上的类名和 data-theme
    document.documentElement.classList.remove('dark')
    document.documentElement.removeAttribute('data-theme')
  })

  it('应渲染子组件', () => {
    render(
      <ThemeProvider>
        <div data-testid="child">Hello</div>
      </ThemeProvider>
    )
    expect(screen.getByTestId('child')).toBeDefined()
    expect(screen.getByText('Hello')).toBeDefined()
  })

  it('默认主题应为 dark', () => {
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

    expect(screen.getByTestId('theme').textContent).toBe('dark')
    expect(screen.getByTestId('resolved').textContent).toBe('dark')
  })

  it('初始化时应在 document 上设置 dark 类名和 data-theme', () => {
    render(
      <ThemeProvider>
        <div>test</div>
      </ThemeProvider>
    )

    // useEffect 是异步的，但会在 render 后很快执行
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('应支持 setTheme 切换为 light', () => {
    function TestComponent() {
      const { theme, setTheme } = useTheme()
      return (
        <div>
          <span data-testid="theme">{theme}</span>
          <button data-testid="btn-light" onClick={() => setTheme('light')}>
            浅色
          </button>
        </div>
      )
    }

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme').textContent).toBe('dark')

    act(() => {
      screen.getByTestId('btn-light').click()
    })

    expect(screen.getByTestId('theme').textContent).toBe('light')
  })

  it('切换主题时应更新 localStorage', () => {
    function TestComponent() {
      const { setTheme } = useTheme()
      return (
        <div>
          <button data-testid="btn-light" onClick={() => setTheme('light')}>
            浅色
          </button>
        </div>
      )
    }

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    act(() => {
      screen.getByTestId('btn-light').click()
    })

    expect(localStorage.getItem('web3-agent-theme')).toBe('light')
  })
})
