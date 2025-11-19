/**
 * API 请求工具
 */

const app = getApp();

// API 基础配置
const API_BASE = 'https://your-api-domain.com'; // 替换为实际的 API 地址
const TIMEOUT = 10000; // 请求超时时间

/**
 * 通用请求方法
 * @param {string} url - 请求地址
 * @param {object} options - 请求配置
 * @returns {Promise}
 */
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE}${url}`,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        ...options.header
      },
      timeout: options.timeout || TIMEOUT,
      success: (res) => {
        if (res.statusCode === 200) {
          if (res.data.success) {
            resolve(res.data);
          } else {
            reject(new Error(res.data.message || '请求失败'));
          }
        } else {
          reject(new Error(`请求失败: ${res.statusCode}`));
        }
      },
      fail: (error) => {
        console.error('请求失败:', error);
        reject(error);
      }
    });
  });
}

/**
 * GET 请求
 * @param {string} url - 请求地址
 * @param {object} params - 查询参数
 * @returns {Promise}
 */
function get(url, params = {}) {
  // 构建查询字符串
  const queryString = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

  const fullUrl = queryString ? `${url}?${queryString}` : url;

  return request(fullUrl, { method: 'GET' });
}

/**
 * POST 请求
 * @param {string} url - 请求地址
 * @param {object} data - 请求数据
 * @returns {Promise}
 */
function post(url, data = {}) {
  return request(url, {
    method: 'POST',
    data
  });
}

/**
 * 搜索站点
 * @param {string} keyword - 搜索关键词
 * @returns {Promise}
 */
function searchStops(keyword) {
  return get('/api/search', { q: keyword });
}

/**
 * 获取站点实时到站信息
 * @param {string} stopId - 站点ID
 * @returns {Promise}
 */
function getStopInfo(stopId) {
  return get(`/api/stop/${stopId}`);
}

/**
 * 显示加载提示
 * @param {string} title - 提示文字
 */
function showLoading(title = '加载中...') {
  wx.showLoading({
    title,
    mask: true
  });
}

/**
 * 隐藏加载提示
 */
function hideLoading() {
  wx.hideLoading();
}

/**
 * 显示成功提示
 * @param {string} title - 提示文字
 */
function showSuccess(title) {
  wx.showToast({
    title,
    icon: 'success',
    duration: 2000
  });
}

/**
 * 显示错误提示
 * @param {string} title - 提示文字
 */
function showError(title) {
  wx.showToast({
    title,
    icon: 'none',
    duration: 2000
  });
}

/**
 * 显示确认对话框
 * @param {string} content - 内容
 * @param {string} title - 标题
 * @returns {Promise}
 */
function showConfirm(content, title = '提示') {
  return new Promise((resolve, reject) => {
    wx.showModal({
      title,
      content,
      success: (res) => {
        if (res.confirm) {
          resolve(true);
        } else {
          resolve(false);
        }
      },
      fail: reject
    });
  });
}

module.exports = {
  request,
  get,
  post,
  searchStops,
  getStopInfo,
  showLoading,
  hideLoading,
  showSuccess,
  showError,
  showConfirm
};
