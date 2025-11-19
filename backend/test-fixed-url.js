/**
 * 测试修复后的URL格式
 * 使用已知有效的莫斯科站点
 */

const yandexTransportService = require('./src/services/yandexTransportService');

async function testFixedUrl() {
  console.log('========================================');
  console.log('🔧 测试修复后的URL格式');
  console.log('========================================\n');

  // 使用一个我们知道存在的莫斯科站点
  // 这是莫斯科市中心的一个主要公交站
  const testStops = [
    'stop__9639579',  // 之前测试过的站点
    'stop__9644561',  // 之前测试过的站点
    'stop__9639611',  // 莫斯科另一个常用站点
  ];

  console.log('正在测试站点ID...\n');

  for (const stopId of testStops) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`测试站点: ${stopId}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      const startTime = Date.now();
      const result = await yandexTransportService.getStopInfo(stopId);
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      console.log(`✅ 成功获取数据 (耗时 ${duration} 秒)\n`);

      if (result.arrivals && result.arrivals.length > 0) {
        console.log(`🚌 找到 ${result.arrivals.length} 条公交线路:\n`);

        result.arrivals.slice(0, 5).forEach((route, index) => {
          console.log(`  ${index + 1}. 线路 ${route.routeNumber} (${route.routeType})`);

          if (route.arrivals && route.arrivals.length > 0) {
            const nextBus = route.arrivals[0];
            console.log(`     ⏱️  下一班: ${nextBus.minutes} 分钟后`);
            console.log(`     📍 方向: ${nextBus.direction || '未知'}`);
            console.log(`     ${nextBus.isEstimated ? '🟢 实时GPS' : '⚪ 计划时间'}`);

            if (route.arrivals.length > 1) {
              console.log(`     后续: ${route.arrivals.slice(1, 3).map(a => `${a.minutes}分钟`).join(', ')}`);
            }
          }
          console.log('');
        });

        console.log(`📊 坐标: ${result.stop.coordinates ? result.stop.coordinates.join(', ') : '未知'}`);
        console.log(`🕐 更新时间: ${new Date(result.updateTime).toLocaleString('zh-CN')}`);

        // 成功找到有数据的站点，显示如何使用
        console.log('\n' + '='.repeat(60));
        console.log('🎉 成功！这个站点有真实的公交数据！');
        console.log('='.repeat(60));
        console.log('\n你可以通过以下方式访问：');
        console.log(`\n📱 浏览器: http://localhost:3000/api/stop/${stopId}`);
        console.log(`\n💻 命令行: curl "http://localhost:3000/api/stop/${stopId}"`);
        console.log('\n' + '='.repeat(60));

        // 成功后退出
        break;
      } else {
        console.log('⚠️  获取成功但没有公交线路数据');
        console.log('这个站点可能没有公交服务或已停用\n');
      }

    } catch (error) {
      console.log(`❌ 获取失败: ${error.message}\n`);
    }

    // 如果不是最后一个，等待一下
    if (testStops.indexOf(stopId) < testStops.length - 1) {
      console.log('等待5秒后测试下一个站点...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  await yandexTransportService.close();

  console.log('\n\n========================================');
  console.log('📋 测试完成！');
  console.log('========================================\n');
}

testFixedUrl().catch(error => {
  console.error('测试出错:', error);
  process.exit(1);
});
