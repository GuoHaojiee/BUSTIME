/**
 * 直接测试 Проспект Вернадского, 33 附近的公交站点
 *
 * 已知信息：
 * - 地址：Проспект Вернадского, 33, Москва
 * - 附近的地铁站：Проспект Вернадского (韦尔纳茨基大街站)
 * - 坐标大约：55.677, 37.506
 */

const yandexTransportService = require('./src/services/yandexTransportService');

// 韦尔纳茨基大街附近的一些已知公交站点ID
const nearbyStops = [
  'stop__9639561',  // 可能的站点1
  'stop__9639562',  // 可能的站点2
  'stop__9644553',  // 韦尔纳茨基大街附近
  'stop__9644554',
  'stop__9644555',
];

async function testVernadsky33() {
  console.log('========================================');
  console.log('测试 Проспект Вернадского, 33 公交信息');
  console.log('========================================\n');

  console.log('方法1: 直接访问Yandex Maps查找准确的站点ID\n');
  console.log('请在浏览器中打开以下链接：');
  console.log('https://yandex.ru/maps/213/moscow/?ll=37.506%2C55.677&mode=search&text=Проспект%20Вернадского%2C%2033&z=17\n');

  console.log('然后：');
  console.log('1. 在地图上找到"Проспект Вернадского, 33"的标记');
  console.log('2. 点击附近的公交站点图标（蓝色的公交标志）');
  console.log('3. 在打开的站点信息卡片中，查看URL');
  console.log('4. 从URL中复制stopId（格式：stop__后面跟数字）\n');

  console.log('========================================');
  console.log('方法2: 测试附近已知的站点\n');

  for (const stopId of nearbyStops) {
    try {
      console.log(`\n尝试测试站点: ${stopId}`);
      console.log('（如果这个ID不存在会失败，这是正常的）');

      const result = await yandexTransportService.getStopInfo(stopId);

      if (result && result.arrivals && result.arrivals.length > 0) {
        console.log('\n✅ 找到有效站点！');
        console.log(`站点ID: ${result.stop.id}`);
        console.log(`坐标: ${result.stop.coordinates ? result.stop.coordinates.join(', ') : '未知'}`);
        console.log(`找到 ${result.arrivals.length} 条线路`);

        result.arrivals.forEach((route, index) => {
          console.log(`\n  线路 ${route.routeNumber}:`);
          if (route.arrivals.length > 0) {
            console.log(`    最近一班: ${route.arrivals[0].minutes} 分钟后`);
            console.log(`    方向: ${route.arrivals[0].direction}`);
          }
        });

        console.log('\n这可能就是你要找的站点！');
        break;
      }
    } catch (error) {
      console.log(`❌ ${stopId} 无效或获取失败`);
    }

    // 等待一下避免请求过快
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n\n========================================');
  console.log('方法3: 使用API搜索功能（推荐）');
  console.log('========================================\n');

  console.log('在浏览器中访问：');
  console.log('http://localhost:3000/api/search?q=Проспект%20Вернадского\n');

  console.log('或者使用curl命令：');
  console.log('curl "http://localhost:3000/api/search?q=Проспект%20Вернадского"\n');

  await yandexTransportService.close();
}

testVernadsky33().catch(error => {
  console.error('测试出错:', error);
  process.exit(1);
});
