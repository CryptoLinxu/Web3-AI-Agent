/**
 * EVM 转账适配器
 * 
 * 封装现有的 Wagmi 逻辑，实现 TransferAdapter 接口
 * 支持 Ethereum、Polygon、BSC 等 EVM 兼容链
 * 
 * 功能：
 * - ETH/MATIC/BNB 原生代币转账
 * - ERC20 Token 转账（含 Approve 流程）
 * - 余额查询
 * - Gas 估算
 * - 地址校验
 */

import { TransferAdapter, TransferParams, TransferReceipt, FeeEstimate, NetworkConfig } from '../TransferAdapter'
import { isAddress, getAddress } from 'viem'

// EVM 网络配置
const EVM_NETWORKS: NetworkConfig[] = [
  {
    id: 'eth-mainnet',
    name: 'Ethereum',
    nativeCurrency: { symbol: 'ETH', decimals: 18 },
  },
  {
    id: 'polygon-mainnet',
    name: 'Polygon',
    nativeCurrency: { symbol: 'MATIC', decimals: 18 },
  },
  {
    id: 'bsc-mainnet',
    name: 'BSC',
    nativeCurrency: { symbol: 'BNB', decimals: 18 },
  },
]

/**
 * EVM 转账适配器实现
 * 
 * 注意：由于 wagmi 必须在 React 组件中使用 hooks，
 * 此适配器提供网络配置和地址校验等纯函数功能
 * 实际转账由 TransferCard 直接使用 wagmi hooks 完成
 */
export class EVMAdapter extends TransferAdapter {
  private chainId: number

  constructor(chainId: number = 1) {
    super()
    this.chainId = chainId
  }

  getNetworkId(): string {
    const network = EVM_NETWORKS.find((_, index) => {
      const chainIds = [1, 137, 56]
      return chainIds[index] === this.chainId
    })
    return network?.id || 'eth-mainnet'
  }

  getNetworks(): NetworkConfig[] {
    return EVM_NETWORKS
  }

  async getBalance(address: string, token?: string): Promise<string> {
    // 余额查询需要 wagmi hooks，在 TransferCard 中实现
    throw new Error('getBalance 必须在 React 组件中通过 wagmi hooks 调用')
  }

  async sendTransfer(params: TransferParams): Promise<TransferReceipt> {
    // 转账需要 wagmi hooks，在 TransferCard 中实现
    throw new Error('sendTransfer 必须在 React 组件中通过 wagmi hooks 调用')
  }

  async estimateFee(params: TransferParams): Promise<FeeEstimate> {
    // Gas 估算需要 wagmi hooks
    throw new Error('estimateFee 必须在 React 组件中通过 wagmi hooks 调用')
  }

  validateAddress(address: string): boolean {
    return isAddress(address)
  }
}
