const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * 本地站点数据库服务
 * 提供快速的站点搜索功能
 */
class LocalStopsDatabase {
  constructor() {
    this.stops = [];
    this.loadStops();
  }

  /**
   * 加载站点数据
   */
  loadStops() {
    try {
      const dataPath = path.join(__dirname, '../data/moscowStops.json');
      const data = fs.readFileSync(dataPath, 'utf-8');
      const json = JSON.parse(data);
      this.stops = json.stops || [];
      logger.info(`加载了 ${this.stops.length} 个站点数据`);
    } catch (error) {
      logger.error('加载站点数据失败:', error);
      this.stops = [];
    }
  }

  /**
   * 搜索站点
   * @param {string} keyword - 搜索关键词
   * @returns {Array} 匹配的站点列表
   */
  searchStops(keyword) {
    if (!keyword || keyword.length < 2) {
      return [];
    }

    const searchTerm = keyword.toLowerCase().trim();
    const results = [];

    for (const stop of this.stops) {
      // 检查是否匹配名称
      if (stop.name && stop.name.toLowerCase().includes(searchTerm)) {
        results.push(this.formatStop(stop));
        continue;
      }

      // 检查是否匹配英文名称
      if (stop.nameEn && stop.nameEn.toLowerCase().includes(searchTerm)) {
        results.push(this.formatStop(stop));
        continue;
      }

      // 检查是否匹配中文名称
      if (stop.nameCn && stop.nameCn.includes(searchTerm)) {
        results.push(this.formatStop(stop));
        continue;
      }

      // 检查是否匹配搜索关键词
      if (stop.searchKeywords && Array.isArray(stop.searchKeywords)) {
        for (const kw of stop.searchKeywords) {
          if (kw.toLowerCase().includes(searchTerm)) {
            results.push(this.formatStop(stop));
            break;
          }
        }
      }
    }

    return results;
  }

  /**
   * 格式化站点数据
   * @param {object} stop - 原始站点数据
   * @returns {object} 格式化后的站点数据
   */
  formatStop(stop) {
    return {
      id: stop.id,
      name: stop.name,
      nameEn: stop.nameEn,
      nameCn: stop.nameCn,
      address: stop.address,
      coordinates: stop.coordinates,
      href: `/api/stop/${stop.id}`
    };
  }

  /**
   * 获取所有站点
   * @returns {Array} 所有站点列表
   */
  getAllStops() {
    return this.stops.map(stop => this.formatStop(stop));
  }

  /**
   * 通过 ID 获取站点
   * @param {string} stopId - 站点 ID
   * @returns {object|null} 站点数据
   */
  getStopById(stopId) {
    const stop = this.stops.find(s => s.id === stopId);
    return stop ? this.formatStop(stop) : null;
  }
}

// 导出单例
module.exports = new LocalStopsDatabase();
