/**
 * 测试本地数据库搜索功能
 */

const localStopsDatabase = require('./src/services/localStopsDatabase');

console.log('========================================');
console.log('测试本地数据库搜索');
console.log('========================================\n');

const keywords = [
  'Вернадского',
  'вернад',
  'vernad',
  '韦尔纳茨基',
  'строител',
  'универ'
];

keywords.forEach(keyword => {
  console.log(`\n搜索: "${keyword}"`);
  console.log('-'.repeat(40));

  const results = localStopsDatabase.searchStops(keyword);

  if (results.length > 0) {
    console.log(`✅ 找到 ${results.length} 个结果:\n`);
    results.forEach((stop, index) => {
      console.log(`${index + 1}. ${stop.name} (${stop.nameCn})`);
      console.log(`   ID: ${stop.id}`);
      console.log(`   地址: ${stop.address}`);
    });
  } else {
    console.log('❌ 未找到结果');
  }
});

console.log('\n\n========================================');
console.log('测试获取所有站点');
console.log('========================================\n');

const allStops = localStopsDatabase.getAllStops();
console.log(`共有 ${allStops.length} 个站点`);

console.log('\n测试完成！\n');
