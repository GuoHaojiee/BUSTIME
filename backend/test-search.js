/**
 * 测试搜索功能
 */

const yandexSearchService = require('./src/services/yandexSearchService');

async function testSearch() {
  console.log('========================================');
  console.log('🔍 测试 Yandex Search Service');
  console.log('========================================\n');

  const keywords = [
    'Вернадского',
    'Проспект Вернадского',
    'метро'
  ];

  for (const keyword of keywords) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`搜索关键词: "${keyword}"`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      const startTime = Date.now();
      const results = await yandexSearchService.searchStops(keyword);
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      console.log(`✅ 成功！耗时 ${duration} 秒\n`);

      if (results && results.length > 0) {
        console.log(`找到 ${results.length} 个站点:\n`);

        results.forEach((stop, index) => {
          console.log(`${index + 1}. ${stop.name}`);
          console.log(`   ID: ${stop.id}`);
          if (stop.address) {
            console.log(`   地址: ${stop.address}`);
          }
          console.log('');
        });

        console.log('\n✨ 测试第一个站点的到站信息...\n');

        const firstStopId = results[0].id;
        console.log(`站点 ID: ${firstStopId}`);
        console.log(`API 地址: http://localhost:3000/api/stop/${firstStopId}\n`);

      } else {
        console.log('❌ 没有找到匹配的站点');
      }

    } catch (error) {
      console.error(`❌ 搜索失败: ${error.message}`);
      console.error(error.stack);
    }

    // 只测试第一个关键词
    break;
  }

  await yandexSearchService.close();

  console.log('\n========================================');
  console.log('测试完成！');
  console.log('========================================\n');
}

testSearch().catch(error => {
  console.error('测试出错:', error);
  process.exit(1);
});
