/**
 * 调试脚本：捕获所有网络请求
 * 目的：查看 Yandex Maps 实际调用了哪些 API
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function debugAllRequests() {
  console.log('========================================');
  console.log('🔍 调试：捕获所有网络请求');
  console.log('========================================\n');

  const stopId = 'stop__9639579';
  const url = `https://yandex.ru/maps/213/moscow/stops/${stopId}/`;

  console.log(`测试URL: ${url}\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1920,1080'
    ]
  });

  const page = await browser.newPage();

  // 存储所有请求
  const allRequests = [];
  const allResponses = [];

  try {
    const client = await page.target().createCDPSession();
    await client.send('Network.enable');

    // 捕获所有请求
    client.on('Network.requestWillBeSent', (params) => {
      const url = params.request.url;

      // 只记录相关的请求（过滤掉静态资源）
      if (url.includes('yandex') &&
          !url.includes('.css') &&
          !url.includes('.js') &&
          !url.includes('.png') &&
          !url.includes('.jpg') &&
          !url.includes('.woff') &&
          !url.includes('.svg')) {
        allRequests.push({
          url: url,
          method: params.request.method,
          requestId: params.requestId
        });
      }
    });

    // 捕获所有响应
    client.on('Network.responseReceived', (params) => {
      const url = params.response.url;

      // 只记录 API 相关的响应
      if (url.includes('api') || url.includes('maps')) {
        allResponses.push({
          url: url,
          status: params.response.status,
          mimeType: params.response.mimeType,
          requestId: params.requestId
        });
      }
    });

    await page.setViewport({ width: 1920, height: 1080 });

    await page.setUserAgent(
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    console.log('正在访问页面...\n');
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    console.log('等待 30 秒以捕获所有请求...\n');
    await page.waitForTimeout(30000);

    console.log('\n========================================');
    console.log('📋 捕获结果');
    console.log('========================================\n');

    console.log(`总共捕获 ${allRequests.length} 个请求\n`);
    console.log(`总共捕获 ${allResponses.length} 个响应\n`);

    console.log('--- 所有请求 URL ---\n');
    allRequests.forEach((req, index) => {
      console.log(`${index + 1}. [${req.method}] ${req.url.substring(0, 120)}`);
    });

    console.log('\n--- 所有响应 URL (包含 api 或 maps) ---\n');
    allResponses.forEach((res, index) => {
      console.log(`${index + 1}. [${res.status}] ${res.mimeType}`);
      console.log(`   ${res.url.substring(0, 120)}`);
      console.log('');
    });

    // 查找包含特定关键词的请求
    console.log('\n--- 查找包含 "masstransit" 的请求 ---\n');
    const masstransitRequests = allRequests.filter(r => r.url.toLowerCase().includes('masstransit'));
    if (masstransitRequests.length > 0) {
      masstransitRequests.forEach((req, index) => {
        console.log(`${index + 1}. ${req.url}`);
      });
    } else {
      console.log('未找到包含 "masstransit" 的请求');
    }

    console.log('\n--- 查找包含 "stop" 的请求 ---\n');
    const stopRequests = allRequests.filter(r => r.url.toLowerCase().includes('stop'));
    if (stopRequests.length > 0) {
      stopRequests.forEach((req, index) => {
        console.log(`${index + 1}. ${req.url}`);
      });
    } else {
      console.log('未找到包含 "stop" 的请求');
    }

    console.log('\n--- 查找包含 "transport" 的请求 ---\n');
    const transportRequests = allRequests.filter(r => r.url.toLowerCase().includes('transport'));
    if (transportRequests.length > 0) {
      transportRequests.forEach((req, index) => {
        console.log(`${index + 1}. ${req.url}`);
      });
    } else {
      console.log('未找到包含 "transport" 的请求');
    }

    // 尝试获取第一个包含 api 的响应内容
    console.log('\n--- 尝试获取 API 响应内容 ---\n');
    const apiResponses = allResponses.filter(r =>
      r.url.includes('/api/') &&
      r.mimeType &&
      (r.mimeType.includes('json') || r.mimeType.includes('text'))
    );

    if (apiResponses.length > 0) {
      console.log(`找到 ${apiResponses.length} 个 API 响应，获取第一个:\n`);
      const firstApi = apiResponses[0];

      try {
        const response = await client.send('Network.getResponseBody', {
          requestId: firstApi.requestId
        });

        let body = response.body;
        if (response.base64Encoded) {
          body = Buffer.from(body, 'base64').toString('utf-8');
        }

        console.log('URL:', firstApi.url);
        console.log('内容预览:', body.substring(0, 500));

        // 尝试解析 JSON
        try {
          const json = JSON.parse(body);
          console.log('\n✅ 成功解析为 JSON');
          console.log('JSON 结构:', JSON.stringify(json, null, 2).substring(0, 1000));
        } catch (e) {
          console.log('\n❌ 不是有效的 JSON');
        }
      } catch (e) {
        console.log(`无法获取响应内容: ${e.message}`);
      }
    } else {
      console.log('未找到 API 响应');
    }

  } catch (error) {
    console.error('错误:', error);
  } finally {
    await browser.close();
  }

  console.log('\n========================================');
  console.log('调试完成');
  console.log('========================================\n');
}

debugAllRequests().catch(error => {
  console.error('调试出错:', error);
  process.exit(1);
});
