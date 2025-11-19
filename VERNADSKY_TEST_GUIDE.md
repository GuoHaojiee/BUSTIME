# 测试 Проспект Вернадского, 33 公交信息指南

## 🎯 目标
查找并测试"Проспект Вернадского, 33"（韦尔纳茨基大街33号）附近的公交车实时到站信息。

---

## ✅ 方法1：使用Yandex Maps查找（推荐）

### 步骤：

1. **打开Yandex Maps**

   在浏览器中访问：
   ```
   https://yandex.ru/maps/213/moscow/?ll=37.506%2C55.677&mode=search&text=Проспект%20Вернадского%2C%2033&z=17
   ```

2. **找到地址标记**

   - 地图会显示"Проспект Вернадского, 33"的位置
   - 周围会有蓝色的公交站点图标

3. **点击公交站点**

   - 点击地址附近的任何一个公交站点图标（蓝色巴士标志）
   - 右侧会弹出站点信息卡片

4. **获取StopID**

   查看浏览器地址栏的URL，你会看到类似：
   ```
   https://yandex.ru/maps/213/moscow/stops/stop__9644561/?ll=37.506,55.677...
   ```

   其中 `stop__9644561` 就是站点ID！

5. **测试这个站点**

   在浏览器中访问：
   ```
   http://localhost:3000/api/stop/stop__9644561
   ```

   （替换成你找到的实际stopId）

---

## ✅ 方法2：使用搜索API（快速）

### 步骤：

1. **访问搜索接口**

   在浏览器中打开：
   ```
   http://localhost:3000/api/search?q=Проспект Вернадского
   ```

   或使用curl命令：
   ```bash
   curl "http://localhost:3000/api/search?q=Проспект%20Вернадского"
   ```

2. **查看搜索结果**

   返回的JSON中会包含站点列表，每个站点都有ID：
   ```json
   {
     "success": true,
     "data": [
       {
         "id": "stop__9644561",
         "name": "Проспект Вернадского",
         "address": "..."
       }
     ]
   }
   ```

3. **选择合适的站点**

   根据地址和名称选择最接近"Проспект Вернадского, 33"的站点

4. **测试站点**

   ```
   http://localhost:3000/api/stop/stop__9644561
   ```

---

## ✅ 方法3：使用已知站点ID（最快）

韦尔纳茨基大街附近的一些公交站点ID：

### 常见站点：

```bash
# 测试站点1
curl "http://localhost:3000/api/stop/stop__9644553"

# 测试站点2
curl "http://localhost:3000/api/stop/stop__9644554"

# 测试站点3
curl "http://localhost:3000/api/stop/stop__9644555"

# 韦尔纳茨基大街地铁站
curl "http://localhost:3000/api/stop/stop__9639561"
```

**注意**：这些是猜测的ID，可能不准确。建议使用方法1或方法2。

---

## 📊 预期结果

成功的API响应示例：

```json
{
  "success": true,
  "data": {
    "stop": {
      "id": "stop__9644561",
      "name": "站点 stop__9644561",
      "coordinates": [37.506, 55.677]
    },
    "arrivals": [
      {
        "routeNumber": "119",
        "routeName": "",
        "routeType": "bus",
        "arrivals": [
          {
            "minutes": 3,
            "direction": "Метро «Юго-Западная»",
            "isEstimated": true,
            "scheduledTime": "12:15",
            "estimatedTime": "12:13"
          },
          {
            "minutes": 12,
            "direction": "Метро «Юго-Западная»",
            "isEstimated": false,
            "scheduledTime": "12:24"
          }
        ]
      },
      {
        "routeNumber": "661",
        "arrivals": [ ... ]
      }
    ],
    "updateTime": "2025-11-19T09:10:00.000Z"
  },
  "fromCache": false
}
```

---

## 🔍 如何解读结果

### 站点信息（stop）
- `id`: 站点唯一标识
- `name`: 站点名称
- `coordinates`: GPS坐标 [经度, 纬度]

### 线路信息（arrivals）
每条线路包含：
- `routeNumber`: 线路号（如"119"、"661"）
- `routeType`: 类型（bus=公交, trolleybus=无轨电车, tram=有轨电车）
- `arrivals`: 到站列表

### 到站信息
- `minutes`: **距离到站的分钟数**（这是最重要的信息！）
- `direction`: 行驶方向/终点站
- `isEstimated`: true=实时预测，false=计划时间
- `scheduledTime`: 计划到站时间
- `estimatedTime`: 预计到站时间（GPS实时）

---

## ⚠️ 注意事项

1. **获取真实Yandex数据需要30秒左右**
   - 这是正常的，因为需要等待Yandex Maps的API响应
   - 第一次请求会比较慢

2. **模拟数据vs真实数据**
   - 有些站点ID有模拟数据，会立即返回
   - 真实的Yandex数据更准确但需要等待

3. **StopID格式**
   - 必须是 `stop__` 加数字的格式
   - 例如：`stop__9644561`

---

## 🚀 快速测试命令

```bash
# 进入backend目录
cd /home/guohaojie/Guo/BUSTIME/backend

# 方法1：在浏览器中搜索
xdg-open "https://yandex.ru/maps/213/moscow/?text=Проспект%20Вернадского%2C%2033"

# 方法2：测试API搜索
curl "http://localhost:3000/api/search?q=Проспект%20Вернадского"

# 方法3：测试具体站点（替换为实际ID）
curl "http://localhost:3000/api/stop/stop__9644561"
```

---

## 💡 提示

- 韦尔纳茨基大街33号附近通常有多个公交站点
- 选择距离最近的那个站点
- 可以同时测试附近的多个站点，看哪个最合适

**祝测试顺利！🎉**
