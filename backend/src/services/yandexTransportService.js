const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const config = require('../config');
const logger = require('../utils/logger');

// 使用 stealth 插件来绕过反爬虫检测
puppeteer.use(StealthPlugin());

/**
 * Yandex Transport Service - 基于 YandexTransportProxy 的实现
 * 使用 Selenium/Puppeteer + 浏览器缓存提取的方式获取 Yandex Masstransit API 数据
 */
class YandexTransportService {
  constructor() {
    this.browser = null;
    this.isInitializing = false;
    this.networkQueriesCount = 0;
    this.maxQueriesBeforeRestart = 100; // 执行100次查询后重启浏览器
  }

  /**
   * 初始化浏览器实例
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
      logger.info('启动浏览器 (Stealth 模式)...');
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--incognito',  // 添加隐身模式，匹配 Python 版本
          // 简化配置，移除过多的反检测参数（这些可能反而引起怀疑）
        ],
        ignoreHTTPSErrors: true,
        // 使用默认视窗大小，更自然
      });

      this.browser.on('disconnected', () => {
        logger.warn('浏览器连接已断开');
        this.browser = null;
      });

      logger.info('浏览器启动成功 (Stealth 模式)');
      return this.browser;
    } catch (error) {
      logger.error('浏览器启动失败:', error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * 重启浏览器（垃圾回收）
   */
  async restart() {
    logger.info('重启浏览器进行垃圾回收...');
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    this.networkQueriesCount = 0;
    await this.initialize();
  }

  /**
   * 检查是否需要重启浏览器
   */
  async checkAndRestartIfNeeded() {
    if (this.networkQueriesCount >= this.maxQueriesBeforeRestart) {
      await this.restart();
    }
  }

  /**
   * 核心方法：获取 Yandex JSON 数据
   * 使用 CDP 监听网络请求
   */
  async _getYandexJson(url, apiMethods) {
    await this.checkAndRestartIfNeeded();

    const browser = await this.initialize();
    const page = await browser.newPage();

    // 存储捕获的 API 请求
    const capturedRequests = [];

    try {
      // 启用 CDP 的 Network domain
      const client = await page.target().createCDPSession();
      await client.send('Network.enable');

      // 监听网络响应
      client.on('Network.responseReceived', (params) => {
        const responseUrl = params.response.url;

        // 检查是否匹配我们要找的 API
        for (const method of apiMethods) {
          if (responseUrl.includes(method)) {
            capturedRequests.push({
              url: responseUrl,
              method: method,
              requestId: params.requestId
            });
            logger.info(`捕获到 API: ${method}`);
          }
        }
      });

      // 不设置视窗大小，使用默认值更自然
      // 不注入 webdriver 隐藏代码，stealth 插件已经处理
      // 不手动设置用户代理，使用浏览器默认值更安全

      logger.info(`访问页面: ${url}`);
      logger.info(`查找 API 方法: ${apiMethods.join(', ')}`);

      // 访问页面
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      // 关键步骤：等待 30 秒让 getStopInfo 被调用
      // 这是 YandexTransportProxy 中的重要发现
      logger.info('等待 30 秒以确保所有 API 被调用...');
      await page.waitForTimeout(30000);

      this.networkQueriesCount++;

      logger.info(`捕获到 ${capturedRequests.length} 个匹配的 API 请求`);

      if (capturedRequests.length === 0) {
        logger.warn('未找到任何匹配的 API 请求');
        return { results: [], error: 'NO_API_FOUND' };
      }

      // 获取每个 API 的 JSON 数据
      const results = [];
      for (const query of capturedRequests) {
        try {
          logger.info(`获取 API 数据: ${query.url.substring(0, 100)}...`);

          // 使用 CDP 直接获取响应体
          let responseBody;
          try {
            const response = await client.send('Network.getResponseBody', {
              requestId: query.requestId
            });
            responseBody = response.body;

            // 如果是 base64 编码，需要解码
            if (response.base64Encoded) {
              responseBody = Buffer.from(responseBody, 'base64').toString('utf-8');
            }
          } catch (cdpError) {
            logger.error(`CDP 获取响应失败: ${cdpError.message}`);
            // 尝试降级方案：使用 page.goto 访问URL
            const apiPage = await browser.newPage();
            try {
              await apiPage.goto(query.url, {
                waitUntil: 'domcontentloaded',
                timeout: 15000
              });
              responseBody = await apiPage.content();
            } finally {
              await apiPage.close();
            }
          }

          // 解析 JSON 数据
          try {
            // 如果响应是 HTML，尝试提取 body 中的内容
            if (responseBody.includes('<body')) {
              const bodyMatch = responseBody.match(/<body[^>]*>(.*?)<\/body>/s);
              if (bodyMatch) {
                responseBody = bodyMatch[1].trim();
                // 解码 HTML 实体
                responseBody = responseBody
                  .replace(/&quot;/g, '"')
                  .replace(/&amp;/g, '&')
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>')
                  .replace(/&#39;/g, "'");
              }
            }

            const jsonData = JSON.parse(responseBody);

            results.push({
              url: query.url,
              method: this.yandexApiToLocalApi(query.method),
              error: 'OK',
              data: jsonData
            });

            logger.info(`成功解析 ${query.method} 的 JSON 数据`);
          } catch (parseError) {
            logger.error(`解析 JSON 失败: ${parseError.message}`);
            logger.error(`响应内容: ${responseBody.substring(0, 200)}...`);
            results.push({
              url: query.url,
              method: this.yandexApiToLocalApi(query.method),
              error: 'FAILED_TO_PARSE_JSON',
              rawData: responseBody.substring(0, 500)
            });
          }
        } catch (error) {
          logger.error(`获取 API 数据失败: ${error.message}`);
          results.push({
            url: query.url,
            method: this.yandexApiToLocalApi(query.method),
            error: error.message
          });
        }
      }

      return { results, error: null };
    } catch (error) {
      logger.error('_getYandexJson 执行失败:', error);
      throw error;
    } finally {
      await page.close();
    }
  }

  /**
   * 转换 Yandex API 方法名为本地 API 方法名
   */
  yandexApiToLocalApi(method) {
    const mapping = {
      'maps/api/masstransit/getStopInfo': 'getStopInfo',
      'maps/api/masstransit/getRouteInfo': 'getRouteInfo',
      'maps/api/masstransit/getLine': 'getLine',
      'maps/api/masstransit/getVehiclesInfo': 'getVehiclesInfo',
      'maps/api/masstransit/getVehiclesInfoWithRegion': 'getVehiclesInfoWithRegion',
      'maps/api/masstransit/getLayerRegions': 'getLayerRegions'
    };

    for (const [key, value] of Object.entries(mapping)) {
      if (method.includes(key)) {
        return value;
      }
    }

    return method;
  }

  /**
   * 获取站点信息（getStopInfo）
   */
  async getStopInfo(stopId) {
    // 构建正确的 Yandex Maps URL
    // 正确的格式：https://yandex.ru/maps/213/moscow/stops/stop__ID/
    const url = `https://yandex.ru/maps/213/moscow/stops/${stopId}/`;

    logger.info(`获取站点信息: ${stopId}`);

    const result = await this._getYandexJson(url, ['maps/api/masstransit/getStopInfo']);

    if (result.error) {
      throw new Error(result.error);
    }

    // 查找所有 getStopInfo 的结果
    const stopInfoResults = result.results.filter(r => r.method === 'getStopInfo' && r.error === 'OK');

    if (stopInfoResults.length === 0) {
      throw new Error('未能获取 getStopInfo 数据');
    }

    // 选择包含有效数据的响应（有 data.transports 字段的）
    let stopInfoResult = stopInfoResults.find(r =>
      r.data && r.data.data && r.data.data.transports && r.data.data.transports.length > 0
    );

    // 如果没有找到包含 transports 的响应，使用最后一个响应
    if (!stopInfoResult) {
      stopInfoResult = stopInfoResults[stopInfoResults.length - 1];
    }

    // 解析并格式化数据
    return this.parseStopInfo(stopInfoResult.data, stopId);
  }

  /**
   * 解析 getStopInfo 返回的数据
   */
  parseStopInfo(data, stopId) {
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

      // 检查数据结构
      if (!data.data) {
        logger.warn('JSON 数据中没有 data 字段');
        return result;
      }

      const stopData = data.data;

      // 获取站点基本信息
      result.stop.id = stopData.id || stopId;
      result.stop.coordinates = stopData.coordinates || null;

      // 获取当前时间（用于计算到站分钟数）
      const currentTime = stopData.currentTime ? stopData.currentTime / 1000 : Date.now() / 1000;

      // 解析 transports 数组
      if (stopData.transports && Array.isArray(stopData.transports)) {
        stopData.transports.forEach(transport => {
          const route = {
            routeNumber: transport.name || '',
            routeName: transport.description || '',
            routeType: this.getRouteType(transport.type),
            color: '#000000', // Yandex API 不提供颜色信息
            arrivals: []
          };

          // 解析线路的各个方向（threads）
          if (transport.threads && Array.isArray(transport.threads)) {
            transport.threads.forEach(thread => {
              // 获取方向信息
              const direction = thread.EssentialStops && thread.EssentialStops.length > 0
                ? thread.EssentialStops[thread.EssentialStops.length - 1].name
                : '';

              // 解析到站事件
              if (thread.BriefSchedule && thread.BriefSchedule.Events) {
                thread.BriefSchedule.Events.forEach(event => {
                  // 优先使用预计时间（Estimated），如果没有则使用计划时间（Scheduled）
                  const timeInfo = event.Estimated || event.Scheduled;

                  if (timeInfo && timeInfo.value) {
                    const arrivalTime = parseInt(timeInfo.value);
                    const minutesUntilArrival = Math.max(0, Math.floor((arrivalTime - currentTime) / 60));

                    route.arrivals.push({
                      minutes: minutesUntilArrival,
                      time: arrivalTime - currentTime, // 相对秒数
                      direction: direction,
                      vehicleId: event.vehicleId || '',
                      isEstimated: !!event.Estimated, // 标记是否为实时预测
                      scheduledTime: event.Scheduled?.text || '',
                      estimatedTime: event.Estimated?.text || ''
                    });
                  }
                });
              }
            });
          }

          // 只添加有到站信息的线路
          if (route.arrivals.length > 0) {
            // 按照到站时间排序
            route.arrivals.sort((a, b) => a.time - b.time);
            result.arrivals.push(route);
          }
        });
      }

      // 如果没有获取到站点名称，使用站点ID
      if (!result.stop.name) {
        result.stop.name = `站点 ${stopId}`;
      }

      return result;
    } catch (error) {
      logger.error('解析 getStopInfo 数据失败:', error);
      throw error;
    }
  }

  /**
   * 解析时间字符串为秒数
   */
  parseTimeToSeconds(timeStr) {
    if (typeof timeStr === 'number') {
      return timeStr;
    }

    // 解析如 "5 мин" 或 "прибывает" 等格式
    const match = timeStr.match(/(\d+)/);
    if (match) {
      return parseInt(match[1]) * 60;
    }

    // 如果是 "прибывает"（即将到达），返回 0
    return 0;
  }

  /**
   * 获取路线类型
   */
  getRouteType(type) {
    const typeMapping = {
      'bus': 'bus',
      'trolleybus': 'trolleybus',
      'tramway': 'tram',
      'minibus': 'minibus',
      'suburban': 'suburban'
    };

    return typeMapping[type] || 'bus';
  }

  /**
   * 获取所有信息
   */
  async getAllInfo(stopId) {
    const url = `https://yandex.ru/maps/213/moscow/stops/${stopId}/`;

    logger.info(`获取所有信息: ${stopId}`);

    const result = await this._getYandexJson(url, [
      'maps/api/masstransit/getStopInfo',
      'maps/api/masstransit/getRouteInfo',
      'maps/api/masstransit/getLine',
      'maps/api/masstransit/getVehiclesInfo',
      'maps/api/masstransit/getVehiclesInfoWithRegion',
      'maps/api/masstransit/getLayerRegions'
    ]);

    return result;
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
module.exports = new YandexTransportService();
