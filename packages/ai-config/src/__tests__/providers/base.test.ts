import { describe, it, expect, afterAll, beforeEach, vi } from 'vitest'
import { BaseProvider } from '../../providers/base'

// 创建测试用具体子类
class TestProvider extends BaseProvider {
  readonly name = 'test'
  async chat() {
    return { content: 'test' }
  }
  chatStream(): any {
    return (async function* () {})()
  }
}

describe('BaseProvider', () => {
  const provider = new TestProvider()

  describe('validateMessages', () => {
    it('应通过有效消息', () => {
      expect(() =>
        (provider as any).validateMessages([
          { role: 'user', content: 'hello' },
        ])
      ).not.toThrow()
    })

    it('当消息列表为空时应抛出错误', () => {
      expect(() => (provider as any).validateMessages([])).toThrow(
        '消息列表不能为空'
      )
    })

    it('当消息列表不是数组时应抛出错误', () => {
      expect(() => (provider as any).validateMessages(null)).toThrow(
        '消息列表不能为空'
      )
    })

    it('当消息缺少 role 时应抛出错误', () => {
      expect(() =>
        (provider as any).validateMessages([{ content: 'hello' }])
      ).toThrow('必须包含 role 和 content')
    })

    it('当消息缺少 content 时应抛出错误', () => {
      expect(() =>
        (provider as any).validateMessages([{ role: 'user' }])
      ).toThrow('必须包含 role 和 content')
    })
  })

  describe('validateTools', () => {
    it('tools 为 undefined 时应通过', () => {
      expect(() => (provider as any).validateTools(undefined)).not.toThrow()
    })

    it('应通过有效工具定义', () => {
      expect(() =>
        (provider as any).validateTools([
          {
            type: 'function',
            function: { name: 'test', description: 'test', parameters: { type: 'object', properties: {} } },
          },
        ])
      ).not.toThrow()
    })

    it('当工具类型不是 function 时应抛出错误', () => {
      expect(() =>
        (provider as any).validateTools([
          { type: 'invalid', function: { name: 'test' } },
        ])
      ).toThrow('工具定义格式无效')
    })

    it('当工具缺少 name 时应抛出错误', () => {
      expect(() =>
        (provider as any).validateTools([
          { type: 'function', function: { description: 'test' } },
        ])
      ).toThrow('工具定义格式无效')
    })
  })
})
