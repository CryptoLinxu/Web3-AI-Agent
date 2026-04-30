import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { ThemeProvider } from '@/lib/theme/ThemeProvider'

const renderWithProvider = (ui: React.ReactElement) => {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

describe('ThemeSwitcher', () => {
  it('应渲染 3 个主题按钮', () => {
    renderWithProvider(<ThemeSwitcher />)
    
    expect(screen.getByText('跟随系统')).toBeInTheDocument()
    expect(screen.getByText('浅色')).toBeInTheDocument()
    expect(screen.getByText('深色')).toBeInTheDocument()
  })

  it('当前主题应高亮', () => {
    renderWithProvider(<ThemeSwitcher />)
    
    // 默认主题是 dark，激活状态通过 aria-pressed 属性标识
    const darkButton = screen.getByText('深色').closest('button')
    expect(darkButton).toHaveAttribute('aria-pressed', 'true')
    
    // 其他主题应该是未激活状态
    const lightButton = screen.getByText('浅色').closest('button')
    expect(lightButton).toHaveAttribute('aria-pressed', 'false')
  })

  it('点击主题按钮应切换主题', async () => {
    const user = userEvent.setup()
    renderWithProvider(<ThemeSwitcher />)
    
    // 点击浅色主题
    await user.click(screen.getByText('浅色'))
    
    // 浅色主题应该被激活
    const lightButton = screen.getByText('浅色').closest('button')
    expect(lightButton).toHaveAttribute('aria-pressed', 'true')
    
    // 深色主题应该变为未激活
    const darkButton = screen.getByText('深色').closest('button')
    expect(darkButton).toHaveAttribute('aria-pressed', 'false')
  })
})
