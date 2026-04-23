import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import { cookieToInitialState } from 'wagmi'
import './globals.css'
import { getConfig } from './config'
import { Providers } from './providers'
import { ThemeProvider } from '@/lib/theme/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Web3 AI Agent',
  description: '理解用户意图、调用 Web3 工具、返回可信结果的 AI Agent',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 从 cookie 中提取 wagmi 状态，实现跨页面刷新的连接持久化
  const initialState = cookieToInitialState(
    getConfig(),
    (await headers()).get('cookie')
  )

  return (
    <html lang="zh-CN">
      <head>
        {/* 内联脚本：在 React 执行前设置主题，避免闪烁 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                var theme = localStorage.getItem('web3-agent-theme') || 'dark';
                if (theme === 'system') {
                  theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                document.documentElement.setAttribute('data-theme', theme);
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <Providers initialState={initialState}>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
