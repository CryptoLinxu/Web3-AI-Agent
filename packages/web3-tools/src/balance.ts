import { ToolResult, BalanceData, ChainId, EvmChainId } from './types'
import { EvmChainAdapter, BitcoinAdapter, SolanaAdapter } from './chains'

/**
 * 获取指定链上钱包余额
 * @param chain - 链 ID（'ethereum', 'polygon', 'bsc', 'bitcoin', 'solana'）
 * @param address - 钱包地址
 * @param rpcUrl - 可选的 RPC 节点地址（仅 EVM/Solana 有效）
 */
export async function getBalance(
  chain: ChainId,
  address: string,
  rpcUrl?: string
): Promise<ToolResult<BalanceData>> {
  console.log(`[getBalance] 调用参数: chain=${chain}, address=${address}${rpcUrl ? `, rpcUrl=${rpcUrl}` : ''}`)
  
  // 根据链类型选择适配器
  if (isEvmChain(chain)) {
    const adapter = new EvmChainAdapter(chain, rpcUrl)
    const result = await adapter.getBalance(address)
    console.log(`[getBalance] 返回: ${JSON.stringify({ chain, unit: result.data?.unit, balance: result.data?.balance }, null, 2)}`)
    return result
  }

  if (chain === 'bitcoin') {
    const adapter = new BitcoinAdapter()
    return adapter.getBalance(address)
  }

  if (chain === 'solana') {
    const adapter = new SolanaAdapter(rpcUrl)
    return adapter.getBalance(address)
  }

  // 不支持的链
  return {
    success: false,
    error: `不支持的链: ${chain}`,
    timestamp: new Date().toISOString(),
    source: 'Local',
  }
}

/**
 * 判断是否为 EVM 链
 */
function isEvmChain(chain: ChainId): chain is EvmChainId {
  return ['ethereum', 'polygon', 'bsc'].includes(chain)
}

/**
 * @deprecated 使用 getBalance('ethereum', address) 替代
 */
export async function getWalletBalance(
  address: string,
  rpcUrl?: string
): Promise<ToolResult<BalanceData>> {
  return getBalance('ethereum', address, rpcUrl)
}
