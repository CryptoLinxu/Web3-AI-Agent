/**
 * 统一钱包选择弹窗
 * 
 * 提供统一的钱包选择界面，支持 EVM 和 Solana 钱包
 * 用户选择链类型后，显示对应的钱包列表
 */

'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

interface UnifiedWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UnifiedWalletModal({ isOpen, onClose }: UnifiedWalletModalProps) {
  const [selectedChain, setSelectedChain] = useState<'evm' | 'solana' | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // 确保组件在客户端挂载后再渲染 Portal
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!isOpen || !mounted) return null;
  
  // 使用 Portal 将 Modal 渲染到 body，脱离 overflow-hidden 限制
  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" 
      onClick={onClose}
    >
      <div 
        className="bg-[rgb(var(--card-bg))] border border-[rgb(var(--border-color))] rounded-2xl p-6 w-96 max-w-[90vw] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 text-[rgb(var(--text-primary))]">连接钱包</h2>
        
        {!selectedChain ? (
          <div className="space-y-3">
            {/* EVM 钱包选项 */}
            <button
              onClick={() => setSelectedChain('evm')}
              className="w-full p-4 rounded-xl bg-[rgb(var(--accent-purple))/10] hover:bg-[rgb(var(--accent-purple))/20] border border-[rgb(var(--accent-purple))/30] transition text-left"
            >
              <div className="font-semibold text-[rgb(var(--text-primary))] mb-1">EVM 钱包</div>
              <div className="text-sm text-gray-400">Ethereum, Polygon, BSC</div>
            </button>
            
            {/* Solana 钱包选项 */}
            <button
              onClick={() => setSelectedChain('solana')}
              className="w-full p-4 rounded-xl bg-[rgb(var(--accent-cyan))/10] hover:bg-[rgb(var(--accent-cyan))/20] border border-[rgb(var(--accent-cyan))/30] transition text-left"
            >
              <div className="font-semibold text-[rgb(var(--text-primary))] mb-1">Solana 钱包</div>
              <div className="text-sm text-gray-400">Solana, SPL Tokens</div>
            </button>
          </div>
        ) : (
          <div>
            {/* 返回按钮 */}
            <button 
              onClick={() => setSelectedChain(null)}
              className="text-sm text-gray-400 mb-4 hover:text-white transition flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回选择链类型
            </button>
            
            {/* 钱包列表 */}
            {selectedChain === 'evm' ? (
              <div className="evm-wallets">
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <button 
                      onClick={openConnectModal}
                      className="w-full p-4 rounded-xl bg-[rgb(var(--accent-purple))/20] hover:bg-[rgb(var(--accent-purple))/30] border border-[rgb(var(--accent-purple))/40] transition text-center font-medium text-[rgb(var(--text-primary))]"
                    >
                      选择 EVM 钱包
                    </button>
                  )}
                </ConnectButton.Custom>
              </div>
            ) : (
              <div className="solana-wallets">
                {/* 使用 Solana Wallet Adapter 的钱包列表 */}
                <div className="solana-wallet-adapter-react-ui">
                  <WalletMultiButton />
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* 取消按钮 */}
        <button 
          onClick={onClose} 
          className="mt-4 w-full py-2 text-sm text-gray-400 hover:text-white border border-[rgb(var(--border-color))] rounded-lg hover:bg-[rgb(var(--card-bg))] transition"
        >
          取消
        </button>
      </div>
    </div>
  );
  
  // 使用 Portal 渲染到 document.body
  return createPortal(modalContent, document.body);
}
