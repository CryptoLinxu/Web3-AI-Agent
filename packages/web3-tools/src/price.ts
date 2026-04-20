import { ToolResult, ETHPriceData } from './types'

const COINGECKO_API = 'https://api.coingecko.com/api/v3'
const BINANCE_API = 'https://api.binance.com/api/v3'

/**
 * 获取 ETH 当前价格
 */
export async function getETHPrice(): Promise<ToolResult<ETHPriceData>> {
  // 尝试多个数据源
  const sources = [
    {
      name: 'Binance',
      fetch: async () => {
        const response = await fetch(`${BINANCE_API}/ticker/price?symbol=ETHUSDT`)
        if (!response.ok) throw new Error(`Binance API 错误: ${response.status}`)
        const data = await response.json() as { price: string }
        return {
          price: parseFloat(data.price),
          change24h: 0, // Binance 简单接口不包含 24h 变化
          currency: 'USD',
        }
      },
    },
    {
      name: 'CoinGecko',
      fetch: async () => {
        const response = await fetch(
          `${COINGECKO_API}/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true`
        )
        if (!response.ok) throw new Error(`CoinGecko API 错误: ${response.status}`)
        const data = await response.json() as { ethereum: { usd: number; usd_24h_change: number } }
        return {
          price: data.ethereum.usd,
          change24h: data.ethereum.usd_24h_change,
          currency: 'USD',
        }
      },
    },
  ]

  // 依次尝试每个数据源
  for (const source of sources) {
    try {
      const data = await source.fetch()
      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
        source: source.name,
      }
    } catch (error) {
      console.warn(`${source.name} 数据源失败:`, error)
      // 继续尝试下一个数据源
    }
  }

  // 所有数据源都失败
  return {
    success: false,
    error: '所有价格数据源都不可用，请稍后重试',
    timestamp: new Date().toISOString(),
    source: 'Multiple',
  }
}
