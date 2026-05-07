# TransferCard 适配器集成指南

## 概述

本文档说明如何将 TransferCard 从现有的 EVM 专用实现改造为支持多链适配器模式。

## 当前架构

TransferCard 目前直接使用 Wagmi hooks：
- `useAccount` - EVM 账户
- `useChainId` - EVM 链 ID
- `useSendTransaction` - EVM 交易发送
- `useWriteContract` - EVM 合约调用

## 目标架构

使用适配器模式，根据网络类型自动路由到对应的实现：

```
用户输入 
  → AI 意图解析 (ai-intent-parser)
  → 网络一致性校验
  → AdapterFactory 创建适配器
  → 适配器执行转账
  → 返回结果
```

## 集成步骤

### 1. 在 TransferCard 中使用统一钱包

```typescript
import { useUnifiedWallet } from '@/hooks/useUnifiedWallet'
import { AdapterFactory } from '@/adapters/AdapterFactory'

function TransferCard({ data }: TransferCardProps) {
  const { chain, address, connected, chainId, networkId } = useUnifiedWallet()
  
  // 根据网络类型创建适配器
  const adapter = connected ? AdapterFactory.createAdapter(networkId || 'eth-mainnet') : null
}
```

### 2. AI 意图解析集成

```typescript
import { parseTransferIntent, checkNetworkConsistency } from '@/lib/ai-intent-parser'

function TransferCard({ data }: TransferCardProps) {
  const { chain, networkId } = useUnifiedWallet()
  
  // 解析用户输入（假设从 data.intent 获取）
  const intent = parseTransferIntent(data.intent || '', chain)
  
  // 检查网络一致性
  const consistency = checkNetworkConsistency(intent, chain, networkId || '')
  
  if (!consistency.isConsistent) {
    // 显示网络不匹配错误
    return <NetworkMismatchError message={consistency.conflictMessage} />
  }
}
```

### 3. 余额查询适配

**当前实现（EVM only）**：
```typescript
const { data: balance } = useBalance({
  address: address,
  token: isNativeToken(token) ? undefined : token as `0x${string}`,
})
```

**改造后（多链）**：
```typescript
const [balance, setBalance] = useState<string>('0')

useEffect(() => {
  if (!adapter || !address) return
  
  adapter.getBalance(address, isNativeToken(token) ? undefined : token)
    .then(setBalance)
    .catch(err => console.error('Failed to get balance:', err))
}, [adapter, address, token])
```

### 4. 转账执行适配

**当前实现（EVM only）**：
```typescript
// 原生代币
sendTransaction({
  to: recipientAddress as `0x${string}`,
  value: parseEther(amount),
})

// ERC20
writeContract({
  address: token as `0x${string}`,
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
