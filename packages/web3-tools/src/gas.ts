import { ethers } from 'ethers'
import { ToolResult, GasPriceData } from './types'

// 默认使用公共 RPC 节点或环境变量配置
const DEFAULT_RPC_URL = process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com'

/**
 * 获取当前 Gas 价格
 * @param rpcUrl - 可选的 RPC 节点地址
 */
export async function getGasPrice(rpcUrl?: string): Promise<ToolResult<GasPriceData>> {
  try {
    // 创建 provider
    const provider = new ethers.JsonRpcProvider(rpcUrl || DEFAULT_RPC_URL)

    // 获取 fee data
    const feeData = await provider.getFeeData()

    return {
      success: true,
      data: {
        gasPrice: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : null,
        maxFeePerGas: feeData.maxFeePerGas
          ? ethers.formatUnits(feeData.maxFeePerGas, 'gwei')
          : null,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
          ? ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei')
          : null,
        unit: 'Gwei',
      },
      timestamp: new Date().toISOString(),
      source: 'Ethereum RPC',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取 Gas 价格失败',
      timestamp: new Date().toISOString(),
      source: 'Ethereum RPC',
    }
  }
}
