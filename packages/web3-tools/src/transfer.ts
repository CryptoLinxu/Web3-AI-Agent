// 转账工具函数

import { createPublicClient, http, parseEther, formatEther, type Chain } from 'viem'
import { mainnet, polygon, bsc } from 'viem/chains'
import { ToolResult, EvmChainId, ChainConfig } from './types'
import { getChainConfig } from './chains'

const CHAIN_MAP: Record<EvmChainId, Chain> = {
  ethereum: mainnet,
  polygon: polygon,
  bsc: bsc
}

/**
 * 估算转账所需的 Gas
 */
export async function estimateTransferGas(
  chain: EvmChainId,
  from: string,
  to: string,
  amount: string,
  tokenAddress?: string
): Promise<ToolResult<{ gasEstimate: string; feeInETH: string }>> {
  try {
    const chainConfig = getChainConfig(chain) as ChainConfig
    if (!chainConfig || !('rpcUrls' in chainConfig)) {
      return {
        success: false,
        error: '不支持的链',
        timestamp: new Date().toISOString(),
        source: 'web3-tools'
      }
    }

    const client = createPublicClient({
      chain: CHAIN_MAP[chain],
      transport: http(chainConfig.rpcUrls[0])
    })

    let gasEstimate: bigint

    if (tokenAddress) {
      // ERC20 转账需要估算合约调用的 Gas
      // 这里使用简化的估算值(实际应该调用合约的 transfer 方法)
      gasEstimate = BigInt(65000) // ERC20 transfer 大约 65000 gas
    } else {
      // ETH 原生转账
      gasEstimate = await client.estimateGas({
        account: from as `0x${string}`,
        to: to as `0x${string}`,
        value: parseEther(amount)
      })
    }

    // 获取 Gas 价格
    const gasPrice = await client.getGasPrice()
    
    // 计算总费用(ETH)
    const totalFeeWei = gasEstimate * gasPrice
    const feeInETH = formatEther(totalFeeWei)

    return {
      success: true,
      data: {
        gasEstimate: gasEstimate.toString(),
        feeInETH
      },
      timestamp: new Date().toISOString(),
      source: 'web3-tools'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gas 估算失败',
      timestamp: new Date().toISOString(),
      source: 'web3-tools'
    }
  }
}

/**
 * 验证地址格式
 */
export function validateAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * 获取区块链浏览器链接
 */
export function getExplorerUrl(chain: EvmChainId, txHash: string): string {
  const chainConfig = getChainConfig(chain) as ChainConfig
  if (!chainConfig || !('explorerUrl' in chainConfig)) {
    return ''
  }
  
  return `${chainConfig.explorerUrl}/tx/${txHash}`
}
