# 演示页面使用指南

## 🎉 恭喜！项目已成功启动

演示页面已在浏览器中打开，你现在可以看到项目的前端界面了！

### ✅ 当前运行状态

- **后端服务**: ✅ 运行中 (http://localhost:3000)
- **演示页面**: ✅ 已打开 (file:///home/guohaojie/Guo/BUSTIME/demo.html)
- **缓存服务**: ⚠️ 使用内存缓存（Redis 未安装）

### 📱 演示页面功能

演示页面是一个模拟微信小程序界面的网页，包含以下功能：

#### 1. 首页
- 显示收藏的站点列表
- 点击搜索框可以进入搜索页面
- 底部有标签栏切换

#### 2. 搜索功能
- 输入俄文站点名称进行搜索
- 实时搜索（输入2个字符后自动搜索）
- 点击搜索结果查看详情

#### 3. 站点详情
- 显示实时到站信息
- 显示公交线路和到站时间
- 数据来自后端 API

### 🧪 如何测试

#### 测试 1：查看界面
✅ 你现在应该已经能看到一个手机界面的演示页面了！

#### 测试 2：测试搜索功能（需要真实数据）

由于 Yandex Maps 需要真实的俄文站点名称，你可以：

1. **方法 A：访问 Yandex Maps 获取真实站点**
   ```
   1. 打开 https://yandex.ru/maps/213/moscow/
   2. 搜索一个站点（例如：Красная площадь）
   3. 从 URL 中复制 stopId
   4. 在演示页面搜索框输入站点名称
   ```

2. **方法 B：直接测试 API**
   ```bash
   # 测试搜索（需要真实站点名）
   curl "http://localhost:3000/api/search?q=метро"

   # 测试站点详情（需要真实 stopId）
   curl "http://localhost:3000/api/stop/stop__9639579"
   ```

#### 测试 3：查看 API 状态

演示页面顶部有一个绿色的状态提示：
- ✅ **后端服务运行正常** - 表示可以正常使用
- ❌ **无法连接到后端服务** - 表示后端服务未运行

### 🔧 当前限制

1. **Puppeteer 首次请求较慢**
   - 第一次请求可能需要 10-15 秒
   - 浏览器需要启动和加载 Yandex Maps

2. **需要真实的莫斯科站点数据**
   - 搜索需要使用俄文站点名称
   - 站点详情需要有效的 stopId

3. **收藏功能**
   - 演示页面中的收藏功能是模拟的
   - 真实的收藏功能在微信小程序中实现

### 📖 下一步

#### 选项 A：使用微信开发者工具（完整体验）

1. 打开微信开发者工具
2. 导入项目：`/home/guohaojie/Guo/BUSTIME/miniprogram`
3. 配置 API 地址：编辑 `miniprogram/utils/api.js`
   ```javascript
   const API_BASE = 'http://localhost:3000';
   ```
4. 点击"详情" → 勾选"不校验合法域名"
5. 点击"编译"运行

#### 选项 B：继续在浏览器中测试

在浏览器控制台（F12）中测试 API：

```javascript
// 测试搜索
fetch('http://localhost:3000/api/search?q=метро')
    .then(r => r.json())
    .then(console.log);

// 测试站点详情
fetch('http://localhost:3000/api/stop/stop__9639579')
    .then(r => r.json())
    .then(console.log);
```

#### 选项 C：查看后端日志

```bash
# 查看实时日志
tail -f /home/guohaojie/Guo/BUSTIME/backend/logs/combined.log

# 查看错误日志
tail -f /home/guohaojie/Guo/BUSTIME/backend/logs/error.log
```

### 🐛 故障排查

#### 页面显示"无法连接到后端服务"

检查后端是否运行：
```bash
curl http://localhost:3000/health
```

如果失败，重启后端：
```bash
cd /home/guohaojie/Guo/BUSTIME/backend
npm run dev
```

#### 搜索返回空结果

- 确保输入的是俄文站点名称
- 尝试使用完整的站点名称
- 检查网络是否可以访问 Yandex Maps

#### Puppeteer 请求超时

- 第一次请求需要较长时间
- 确保系统有足够的内存
- 检查 Chromium 是否正确安装

### 📚 相关文档

- **README.md** - 完整项目文档
- **QUICKSTART.md** - 快速启动指南
- **plan.md** - 技术方案
- **START.md** - 启动说明

### 🎯 项目特性展示

你已经可以看到：

✅ **精美的界面设计**
- 模拟微信小程序的外观
- 流畅的交互动画
- 响应式布局

✅ **完整的功能流程**
- 首页 → 搜索 → 详情
- 实时数据展示
- 错误处理

✅ **后端 API 服务**
- RESTful 接口
- 缓存机制
- 日志系统

### 💡 提示

**如果你想看到真实的公交数据：**

1. 访问 https://yandex.ru/maps/213/moscow/
2. 搜索"Красная площадь"（红场）
3. 查看页面上的公交到站信息
4. 从浏览器开发者工具中分析真实的 API 请求
5. 根据真实 API 调整后端代码中的数据解析逻辑

### 🎨 界面预览

演示页面包含：

- 📱 手机外框设计
- ⏰ 状态栏显示
- 🔍 搜索功能
- 📍 站点卡片
- 🚌 路线信息
- ⏱️ 到站时间
- 🌟 底部导航

---

**享受你的成果吧！** 🎉

有任何问题，请查看文档或重新运行命令。
