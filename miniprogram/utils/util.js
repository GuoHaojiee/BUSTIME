/**
 * 通用工具函数
 */

/**
 * 格式化时间
 * @param {Date} date - 日期对象
 * @param {string} format - 格式化模板
 * @returns {string}
 */
function formatTime(date, format = 'YYYY-MM-DD HH:mm:ss') {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  const formatNumber = n => n < 10 ? '0' + n : n;

  return format
    .replace('YYYY', year)
    .replace('MM', formatNumber(month))
    .replace('DD', formatNumber(day))
    .replace('HH', formatNumber(hour))
    .replace('mm', formatNumber(minute))
    .replace('ss', formatNumber(second));
}

/**
 * 格式化相对时间
 * @param {string|Date} time - 时间
 * @returns {string}
 */
function formatRelativeTime(time) {
  const now = new Date();
  const target = new Date(time);
  const diff = Math.floor((now - target) / 1000); // 秒

  if (diff < 60) {
    return '刚刚';
  } else if (diff < 3600) {
    return `${Math.floor(diff / 60)}分钟前`;
  } else if (diff < 86400) {
    return `${Math.floor(diff / 3600)}小时前`;
  } else if (diff < 604800) {
    return `${Math.floor(diff / 86400)}天前`;
  } else {
    return formatTime(target, 'MM-DD HH:mm');
  }
}

/**
 * 格式化到站时间
 * @param {number} minutes - 分钟数
 * @returns {string}
 */
function formatArrivalTime(minutes) {
  if (minutes === 0) {
    return '即将到站';
  } else if (minutes < 1) {
    return '1分钟内';
  } else {
    return `${minutes}分钟`;
  }
}

/**
 * 防抖函数
 * @param {Function} fn - 执行函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function}
 */
function debounce(fn, delay = 500) {
  let timer = null;
  return function(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * 节流函数
 * @param {Function} fn - 执行函数
 * @param {number} interval - 时间间隔（毫秒）
 * @returns {Function}
 */
function throttle(fn, interval = 500) {
  let last = 0;
  return function(...args) {
    const now = Date.now();
    if (now - last >= interval) {
      last = now;
      fn.apply(this, args);
    }
  };
}

/**
 * 获取收藏列表
 * @returns {Array}
 */
function getFavorites() {
  try {
    return wx.getStorageSync('favorites') || [];
  } catch (error) {
    console.error('获取收藏列表失败:', error);
    return [];
  }
}

/**
 * 检查是否已收藏
 * @param {string} stopId - 站点ID
 * @returns {boolean}
 */
function isFavorite(stopId) {
  const favorites = getFavorites();
  return favorites.some(item => item.id === stopId);
}

/**
 * 添加收藏
 * @param {object} stop - 站点信息
 * @returns {boolean}
 */
function addFavorite(stop) {
  try {
    const favorites = getFavorites();

    // 检查是否已存在
    if (favorites.some(item => item.id === stop.id)) {
      return false;
    }

    // 限制收藏数量
    if (favorites.length >= 20) {
      wx.showToast({
        title: '最多收藏20个站点',
        icon: 'none'
      });
      return false;
    }

    // 添加收藏时间
    stop.addedAt = Date.now();

    // 添加到列表开头
    favorites.unshift(stop);
    wx.setStorageSync('favorites', favorites);

    return true;
  } catch (error) {
    console.error('添加收藏失败:', error);
    return false;
  }
}

/**
 * 删除收藏
 * @param {string} stopId - 站点ID
 * @returns {boolean}
 */
function removeFavorite(stopId) {
  try {
    const favorites = getFavorites();
    const filtered = favorites.filter(item => item.id !== stopId);
    wx.setStorageSync('favorites', filtered);
    return true;
  } catch (error) {
    console.error('删除收藏失败:', error);
    return false;
  }
}

/**
 * 获取搜索历史
 * @returns {Array}
 */
function getSearchHistory() {
  try {
    return wx.getStorageSync('searchHistory') || [];
  } catch (error) {
    console.error('获取搜索历史失败:', error);
    return [];
  }
}

/**
 * 添加搜索历史
 * @param {string} keyword - 搜索关键词
 */
function addSearchHistory(keyword) {
  try {
    const history = getSearchHistory();

    // 移除已存在的相同关键词
    const filtered = history.filter(item => item.keyword !== keyword);

    // 添加到开头
    filtered.unshift({
      keyword,
      timestamp: Date.now()
    });

    // 限制历史记录数量
    const limited = filtered.slice(0, 10);

    wx.setStorageSync('searchHistory', limited);
  } catch (error) {
    console.error('添加搜索历史失败:', error);
  }
}

/**
 * 清空搜索历史
 */
function clearSearchHistory() {
  try {
    wx.setStorageSync('searchHistory', []);
  } catch (error) {
    console.error('清空搜索历史失败:', error);
  }
}

/**
 * 获取公交类型图标
 * @param {string} type - 公交类型
 * @returns {string}
 */
function getBusTypeIcon(type) {
  const iconMap = {
    'bus': '🚌',
    'trolleybus': '🚎',
    'tram': '🚋',
    'metro': '🚇',
    'shuttle': '🚐',
    'minibus': '🚐'
  };
  return iconMap[type] || '🚌';
}

/**
 * 获取公交类型名称
 * @param {string} type - 公交类型
 * @returns {string}
 */
function getBusTypeName(type) {
  const nameMap = {
    'bus': '公交',
    'trolleybus': '无轨电车',
    'tram': '有轨电车',
    'metro': '地铁',
    'shuttle': '班车',
    'minibus': '小巴'
  };
  return nameMap[type] || '公交';
}

module.exports = {
  formatTime,
  formatRelativeTime,
  formatArrivalTime,
  debounce,
  throttle,
  getFavorites,
  isFavorite,
  addFavorite,
  removeFavorite,
  getSearchHistory,
  addSearchHistory,
  clearSearchHistory,
  getBusTypeIcon,
  getBusTypeName
};
