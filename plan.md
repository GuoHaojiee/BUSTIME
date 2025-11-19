# 莫斯科公交实时到站查询微信小程序 - 项目规划文档

## 一、项目概述

### 1.1 项目背景
开发一款微信小程序，方便在莫斯科的
用户查询公交车站的实时到站信息，帮助用户更好地规划出行时间。

### 1.2 项目目标
- 提供准确的公交车实时到站信息
- 支持多站点搜索和管理
- 提供流畅的用户体验
- 支持站点收藏功能，方便常用站点快速访问

### 1.3 目标用户
- 在莫斯科生活的中文用户
- 经常乘坐公交出行的人群
- 需要实时查询公交到站信息的用户

---

## 二、需求分析

### 2.1 功能需求

#### 2.1.1 核心功能
1. **站点搜索**
   - 支持俄文站点名称搜索
   - 提供搜索历史记录
   - 支持模糊搜索和智能提示
   - 显示附近站点推荐

2. **实时到站信息展示**
   - 显示站点名称和位置
   - 列出经过该站的所有公交线路
   - 显示每条线路的下一班/几班车到站时间
   - 支持下拉刷新更新数据

3. **站点收藏管理**
   - 支持收藏常用站点
   - 快速访问收藏的站点
   - 收藏站点排序和编辑
   - 取消收藏功能

4. **数据刷新**
   - 手动下拉刷新
   - 页面进入时自动加载最新数据
   - 显示数据更新时间

### 2.2 非功能需求

#### 2.2.1 性能要求
- 页面加载时间 < 2秒
- 数据刷新响应时间 < 3秒
- 支持离线显示收藏列表

#### 2.2.2 可用性要求
- 界面简洁直观
- 操作流程不超过3步
- 使用中文界面，客户群体为中国人

#### 2.2.3 兼容性要求
- 支持微信小程序基础库 2.0+
- 适配主流手机屏幕尺寸

---

## 三、技术选型

### 3.1 前端技术栈

#### 3.1.1 微信小程序
- **框架**: 原生微信小程序框架
- **UI组件库**: WeUI / Vant Weapp（按需引入）
- **状态管理**: 微信小程序原生 Storage API
- **网络请求**: wx.request

**选型理由**:
- 原生开发性能最优
- 无额外学习成本
- 社区生态成熟

### 3.2 后端技术栈

#### 3.2.1 Node.js + Express
```javascript
// 技术栈
- Node.js 18+
- Express 4.x
- Puppeteer / Playwright（浏览器自动化）
- Axios（HTTP 请求）
- Redis（数据缓存）
- PM2（进程管理）
```

**选型理由**:
- JavaScript 全栈开发
- Puppeteer 可以有效模拟浏览器访问 Yandex Maps
- 成熟的生态系统和中间件
- 易于部署和维护

#### 3.2.2 数据获取方案

**方案：Puppeteer 拦截 API 请求**

```javascript
// 实施步骤
1. 使用 Puppeteer 启动无头浏览器
2. 访问 Yandex Maps 站点页面
3. 拦截网络请求，捕获实时数据 API
4. 解析 JSON 响应数据
5. 格式化并返回给小程序
```

**优点**:
- 可以获取完整的实时数据
- 可以处理动态渲染内容
- 可以绕过部分反爬虫机制

**缺点**:
- 资源占用较大
- 响应速度相对较慢
- 需要维护浏览器环境

**优化措施**:
- 使用无头模式减少资源占用
- 实现请求缓存机制
- 复用浏览器实例
- 设置合理的请求超时

### 3.3 数据存储

#### 3.3.1 Redis 缓存
```javascript
// 缓存策略
- 站点信息: TTL 24小时
- 实时到站数据: TTL 30秒
- 搜索结果: TTL 5分钟
```

**用途**:
- 减少对 Yandex Maps 的请求频率
- 提升响应速度
- 降低被封禁风险

#### 3.3.2 小程序本地存储
```javascript
// 存储内容
- 收藏站点列表
- 搜索历史
- 用户偏好设置
```

### 3.4 部署方案

**推荐配置**:
- 服务器: 1核2G 或 2核4G（根据访问量调整）
- 系统: Ubuntu 20.04 / 22.04
- 反向代理: Nginx
- 进程管理: PM2
- 监控: PM2 + 日志系统

**备选方案**:
- 云函数服务（腾讯云 SCF、阿里云 FC）
- Docker 容器化部署

---

## 四、系统架构设计

### 4.1 整体架构图

```
┌─────────────────────────────────────────────────────────┐
│                      微信小程序                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │首页/搜索 │  │ 站点详情 │  │ 我的收藏 │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       │             │              │                     │
│       └─────────────┼──────────────┘                     │
│                     │                                    │
│              wx.request (HTTPS)                          │
└─────────────────────┼───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                   后端服务 (Node.js)                     │
│                                                           │
│  ┌────────────────────────────────────────────────┐    │
│  │              Express 路由层                     │    │
│  │  /api/search    /api/stop/:id    /api/nearby   │    │
│  └───────────────────┬────────────────────────────┘    │
│                      │                                   │
│  ┌───────────────────▼────────────────────────────┐    │
│  │              业务逻辑层                          │    │
│  │  - 请求验证                                      │    │
│  │  - 缓存检查                                      │    │
│  │  - 数据格式化                                    │    │
│  └───────────────────┬────────────────────────────┘    │
│                      │                                   │
│  ┌───────────────────▼────────────────────────────┐    │
│  │         数据获取层 (Puppeteer Service)          │    │
│  │  - 浏览器实例管理                                │    │
│  │  - 页面导航和等待                                │    │
│  │  - 网络请求拦截                                  │    │
│  │  - 数据提取和解析                                │    │
│  └───────────────────┬────────────────────────────┘    │
│                      │                                   │
└──────────────────────┼───────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
    ┌────────┐   ┌─────────┐   ┌────────┐
    │ Redis  │   │ Yandex  │   │  日志  │
    │ 缓存   │   │  Maps   │   │  系统  │
    └────────┘   └─────────┘   └────────┘
```

### 4.2 数据流程

#### 4.2.1 查询站点到站信息
```
用户操作 → 小程序发起请求 → 后端检查缓存
                                   │
                          ┌────────┴────────┐
                          │                 │
                      缓存命中           缓存未命中
                          │                 │
                      返回数据    Puppeteer获取数据
                                         │
                                   解析并缓存数据
                                         │
                                     返回数据
                                         │
                          ┌──────────────┘
                          │
                    小程序渲染显示
```

#### 4.2.2 搜索站点
```
用户输入关键词 → 后端接收请求 → 调用 Yandex Maps 搜索 API
                                         │
                                   解析搜索结果
                                         │
                                   返回站点列表
                                         │
                                小程序显示结果
```

---

## 五、功能模块详细设计

### 5.1 小程序端

#### 5.1.1 页面结构

```
pages/
├── index/               # 首页（搜索 + 收藏列表）
│   ├── index.js
│   ├── index.json
│   ├── index.wxml
│   └── index.wxss
├── search/              # 搜索页面
│   ├── search.js
│   ├── search.json
│   ├── search.wxml
│   └── search.wxss
├── detail/              # 站点详情页
│   ├── detail.js
│   ├── detail.json
│   ├── detail.wxml
│   └── detail.wxss
└── favorites/           # 收藏管理页
    ├── favorites.js
    ├── favorites.json
    ├── favorites.wxml
    └── favorites.wxss
```

#### 5.1.2 组件设计

```
components/
├── stop-card/           # 站点卡片组件
│   ├── index.js
│   ├── index.json
│   ├── index.wxml
│   └── index.wxss
├── route-item/          # 线路信息组件
│   ├── index.js
│   ├── index.json
│   ├── index.wxml
│   └── index.wxss
└── search-bar/          # 搜索框组件
    ├── index.js
    ├── index.json
    ├── index.wxml
    └── index.wxss
```

#### 5.1.3 核心功能实现

**1. 搜索功能 (search.js)**
```javascript
// 搜索站点
searchStop(keyword) {
  wx.request({
    url: `${API_BASE}/api/search`,
    method: 'GET',
    data: { q: keyword },
    success: (res) => {
      this.setData({
        searchResults: res.data.stops
      });
    }
  });
}

// 防抖处理
debounceSearch: debounce(function(keyword) {
  this.searchStop(keyword);
}, 500)
```

**2. 站点详情 (detail.js)**
```javascript
// 获取站点到站信息
getStopInfo(stopId) {
  wx.showLoading({ title: '加载中...' });

  wx.request({
    url: `${API_BASE}/api/stop/${stopId}`,
    method: 'GET',
    success: (res) => {
      this.setData({
        stopInfo: res.data.stop,
        arrivals: res.data.arrivals,
        updateTime: res.data.updateTime
      });
    },
    complete: () => {
      wx.hideLoading();
      wx.stopPullDownRefresh();
    }
  });
}

// 下拉刷新
onPullDownRefresh() {
  this.getStopInfo(this.data.stopId);
}

// 收藏/取消收藏
toggleFavorite() {
  const favorites = wx.getStorageSync('favorites') || [];
  const index = favorites.findIndex(item => item.id === this.data.stopInfo.id);

  if (index > -1) {
    favorites.splice(index, 1);
    wx.showToast({ title: '已取消收藏', icon: 'none' });
  } else {
    favorites.unshift(this.data.stopInfo);
    wx.showToast({ title: '收藏成功', icon: 'success' });
  }

  wx.setStorageSync('favorites', favorites);
  this.setData({ isFavorite: index === -1 });
}
```

**3. 收藏管理 (favorites.js)**
```javascript
// 加载收藏列表
loadFavorites() {
  const favorites = wx.getStorageSync('favorites') || [];
  this.setData({ favorites });
}

// 删除收藏
deleteFavorite(stopId) {
  wx.showModal({
    title: '确认删除',
    content: '确定要取消收藏此站点吗？',
    success: (res) => {
      if (res.confirm) {
        const favorites = this.data.favorites.filter(item => item.id !== stopId);
        wx.setStorageSync('favorites', favorites);
        this.setData({ favorites });
      }
    }
  });
}
```

### 5.2 后端服务

#### 5.2.1 项目结构

```
backend/
├── src/
│   ├── app.js                    # 应用入口
│   ├── config/
│   │   ├── index.js              # 配置文件
│   │   └── redis.js              # Redis 配置
│   ├── controllers/
│   │   ├── searchController.js   # 搜索控制器
│   │   └── stopController.js     # 站点控制器
│   ├── services/
│   │   ├── yandexService.js      # Yandex Maps 服务
│   │   ├── cacheService.js       # 缓存服务
│   │   └── puppeteerService.js   # Puppeteer 服务
│   ├── utils/
│   │   ├── logger.js             # 日志工具
│   │   └── validator.js          # 参数验证
│   ├── middleware/
│   │   ├── errorHandler.js       # 错误处理
│   │   └── rateLimit.js          # 频率限制
│   └── routes/
│       └── api.js                # API 路由
├── package.json
├── .env                          # 环境变量
└── ecosystem.config.js           # PM2 配置
```

#### 5.2.2 核心服务实现

**1. Puppeteer 服务 (puppeteerService.js)**
```javascript
const puppeteer = require('puppeteer');

class PuppeteerService {
  constructor() {
    this.browser = null;
  }

  // 初始化浏览器
  async initialize() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  // 获取站点实时数据
  async getStopArrivals(stopId) {
    const browser = await this.initialize();
    const page = await browser.newPage();

    try {
      // 拦截网络请求
      const arrivals = await new Promise(async (resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout')), 15000);

        await page.setRequestInterception(true);

        page.on('response', async (response) => {
          const url = response.url();

          // 匹配实时数据接口
          if (url.includes('masstransit') && url.includes('forecasts')) {
            try {
              const data = await response.json();
              clearTimeout(timeout);
              resolve(this.parseArrivals(data));
            } catch (error) {
              console.error('解析响应失败:', error);
            }
          }
        });

        page.on('request', request => request.continue());

        // 访问站点页面
        await page.goto(
          `https://yandex.ru/maps/?masstransit[stopId]=${stopId}`,
          { waitUntil: 'networkidle2', timeout: 15000 }
        );
      });

      return arrivals;
    } finally {
      await page.close();
    }
  }

  // 搜索站点
  async searchStops(keyword) {
    const browser = await this.initialize();
    const page = await browser.newPage();

    try {
      await page.goto('https://yandex.ru/maps/213/moscow/', {
        waitUntil: 'networkidle2'
      });

      // 输入搜索关键词
      await page.type('.search-form__input', keyword);
      await page.keyboard.press('Enter');

      // 等待搜索结果
      await page.waitForSelector('.search-snippet-view', { timeout: 5000 });

      // 提取搜索结果
      const stops = await page.evaluate(() => {
        const results = [];
        const items = document.querySelectorAll('.search-snippet-view');

        items.forEach(item => {
          const name = item.querySelector('.search-snippet-view__title')?.textContent;
          const address = item.querySelector('.search-snippet-view__subtitle')?.textContent;
          const stopId = item.getAttribute('data-stop-id');

          if (name && stopId) {
            results.push({ id: stopId, name, address });
          }
        });

        return results;
      });

      return stops;
    } finally {
      await page.close();
    }
  }

  // 解析到站数据
  parseArrivals(data) {
    // 根据实际 API 响应格式解析
    const arrivals = [];

    if (data.forecasts) {
      data.forecasts.forEach(forecast => {
        const route = {
          routeNumber: forecast.route.number,
          routeName: forecast.route.name,
          routeType: forecast.route.type,
          arrivals: forecast.arrivals.map(arrival => ({
            time: arrival.time,
            minutes: Math.floor(arrival.time / 60),
            direction: arrival.direction
          }))
        };
        arrivals.push(route);
      });
    }

    return arrivals;
  }

  // 关闭浏览器
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = new PuppeteerService();
```

**2. 缓存服务 (cacheService.js)**
```javascript
const redis = require('redis');
const { promisify } = require('util');

class CacheService {
  constructor() {
    this.client = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379
    });

    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
  }

  // 获取缓存
  async get(key) {
    try {
      const data = await this.getAsync(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('缓存获取失败:', error);
      return null;
    }
  }

  // 设置缓存
  async set(key, value, ttl = 30) {
    try {
      await this.setAsync(key, JSON.stringify(value), 'EX', ttl);
      return true;
    } catch (error) {
      console.error('缓存设置失败:', error);
      return false;
    }
  }

  // 删除缓存
  async delete(key) {
    try {
      await this.delAsync(key);
      return true;
    } catch (error) {
      console.error('缓存删除失败:', error);
      return false;
    }
  }

  // 生成缓存键
  generateKey(prefix, id) {
    return `${prefix}:${id}`;
  }
}

module.exports = new CacheService();
```

**3. 站点控制器 (stopController.js)**
```javascript
const yandexService = require('../services/yandexService');
const cacheService = require('../services/cacheService');
const logger = require('../utils/logger');

class StopController {
  // 获取站点到站信息
  async getStopInfo(req, res) {
    try {
      const { stopId } = req.params;

      if (!stopId) {
        return res.status(400).json({
          success: false,
          message: '站点ID不能为空'
        });
      }

      // 检查缓存
      const cacheKey = cacheService.generateKey('stop', stopId);
      const cached = await cacheService.get(cacheKey);

      if (cached) {
        logger.info(`缓存命中: ${stopId}`);
        return res.json({
          success: true,
          data: cached,
          fromCache: true
        });
      }

      // 获取实时数据
      logger.info(`获取实时数据: ${stopId}`);
      const data = await yandexService.getStopArrivals(stopId);

      // 缓存数据 (30秒)
      await cacheService.set(cacheKey, data, 30);

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
        error: error.message
      });
    }
  }

  // 搜索站点
  async searchStops(req, res) {
    try {
      const { q } = req.query;

      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: '搜索关键词至少2个字符'
        });
      }

      // 检查缓存
      const cacheKey = cacheService.generateKey('search', q);
      const cached = await cacheService.get(cacheKey);

      if (cached) {
        return res.json({
          success: true,
          data: cached
        });
      }

      // 搜索站点
      const stops = await yandexService.searchStops(q);

      // 缓存结果 (5分钟)
      await cacheService.set(cacheKey, stops, 300);

      res.json({
        success: true,
        data: stops
      });
    } catch (error) {
      logger.error('搜索站点失败:', error);
      res.status(500).json({
        success: false,
        message: '搜索失败',
        error: error.message
      });
    }
  }
}

module.exports = new StopController();
```

**4. 应用入口 (app.js)**
```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const apiRoutes = require('./routes/api');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 频率限制
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟
  max: 30, // 最多30个请求
  message: '请求过于频繁，请稍后再试'
});
app.use('/api/', limiter);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API 路由
app.use('/api', apiRoutes);

// 错误处理
app.use(errorHandler);

// 启动服务
app.listen(PORT, () => {
  logger.info(`服务器运行在端口 ${PORT}`);
});

// 优雅关闭
process.on('SIGTERM', async () => {
  logger.info('收到 SIGTERM 信号，正在关闭服务器...');
  process.exit(0);
});

module.exports = app;
```

**5. API 路由 (routes/api.js)**
```javascript
const express = require('express');
const router = express.Router();
const stopController = require('../controllers/stopController');

// 搜索站点
router.get('/search', stopController.searchStops.bind(stopController));

// 获取站点信息
router.get('/stop/:stopId', stopController.getStopInfo.bind(stopController));

module.exports = router;
```

---

## 六、API 接口设计

### 6.1 接口列表

| 接口路径 | 方法 | 描述 | 缓存时间 |
|---------|------|------|---------|
| `/api/search` | GET | 搜索站点 | 5分钟 |
| `/api/stop/:stopId` | GET | 获取站点到站信息 | 30秒 |
| `/health` | GET | 健康检查 | - |

### 6.2 接口详情

#### 6.2.1 搜索站点

**请求**
```http
GET /api/search?q=keyword HTTP/1.1
Host: your-api.com
```

**请求参数**
| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| q | string | 是 | 搜索关键词，至少2个字符 |

**响应示例**
```json
{
  "success": true,
  "data": [
    {
      "id": "stop__9639579",
      "name": "Метро «Комсомольская»",
      "name_zh": "共青团地铁站",
      "address": "Комсомольская площадь",
      "coordinates": {
        "lat": 55.775226,
        "lon": 37.655317
      }
    },
    {
      "id": "stop__9639580",
      "name": "Красная площадь",
      "name_zh": "红场",
      "address": "Москва, Россия",
      "coordinates": {
        "lat": 55.753544,
        "lon": 37.621211
      }
    }
  ]
}
```

#### 6.2.2 获取站点到站信息

**请求**
```http
GET /api/stop/stop__9639579 HTTP/1.1
Host: your-api.com
```

**请求参数**
| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| stopId | string | 是 | 站点ID（路径参数） |

**响应示例**
```json
{
  "success": true,
  "data": {
    "stop": {
      "id": "stop__9639579",
      "name": "Метро «Комсомольская»",
      "name_zh": "共青团地铁站",
      "coordinates": {
        "lat": 55.775226,
        "lon": 37.655317
      }
    },
    "arrivals": [
      {
        "routeNumber": "40",
        "routeName": "Метро «Тимирязевская» — Метро «ВДНХ»",
        "routeType": "bus",
        "color": "#FF0000",
        "arrivals": [
          {
            "minutes": 2,
            "time": 120,
            "direction": "Метро «ВДНХ»",
            "vehicleId": "vehicle__12345"
          },
          {
            "minutes": 8,
            "time": 480,
            "direction": "Метро «ВДНХ»",
            "vehicleId": "vehicle__12346"
          }
        ]
      },
      {
        "routeNumber": "С4",
        "routeName": "Метро «Сокол» — Аэропорт Шереметьево",
        "routeType": "shuttle",
        "color": "#0000FF",
        "arrivals": [
          {
            "minutes": 5,
            "time": 300,
            "direction": "Аэропорт Шереметьево",
            "vehicleId": "vehicle__12347"
          }
        ]
      }
    ],
    "updateTime": "2025-11-18T10:30:00Z"
  },
  "fromCache": false
}
```

**错误响应**
```json
{
  "success": false,
  "message": "站点ID不能为空"
}
```

### 6.3 错误码

| 错误码 | 说明 |
|-------|------|
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |
| 503 | 服务暂时不可用 |

---

## 七、数据库/存储设计

### 7.1 Redis 缓存设计

#### 7.1.1 缓存键命名规范
```
stop:{stopId}           # 站点到站信息
search:{keyword}        # 搜索结果
stop_info:{stopId}      # 站点基本信息
```

#### 7.1.2 缓存策略
```javascript
// 缓存配置
const CACHE_CONFIG = {
  STOP_ARRIVALS: 30,      // 到站信息: 30秒
  SEARCH_RESULTS: 300,    // 搜索结果: 5分钟
  STOP_INFO: 86400        // 站点信息: 24小时
};
```

### 7.2 小程序本地存储

#### 7.2.1 存储结构
```javascript
// 收藏站点
favorites: [
  {
    id: 'stop__9639579',
    name: 'Метро «Комсомольская»',
    name_zh: '共青团地铁站',
    address: 'Комсомольская площадь',
    coordinates: { lat: 55.775226, lon: 37.655317 },
    addedAt: 1700000000000
  }
]

// 搜索历史
searchHistory: [
  {
    keyword: '红场',
    timestamp: 1700000000000
  }
]

// 用户设置
settings: {
  language: 'zh-CN',
  autoRefresh: false,
  theme: 'light'
}
```

---

## 八、界面设计

### 8.1 页面布局

#### 8.1.1 首页 (index)
```
┌─────────────────────────────────┐
│  [搜索框]                      │
│                                 │
│  我的收藏                       │
│  ┌───────────────────────────┐ │
│  │ 📍 共青团地铁站            │ │
│  │    Метро «Комсомольская»  │ │
│  │    [删除]                  │ │
│  └───────────────────────────┘ │
│  ┌───────────────────────────┐ │
│  │ 📍 红场                    │ │
│  │    Красная площадь        │ │
│  │    [删除]                  │ │
│  └───────────────────────────┘ │
│                                 │
│  [+ 搜索新站点]                │
└─────────────────────────────────┘
```

#### 8.1.2 搜索页面 (search)
```
┌─────────────────────────────────┐
│  [← 返回]  [搜索框]  [X清空]   │
│                                 │
│  搜索历史                       │
│  • 红场                         │
│  • 共青团地铁站                 │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  搜索结果                       │
│  ┌───────────────────────────┐ │
│  │ Метро «Комсомольская»     │ │
│  │ 共青团地铁站               │ │
│  │ Комсомольская площадь     │ │
│  └───────────────────────────┘ │
│  ┌───────────────────────────┐ │
│  │ Красная площадь           │ │
│  │ 红场                       │ │
│  │ Москва, Россия            │ │
│  └───────────────────────────┘ │
└─────────────────────────────────┘
```

#### 8.1.3 站点详情页 (detail)
```
┌─────────────────────────────────┐
│  [← 返回]                  [⭐] │
│                                 │
│  📍 共青团地铁站                │
│     Метро «Комсомольская»      │
│     Комсомольская площадь      │
│                                 │
│  🕒 更新时间: 10:30            │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  🚌 40路 → 全俄展览中心地铁站  │
│     ⏱ 2 分钟                   │
│     ⏱ 8 分钟                   │
│                                 │
│  🚐 С4 → 谢列梅捷沃机场        │
│     ⏱ 5 分钟                   │
│                                 │
│  🚎 12路 → 契卡洛夫斯基         │
│     ⏱ 12 分钟                  │
│                                 │
│  [下拉刷新更多]                │
└─────────────────────────────────┘
```

### 8.2 UI 设计规范

#### 8.2.1 颜色方案
```css
/* 主色调 */
--primary-color: #1989FA;      /* 主蓝色 */
--success-color: #07C160;      /* 成功绿色 */
--warning-color: #FF976A;      /* 警告橙色 */
--danger-color: #EE0A24;       /* 危险红色 */

/* 文字颜色 */
--text-primary: #323233;       /* 主文字 */
--text-secondary: #969799;     /* 次要文字 */
--text-placeholder: #C8C9CC;   /* 占位文字 */

/* 背景颜色 */
--bg-color: #F7F8FA;          /* 页面背景 */
--bg-white: #FFFFFF;          /* 卡片背景 */
--border-color: #EBEDF0;      /* 边框颜色 */
```

#### 8.2.2 字体规范
```css
/* 字号 */
--font-size-xs: 20rpx;   /* 辅助文字 */
--font-size-sm: 24rpx;   /* 次要文字 */
--font-size-md: 28rpx;   /* 主文字 */
--font-size-lg: 32rpx;   /* 标题文字 */
--font-size-xl: 36rpx;   /* 大标题 */
```

---

## 九、开发计划

### 9.1 开发阶段

#### 阶段一：环境搭建和技术验证（1-2天）
- [ ] 搭建后端 Node.js + Express 开发环境
- [ ] 配置 Puppeteer 并测试访问 Yandex Maps
- [ ] 逆向分析 Yandex Maps API，确认数据获取方案
- [ ] 配置 Redis 缓存服务
- [ ] 初始化微信小程序项目

#### 阶段二：后端核心功能开发（3-4天）
- [ ] 实现 Puppeteer 服务，成功拦截并解析实时数据
- [ ] 开发搜索站点接口
- [ ] 开发获取站点到站信息接口
- [ ] 实现缓存策略
- [ ] 实现错误处理和日志系统
- [ ] 实现请求频率限制
- [ ] 编写单元测试

#### 阶段三：小程序前端开发（4-5天）
- [ ] 设计并实现首页（收藏列表）
- [ ] 开发搜索页面和搜索功能
- [ ] 开发站点详情页
- [ ] 实现收藏功能（本地存储）
- [ ] 实现下拉刷新
- [ ] 优化界面交互和动画效果
- [ ] 适配不同屏幕尺寸

#### 阶段四：联调和优化（2-3天）
- [ ] 前后端接口联调
- [ ] 性能优化（加载速度、响应时间）
- [ ] 缓存策略优化
- [ ] 错误处理完善
- [ ] 用户体验优化

#### 阶段五：测试和部署（2-3天）
- [ ] 功能测试
- [ ] 兼容性测试
- [ ] 性能测试
- [ ] 服务器部署和配置
- [ ] 域名和 HTTPS 配置
- [ ] 监控和日志系统配置
- [ ] 小程序提审准备

### 9.2 开发优先级

**P0（核心功能，必须实现）**
- 搜索站点
- 查看站点到站信息
- 数据刷新

**P1（重要功能，第一版完成）**
- 站点收藏管理
- 搜索历史
- 错误处理

**P2（优化功能，后续迭代）**
- 附近站点推荐
- 多语言支持
- 夜间模式

**P3（扩展功能，长期规划）**
- 路线规划
- 站点地图显示
- 到站提醒

---

## 十、技术难点和解决方案

### 10.1 Yandex Maps 数据获取

**难点**：
- Yandex Maps 没有公开的实时公交 API
- 网页可能有反爬虫机制
- 接口格式可能随时变化

**解决方案**：
1. 使用 Puppeteer 模拟真实浏览器访问
2. 拦截网络请求获取 API 数据
3. 设置合理的 User-Agent 和请求头
4. 实现请求重试机制
5. 监控接口变化，及时调整解析逻辑
6. 实现降级方案（DOM 解析）

**代码示例**：
```javascript
// 请求重试机制
async function fetchWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

// 使用
const data = await fetchWithRetry(() =>
  puppeteerService.getStopArrivals(stopId)
);
```

### 10.2 性能优化

**难点**：
- Puppeteer 启动浏览器耗时较长
- 每次请求都加载完整页面资源浪费
- 高并发请求压力大

**解决方案**：
1. **浏览器实例复用**
```javascript
class BrowserPool {
  constructor(size = 3) {
    this.pool = [];
    this.size = size;
    this.initialize();
  }

  async initialize() {
    for (let i = 0; i < this.size; i++) {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox']
      });
      this.pool.push({ browser, inUse: false });
    }
  }

  async getBrowser() {
    const available = this.pool.find(item => !item.inUse);
    if (available) {
      available.inUse = true;
      return available;
    }
    // 等待可用实例
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.getBrowser();
  }

  releaseBrowser(item) {
    item.inUse = false;
  }
}
```

2. **多层缓存策略**
```javascript
// L1: 内存缓存（最快，容量小）
// L2: Redis 缓存（快，容量大）
// L3: 源数据获取（慢）

async function getData(key) {
  // L1 缓存
  if (memoryCache.has(key)) {
    return memoryCache.get(key);
  }

  // L2 缓存
  const redisData = await redis.get(key);
  if (redisData) {
    memoryCache.set(key, redisData);
    return redisData;
  }

  // L3 源数据
  const data = await fetchFromSource();
  await redis.set(key, data, 'EX', 30);
  memoryCache.set(key, data);
  return data;
}
```

3. **请求合并**
```javascript
// 短时间内相同请求合并为一次
class RequestMerger {
  constructor() {
    this.pending = new Map();
  }

  async merge(key, fn) {
    if (this.pending.has(key)) {
      return this.pending.get(key);
    }

    const promise = fn();
    this.pending.set(key, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      setTimeout(() => this.pending.delete(key), 100);
    }
  }
}
```

### 10.3 稳定性保障

**难点**：
- Puppeteer 可能崩溃或超时
- 网络请求可能失败
- Yandex Maps 可能封禁 IP

**解决方案**：
1. **健康检查和自动重启**
```javascript
// PM2 配置
module.exports = {
  apps: [{
    name: 'bustime-api',
    script: './src/app.js',
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '500M',
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

2. **优雅降级**
```javascript
async function getStopInfo(stopId) {
  try {
    // 尝试通过 API 获取
    return await getFromAPI(stopId);
  } catch (error) {
    logger.warn('API 获取失败，尝试 DOM 解析', error);
    try {
      // 降级方案：DOM 解析
      return await getFromDOM(stopId);
    } catch (error2) {
      logger.error('DOM 解析也失败', error2);
      // 返回缓存数据（即使过期）
      return await getFromCacheIgnoreExpiry(stopId);
    }
  }
}
```

3. **请求限流和熔断**
```javascript
const CircuitBreaker = require('opossum');

const breaker = new CircuitBreaker(puppeteerService.getStopArrivals, {
  timeout: 15000,        // 超时时间
  errorThresholdPercentage: 50,  // 错误率阈值
  resetTimeout: 30000    // 熔断恢复时间
});

breaker.fallback(() => {
  // 熔断后的降级逻辑
  return getCachedData();
});
```

### 10.4 小程序限制

**难点**：
- 小程序域名白名单限制
- 请求数量限制
- 本地存储容量限制

**解决方案**：
1. **域名配置**
   - 在小程序管理后台配置服务器域名
   - 确保使用 HTTPS

2. **请求优化**
   - 合并相似请求
   - 减少不必要的请求
   - 使用本地缓存

3. **存储优化**
```javascript
// 限制收藏数量
const MAX_FAVORITES = 20;

function addFavorite(stop) {
  const favorites = wx.getStorageSync('favorites') || [];

  if (favorites.length >= MAX_FAVORITES) {
    wx.showToast({
      title: '最多收藏20个站点',
      icon: 'none'
    });
    return false;
  }

  favorites.unshift(stop);
  wx.setStorageSync('favorites', favorites);
  return true;
}
```

---

## 十一、风险控制

### 11.1 技术风险

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|---------|
| Yandex Maps 接口变更 | 高 | 中 | 实现监控告警；准备多个数据源；快速响应机制 |
| IP 被封禁 | 高 | 中 | 使用代理池；控制请求频率；实现缓存 |
| Puppeteer 性能问题 | 中 | 高 | 浏览器实例池；资源限制；定期重启 |
| 服务器资源不足 | 中 | 低 | 监控资源使用；弹性扩容；优化代码 |

### 11.2 业务风险

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|---------|
| 数据不准确 | 高 | 低 | 对比多个数据源；用户反馈机制 |
| 服务不稳定 | 高 | 中 | 降级方案；多实例部署；监控告警 |
| 用户隐私问题 | 高 | 低 | 不收集敏感信息；遵守隐私政策 |
| 法律合规问题 | 高 | 中 | 咨询法务；添加免责声明 |

### 11.3 运维风险

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|---------|
| 服务器宕机 | 高 | 低 | 多服务器部署；自动重启；监控告警 |
| 数据丢失 | 中 | 低 | 定期备份；使用云存储 |
| 依赖服务故障 | 中 | 中 | 降级方案；多数据源；缓存策略 |

---

## 十二、监控和运维

### 12.1 监控指标

**系统指标**：
- CPU 使用率
- 内存使用率
- 磁盘使用率
- 网络流量

**应用指标**：
- API 响应时间
- 请求成功率
- 缓存命中率
- 错误率

**业务指标**：
- 活跃用户数
- 站点查询次数
- 收藏站点数量
- 用户留存率

### 12.2 日志系统

```javascript
// 使用 Winston 日志框架
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

// 记录关键操作
logger.info('用户查询站点', {
  stopId: 'stop__123',
  userId: 'user_456',
  timestamp: new Date().toISOString()
});
```

### 12.3 告警机制

**告警规则**：
- API 错误率 > 10%
- 响应时间 > 5秒
- CPU 使用率 > 80%
- 内存使用率 > 90%
- Puppeteer 崩溃

**告警方式**：
- 邮件通知
- 短信通知（重要告警）
- 钉钉/企业微信群通知

---

## 十三、部署方案

### 13.1 服务器配置

**最低配置**：
- CPU: 1核
- 内存: 2GB
- 硬盘: 20GB
- 带宽: 1Mbps

**推荐配置**：
- CPU: 2核
- 内存: 4GB
- 硬盘: 40GB SSD
- 带宽: 3Mbps

### 13.2 部署步骤

#### 1. 环境准备
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 Redis
sudo apt install -y redis-server
sudo systemctl enable redis-server

# 安装 Nginx
sudo apt install -y nginx
sudo systemctl enable nginx

# 安装 PM2
sudo npm install -g pm2
```

#### 2. 部署应用
```bash
# 克隆代码
git clone <your-repo-url>
cd bustime/backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
vim .env

# 启动应用
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 3. 配置 Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

#### 4. 配置 HTTPS（Let's Encrypt）
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 13.3 Docker 部署（可选）

**Dockerfile**
```dockerfile
FROM node:18-alpine

# 安装 Chromium 依赖
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "src/app.js"]
```

**docker-compose.yml**
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - REDIS_HOST=redis
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    restart: unless-stopped

volumes:
  redis-data:
```

---

## 十四、成本估算

### 14.1 开发成本

| 项目 | 工时 | 说明 |
|------|------|------|
| 环境搭建和技术验证 | 1-2天 | 后端环境、Puppeteer 测试 |
| 后端开发 | 3-4天 | API 开发、缓存、错误处理 |
| 小程序前端开发 | 4-5天 | UI 开发、功能实现 |
| 联调和优化 | 2-3天 | 前后端联调、性能优化 |
| 测试和部署 | 2-3天 | 测试、部署、配置 |
| **总计** | **12-17天** | 单人开发 |

### 14.2 运维成本（按月）

| 项目 | 费用 | 说明 |
|------|------|------|
| 服务器 | ¥50-150 | 1核2G - 2核4G |
| 域名 | ¥10 | .com 域名（按年分摊） |
| SSL 证书 | ¥0 | Let's Encrypt 免费 |
| CDN（可选） | ¥0-50 | 根据流量 |
| **月成本** | **¥60-210** | 最低配置 - 推荐配置 |

### 14.3 小程序认证费用

| 项目 | 费用 | 说明 |
|------|------|------|
| 个人账号 | ¥0 | 功能有限 |
| 企业账号 | ¥300/年 | 推荐，功能完整 |

---

## 十五、后续优化方向

### 15.1 功能扩展
- [ ] 地图显示站点位置
- [ ] 路线规划功能
- [ ] 车辆实时位置追踪
- [ ] 到站提醒推送
- [ ] 多城市支持
- [ ] 用户反馈功能

### 15.2 技术优化
- [ ] 使用 TypeScript 重构
- [ ] 实现 GraphQL API
- [ ] 服务端渲染优化
- [ ] 离线数据支持
- [ ] 国际化多语言
- [ ] 无障碍访问支持

### 15.3 数据优化
- [ ] 机器学习预测到站时间
- [ ] 历史数据分析
- [ ] 站点热度分析
- [ ] 智能推荐常用路线

---

## 十六、附录

### 16.1 参考资料

- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [Puppeteer 官方文档](https://pptr.dev/)
- [Express.js 官方文档](https://expressjs.com/)
- [Redis 官方文档](https://redis.io/documentation)
- [PM2 官方文档](https://pm2.keymetrics.io/)

### 16.2 相关工具

- 微信开发者工具
- Postman（API 测试）
- Chrome DevTools（网络分析）
- PM2（进程管理）
- Nginx（反向代理）

### 16.3 联系方式

如有问题或建议，请通过以下方式联系：
- 项目仓库: [GitHub]
- 邮箱: [your-email]

---

## 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0 | 2025-11-18 | 初始版本 |

---

**注意事项**：

1. 本项目涉及模拟访问 Yandex Maps 网站，请确保遵守相关服务条款和法律法规
2. 建议实现合理的请求频率限制，避免对 Yandex 服务器造成压力
3. 数据仅供参考，实际出行请以官方信息为准
4. 部署前请确保服务器安全配置和数据备份
5. 定期更新依赖包，修复安全漏洞

**免责声明**：

本项目提供的公交到站信息来自第三方数据源，准确性和时效性无法完全保证。本项目仅供学习和参考使用，开发者不对因使用本项目导致的任何损失承担责任。使用本项目即表示您已阅读并同意此免责声明。
