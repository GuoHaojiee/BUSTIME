const logger = require('../utils/logger');

/**
 * Mock 缓存服务 - 当 Redis 不可用时使用内存缓存
 */
class MockCacheService {
  constructor() {
    this.cache = new Map();
    this.isConnected = true;
    logger.info('使用内存缓存服务（Mock Redis）');
  }

  async initialize() {
    logger.info('Mock 缓存服务已初始化');
  }

  async get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // 检查是否过期
    if (item.expireAt && Date.now() > item.expireAt) {
      this.cache.delete(key);
      return null;
    }

    logger.debug(`缓存命中: ${key}`);
    return item.value;
  }

  async set(key, value, ttl = 60) {
    const expireAt = Date.now() + ttl * 1000;
    this.cache.set(key, { value, expireAt });
    logger.debug(`缓存设置: ${key}, TTL: ${ttl}s`);
    return true;
  }

  async delete(key) {
    this.cache.delete(key);
    logger.debug(`缓存删除: ${key}`);
    return true;
  }

  async deleteByPattern(pattern) {
    const regex = new RegExp(pattern.replace('*', '.*'));
    let count = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    logger.info(`批量删除缓存: ${pattern}, 共 ${count} 条`);
    return count;
  }

  async exists(key) {
    return this.cache.has(key);
  }

  async ttl(key) {
    const item = this.cache.get(key);
    if (!item) return -2;
    if (!item.expireAt) return -1;

    const remaining = Math.floor((item.expireAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  generateKey(prefix, id) {
    return `bustime:${prefix}:${id}`;
  }

  async close() {
    this.cache.clear();
    logger.info('Mock 缓存服务已关闭');
  }
}

module.exports = new MockCacheService();
