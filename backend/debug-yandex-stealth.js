/**
 * Yandex Maps 调试脚本 - 使用 Stealth 模式
 */
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// 使用 stealth 插件
puppeteer.use(StealthPlugin());

async function debugYandexMaps() {
  console.log('启动浏览器 (Stealth 模式)...');

  const browser = await puppeteer.launch({
    headless: false, // 显示浏览器窗口
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--window-size=1920,1080',
      '--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ],
    ignoreHTTPSErrors: true
  });

  const page = await browser.newPage();

  // 设置视窗大小
  await page.setViewport({ width: 1920, height: 1080 });

  // 设置额外的浏览器属性
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });
  });

  // 记录 API 响应
  const apiResponses = [];

  page.on('response', async response => {
    const url = response.url();
    const status = response.status();

    // 只记录可能包含公交数据的请求
    if (
      (url.includes('api') ||
       url.includes('transit') ||
       url.includes('masstransit') ||
       url.includes('stop') ||
       url.includes('forecast')) &&
      !url.includes('captcha') &&
      !url.includes('metric') &&
      !url.includes('clck')
    ) {
      try {
        const contentType = response.headers()['content-type'] || '';

        if (contentType.includes('json')) {
          const data = await response.json();
          console.log('\n✅ JSON API 响应:');
          console.log('   URL:', url.substring(0, 100) + '...');
          console.log('   状态:', status);
          console.log('   数据:', JSON.stringify(data).substring(0, 500));

          apiResponses.push({
            url: url,
            status: status,
            data: data
          });
        }
      } catch (err) {
        // 忽略解析错误
      }
    }
  });

  const stopId = 'stop__9644561';
  const url = `https://yandex.ru/maps/213/moscow/stops/${stopId}/?ll=37.516137%2C55.680195&tab=overview&z=16.33`;

  console.log('\n访问页面:', url);
  console.log('等待页面加载...\n');

  try {
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('页面标题:', await page.title());

    // 检查是否有 CAPTCHA
    const hasCaptcha = await page.evaluate(() => {
      return document.body.textContent.includes('Вы не робот') ||
             document.body.textContent.includes('captcha');
    });

    if (hasCaptcha) {
      console.log('⚠️  检测到 CAPTCHA！Yandex 仍然识别出了自动化访问。');
    } else {
      console.log('✅ 没有 CAPTCHA！成功绕过检测。');
    }

    // 等待更长时间以捕获所有请求
    console.log('\n等待 15 秒，收集所有 API 请求...\n');
    await page.waitForTimeout(15000);

    // 尝试从页面中提取数据
    console.log('\n========================================');
    console.log('🔍 从页面 DOM 提取数据:');
    console.log('========================================\n');

    const pageData = await page.evaluate(() => {
      const result = {
        stopName: null,
        stopAddress: null,
        routes: [],
        html: document.body.innerHTML.substring(0, 1000)
      };

      // 尝试多种选择器查找站点名称
      const nameSelectors = [
        '[class*="toponym"]',
        '[class*="card-title"]',
        '[class*="stop-name"]',
        'h1',
        '[itemprop="name"]'
      ];

      for (const selector of nameSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          const text = el.textContent.trim();
          if (text && text.length > 3 && text.length < 100) {
            result.stopName = text;
            break;
          }
        }
        if (result.stopName) break;
      }

      // 查找所有可能的路线信息
      const allText = document.body.innerText;
      const routeMatches = allText.match(/\d{1,4}[А-Яа-я]?/g);
      if (routeMatches) {
        result.routes = routeMatches.slice(0, 10);
      }

      return result;
    });

    console.log('站点名称:', pageData.stopName);
    console.log('找到的路线号:', pageData.routes);

    // 输出所有捕获的 API 响应
    console.log('\n========================================');
    console.log('📊 捕获到的 JSON API 响应:');
    console.log('========================================\n');

    if (apiResponses.length > 0) {
      apiResponses.forEach((resp, index) => {
        console.log(`${index + 1}. ${resp.url.substring(0, 100)}`);
        console.log(`   状态: ${resp.status}`);
        console.log(`   数据预览: ${JSON.stringify(resp.data).substring(0, 200)}...\n`);
      });
    } else {
      console.log('没有捕获到 JSON API 响应。');
      console.log('Yandex Maps 可能将数据直接嵌入在 HTML 中，或使用了特殊的数据格式。');
    }

    console.log('\n保持浏览器打开 30 秒，你可以手动查看...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ 错误:', error.message);
  }

  await browser.close();
  console.log('\n调试完成！');
}

debugYandexMaps().catch(error => {
  console.error('调试出错:', error);
  process.exit(1);
});
