/**
 * AI 意图解析增强 - 多链网络识别
 * 
 * 功能：
 * 1. 从用户提示词中识别目标网络（EVM 或 Solana）
 * 2. 校验用户意图网络与当前钱包连接网络是否一致
 * 3. 提供网络切换建议
 */

import { SOLANA_CONFIG } from '@/config/solana-chains'

/**
 * 网络配置接口
 */
export interface NetworkConfig {
  id: string
  name: string
  displayName: string
  rpcUrl: string
  explorerUrl: string
  chainId?: number
  nativeCurrency: {
    symbol: string
    decimals: number
  }
}

/**
 * Solana 网络配置映射
 */
const SOLANA_NETWORKS: NetworkConfig[] = [
  {
    id: 'solana-mainnet',
    name: 'Solana',
    displayName: 'Solana Mainnet',
    rpcUrl: SOLANA_CONFIG.mainnet.endpoint,
    explorerUrl: 'https://solscan.io',
    nativeCurrency: { symbol: 'SOL', decimals: 9 },
  },
  {
    id: 'solana-devnet',
    name: 'Solana Devnet',
    displayName: 'Solana Devnet',
    rpcUrl: SOLANA_CONFIG.devnet.endpoint,
    explorerUrl: 'https://solscan.io/?cluster=devnet',
    nativeCurrency: { symbol: 'SOL', decimals: 9 },
  },
]

/**
 * 网络类型枚举
 */
export enum NetworkType {
  EVM = 'evm',
  SOLANA = 'solana',
  UNKNOWN = 'unknown',
}

/**
 * AI 解析的转账意图
 */
export interface TransferIntent {
  /** 目标网络 ID */
  targetNetworkId: string
  /** 网络类型 */
  networkType: NetworkType
  /** 代币符号（可选） */
  tokenSymbol?: string
  /** 代币地址（可选） */
  tokenAddress?: string
  /** 转账金额 */
  amount: string
  /** 目标地址 */
  toAddress: string
  /** 是否明确提到网络 */
  networkExplicitlyMentioned: boolean
  /** 置信度 (0-1) */
  confidence: number
}

/**
 * 网络一致性检查结果
 */
export interface NetworkConsistencyCheck {
  /** 是否一致 */
  isConsistent: boolean
  /** 当前网络 ID */
  currentNetworkId: string
  /** 目标网络 ID */
  targetNetworkId: string
  /** 冲突描述 */
  conflictMessage?: string
  /** 建议操作 */
  suggestion?: string
}

/**
 * 网络关键词映射
 */
const NETWORK_KEYWORDS: Record<string, string[]> = {
  // Solana 相关
  'solana-mainnet': ['solana', 'sol', '◎'],
  'solana-devnet': ['solana devnet', 'solana test', 'devnet'],
  
  // EVM 网络（示例）
  'eth-mainnet': ['ethereum', 'eth', '主网'],
  'polygon-mainnet': ['polygon', 'matic', '多边形'],
  'bsc-mainnet': ['bsc', 'bnb', '币安'],
}

/**
 * 代币符号到网络的映射
 */
const TOKEN_TO_NETWORK: Record<string, string> = {
  SOL: 'solana-mainnet',
  USDC: 'eth-mainnet', // 默认 EVM
  USDT: 'eth-mainnet', // 默认 EVM
}

/**
 * 从用户提示词中解析转账意图
 * 
 * @param userInput 用户输入
 * @param currentChain 当前连接的链类型 ('evm' | 'solana')
 * @returns 解析的转账意图
 */
export function parseTransferIntent(
  userInput: string,
  currentChain: 'evm' | 'solana' | 'none'
): TransferIntent {
  const lowerInput = userInput.toLowerCase()
  
  // 1. 检测网络类型
  let detectedNetworkId = ''
  let networkType = NetworkType.UNKNOWN
  let networkExplicitlyMentioned = false
  
  // 检查是否明确提到 Solana
  for (const [networkId, keywords] of Object.entries(NETWORK_KEYWORDS)) {
    if (networkId.startsWith('solana') && keywords.some(kw => lowerInput.includes(kw))) {
      detectedNetworkId = networkId
      networkType = NetworkType.SOLANA
      networkExplicitlyMentioned = true
      break
    }
  }
  
  // 检查是否明确提到 EVM 网络
  if (networkType === NetworkType.UNKNOWN) {
    for (const [networkId, keywords] of Object.entries(NETWORK_KEYWORDS)) {
      if (!networkId.startsWith('solana') && keywords.some(kw => lowerInput.includes(kw))) {
        detectedNetworkId = networkId
        networkType = NetworkType.EVM
        networkExplicitlyMentioned = true
        break
      }
    }
  }
  
  // 2. 通过代币符号推断网络
  let tokenSymbol: string | undefined
  if (networkType === NetworkType.UNKNOWN) {
    // 检查 SOL
    if (/\b(sol)\b/.test(lowerInput)) {
      detectedNetworkId = 'solana-mainnet'
      networkType = NetworkType.SOLANA
      tokenSymbol = 'SOL'
    }
    // 检查其他代币（默认 EVM）
    else if (/\b(usdc|usdt|eth|matic|bnb)\b/.test(lowerInput)) {
      detectedNetworkId = 'eth-mainnet'
      networkType = NetworkType.EVM
      tokenSymbol = lowerInput.match(/\b(usdc|usdt|eth|matic|bnb)\b/)?.[1]?.toUpperCase()
    }
  }
  
  // 3. 如果仍未检测到，使用当前连接的网络
  let confidence = 0.5
  if (networkType === NetworkType.UNKNOWN) {
    if (currentChain === 'solana') {
      detectedNetworkId = 'solana-mainnet'
      networkType = NetworkType.SOLANA
      confidence = 0.3 // 低置信度，基于推断
    } else if (currentChain === 'evm') {
      detectedNetworkId = 'eth-mainnet'
      networkType = NetworkType.EVM
      confidence = 0.3
    }
  } else if (networkExplicitlyMentioned) {
    confidence = 0.9
  } else {
    confidence = 0.7
  }
  
  // 4. 提取金额和地址（简化版，实际应由 AI 提取）
  const amountMatch = userInput.match(/(\d+\.?\d*)\s*(sol|usdc|usdt|eth)?/i)
  const amount = amountMatch?.[1] || '0'
  
  // 提取地址（简化版）
  const evmAddressMatch = userInput.match(/(0x[a-fA-F0-9]{40})/)
  const solanaAddressMatch = userInput.match(/([1-9A-HJ-NP-Za-km-z]{32,44})/)
  const toAddress = evmAddressMatch?.[1] || solanaAddressMatch?.[1] || ''
  
  if (!tokenSymbol && amountMatch?.[2]) {
    tokenSymbol = amountMatch[2].toUpperCase()
  }
  
  return {
    targetNetworkId: detectedNetworkId || (currentChain === 'solana' ? 'solana-mainnet' : 'eth-mainnet'),
    networkType,
    tokenSymbol,
    amount,
    toAddress,
    networkExplicitlyMentioned,
    confidence,
  }
}

/**
 * 检查网络一致性
 * 
 * @param intent AI 解析的转账意图
 * @param currentChain 当前连接的链类型
 * @param currentNetworkId 当前网络 ID
 * @returns 一致性检查结果
 */
export function checkNetworkConsistency(
  intent: TransferIntent,
  currentChain: 'evm' | 'solana' | 'none',
  currentNetworkId: string
): NetworkConsistencyCheck {
  // 无网络意图
  if (intent.networkType === NetworkType.UNKNOWN) {
    return {
      isConsistent: true,
      currentNetworkId,
      targetNetworkId: intent.targetNetworkId,
    }
  }
  
  // 检查链类型是否匹配
  if (intent.networkType === NetworkType.SOLANA && currentChain !== 'solana') {
    return {
      isConsistent: false,
      currentNetworkId,
      targetNetworkId: intent.targetNetworkId,
      conflictMessage: `检测到 Solana 网络转账意图，但当前连接的是 ${currentChain === 'evm' ? 'EVM' : '未连接'} 钱包`,
      suggestion: '请先切换到 Solana 钱包',
    }
  }
  
  if (intent.networkType === NetworkType.EVM && currentChain !== 'evm') {
    return {
      isConsistent: false,
      currentNetworkId,
      targetNetworkId: intent.targetNetworkId,
      conflictMessage: `检测到 EVM 网络转账意图，但当前连接的是 Solana 钱包`,
      suggestion: '请先切换到 EVM 钱包',
    }
  }
  
  // 检查具体网络 ID（仅 EVM 需要，Solana 目前只有主网）
  if (intent.networkType === NetworkType.EVM && intent.targetNetworkId !== currentNetworkId) {
    return {
      isConsistent: false,
      currentNetworkId,
      targetNetworkId: intent.targetNetworkId,
      conflictMessage: `当前网络与目标网络不匹配`,
      suggestion: `请在钱包中切换到目标网络`,
    }
  }
  
  return {
    isConsistent: true,
    currentNetworkId,
    targetNetworkId: intent.targetNetworkId,
  }
}

/**
 * 获取 Solana 网络配置
 * 
 * @param networkId 网络 ID
 * @returns 网络配置
 */
export function getSolanaNetworkConfig(networkId: string): NetworkConfig | undefined {
  return SOLANA_NETWORKS.find((n: NetworkConfig) => n.id === networkId)
}

/**
 * 格式化网络名称
 * 
 * @param networkId 网络 ID
 * @param networkType 网络类型
 * @returns 友好的网络名称
 */
export function formatNetworkName(networkId: string, networkType: NetworkType): string {
  if (networkType === NetworkType.SOLANA) {
    const config = getSolanaNetworkConfig(networkId)
    return config?.displayName || 'Solana'
  }
  
  // EVM 网络
  const evmNames: Record<string, string> = {
    'eth-mainnet': 'Ethereum',
    'polygon-mainnet': 'Polygon',
    'bsc-mainnet': 'BSC',
  }
  
  return evmNames[networkId] || networkId
}
