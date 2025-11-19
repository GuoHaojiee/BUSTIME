/**
 * 调试脚本：查看所有网络请求
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function debugNetworkRequests() {
  console.log('启动浏览器...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
    ],
    ignoreHTTPSErrors: true
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const stopId = 'stop__9644561';
  const url = `https://yandex.ru/maps/213/moscow/?masstransit[stopId]=${stopId}&masstransit[tab]=stop`;

  console.log(`\n访问页面: ${url}\n`);

  await page.goto(url, {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  console.log('等待 30 秒...\n');
  await page.waitForTimeout(1000);

  const networkData = await page.evaluate(() => {
    const performance = window.performance || window.mozPerformance ||
                       window.msPerformance || window.webkitPerformance || {};
    const network = performance.getEntries() || {};
    return network;
  });

  console.log(`捕获到 ${networkData.length} 个网络请求\n`);
  console.log('========================================');
  console.log('包含 "api" 或 "masstransit" 的请求:');
  console.log('========================================\n');

  let count = 0;
  networkData.forEach((entry, index) => {
    const name = entry.name || '';
    if (name.includes('api') || name.includes('masstransit') ||
        name.includes('stop') || name.includes('forecast')) {
      count++;
      console.log(`[${count}] ${name}`);
      console.log(`    类型: ${entry.initiatorType}`);
      console.log(`    耗时: ${(entry.duration || 0).toFixed(2)}ms\n`);
    }
  });

  if (count === 0) {
    console.log('未找到匹配的请求。\n');
    console.log('前 20 个请求:');
    console.log('========================================\n');
    networkData.slice(0, 20).forEach((entry, index) => {
      console.log(`[${index + 1}] ${entry.name || 'unknown'}`);
    });
  }

  await browser.close();
  console.log('\n调试完成！');
}

debugNetworkRequests().catch(error => {
  console.error('调试出错:', error);
  process.exit(1);
});
