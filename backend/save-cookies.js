/**
 * 手动解决 CAPTCHA 并保存 cookies
 * 运行后会打开浏览器，你需要手动完成 CAPTCHA
 */
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs').promises;
const path = require('path');

puppeteer.use(StealthPlugin());

async function saveCookies() {
  console.log('启动浏览器...');
  console.log('请注意: 你需要手动完成 CAPTCHA 验证！\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1920,1080'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const url = 'https://yandex.ru/maps/213/moscow/stops/stop__9644561/?ll=37.516137%2C55.680195&tab=overview&z=16.33';

  console.log('访问:', url);
  await page.goto(url, { waitUntil: 'networkidle0' });

  console.log('\n========================================');
  console.log('⚠️  请在浏览器中手动完成 CAPTCHA 验证');
  console.log('========================================');
  console.log('\n等待你完成验证...');
  console.log('完成后，页面应该会显示站点信息。');
  console.log('你将有 120 秒的时间来完成验证。\n');

  // 等待用户完成 CAPTCHA
  let completed = false;
  const maxWaitTime = 120000; // 120 秒
  const checkInterval = 2000; // 每 2 秒检查一次
  let elapsed = 0;

  while (elapsed < maxWaitTime && !completed) {
    await page.waitForTimeout(checkInterval);
    elapsed += checkInterval;

    // 检查是否已经通过 CAPTCHA
    const title = await page.title();
    const hasCaptcha = title.includes('robot') || title.includes('not a robot');

    if (!hasCaptcha) {
      completed = true;
      console.log('✅ 检测到已通过验证！');
      break;
    }

    if (elapsed % 10000 === 0) {
      console.log(`等待中... (${elapsed / 1000}s / 120s)`);
    }
  }

  if (!completed) {
    console.log('\n❌ 超时！未检测到验证完成。');
    await browser.close();
    process.exit(1);
  }

  // 保存 cookies
  console.log('\n保存 cookies...');
  const cookies = await page.cookies();
  const cookiesPath = path.join(__dirname, 'yandex-cookies.json');
  await fs.writeFile(cookiesPath, JSON.stringify(cookies, null, 2));
  console.log('✅ Cookies 已保存到:', cookiesPath);

  // 保存本地存储
  const localStorage = await page.evaluate(() => {
    const items = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      items[key] = window.localStorage.getItem(key);
    }
    return items;
  });

  const localStoragePath = path.join(__dirname, 'yandex-localstorage.json');
  await fs.writeFile(localStoragePath, JSON.stringify(localStorage, null, 2));
  console.log('✅ LocalStorage 已保存到:', localStoragePath);

  // 测试提取数据
  console.log('\n========================================');
  console.log('🔍 测试数据提取:');
  console.log('========================================\n');

  const pageData = await page.evaluate(() => {
    const data = {
      title: document.title,
      url: window.location.href,
      html: document.body.innerText.substring(0, 500)
    };
    return data;
  });

  console.log('页面标题:', pageData.title);
  console.log('当前 URL:', pageData.url);
  console.log('页面内容预览:\n', pageData.html);

  console.log('\n浏览器将保持打开 20 秒，你可以查看页面...');
  await page.waitForTimeout(20000);

  await browser.close();
  console.log('\n完成！你现在可以使用保存的 cookies 来访问 Yandex Maps 了。');
}

saveCookies().catch(error => {
  console.error('错误:', error);
  process.exit(1);
});
