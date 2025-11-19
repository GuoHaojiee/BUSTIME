/**
 * 模拟数据服务 - 提供测试数据
 */
const logger = require('../utils/logger');

class MockDataService {
  constructor() {
    // 莫斯科的测试站点数据
    this.mockStops = [
      {
        id: 'stop__9644561',
        name: 'Проспект Вернадского, 33',
        name_zh: '韦尔纳茨基大街33号',
        address: 'Проспект Вернадского, 33, Москва',
        coordinates: {
          lat: 55.680195,
          lon: 37.516137
        }
      },
      {
        id: 'stop__9639579',
        name: 'Метро «Комсомольская»',
        name_zh: '共青团地铁站',
        address: 'Комсомольская площадь, Москва',
        coordinates: {
          lat: 55.775226,
          lon: 37.655317
        }
      },
      {
        id: 'stop__12345',
        name: 'Красная площадь',
        name_zh: '红场',
        address: 'Красная площадь, Москва',
        coordinates: {
          lat: 55.753544,
          lon: 37.621211
        }
      }
    ];

    // 模拟到站数据
    this.mockArrivals = {
      'stop__9644561': {
        stop: {
          id: 'stop__9644561',
          name: 'Проспект Вернадского, 33',
          name_zh: '韦尔纳茨基大街33号',
          address: 'Проспект Вернадского, 33, Москва',
          coordinates: {
            lat: 55.680195,
            lon: 37.516137
          }
        },
        arrivals: [
          {
            routeNumber: '119',
            routeName: 'Киевский вокзал — Крылатское',
            routeType: 'bus',
            color: '#FF6B00',
            arrivals: [
              { minutes: 2, time: 120, direction: 'Крылатское', vehicleId: 'bus_001' },
              { minutes: 8, time: 480, direction: 'Крылатское', vehicleId: 'bus_002' },
              { minutes: 15, time: 900, direction: 'Крылатское', vehicleId: 'bus_003' }
            ]
          },
          {
            routeNumber: '661',
            routeName: 'Метро «Юго-Западная» — Солнцево',
            routeType: 'bus',
            color: '#0066CC',
            arrivals: [
              { minutes: 5, time: 300, direction: 'Солнцево', vehicleId: 'bus_004' },
              { minutes: 12, time: 720, direction: 'Солнцево', vehicleId: 'bus_005' }
            ]
          },
          {
            routeNumber: 'М1',
            routeName: 'Кольцевая линия метро',
            routeType: 'metro',
            color: '#ED1C24',
            arrivals: [
              { minutes: 3, time: 180, direction: 'По кольцу', vehicleId: 'metro_001' },
              { minutes: 6, time: 360, direction: 'По кольцу', vehicleId: 'metro_002' },
              { minutes: 9, time: 540, direction: 'По кольцу', vehicleId: 'metro_003' }
            ]
          }
        ],
        updateTime: new Date().toISOString()
      },
      'stop__9639579': {
        stop: {
          id: 'stop__9639579',
          name: 'Метро «Комсомольская»',
          name_zh: '共青团地铁站',
          coordinates: {
            lat: 55.775226,
            lon: 37.655317
          }
        },
        arrivals: [
          {
            routeNumber: '40',
            routeName: 'Метро «Тимирязевская» — Метро «ВДНХ»',
            routeType: 'bus',
            color: '#FF0000',
            arrivals: [
              { minutes: 4, time: 240, direction: 'Метро «ВДНХ»', vehicleId: 'bus_101' },
              { minutes: 10, time: 600, direction: 'Метро «ВДНХ»', vehicleId: 'bus_102' }
            ]
          }
        ],
        updateTime: new Date().toISOString()
      }
    };
  }

  /**
   * 搜索站点
   * @param {string} keyword - 搜索关键词
   * @returns {Array}
   */
  searchStops(keyword) {
    const lowerKeyword = keyword.toLowerCase();

    const results = this.mockStops.filter(stop => {
      return (
        stop.name.toLowerCase().includes(lowerKeyword) ||
        (stop.name_zh && stop.name_zh.includes(keyword)) ||
        stop.address.toLowerCase().includes(lowerKeyword) ||
        stop.id.toLowerCase().includes(lowerKeyword)
      );
    });

    logger.info(`模拟搜索: ${keyword}, 找到 ${results.length} 个结果`);
    return results;
  }

  /**
   * 获取站点到站信息
   * @param {string} stopId - 站点ID
   * @returns {object|null}
   */
  getStopArrivals(stopId) {
    const data = this.mockArrivals[stopId];

    if (data) {
      logger.info(`返回模拟数据: ${stopId}`);
      // 更新时间
      return {
        ...data,
        updateTime: new Date().toISOString()
      };
    }

    // 如果没有预设数据，返回空的到站信息
    const stop = this.mockStops.find(s => s.id === stopId);
    if (stop) {
      logger.warn(`站点 ${stopId} 没有到站数据，返回空数据`);
      return {
        stop,
        arrivals: [],
        updateTime: new Date().toISOString()
      };
    }

    return null;
  }

  /**
   * 获取所有测试站点
   * @returns {Array}
   */
  getAllStops() {
    return this.mockStops;
  }
}

module.exports = new MockDataService();
