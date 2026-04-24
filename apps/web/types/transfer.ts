// 转账功能类型定义

export type TransferStatus = 'pending' | 'approving' | 'signing' | 'confirmed' | 'failed'

export type ChainId = 'ethereum' | 'polygon' | 'bsc'

export interface TransferData {
  id: string                      // 卡片 ID(前端生成)
  from: string                    // 发送地址
  to: string                      // 接收地址
  tokenSymbol: string             // 'ETH', 'USDT', 'USDC'
  tokenAddress?: string           // ERC20 合约地址(原生币为 undefined)
  amount: string                  // 转账金额(字符串避免精度丢失)
  chain: ChainId                  // 链标识
  status: TransferStatus          // 当前状态
  txHash?: string                 // 交易哈希
  error?: string                  // 错误信息
  estimatedGas?: string           // 预估 Gas(可选)
}
