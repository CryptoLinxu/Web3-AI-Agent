// 转账功能类型定义

export type TransferStatus = 'pending' | 'approving' | 'signing' | 'confirmed' | 'failed'

export type ChainId = 'ethereum' | 'polygon' | 'bsc' | 'solana'

export interface TransferData {
  id: string                      // 卡片 ID(前端生成)
  from: string                    // 发送地址 (EVM: 0x..., Solana: Base58)
  to: string                      // 接收地址 (EVM: 0x..., Solana: Base58)
  tokenSymbol: string             // 'ETH', 'USDT', 'USDC', 'SOL'
  tokenAddress?: string           // EVM: ERC20 合约地址, Solana: Mint Address
  amount: string                  // 转账金额(字符串避免精度丢失)
  chain: ChainId                  // 链标识 ('ethereum' | 'polygon' | 'bsc' | 'solana')
  status: TransferStatus          // 当前状态
  txHash?: string                 // 交易哈希 (EVM: tx hash, Solana: signature)
  error?: string                  // 错误信息
  estimatedGas?: string           // 预估 Gas(可选)
}
