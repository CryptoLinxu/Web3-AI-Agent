import { ethers } from 'ethers'
import { ToolResult, WalletBalanceData } from './types'

// 默认使用公共 RPC 节点或环境变量配置
const DEFAULT_RPC_URL = process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com'

/**
 * 获取以太坊钱包 ETH 余额
 * @param address - 以太坊地址
 * @param rpcUrl - 可选的 RPC 节点地址
 */
export async function getWalletBalance(
  address: string,
  rpcUrl?: string
): Promise<ToolResult<WalletBalanceData>> {
  try {
    // 验证地址格式
    if (!ethers.isAddress(address)) {
      return {
        success: false,
        error: '无效的以太坊地址格式',
        timestamp: new Date().toISOString(),
        source: 'Ethereum RPC',
      }
    }

    // 创建 provider
    const provider = new ethers.JsonRpcProvider(rpcUrl || DEFAULT_RPC_URL)

    // 查询余额
    const balance = await provider.getBalance(address)
    const balanceInEth = ethers.formatEther(balance)

    return {
      success: true,
      data: {
        address,
        balance: balanceInEth,
        unit: 'ETH',
      },
      timestamp: new Date().toISOString(),
      source: 'Ethereum RPC',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取余额失败',
      timestamp: new Date().toISOString(),
      source: 'Ethereum RPC',
    }
  }
}
