import { createConfig, http, cookieStorage, createStorage } from 'wagmi'
import { mainnet, polygon, bsc } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
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
const connectors = connectorsForWallets(
  [
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
  ],
  {
    appName: 'Web3 AI Agent',
    projectId,
  }
)

export function getConfig() {
  return createConfig({
    chains: [mainnet, polygon, bsc],
    ssr: true, // 开启 SSR 支持，允许客户端 hydration 恢复状态
    connectors: [
      // SSR 阶段只创建 injected connector
      // walletConnect 在 SSR 会访问 indexedDB，所以只在客户端初始化
      injected({ shimDisconnect: true }),
    ],
    storage: createStorage({
      storage: cookieStorage, // 使用 cookie 持久化，支持 SSR 传递状态
    }),
    transports: {
      [mainnet.id]: http('https://eth.llamarpc.com'),  // 支持 CORS 的公共 RPC
      [polygon.id]: http('https://polygon.llamarpc.com'),
      [bsc.id]: http('https://bsc.llamarpc.com'),
    },
  })
}

// 客户端完整配置（包含所有钱包选项）
export function getFullConfig() {
  if (typeof window === 'undefined') {
    // SSR 阶段返回基础配置
    return getConfig()
  }

  return createConfig({
    chains: [mainnet, polygon, bsc],
    ssr: true,
    connectors,  // 使用自定义钱包列表
    storage: createStorage({
      storage: cookieStorage,
    }),
    transports: {
      [mainnet.id]: http('https://eth.llamarpc.com'),  // 支持 CORS 的公共 RPC
      [polygon.id]: http('https://polygon.llamarpc.com'),
      [bsc.id]: http('https://bsc.llamarpc.com'),
    },
  })
}
