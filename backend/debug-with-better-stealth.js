/**
 * 改进的隐身模式测试
 * 使用更强的反检测措施
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function testWithBetterStealth() {
  console.log('========================================');
  console.log('🥷 测试：改进的隐身模式');
  console.log('========================================\n');

  const stopId = 'stop__9639579';
  const url = `https://yandex.ru/maps/213/moscow/stops/${stopId}/`;

  console.log(`测试URL: ${url}\n`);

  const browser = await puppeteer.launch({
    headless: false, // 使用非无头模式，更难被检测
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--window-size=1920,1080',
      // 额外的反检测参数
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--start-maximized',
      '--lang=ru-RU,ru',
      '--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ],
    ignoreHTTPSErrors: true,
    defaultViewport: null
  });

  const page = await browser.newPage();

  // 存储所有请求
  const allRequests = [];

  try {
    const client = await page.target().createCDPSession();
    await client.send('Network.enable');

    // 捕获所有请求
    client.on('Network.requestWillBeSent', (params) => {
      const url = params.request.url;
      if (url.includes('yandex') &&
          !url.includes('.css') &&
          !url.includes('.png') &&
          !url.includes('.jpg') &&
          !url.includes('.woff') &&
          !url.includes('.svg')) {
        allRequests.push({
          url: url.substring(0, 150),
          method: params.request.method
        });
      }
    });

    // 设置更真实的浏览器特征
    await page.evaluateOnNewDocument(() => {
      // 隐藏 webdriver
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });

      // 模拟 Chrome 对象
      window.chrome = {
        runtime: {},
      };

      // 覆盖 permissions API
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );

      // 模拟 plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });

      // 模拟 languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['ru-RU', 'ru', 'en-US', 'en'],
      });
    });

    // 设置俄语用户代理和语言
    await page.setUserAgent(
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await page.setExtraHTTPHeaders({
      'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'
    });

    console.log('正在访问页面（浏览器窗口已打开）...\n');
    console.log('⚠️  如果看到验证码，请手动完成验证！\n');

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // 检查是否遇到验证码
    const pageContent = await page.content();
    if (pageContent.includes('showcaptcha') || pageContent.includes('SmartCaptcha')) {
      console.log('❌ 检测到验证码页面！\n');
      console.log('请在浏览器窗口中手动完成验证码，然后等待...\n');
      console.log('等待 60 秒供您完成验证...\n');
      await page.waitForTimeout(60000);
    } else {
      console.log('✅ 成功访问页面，未遇到验证码！\n');
    }

    console.log('等待 30 秒以捕获所有 API 请求...\n');
    await page.waitForTimeout(30000);

    console.log('\n========================================');
    console.log('📋 捕获结果');
    console.log('========================================\n');

    console.log(`总共捕获 ${allRequests.length} 个请求\n`);

    // 查找包含特定关键词的请求
    console.log('--- 查找包含 "captcha" 的请求 ---\n');
    const captchaRequests = allRequests.filter(r => r.url.toLowerCase().includes('captcha'));
    if (captchaRequests.length > 0) {
      console.log('❌ 仍然遇到验证码:\n');
      captchaRequests.forEach((req, index) => {
        console.log(`${index + 1}. ${req.url}`);
      });
    } else {
      console.log('✅ 没有验证码请求');
    }

    console.log('\n--- 查找包含 "masstransit" 的请求 ---\n');
    const masstransitRequests = allRequests.filter(r => r.url.toLowerCase().includes('masstransit'));
    if (masstransitRequests.length > 0) {
      console.log('✅ 找到 masstransit API 请求:\n');
      masstransitRequests.forEach((req, index) => {
        console.log(`${index + 1}. ${req.url}`);
      });
    } else {
      console.log('❌ 未找到 masstransit API 请求');
    }

    console.log('\n--- 所有请求列表 ---\n');
    allRequests.forEach((req, index) => {
      console.log(`${index + 1}. [${req.method}] ${req.url}`);
    });

    console.log('\n\n⏸️  浏览器将保持打开 10 秒，请检查页面...\n');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('错误:', error);
  } finally {
    await browser.close();
  }

  console.log('\n========================================');
  console.log('测试完成');
  console.log('========================================\n');
}

testWithBetterStealth().catch(error => {
  console.error('测试出错:', error);
  process.exit(1);
});
