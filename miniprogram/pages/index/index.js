// pages/index/index.js
const util = require('../../utils/util');

Page({
  data: {
    favorites: [],
    searchKeyword: ''
  },

  onLoad() {
    this.loadFavorites();
  },

  onShow() {
    // 每次显示页面时刷新收藏列表
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
   * 跳转到搜索页
   */
  goToSearch() {
    wx.navigateTo({
      url: '/pages/search/search'
    });
  },

  /**
   * 查看站点详情
   */
  viewStopDetail(e) {
    const { stopId } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/detail/detail?stopId=${stopId}`
    });
  },

  /**
   * 删除收藏
   */
  async deleteFavorite(e) {
    const { stopId, stopName } = e.currentTarget.dataset;

    const confirmed = await wx.showModal({
      title: '确认删除',
      content: `确定要取消收藏"${stopName}"吗？`
    }).then(res => res.confirm).catch(() => false);

    if (confirmed) {
      const success = util.removeFavorite(stopId);
      if (success) {
        wx.showToast({
          title: '已取消收藏',
          icon: 'success'
        });
        this.loadFavorites();
      }
    }
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
