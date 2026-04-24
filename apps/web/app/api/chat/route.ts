import { NextRequest, NextResponse } from 'next/server'
import { LLMFactory } from '@web3-ai-agent/ai-config'
import { Tool, Message, StreamChunk } from '@web3-ai-agent/ai-config'
import { ChatRequest } from '@/types/chat'
import { getETHPrice, getBTCPrice, getWalletBalance, getGasPrice, getTokenPrice, getBalance as getMultiChainBalance, getTokenInfo, getTokenBalance, ChainId, EvmChainId } from '@web3-ai-agent/web3-tools'

// 工具定义
const tools: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'getTokenPrice',
      description: '获取指定加密货币的当前价格（美元）',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            enum: ['ETH', 'BTC', 'SOL', 'MATIC', 'BNB'],
            description: '加密货币符号（如 ETH, BTC, SOL）',
          },
        },
        required: ['symbol'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getBalance',
      description: '查询指定链上钱包地址的余额',
      parameters: {
        type: 'object',
        properties: {
          chain: {
            type: 'string',
            enum: ['ethereum', 'polygon', 'bsc', 'bitcoin', 'solana'],
            description: '区块链名称（ethereum, polygon, bsc, bitcoin, solana）',
          },
          address: {
            type: 'string',
            description: '钱包地址',
          },
        },
        required: ['chain', 'address'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getGasPrice',
      description: '获取指定 EVM 链的当前 Gas 价格',
      parameters: {
        type: 'object',
        properties: {
          chain: {
            type: 'string',
            enum: ['ethereum', 'polygon', 'bsc'],
            description: '区块链名称（ethereum, polygon, bsc）',
          },
        },
        required: ['chain'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getTokenInfo',
      description: '查询 Token 的元数据信息（名称、合约地址、精度等）',
      parameters: {
        type: 'object',
        properties: {
          chain: {
            type: 'string',
            enum: ['ethereum', 'polygon', 'bsc'],
            description: '区块链名称（仅支持 EVM 链）',
          },
          symbol: {
            type: 'string',
            description: 'Token 符号（如 USDT）或合约地址',
          },
        },
        required: ['chain', 'symbol'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getTokenBalance',
      description: '查询指定钱包地址的 ERC20 Token 余额（如 USDT、USDC 等），仅支持 EVM 链',
      parameters: {
        type: 'object',
        properties: {
          chain: {
            type: 'string',
            enum: ['ethereum', 'polygon', 'bsc'],
            description: '区块链名称（ethereum, polygon, bsc）',
          },
          address: {
            type: 'string',
            description: '钱包地址',
          },
          tokenSymbol: {
            type: 'string',
            description: 'Token 符号（如 USDT, USDC, DAI）或合约地址',
          },
        },
        required: ['chain', 'address', 'tokenSymbol'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createTransferCard',
      description: '当用户表达转账意图时调用，生成转账卡片数据。支持 ETH 原生转账和 ERC20 Token 转账。',
      parameters: {
        type: 'object',
        properties: {
          to: {
            type: 'string',
            description: '接收地址（0x 开头的以太坊地址）',
          },
          tokenSymbol: {
            type: 'string',
            description: 'Token 符号（ETH, USDT, USDC 等）',
          },
          amount: {
            type: 'string',
            description: '转账金额（字符串格式，如 "100", "0.5"）',
          },
          chain: {
            type: 'string',
            enum: ['ethereum', 'polygon', 'bsc'],
            description: '区块链名称',
          },
        },
        required: ['to', 'tokenSymbol', 'amount', 'chain'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getBTCPrice',
      description: '获取 BTC 当前价格（美元）[已废弃，使用 getTokenPrice]',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
]

// 系统 Prompt（基础版）
const SYSTEM_PROMPT_BASE = `你是 Web3 AI Agent，一个专门帮助用户查询 Web3 信息和执行链上操作的助手。

## 你的能力
- 查询多种加密货币价格（ETH, BTC, SOL, MATIC, BNB）
- 查询多条链上钱包地址的余额：
  - EVM 链：Ethereum, Polygon, BSC
  - 非 EVM 链：Bitcoin, Solana
- 查询 EVM 链的当前 Gas 价格
- 查询 Token 元数据信息（名称、合约地址、精度）
- 查询 Token 余额（通过 getTokenBalance 工具查询 USDT、USDC 等 ERC20 Token 余额）
- 生成转账卡片，帮助用户在聊天窗口内完成链上转账

## 行为准则
1. 只回答与 Web3 相关的问题
2. 对于超出能力范围的问题，明确告知用户
3. 当需要查询数据时，主动调用相应工具
4. 工具返回的结果要整理成易懂的自然语言
5. 查询价格时使用 getTokenPrice 工具，传入 symbol 参数
6. 查询余额时使用 getBalance 工具，需要指定 chain 和 address
7. 查询 Gas 时使用 getGasPrice 工具，需要指定 chain（仅 EVM 链）
8. 查询 Token 信息时使用 getTokenInfo 工具，需要指定 chain 和 symbol
9. 查询 ERC20 Token（如 USDT、USDC）余额时使用 getTokenBalance 工具，需要指定 chain、address 和 tokenSymbol
10. 当用户表达转账意图时，使用 createTransferCard 工具生成转账卡片

## 转账场景识别
以下场景需要调用 createTransferCard 工具：
- "转 X 个 Token 给地址"
- "发送 X ETH/USDT 到地址"
- "帮我转账..."
- "向地址转账 X 金额"

调用时必须提供：to（接收地址）、tokenSymbol（Token符号）、amount（金额）、chain（链名称）

**重要：调用 createTransferCard 工具后，不要生成任何文字回复，直接返回空字符串。转账卡片会由前端自动渲染。**

## 安全边界
- 不提供交易建议
- 不预测价格走势
- 所有数据仅供参考，不构成投资建议
- 明确标注数据来源
- 转账前提醒用户确认地址和金额
- 明确告知“此操作不可逆”

## 回复格式
- 简洁明了
- 重要数据突出显示
- 必要时提供数据来源说明`

// 动态生成 system prompt（带钱包上下文）
function createSystemPrompt(walletAddress?: string): string {
  if (!walletAddress) {
    return SYSTEM_PROMPT_BASE
  }

  // 注入钱包上下文
  return `${SYSTEM_PROMPT_BASE}

## 当前用户信息
- 用户已连接钱包，地址为：${walletAddress}
- 当用户查询“我的余额”或“我的钱包”时，使用此地址
- 如果用户未指定地址，默认使用此地址查询余额`
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()
    const { messages, walletAddress } = body

    // 获取 LLM 提供商
    const provider = LLMFactory.getProvider()

    // 动态生成 system prompt（带钱包上下文）
    const systemPrompt = createSystemPrompt(walletAddress)

    // 转换消息格式
    const chatMessages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as Message['role'],
        content: m.content,
      })),
    ]

    // 检测是否请求流式输出
    const accept = request.headers.get('accept')
    const isStream = accept === 'text/event-stream'

    // 第一次调用：让模型决定是否需要工具
    console.log('\n========== 第 1 次 API 调用 ==========')
    console.log('📤 发送给 AI 的消息:')
    console.log(JSON.stringify(chatMessages, null, 2))
    console.log('\n🔧 工具定义:')
    console.log(JSON.stringify(tools, null, 2))
    console.log(`\n📡 响应模式: ${isStream ? 'SSE 流式' : 'JSON'}`)

    const response = await provider.chat(chatMessages, { tools })

    console.log('\n📥 AI 的回复:')
    console.log(JSON.stringify(response, null, 2))
    console.log('======================================\n')

    // 如果需要调用工具
    if (response.toolCalls && response.toolCalls.length > 0) {
      const toolCalls: Array<{
        id: string
        name: string
        arguments: Record<string, unknown>
        result: unknown
      }> = []

      // 执行所有工具调用
      for (const toolCall of response.toolCalls) {
        const functionName = toolCall.function.name
        const functionArgs = JSON.parse(toolCall.function.arguments)

        let result
        try {
          // 直接调用工具函数
          switch (functionName) {
            case 'getTokenPrice':
              result = await getTokenPrice(functionArgs.symbol as string)
              break
            case 'getBalance':
              result = await getMultiChainBalance(
                functionArgs.chain as ChainId,
                functionArgs.address as string
              )
              break
            case 'getGasPrice':
              result = await getGasPrice(functionArgs.chain as EvmChainId)
              break
            case 'getTokenInfo':
              result = await getTokenInfo(
                functionArgs.chain as ChainId,
                functionArgs.symbol as string
              )
              break
            case 'getTokenBalance':
              result = await getTokenBalance(
                functionArgs.chain as ChainId,
                functionArgs.address as string,
                functionArgs.tokenSymbol as string
              )
              break
            case 'createTransferCard':
              // 返回转账卡片数据，由前端渲染
              result = {
                success: true,
                transferData: {
                  to: functionArgs.to,
                  tokenSymbol: functionArgs.tokenSymbol,
                  amount: functionArgs.amount,
                  chain: functionArgs.chain,
                  from: walletAddress || ''
                }
              }
              break
            case 'getETHPrice':
              // 向后兼容
              result = await getETHPrice()
              break
            case 'getWalletBalance':
              // 向后兼容
              result = await getWalletBalance(functionArgs.address as string)
              break
            case 'getBTCPrice':
              // 向后兼容
              result = await getBTCPrice()
              break
            default:
              result = {
                success: false,
                error: `未知工具: ${functionName}`,
              }
          }
        } catch (error) {
          result = {
            success: false,
            error: `工具调用失败: ${error instanceof Error ? error.message : '未知错误'}`,
          }
        }

        toolCalls.push({
          id: toolCall.id,
          name: functionName,
          arguments: functionArgs,
          result,
        })
      }

      // 构建包含工具结果的消息列表
      const messagesWithToolResults: Message[] = [
        ...chatMessages,
        {
          role: 'assistant',
          content: response.content || '',
        },
        ...toolCalls.map((tc) => ({
          role: 'tool' as const,
          content: JSON.stringify(tc.result),
          tool_call_id: tc.id,
        })),
      ]

      // 第二次调用：让模型基于工具结果生成回复
      console.log('\n========== 第 2 次 API 调用 ==========')
      console.log('📤 带工具结果的消息:')
      console.log(JSON.stringify(messagesWithToolResults, null, 2))

      const secondResponse = await provider.chat(messagesWithToolResults)

      console.log('\n📥 最终回复:')
      console.log(secondResponse.content)
      console.log('======================================\n')

      // 检查是否有 createTransferCard 工具调用
      const transferCardCall = toolCalls.find(tc => tc.name === 'createTransferCard')
      const transferData = transferCardCall && (transferCardCall.result as any)?.transferData
        ? {
            id: `card-${Date.now()}`,
            ...(transferCardCall.result as any).transferData,
            status: 'pending' as const
          }
        : undefined

      // 工具调用场景：如果请求流式，也使用流式输出最终回复
      if (isStream) {
        const stream = new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder()

            try {
              // 发送工具调用信息
              for (const tc of toolCalls) {
                const chunk: StreamChunk = {
                  type: 'tool_call',
                  toolCall: {
                    id: tc.id,
                    type: 'function',
                    function: {
                      name: tc.name,
                      arguments: JSON.stringify(tc.arguments),
                    },
                  },
                }
                controller.enqueue(encoder.encode(`event: chunk\ndata: ${JSON.stringify(chunk)}\n\n`))
              }

              // 流式输出最终回复
              const secondStream = provider.chatStream(messagesWithToolResults)
              for await (const chunk of secondStream) {
                // 如果有转账卡片数据，跳过 content 类型的 chunk（避免重复显示）
                if (transferData && chunk.type === 'content') {
                  continue
                }
                controller.enqueue(encoder.encode(`event: chunk\ndata: ${JSON.stringify(chunk)}\n\n`))
              }

              // 如果有转账卡片数据，发送 transfer_data 事件
              if (transferData) {
                console.log('[route.ts] 发送 transfer_data 事件:', transferData)
                const transferChunk: StreamChunk = {
                  type: 'transfer_data',
                  transferData
                }
                controller.enqueue(encoder.encode(`event: chunk\ndata: ${JSON.stringify(transferChunk)}\n\n`))
                console.log('[route.ts] transfer_data 事件已发送')
              } else {
                console.log('[route.ts] 没有 transferData,跳过发送')
              }

              controller.close()
            } catch (err) {
              const errorChunk: StreamChunk = {
                type: 'error',
                error: err instanceof Error ? err.message : '流式输出失败',
              }
              controller.enqueue(encoder.encode(`event: chunk\ndata: ${JSON.stringify(errorChunk)}\n\n`))
              controller.close()
            }
          },
        })

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
          },
        })
      }

      // 如果有转账卡片数据，清空 AI 的文字回复（避免重复显示）
      const finalContent = transferData ? '' : secondResponse.content

      return NextResponse.json({
        content: finalContent,
        toolCalls,
        transferData,  // 附加转账卡片数据
      })
    }

    // 不需要工具
    if (isStream) {
      // SSE 流式响应
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder()

          try {
            const streamResponse = provider.chatStream(chatMessages, { tools })
            for await (const chunk of streamResponse) {
              controller.enqueue(encoder.encode(`event: chunk\ndata: ${JSON.stringify(chunk)}\n\n`))
            }

            controller.close()
          } catch (err) {
            const errorChunk: StreamChunk = {
              type: 'error',
              error: err instanceof Error ? err.message : '流式输出失败',
            }
            controller.enqueue(encoder.encode(`event: chunk\ndata: ${JSON.stringify(errorChunk)}\n\n`))
            controller.close()
          }
        },
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      })
    }

    // JSON 响应（向后兼容）
    return NextResponse.json({
      content: response.content,
    })
  } catch (error) {
    console.error('Chat API Error:', error)

    // 区分配置错误和其他错误
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    const isConfigError = errorMessage.includes('未配置') || errorMessage.includes('API Key')
    const status = isConfigError ? 503 : 500

    // 如果是流式请求，返回 SSE 格式的错误
    if (request.headers.get('accept') === 'text/event-stream') {
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          const errorChunk: StreamChunk = {
            type: 'error',
            error: isConfigError
              ? `模型配置错误: ${errorMessage}。请联系管理员检查环境变量配置。`
              : '抱歉，处理您的请求时出现了错误。请稍后重试。',
          }
          controller.enqueue(encoder.encode(`event: chunk\ndata: ${JSON.stringify(errorChunk)}\n\n`))
          controller.close()
        },
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
        status,
      })
    }

    return NextResponse.json(
      {
        error: true,
        content: isConfigError
          ? `模型配置错误: ${errorMessage}。请联系管理员检查环境变量配置。`
          : '抱歉，处理您的请求时出现了错误。请稍后重试。',
      },
      { status }
    )
  }
}
