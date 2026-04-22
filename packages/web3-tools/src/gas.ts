import { ToolResult, GasData, EvmChainId } from './types'
import { EvmChainAdapter } from './chains'

/**
 * 获取 EVM 兼容链的 Gas 价格
 * @param chain - 链 ID（'ethereum', 'polygon', 'bsc'）
 * @param rpcUrl - 可选的 RPC 节点地址
 */
export async function getGasPrice(
  chain: EvmChainId,
  rpcUrl?: string
): Promise<ToolResult<GasData>> {
  const adapter = new EvmChainAdapter(chain, rpcUrl)
  return adapter.getGasPrice()
}

/**
 * @deprecated 使用 getGasPrice('ethereum') 替代
 */
export async function getEthGasPrice(rpcUrl?: string): Promise<ToolResult<GasData>> {
  return getGasPrice('ethereum', rpcUrl)
}
