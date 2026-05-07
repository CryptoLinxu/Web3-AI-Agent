/**
 * 统一钱包连接按钮
 * 
 * 提供单一的钱包连接入口，点击后显示 UnifiedWalletModal
 * 已连接时显示钱包地址和链类型标签
 */

'use client';

import { useState } from 'react';
import { useUnifiedWallet } from '@/hooks/useUnifiedWallet';
import UnifiedWalletModal from './UnifiedWalletModal';

export default function UnifiedWalletButton() {
  const { connected, address, chain, disconnect } = useUnifiedWallet();
  const [showModal, setShowModal] = useState(false);
  
  // 未连接状态
  if (!connected) {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-[rgb(var(--accent-purple))] text-white rounded-lg hover:opacity-90 transition font-medium"
        >
          连接钱包
        </button>
        <UnifiedWalletModal isOpen={showModal} onClose={() => setShowModal(false)} />
      </>
    );
  }
  
  // 已连接状态
  return (
    <div className="flex items-center gap-3">
      {/* 钱包地址显示 */}
      <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[rgb(var(--accent-purple))/10] to-[rgb(var(--accent-cyan))/10] border border-[rgb(var(--border-color))] rounded-xl backdrop-blur-sm">
        {/* 链类型图标 */}
        <div className={`w-2 h-2 rounded-full ${
          chain === 'evm' ? 'bg-purple-500' : 'bg-cyan-500'
        }`} />
        <span className="text-xs font-medium text-gray-400 uppercase">{chain}</span>
        <span className="font-mono text-sm font-medium text-[rgb(var(--text-primary))]">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      </div>
      
      {/* 专业断开按钮 */}
      <button 
        onClick={disconnect}
        className="group relative px-4 py-2 rounded-xl border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-200 ease-out"
        aria-label="断开钱包连接"
      >
        <div className="flex items-center gap-2">
          {/* 断开图标 */}
          <svg 
            className="w-4 h-4 text-red-400 group-hover:text-red-300 transition-colors duration-200" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
            />
          </svg>
          <span className="text-sm font-medium text-red-400 group-hover:text-red-300 transition-colors duration-200">
            断开
          </span>
        </div>
        {/* Hover 光效 */}
        <div className="absolute inset-0 rounded-xl bg-red-500/0 group-hover:bg-red-500/5 transition-colors duration-200" />
      </button>
    </div>
  );
}
