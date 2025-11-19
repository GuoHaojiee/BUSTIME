# BUSTIME 后端服务

莫斯科公交实时到站查询系统的后端 API 服务。

## 功能特性

- 🚌 实时公交到站信息查询
- 🔍 站点搜索功能
- 💾 Redis 缓存优化
- 🎯 请求频率限制
- 📝 完整的日志系统
- 🔒 安全防护（Helmet）

## 技术栈

- Node.js 18+
- Express 4.x
- Puppeteer（浏览器自动化）
- Redis（缓存）
- Winston（日志）

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，配置你的环境变量
```

### 3. 启动 Redis

```bash
# 使用 Docker
docker run -d -p 6379:6379 redis:7-alpine

# 或者系统安装
sudo systemctl start redis
```

### 4. 启动服务

开发模式：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

使用 PM2：
```bash
npm run pm2:start
```

## API 接口

### 搜索站点

```http
GET /api/search?q=红场
```

### 获取站点到站信息

```http
GET /api/stop/:stopId
```

### 健康检查

```http
GET /health
```

## 部署

### Docker 部署

```bash
docker-compose up -d
```

### 传统部署

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start ecosystem.config.js

# 保存配置
pm2 save

# 设置开机自启
pm2 startup
```

## 监控

```bash
# 查看日志
pm2 logs bustime-api

# 查看监控
pm2 monit
```

## 注意事项

1. 确保 Redis 服务正常运行
2. 首次运行会下载 Chromium，需要一定时间
3. 建议使用 Node.js 18+ 版本
4. 生产环境请配置 Nginx 反向代理
5. 请遵守 Yandex Maps 服务条款

## 许可证

MIT
