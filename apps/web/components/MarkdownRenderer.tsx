'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        // 段落
        p: ({ children }) => (
          <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
        ),
        // 标题
        h1: ({ children }) => (
          <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0 text-[rgb(var(--text-primary))]">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-lg font-bold mb-2 mt-3 first:mt-0 text-[rgb(var(--text-primary))]">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-bold mb-2 mt-2 first:mt-0 text-[rgb(var(--text-primary))]">{children}</h3>
        ),
        // 列表
        ul: ({ children }) => (
          <ul className="list-disc list-outside ml-4 mb-2 space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-outside ml-4 mb-2 space-y-1">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="leading-relaxed">{children}</li>
        ),
        // 加粗/斜体
        strong: ({ children }) => (
          <strong className="font-bold text-[rgb(var(--text-primary))]">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-primary-500">{children}</em>
        ),
        // 代码
        code: ({ className, children, ...props }) => {
          const isInline = !className
          if (isInline) {
            return (
              <code
                className="bg-[rgb(var(--bg-tertiary))] text-primary-600 px-1.5 py-0.5 rounded text-[0.85em] font-mono"
                {...props}
              >
                {children}
              </code>
            )
          }
          return (
            <code className={`${className || ''} block`} {...props}>
              {children}
            </code>
          )
        },
        pre: ({ children }) => (
          <pre className="bg-[rgb(var(--bg-tertiary))] rounded-lg p-4 my-2 overflow-x-auto border border-[rgb(var(--border-color))]">
            {children}
          </pre>
        ),
        // 链接
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:text-primary-500 underline underline-offset-2 transition-colors"
          >
            {children}
          </a>
        ),
        // 引用
        blockquote: ({ children }) => (
          <blockquote className="border-l-3 border-primary-500/50 pl-3 my-2 text-[rgb(var(--text-secondary))] italic">
            {children}
          </blockquote>
        ),
        // 分割线
        hr: () => (
          <hr className="border-[rgb(var(--border-color))] my-3" />
        ),
        // 表格
        table: ({ children }) => (
          <div className="overflow-x-auto my-2">
            <table className="min-w-full border-collapse border border-[rgb(var(--border-color))] rounded">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-[rgb(var(--bg-secondary))]">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="border border-[rgb(var(--border-color))] px-3 py-2 text-left text-sm font-semibold text-primary-600">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-[rgb(var(--border-color))] px-3 py-2 text-sm text-[rgb(var(--text-primary))]">{children}</td>
        ),
      }}
    >
      {content}
      </ReactMarkdown>
    </div>
  )
}
