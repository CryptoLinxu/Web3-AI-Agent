// 工具结果类型定义

export interface ToolResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
  source: string
}

// 统一 Token 价格数据（支持多币种）
export interface TokenPriceData {
  symbol: string       // 'ETH', 'BTC', 'SOL', 'MATIC', 'BNB' 等
  price: number
  change24h: number
  currency: string     // 默认 'USD'
}

// 向后兼容别名
export type ETHPriceData = TokenPriceData
export type BTCPriceData = TokenPriceData

// EVM 兼容链类型
export type EvmChainId = 'ethereum' | 'polygon' | 'bsc'

// 链配置
export interface ChainConfig {
  id: EvmChainId
  name: string
  nativeToken: string  // 'ETH', 'MATIC', 'BNB'
  chainId: number      // 1, 137, 56
  rpcUrls: string[]
  explorerUrl: string
}

// 统一余额数据
export interface BalanceData {
  chain: EvmChainId
  address: string
  balance: string
  unit: string  // 'ETH', 'MATIC', 'BNB'
  decimals: number
}

// 统一 Gas 数据
export interface GasData {
  chain: EvmChainId
  gasPrice: string | null
  maxFeePerGas: string | null
  maxPriorityFeePerGas: string | null
  unit: string  // 'Gwei'
}

// 工具函数类型
export type ToolFunction<TArgs = Record<string, unknown>, TResult = unknown> = (
  args: TArgs
) => Promise<ToolResult<TResult>>
