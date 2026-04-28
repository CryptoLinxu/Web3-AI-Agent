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
    
    // 默认主题是 dark
    const darkButton = screen.getByText('深色').closest('button')
    expect(darkButton).toHaveClass('border-primary-500')
  })

  it('点击主题按钮应切换主题', async () => {
    const user = userEvent.setup()
    renderWithProvider(<ThemeSwitcher />)
    
    await user.click(screen.getByText('浅色'))
    expect(screen.getByText('浅色').closest('button')).toHaveClass('border-primary-500')
  })
})
