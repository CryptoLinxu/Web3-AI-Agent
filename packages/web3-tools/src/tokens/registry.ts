// Token 元数据注册表

import { EvmChainId } from '../types'

export interface TokenEntry {
  chain: EvmChainId
  symbol: string
  name: string
  decimals: number
  contractAddress: string
  logoUri?: string
}

// 主流 Token 注册表
export const TOKEN_REGISTRY: TokenEntry[] = [
  // Ethereum 主网
  {
    chain: 'ethereum',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    logoUri: 'https://assets.coingecko.com/coins/images/325/small/Tether-logo.png',
  },
  {
    chain: 'ethereum',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    logoUri: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
  },
  {
    chain: 'ethereum',
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    contractAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
    logoUri: 'https://assets.coingecko.com/coins/images/9956/small/4943.png',
  },
  {
    chain: 'ethereum',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    contractAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  },
  {
    chain: 'ethereum',
    symbol: 'UNI',
    name: 'Uniswap',
    decimals: 18,
    contractAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
    logoUri: 'https://assets.coingecko.com/coins/images/12504/small/uni.jpg',
  },

  // Polygon
  {
    chain: 'polygon',
    symbol: 'USDT',
    name: 'Tether USD (Polygon)',
    decimals: 6,
    contractAddress: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
  },
  {
    chain: 'polygon',
    symbol: 'USDC',
    name: 'USD Coin (Polygon)',
    decimals: 6,
    contractAddress: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
  },
  {
    chain: 'polygon',
    symbol: 'WMATIC',
    name: 'Wrapped Matic',
    decimals: 18,
    contractAddress: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
  },

  // BSC
  {
    chain: 'bsc',
    symbol: 'USDT',
    name: 'Tether USD (BSC)',
    decimals: 18,
    contractAddress: '0x55d398326f99059ff775485246999027b3197955',
  },
  {
    chain: 'bsc',
    symbol: 'USDC',
    name: 'USD Coin (BSC)',
    decimals: 18,
    contractAddress: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
  },
  {
    chain: 'bsc',
    symbol: 'WBNB',
    name: 'Wrapped BNB',
    decimals: 18,
    contractAddress: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
  },
]

/**
 * 查询 Token 信息
 * @param chain - 链 ID
 * @param symbolOrAddress - Token 符号或合约地址
 * @returns Token 信息
 */
export function findToken(
  chain: EvmChainId,
  symbolOrAddress: string
): TokenEntry | undefined {
  const normalizedInput = symbolOrAddress.trim()

  // 优先按符号查找
  const bySymbol = TOKEN_REGISTRY.find(
    (token) =>
      token.chain === chain &&
      token.symbol.toLowerCase() === normalizedInput.toLowerCase()
  )

  if (bySymbol) {
    return bySymbol
  }

  // 按合约地址查找
  const byAddress = TOKEN_REGISTRY.find(
    (token) =>
      token.chain === chain &&
      token.contractAddress.toLowerCase() === normalizedInput.toLowerCase()
  )

  return byAddress
}

/**
 * 获取指定链的所有 Token
 * @param chain - 链 ID
 * @returns Token 列表
 */
export function getTokensByChain(chain: EvmChainId): TokenEntry[] {
  return TOKEN_REGISTRY.filter((token) => token.chain === chain)
}
