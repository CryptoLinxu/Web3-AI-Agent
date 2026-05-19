/**
 * 统一钱包状态 Hook
 * 
 * 合并 EVM（wagmi）和 Solana（wallet-adapter）的钱包状态
 * 提供统一的钱包上下文供上层使用
 */

import { useMemo } from 'react';
import { useAccount as useEvmAccount, useChainId as useEvmChainId, useDisconnect as useEvmDisconnect } from 'wagmi';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { UnifiedWalletContext, ChainType } from '@/lib/wallet/types';

/**
 * 统一钱包 Hook
 * 
 * 优先级：EVM > Solana > None
 * 当用户同时连接 EVM 和 Solana 钱包时，优先使用 EVM
 */
export function useUnifiedWallet(): UnifiedWalletContext {
  // EVM 钱包状态
  const evmAccount = useEvmAccount();
  const evmChainId = useEvmChainId();
  const { disconnect: evmDisconnect } = useEvmDisconnect();
  
  // Solana 钱包状态
  const solanaWallet = useSolanaWallet();
  
  // 判断连接状态
  const isEVMConnected = !!evmAccount.address;
  const isSolanaConnected = solanaWallet.connected && !!solanaWallet.publicKey;
  
  // 根据优先级确定当前活跃的链
  let chain: ChainType = 'evm';
  let address = '';
  let connected = false;
  let chainId: number | undefined;
  let networkId: string | undefined;
  
  if (isEVMConnected) {
    // EVM 优先级更高
    chain = 'evm';
    address = evmAccount.address || '';
    connected = true;
    chainId = evmChainId;
  } else if (isSolanaConnected) {
    chain = 'solana';
    address = solanaWallet.publicKey?.toBase58() || '';
    connected = true;
    networkId = 'solana-mainnet'; // 当前仅支持主网
  }
  
  // 断开连接函数
  const disconnect = async () => {
    if (chain === 'evm' && evmDisconnect) {
      await evmDisconnect();
    } else if (chain === 'solana') {
      await solanaWallet.disconnect();
    }
  };
  
  return useMemo(() => ({
    chain,
    address,
    connected,
    chainId,
    networkId,
    disconnect,
  }), [chain, address, connected, chainId, networkId, disconnect]);
}
