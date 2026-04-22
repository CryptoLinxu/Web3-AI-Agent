// EVM 兼容链配置

import { ChainConfig, EvmChainId } from '../types'

// 默认 RPC 节点（公共节点，可能有限流）
const DEFAULT_RPC_URLS: Record<EvmChainId, string[]> = {
  ethereum: [
    process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
    'https://rpc.ankr.com/eth',
  ],
  polygon: [
    process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
    'https://rpc.ankr.com/polygon',
  ],
  bsc: [
    process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
    'https://rpc.ankr.com/bsc',
  ],
}

// 链配置注册表
export const CHAIN_CONFIGS: Record<EvmChainId, ChainConfig> = {
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    nativeToken: 'ETH',
    chainId: 1,
    rpcUrls: DEFAULT_RPC_URLS.ethereum,
    explorerUrl: 'https://etherscan.io',
  },
  polygon: {
    id: 'polygon',
    name: 'Polygon',
    nativeToken: 'MATIC',
    chainId: 137,
    rpcUrls: DEFAULT_RPC_URLS.polygon,
    explorerUrl: 'https://polygonscan.com',
  },
  bsc: {
    id: 'bsc',
    name: 'BNB Smart Chain',
    nativeToken: 'BNB',
    chainId: 56,
    rpcUrls: DEFAULT_RPC_URLS.bsc,
    explorerUrl: 'https://bscscan.com',
  },
}

/**
 * 获取链配置
 * @param chainId - 链 ID
 * @returns 链配置
 */
export function getChainConfig(chainId: EvmChainId): ChainConfig {
  const config = CHAIN_CONFIGS[chainId]
  if (!config) {
    throw new Error(`不支持的链: ${chainId}`)
  }
  return config
}

/**
 * 获取链的 RPC URL
 * @param chainId - 链 ID
 * @param customRpcUrl - 可选的自定义 RPC URL
 * @returns RPC URL
 */
export function getRpcUrl(chainId: EvmChainId, customRpcUrl?: string): string {
  if (customRpcUrl) {
    return customRpcUrl
  }
  
  const config = getChainConfig(chainId)
  return config.rpcUrls[0] // 使用第一个 RPC
}
