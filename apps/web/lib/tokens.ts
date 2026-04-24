// Token 合约地址配置

export interface TokenConfig {
  symbol: string
  name: string
  address: string                 // 合约地址
  decimals: number
  logoUri?: string                // Token 图标 URL
}

export interface ChainTokens {
  [chainId: string]: {
    [symbol: string]: TokenConfig
  }
}

// 主流 Token 配置(以太坊主网)
export const TOKENS: ChainTokens = {
  ethereum: {
    USDT: {
      symbol: 'USDT',
      name: 'Tether USD',
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      decimals: 6,
      logoUri: 'https://assets.coingecko.com/coins/images/325/small/Tether-logo.png'
    },
    USDC: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      decimals: 6,
      logoUri: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
    },
    DAI: {
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      decimals: 18,
      logoUri: 'https://assets.coingecko.com/coins/images/9956/small/4943.png'
    }
  },
  polygon: {
    USDT: {
      symbol: 'USDT',
      name: 'Tether USD',
      address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      decimals: 6,
      logoUri: 'https://assets.coingecko.com/coins/images/325/small/Tether-logo.png'
    },
    USDC: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
      decimals: 6,
      logoUri: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
    }
  },
  bsc: {
    USDT: {
      symbol: 'USDT',
      name: 'Tether USD',
      address: '0x55d398326f99059fF775485246999027B3197955',
      decimals: 18,
      logoUri: 'https://assets.coingecko.com/coins/images/325/small/Tether-logo.png'
    },
    USDC: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
      decimals: 18,
      logoUri: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
    }
  }
}

// 获取 Token 配置
export function getTokenConfig(chain: string, symbol: string): TokenConfig | undefined {
  return TOKENS[chain]?.[symbol]
}

// 判断是否为原生币
export function isNativeToken(symbol: string): boolean {
  return ['ETH', 'MATIC', 'BNB'].includes(symbol.toUpperCase())
}
