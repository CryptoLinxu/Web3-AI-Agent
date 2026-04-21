import { ToolResult, ETHPriceData, BTCPriceData } from './types'
import fetch from 'node-fetch'
import { HttpsProxyAgent } from 'https-proxy-agent'

const BINANCE_API = 'https://api.binance.com/api/v3'
const HUOBI_API = 'https://api.huobi.pro'

// 代理配置
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY
const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined

if (proxyAgent) {
  console.log('✅ Web3 Tools 代理已配置:', proxyUrl)
}

/**
 * 获取 ETH 当前价格
 * 支持多数据源容错和代理配置
 */
export async function getETHPrice(): Promise<ToolResult<ETHPriceData>> {
  // 使用国内可访问的数据源
  const sources = [
    {
      name: 'Binance CN',
      url: `${BINANCE_API}/ticker/price?symbol=ETHUSDT`,
      parse: (data: unknown): ETHPriceData => {
        const priceData = data as { price: string }
        return {
          price: parseFloat(priceData.price),
          change24h: 0,
          currency: 'USD',
        }
      },
    },
    {
      name: 'Huobi',
      url: `${HUOBI_API}/market/detail/merged?symbol=ethusdt`,
      parse: (data: unknown): ETHPriceData => {
        const tickData = data as { tick: { close: number; open: number } }
        const close = tickData.tick.close
        const open = tickData.tick.open
        return {
          price: close,
          change24h: ((close - open) / open) * 100,
          currency: 'USD',
        }
      },
    },
  ]

  for (const source of sources) {
    try {
      const response = await fetch(source.url, {
        signal: AbortSignal.timeout(10000), // 10秒超时
        agent: proxyAgent, // 使用代理
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      const priceData = source.parse(data)

      return {
        success: true,
        data: priceData,
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

/**
 * 获取 BTC 当前价格
 * 支持多数据源容错和代理配置
 */
export async function getBTCPrice(): Promise<ToolResult<BTCPriceData>> {
  // 使用国内可访问的数据源
  const sources = [
    {
      name: 'Binance CN',
      url: `${BINANCE_API}/ticker/price?symbol=BTCUSDT`,
      parse: (data: unknown): BTCPriceData => {
        const priceData = data as { price: string }
        return {
          price: parseFloat(priceData.price),
          change24h: 0,
          currency: 'USD',
        }
      },
    },
    {
      name: 'Huobi',
      url: `${HUOBI_API}/market/detail/merged?symbol=btcusdt`,
      parse: (data: unknown): BTCPriceData => {
        const tickData = data as { tick: { close: number; open: number } }
        const close = tickData.tick.close
        const open = tickData.tick.open
        return {
          price: close,
          change24h: ((close - open) / open) * 100,
          currency: 'USD',
        }
      },
    },
  ]

  for (const source of sources) {
    try {
      const response = await fetch(source.url, {
        signal: AbortSignal.timeout(10000), // 10秒超时
        agent: proxyAgent, // 使用代理
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      const priceData = source.parse(data)

      return {
        success: true,
        data: priceData,
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
