/**
 * EVM 钱包列表组件
 * 
 * 使用 RainbowKit 的内置钱包列表，直接展示可用钱包
 * 避免中间步骤，用户体验更流畅
 */

'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';

interface EVMWalletListProps {
  onWalletSelect?: () => void;
}

export default function EVMWalletList({ onWalletSelect }: EVMWalletListProps) {
  return (
    <div className="space-y-2">
      <ConnectButton.Custom>
        {({ openConnectModal }) => (
          <button 
            onClick={() => {
              openConnectModal();
              onWalletSelect?.();
            }}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-500/5 to-purple-600/5 hover:from-purple-500/15 hover:to-purple-600/15 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-200 group"
          >
            {/* 钱包图标 */}
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            
            {/* 钱包信息 */}
            <div className="flex-1 text-left">
              <div className="font-medium text-[rgb(var(--text-primary))] group-hover:text-white transition-colors">
                选择 EVM 钱包
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                MetaMask, WalletConnect, Coinbase
              </div>
            </div>
            
            {/* 箭头图标 */}
            <svg 
              className="w-5 h-5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-200" 
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
        )}
      </ConnectButton.Custom>
    </div>
  );
}
