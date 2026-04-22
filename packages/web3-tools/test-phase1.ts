// Phase 1 价格工具验证脚本
import { getTokenPrice, getETHPrice, getBTCPrice } from './src/price'

async function runTests() {
  console.log('========== Phase 1 价格工具验证 ==========\n')

  // QA-1.1: 测试 ETH 价格
  console.log('QA-1.1: 测试 getTokenPrice("ETH")')
  const ethResult = await getTokenPrice('ETH')
  console.log('结果:', JSON.stringify(ethResult, null, 2))
  console.log('✅ 通过:', ethResult.success && ethResult.data?.symbol === 'ETH' && ethResult.data?.price > 0)
  console.log()

  // QA-1.2: 测试 BTC 价格
  console.log('QA-1.2: 测试 getTokenPrice("BTC")')
  const btcResult = await getTokenPrice('BTC')
  console.log('结果:', JSON.stringify(btcResult, null, 2))
  console.log('✅ 通过:', btcResult.success && btcResult.data?.symbol === 'BTC' && btcResult.data?.price > 0)
  console.log()

  // QA-1.3: 测试 SOL 价格
  console.log('QA-1.3: 测试 getTokenPrice("SOL")')
  const solResult = await getTokenPrice('SOL')
  console.log('结果:', JSON.stringify(solResult, null, 2))
  console.log('✅ 通过:', solResult.success && solResult.data?.symbol === 'SOL' && solResult.data?.price > 0)
  console.log()

  // QA-1.4: 测试 MATIC 价格
  console.log('QA-1.4: 测试 getTokenPrice("MATIC")')
  const maticResult = await getTokenPrice('MATIC')
  console.log('结果:', JSON.stringify(maticResult, null, 2))
  console.log('✅ 通过:', maticResult.success && maticResult.data?.symbol === 'MATIC' && maticResult.data?.price > 0)
  console.log()

  // QA-1.5: 测试 BNB 价格
  console.log('QA-1.5: 测试 getTokenPrice("BNB")')
  const bnbResult = await getTokenPrice('BNB')
  console.log('结果:', JSON.stringify(bnbResult, null, 2))
  console.log('✅ 通过:', bnbResult.success && bnbResult.data?.symbol === 'BNB' && bnbResult.data?.price > 0)
  console.log()

  // QA-1.6: 测试不支持的币种
  console.log('QA-1.6: 测试 getTokenPrice("INVALID")')
  const invalidResult = await getTokenPrice('INVALID')
  console.log('结果:', JSON.stringify(invalidResult, null, 2))
  console.log('✅ 通过:', !invalidResult.success && invalidResult.error?.includes('不支持的币种'))
  console.log()

  // QA-1.7: 向后兼容 - getETHPrice()
  console.log('QA-1.7: 测试向后兼容 getETHPrice()')
  const oldEthResult = await getETHPrice()
  console.log('结果:', JSON.stringify(oldEthResult, null, 2))
  console.log('✅ 通过:', oldEthResult.success && oldEthResult.data !== undefined && oldEthResult.data.price > 0)
  console.log()

  // QA-1.8: 向后兼容 - getBTCPrice()
  console.log('QA-1.8: 测试向后兼容 getBTCPrice()')
  const oldBtcResult = await getBTCPrice()
  console.log('结果:', JSON.stringify(oldBtcResult, null, 2))
  console.log('✅ 通过:', oldBtcResult.success && oldBtcResult.data !== undefined && oldBtcResult.data.price > 0)
  console.log()

  // 总结
  console.log('========== 验证总结 ==========')
  const allPassed = 
    ethResult.success && btcResult.success && solResult.success && 
    maticResult.success && bnbResult.success && 
    !invalidResult.success && 
    oldEthResult.success && oldBtcResult.success

  if (allPassed) {
    console.log('🎉 所有验证项通过！')
  } else {
    console.log('❌ 部分验证项失败，需要修复')
  }
}

runTests().catch(console.error)
