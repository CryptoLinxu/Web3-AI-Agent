'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Image from 'next/image'

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
            <p className="mb-2 last:mb-0 leading-[1.7] text-[rgb(var(--text-primary))]">{children}</p>
          ),
          // 标题
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0 tracking-tight text-gradient">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold mb-2 mt-3 first:mt-0 tracking-tight text-[rgb(var(--text-primary))] flex items-center gap-2">
              <span
                className="inline-block w-1 h-4 rounded-full"
                style={{
                  background:
                    'linear-gradient(180deg, rgb(var(--accent-cyan)), rgb(var(--accent-violet)))',
                }}
              />
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-bold mb-2 mt-2 first:mt-0 tracking-tight text-[rgb(var(--text-primary))]">
              {children}
            </h3>
          ),
          // 列表
          ul: ({ children }) => (
            <ul className="list-disc list-outside ml-5 mb-2 space-y-1 marker:text-[rgb(var(--accent-cyan))]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside ml-5 mb-2 space-y-1 marker:text-[rgb(var(--accent-violet))] marker:font-semibold">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed pl-1">{children}</li>,
          // 加粗/斜体
          strong: ({ children }) => (
            <strong className="font-bold text-[rgb(var(--text-primary))]">{children}</strong>
          ),
          em: ({ children }) => <em className="italic text-gradient font-semibold">{children}</em>,
          // 代码
          code: ({ className, children, ...props }) => {
            const isInline = !className
            if (isInline) {
              return (
                <code
                  className="mx-0.5 px-1.5 py-0.5 rounded-md text-[0.85em] font-mono font-medium align-[0.05em]"
                  style={{
                    background: 'rgba(6, 182, 212, 0.1)',
                    color: 'rgb(var(--accent-cyan-light))',
                    border: '1px solid rgba(6, 182, 212, 0.2)',
                  }}
                  {...props}
                >
                  {children}
                </code>
              )
            }
            return (
              <code className={`${className || ''} block font-mono text-sm`} {...props}>
                {children}
              </code>
            )
          },
          pre: ({ children }) => (
            <pre
              className="relative rounded-xl p-4 my-2.5 overflow-x-auto text-sm"
              style={{
                background: 'rgba(var(--bg-tertiary), 0.8)',
                border: '1px solid rgba(var(--border-color), 0.6)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
              }}
            >
              {children}
            </pre>
          ),
          // 链接
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 font-medium underline underline-offset-2 decoration-[rgba(6,182,212,0.4)] hover:decoration-[rgb(var(--accent-violet))] transition-all duration-200"
              style={{ color: 'rgb(var(--accent-cyan))' }}
            >
              {children}
              <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ),
          // 引用
          blockquote: ({ children }) => (
            <blockquote
              className="relative pl-4 pr-3 py-2 my-2.5 rounded-r-lg italic"
              style={{
                background:
                  'linear-gradient(90deg, rgba(139,92,246,0.06), transparent)',
                color: 'rgb(var(--text-secondary))',
              }}
            >
              <span
                className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full"
                style={{
                  background:
                    'linear-gradient(180deg, rgb(var(--accent-cyan)), rgb(var(--accent-violet)))',
                }}
              />
              {children}
            </blockquote>
          ),
          // 分割线
          hr: () => (
            <hr
              className="my-4 border-0 h-px"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(var(--border-color),0.8), transparent)',
              }}
            />
          ),
          // 表格
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-xl glass-subtle">
              <table className="min-w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead
              style={{
                background:
                  'linear-gradient(90deg, rgba(6,182,212,0.08), rgba(139,92,246,0.08))',
              }}
            >
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-[rgb(var(--text-secondary))] border-b border-[rgb(var(--border-color))]">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-sm text-[rgb(var(--text-primary))] border-b border-[rgba(var(--border-color),0.4)]">
              {children}
            </td>
          ),
          // 图片
          img: ({ src, alt }) => {
            if (!src) return null

            // logo / icon / 空 alt → 行内 token 图标
            if (
              alt?.toLowerCase().includes('logo') ||
              alt?.toLowerCase().includes('icon') ||
              !alt
            ) {
              return (
                <span className="inline-flex items-center gap-1 align-middle" style={{ verticalAlign: 'middle' }}>
                  <span
                    className="relative inline-block w-4 h-4 align-middle"
                    style={{ display: 'inline-block', verticalAlign: 'middle' }}
                  >
                    <Image
                      src={src}
                      alt={alt || 'token logo'}
                      fill
                      className="object-contain"
                      style={{ verticalAlign: 'middle' }}
                      unoptimized
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  </span>
                </span>
              )
            }

            // 默认图片渲染
            return (
              <span className="inline-block">
                <Image
                  src={src}
                  alt={alt || 'image'}
                  width={200}
                  height={200}
                  className="rounded-lg max-w-full h-auto"
                  unoptimized
                />
              </span>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
