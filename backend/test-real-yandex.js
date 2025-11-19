/**
 * 测试真实的 Yandex 数据
 */

const yandexTransportService = require('./src/services/yandexTransportService');

async function testRealYandex() {
  console.log('========================================');
  console.log('🚌 测试真实的 Yandex 公交到站数据');
  console.log('========================================\n');

  const stopId = 'stop__9644561';

  try {
    console.log(`获取站点: ${stopId}\n`);

    const startTime = Date.now();
    const result = await yandexTransportService.getStopInfo(stopId);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`✅ 成功获取数据 (耗时 ${duration} 秒)\n`);

    console.log('========================================');
    console.log('📍 站点信息');
    console.log('========================================');
    console.log(`ID: ${result.stop.id}`);
    console.log(`名称: ${result.stop.name}`);
    console.log(`坐标: ${result.stop.coordinates ? result.stop.coordinates.join(', ') : '未知'}\n`);

    console.log('========================================');
    console.log('🚍 公交线路到站信息');
    console.log('========================================\n');

    if (result.arrivals && result.arrivals.length > 0) {
      result.arrivals.forEach((route, index) => {
        console.log(`${index + 1}. 线路 ${route.routeNumber} - ${route.routeName || ''}` );
        console.log(`   类型: ${route.routeType}`);

        if (route.arrivals && route.arrivals.length > 0) {
          console.log(`   到站时间:`);
          route.arrivals.forEach((arrival, idx) => {
            const gpsIcon = arrival.isEstimated ? '🟢 GPS实时' : '⚪ 计划时间';
            console.log(`     ${idx + 1}) ${arrival.minutes} 分钟后 ${gpsIcon}`);
            console.log(`        方向: ${arrival.direction}`);
            if (arrival.estimatedTime) {
              console.log(`        预计: ${arrival.estimatedTime}`);
            }
            if (arrival.scheduledTime) {
              console.log(`        计划: ${arrival.scheduledTime}`);
            }
          });
        }
        console.log('');
      });

      console.log('========================================');
      console.log(`📊 总计: ${result.arrivals.length} 条线路`);
      console.log(`🕐 更新时间: ${new Date(result.updateTime).toLocaleString('zh-CN')}`);
      console.log('========================================\n');

      // 输出 JSON 格式
      console.log('\n========================================');
      console.log('📄 JSON 格式输出');
      console.log('========================================\n');
      console.log(JSON.stringify(result, null, 2));

    } else {
      console.log('❌ 没有公交线路数据');
    }

  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error.stack);
  } finally {
    await yandexTransportService.close();
  }

  console.log('\n测试完成！\n');
}

testRealYandex().catch(error => {
  console.error('测试失败:', error);
  process.exit(1);
});
