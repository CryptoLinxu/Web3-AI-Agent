'use client'

import { useState, useEffect, useMemo } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useConnection } from '@solana/wallet-adapter-react'
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { getAssociatedTokenAddress, createTransferInstruction, getMint, createAssociatedTokenAccountInstruction } from '@solana/spl-token'
import { TransferData, TransferStatus } from '@/types/transfer'
import { SOLANA_CONFIG, SOLANA_TOKENS } from '@/config/solana-chains'
import { isValidSolanaAddress } from '@/utils/address-validator'
import * as transferService from '@/lib/supabase/transfers'
import Image from 'next/image'

interface SolanaTransferCardProps {
  data: TransferData
  conversationId?: string
  onUpdate?: (data: TransferData) => void
}

// Solana 网络配置
const SOLANA_NETWORK_CONFIG = {
  solana: {
    name: 'Solana',
    explorer: 'https://solscan.io/tx/',
    nativeToken: 'SOL',
    iconColor: '#14F195'
  }
}

// 状态配置 - 与 TransferCard 保持一致
const STATUS_CONFIG: Record<TransferStatus, { label: string; color: string; dotColor: string; ringColor: string }> = {
  pending: { label: 'PENDING', color: 'text-amber-400', dotColor: 'bg-amber-400', ringColor: 'ring-amber-400/40' },
  approving: { label: 'APPROVING', color: 'text-[rgb(var(--accent-cyan))]', dotColor: 'bg-[rgb(var(--accent-cyan))]', ringColor: 'ring-[rgba(var(--accent-cyan),0.4)]' },
  signing: { label: 'SIGNING', color: 'text-[rgb(var(--accent-cyan))]', dotColor: 'bg-[rgb(var(--accent-cyan))]', ringColor: 'ring-[rgba(var(--accent-cyan),0.4)]' },
  confirmed: { label: 'CONFIRMED', color: 'text-emerald-400', dotColor: 'bg-emerald-400', ringColor: 'ring-emerald-400/40' },
  failed: { label: 'FAILED', color: 'text-[rgb(var(--danger))]', dotColor: 'bg-[rgb(var(--danger))]', ringColor: 'ring-[rgba(var(--danger),0.4)]' }
}

export default function SolanaTransferCard({ data, conversationId, onUpdate }: SolanaTransferCardProps) {
  const { publicKey, connected, sendTransaction } = useWallet()
  const { connection } = useConnection()
  
  const [status, setStatus] = useState<TransferStatus>(data.status || 'pending')
  const [txHash, setTxHash] = useState<string | undefined>(data.txHash)
  const [error, setError] = useState<string | undefined>(data.error)
  const [balance, setBalance] = useState<string>('0')
  const [isSigning, setIsSigning] = useState(false)

  // 判断是否为原生 SOL
  const isNative = data.tokenSymbol.toUpperCase() === 'SOL'

  // 获取 tokenAddress（如果 data 中没有，从 SOLANA_TOKENS 中查找）
  const tokenAddress = useMemo(() => {
    if (isNative) return undefined
    if (data.tokenAddress) return data.tokenAddress
    
    // Fallback: 从配置中查找
    const token = SOLANA_TOKENS[data.tokenSymbol as keyof typeof SOLANA_TOKENS]
    return token && !token.isNative ? token.mintAddress : undefined
  }, [data.tokenAddress, data.tokenSymbol, isNative])

  // 获取余额
  useEffect(() => {
    if (!connected || !publicKey) return

    const fetchBalance = async () => {
      try {
        console.log('[SolanaTransferCard] 查询余额:', {
          wallet: publicKey.toBase58(),
          tokenSymbol: data.tokenSymbol,
          isNative,
          tokenAddress
        })
        
        if (!tokenAddress) {
          // SOL 余额
          const balance = await connection.getBalance(publicKey)
          console.log('[SolanaTransferCard] SOL 余额:', balance / LAMPORTS_PER_SOL)
          setBalance((balance / LAMPORTS_PER_SOL).toString())
        } else {
          // SPL Token 余额
          const mintAddress = new PublicKey(tokenAddress)
          const associatedToken = await getAssociatedTokenAddress(mintAddress, publicKey)
          
          console.log('[SolanaTransferCard] SPL Token 账户地址:', associatedToken.toBase58())
          
          try {
            const tokenBalance = await connection.getTokenAccountBalance(associatedToken)
            console.log('[SolanaTransferCard] SPL Token 余额:', tokenBalance.value.uiAmount)
            setBalance(tokenBalance.value.uiAmount?.toString() || '0')
          } catch (err: any) {
            console.warn('[SolanaTransferCard] SPL Token 账户不存在或查询失败:', err.message)
            setBalance('0')
          }
        }
      } catch (err) {
        console.error('[SolanaTransferCard] Failed to get balance:', err)
        setBalance('0')
      }
    }

    fetchBalance()
  }, [connected, publicKey, connection, isNative, tokenAddress, data.tokenSymbol])

  // 检查余额
  const checkBalance = (): string | null => {
    const balanceNum = parseFloat(balance)
    const amountNum = parseFloat(data.amount)

    if (isNaN(balanceNum) || isNaN(amountNum)) {
      return '金额格式错误'
    }

    if (balanceNum < amountNum) {
      return `余额不足，当前余额: ${balanceNum.toFixed(6)} ${data.tokenSymbol}`
    }

    return null
  }

  // 点击确认转账
  const handleConfirm = async () => {
    if (!connected || !publicKey) {
      setError('请先连接 Solana 钱包')
      return
    }

    // 余额检查
    const balanceError = checkBalance()
    if (balanceError) {
      setError(balanceError)
      return
    }

    setStatus('signing')
    setError('')
    setIsSigning(true)

    try {
      // 构建交易
      const toPublicKey = new PublicKey(data.to)
      const fromPublicKey = publicKey

      let transaction: Transaction

      if (isNative) {
        // SOL 原生转账
        const amount = parseFloat(data.amount) * LAMPORTS_PER_SOL
        transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: fromPublicKey,
            toPubkey: toPublicKey,
            lamports: amount,
          })
        )
      } else {
        // SPL Token 转账
        if (!tokenAddress) {
          throw new Error('Token 地址缺失')
        }

        const mintAddress = new PublicKey(tokenAddress)
        const mintInfo = await getMint(connection, mintAddress)
        const decimals = mintInfo.decimals
        const tokenAmount = Math.floor(parseFloat(data.amount) * Math.pow(10, decimals))

        const fromTokenAccount = await getAssociatedTokenAddress(mintAddress, fromPublicKey)
        const toTokenAccount = await getAssociatedTokenAddress(mintAddress, toPublicKey)

        transaction = new Transaction()

        // 检查接收方的 ATA 是否存在
        console.log('[SolanaTransferCard] 检查接收方 ATA:', toTokenAccount.toBase58())
        const toTokenAccountInfo = await connection.getAccountInfo(toTokenAccount)
        
        // 如果不存在，需要先创建 ATA
        if (!toTokenAccountInfo) {
          console.log('[SolanaTransferCard] 接收方 ATA 不存在，创建中...')
          transaction.add(
            createAssociatedTokenAccountInstruction(
              fromPublicKey, // 支付租金的账户
              toTokenAccount, // 新的 ATA 地址
              toPublicKey, // 接收方钱包
              mintAddress // Mint 地址
            )
          )
        }

        // 添加转账指令
        transaction.add(
          createTransferInstruction(
            fromTokenAccount,
            toTokenAccount,
            fromPublicKey,
            BigInt(tokenAmount)
          )
        )
      }

      // 发送交易
      const signature = await sendTransaction(transaction, connection)
      
      console.log('[SolanaTransferCard] 交易已发送，等待确认...', signature)
      
      // 使用 HTTP 轮询确认交易（公共 RPC 不支持 WebSocket）
      let confirmed = false
      let retries = 0
      const maxRetries = 30 // 最多等待 30 次
      
      while (!confirmed && retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000)) // 等待 1 秒
        
        const status = await connection.getSignatureStatus(signature)
        
        if (status.value) {
          if (status.value.err) {
            throw new Error('交易失败: ' + JSON.stringify(status.value.err))
          }
          
          if (status.value.confirmationStatus === 'confirmed' || 
              status.value.confirmationStatus === 'finalized') {
            confirmed = true
            console.log('[SolanaTransferCard] 交易已确认', status.value.confirmationStatus)
          }
        }
        
        retries++
      }
      
      if (!confirmed) {
        throw new Error('交易超时，未在 30 秒内确认')
      }

      setTxHash(signature)
      setStatus('confirmed')

      // 保存到 Supabase
      if (conversationId && data.id) {
        await transferService.updateTransferCardStatus(
          data.id,
          'confirmed',
          signature
        )
      }

      // 通知父组件
      onUpdate?.({ ...data, status: 'confirmed', txHash: signature })
    } catch (err: any) {
      let errorMsg = '转账失败'
      
      if (err.message?.includes('User rejected') || err.message?.includes('cancelled')) {
        errorMsg = '用户取消了交易'
      } else if (err.message?.includes('insufficient')) {
        errorMsg = '余额不足'
      } else if (err.message?.includes('timeout')) {
        errorMsg = '交易确认超时，请稍后重试'
      } else if (err.message) {
        errorMsg = err.message
      }

      setStatus('failed')
      setError(errorMsg)

      if (conversationId && data.id) {
        await transferService.updateTransferCardStatus(
          data.id,
          'failed',
          undefined,
          errorMsg
        )
      }
    } finally {
      setIsSigning(false)
    }
  }

  // 重试
  const handleRetry = () => {
    setStatus('pending')
    setError(undefined)
    
    if (conversationId && data.id) {
      transferService.updateTransferCardStatus(data.id, 'pending', undefined, undefined)
    }
  }

  // 获取区块链浏览器链接
  const getExplorerUrl = () => {
    if (!txHash) return ''
    return `${SOLANA_NETWORK_CONFIG.solana.explorer}${txHash}`
  }

  // 缩写地址/哈希: 前6...后6
  const shortenAddress = (addr: string) => {
    if (!addr || addr.length < 12) return addr
    return `${addr.slice(0, 6)}......${addr.slice(-6)}`
  }

  // 获取 Token Icon URL
  const getTokenIconUrl = () => {
    if (isNative) {
      return 'https://assets.coingecko.com/coins/images/4128/small/solana.png'
    }
    
    const tokenIcons: Record<string, string> = {
      USDT: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
      USDC: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
    }
    
    return tokenIcons[data.tokenSymbol.toUpperCase()] || tokenIcons.USDT
  }

  const statusConfig = STATUS_CONFIG[status]

  return (
    <div
      className="relative rounded-2xl glass-panel border border-[rgba(var(--border-color))] p-5 transition-all duration-300 hover:border-[rgba(var(--accent-cyan),0.35)] hover:shadow-glow-cyan animate-scale-in overflow-hidden"
      style={{ minWidth: '320px' }}
    >
      {/* 顶部渐变装饰条 */}
      <div
        className="absolute top-0 left-0 right-0 h-px opacity-60"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(var(--accent-cyan), 0.5), rgba(var(--accent-violet), 0.5), transparent)',
        }}
      />

      {/* 顶部: 标题 + 状态 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[rgb(var(--accent-cyan))]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[rgb(var(--text-secondary))]">
            Transfer
          </span>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(var(--bg-surface),0.6)] ring-1 ${statusConfig.ringColor}`}>
          <span className={`relative flex items-center justify-center w-1.5 h-1.5`}>
            {(status === 'pending' || status === 'signing') && (
              <span className={`absolute inset-0 rounded-full ${statusConfig.dotColor} opacity-60 animate-ping`} />
            )}
            <span className={`relative w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`} />
          </span>
          <span className={`text-[10px] font-bold font-mono tracking-wider ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* 币种 + 金额 + 网络 */}
      <div className="flex items-center justify-between mb-5 pb-5 border-b border-[rgba(var(--border-color))]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-brand rounded-full blur-md opacity-40" />
            <div className="relative w-11 h-11 rounded-full bg-[rgba(var(--bg-surface),0.9)] border border-[rgba(var(--accent-cyan),0.3)] flex items-center justify-center overflow-hidden shadow-glow-cyan">
              <Image
                src={getTokenIconUrl()}
                alt={data.tokenSymbol}
                width={40}
                height={40}
                className="w-full h-full object-cover"
                unoptimized
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNMTYgMTBWMjJNMTAgMTZIMjIiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4='
                }}
              />
            </div>
          </div>
          <div>
            <div className="text-lg font-bold text-[rgb(var(--text-primary))] leading-tight">
              {data.tokenSymbol}
            </div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[rgb(var(--text-muted))]">
              Solana
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gradient leading-tight">
            {data.amount}
          </div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[rgb(var(--text-muted))]">
            Amount
          </div>
        </div>
      </div>

      {/* 地址信息 */}
      <div className="space-y-2.5 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[rgb(var(--text-muted))]">From</span>
          <span className="text-xs text-[rgb(var(--text-primary))] font-mono font-medium">
            {shortenAddress(data.from)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[rgb(var(--text-muted))]">To</span>
          <span className="text-xs text-[rgb(var(--text-primary))] font-mono font-medium">
            {shortenAddress(data.to)}
          </span>
        </div>
        {status === 'confirmed' && txHash && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[rgb(var(--text-muted))]">Signature</span>
            <span className="text-xs text-[rgb(var(--accent-cyan))] font-mono font-medium">
              {shortenAddress(txHash)}
            </span>
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-[rgba(var(--danger),0.08)] border border-[rgba(var(--danger),0.3)] flex items-start gap-2 animate-slide-up">
          <svg className="w-4 h-4 text-[rgb(var(--danger))] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-xs text-[rgb(var(--danger))] leading-relaxed">{error}</span>
        </div>
      )}

      {/* 转账按钮 */}
      {status === 'pending' && (
        <button
          onClick={handleConfirm}
          disabled={!!error || isSigning}
          className="btn-primary w-full h-11 !rounded-xl"
        >
          {!isSigning && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          )}
          {isSigning ? '签名中...' : '确认发送'}
        </button>
      )}

      {status === 'signing' && (
        <button
          disabled
          className="w-full h-11 bg-[rgba(var(--bg-surface),0.6)] border border-[rgba(var(--accent-cyan),0.3)] text-[rgb(var(--accent-cyan))] font-semibold text-sm rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
        >
          <div className="relative w-4 h-4">
            <div className="absolute inset-0 rounded-full border-2 border-[rgba(var(--accent-cyan),0.2)]" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[rgb(var(--accent-cyan))] animate-spin" />
          </div>
          <span className="font-mono uppercase tracking-wider text-xs">Signing...</span>
        </button>
      )}

      {status === 'confirmed' && txHash && (
        <a
          href={getExplorerUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="group w-full h-11 rounded-xl bg-gradient-to-r from-emerald-500/15 to-emerald-400/10 border border-emerald-400/40 text-emerald-400 font-semibold text-sm hover:bg-emerald-400/20 hover:border-emerald-400/60 transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
        >
          <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          查看交易详情
        </a>
      )}

      {status === 'failed' && (
        <button
          onClick={handleRetry}
          className="btn-primary w-full h-11 !rounded-xl"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          重试
        </button>
      )}
    </div>
  )
}
