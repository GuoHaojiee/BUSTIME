const redis = require('redis');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * 缓存服务 - 使用 Redis 进行数据缓存，失败时降级到内存缓存
 */
class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.useMock = false;
    this.mockCache = new Map();
    this.initialize();
  }

  /**
   * 初始化 Redis 连接
   */
  async initialize() {
    try {
      this.client = redis.createClient({
        socket: {
          host: config.redis.host,
          port: config.redis.port,
          connectTimeout: 5000
        },
        password: config.redis.password,
        database: config.redis.db
      });

      // 错误处理
      this.client.on('error', (error) => {
        logger.error('Redis 错误:', error.message);
        this.isConnected = false;
      });

      // 连接成功
      this.client.on('connect', () => {
        logger.info('Redis 连接成功');
        this.isConnected = true;
        this.useMock = false;
      });

      // 断开连接
      this.client.on('end', () => {
        logger.warn('Redis 连接已断开');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      logger.warn(`Redis 初始化失败: ${error.message}`);
      logger.info('使用内存缓存作为降级方案');
      this.isConnected = false;
      this.useMock = true;
    }
  }

  /**
   * 获取缓存数据
   * @param {string} key - 缓存键
   * @returns {Promise<any>}
   */
  async get(key) {
    // 使用内存缓存
    if (this.useMock) {
      const item = this.mockCache.get(key);
      if (!item) return null;
      if (item.expireAt && Date.now() > item.expireAt) {
        this.mockCache.delete(key);
        return null;
      }
      return item.value;
    }

    // 使用 Redis
    if (!this.isConnected) {
      return null;
    }

    try {
      const data = await this.client.get(key);
      if (data) {
        logger.debug(`缓存命中: ${key}`);
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      logger.error('缓存获取失败:', error);
      return null;
    }
  }

  /**
   * 设置缓存数据
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值
   * @param {number} ttl - 过期时间（秒）
   * @returns {Promise<boolean>}
   */
  async set(key, value, ttl = 60) {
    // 使用内存缓存
    if (this.useMock) {
      const expireAt = Date.now() + ttl * 1000;
      this.mockCache.set(key, { value, expireAt });
      return true;
    }

    // 使用 Redis
    if (!this.isConnected) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      await this.client.setEx(key, ttl, serialized);
      logger.debug(`缓存设置成功: ${key}, TTL: ${ttl}s`);
      return true;
    } catch (error) {
      logger.error('缓存设置失败:', error);
      return false;
    }
  }

  /**
   * 删除缓存
   * @param {string} key - 缓存键
   * @returns {Promise<boolean>}
   */
  async delete(key) {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.client.del(key);
      logger.debug(`缓存删除: ${key}`);
      return true;
    } catch (error) {
      logger.error('缓存删除失败:', error);
      return false;
    }
  }

  /**
   * 批量删除缓存（按模式）
   * @param {string} pattern - 匹配模式
   * @returns {Promise<number>}
   */
  async deleteByPattern(pattern) {
    if (!this.isConnected) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }

      await this.client.del(keys);
      logger.info(`批量删除缓存: ${pattern}, 共 ${keys.length} 条`);
      return keys.length;
    } catch (error) {
      logger.error('批量删除缓存失败:', error);
      return 0;
    }
  }

  /**
   * 检查缓存是否存在
   * @param {string} key - 缓存键
   * @returns {Promise<boolean>}
   */
  async exists(key) {
    if (!this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('检查缓存失败:', error);
      return false;
    }
  }

  /**
   * 获取缓存剩余时间
   * @param {string} key - 缓存键
   * @returns {Promise<number>} 剩余秒数，-1表示永久，-2表示不存在
   */
  async ttl(key) {
    if (!this.isConnected) {
      return -2;
    }

    try {
      return await this.client.ttl(key);
    } catch (error) {
      logger.error('获取缓存TTL失败:', error);
      return -2;
    }
  }

  /**
   * 生成缓存键
   * @param {string} prefix - 前缀
   * @param {string} id - ID
   * @returns {string}
   */
  generateKey(prefix, id) {
    return `bustime:${prefix}:${id}`;
  }

  /**
   * 关闭 Redis 连接
   */
  async close() {
    if (this.client && this.isConnected) {
      logger.info('正在关闭 Redis 连接...');
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis 连接已关闭');
    }
  }
}

// 导出单例
module.exports = new CacheService();
