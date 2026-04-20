import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import { HttpsProxyAgent } from 'https-proxy-agent'
import fetch from 'node-fetch'

// 创建代理 agent
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY
const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined

if (proxyAgent) {
  console.log('✅ 代理已配置:', proxyUrl)
}

interface ToolRequest {
  name: string
  arguments: Record<string, unknown>
}

// 工具实现
async function getETHPrice() {
  // 使用国内可访问的数据源
  const sources = [
    {
      name: 'Binance CN',
      url: 'https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT',
      parse: (data: any) => ({
        price: parseFloat(data.price),
        change24h: 0,
        currency: 'USD',
      }),
    },
    {
      name: 'Huobi',
      url: 'https://api.huobi.pro/market/detail/merged?symbol=ethusdt',
      parse: (data: any) => ({
        price: data.tick.close,
        change24h: ((data.tick.close - data.tick.open) / data.tick.open) * 100,
        currency: 'USD',
      }),
    },
  ]

  for (const source of sources) {
    try {
      const response = await fetch(source.url, { 
        signal: AbortSignal.timeout(10000), // 10秒超时
        agent: proxyAgent // 使用代理
      })
      if (!response.ok) continue
      
      const data = await response.json()
      const priceData = source.parse(data)
      
      return {
        ...priceData,
        source: source.name,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      console.warn(`${source.name} 数据源失败:`, error)
      continue
    }
  }

  return {
    error: true,
    message: '所有价格数据源都不可用',
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
