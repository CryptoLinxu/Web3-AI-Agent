# TransferCard 多链集成指南

## 概述

本文档说明如何在项目中实现多链转账功能，支持 EVM 和 Solana 网络。

## 架构设计

项目采用**适配器模式** + **组件分离**的设计：

### EVM 网络
- **组件**: `TransferCard` (658 行)
- **适配器**: `EVMAdapter` (82 行，简化版)
- **技术栈**: RainbowKit + Wagmi + Viem
- **特点**: 需要 approve 流程（ERC20）

### Solana 网络
- **组件**: `SolanaTransferCard` (416 行)
- **适配器**: `SolanaAdapter` (227 行，完整版)
- **技术栈**: @solana/wallet-adapter + @solana/web3.js
- **特点**: 无需 approve，直接转账

## 目标架构

使用条件渲染，根据 `chain` 字段自动选择组件：

```
用户输入 
  → AI 意图解析 (ai-intent-parser)
  → 返回 TransferData (chain: 'solana' | 'ethereum' | 'polygon' | 'bsc')
  → MessageItem 条件渲染
    ├→ chain === 'solana' → SolanaTransferCard
    └→ chain === 'evm' → TransferCard
  → 适配器执行转账
  → 返回结果
```

## MessageItem 集成

### 条件渲染逻辑

`MessageItem.tsx` 根据 `transferData.chain` 自动选择组件：

```typescript
import { TransferCard, SolanaTransferCard } from '@/components/cards'

// 转账卡片消息
if (message.transferData) {
  // 根据 chain 字段选择对应的卡片组件
  const isSolana = message.transferData.chain === 'solana'
  const CardComponent = isSolana ? SolanaTransferCard : TransferCard

  return (
    <CardComponent
      data={message.transferData}
      conversationId={conversationId}
    />
  )
}
```

### TransferData 类型定义

```typescript
export type ChainId = 'ethereum' | 'polygon' | 'bsc' | 'solana'

export interface TransferData {
  id: string                      // 卡片 ID
  from: string                    // 发送地址 (EVM: 0x..., Solana: Base58)
  to: string                      // 接收地址 (EVM: 0x..., Solana: Base58)
  tokenSymbol: string             // 'ETH', 'USDT', 'USDC', 'SOL'
  tokenAddress?: string           // EVM: ERC20 合约地址, Solana: Mint Address
  amount: string                  // 转账金额
  chain: ChainId                  // 链标识
  status: TransferStatus          // 当前状态
  txHash?: string                 // 交易哈希 (EVM: tx hash, Solana: signature)
  error?: string                  // 错误信息
  estimatedGas?: string           // 预估费用
}
```

## 核心差异对比

| 特性 | TransferCard (EVM) | SolanaTransferCard (Solana) |
|------|-------------------|---------------------------|
| **钱包 Hook** | `useAccount`, `useChainId` | `useWallet`, `useConnection` |
| **转账 Hook** | `useSendTransaction`, `useWriteContract` | `sendTransaction` (直接调用) |
| **Approve 流程** | ✅ 需要（ERC20） | ❌ 不需要（SPL Token 直接转账） |
| **余额查询** | `useBalance` hook | `connection.getBalance()` / `getTokenAccountBalance()` |
| **地址格式** | `0x...` (42 位) | Base58 (32-44 位) |
| **浏览器链接** | etherscan.io/polygonscan.com | solscan.io |
| **交易确认** | `waitForTransactionReceipt` | `confirmTransaction(signature, 'confirmed')` |
| **适配器** | EVMAdapter (简化版) | SolanaAdapter (完整版) |

## 使用示例

### 1. AI 生成 EVM 转账卡片

```typescript
const transferData: TransferData = {
  id: 'transfer-123',
  from: '0x742d35Cc6634C0532925a3b844Bc9e7595f5eE4',
  to: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
  tokenSymbol: 'ETH',
  amount: '0.1',
  chain: 'ethereum',
  status: 'pending'
}
```

**渲染**: `TransferCard`（EVM）

### 2. AI 生成 Solana 转账卡片

```typescript
const transferData: TransferData = {
  id: 'transfer-456',
  from: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  to: '2w6y4X9z1Yk3VqJ8nH7mP5bR9cT4aL6fD3eG8hK1jM0',
  tokenSymbol: 'SOL',
  amount: '1.5',
  chain: 'solana',
  status: 'pending'
}
```

**渲染**: `SolanaTransferCard`（Solana）

### 3. SPL Token 转账

```typescript
const transferData: TransferData = {
  id: 'transfer-789',
  from: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  to: '2w6y4X9z1Yk3VqJ8nH7mP5bR9cT4aL6fD3eG8hK1jM0',
  tokenSymbol: 'USDT',
  tokenAddress: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // Solana USDT Mint
  amount: '100',
  chain: 'solana',
  status: 'pending'
}
```

**渲染**: `SolanaTransferCard`（SPL Token）

## 下一步优化

### 1. AI 意图识别

确保 AI 能够正确识别 Solana 转账意图：

```typescript
// lib/ai-intent-parser.ts
import { parseTransferIntent } from './ai-intent-parser'

const intent = parseTransferIntent('转 1 SOL 到 xxx', 'solana')
// → { networkId: 'solana-mainnet', tokenSymbol: 'SOL', amount: '1', chain: 'solana' }
```

### 2. 统一钱包状态管理

使用 `useUnifiedWallet()` 统一管理 EVM 和 Solana 钱包状态：

```typescript
import { useUnifiedWallet } from '@/hooks/useUnifiedWallet'

const { 
  chain,        // 'evm' | 'solana' | 'none'
  address,      // 当前连接地址
  connected,    // 是否连接
  chainId,      // EVM chainId
  networkId     // 网络 ID
} = useUnifiedWallet()
```

### 3. 适配器使用

在组件内创建适配器实例：

```typescript
// SolanaTransferCard 内部
const wallet = useWallet()
const adapter = new SolanaAdapter(wallet)

// EVM 转账逻辑仍在 TransferCard 组件内（wagmi hooks 限制）
```

### 4. Supabase 持久化

`transfer_cards` 表已支持 Solana（TEXT 字段）：

```typescript
await transferService.updateTransferCardStatus(
  data.id,
  'confirmed',
  signature  // Solana 交易签名
)
```
  abi: ERC20_ABI,
  functionName: 'transfer',
  args: [recipientAddress, parseUnits(amount, decimals)],
})
```

**改造后（多链）**：
```typescript
const handleTransfer = async () => {
  if (!adapter) return
  
  try {
    const receipt = await adapter.sendTransfer({
      from: address,
      to: recipientAddress,
      amount,
      token: isNativeToken(token) ? undefined : token,
    })
    
    // 更新状态
    setStatus(TransferStatus.SUCCESS)
    setTxHash(receipt.txHash)
  } catch (err: any) {
    setStatus(TransferStatus.FAILED)
    setError(err.message)
  }
}
```

### 5. 完整集成示例

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useUnifiedWallet } from '@/hooks/useUnifiedWallet'
import { AdapterFactory } from '@/adapters/AdapterFactory'
import { parseTransferIntent, checkNetworkConsistency } from '@/lib/ai-intent-parser'
import { TransferData, TransferStatus } from '@/types/transfer'
import { isNativeToken } from '@/lib/tokens'

interface TransferCardProps {
  data: TransferData
  conversationId?: string
  onUpdate?: (data: TransferData) => void
}

export default function TransferCard({ data, conversationId, onUpdate }: TransferCardProps) {
  const { chain, address, connected, networkId } = useUnifiedWallet()
  const adapter = connected ? AdapterFactory.createAdapter(networkId || 'eth-mainnet') : null
  
  const [status, setStatus] = useState<TransferStatus>(TransferStatus.IDLE)
  const [balance, setBalance] = useState<string>('0')
  const [error, setError] = useState<string>('')
  const [txHash, setTxHash] = useState<string>('')
  
  // 解析 AI 意图
  const intent = parseTransferIntent(data.intent || '', chain)
  const consistency = checkNetworkConsistency(intent, chain, networkId || '')
  
  // 获取余额
  useEffect(() => {
    if (!adapter || !address) return
    
    adapter.getBalance(address, isNativeToken(data.token) ? undefined : data.token)
      .then(setBalance)
      .catch(err => console.error('Failed to get balance:', err))
  }, [adapter, address, data.token])
  
  // 执行转账
  const handleTransfer = async () => {
    if (!adapter || !connected) {
      setError('请先连接钱包')
      return
    }
    
    if (!consistency.isConsistent) {
      setError(consistency.conflictMessage)
      return
    }
    
    setStatus(TransferStatus.PENDING)
    setError('')
    
    try {
      const receipt = await adapter.sendTransfer({
        from: address,
        to: data.recipientAddress,
        amount: data.amount,
        token: isNativeToken(data.token) ? undefined : data.token,
      })
      
      setStatus(TransferStatus.SUCCESS)
      setTxHash(receipt.txHash)
      
      // 保存交易记录
      if (conversationId) {
        await transferService.saveTransferRecord({
          conversationId,
          network: networkId || '',
          token: data.token,
          amount: data.amount,
          from: address,
          to: data.recipientAddress,
          txHash: receipt.txHash,
          status: 'success',
        })
      }
    } catch (err: any) {
      setStatus(TransferStatus.FAILED)
      setError(err.message || '转账失败')
    }
  }
  
  // 网络不匹配提示
  if (!consistency.isConsistent) {
    return (
      <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4">
        <p className="text-red-400 text-sm">⚠️ {consistency.conflictMessage}</p>
        <p className="text-gray-400 text-xs mt-2">{consistency.suggestion}</p>
      </div>
    )
  }
  
  // UI 渲染...
}
```

## 关键改进点

### ✅ 已实现
1. **统一钱包状态** - `useUnifiedWallet` 合并 EVM 和 Solana 状态
2. **适配器工厂** - `AdapterFactory` 根据网络创建适配器
3. **AI 意图解析** - 识别用户输入中的网络意图
4. **网络一致性校验** - 防止跨链误操作

### ⏳ 待实现
1. **EVM 适配器** - 封装现有 Wagmi 逻辑到 EVMAdapter
2. **TransferCard 完整重构** - 移除 Wagmi 直接依赖
3. **Solana 余额查询** - 支持 SPL Token 余额
4. **Gas 估算** - Solana 和 EVM 的费用估算

## 注意事项

### ⚠️ 兼容性
- 现有 TransferCard 的 EVM 功能必须保持 100% 兼容
- 渐进式迁移，先添加适配器层，再逐步替换

### ⚠️ 状态管理
- TransferCard 的状态管理逻辑保持不变
- 只是底层执行从 Wagmi 改为适配器

### ⚠️ 错误处理
- 适配器应返回标准化的错误信息
- TransferCard 负责展示错误

## 下一步

1. 创建 `EVMAdapter` 封装现有 Wagmi 逻辑
2. 修改 TransferCard 使用适配器
3. 测试 EVM 功能无回归
4. 添加 Solana 转账支持
5. 端到端测试
