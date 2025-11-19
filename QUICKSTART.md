# 快速启动指南

本文档帮助你快速启动 BUSTIME 项目进行开发和测试。

## 前置要求

确保你的开发环境已安装：

- ✅ Node.js 18+
- ✅ Redis 7+
- ✅ 微信开发者工具
- ✅ Git

## 步骤 1：启动后端服务

### 选项 A：本地开发（推荐新手）

```bash
# 1. 进入后端目录
cd backend

# 2. 安装依赖
npm install

# 3. 创建环境配置文件
cp .env.example .env

# 4. 启动 Redis（选择其中一种方式）

# 方式 1: 使用 Docker
docker run -d -p 6379:6379 --name bustime-redis redis:7-alpine

# 方式 2: 使用系统服务（如果已安装 Redis）
sudo systemctl start redis

# 方式 3: 直接运行（macOS/Linux）
redis-server

# 5. 启动开发服务器
npm run dev
```

服务启动后，你应该看到：
```
🚀 服务器运行在端口 3000
📝 环境: development
```

### 选项 B：Docker 一键启动（推荐生产）

```bash
# 进入后端目录
cd backend

# 一键启动所有服务（API + Redis + Nginx）
docker-compose up -d

# 查看运行状态
docker-compose ps

# 查看日志
docker-compose logs -f api
```

## 步骤 2：测试后端 API

打开浏览器或使用 curl 测试：

```bash
# 健康检查
curl http://localhost:3000/health

# 搜索站点（替换为实际的俄文站点名称）
curl "http://localhost:3000/api/search?q=метро"

# 如果看到 JSON 响应，说明后端运行正常！
```

## 步骤 3：配置小程序

```bash
# 1. 打开微信开发者工具

# 2. 导入项目
# - 选择 miniprogram 目录
# - 填写项目名称
# - AppID 选择"测试号"（开发阶段）

# 3. 修改 API 地址
# 编辑文件：miniprogram/utils/api.js
# 修改第 7 行：
const API_BASE = 'http://localhost:3000';  // 开发环境使用本地地址

# 4. 在微信开发者工具中点击"编译"
```

### 重要：本地开发配置

在微信开发者工具中，需要：

1. 点击右上角"详情"
2. 勾选"不校验合法域名"（仅开发阶段）
3. 勾选"不校验 TLS 版本"

## 步骤 4：测试小程序功能

### 4.1 测试搜索功能

1. 点击首页的搜索框
2. 输入站点名称（俄文），例如：`Красная площадь`（红场）
3. 查看搜索结果

### 4.2 测试站点详情

1. 点击搜索结果中的任意站点
2. 应该显示该站点的实时到站信息
3. 测试下拉刷新功能

### 4.3 测试收藏功能

1. 在站点详情页点击右上角的星星图标
2. 返回首页，应该能看到收藏的站点
3. 测试删除收藏

## 常见问题

### Q1: npm install 失败？

```bash
# 清除缓存重试
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Q2: Redis 连接失败？

检查 Redis 是否运行：
```bash
# 测试 Redis 连接
redis-cli ping
# 应该返回 PONG

# 如果失败，重启 Redis
# Docker:
docker restart bustime-redis

# 系统服务:
sudo systemctl restart redis
```

### Q3: Puppeteer 下载 Chromium 很慢？

```bash
# 使用国内镜像
npm config set puppeteer_download_host=https://npm.taobao.org/mirrors
npm install puppeteer
```

### Q4: 小程序请求失败？

1. 检查后端服务是否运行（访问 http://localhost:3000/health）
2. 确认小程序中的 API 地址正确
3. 确认已勾选"不校验合法域名"

### Q5: 没有实时数据返回？

这是正常的！因为：
- Puppeteer 需要实际访问 Yandex Maps 网站
- 第一次访问可能需要较长时间（10-15秒）
- 需要真实的莫斯科站点 ID

**调试建议**：

1. 先测试 Yandex Maps 网站是否可访问：https://yandex.ru/maps/
2. 查看后端日志了解详细错误信息
3. 尝试访问一个真实的站点 URL

## 开发技巧

### 实时查看日志

```bash
# 后端日志
cd backend

# PM2 方式
pm2 logs bustime-api

# 开发模式会直接在控制台输出日志

# 或查看文件日志
tail -f logs/combined.log
tail -f logs/error.log
```

### 清除缓存

开发过程中可能需要清除缓存：

```bash
# 方法 1: 使用 API
curl -X DELETE http://localhost:3000/api/cache

# 方法 2: 直接清除 Redis
redis-cli FLUSHDB
```

### 热重载

后端使用 nodemon，代码修改会自动重启服务。

小程序需要在微信开发者工具中手动点击"编译"。

## 下一步

✅ 项目运行成功后，你可以：

1. 阅读 [plan.md](./plan.md) 了解详细技术方案
2. 阅读 [README.md](./README.md) 了解完整功能
3. 修改代码实现自定义功能
4. 准备部署到生产环境

## 获取真实站点数据

如果你想测试真实的莫斯科公交数据：

1. 访问 Yandex Maps: https://yandex.ru/maps/213/moscow/
2. 搜索一个公交站点（例如：Красная площадь）
3. 在 URL 中找到 stopId（格式：`stopId=stop__数字`）
4. 使用该 stopId 测试 API

示例：
```bash
curl http://localhost:3000/api/stop/stop__9639579
```

## 需要帮助？

- 查看详细日志排查问题
- 检查 .env 配置是否正确
- 确保所有依赖服务正常运行

---

祝开发顺利！🚀
