// pages/favorites/favorites.js
const util = require('../../utils/util');
const api = require('../../utils/api');

Page({
  data: {
    favorites: [],
    isEditing: false
  },

  onLoad() {
    this.loadFavorites();
  },

  onShow() {
    this.loadFavorites();
  },

  /**
   * 加载收藏列表
   */
  loadFavorites() {
    const favorites = util.getFavorites();
    this.setData({
      favorites
    });
  },

  /**
   * 切换编辑模式
   */
  toggleEdit() {
    this.setData({
      isEditing: !this.data.isEditing
    });
  },

  /**
   * 查看站点详情
   */
  viewStopDetail(e) {
    const { stop } = e.currentTarget.dataset;

    wx.navigateTo({
      url: `/pages/detail/detail?stopId=${stop.id}&stopName=${encodeURIComponent(stop.name)}&stopAddress=${encodeURIComponent(stop.address || '')}`
    });
  },

  /**
   * 删除收藏
   */
  async deleteFavorite(e) {
    const { stopId, stopName } = e.currentTarget.dataset;

    const confirmed = await api.showConfirm(`确定要取消收藏"${stopName}"吗？`);

    if (confirmed) {
      const success = util.removeFavorite(stopId);
      if (success) {
        api.showSuccess('已取消收藏');
        this.loadFavorites();

        // 如果列表为空，退出编辑模式
        if (this.data.favorites.length === 0) {
          this.setData({ isEditing: false });
        }
      }
    }
  },

  /**
   * 清空所有收藏
   */
  async clearAllFavorites() {
    const confirmed = await api.showConfirm('确定要清空所有收藏吗？', '清空收藏');

    if (confirmed) {
      try {
        wx.setStorageSync('favorites', []);
        this.setData({
          favorites: [],
          isEditing: false
        });
        api.showSuccess('已清空');
      } catch (error) {
        console.error('清空收藏失败:', error);
        api.showError('清空失败');
      }
    }
  },

  /**
   * 跳转到搜索页
   */
  goToSearch() {
    wx.navigateTo({
      url: '/pages/search/search'
    });
  },

  /**
   * 分享
   */
  onShareAppMessage() {
    return {
      title: '莫斯科公交查询',
      path: '/pages/index/index'
    };
  }
});
