import { ToolResult, ETHPriceData } from './types'

const COINGECKO_API = 'https://api.coingecko.com/api/v3'

/**
 * 获取 ETH 当前价格
 */
export async function getETHPrice(): Promise<ToolResult<ETHPriceData>> {
  try {
    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true`
    )

    if (!response.ok) {
      throw new Error(`CoinGecko API 错误: ${response.status}`)
    }

    const data = await response.json()

    return {
      success: true,
      data: {
        price: data.ethereum.usd,
        change24h: data.ethereum.usd_24h_change,
        currency: 'USD',
      },
      timestamp: new Date().toISOString(),
      source: 'CoinGecko',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取价格失败',
      timestamp: new Date().toISOString(),
      source: 'CoinGecko',
    }
  }
}
