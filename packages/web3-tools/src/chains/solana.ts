// Solana 链适配器

import { ToolResult, BalanceData } from '../types'
import fetch from 'node-fetch'
import { HttpsProxyAgent } from 'https-proxy-agent'

// 代理配置
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY
const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined

// Solana 地址验证（Base58 编码的公钥，32-44 字符）
const SOL_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

// 默认 RPC 节点
const DEFAULT_SOLANA_RPC = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'

/**
 * Solana 链适配器
 * 使用 JSON-RPC API 查询余额
 */
export class SolanaAdapter {
  private readonly rpcUrl: string

  constructor(rpcUrl?: string) {
    this.rpcUrl = rpcUrl || DEFAULT_SOLANA_RPC
  }

  /**
   * 获取 SOL 钱包余额
   * @param address - SOL 地址
   * @returns 余额数据
   */
  async getBalance(address: string): Promise<ToolResult<BalanceData>> {
    try {
      // 验证地址格式
      if (!this.validateAddress(address)) {
        return {
          success: false,
          error: '无效的 Solana 地址格式',
          timestamp: new Date().toISOString(),
          source: 'Solana',
        }
      }

      // 调用 Solana JSON-RPC API
      const balance = await this.fetchBalance(address)

      // 从 lamports 转换为 SOL（1 SOL = 10^9 lamports）
      const balanceInSol = balance / 1_000_000_000

      return {
        success: true,
        data: {
          chain: 'solana',
          address,
          balance: balanceInSol.toString(),
          unit: 'SOL',
          decimals: 9,
        },
        timestamp: new Date().toISOString(),
        source: 'Solana RPC',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取 SOL 余额失败',
        timestamp: new Date().toISOString(),
        source: 'Solana',
      }
    }
  }

  /**
   * 验证 Solana 地址格式
   * @param address - SOL 地址
   * @returns 是否有效
   */
  validateAddress(address: string): boolean {
    return SOL_ADDRESS_REGEX.test(address)
  }

  /**
   * 调用 Solana RPC 获取余额
   * @param address - SOL 地址
   * @returns 余额（lamports）
   */
  private async fetchBalance(address: string): Promise<number> {
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [address],
      }),
      signal: AbortSignal.timeout(10000),
      agent: proxyAgent,
    })

    if (!response.ok) {
      throw new Error(`Solana RPC HTTP ${response.status}`)
    }

    const data = (await response.json()) as {
      result: { value: number }
      error?: { message: string }
    }

    if (data.error) {
      throw new Error(`Solana RPC 错误: ${data.error.message}`)
    }

    return data.result.value
  }
}
