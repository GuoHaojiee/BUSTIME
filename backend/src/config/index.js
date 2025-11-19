require('dotenv').config();

module.exports = {
  // 服务器配置
  server: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3000,
    cors: {
      origin: process.env.CORS_ORIGIN || '*'
    }
  },

  // Puppeteer 配置
  puppeteer: {
    headless: process.env.PUPPETEER_HEADLESS !== 'false',
    timeout: parseInt(process.env.PUPPETEER_TIMEOUT, 10) || 15000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-extensions'
    ]
  },

  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    errorFile: process.env.LOG_FILE_ERROR || 'logs/error.log',
    combinedFile: process.env.LOG_FILE_COMBINED || 'logs/combined.log'
  },

  // 请求限制
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 30
  }
};
