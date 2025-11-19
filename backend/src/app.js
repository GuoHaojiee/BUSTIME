const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const apiRoutes = require('./routes/api');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const config = require('./config');

const app = express();
const PORT = config.server.port;

// 安全中间件
app.use(helmet());

// CORS 配置
app.use(cors({
  origin: config.server.cors.origin,
  credentials: true
}));

// 解析请求体
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// 请求频率限制
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// 首页 - API 文档
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BUSTIME API - 莫斯科公交实时查询</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 900px;
            margin: 40px auto;
            padding: 20px;
            background: #f5f5f5;
            color: #333;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 32px;
        }
        .header p {
            margin: 0;
            opacity: 0.9;
        }
        .status {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .status-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        .status-item:last-child {
            border-bottom: none;
        }
        .badge {
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
        }
        .badge-success {
            background: #10b981;
            color: white;
        }
        .badge-warning {
            background: #f59e0b;
            color: white;
        }
        .endpoint {
            background: white;
            padding: 20px;
            margin-bottom: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .endpoint h3 {
            margin: 0 0 10px 0;
            color: #667eea;
        }
        .endpoint code {
            background: #f3f4f6;
            padding: 8px 12px;
            border-radius: 4px;
            display: block;
            margin: 10px 0;
            font-family: 'Courier New', monospace;
            overflow-x: auto;
        }
        .method {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            margin-right: 10px;
        }
        .method-get {
            background: #10b981;
            color: white;
        }
        .method-delete {
            background: #ef4444;
            color: white;
        }
        a {
            color: #667eea;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚌 BUSTIME API</h1>
        <p>莫斯科公交实时到站查询系统 - 后端服务</p>
    </div>

    <div class="status">
        <h2 style="margin-top: 0;">服务状态</h2>
        <div class="status-item">
            <span>状态</span>
            <span class="badge badge-success">运行中</span>
        </div>
        <div class="status-item">
            <span>环境</span>
            <span>${config.server.env}</span>
        </div>
        <div class="status-item">
            <span>缓存</span>
            <span class="badge badge-warning">内存缓存 (Redis未连接)</span>
        </div>
        <div class="status-item">
            <span>Yandex集成</span>
            <span class="badge badge-success">已修复 ✅</span>
        </div>
    </div>

    <h2>📡 API 端点</h2>

    <div class="endpoint">
        <h3><span class="method method-get">GET</span> 健康检查</h3>
        <code>GET /health</code>
        <p>检查服务器运行状态</p>
        <a href="/health" target="_blank">→ 访问接口</a>
    </div>

    <div class="endpoint">
        <h3><span class="method method-get">GET</span> 搜索站点</h3>
        <code>GET /api/search?q=关键词</code>
        <p>根据关键词搜索公交站点（支持俄文、中文、英文）</p>
        <strong>示例：</strong>
        <a href="/api/search?q=metro" target="_blank">→ /api/search?q=metro</a>
    </div>

    <div class="endpoint">
        <h3><span class="method method-get">GET</span> 获取站点信息</h3>
        <code>GET /api/stop/:stopId</code>
        <p>获取指定站点的实时公交到站信息</p>
        <strong>示例（模拟数据）：</strong>
        <a href="/api/stop/stop__9639579" target="_blank">→ /api/stop/stop__9639579</a>
        <br><br>
        <strong>示例（真实Yandex数据，需等待30秒）：</strong>
        <a href="/api/stop/stop__9644561" target="_blank">→ /api/stop/stop__9644561</a>
    </div>

    <div class="endpoint">
        <h3><span class="method method-delete">DELETE</span> 清除缓存</h3>
        <code>DELETE /api/cache?pattern=search</code>
        <p>清除缓存数据（管理接口）</p>
    </div>

    <div class="footer">
        <p>💡 <strong>提示：</strong> 查看演示页面请访问项目根目录的 <a href="file:///home/guohaojie/Guo/BUSTIME/demo.html">demo.html</a></p>
        <p>📚 完整文档请查看 <a href="https://github.com/yourusername/BUSTIME">GitHub</a></p>
        <p style="margin-top: 20px;">BUSTIME © 2025 | Powered by Yandex Maps</p>
    </div>
</body>
</html>
  `);
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.server.env
  });
});

// API 路由
app.use('/api', apiRoutes);

// 404 处理
app.use(notFoundHandler);

// 错误处理
app.use(errorHandler);

// 启动服务器
const server = app.listen(PORT, () => {
  logger.info(`==============================================`);
  logger.info(`🚀 服务器运行在端口 ${PORT}`);
  logger.info(`📝 环境: ${config.server.env}`);
  logger.info(`🕒 启动时间: ${new Date().toISOString()}`);
  logger.info(`==============================================`);
});

// 优雅关闭
const gracefulShutdown = async () => {
  logger.info('收到关闭信号，正在优雅关闭服务器...');

  server.close(async () => {
    logger.info('HTTP 服务器已关闭');

    try {
      // 关闭 Puppeteer
      const puppeteerService = require('./services/puppeteerService');
      await puppeteerService.close();

      // 关闭 Redis
      const cacheService = require('./services/cacheService');
      await cacheService.close();

      logger.info('所有服务已关闭');
      process.exit(0);
    } catch (error) {
      logger.error('关闭服务时出错:', error);
      process.exit(1);
    }
  });

  // 强制关闭超时
  setTimeout(() => {
    logger.error('强制关闭服务器');
    process.exit(1);
  }, 10000);
};

// 监听关闭信号
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// 未捕获的异常处理
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的 Promise 拒绝:', reason);
});

module.exports = app;
