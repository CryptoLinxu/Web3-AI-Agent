'use client'

import { useState, useEffect } from 'react'
import { useAccount, useChainId, useSendTransaction, useWriteContract, useWaitForTransactionReceipt, useBalance, useReadContract } from 'wagmi'
import { parseEther, parseUnits, formatUnits, isAddress } from 'viem'
import { TransferData, TransferStatus } from '@/types/transfer'
import { getTokenConfig, isNativeToken } from '@/lib/tokens'
import * as transferService from '@/lib/supabase/transfers'
import Image from 'next/image'

interface TransferCardProps {
  data: TransferData
  conversationId?: string
  onUpdate?: (data: TransferData) => void
}

// ERC20 最小 ABI (含 allowance 和 approve)
const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }]
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
] as const

// 链配置注册表
const CHAIN_CONFIGS: Record<string, {
  name: string
  chainId: number
  explorer: string
  nativeToken: string
  iconColor: string
}> = {
  ethereum: {
    name: 'Ethereum',
    chainId: 1,
    explorer: 'https://etherscan.io/tx/',
    nativeToken: 'ETH',
    iconColor: '#627EEA'
  },
  polygon: {
    name: 'Polygon',
    chainId: 137,
    explorer: 'https://polygonscan.com/tx/',
    nativeToken: 'MATIC',
    iconColor: '#8247E5'
  },
  bsc: {
    name: 'BSC',
    chainId: 56,
    explorer: 'https://bscscan.com/tx/',
    nativeToken: 'BNB',
    iconColor: '#F3BA2F'
  }
}

// 状态配置 - 对齐 Quantum Nexus 主题
const STATUS_CONFIG: Record<TransferStatus, { label: string; color: string; dotColor: string; ringColor: string }> = {
  pending: { label: 'PENDING', color: 'text-amber-400', dotColor: 'bg-amber-400', ringColor: 'ring-amber-400/40' },
  approving: { label: 'APPROVING', color: 'text-[rgb(var(--accent-cyan))]', dotColor: 'bg-[rgb(var(--accent-cyan))]', ringColor: 'ring-[rgba(var(--accent-cyan),0.4)]' },
  signing: { label: 'SIGNING', color: 'text-[rgb(var(--accent-cyan))]', dotColor: 'bg-[rgb(var(--accent-cyan))]', ringColor: 'ring-[rgba(var(--accent-cyan),0.4)]' },
  confirmed: { label: 'CONFIRMED', color: 'text-emerald-400', dotColor: 'bg-emerald-400', ringColor: 'ring-emerald-400/40' },
  failed: { label: 'FAILED', color: 'text-[rgb(var(--danger))]', dotColor: 'bg-[rgb(var(--danger))]', ringColor: 'ring-[rgba(var(--danger),0.4)]' }
}

export default function TransferCard({ data, conversationId, onUpdate }: TransferCardProps) {
  const { address } = useAccount()
  const chainId = useChainId()
  // 使用 data 中的状态（从数据库恢复）
  const [status, setStatus] = useState<TransferStatus>(data.status || 'pending')
  const [txHash, setTxHash] = useState<string | undefined>(data.txHash)
  const [error, setError] = useState<string | undefined>(data.error)
  const [isBalanceChecked, setIsBalanceChecked] = useState(false)
  const [balanceError, setBalanceError] = useState<string>('')

  // Approve 相关状态
  const [approveTxHash, setApproveTxHash] = useState<string | undefined>()
  const [needsApproval, setNeedsApproval] = useState(false)
  const [pendingAllowanceCheck, setPendingAllowanceCheck] = useState(false)
  const [lastAllowanceBeforeApprove, setLastAllowanceBeforeApprove] = useState<bigint | undefined>()

  // 获取 Token 配置
  const tokenConfig = getTokenConfig(data.chain, data.tokenSymbol)
  const isNative = isNativeToken(data.tokenSymbol)

  // ETH 原生转账
  const { sendTransaction, isPending: isSigningETH } = useSendTransaction()

  // ERC20 转账
  const { writeContract, isPending: isSigningERC20 } = useWriteContract()

  const isSigning = isSigningETH || isSigningERC20

  // 监听交易确认 (transfer)
  const { data: receipt } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}` | undefined,
    query: {
      enabled: !!txHash && status === 'signing'
    }
  })

  // 监听 Approve 确认
  const { data: approveReceipt } = useWaitForTransactionReceipt({
    hash: approveTxHash as `0x${string}` | undefined,
    query: {
      enabled: !!approveTxHash
    }
  })

  // 读取 allowance (ERC20 授权额度)
  const { data: allowance } = useReadContract({
    address: tokenConfig?.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, address] : undefined,
    query: {
      enabled: !isNative && !!address && status === 'pending' && !!tokenConfig
    }
  })

  // 判断是否需要 approve
  useEffect(() => {
    if (!isNative && allowance !== undefined && tokenConfig && status === 'pending') {
      const allowanceAmt = parseFloat(formatUnits(allowance, tokenConfig.decimals))
      const amount = parseFloat(data.amount)
      const insufficient = allowanceAmt < amount

      setNeedsApproval(insufficient)

      if (pendingAllowanceCheck) {
        // 等待 allowance 数据刷新（值改变才说明已从链上重新获取）
        if (lastAllowanceBeforeApprove !== undefined && allowance === lastAllowanceBeforeApprove) {
          return // allowance 还未刷新，等待
        }

        // allowance 已刷新，消费标记
        setPendingAllowanceCheck(false)
        setLastAllowanceBeforeApprove(undefined)

        if (insufficient) {
          // approve 后 allowance 仍然不足
          setError(`授权额度不足，当前剩余额度: ${allowanceAmt.toFixed(6)} ${data.tokenSymbol}`)
        } else {
          // allowance 已足够，自动发起转账
          setError(undefined)
          setIsBalanceChecked(false)
          setBalanceError('')
          executeERC20Transfer()
        }
      }
    }
  }, [allowance, isNative, tokenConfig, data.amount, status, pendingAllowanceCheck, lastAllowanceBeforeApprove])

  // 监听 approve 交易确认后自动发起 transfer
  useEffect(() => {
    if (!approveReceipt || !approveTxHash) return
    
    if (approveReceipt.status === 'success') {
      // approve 成功，等待 allowance 数据刷新后再验证
      setApproveTxHash(undefined)
      setStatus('pending')
      setPendingAllowanceCheck(true) // 标记等待 post-approve allowance 检查
    } else {
      setStatus('failed')
      setError('Token 授权失败')
    }
  }, [approveReceipt])

  // 检查余额
  const { data: tokenBalance } = useBalance({
    address: address ? (data.from as `0x${string}`) : undefined,
    token: isNative ? undefined : (tokenConfig?.address as `0x${string}` | undefined),
    query: {
      enabled: status === 'pending' && !!address
    }
  })

  // 检查原生币余额(用于 Gas)
  const { data: nativeBalance } = useBalance({
    address: address ? (data.from as `0x${string}`) : undefined,
    query: {
      enabled: status === 'pending' && !!address && !isNative
    }
  })

  // 余额验证
  useEffect(() => {
    if (status === 'pending' && tokenBalance && !isBalanceChecked) {
      // 对于 ERC20 Token，先等 allowance 加载完成
      if (!isNative) {
        if (allowance === undefined) return // allowance 仍在加载中，等待
        if (needsApproval) {
          // allowance 不足，显示授权提示而非余额不足
          setIsBalanceChecked(true)
          setBalanceError(`需要先授权 ${data.tokenSymbol}，当前授权额度不足`)
          return
        }
      }

      const balanceNum = parseFloat(formatUnits(tokenBalance.value, tokenBalance.decimals))
      const amountNum = parseFloat(data.amount)

      if (balanceNum < amountNum) {
        setBalanceError(`余额不足，当前余额: ${balanceNum.toFixed(4)} ${data.tokenSymbol}`)
      } else if (!isNative && nativeBalance) {
        // ERC20 转账需要检查 Gas 费
        const ethBalance = parseFloat(formatUnits(nativeBalance.value, nativeBalance.decimals))
        if (ethBalance < 0.001) {
          setBalanceError(`Gas 费不足，需要约 0.001 ${nativeBalance.symbol}`)
        }
      }

      setIsBalanceChecked(true)
    }
  }, [tokenBalance, nativeBalance, status, isBalanceChecked, data.amount, data.tokenSymbol, isNative, allowance, needsApproval])

  // 监听交易确认
  useEffect(() => {
    if (receipt && status === 'signing') {
      if (receipt.status === 'success') {
        setStatus('confirmed')
        setError(undefined)
        // 更新数据库
        if (conversationId && data.id) {
          transferService.updateTransferCardStatus(data.id, 'confirmed', txHash)
        }
        // 通知父组件
        onUpdate?.({ ...data, status: 'confirmed', txHash })
      } else {
        setStatus('failed')
        setError('交易执行失败')
        if (conversationId && data.id) {
          transferService.updateTransferCardStatus(data.id, 'failed', txHash, '交易执行失败')
        }
      }
    }
  }, [receipt, status, conversationId, data.id, txHash])

  // 执行 ERC20 Transfer (提取为单独函数,支持从 approve 回调调用)
  const executeERC20Transfer = () => {
    if (!tokenConfig) return
    
    setStatus('signing')
    setError(undefined)

    writeContract(
      {
        address: tokenConfig.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [
          data.to as `0x${string}`,
          parseUnits(data.amount, tokenConfig.decimals)
        ]
      },
      {
        onSuccess: (hash) => {
          setTxHash(hash)
          if (conversationId && data.id) {
            transferService.updateTransferCardStatus(data.id, 'signing', hash)
          }
        },
        onError: (err) => {
          handleTransferError(err)
        }
      }
    )
  }

  // 点击确认转账
  const handleConfirm = async () => {
    if (!address) {
      setError('请先连接钱包')
      return
    }

    // 验证地址格式
    if (!isAddress(data.to)) {
      setError('接收地址格式错误')
      return
    }

    // 余额不足只阻止转账(不阻止授权)
    if (balanceError && (isNative || !needsApproval)) {
      return
    }

    // 检查链是否匹配
    const chainConfig = CHAIN_CONFIGS[data.chain]
    const targetChainId = chainConfig?.chainId || 1
    if (chainId !== targetChainId) {
      setError(`请切换到 ${chainConfig?.name} 网络`)
      return
    }

    setStatus('signing')
    setError(undefined)

    try {
      if (isNative) {
        // ETH 原生转账
        setStatus('signing')
        sendTransaction(
          {
            to: data.to as `0x${string}`,
            value: parseEther(data.amount)
          },
          {
            onSuccess: (hash) => {
              setTxHash(hash)
              if (conversationId && data.id) {
                transferService.updateTransferCardStatus(data.id, 'signing', hash)
              }
            },
            onError: (err) => {
              handleTransferError(err)
            }
          }
        )
      } else {
        // ERC20 转账
        if (!tokenConfig) {
          setError('Token 配置不存在')
          setStatus('failed')
          return
        }

        if (needsApproval) {
          // Step 1: 先授权给自己（用户自己执行 transfer）
          setStatus('approving')
          setError(undefined)
          // 保存当前的 allowance 值，用于后续判断是否已刷新
          setLastAllowanceBeforeApprove(allowance)
          writeContract(
            {
              address: tokenConfig.address as `0x${string}`,
              abi: ERC20_ABI,
              functionName: 'approve',
              args: [
                address as `0x${string}`,
                parseUnits(data.amount, tokenConfig.decimals)
              ]
            },
            {
              onSuccess: (hash) => {
                setApproveTxHash(hash)
              },
              onError: (err) => {
                handleTransferError(err)
              }
            }
          )
        } else {
          // Step 2: 已授权,直接转账
          executeERC20Transfer()
        }
      }
    } catch (err) {
      handleTransferError(err)
    }
  }

  // 错误处理
  const handleTransferError = (err: any) => {
    let errorMsg = '未知错误'

    if (err.message?.includes('User rejected') || err.message?.includes('user rejected')) {
      errorMsg = '用户取消签名'
    } else if (err.message?.includes('insufficient funds')) {
      errorMsg = '余额不足'
    } else if (err.message?.includes('gas required exceeds')) {
      errorMsg = 'Gas 费不足'
    } else if (err.message?.includes('network')) {
      errorMsg = '网络错误，请稍后重试'
    } else if (err.shortMessage) {
      errorMsg = err.shortMessage
    } else if (err.message) {
      errorMsg = err.message
    }

    setStatus('failed')
    setError(errorMsg)

    if (conversationId && data.id) {
      transferService.updateTransferCardStatus(data.id, 'failed', undefined, errorMsg)
    }
  }

  // 重试
  const handleRetry = () => {
    setStatus('pending')
    setError(undefined)
    setBalanceError('')
    setIsBalanceChecked(false)
    // 同步重置数据库状态，避免刷新后错误残留
    if (conversationId && data.id) {
      transferService.updateTransferCardStatus(data.id, 'pending', undefined, undefined)
    }
  }

  // 获取区块链浏览器链接
  const getExplorerUrl = () => {
    if (!txHash) return ''
    const baseUrl = CHAIN_CONFIGS[data.chain]?.explorer || CHAIN_CONFIGS.ethereum.explorer
    return `${baseUrl}${txHash}`
  }

  // 缩写地址/哈希: 前4...后6
  const shortenAddress = (addr: string) => {
    if (!addr || addr.length < 10) return addr
    return `${addr.slice(0, 6)}......${addr.slice(-6)}`
  }

  // 获取 Token Icon URL
  const getTokenIconUrl = () => {
    if (isNative) {
      // 发送什么币就使用什么币的图标
      const nativeIcons: Record<string, string> = {
        ETH: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
        MATIC: 'https://assets.coingecko.com/coins/images/4713/small/polygon.png',
        POL: 'https://assets.coingecko.com/coins/images/4713/small/polygon.png',
        BNB: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png'
      }
      return nativeIcons[data.tokenSymbol.toUpperCase()] || nativeIcons.ETH
    }
    // ERC20 Token 从 tokenConfig 获取或使用默认 icon
    return tokenConfig?.logoUri || `https://assets.coingecko.com/coins/images/325/small/Tether.png`
  }

  const statusConfig = STATUS_CONFIG[status]
  const displayError = error || balanceError

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
            {(status === 'pending' || status === 'approving' || status === 'signing') && (
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
              {CHAIN_CONFIGS[data.chain]?.name || data.chain}
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
            <span className="text-[10px] font-mono uppercase tracking-wider text-[rgb(var(--text-muted))]">TxHash</span>
            <span className="text-xs text-[rgb(var(--accent-cyan))] font-mono font-medium">
              {shortenAddress(txHash)}
            </span>
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {displayError && (
        <div className="mb-4 p-3 rounded-xl bg-[rgba(var(--danger),0.08)] border border-[rgba(var(--danger),0.3)] flex items-start gap-2 animate-slide-up">
          <svg className="w-4 h-4 text-[rgb(var(--danger))] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-xs text-[rgb(var(--danger))] leading-relaxed">{displayError}</span>
        </div>
      )}

      {/* 授权按钮 */}
      {status === 'pending' && !isNative && needsApproval && (
        <button
          onClick={handleConfirm}
          disabled={isSigning}
          className="btn-primary w-full h-11 !rounded-xl"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          授权 {data.tokenSymbol}
        </button>
      )}

      {/* 转账按钮 */}
      {status === 'pending' && (isNative || !needsApproval) && (
        <button
          onClick={handleConfirm}
          disabled={!!displayError || isSigning}
          className="btn-primary w-full h-11 !rounded-xl"
        >
          {!isSigning && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          )}
          {isSigning ? '签名中...' : !isNative ? '确认转账' : '确认发送'}
        </button>
      )}

      {status === 'approving' && (
        <button
          disabled
          className="w-full h-11 bg-[rgba(var(--bg-surface),0.6)] border border-[rgba(var(--accent-cyan),0.3)] text-[rgb(var(--accent-cyan))] font-semibold text-sm rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
        >
          <div className="relative w-4 h-4">
            <div className="absolute inset-0 rounded-full border-2 border-[rgba(var(--accent-cyan),0.2)]" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[rgb(var(--accent-cyan))] animate-spin" />
          </div>
          <span className="font-mono uppercase tracking-wider text-xs">Approving...</span>
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
