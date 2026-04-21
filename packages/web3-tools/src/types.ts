// 工具结果类型定义

export interface ToolResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
  source: string
}

export interface ETHPriceData {
  price: number
  change24h: number
  currency: string
}

export interface BTCPriceData {
  price: number
  change24h: number
  currency: string
}

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
