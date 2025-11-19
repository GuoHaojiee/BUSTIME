/**
 * 查找 Проспект Вернадского, 33 附近真正有数据的公交站点
 */

const yandexTransportService = require('./src/services/yandexTransportService');

async function findRealStop() {
  console.log('========================================');
  console.log('🔍 查找真正有公交数据的站点');
  console.log('========================================\n');

  // 我们之前测试成功过的站点ID
  const knownGoodStops = [
    'stop__9639579',  // 之前测试成功，有12条线路
    'stop__9644561',  // 之前测试成功，有4条线路
  ];

  console.log('📌 步骤1: 先验证已知有效的站点\n');

  for (const stopId of knownGoodStops) {
    try {
      console.log(`测试站点: ${stopId}`);
      const result = await yandexTransportService.getStopInfo(stopId);

      if (result.arrivals && result.arrivals.length > 0) {
        console.log(`✅ 成功！找到 ${result.arrivals.length} 条线路`);
        console.log(`坐标: ${result.stop.coordinates ? result.stop.coordinates.join(', ') : '未知'}\n`);

        // 显示前3条线路
        result.arrivals.slice(0, 3).forEach((route, index) => {
          console.log(`  线路 ${route.routeNumber}:`);
          if (route.arrivals.length > 0) {
            console.log(`    ⏱️  ${route.arrivals[0].minutes} 分钟后到达`);
            console.log(`    📍 方向: ${route.arrivals[0].direction}`);
          }
        });
        console.log('');
      } else {
        console.log(`❌ 无数据\n`);
      }
    } catch (error) {
      console.log(`❌ 错误: ${error.message}\n`);
    }

    // 稍等一下
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n========================================');
  console.log('📌 步骤2: 如何找到你需要的站点');
  console.log('========================================\n');

  console.log('方法1 (推荐): 在Yandex Maps上手动查找');
  console.log('--------------------------------------------');
  console.log('1. 打开: https://yandex.ru/maps/213/moscow/');
  console.log('2. 搜索: Проспект Вернадского, 33');
  console.log('3. 点击地图上附近的公交站点图标（蓝色）');
  console.log('4. 查看URL中的stopId（格式：stop__数字）\n');

  console.log('方法2: 使用坐标推测');
  console.log('--------------------------------------------');
  console.log('Проспект Вернадского, 33 的大致坐标:');
  console.log('  纬度: 55.677°N');
  console.log('  经度: 37.506°E\n');

  console.log('你可以尝试搜索附近的站点：');
  console.log('- 站点名称可能包含: "Проспект Вернадского"');
  console.log('- 或者包含: "33" 或附近的门牌号\n');

  console.log('方法3: 测试常见的站点ID');
  console.log('--------------------------------------------');
  console.log('韦尔纳茨基大街附近常见的站点ID范围:');
  console.log('  stop__9644000 ~ stop__9645000');
  console.log('  stop__9639000 ~ stop__9640000\n');

  await yandexTransportService.close();

  console.log('\n========================================');
  console.log('💡 重要提示');
  console.log('========================================\n');
  console.log('如果站点ID无效或没有公交线路，arrivals会是空数组。');
  console.log('这不是程序的问题，而是该站点确实没有数据。\n');
  console.log('解决方法：');
  console.log('1. 使用Yandex Maps查找正确的站点ID');
  console.log('2. 或者告诉我具体的站点名称，我帮你找ID\n');
}

findRealStop().catch(error => {
  console.error('出错:', error);
  process.exit(1);
});
