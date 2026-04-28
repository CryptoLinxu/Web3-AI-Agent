import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DexSwapCard from '@/components/cards/DexSwapCard'

describe('DexSwapCard', () => {
  it('应渲染"兑换功能开发中..."', () => {
    render(<DexSwapCard data={{ id: '1', from: '0x123', to: '0x456', tokenSymbol: 'ETH', amount: '1', chain: 'ethereum', status: 'pending' }} />)
    
    expect(screen.getByText('兑换功能开发中...')).toBeInTheDocument()
  })
})
