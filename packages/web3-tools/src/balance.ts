import { ToolResult, BalanceData, EvmChainId } from './types'
import { EvmChainAdapter } from './chains'

/**
 * 获取 EVM 兼容链上钱包余额
 * @param chain - 链 ID（'ethereum', 'polygon', 'bsc'）
 * @param address - 钱包地址
 * @param rpcUrl - 可选的 RPC 节点地址
 */
export async function getBalance(
  chain: EvmChainId,
  address: string,
  rpcUrl?: string
): Promise<ToolResult<BalanceData>> {
  const adapter = new EvmChainAdapter(chain, rpcUrl)
  return adapter.getBalance(address)
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
