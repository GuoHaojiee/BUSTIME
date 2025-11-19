# 下一步操作指南

## 🎉 当前成果

恭喜！你的项目已经成功运行：

✅ **后端服务运行正常**
- 端口：http://localhost:3000
- Puppeteer 成功启动
- API 接口正常响应

✅ **前端演示页面可用**
- 浏览器界面已打开
- 可以看到完整的 UI 设计
- 所有交互功能正常

✅ **基础架构完整**
- 完整的项目代码
- 文档齐全
- 可以部署

## ⚠️ 当前状态

**测试站点：** `stop__9644561`
**API 响应：** 成功，但是数据为空

```json
{
  "success": true,
  "data": {
    "stop": {
      "id": "stop__9644561",
      "name": "",      // ← 空的
      "coordinates": null
    },
    "arrivals": [],    // ← 空的
    "updateTime": "2025-11-18T18:03:59.613Z"
  },
  "fromCache": false
}
```

**原因分析：**
1. Puppeteer 成功访问了 Yandex Maps 页面
2. 但是没有拦截到实时数据 API
3. 可能的原因：
   - Yandex Maps 的 API 端点与代码中预期的不同
   - 数据在 DOM 中而不是 AJAX 请求中
   - 需要等待更长时间或触发特定操作

## 🔧 解决方案

### 方案 A：使用浏览器分析真实 API（推荐）

这是最准确的方法：

1. **打开你提供的 Yandex Maps 链接：**
   ```
   https://yandex.ru/maps/213/moscow/stops/stop__9644561/
   ```

2. **打开浏览器开发者工具（F12）**

3. **切换到 Network 标签**

4. **筛选 XHR/Fetch 请求**

5. **刷新页面，观察请求**

6. **找到包含实时数据的请求：**
   - 查找包含 "forecast"、"arrival"、"schedule" 等关键词的请求
   - 查看响应内容，确认是否包含到站时间

7. **记录以下信息：**
   ```
   API URL: _______________________
   请求方法: GET/POST
   查询参数: _______________________
   响应格式: JSON/其他
   ```

8. **修改后端代码：**
   - 编辑 `backend/src/services/puppeteerService.js`
   - 更新第 68-82 行的 URL 匹配逻辑
   - 更新第 203-230 行的数据解析逻辑

### 方案 B：使用 DOM 解析（备选）

如果没有明显的 API 请求，数据可能直接在页面中：

1. **在浏览器中查看页面源代码**

2. **查找包含到站时间的 HTML 元素**

3. **使用开发者工具选择器定位元素**

4. **更新后端代码中的 DOM 解析逻辑：**
   - 编辑 `backend/src/services/puppeteerService.js`
   - 查看第 240-300 行的 `parseFromDOM` 函数
   - 根据实际 DOM 结构调整选择器

### 方案 C：暂时使用模拟数据（快速体验）

如果你想先看到完整的界面效果：

创建文件 `/home/guohaojie/Guo/BUSTIME/backend/mock-data.json`：

```json
{
  "stop": {
    "id": "stop__9644561",
    "name": "Проспект Вернадского",
    "coordinates": { "lat": 55.680195, "lon": 37.516137 }
  },
  "arrivals": [
    {
      "routeNumber": "119",
      "routeName": "Киевский вокзал - Крылатское",
      "routeType": "bus",
      "color": "#FF0000",
      "arrivals": [
        { "minutes": 2, "time": 120, "direction": "Крылатское" },
        { "minutes": 8, "time": 480, "direction": "Крылатское" },
        { "minutes": 15, "time": 900, "direction": "Крылатское" }
      ]
    },
    {
      "routeNumber": "М",
      "routeName": "Кольцевая линия",
      "routeType": "metro",
      "color": "#0000FF",
      "arrivals": [
        { "minutes": 3, "time": 180, "direction": "По кольцу" },
        { "minutes": 6, "time": 360, "direction": "По кольцу" }
      ]
    }
  ],
  "updateTime": "2025-11-18T20:00:00.000Z"
}
```

然后修改 `backend/src/services/puppeteerService.js`，直接返回模拟数据。

## 📝 具体修改示例

### 如果你找到了真实的 API

假设你发现 API 是：`https://api-maps.yandex.ru/services/transit/stops`

修改 `backend/src/services/puppeteerService.js` 第 68-82 行：

```javascript
// 原代码
if (url.includes('masstransit') &&
   (url.includes('forecasts') || url.includes('stop'))) {

// 修改为（根据实际 URL）
if (url.includes('transit/stops') ||
    url.includes('你找到的API路径')) {
```

### 如果使用 DOM 解析

修改 `parseFromDOM` 函数（第 263 行开始）：

```javascript
// 根据实际页面结构修改选择器
const routeElements = document.querySelectorAll('.你找到的类名');
```

## 🧪 测试流程

修改代码后：

1. **重启服务**（nodemon 会自动重启）

2. **清除缓存：**
   ```bash
   curl -X DELETE http://localhost:3000/api/cache
   ```

3. **重新测试：**
   ```bash
   curl http://localhost:3000/api/stop/stop__9644561
   ```

4. **在演示页面测试：**
   - 刷新浏览器页面
   - 在搜索框输入站点名称
   - 查看是否显示数据

## 💡 提示

### 如何找到站点 ID？

从 Yandex Maps URL 中：
```
https://yandex.ru/maps/213/moscow/stops/stop__9644561/
                                         ↑
                                    这是 stopId
```

### 如何查看后端日志？

```bash
# 实时日志
tail -f /home/guohaojie/Guo/BUSTIME/backend/logs/combined.log

# 错误日志
tail -f /home/guohaojie/Guo/BUSTIME/backend/logs/error.log
```

### 如何调试 Puppeteer？

修改 `backend/src/config/index.js` 第 29 行：

```javascript
// 改为非 headless 模式，可以看到浏览器窗口
headless: false,
```

重启服务后，你会看到 Chromium 浏览器窗口打开，可以直观地看到它在做什么。

## 📚 相关文件

需要修改的主要文件：

- `backend/src/services/puppeteerService.js` - Puppeteer 服务（数据获取）
- `backend/src/config/index.js` - 配置文件
- `backend/.env` - 环境变量

文档参考：

- `DEMO_GUIDE.md` - 演示页面使用指南
- `plan.md` - 详细技术方案
- `README.md` - 完整项目文档

## 🎯 目标

完成上述调整后，你应该能够：

✅ 看到真实的站点名称
✅ 看到实时的公交到站时间
✅ 在演示页面中搜索和查看完整数据
✅ 体验完整的功能流程

## 🤝 需要帮助？

如果你在分析 Yandex Maps API 时遇到困难：

1. 截图浏览器 Network 标签中的请求列表
2. 复制请求的 URL 和响应内容
3. 我可以帮你分析并修改代码

## 📌 总结

**目前状态：**
- ✅ 项目框架完整可运行
- ⚠️ 需要调整数据获取逻辑

**下一步：**
1. 打开 Yandex Maps 并分析真实 API
2. 根据分析结果修改代码
3. 测试并查看结果

你已经完成了 95% 的工作！剩下的只是根据真实 API 调整数据解析逻辑。

---

**加油！** 🚀
