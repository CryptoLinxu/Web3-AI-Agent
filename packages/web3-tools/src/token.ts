import { ethers } from 'ethers'
import { ToolResult, TokenMetadata, ChainId, EvmChainId, BalanceData } from './types'
import { findToken } from './tokens'
import { getRpcUrl } from './chains'

/**
 * 查询 Token 元数据信息
 * @param chain - 链 ID（仅支持 EVM 链）
 * @param symbolOrAddress - Token 符号或合约地址
 * @returns Token 元数据
 */
export async function getTokenInfo(
  chain: ChainId,
  symbolOrAddress: string
): Promise<ToolResult<TokenMetadata>> {
  // 仅支持 EVM 链
  if (!isEvmChain(chain)) {
    return {
      success: false,
      error: `暂不支持 ${chain} 链的 Token 查询`,
      timestamp: new Date().toISOString(),
      source: 'Local',
    }
  }

  try {
    const token = findToken(chain, symbolOrAddress)

    if (!token) {
      return {
        success: false,
        error: `未找到 Token: ${symbolOrAddress}（${chain}）`,
        timestamp: new Date().toISOString(),
        source: 'Token Registry',
      }
    }

    return {
      success: true,
      data: {
        chain: token.chain,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        contractAddress: token.contractAddress,
        logoUri: token.logoUri,
      },
      timestamp: new Date().toISOString(),
      source: 'Token Registry',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '查询 Token 信息失败',
      timestamp: new Date().toISOString(),
      source: 'Token Registry',
    }
  }
}

// ERC20 balanceOf ABI
const ERC20_BALANCE_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
]

/**
 * 查询指定链上钱包的 ERC20 Token 余额
 * @param chain - 链 ID（仅支持 EVM 链: ethereum, polygon, bsc）
 * @param address - 钱包地址
 * @param tokenSymbol - Token 符号（如 USDT, USDC）或合约地址
 * @returns Token 余额数据
 */
export async function getTokenBalance(
  chain: ChainId,
  address: string,
  tokenSymbol: string
): Promise<ToolResult<BalanceData>> {
  // 仅支持 EVM 链
  if (!isEvmChain(chain)) {
    return {
      success: false,
      error: `暂不支持 ${chain} 链的 Token 余额查询`,
      timestamp: new Date().toISOString(),
      source: 'Local',
    }
  }

  try {
    // 从注册表查找 Token 信息
    const token = findToken(chain, tokenSymbol)
    if (!token) {
      return {
        success: false,
        error: `未找到 Token: ${tokenSymbol}（${chain}）`,
        timestamp: new Date().toISOString(),
        source: 'Token Registry',
      }
    }

    console.log(`[getTokenBalance] 参数: chain=${chain}, address=${address}, tokenSymbol=${tokenSymbol}`)
    console.log(`[getTokenBalance] Token 元数据:`, { 
      contractAddress: token.contractAddress, 
      decimals: token.decimals, 
      name: token.name 
    })

    // 创建 RPC 连接
    const rpcUrl = getRpcUrl(chain)
    const provider = new ethers.JsonRpcProvider(rpcUrl)

    // 调用 ERC20 balanceOf 方法
    const contract = new ethers.Contract(token.contractAddress, ERC20_BALANCE_ABI, provider)
    const balance: bigint = await contract.balanceOf(address)
    const formattedBalance = ethers.formatUnits(balance, token.decimals)

    console.log(`[getTokenBalance] 原始余额: ${balance.toString()}, 格式化: ${formattedBalance} ${token.symbol}`)

    return {
      success: true,
      data: {
        chain,
        address,
        balance: formattedBalance,
        unit: token.symbol,
        decimals: token.decimals,
      },
      timestamp: new Date().toISOString(),
      source: `${chain} RPC`,
    }
  } catch (error) {
    console.error(`[getTokenBalance] 错误:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '查询 Token 余额失败',
      timestamp: new Date().toISOString(),
      source: 'Local',
    }
  }
}

/**
 * 判断是否为 EVM 链
 */
function isEvmChain(chain: ChainId): chain is EvmChainId {
  return ['ethereum', 'polygon', 'bsc'].includes(chain)
}
