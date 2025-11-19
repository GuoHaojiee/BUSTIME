# 莫斯科公交实时到站查询系统 (BUSTIME)

一个基于微信小程序的莫斯科公交实时到站信息查询系统，帮助用户快速查询公交车到站时间。

## 项目简介

本项目包含两个主要部分：
- **小程序前端** (miniprogram/): 提供用户界面和交互
- **后端 API 服务** (backend/): 通过 Puppeteer 获取 Yandex Maps 实时数据

## 功能特性

- ✅ 站点搜索（支持俄文/中文/英文）
- ✅ 实时公交到站信息查询
- ✅ 站点收藏管理
- ✅ 搜索历史记录
- ✅ 下拉刷新数据
- ✅ Redis 缓存优化
- ✅ 请求频率限制
- ✅ 完整的错误处理

## 技术栈

### 前端（小程序）
- 微信小程序原生框架
- WXML + WXSS + JavaScript
- 本地存储（收藏、历史）

### 后端
- Node.js 18+
- Express 4.x
- Puppeteer（浏览器自动化）
- Redis（缓存）
- Winston（日志）

## 快速开始

### 环境要求

- Node.js 18+
- Redis 7+
- 微信开发者工具
- Git

### 后端部署

#### 方法一：传统部署

```bash
# 1. 进入后端目录
cd backend

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置你的环境变量

# 4. 启动 Redis
# 使用 Docker
docker run -d -p 6379:6379 redis:7-alpine
# 或者系统服务
sudo systemctl start redis

# 5. 开发模式启动
npm run dev

# 6. 生产模式（使用 PM2）
npm install -g pm2
npm run pm2:start
```

#### 方法二：Docker 部署

```bash
# 进入后端目录
cd backend

# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f api

# 停止服务
docker-compose down
```

### 小程序配置

```bash
# 1. 使用微信开发者工具打开 miniprogram 目录

# 2. 修改 API 地址
# 编辑 miniprogram/utils/api.js
# 将 API_BASE 改为你的后端服务地址

# 3. 配置服务器域名
# 在微信小程序管理后台配置：
# - request 合法域名：https://your-api-domain.com
```

## 项目结构

```
BUSTIME/
├── backend/                  # 后端服务
│   ├── src/
│   │   ├── app.js           # 应用入口
│   │   ├── config/          # 配置文件
│   │   ├── controllers/     # 控制器
│   │   ├── services/        # 服务层
│   │   │   ├── puppeteerService.js  # Puppeteer 服务
│   │   │   └── cacheService.js      # 缓存服务
│   │   ├── middleware/      # 中间件
│   │   ├── routes/          # 路由
│   │   └── utils/           # 工具函数
│   ├── logs/                # 日志目录
│   ├── package.json
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── miniprogram/             # 小程序前端
│   ├── pages/               # 页面
│   │   ├── index/          # 首页
│   │   ├── search/         # 搜索页
│   │   ├── detail/         # 站点详情页
│   │   └── favorites/      # 收藏页
│   ├── utils/              # 工具函数
│   │   ├── api.js          # API 请求
│   │   └── util.js         # 通用工具
│   ├── app.js              # 应用入口
│   ├── app.json            # 应用配置
│   └── app.wxss            # 全局样式
│
├── plan.md                  # 项目规划文档
└── README.md               # 项目说明
```

## API 接口

### 搜索站点
```http
GET /api/search?q=关键词
```

响应示例：
```json
{
  "success": true,
  "data": [
    {
      "id": "stop__9639579",
      "name": "Метро «Комсомольская»",
      "address": "Комсомольская площадь"
    }
  ]
}
```

### 获取站点到站信息
```http
GET /api/stop/:stopId
```

响应示例：
```json
{
  "success": true,
  "data": {
    "stop": {
      "id": "stop__9639579",
      "name": "Метро «Комсомольская»"
    },
    "arrivals": [
      {
        "routeNumber": "40",
        "routeName": "Метро «Тимирязевская» — Метро «ВДНХ»",
        "routeType": "bus",
        "arrivals": [
          {
            "minutes": 2,
            "time": 120,
            "direction": "Метро «ВДНХ»"
          }
        ]
      }
    ],
    "updateTime": "2025-11-18T10:30:00Z"
  }
}
```

## 配置说明

### 环境变量

后端主要配置项（.env）：

```env
# 服务器
NODE_ENV=production
PORT=3000

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# 缓存时间（秒）
CACHE_STOP_ARRIVALS=30
CACHE_SEARCH_RESULTS=300

# Puppeteer
PUPPETEER_HEADLESS=true
PUPPETEER_TIMEOUT=15000

# 日志
LOG_LEVEL=info

# 请求限制
RATE_LIMIT_MAX_REQUESTS=30
```

### 小程序配置

在 `miniprogram/utils/api.js` 中修改 API 地址：

```javascript
const API_BASE = 'https://your-api-domain.com';
```

## 监控和维护

### 查看日志

```bash
# PM2 日志
pm2 logs bustime-api

# Docker 日志
docker-compose logs -f api

# 文件日志
tail -f backend/logs/combined.log
tail -f backend/logs/error.log
```

### 重启服务

```bash
# PM2
pm2 restart bustime-api

# Docker
docker-compose restart api
```

### 清除缓存

```bash
# 使用 API
curl -X DELETE http://localhost:3000/api/cache

# 直接操作 Redis
redis-cli FLUSHDB
```

## 性能优化

### 缓存策略
- 站点到站信息：30 秒
- 搜索结果：5 分钟
- 站点基本信息：24 小时

### 请求限制
- 默认：1 分钟 30 次请求
- 可在配置中调整

## 故障排查

### 常见问题

**Q: Puppeteer 启动失败？**
- 确保安装了 Chromium 依赖
- Docker 环境已包含所有依赖

**Q: Redis 连接失败？**
- 检查 Redis 服务是否运行
- 验证 REDIS_HOST 和 REDIS_PORT 配置

**Q: 小程序请求失败？**
- 确认服务器域名已在小程序后台配置
- 检查 API 地址是否正确
- 确保使用 HTTPS

**Q: 数据获取缓慢？**
- 检查 Puppeteer 浏览器实例
- 优化缓存时间
- 考虑使用多实例部署

## 注意事项

⚠️ **重要提示**：

1. 本项目涉及模拟访问 Yandex Maps，请遵守相关服务条款
2. 建议实现合理的请求频率限制
3. 数据仅供参考，实际出行请以官方信息为准
4. 部署前请确保服务器安全配置
5. 定期更新依赖包，修复安全漏洞

## 开发计划

查看 [plan.md](./plan.md) 了解详细的项目规划和技术方案。

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交 Issue。

---

**免责声明**：本项目提供的公交到站信息来自第三方数据源，准确性和时效性无法完全保证。本项目仅供学习和参考使用，开发者不对因使用本项目导致的任何损失承担责任。
