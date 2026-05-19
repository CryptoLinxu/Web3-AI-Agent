/**
 * Solana 钱包列表组件
 * 
 * 直接显示可用的 Solana 钱包列表，避免嵌套弹窗
 * 使用 @solana/wallet-adapter-react 的 useWallet 和 useWalletModal
 */

'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

interface SolanaWalletListProps {
  onWalletSelect?: () => void;
}

export default function SolanaWalletList({ onWalletSelect }: SolanaWalletListProps) {
  const { wallets, select } = useWallet();
  const { setVisible } = useWalletModal();

  const handleWalletClick = (walletName: string) => {
    try {
      // @ts-ignore - select 接受字符串参数
      select(walletName);
      onWalletSelect?.();
    } catch (error) {
      console.error('Failed to select wallet:', error);
    }
  };

  return (
    <div className="space-y-2">
      {wallets.map((wallet) => (
        <button
          key={wallet.adapter.name}
          onClick={() => handleWalletClick(wallet.adapter.name)}
          className="w-full flex items-center gap-3 p-4 rounded-xl bg-cyan-50 dark:bg-gray-800/50 hover:bg-cyan-100 dark:hover:bg-gray-700/60 border border-cyan-200 dark:border-gray-700 hover:border-cyan-300 dark:hover:border-cyan-500/50 transition-all duration-200 group"
        >
          {/* 钱包图标 */}
          {wallet.adapter.icon && (
            <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-500/20 flex items-center justify-center overflow-hidden">
              <img 
                src={wallet.adapter.icon} 
                alt={wallet.adapter.name}
                className="w-6 h-6 object-contain"
              />
            </div>
          )}
          
          {/* 钱包信息 */}
          <div className="flex-1 text-left">
            <div className="font-medium text-gray-900 dark:text-white group-hover:text-cyan-900 dark:group-hover:text-cyan-300 transition-colors">
              {wallet.adapter.name}
            </div>
            {wallet.adapter.name === 'Phantom' && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">推荐</div>
            )}
          </div>
          
          {/* 箭头图标 */}
          <svg 
            className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 group-hover:translate-x-1 transition-all duration-200" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 5l7 7-7 7" 
            />
          </svg>
        </button>
      ))}
    </div>
  );
}
