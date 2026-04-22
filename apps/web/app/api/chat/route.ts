import { NextRequest, NextResponse } from 'next/server'
import { LLMFactory } from '@web3-ai-agent/ai-config'
import { Tool, Message, StreamChunk } from '@web3-ai-agent/ai-config'
import { ChatRequest } from '@/types/chat'
import { getETHPrice, getBTCPrice, getWalletBalance, getGasPrice, getTokenPrice } from '@web3-ai-agent/web3-tools'

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
      name: 'getWalletBalance',
      description: '查询以太坊钱包地址的 ETH 余额',
      parameters: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            description: '以太坊钱包地址（0x 开头）',
          },
        },
        required: ['address'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getGasPrice',
      description: '获取当前以太坊 Gas 价格',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
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

// 系统 Prompt
const SYSTEM_PROMPT = `你是 Web3 AI Agent，一个专门帮助用户查询 Web3 信息的助手。

## 你的能力
- 查询多种加密货币价格（ETH, BTC, SOL, MATIC, BNB）
- 查询以太坊钱包地址的 ETH 余额
- 查询当前以太坊 Gas 价格

## 行为准则
1. 只回答与 Web3 相关的问题
2. 对于超出能力范围的问题，明确告知用户
3. 当需要查询数据时，主动调用相应工具
4. 工具返回的结果要整理成易懂的自然语言
5. 查询价格时使用 getTokenPrice 工具，传入 symbol 参数

## 安全边界
- 不提供交易建议
- 不预测价格走势
- 所有数据仅供参考，不构成投资建议
- 明确标注数据来源

## 回复格式
- 简洁明了
- 重要数据突出显示
- 必要时提供数据来源说明`

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()
    const { messages } = body

    // 获取 LLM 提供商
    const provider = LLMFactory.getProvider()

    // 转换消息格式
    const chatMessages: Message[] = [
      { role: 'system', content: SYSTEM_PROMPT },
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
          // 直接调用具函数
          switch (functionName) {
            case 'getTokenPrice':
              result = await getTokenPrice(functionArgs.symbol as string)
              break
            case 'getETHPrice':
              // 向后兼容
              result = await getETHPrice()
              break
            case 'getWalletBalance':
              result = await getWalletBalance(functionArgs.address)
              break
            case 'getGasPrice':
              result = await getGasPrice()
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

      const secondResponse = await provider.chat(messagesWithToolResults)

      console.log('\n📥 最终回复:')
      console.log(secondResponse.content)
      console.log('======================================\n')

      return NextResponse.json({
        content: secondResponse.content,
        toolCalls,
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
