import { createConfig, http, cookieStorage, createStorage } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { walletConnect, injected } from 'wagmi/connectors'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id'

export function getConfig() {
  return createConfig({
    chains: [mainnet, sepolia],
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
      [mainnet.id]: http(),
      [sepolia.id]: http(),
    },
  })
}

// 客户端完整配置（包含 walletConnect）
export function getFullConfig() {
  if (typeof window === 'undefined') {
    // SSR 阶段返回基础配置
    return getConfig()
  }

  return createConfig({
    chains: [mainnet, sepolia],
    ssr: true,
    connectors: [
      // 客户端添加 walletConnect
      walletConnect({
        projectId,
        metadata: {
          name: 'Web3 AI Agent',
          description: 'Web3 AI Agent DApp',
          url: window.location.origin,
          icons: [],
        },
        showQrModal: true,
      }),
      injected({ shimDisconnect: true }),
    ],
    storage: createStorage({
      storage: cookieStorage,
    }),
    transports: {
      [mainnet.id]: http(),
      [sepolia.id]: http(),
    },
  })
}
