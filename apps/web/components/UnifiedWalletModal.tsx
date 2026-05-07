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
import SolanaWalletList from './SolanaWalletList';
import EVMWalletList from './EVMWalletList';

interface UnifiedWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UnifiedWalletModal({ isOpen, onClose }: UnifiedWalletModalProps) {
  const [selectedChain, setSelectedChain] = useState<'evm' | 'solana' | null>(null);
  const [mounted, setMounted] = useState(false);
  const [openEVMWallet, setOpenEVMWallet] = useState<(() => void) | null>(null);
  
  // 确保组件在客户端挂载后再渲染 Portal
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!isOpen || !mounted) return null;
  
  // 使用 Portal 将 Modal 渲染到 body，脱离 overflow-hidden 限制
  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* 背景遮罩 - 浅色/暗色主题适配 */}
      <div className="absolute inset-0 bg-black/70 dark:bg-black/80 backdrop-blur-sm dark:backdrop-blur-md" />
      
      {/* 弹窗内容 */}
      <div 
        className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 w-96 max-w-[90vw] shadow-2xl dark:shadow-[0_0_40px_-12px_rgba(139,92,246,0.3),0_0_40px_-12px_rgba(6,182,212,0.3)] ring-1 ring-black/5 dark:ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">连接钱包</h2>
        
        {!selectedChain ? (
          <div className="space-y-3">
            {/* EVM 钱包选项 */}
            <button
              onClick={() => {
                // 使用存储的 openConnectModal 函数
                if (openEVMWallet) {
                  openEVMWallet();
                  onClose();
                }
              }}
              className="w-full p-4 rounded-xl bg-purple-50 dark:bg-gray-800/50 hover:bg-purple-100 dark:hover:bg-gray-700/60 border border-purple-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-500/50 transition-all duration-200 text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                  {/* EVM / Ethereum 图标 - 标准菱形 */}
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1.5l-5.5 9L12 14l5.5-3.5L12 1.5zM6.5 12L12 22.5 17.5 12 12 15.5 6.5 12z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-900 dark:group-hover:text-purple-300 transition-colors">EVM 钱包</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Ethereum, Polygon, BSC</div>
                </div>
                <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
            
            {/* Solana 钱包选项 */}
            <button
              onClick={() => setSelectedChain('solana')}
              className="w-full p-4 rounded-xl bg-cyan-50 dark:bg-gray-800/50 hover:bg-cyan-100 dark:hover:bg-gray-700/60 border border-cyan-200 dark:border-gray-700 hover:border-cyan-300 dark:hover:border-cyan-500/50 transition-all duration-200 text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-500/20 flex items-center justify-center">
                  {/* Solana 图标 - 三条平行四边形 */}
                  <svg className="w-5 h-5 text-cyan-600 dark:text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 5h14l-2 2.5H3L3 5zm0 5h14l-2 2.5H3V10zm0 5h14l-2 2.5H3v-2.5z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-white group-hover:text-cyan-900 dark:group-hover:text-cyan-300 transition-colors">Solana 钱包</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Solana, SPL Tokens</div>
                </div>
                <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        ) : (
          <div>
            {/* 返回按钮 */}
            {/* <button 
              onClick={() => setSelectedChain(null)}
              className="text-sm text-gray-500 dark:text-gray-400 mb-4 hover:text-gray-900 dark:hover:text-gray-200 transition flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回选择链类型
            </button> */}
            
            {/* Solana 钱包 */}
            {selectedChain === 'solana' ? (
              <SolanaWalletList onWalletSelect={onClose} />
            ) : null}
          </div>
        )}
        {/* 隐藏的 ConnectButton 用于获取 openConnectModal */}
        <div className="hidden">
          <ConnectButton.Custom>
            {({ openConnectModal }) => {
              // 存储 openConnectModal 函数
              if (!openEVMWallet) {
                setOpenEVMWallet(() => openConnectModal);
              }
              return null;
            }}
          </ConnectButton.Custom>
        </div>
        
        {/* 取消/返回按钮 */}
        <button 
          onClick={() => {
            if (selectedChain) {
              setSelectedChain(null); // 先返回链选择
            } else {
              onClose(); // 直接关闭
            }
          }}
          className="mt-4 w-full py-3 font-bold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800/50 dark:hover:bg-gray-700/60 border border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600 rounded-xl transition-all duration-200"
        >
          {selectedChain ? '返 回' : '取 消'}
        </button>
      </div>
    </div>
  );
  
  // 使用 Portal 渲染到 document.body
  return createPortal(modalContent, document.body);
}
