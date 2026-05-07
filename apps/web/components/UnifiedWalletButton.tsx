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
    <div className="flex items-center gap-2">
      <div className="px-3 py-2 bg-[rgb(var(--card-bg))] border border-[rgb(var(--border-color))] rounded-lg">
        <span className="text-xs text-gray-400 uppercase mr-2">{chain}</span>
        <span className="font-mono text-sm">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      </div>
      <button 
        onClick={disconnect} 
        className="px-3 py-2 text-sm text-gray-400 hover:text-white border border-[rgb(var(--border-color))] rounded-lg hover:bg-[rgb(var(--card-bg))] transition"
      >
        断开
      </button>
    </div>
  );
}
