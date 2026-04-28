import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog } from '@/components/ConfirmDialog'

describe('ConfirmDialog', () => {
  it('isOpen=false 时不渲染', () => {
    render(
      <ConfirmDialog
        isOpen={false}
        title="确认"
        message="确定吗？"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    
    expect(screen.queryByText('确认')).not.toBeInTheDocument()
  })

  it('isOpen=true 时渲染弹窗内容', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="删除确认"
        message="确定要删除吗？"
        confirmText="删除"
        cancelText="取消"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    
    expect(screen.getByText('删除确认')).toBeInTheDocument()
    expect(screen.getByText('确定要删除吗？')).toBeInTheDocument()
    expect(screen.getByText('删除')).toBeInTheDocument()
    expect(screen.getByText('取消')).toBeInTheDocument()
  })

  it('点击确认按钮应触发 onConfirm', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    const user = userEvent.setup()
    
    render(
      <ConfirmDialog
        isOpen={true}
        title="确认操作"
        message="确定吗？"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )
    
    // 使用更精确的查询 - 按钮在底部
    const buttons = screen.getAllByRole('button')
    const confirmButton = buttons.find(btn => btn.textContent === '确认')
    await user.click(confirmButton!)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('点击取消按钮应触发 onCancel', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    const user = userEvent.setup()
    
    render(
      <ConfirmDialog
        isOpen={true}
        title="确认"
        message="确定吗？"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )
    
    await user.click(screen.getByText('取消'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('默认 variant 应为 danger', () => {
    const { container } = render(
      <ConfirmDialog
        isOpen={true}
        title="确认"
        message="确定吗？"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    
    // 确认按钮应该是红色（danger）
    const confirmButton = screen.getByRole('button', { name: '确认' })
    expect(confirmButton.className).toContain('bg-red-600')
  })

  it('isLoading 时按钮应禁用并显示 loading', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="处理中"
        message="请等待..."
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        isLoading={true}
      />
    )
    
    expect(screen.getByText('处理中...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '处理中...' })).toBeDisabled()
  })
})
