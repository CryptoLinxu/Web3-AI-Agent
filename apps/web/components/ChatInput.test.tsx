import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatInput from '@/components/ChatInput'

describe('ChatInput', () => {
  it('应渲染文本输入框和发送按钮', () => {
    render(<ChatInput onSend={vi.fn()} isLoading={false} />)
    
    expect(screen.getByPlaceholderText(/问我任何 Web3 问题/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /发送消息/ })).toBeInTheDocument()
  })

  it('输入后按 Enter 应触发 onSend', async () => {
    const onSend = vi.fn()
    const user = userEvent.setup()
    
    render(<ChatInput onSend={onSend} isLoading={false} />)
    
    const textarea = screen.getByPlaceholderText(/问我任何 Web3 问题/)
    await user.type(textarea, 'Hello Web3')
    await user.keyboard('{Enter}')
    
    expect(onSend).toHaveBeenCalledWith('Hello Web3')
  })

  it('Shift+Enter 不应触发 onSend', async () => {
    const onSend = vi.fn()
    const user = userEvent.setup()
    
    render(<ChatInput onSend={onSend} isLoading={false} />)
    
    const textarea = screen.getByPlaceholderText(/问我任何 Web3 问题/)
    await user.type(textarea, 'Hello{Shift>}{Enter}{/Shift}')
    
    expect(onSend).not.toHaveBeenCalled()
  })

  it('空输入时按钮应禁用', async () => {
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} isLoading={false} />)
    
    // 使用更精确的查询，避免匹配到提示词模板按钮
    const button = screen.getByRole('button', { name: /发送消息/ })
    expect(button).toBeDisabled()
  })

  it('isLoading 时按钮应禁用', () => {
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} isLoading={true} />)
    
    const textarea = screen.getByPlaceholderText(/问我任何 Web3 问题/)
    expect(textarea).toBeDisabled()
    
    const button = screen.getByRole('button', { name: /发送消息/ })
    expect(button).toBeDisabled()
  })
})
