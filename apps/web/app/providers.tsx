'use client'

import '@rainbow-me/rainbowkit/styles.css'
import '@solana/wallet-adapter-react-ui/styles.css'
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit'
import { WagmiProvider, type State } from 'wagmi'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { useState, useEffect, useMemo } from 'react'
import { getFullConfig } from './config'
import { useTheme } from '@/lib/theme/ThemeContext'
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { SOLANA_CONFIG } from '@/config/solana-chains'

export function Providers({ 
  children,
  initialState
}: { 
  children: React.ReactNode
  initialState?: State
}) {
  // 使用 getFullConfig 确保客户端有完整的 connector 列表（包括 walletConnect）
  const [config] = useState(() => getFullConfig())
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 30 * 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProviderWrapper>
          {/* Solana Provider 嵌套在 RainbowKit 内部 */}
          <SolanaWalletProviders>
            {children}
          </SolanaWalletProviders>
        </RainbowKitProviderWrapper>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

// 分离组件以使用 useTheme Hook
function RainbowKitProviderWrapper({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  // 等待 hydration 完成后才使用客户端实际主题，避免 SSR 与客户端主题不一致
  useEffect(() => {
    setMounted(true)
  }, [])

  const themeConfig = {
    accentColor: '#7C3AED',
    accentColorForeground: 'white',
    borderRadius: 'large' as const,
    fontStack: 'system' as const,
    overlayBlur: 'small' as const,
  }
  
  // SSR 和首次客户端渲染始终使用暗色主题，与服务器渲染一致
  const theme = mounted && resolvedTheme === 'light'
    ? lightTheme(themeConfig)
    : darkTheme(themeConfig)
  
  return (
    <RainbowKitProvider
      theme={theme}
      modalSize="compact"
    >
      {children}
    </RainbowKitProvider>
  )
}

// Solana 钱包 Provider 嵌套
function SolanaWalletProviders({ children }: { children: React.ReactNode }) {
  const endpoint = SOLANA_CONFIG.mainnet.endpoint
  
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ], [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  )
}
