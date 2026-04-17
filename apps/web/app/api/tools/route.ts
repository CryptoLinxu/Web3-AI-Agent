import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'

interface ToolRequest {
  name: string
  arguments: Record<string, unknown>
}

// 工具实现
async function getETHPrice() {
  try {
    // 使用 CoinGecko API 获取 ETH 价格
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true',
      { next: { revalidate: 60 } }
    )

    if (!response.ok) {
      throw new Error('价格数据获取失败')
    }

    const data = await response.json()
    return {
      price: data.ethereum.usd,
      change24h: data.ethereum.usd_24h_change,
      currency: 'USD',
      source: 'CoinGecko',
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    return {
      error: true,
      message: error instanceof Error ? error.message : '获取价格失败',
    }
  }
}

async function getWalletBalance(args: { address: string }) {
  try {
    const { address } = args

    // 验证地址格式
    if (!ethers.isAddress(address)) {
      return {
        error: true,
        message: '无效的以太坊地址格式',
      }
    }

    // 使用 Alchemy 或 Infura 获取余额
    const provider = new ethers.JsonRpcProvider(
      process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com'
    )

    const balance = await provider.getBalance(address)
    const balanceInEth = ethers.formatEther(balance)

    return {
      address,
      balance: balanceInEth,
      unit: 'ETH',
      source: 'Ethereum RPC',
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    return {
      error: true,
      message: error instanceof Error ? error.message : '获取余额失败',
    }
  }
}

async function getGasPrice() {
  try {
    const provider = new ethers.JsonRpcProvider(
      process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com'
    )

    const feeData = await provider.getFeeData()
    
    return {
      gasPrice: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : null,
      maxFeePerGas: feeData.maxFeePerGas ? ethers.formatUnits(feeData.maxFeePerGas, 'gwei') : null,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas 
        ? ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei') 
        : null,
      unit: 'Gwei',
      source: 'Ethereum RPC',
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    return {
      error: true,
      message: error instanceof Error ? error.message : '获取 Gas 价格失败',
    }
  }
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
        result = await getWalletBalance(args as { address: string })
        break
      case 'getGasPrice':
        result = await getGasPrice()
        break
      default:
        result = {
          error: true,
          message: `未知工具: ${name}`,
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
