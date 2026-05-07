/**
 * Solana 网络配置
 * 
 * 定义 Solana 主网、测试网的 RPC 端点和原生代币信息
 * 以及主流 SPL Token（USDT、USDC）的 Mint Address
 * 
 * 免费公共 RPC 提供商：
 * - Helius: https://mainnet.helius-rpc.com/?api-key=YOUR_KEY (免费 100K/月)
 * - QuickNode: https://example.solana-mainnet.quiknode.pro/ (免费试用)
 * - Alchemy: https://solana-mainnet.g.alchemy.com/v2/YOUR_KEY (免费 30M/月)
 * - 公共节点: https://api.mainnet-beta.solana.com (已限制，不推荐)
 */

export const SOLANA_CONFIG = {
  mainnet: {
    id: 'solana-mainnet',
    name: 'Solana',
    // 使用多个免费公共 RPC 节点作为 fallback
    // 官方公共节点已限制，建议使用 Helius/Alchemy 等免费 RPC
    endpoint: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 
              'https://rpc.ankr.com/solana', // Ankr 免费公共节点
    nativeCurrency: { name: 'SOL', symbol: 'SOL', decimals: 9 },
  },
  devnet: {
    id: 'solana-devnet',
    name: 'Solana Devnet',
    endpoint: 'https://api.devnet.solana.com',
    nativeCurrency: { name: 'SOL', symbol: 'SOL', decimals: 9 },
  },
} as const;

/**
 * Solana 主流 SPL Token 配置
 * Mint Address 可在 https://solscan.io/tokens 查询
 */
export const SOLANA_TOKENS = {
  SOL: { symbol: 'SOL', decimals: 9, isNative: true },
  USDT: {
    mintAddress: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    symbol: 'USDT',
    decimals: 6,
    isNative: false,
  },
  USDC: {
    mintAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    symbol: 'USDC',
    decimals: 6,
    isNative: false,
  },
} as const;

export type SolanaTokenSymbol = keyof typeof SOLANA_TOKENS;
