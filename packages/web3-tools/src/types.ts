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

// 非 EVM 链类型
export type NonEvmChainId = 'bitcoin' | 'solana'

// 统一链 ID 类型
export type ChainId = EvmChainId | NonEvmChainId

// 链配置（EVM）
export interface EvmChainConfig {
  id: EvmChainId
  name: string
  nativeToken: string  // 'ETH', 'MATIC', 'BNB'
  chainId: number      // 1, 137, 56
  rpcUrls: string[]
  explorerUrl: string
}

// 链配置（非 EVM）
export interface NonEvmChainConfig {
  id: NonEvmChainId
  name: string
  nativeToken: string  // 'BTC', 'SOL'
  apiUrls: string[]    // HTTP API URLs
  explorerUrl: string
}

// 统一链配置类型
export type ChainConfig = EvmChainConfig | NonEvmChainConfig

// 统一余额数据
export interface BalanceData {
  chain: ChainId
  address: string
  balance: string
  unit: string  // 'ETH', 'MATIC', 'BNB', 'BTC', 'SOL'
  decimals: number
}

// 统一 Gas 数据（仅 EVM 链支持）
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
