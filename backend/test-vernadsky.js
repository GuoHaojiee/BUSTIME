/**
 * 测试 Проспект Вернадского, 33 的公交站点
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function findVernadsky33Stops() {
  console.log('========================================');
  console.log('查找 Проспект Вернадского, 33 附近的公交站点');
  console.log('========================================\n');

  const browser = await puppeteer.launch({
    headless: false, // 显示浏览器，方便查看
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1920,1080'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // 访问Yandex Maps并搜索这个地址
  const searchUrl = 'https://yandex.ru/maps/213/moscow/?ll=37.617700%2C55.755863&mode=search&text=Проспект%20Вернадского%2C%2033&z=16';

  console.log('访问Yandex Maps搜索页面...');
  await page.goto(searchUrl, {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  console.log('等待页面加载...\n');
  await page.waitForTimeout(5000);

  // 提取页面上的公交站点信息
  const stops = await page.evaluate(() => {
    const results = [];

    // 尝试查找公交站点标记
    const stopElements = document.querySelectorAll('[class*="stop"]');

    stopElements.forEach((el, index) => {
      if (index < 10) { // 只取前10个
        const text = el.textContent || '';
        const onclick = el.getAttribute('onclick') || '';
        const href = el.querySelector('a')?.href || '';

        if (text.length > 0 || href.length > 0) {
          results.push({
            text: text.substring(0, 100),
            href: href.substring(0, 200)
          });
        }
      }
    });

    // 也尝试从URL中提取
    const currentUrl = window.location.href;
    results.push({
      text: 'Current URL',
      href: currentUrl
    });

    return results;
  });

  console.log('找到的元素:');
  stops.forEach((stop, index) => {
    console.log(`\n${index + 1}. ${stop.text}`);
    if (stop.href) {
      console.log(`   URL: ${stop.href}`);

      // 尝试从URL中提取stopId
      const stopIdMatch = stop.href.match(/stop[_]{0,2}(\d+)/i);
      if (stopIdMatch) {
        console.log(`   ✅ StopID: stop__${stopIdMatch[1]}`);
      }
    }
  });

  console.log('\n\n========================================');
  console.log('📍 请在打开的浏览器中：');
  console.log('========================================');
  console.log('1. 在地图上找到"Проспект Вернадского, 33"');
  console.log('2. 点击附近的公交站点图标');
  console.log('3. 查看浏览器地址栏的URL');
  console.log('4. 复制URL中的stopId（格式：stop__数字）');
  console.log('\n浏览器将保持打开60秒，请手动查找...\n');

  await page.waitForTimeout(60000);

  await browser.close();
  console.log('\n测试完成！');
}

// 运行测试
findVernadsky33Stops().catch(error => {
  console.error('出错:', error);
  process.exit(1);
});
