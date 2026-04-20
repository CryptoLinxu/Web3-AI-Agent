import { NextRequest, NextResponse } from 'next/server'
import { LLMFactory } from '@web3-ai-agent/ai-config'
import { Tool, Message } from '@web3-ai-agent/ai-config'
import { ChatRequest } from '@/types/chat'
import { getETHPrice, getWalletBalance, getGasPrice } from '@web3-ai-agent/web3-tools'

// 工具定义
const tools: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'getETHPrice',
      description: '获取 ETH 当前价格（美元）',
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
]

// 系统 Prompt
const SYSTEM_PROMPT = `你是 Web3 AI Agent，一个专门帮助用户查询 Web3 信息的助手。

## 你的能力
- 查询 ETH 实时价格
- 查询以太坊钱包余额
- 查询当前 Gas 价格

## 行为准则
1. 只回答与 Web3 相关的问题
2. 对于超出能力范围的问题，明确告知用户
3. 当需要查询数据时，主动调用相应工具
4. 工具返回的结果要整理成易懂的自然语言

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

    // 第一次调用：让模型决定是否需要工具
    console.log('\n========== 第 1 次 API 调用 ==========')
    console.log('📤 发送给 AI 的消息:')
    console.log(JSON.stringify(chatMessages, null, 2))
    console.log('\n🔧 工具定义:')
    console.log(JSON.stringify(tools, null, 2))
    
    const response = await provider.chat(chatMessages, { tools })
    
    console.log('\n📥 AI 的回复:')
    console.log(JSON.stringify(response, null, 2))
    console.log('======================================\n')

    // 如果需要调用工具
    if (response.toolCalls && response.toolCalls.length > 0) {
      const toolCalls = []

      // 执行所有工具调用
      for (const toolCall of response.toolCalls) {
        const functionName = toolCall.function.name
        const functionArgs = JSON.parse(toolCall.function.arguments)

        let result
        try {
          // 直接调用工具函数
          switch (functionName) {
            case 'getETHPrice':
              result = await getETHPrice()
              break
            case 'getWalletBalance':
              result = await getWalletBalance(functionArgs.address)
              break
            case 'getGasPrice':
              result = await getGasPrice()
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

      return NextResponse.json({
        content: secondResponse.content,
        toolCalls,
      })
    }

    // 不需要工具，直接返回回复
    return NextResponse.json({
      content: response.content,
    })
  } catch (error) {
    console.error('Chat API Error:', error)
    
    // 区分配置错误和其他错误
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    const isConfigError = errorMessage.includes('未配置') || errorMessage.includes('API Key')
    
    return NextResponse.json(
      {
        error: true,
        content: isConfigError
          ? `模型配置错误: ${errorMessage}。请联系管理员检查环境变量配置。`
          : '抱歉，处理您的请求时出现了错误。请稍后重试。',
      },
      { status: isConfigError ? 503 : 500 }
    )
  }
}
