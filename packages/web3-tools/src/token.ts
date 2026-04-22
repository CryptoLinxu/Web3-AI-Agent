import { ToolResult, TokenMetadata, ChainId, EvmChainId } from './types'
import { findToken } from './tokens'

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

/**
 * 判断是否为 EVM 链
 */
function isEvmChain(chain: ChainId): chain is EvmChainId {
  return ['ethereum', 'polygon', 'bsc'].includes(chain)
}
