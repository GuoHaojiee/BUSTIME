const logger = require('../utils/logger');
const config = require('../config');

/**
 * 全局错误处理中间件
 */
function errorHandler(err, req, res, next) {
  // 记录错误
  logger.error('服务器错误:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  // 设置响应状态码
  const statusCode = err.statusCode || 500;

  // 构建错误响应
  const errorResponse = {
    success: false,
    message: err.message || '服务器内部错误',
    timestamp: new Date().toISOString()
  };

  // 开发环境下返回详细错误信息
  if (config.server.env === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.error = err;
  }

  res.status(statusCode).json(errorResponse);
}

/**
 * 404 处理中间件
 */
function notFoundHandler(req, res) {
  logger.warn(`404 Not Found: ${req.method} ${req.url}`);

  res.status(404).json({
    success: false,
    message: '请求的资源不存在',
    path: req.url
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
