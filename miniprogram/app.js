// app.js
App({
  onLaunch() {
    console.log('小程序启动');

    // 检查本地存储
    this.initStorage();

    // 获取系统信息
    this.getSystemInfo();
  },

  onShow() {
    console.log('小程序显示');
  },

  onHide() {
    console.log('小程序隐藏');
  },

  /**
   * 初始化本地存储
   */
  initStorage() {
    try {
      // 初始化收藏列表
      const favorites = wx.getStorageSync('favorites');
      if (!favorites) {
        wx.setStorageSync('favorites', []);
      }

      // 初始化搜索历史
      const searchHistory = wx.getStorageSync('searchHistory');
      if (!searchHistory) {
        wx.setStorageSync('searchHistory', []);
      }

      // 初始化设置
      const settings = wx.getStorageSync('settings');
      if (!settings) {
        wx.setStorageSync('settings', {
          language: 'zh-CN',
          autoRefresh: false,
          theme: 'light'
        });
      }
    } catch (error) {
      console.error('初始化存储失败:', error);
    }
  },

  /**
   * 获取系统信息
   */
  getSystemInfo() {
    wx.getSystemInfo({
      success: (res) => {
        this.globalData.systemInfo = res;
        console.log('系统信息:', res);
      },
      fail: (error) => {
        console.error('获取系统信息失败:', error);
      }
    });
  },

  globalData: {
    // API 基础地址 - 需要替换成实际的服务器地址
    apiBase: 'https://your-api-domain.com',
    systemInfo: null,
    userInfo: null
  }
});
