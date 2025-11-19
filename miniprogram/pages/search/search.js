// pages/search/search.js
const api = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    keyword: '',
    searchHistory: [],
    searchResults: [],
    loading: false,
    searched: false
  },

  onLoad() {
    this.loadSearchHistory();
  },

  /**
   * 加载搜索历史
   */
  loadSearchHistory() {
    const history = util.getSearchHistory();
    this.setData({
      searchHistory: history
    });
  },

  /**
   * 输入变化
   */
  onInput(e) {
    const keyword = e.detail.value;
    this.setData({ keyword });

    // 防抖搜索
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }

    if (keyword.trim().length >= 2) {
      this.searchTimer = setTimeout(() => {
        this.performSearch(keyword);
      }, 500);
    }
  },

  /**
   * 清空输入
   */
  clearInput() {
    this.setData({
      keyword: '',
      searchResults: [],
      searched: false
    });
  },

  /**
   * 搜索按钮点击
   */
  onSearch() {
    const { keyword } = this.data;
    if (keyword.trim().length < 2) {
      api.showError('请输入至少2个字符');
      return;
    }
    this.performSearch(keyword);
  },

  /**
   * 执行搜索
   */
  async performSearch(keyword) {
    const trimmed = keyword.trim();
    if (trimmed.length < 2) {
      return;
    }

    this.setData({ loading: true });

    try {
      const res = await api.searchStops(trimmed);

      // 添加到搜索历史
      util.addSearchHistory(trimmed);

      this.setData({
        searchResults: res.data || [],
        searched: true,
        searchHistory: util.getSearchHistory()
      });

      if (res.data.length === 0) {
        api.showError('未找到相关站点');
      }
    } catch (error) {
      console.error('搜索失败:', error);
      api.showError(error.message || '搜索失败');
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 点击历史记录
   */
  onHistoryClick(e) {
    const { keyword } = e.currentTarget.dataset;
    this.setData({ keyword });
    this.performSearch(keyword);
  },

  /**
   * 清空搜索历史
   */
  async clearHistory() {
    const confirmed = await api.showConfirm('确定要清空搜索历史吗？');
    if (confirmed) {
      util.clearSearchHistory();
      this.setData({
        searchHistory: []
      });
      api.showSuccess('已清空');
    }
  },

  /**
   * 查看站点详情
   */
  viewStopDetail(e) {
    const { stop } = e.currentTarget.dataset;

    // 跳转到详情页
    wx.navigateTo({
      url: `/pages/detail/detail?stopId=${stop.id}&stopName=${encodeURIComponent(stop.name)}&stopAddress=${encodeURIComponent(stop.address || '')}`
    });
  },

  /**
   * 返回
   */
  goBack() {
    wx.navigateBack();
  }
});
