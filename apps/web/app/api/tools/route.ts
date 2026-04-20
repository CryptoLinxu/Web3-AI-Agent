import { NextRequest, NextResponse } from 'next/server'
import { getETHPrice, getWalletBalance, getGasPrice } from '@web3-ai-agent/web3-tools'

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
      case 'getETHPrice':
        result = await getETHPrice()
        break
      case 'getWalletBalance':
        result = await getWalletBalance((args as { address: string }).address)
        break
      case 'getGasPrice':
        result = await getGasPrice()
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
