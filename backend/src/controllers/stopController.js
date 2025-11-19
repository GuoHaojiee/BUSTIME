const yandexTransportService = require('../services/yandexTransportService');
const yandexSearchService = require('../services/yandexSearchService');
const localStopsDatabase = require('../services/localStopsDatabase');
const puppeteerService = require('../services/puppeteerService');
const mockDataService = require('../services/mockDataService');
const cacheService = require('../services/cacheService');
const validator = require('../utils/validator');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * 站点控制器
 */
class StopController {
  /**
   * 获取站点实时到站信息
   */
  async getStopInfo(req, res) {
    try {
      const { stopId } = req.params;

      // 参数验证
      if (!stopId) {
        return res.status(400).json({
          success: false,
          message: '站点ID不能为空'
        });
      }

      const sanitizedStopId = validator.sanitizeStopId(stopId);

      if (!validator.isValidStopId(sanitizedStopId)) {
        return res.status(400).json({
          success: false,
          message: '无效的站点ID格式'
        });
      }

      logger.info(`查询站点: ${sanitizedStopId}`);

      // 检查缓存
      const cacheKey = cacheService.generateKey('stop', sanitizedStopId);
      const cached = await cacheService.get(cacheKey);

      if (cached) {
        logger.info(`缓存命中: ${sanitizedStopId}`);
        return res.json({
          success: true,
          data: cached,
          fromCache: true
        });
      }

      // 优先尝试从模拟数据获取
      let data = mockDataService.getStopArrivals(sanitizedStopId);

      // 如果模拟数据中没有，则使用 YandexTransportService 获取实时数据
      if (!data) {
        logger.info(`模拟数据中没有该站点，使用 YandexTransportService 获取实时数据: ${sanitizedStopId}`);
        try {
          data = await yandexTransportService.getStopInfo(sanitizedStopId);
        } catch (error) {
          logger.error('YandexTransportService 获取失败，尝试降级到 PuppeteerService:', error.message);
          // 降级方案：使用旧的 puppeteerService
          data = await puppeteerService.getStopArrivals(sanitizedStopId);
        }
      } else {
        logger.info(`返回模拟数据: ${sanitizedStopId}`);
      }

      // 缓存数据
      await cacheService.set(cacheKey, data, config.cache.stopArrivals);

      res.json({
        success: true,
        data,
        fromCache: false
      });
    } catch (error) {
      logger.error('获取站点信息失败:', error);
      res.status(500).json({
        success: false,
        message: '获取站点信息失败',
        error: config.server.env === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 搜索站点
   */
  async searchStops(req, res) {
    try {
      const { q } = req.query;

      // 参数验证
      const validation = validator.validateSearchKeyword(q);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.message
        });
      }

      const keyword = validation.keyword;
      logger.info(`搜索站点: ${keyword}`);

      // 检查缓存
      const cacheKey = cacheService.generateKey('search', keyword);
      const cached = await cacheService.get(cacheKey);

      if (cached) {
        logger.info(`搜索缓存命中: ${keyword}`);
        return res.json({
          success: true,
          data: cached,
          fromCache: true
        });
      }

      // 优先使用本地数据库搜索（最快，最可靠）
      logger.info(`优先使用本地数据库搜索: ${keyword}`);
      let stops = localStopsDatabase.searchStops(keyword);

      if (stops && stops.length > 0) {
        logger.info(`本地数据库找到 ${stops.length} 个结果`);
      } else {
        // 如果本地数据库没有结果，尝试使用 YandexSearchService
        logger.info(`本地数据库无结果，尝试 YandexSearchService: ${keyword}`);

        try {
          stops = await yandexSearchService.searchStops(keyword);
          logger.info(`YandexSearchService 找到 ${stops.length} 个结果`);
        } catch (error) {
          logger.error('YandexSearchService 搜索失败:', error.message);

          // 降级：返回模拟数据
          stops = mockDataService.searchStops(keyword);
          logger.info(`返回模拟数据: ${stops.length} 个结果`);
        }
      }

      // 缓存结果
      await cacheService.set(cacheKey, stops, config.cache.searchResults);

      res.json({
        success: true,
        data: stops,
        fromCache: false
      });
    } catch (error) {
      logger.error('搜索站点失败:', error);
      res.status(500).json({
        success: false,
        message: '搜索失败',
        error: config.server.env === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 清除缓存（管理接口）
   */
  async clearCache(req, res) {
    try {
      const { pattern } = req.query;

      if (pattern) {
        const count = await cacheService.deleteByPattern(`bustime:${pattern}:*`);
        logger.info(`清除缓存: ${pattern}, 共 ${count} 条`);
        res.json({
          success: true,
          message: `已清除 ${count} 条缓存`
        });
      } else {
        const count = await cacheService.deleteByPattern('bustime:*');
        logger.info(`清除所有缓存, 共 ${count} 条`);
        res.json({
          success: true,
          message: `已清除所有缓存，共 ${count} 条`
        });
      }
    } catch (error) {
      logger.error('清除缓存失败:', error);
      res.status(500).json({
        success: false,
        message: '清除缓存失败',
        error: config.server.env === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new StopController();
