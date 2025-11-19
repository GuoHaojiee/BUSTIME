const puppeteer = require('puppeteer');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Puppeteer 服务 - 用于获取 Yandex Maps 实时公交数据
 */
class PuppeteerService {
  constructor() {
    this.browser = null;
    this.isInitializing = false;
  }

  /**
   * 初始化浏览器实例
   * @returns {Promise<Browser>}
   */
  async initialize() {
    if (this.browser && this.browser.isConnected()) {
      return this.browser;
    }

    if (this.isInitializing) {
      // 等待初始化完成
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.browser;
    }

    this.isInitializing = true;

    try {
      logger.info('正在启动浏览器...');
      this.browser = await puppeteer.launch({
        headless: config.puppeteer.headless,
        args: config.puppeteer.args
      });

      this.browser.on('disconnected', () => {
        logger.warn('浏览器连接已断开');
        this.browser = null;
      });

      logger.info('浏览器启动成功');
      return this.browser;
    } catch (error) {
      logger.error('浏览器启动失败:', error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * 获取站点实时到站信息
   * @param {string} stopId - 站点ID
   * @returns {Promise<object>}
   */
  async getStopArrivals(stopId) {
    const browser = await this.initialize();
    const page = await browser.newPage();

    try {
      logger.info(`获取站点 ${stopId} 的实时数据`);

      // 设置用户代理
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      // 拦截和记录网络请求
      const arrivals = await new Promise(async (resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('获取数据超时'));
        }, config.puppeteer.timeout);

        // 拦截的数据
        let interceptedData = null;

        await page.setRequestInterception(true);

        // 监听响应
        page.on('response', async (response) => {
          const url = response.url();

          // 匹配实时数据接口 - 根据实际情况调整
          if (
            url.includes('masstransit') &&
            (url.includes('forecasts') || url.includes('stop'))
          ) {
            try {
              const contentType = response.headers()['content-type'];
              if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                logger.info(`拦截到 API 数据: ${url}`);

                if (!interceptedData) {
                  interceptedData = data;
                  clearTimeout(timeout);
                  resolve(this.parseArrivals(data, stopId));
                }
              }
            } catch (error) {
              logger.error('解析响应失败:', error.message);
            }
          }
        });

        // 继续所有请求
        page.on('request', (request) => {
          // 阻止加载图片、字体等资源以提高速度
          const resourceType = request.resourceType();
          if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
            request.abort();
          } else {
            request.continue();
          }
        });

        // 访问站点页面
        const url = `https://yandex.ru/maps/?masstransit[stopId]=${stopId}`;
        logger.info(`访问页面: ${url}`);

        try {
          await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: config.puppeteer.timeout
          });

          // 如果没有拦截到 API，尝试从 DOM 解析（降级方案）
          if (!interceptedData) {
            logger.warn('未拦截到 API 数据，尝试 DOM 解析');
            const domData = await this.parseFromDOM(page, stopId);
            clearTimeout(timeout);
            resolve(domData);
          }
        } catch (error) {
          clearTimeout(timeout);
          reject(error);
        }
      });

      return arrivals;
    } catch (error) {
      logger.error(`获取站点 ${stopId} 数据失败:`, error);
      throw error;
    } finally {
      await page.close();
    }
  }

  /**
   * 搜索站点
   * @param {string} keyword - 搜索关键词
   * @returns {Promise<Array>}
   */
  async searchStops(keyword) {
    const browser = await this.initialize();
    const page = await browser.newPage();

    try {
      logger.info(`搜索站点: ${keyword}`);

      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      // 访问莫斯科地图首页
      await page.goto('https://yandex.ru/maps/213/moscow/', {
        waitUntil: 'networkidle2',
        timeout: config.puppeteer.timeout
      });

      // 等待搜索框出现
      await page.waitForSelector('input.search-form__input', { timeout: 5000 });

      // 输入搜索关键词
      await page.type('input.search-form__input', keyword);
      await page.keyboard.press('Enter');

      // 等待搜索结果
      await page.waitForSelector('.search-snippet-view', { timeout: 10000 });

      // 提取搜索结果
      const stops = await page.evaluate(() => {
        const results = [];
        const items = document.querySelectorAll('.search-snippet-view');

        items.forEach((item, index) => {
          // 限制结果数量
          if (index >= 20) return;

          const titleElement = item.querySelector('.search-snippet-view__title');
          const subtitleElement = item.querySelector('.search-snippet-view__subtitle');

          if (titleElement) {
            const name = titleElement.textContent.trim();
            const address = subtitleElement ? subtitleElement.textContent.trim() : '';

            // 尝试从链接中提取站点ID
            const linkElement = item.querySelector('a');
            const href = linkElement ? linkElement.getAttribute('href') : '';
            let stopId = '';

            // 从 href 中提取 stopId
            const stopIdMatch = href.match(/stopId[=\]]([^&\]]+)/);
            if (stopIdMatch) {
              stopId = stopIdMatch[1];
            } else {
              // 如果没有 stopId，生成一个临时的
              stopId = `search_${Date.now()}_${index}`;
            }

            results.push({
              id: stopId,
              name: name,
              address: address,
              href: href
            });
          }
        });

        return results;
      });

      logger.info(`找到 ${stops.length} 个搜索结果`);
      return stops;
    } catch (error) {
      logger.error(`搜索站点失败:`, error);
      throw error;
    } finally {
      await page.close();
    }
  }

  /**
   * 解析 API 返回的到站数据
   * @param {object} data - API 数据
   * @param {string} stopId - 站点ID
   * @returns {object}
   */
  parseArrivals(data, stopId) {
    try {
      const result = {
        stop: {
          id: stopId,
          name: '',
          coordinates: null
        },
        arrivals: [],
        updateTime: new Date().toISOString()
      };

      // 根据实际 API 响应格式解析
      // 这里需要根据实际拦截到的数据结构进行调整

      if (data.data && data.data.features) {
        // 可能的数据格式1
        const features = data.data.features;
        features.forEach(feature => {
          if (feature.properties && feature.properties.MasstransitData) {
            const mtData = feature.properties.MasstransitData;
            // 解析线路和到站信息
            // 这部分需要根据实际数据格式调整
          }
        });
      } else if (data.forecasts) {
        // 可能的数据格式2
        data.forecasts.forEach(forecast => {
          const route = {
            routeNumber: forecast.route?.number || 'Unknown',
            routeName: forecast.route?.name || '',
            routeType: forecast.route?.type || 'bus',
            color: forecast.route?.color || '#000000',
            arrivals: []
          };

          if (forecast.arrivals) {
            forecast.arrivals.forEach(arrival => {
              route.arrivals.push({
                minutes: Math.floor((arrival.time || 0) / 60),
                time: arrival.time || 0,
                direction: arrival.direction || '',
                vehicleId: arrival.vehicle_id || ''
              });
            });
          }

          result.arrivals.push(route);
        });
      }

      return result;
    } catch (error) {
      logger.error('解析到站数据失败:', error);
      throw error;
    }
  }

  /**
   * 从 DOM 解析数据（降级方案）
   * @param {Page} page - Puppeteer 页面对象
   * @param {string} stopId - 站点ID
   * @returns {Promise<object>}
   */
  async parseFromDOM(page, stopId) {
    logger.info('使用 DOM 解析方案');

    try {
      // 等待页面加载
      await page.waitForTimeout(3000);

      const data = await page.evaluate(() => {
        const result = {
          stop: {
            id: '',
            name: '',
            coordinates: null
          },
          arrivals: [],
          updateTime: new Date().toISOString()
        };

        // 尝试获取站点名称
        const titleElement = document.querySelector('.card-title-view__title');
        if (titleElement) {
          result.stop.name = titleElement.textContent.trim();
        }

        // 尝试获取公交线路信息
        const routeElements = document.querySelectorAll('.masstransit-route-snippet-view');

        routeElements.forEach(routeEl => {
          const routeNumber = routeEl.querySelector('.masstransit-route-snippet-view__number')?.textContent.trim() || '';
          const routeName = routeEl.querySelector('.masstransit-route-snippet-view__name')?.textContent.trim() || '';

          const route = {
            routeNumber,
            routeName,
            routeType: 'bus',
            color: '#000000',
            arrivals: []
          };

          // 尝试获取到站时间
          const timeElements = routeEl.querySelectorAll('.masstransit-prognoses-view__time');
          timeElements.forEach(timeEl => {
            const timeText = timeEl.textContent.trim();
            const minutes = parseInt(timeText, 10) || 0;

            route.arrivals.push({
              minutes,
              time: minutes * 60,
              direction: '',
              vehicleId: ''
            });
          });

          if (route.arrivals.length > 0) {
            result.arrivals.push(route);
          }
        });

        return result;
      });

      data.stop.id = stopId;
      return data;
    } catch (error) {
      logger.error('DOM 解析失败:', error);
      throw new Error('无法获取站点数据');
    }
  }

  /**
   * 关闭浏览器
   */
  async close() {
    if (this.browser) {
      logger.info('正在关闭浏览器...');
      await this.browser.close();
      this.browser = null;
      logger.info('浏览器已关闭');
    }
  }
}

// 导出单例
module.exports = new PuppeteerService();
