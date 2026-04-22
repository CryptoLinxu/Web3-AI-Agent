// EVM 兼容链适配器

import { ethers } from 'ethers'
import { ToolResult, BalanceData, GasData, EvmChainId } from '../types'
import { getChainConfig, getRpcUrl } from './config'

/**
 * EVM 链适配器
 * 提供统一的余额查询、Gas 查询和地址验证功能
 */
export class EvmChainAdapter {
  private config: ReturnType<typeof getChainConfig>
  private provider: ethers.JsonRpcProvider

  constructor(private chainId: EvmChainId, customRpcUrl?: string) {
    this.config = getChainConfig(chainId)
    const rpcUrl = getRpcUrl(chainId, customRpcUrl)
    this.provider = new ethers.JsonRpcProvider(rpcUrl)
  }

  /**
   * 获取钱包余额
   * @param address - 钱包地址
   * @returns 余额数据
   */
  async getBalance(address: string): Promise<ToolResult<BalanceData>> {
    try {
      // 验证地址格式
      if (!this.validateAddress(address)) {
        return {
          success: false,
          error: `无效的 ${this.config.name} 地址格式`,
          timestamp: new Date().toISOString(),
          source: this.config.name,
        }
      }

      // 查询余额
      const balance = await this.provider.getBalance(address)
      const balanceInEth = ethers.formatEther(balance)

      return {
        success: true,
        data: {
          chain: this.chainId,
          address,
          balance: balanceInEth,
          unit: this.config.nativeToken,
          decimals: 18, // EVM 链原生 Token 都是 18 位精度
        },
        timestamp: new Date().toISOString(),
        source: this.config.name,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取余额失败',
        timestamp: new Date().toISOString(),
        source: this.config.name,
      }
    }
  }

  /**
   * 获取 Gas 价格
   * @returns Gas 数据
   */
  async getGasPrice(): Promise<ToolResult<GasData>> {
    try {
      // 获取 fee data
      const feeData = await this.provider.getFeeData()

      return {
        success: true,
        data: {
          chain: this.chainId,
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
        source: this.config.name,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取 Gas 价格失败',
        timestamp: new Date().toISOString(),
        source: this.config.name,
      }
    }
  }

  /**
   * 验证地址格式
   * @param address - 钱包地址
   * @returns 是否有效
   */
  validateAddress(address: string): boolean {
    try {
      return ethers.isAddress(address)
    } catch {
      return false
    }
  }
}
