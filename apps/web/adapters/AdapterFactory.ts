/**
 * 适配器工厂
 * 
 * 根据网络类型创建对应的转账适配器实例
 * 实现适配器模式的统一入口
 */

import { TransferAdapter } from './TransferAdapter';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { SolanaAdapter } from './solana/SolanaAdapter';
import { EVMAdapter } from './evm/EVMAdapter';

/**
 * EVM 链 ID 到网络 ID 的映射
 */
const EVM_CHAIN_ID_TO_NETWORK: Record<number, string> = {
  1: 'eth-mainnet',
  137: 'polygon-mainnet',
  56: 'bsc-mainnet',
}

/**
 * 网络 ID 到 EVM 链 ID 的映射
 */
const NETWORK_TO_EVM_CHAIN_ID: Record<string, number> = {
  'eth-mainnet': 1,
  'polygon-mainnet': 137,
  'bsc-mainnet': 56,
}

/**
 * 适配器工厂类
 */
export class AdapterFactory {
  /**
   * 创建转账适配器
   * @param networkId 网络 ID（如 'eth-mainnet', 'solana-mainnet'）
   * @param walletParams 钱包参数（不同适配器需要不同的钱包实例）
   * @param chainId EVM 链 ID（可选，用于 EVM 网络）
   * @returns 转账适配器实例
   */
  static createAdapter(
    networkId: string,
    walletParams?: {
      solanaWallet?: ReturnType<typeof useSolanaWallet>;
    },
    chainId?: number
  ): TransferAdapter {
    // Solana 网络
    if (networkId.startsWith('solana')) {
      if (!walletParams?.solanaWallet) {
        throw new Error('创建 SolanaAdapter 需要传入 solanaWallet 参数');
      }
      return new SolanaAdapter(walletParams.solanaWallet);
    }

    // EVM 网络
    if (NETWORK_TO_EVM_CHAIN_ID[networkId] || networkId.startsWith('evm')) {
      const evmChainId = chainId || NETWORK_TO_EVM_CHAIN_ID[networkId] || 1
      return new EVMAdapter(evmChainId);
    }

    throw new Error(`不支持的网络: ${networkId}`);
  }

  /**
   * 获取所有支持的网络 ID
   */
  static getSupportedNetworks(): string[] {
    return [
      'eth-mainnet',
      'polygon-mainnet',
      'bsc-mainnet',
      'solana-mainnet',
    ];
  }
  
  /**
   * 根据 EVM 链 ID 创建适配器
   * 
   * @param chainId EVM 链 ID
   * @param walletParams 钱包参数
   * @returns 转账适配器实例
   */
  static createAdapterFromChainId(
    chainId: number,
    walletParams?: { solanaWallet?: ReturnType<typeof useSolanaWallet> }
  ): TransferAdapter {
    const networkId = EVM_CHAIN_ID_TO_NETWORK[chainId] || 'eth-mainnet'
    return this.createAdapter(networkId, walletParams, chainId)
  }

  /**
   * 判断网络是否支持
   */
  static isNetworkSupported(networkId: string): boolean {
    return this.getSupportedNetworks().includes(networkId);
  }
}
