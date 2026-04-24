import { NextRequest, NextResponse } from 'next/server'
import { getTokenPrice, getBalance, getGasPrice, getTokenBalance } from '@web3-ai-agent/web3-tools'
import type { ChainId, EvmChainId } from '@web3-ai-agent/web3-tools'

interface ToolRequest {
  name: string
  arguments: Record<string, unknown>
}

export async function POST(request: NextRequest) {
  try {
    const body: ToolRequest = await request.json()
    const { name, arguments: args } = body

    let result

    switch (name) {
      case 'getTokenPrice':
        result = await getTokenPrice((args as { symbol: string }).symbol)
        break
      case 'getBalance':
        result = await getBalance((args as { chain: string; address: string }).chain as any, (args as { address: string }).address)
        break
      case 'getGasPrice':
        result = await getGasPrice((args as { chain: string }).chain as EvmChainId)
        break
      case 'getTokenBalance':
        result = await getTokenBalance(
          (args as { chain: string }).chain as ChainId,
          (args as { address: string }).address,
          (args as { tokenSymbol: string }).tokenSymbol
        )
        break
      // 向后兼容旧 API
      case 'getETHPrice':
        result = await getTokenPrice('ETH')
        break
      case 'getBTCPrice':
        result = await getTokenPrice('BTC')
        break
      case 'getWalletBalance':
        result = await getBalance('ethereum', (args as { address: string }).address)
        break
      default:
        result = {
          success: false,
          error: `未知工具: ${name}`,
          timestamp: new Date().toISOString(),
          source: 'API',
        }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Tool API Error:', error)
    return NextResponse.json(
      {
        error: true,
        message: error instanceof Error ? error.message : '工具执行失败',
      },
      { status: 500 }
    )
  }
}
