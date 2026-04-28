import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MarkdownRenderer from '@/components/MarkdownRenderer'

describe('MarkdownRenderer', () => {
  it('应渲染纯文本', () => {
    render(<MarkdownRenderer content="Hello World" />)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('应渲染标题', () => {
    const { container } = render(<MarkdownRenderer content="# Main Title" />)
    // 检查 h1 元素
    const h1 = container.querySelector('h1')
    expect(h1).toBeInTheDocument()
    expect(h1).toHaveTextContent('Main Title')
  })

  it('应渲染列表', () => {
    render(<MarkdownRenderer content="- Item 1\n\n- Item 2" />)
    // 检查渲染了 ul 和 li 元素
    const list = screen.getByRole('list')
    expect(list).toBeInTheDocument()
    expect(list.children.length).toBeGreaterThanOrEqual(1)
  })

  it('应渲染链接并设置 target=_blank', () => {
    render(<MarkdownRenderer content="[Click here](https://example.com)" />)
    const link = screen.getByText('Click here')
    expect(link).toHaveAttribute('href', 'https://example.com')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('应渲染代码块', () => {
    render(<MarkdownRenderer content="`inline code`" />)
    expect(screen.getByText('inline code')).toBeInTheDocument()
  })

  it('空内容应正常渲染', () => {
    const { container } = render(<MarkdownRenderer content="" />)
    expect(container.firstChild).toBeInTheDocument()
  })
})
