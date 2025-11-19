/**
 * 调试脚本：查看 Yandex API 返回的 JSON 结构
 */

const yandexTransportService = require('./src/services/yandexTransportService');
const fs = require('fs');

async function debugJsonStructure() {
  console.log('获取 Yandex API 数据...\n');

  const stopId = 'stop__9644561';

  try {
    // 获取原始 JSON 数据
    const url = `https://yandex.ru/maps/213/moscow/?masstransit[stopId]=${stopId}&masstransit[tab]=stop`;
    const result = await yandexTransportService._getYandexJson(url, ['maps/api/masstransit/getStopInfo']);

    console.log('========================================');
    console.log('获取到的结果:');
    console.log('========================================\n');

    if (result.error) {
      console.error(`错误: ${result.error}`);
    } else {
      console.log(`找到 ${result.results.length} 个 API 响应\n`);

      result.results.forEach((apiResult, index) => {
        console.log(`\n[${index + 1}] ${apiResult.method}`);
        console.log(`    URL: ${apiResult.url.substring(0, 100)}...`);
        console.log(`    错误: ${apiResult.error}`);

        if (apiResult.error === 'OK' && apiResult.data) {
          console.log('\n    JSON 数据结构:');
          console.log('    ' + JSON.stringify(apiResult.data, null, 2).split('\n').slice(0, 50).join('\n    '));

          // 保存完整的 JSON 到文件
          const filename = `/tmp/yandex-api-${index}.json`;
          fs.writeFileSync(filename, JSON.stringify(apiResult.data, null, 2));
          console.log(`\n    完整数据已保存到: ${filename}`);
        } else if (apiResult.rawData) {
          console.log(`    原始数据: ${apiResult.rawData.substring(0, 200)}...`);
        }
      });
    }

  } catch (error) {
    console.error('调试失败:', error);
    console.error(error.stack);
  } finally {
    await yandexTransportService.close();
  }
}

debugJsonStructure().catch(error => {
  console.error('出错:', error);
  process.exit(1);
});
