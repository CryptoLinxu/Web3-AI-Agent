import { createConfig, http, cookieStorage, createStorage } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { mainnet, polygon, bsc } from 'wagmi/chains'
import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import {
  metaMaskWallet,
  walletConnectWallet,
  injectedWallet,
  coinbaseWallet,
  okxWallet,
  binanceWallet,
  trustWallet,
  rabbyWallet,
  phantomWallet,
} from '@rainbow-me/rainbowkit/wallets'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id'

// 自定义钱包列表配置
const walletList = [
  {
    groupName: '推荐钱包',
    wallets: [
      metaMaskWallet,      // MetaMask（最流行）
      walletConnectWallet, // WalletConnect（扫码通用）
      coinbaseWallet,      // Coinbase/Base（智能钱包）
    ],
  },
  {
    groupName: '其他钱包',
    wallets: [
      okxWallet,           // OKX（国内常用）
      binanceWallet,       // Binance
      rabbyWallet,         // Rabby（多链支持）
      phantomWallet,       // Phantom
      trustWallet,         // Trust Wallet
      injectedWallet,      // 其他注入钱包
    ],
  },
]

export function getConfig() {
  // SSR 阶段使用基础 wagmi 配置，避免 indexedDB 访问
  return createConfig({
    chains: [mainnet, polygon, bsc],
    ssr: true,
    connectors: [
      injected({ shimDisconnect: true }),
    ],
    storage: createStorage({
      storage: cookieStorage,
    }),
    transports: {
      [mainnet.id]: http('https://eth.llamarpc.com'),
      [polygon.id]: http('https://polygon.llamarpc.com'),
      [bsc.id]: http('https://bsc.llamarpc.com'),
    },
  })
}

// 客户端完整配置（包含所有钱包选项）
export function getFullConfig() {
  if (typeof window === 'undefined') {
    return getConfig()
  }

  // 客户端使用 RainbowKit 的 connectorsForWallets
  const connectors = connectorsForWallets(walletList, {
    appName: 'Web3 AI Agent',
    projectId,
  })

  return createConfig({
    chains: [mainnet, polygon, bsc],
    ssr: true,
    connectors,
    storage: createStorage({
      storage: cookieStorage,
    }),
    transports: {
      [mainnet.id]: http('https://eth.llamarpc.com'),
      [polygon.id]: http('https://polygon.llamarpc.com'),
      [bsc.id]: http('https://bsc.llamarpc.com'),
    },
  })
}
