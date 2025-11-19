/**
 * 测试 YandexTransportService
 * 验证能否正确获取公交到站时间
 */

const yandexTransportService = require('./src/services/yandexTransportService');

async function testYandexTransport() {
  console.log('========================================');
  console.log('测试 YandexTransportService');
  console.log('========================================\n');

  // 测试站点ID（莫斯科的一个公交站）
  const testStopIds = [
    'stop__9644561',  // 莫斯科某公交站
    'stop__9639579',  // 另一个测试站点
  ];

  for (const stopId of testStopIds) {
    console.log(`\n测试站点: ${stopId}`);
    console.log('----------------------------------------');

    try {
      const startTime = Date.now();
      const result = await yandexTransportService.getStopInfo(stopId);
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log(`✅ 成功获取数据 (用时 ${duration} 秒)`);
      console.log('\n站点信息:');
      console.log(`  ID: ${result.stop.id}`);
      console.log(`  名称: ${result.stop.name}`);
      console.log(`  坐标: ${result.stop.coordinates ? result.stop.coordinates.join(', ') : '未知'}`);

      console.log(`\n找到 ${result.arrivals.length} 条线路:`);

      result.arrivals.forEach((route, index) => {
        console.log(`\n  [${index + 1}] 线路 ${route.routeNumber} - ${route.routeName}`);
        console.log(`      类型: ${route.routeType}`);
        console.log(`      颜色: ${route.color}`);
        console.log(`      到站时间:`);

        if (route.arrivals.length === 0) {
          console.log(`        (暂无到站信息)`);
        } else {
          route.arrivals.forEach((arrival, idx) => {
            console.log(`        ${idx + 1}. ${arrival.minutes} 分钟后到达 (${arrival.time} 秒)`);
            if (arrival.direction) {
              console.log(`           方向: ${arrival.direction}`);
            }
          });
        }
      });

      console.log(`\n更新时间: ${result.updateTime}`);
      console.log('----------------------------------------');

    } catch (error) {
      console.error(`❌ 测试失败: ${error.message}`);
      console.error(error.stack);
    }

    // 在测试下一个站点之前稍作延迟
    if (testStopIds.indexOf(stopId) < testStopIds.length - 1) {
      console.log('\n等待 5 秒后测试下一个站点...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  console.log('\n========================================');
  console.log('测试完成');
  console.log('========================================');

  // 关闭浏览器
  await yandexTransportService.close();
  process.exit(0);
}

// 运行测试
testYandexTransport().catch(error => {
  console.error('测试出错:', error);
  process.exit(1);
});
