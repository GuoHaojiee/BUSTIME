// pages/detail/detail.js
const api = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    stopId: '',
    stopName: '',
    stopAddress: '',
    stopInfo: null,
    arrivals: [],
    updateTime: '',
    loading: false,
    isFavorite: false,
    error: null
  },

  onLoad(options) {
    const { stopId, stopName, stopAddress } = options;

    this.setData({
      stopId,
      stopName: decodeURIComponent(stopName || ''),
      stopAddress: decodeURIComponent(stopAddress || '')
    });

    // 检查是否已收藏
    this.checkFavorite();

    // 加载站点信息
    this.loadStopInfo();
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadStopInfo();
  },

  /**
   * 检查是否已收藏
   */
  checkFavorite() {
    const isFavorite = util.isFavorite(this.data.stopId);
    this.setData({ isFavorite });
  },

  /**
   * 加载站点信息
   */
  async loadStopInfo() {
    const { stopId } = this.data;

    this.setData({
      loading: true,
      error: null
    });

    try {
      const res = await api.getStopInfo(stopId);

      const stopInfo = res.data.stop || {};
      const arrivals = res.data.arrivals || [];
      const updateTime = res.data.updateTime || new Date().toISOString();

      const normalizedArrivals = arrivals.map(item => ({
        ...item,
        upcomingArrivals: (item.arrivals || []).slice(0, 3)
      }));

      // 更新站点名称（如果API返回了更完整的信息）
      if (stopInfo.name && !this.data.stopName) {
        this.setData({
          stopName: stopInfo.name,
          stopAddress: stopInfo.address || ''
        });
      }

      this.setData({
        stopInfo,
        arrivals: normalizedArrivals,
        updateTime: util.formatTime(new Date(updateTime), 'HH:mm:ss'),
        loading: false
      });

      // 停止下拉刷新
      wx.stopPullDownRefresh();
    } catch (error) {
      console.error('加载站点信息失败:', error);

      this.setData({
        loading: false,
        error: error.message || '加载失败'
      });

      api.showError(error.message || '加载失败');
      wx.stopPullDownRefresh();
    }
  },

  /**
   * 切换收藏状态
   */
  toggleFavorite() {
    const { stopId, stopName, stopAddress, isFavorite } = this.data;

    if (isFavorite) {
      // 取消收藏
      const success = util.removeFavorite(stopId);
      if (success) {
        this.setData({ isFavorite: false });
        api.showSuccess('已取消收藏');
      }
    } else {
      // 添加收藏
      const stop = {
        id: stopId,
        name: stopName,
        address: stopAddress
      };

      const success = util.addFavorite(stop);
      if (success) {
        this.setData({ isFavorite: true });
        api.showSuccess('收藏成功');
      }
    }
  },

  /**
   * 手动刷新
   */
  onRefresh() {
    this.loadStopInfo();
  },

  /**
   * 重试加载
   */
  onRetry() {
    this.loadStopInfo();
  },

  /**
   * 分享
   */
  onShareAppMessage() {
    const { stopName, stopId } = this.data;
    return {
      title: `${stopName} - 莫斯科公交查询`,
      path: `/pages/detail/detail?stopId=${stopId}&stopName=${encodeURIComponent(stopName)}`
    };
  }
});
