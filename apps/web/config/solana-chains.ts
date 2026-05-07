/**
 * Solana 网络配置
 * 
 * 定义 Solana 主网、测试网的 RPC 端点和原生代币信息
 * 以及主流 SPL Token（USDT、USDC）的 Mint Address
 */

export const SOLANA_CONFIG = {
  mainnet: {
    id: 'solana-mainnet',
    name: 'Solana',
    endpoint: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
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
