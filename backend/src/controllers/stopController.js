const yandexTransportService = require('../services/yandexTransportService');
const yandexSearchService = require('../services/yandexSearchService');
const localStopsDatabase = require('../services/localStopsDatabase');
const puppeteerService = require('../services/puppeteerService');
const mockDataService = require('../services/mockDataService');
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

      res.json({
        success: true,
        data
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
   * 获取常用站点
   */
  async getFrequentStops(req, res) {
    try {
      const frequentStops = require('../data/frequentStops.json');
      logger.info('获取常用站点列表');

      res.json({
        success: true,
        data: frequentStops.stops
      });
    } catch (error) {
      logger.error('获取常用站点失败:', error);
      res.status(500).json({
        success: false,
        message: '获取常用站点失败',
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

      res.json({
        success: true,
        data: stops
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
}

module.exports = new StopController();
