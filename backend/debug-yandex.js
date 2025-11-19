/**
 * Yandex Maps 调试脚本
 * 用于分析真实的 API 请求
 */
const puppeteer = require('puppeteer');

async function debugYandexMaps() {
  console.log('启动浏览器...');

  const browser = await puppeteer.launch({
    headless: false, // 显示浏览器窗口
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });

  const page = await browser.newPage();

  // 记录所有请求
  const requests = [];

  page.on('request', request => {
    const url = request.url();
    console.log('➡️  请求:', request.method(), url.substring(0, 100));
  });

  page.on('response', async response => {
    const url = response.url();
    const status = response.status();

    // 记录包含 API 关键词的请求
    if (
      url.includes('api') ||
      url.includes('transit') ||
      url.includes('stop') ||
      url.includes('forecast') ||
      url.includes('masstransit') ||
      url.includes('stops')
    ) {
      console.log('\n✅ 可能的 API 响应:');
      console.log('   URL:', url);
      console.log('   状态:', status);
      console.log('   类型:', response.headers()['content-type']);

      try {
        // 尝试获取响应内容
        const text = await response.text();

        if (text && text.length < 5000) {
          console.log('   内容预览:', text.substring(0, 200));
        } else {
          console.log('   内容大小:', text.length, 'bytes');
        }

        // 保存完整 URL 和响应
        requests.push({
          url: url,
          status: status,
          contentType: response.headers()['content-type'],
          body: text.substring(0, 1000)
        });
      } catch (err) {
        console.log('   无法读取响应内容:', err.message);
      }
    }
  });

  const stopId = 'stop__9644561';
  const url = `https://yandex.ru/maps/213/moscow/stops/${stopId}/?ll=37.516137%2C55.680195&tab=overview&z=16.33`;

  console.log('\n访问页面:', url);
  console.log('等待 20 秒，观察网络请求...\n');

  await page.goto(url, {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  // 等待更长时间以捕获所有请求
  await page.waitForTimeout(20000);

  console.log('\n\n========================================');
  console.log('📊 捕获到的 API 请求总结:');
  console.log('========================================\n');

  requests.forEach((req, index) => {
    console.log(`${index + 1}. ${req.url}`);
    console.log(`   状态: ${req.status}, 类型: ${req.contentType}`);
    console.log(`   内容: ${req.body.substring(0, 100)}...\n`);
  });

  // 尝试从页面 DOM 中提取数据
  console.log('\n========================================');
  console.log('🔍 尝试从 DOM 中提取数据:');
  console.log('========================================\n');

  const pageData = await page.evaluate(() => {
    const data = {
      title: document.title,
      stopName: null,
      routes: []
    };

    // 尝试查找站点名称
    const nameSelectors = [
      '.card-title-view__title',
      '.orgpage-header-view__header',
      'h1',
      '.toponym-card-title-view__title'
    ];

    for (const selector of nameSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        data.stopName = element.textContent.trim();
        break;
      }
    }

    // 尝试查找路线信息
    const routeElements = document.querySelectorAll('[class*="route"], [class*="transport"], [class*="line"]');
    routeElements.forEach((el, index) => {
      if (index < 5) { // 只取前5个
        data.routes.push(el.textContent.trim().substring(0, 50));
      }
    });

    return data;
  });

  console.log('页面标题:', pageData.title);
  console.log('站点名称:', pageData.stopName);
  console.log('找到的路线:', pageData.routes);

  console.log('\n浏览器将保持打开 30 秒，你可以手动查看...');
  await page.waitForTimeout(30000);

  await browser.close();
  console.log('\n调试完成！');
}

debugYandexMaps().catch(error => {
  console.error('调试出错:', error);
  process.exit(1);
});
