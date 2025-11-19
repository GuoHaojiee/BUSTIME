const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const logger = require('../utils/logger');

// 使用 stealth 插件
puppeteer.use(StealthPlugin());

/**
 * Yandex Search Service - 搜索公交站点
 * 使用与 yandexTransportService 相同的技术
 */
class YandexSearchService {
  constructor() {
    this.browser = null;
    this.isInitializing = false;
  }

  /**
   * 初始化浏览器
   */
  async initialize() {
    if (this.browser && this.browser.isConnected()) {
      return this.browser;
    }

    if (this.isInitializing) {
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.browser;
    }

    this.isInitializing = true;

    try {
      logger.info('启动搜索浏览器 (Stealth 模式)...');
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--incognito',
        ],
        ignoreHTTPSErrors: true,
      });

      this.browser.on('disconnected', () => {
        logger.warn('搜索浏览器连接已断开');
        this.browser = null;
      });

      logger.info('搜索浏览器启动成功');
      return this.browser;
    } catch (error) {
      logger.error('搜索浏览器启动失败:', error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * 搜索公交站点
   * @param {string} keyword - 搜索关键词
   * @returns {Array} 站点列表
   */
  async searchStops(keyword) {
    const browser = await this.initialize();
    const page = await browser.newPage();

    try {
      logger.info(`搜索站点: ${keyword}`);

      // 访问 Yandex Maps
      const searchUrl = `https://yandex.ru/maps/213/moscow/?text=${encodeURIComponent(keyword)}`;
      logger.info(`访问搜索页面: ${searchUrl}`);

      await page.goto(searchUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // 等待搜索结果加载
      logger.info('等待搜索结果...');
      await page.waitForTimeout(5000);

      // 提取搜索结果
      const stops = await page.evaluate(() => {
        const results = [];

        // 尝试多种选择器来查找搜索结果
        const selectors = [
          'div[class*="search-snippet"]',
          'div[class*="search-list-item"]',
          'div[class*="search-result"]',
          'li[class*="search"]',
          'a[href*="/stops/stop_"]'
        ];

        let items = [];
        for (const selector of selectors) {
          items = document.querySelectorAll(selector);
          if (items.length > 0) {
            console.log(`找到 ${items.length} 个结果使用选择器: ${selector}`);
            break;
          }
        }

        // 如果没找到结果，尝试查找所有包含 "stop_" 的链接
        if (items.length === 0) {
          const allLinks = document.querySelectorAll('a[href*="stop_"]');
          console.log(`通过链接找到 ${allLinks.length} 个站点`);

          allLinks.forEach((link, index) => {
            if (index >= 20) return; // 限制结果数量

            const href = link.getAttribute('href') || '';
            const stopIdMatch = href.match(/stop__(\d+)/);

            if (stopIdMatch) {
              const stopId = `stop__${stopIdMatch[1]}`;

              // 尝试获取站点名称
              let name = link.textContent.trim();
              if (!name) {
                // 尝试从父元素获取
                const parent = link.closest('div[class*="snippet"], div[class*="search"], li');
                if (parent) {
                  name = parent.textContent.trim().split('\n')[0];
                }
              }

              // 尝试获取地址
              let address = '';
              const parent = link.closest('div[class*="snippet"], div[class*="search"], li');
              if (parent) {
                const textElements = parent.querySelectorAll('[class*="subtitle"], [class*="address"], [class*="description"]');
                if (textElements.length > 0) {
                  address = textElements[0].textContent.trim();
                }
              }

              results.push({
                id: stopId,
                name: name || stopId,
                address: address,
                href: href
              });
            }
          });

          return results;
        }

        // 处理找到的搜索结果
        items.forEach((item, index) => {
          if (index >= 20) return;

          // 查找链接
          const link = item.querySelector('a[href*="stop_"]') || item;
          const href = link.getAttribute('href') || '';

          // 提取 stopId
          const stopIdMatch = href.match(/stop__(\d+)/);
          if (!stopIdMatch) return;

          const stopId = `stop__${stopIdMatch[1]}`;

          // 提取名称
          const titleSelectors = [
            '[class*="title"]',
            '[class*="name"]',
            '[class*="snippet__title"]',
            'h3', 'h4', 'strong'
          ];

          let name = '';
          for (const sel of titleSelectors) {
            const titleEl = item.querySelector(sel);
            if (titleEl && titleEl.textContent.trim()) {
              name = titleEl.textContent.trim();
              break;
            }
          }

          // 提取地址
          const addressSelectors = [
            '[class*="subtitle"]',
            '[class*="address"]',
            '[class*="description"]',
            '[class*="snippet__subtitle"]'
          ];

          let address = '';
          for (const sel of addressSelectors) {
            const addrEl = item.querySelector(sel);
            if (addrEl && addrEl.textContent.trim()) {
              address = addrEl.textContent.trim();
              break;
            }
          }

          results.push({
            id: stopId,
            name: name || stopId,
            address: address,
            href: href
          });
        });

        return results;
      });

      logger.info(`找到 ${stops.length} 个搜索结果`);

      // 去重
      const uniqueStops = [];
      const seenIds = new Set();

      for (const stop of stops) {
        if (!seenIds.has(stop.id)) {
          seenIds.add(stop.id);
          uniqueStops.push(stop);
        }
      }

      logger.info(`去重后 ${uniqueStops.length} 个唯一站点`);
      return uniqueStops;

    } catch (error) {
      logger.error('搜索站点失败:', error);
      throw error;
    } finally {
      await page.close();
    }
  }

  /**
   * 关闭浏览器
   */
  async close() {
    if (this.browser) {
      logger.info('正在关闭搜索浏览器...');
      await this.browser.close();
      this.browser = null;
      logger.info('搜索浏览器已关闭');
    }
  }
}

// 导出单例
module.exports = new YandexSearchService();
