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

export interface WalletBalanceData {
  address: string
  balance: string
  unit: string
}

export interface GasPriceData {
  gasPrice: string | null
  maxFeePerGas: string | null
  maxPriorityFeePerGas: string | null
  unit: string
}

// 工具函数类型
export type ToolFunction<TArgs = Record<string, unknown>, TResult = unknown> = (
  args: TArgs
) => Promise<ToolResult<TResult>>
