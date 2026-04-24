'use client'

import { TransferData } from '@/types/transfer'

interface DexSwapCardProps {
  data: TransferData & {
    fromToken?: string
    toToken?: string
    fromAmount?: string
    toAmount?: string
    slippage?: number
  }
  conversationId?: string
  onUpdate?: (data: any) => void
}

/**
 * DEX 兑换卡片(预留)
 * TODO: 后续实现 DEX Swap 功能
 */
export default function DexSwapCard({ data }: DexSwapCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="text-center py-8">
        <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
        <p className="text-sm text-gray-500">兑换功能开发中...</p>
      </div>
    </div>
  )
}
