// Bitcoin 链适配器

import { ToolResult, BalanceData } from '../types'
import fetch from 'node-fetch'
import { HttpsProxyAgent } from 'https-proxy-agent'

// 代理配置
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY
const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined

// BTC 地址验证正则（Base58 和 Bech32）
const BTC_ADDRESS_REGEX = /^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/

/**
 * Bitcoin 链适配器
 * 使用公共 API 查询余额（无需运行全节点）
 */
export class BitcoinAdapter {
  // 公共 API 列表
  private readonly apiUrls = [
    'https://blockchain.info',
    'https://api.blockchair.com/bitcoin',
  ]

  /**
   * 获取 BTC 钱包余额
   * @param address - BTC 地址
   * @returns 余额数据
   */
  async getBalance(address: string): Promise<ToolResult<BalanceData>> {
    try {
      // 验证地址格式
      if (!this.validateAddress(address)) {
        return {
          success: false,
          error: '无效的 Bitcoin 地址格式',
          timestamp: new Date().toISOString(),
          source: 'Bitcoin',
        }
      }

      // 尝试多个 API 数据源
      const balance = await this.fetchBalanceWithFallback(address)

      // 从 satoshi 转换为 BTC（1 BTC = 100,000,000 satoshi）
      const balanceInBtc = balance / 100_000_000

      return {
        success: true,
        data: {
          chain: 'bitcoin',
          address,
          balance: balanceInBtc.toString(),
          unit: 'BTC',
          decimals: 8,
        },
        timestamp: new Date().toISOString(),
        source: 'Bitcoin API',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取 BTC 余额失败',
        timestamp: new Date().toISOString(),
        source: 'Bitcoin',
      }
    }
  }

  /**
   * 验证 BTC 地址格式
   * @param address - BTC 地址
   * @returns 是否有效
   */
  validateAddress(address: string): boolean {
    return BTC_ADDRESS_REGEX.test(address)
  }

  /**
   * 带容错的余额查询
   * @param address - BTC 地址
   * @returns 余额（satoshi）
   */
  private async fetchBalanceWithFallback(address: string): Promise<number> {
    // 数据源 1: Blockchain.info
    try {
      const response = await fetch(
        `https://blockchain.info/rawaddr/${address}?format=json`,
        {
          signal: AbortSignal.timeout(10000),
          agent: proxyAgent,
        }
      )
      if (response.ok) {
        const data = (await response.json()) as { final_balance: number }
        return data.final_balance
      }
    } catch (error) {
      console.warn('Blockchain.info API 失败:', error)
    }

    // 数据源 2: Blockchair
    try {
      const response = await fetch(
        `https://api.blockchair.com/bitcoin/dashboards/address/${address}`,
        {
          signal: AbortSignal.timeout(10000),
          agent: proxyAgent,
        }
      )
      if (response.ok) {
        const data = (await response.json()) as {
          data: { [key: string]: { address: { balance: number } } }
        }
        const addressData = Object.values(data.data)[0]
        return addressData.address.balance
      }
    } catch (error) {
      console.warn('Blockchair API 失败:', error)
    }

    throw new Error('所有 BTC 余额 API 都不可用')
  }
}
