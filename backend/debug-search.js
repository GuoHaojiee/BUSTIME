/**
 * 调试搜索功能
 * 使用非headless模式查看页面
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function debugSearch() {
  console.log('========================================');
  console.log('🔍 调试搜索功能');
  console.log('========================================\n');

  const keyword = 'Вернадского';
  const searchUrl = `https://yandex.ru/maps/213/moscow/?text=${encodeURIComponent(keyword)}`;

  console.log(`搜索关键词: ${keyword}`);
  console.log(`URL: ${searchUrl}\n`);

  const browser = await puppeteer.launch({
    headless: false, // 非headless模式，可以看到浏览器
    args: [
      '--no-sandbox',
      '--incognito',
      '--start-maximized'
    ],
    defaultViewport: null
  });

  const page = await browser.newPage();

  try {
    console.log('正在访问页面...\n');
    await page.goto(searchUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('等待 10 秒加载...\n');
    await page.waitForTimeout(10000);

    // 打印页面标题
    const title = await page.title();
    console.log(`页面标题: ${title}\n`);

    // 尝试查找所有可能的链接
    const allLinks = await page.evaluate(() => {
      // 查找所有链接
      const links = [];
      const allAnchors = document.querySelectorAll('a');

      allAnchors.forEach((a, index) => {
        const href = a.getAttribute('href') || '';
        const text = a.textContent.trim();

        // 只收集包含 stop 的链接
        if (href.includes('stop')) {
          links.push({
            index: index,
            href: href.substring(0, 150),
            text: text.substring(0, 100)
          });
        }
      });

      return links;
    });

    console.log(`找到 ${allLinks.length} 个包含 'stop' 的链接:\n`);
    allLinks.forEach((link, idx) => {
      console.log(`${idx + 1}. ${link.text}`);
      console.log(`   href: ${link.href}\n`);
    });

    // 查找搜索结果区域
    console.log('\n查找搜索结果容器...\n');
    const containers = await page.evaluate(() => {
      const results = [];

      // 尝试多种选择器
      const selectors = [
        '[class*="search"]',
        '[class*="Search"]',
        '[class*="snippet"]',
        '[class*="Snippet"]',
        '[class*="list"]',
        '[class*="List"]',
        '[class*="results"]',
        '[class*="Results"]'
      ];

      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          results.push({
            selector: selector,
            count: elements.length,
            sample: elements[0].className
          });
        }
      });

      return results;
    });

    console.log('找到的容器:\n');
    containers.forEach(c => {
      console.log(`选择器: ${c.selector}`);
      console.log(`数量: ${c.count}`);
      console.log(`示例类名: ${c.sample}\n`);
    });

    console.log('\n浏览器将保持打开 60 秒，请手动检查页面...\n');
    await page.waitForTimeout(60000);

  } catch (error) {
    console.error('错误:', error);
  } finally {
    await browser.close();
  }

  console.log('\n调试完成！\n');
}

debugSearch().catch(error => {
  console.error('调试出错:', error);
  process.exit(1);
});
