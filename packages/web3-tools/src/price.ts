import { ToolResult, TokenPriceData } from './types'
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

// 支持的币种映射到交易对
const SYMBOL_MAP: Record<string, string> = {
  'ETH': 'ETHUSDT',
  'BTC': 'BTCUSDT',
  'SOL': 'SOLUSDT',
  'MATIC': 'MATICUSDT',
  'BNB': 'BNBUSDT',
}

/**
 * 获取指定加密货币的当前价格
 * 支持多币种、多数据源容错和代理配置
 * @param symbol - 加密货币符号（如 'ETH', 'BTC', 'SOL'）
 */
export async function getTokenPrice(symbol: string): Promise<ToolResult<TokenPriceData>> {
  const normalizedSymbol = symbol.toUpperCase()
  const tradingPair = SYMBOL_MAP[normalizedSymbol]

  if (!tradingPair) {
    return {
      success: false,
      error: `不支持的币种: ${symbol}。支持的币种: ${Object.keys(SYMBOL_MAP).join(', ')}`,
      timestamp: new Date().toISOString(),
      source: 'Local',
    }
  }

  // Huobi 需要小写
  const huobiSymbol = tradingPair.toLowerCase()

  // 使用国内可访问的数据源
  const sources = [
    {
      name: 'Binance CN',
      url: `${BINANCE_API}/ticker/price?symbol=${tradingPair}`,
      parse: (data: unknown): TokenPriceData => {
        const priceData = data as { price: string }
        return {
          symbol: normalizedSymbol,
          price: parseFloat(priceData.price),
          change24h: 0,
          currency: 'USD',
        }
      },
    },
    {
      name: 'Huobi',
      url: `${HUOBI_API}/market/detail/merged?symbol=${huobiSymbol}`,
      parse: (data: unknown): TokenPriceData => {
        const tickData = data as { tick: { close: number; open: number } }
        const close = tickData.tick.close
        const open = tickData.tick.open
        return {
          symbol: normalizedSymbol,
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
    error: `无法获取 ${normalizedSymbol} 价格，所有数据源均失败`,
    timestamp: new Date().toISOString(),
    source: 'Multiple',
  }
}

/**
 * @deprecated 使用 getTokenPrice('ETH') 替代
 */
export async function getETHPrice(): Promise<ToolResult<TokenPriceData>> {
  return getTokenPrice('ETH')
}

/**
 * @deprecated 使用 getTokenPrice('BTC') 替代
 */
export async function getBTCPrice(): Promise<ToolResult<TokenPriceData>> {
  return getTokenPrice('BTC')
}
