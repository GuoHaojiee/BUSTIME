# 项目启动说明

## 当前状态

✅ 项目结构已创建
✅ 后端代码已完成
✅ 小程序代码已完成
🔄 正在安装后端依赖（npm install）
⚠️  Redis 未安装（已启用内存缓存降级）

## 下一步操作

### 1. 等待依赖安装完成

npm install 正在后台运行，主要在下载：
- Puppeteer
- Chromium（约 150MB）
- 其他 Node.js 依赖

**预计时间**: 3-5 分钟（取决于网络速度）

### 2. 启动后端服务

依赖安装完成后，运行：

```bash
cd /home/guohaojie/Guo/BUSTIME/backend
npm run dev
```

### 3. 测试 API

服务启动后，在浏览器访问：

```
http://localhost:3000/health
```

应该看到：
```json
{
  "status": "ok",
  "timestamp": "...",
  "uptime": ...,
  "environment": "development"
}
```

### 4. 配置小程序

1. 打开微信开发者工具
2. 选择"导入项目"
3. 选择目录：`/home/guohaojie/Guo/BUSTIME/miniprogram`
4. AppID 选择"测试号"
5. 点击"详情" → 勾选"不校验合法域名"
6. 编辑 `miniprogram/utils/api.js`：
   ```javascript
   const API_BASE = 'http://localhost:3000';
   ```
7. 点击"编译"运行

## 关于 Redis

当前配置已启用内存缓存降级，即使没有 Redis 也能正常运行：
- ✅ 可以正常启动服务
- ✅ 可以正常请求 API
- ✅ 缓存功能正常（使用内存代替）
- ⚠️  重启服务会清空缓存

如需安装 Redis（可选）：

```bash
# 方法 1：使用系统包管理器
sudo apt install redis-server
sudo systemctl start redis

# 方法 2：使用 Docker
docker run -d -p 6379:6379 --name bustime-redis redis:7-alpine
```

## 测试 Yandex Maps 数据获取

由于需要访问实际的 Yandex Maps 网站，第一次请求可能需要较长时间（10-15秒）。

建议测试流程：
1. 先访问 https://yandex.ru/maps/213/moscow/ 确认网站可访问
2. 搜索一个站点，从 URL 中获取 stopId
3. 使用该 stopId 测试 API

示例：
```bash
# 如果 stopId 是 stop__9639579
curl http://localhost:3000/api/stop/stop__9639579
```

## 常见问题

### Q: npm install 很慢？
A: Chromium 下载较大，可以：
- 使用国内镜像：`npm config set puppeteer_download_host=https://npmmirror.com/mirrors`
- 或者耐心等待

### Q: Puppeteer 启动失败？
A: 确保系统有足够依赖：
```bash
# Ubuntu/Debian
sudo apt install -y libx11-xcb1 libxcomposite1 libxdamage1 libxi6 libxtst6 libnss3 libcups2 libxss1 libxrandr2 libasound2 libpangocairo-1.0-0 libatk1.0-0 libatk-bridge2.0-0 libgtk-3-0

```

### Q: 小程序请求失败？
A: 检查：
1. 后端服务是否运行（访问 /health）
2. API 地址是否正确
3. 是否勾选"不校验合法域名"

## 查看日志

后端日志位置：
- 控制台输出（开发模式）
- `backend/logs/combined.log`
- `backend/logs/error.log`

## 下一步开发

1. **优化 Puppeteer 数据解析**
   - 使用真实站点测试
   - 根据实际 API 响应调整解析逻辑

2. **添加更多功能**
   - 站点地图显示
   - 路线规划
   - 到站提醒

3. **准备部署**
   - 购买服务器和域名
   - 配置 HTTPS
   - 小程序审核上线

---

如有问题，请查看：
- README.md - 完整文档
- QUICKSTART.md - 快速入门
- plan.md - 技术方案
