/**
 * 参数验证工具类
 */
class Validator {
  /**
   * 验证站点ID格式
   * @param {string} stopId - 站点ID
   * @returns {boolean}
   */
  static isValidStopId(stopId) {
    if (!stopId || typeof stopId !== 'string') {
      return false;
    }
    // Yandex Maps 站点ID通常格式为 stop__数字
    return /^stop__\d+$/.test(stopId) || stopId.length > 0;
  }

  /**
   * 验证搜索关键词
   * @param {string} keyword - 搜索关键词
   * @returns {object} { valid: boolean, message: string }
   */
  static validateSearchKeyword(keyword) {
    if (!keyword) {
      return { valid: false, message: '搜索关键词不能为空' };
    }

    if (typeof keyword !== 'string') {
      return { valid: false, message: '搜索关键词必须是字符串' };
    }

    const trimmed = keyword.trim();
    if (trimmed.length < 2) {
      return { valid: false, message: '搜索关键词至少2个字符' };
    }

    if (trimmed.length > 100) {
      return { valid: false, message: '搜索关键词不能超过100个字符' };
    }

    return { valid: true, keyword: trimmed };
  }

  /**
   * 清理和规范化站点ID
   * @param {string} stopId - 站点ID
   * @returns {string}
   */
  static sanitizeStopId(stopId) {
    if (!stopId) return '';
    return String(stopId).trim();
  }

  /**
   * 验证坐标
   * @param {number} lat - 纬度
   * @param {number} lon - 经度
   * @returns {boolean}
   */
  static isValidCoordinates(lat, lon) {
    return (
      typeof lat === 'number' &&
      typeof lon === 'number' &&
      lat >= -90 &&
      lat <= 90 &&
      lon >= -180 &&
      lon <= 180
    );
  }
}

module.exports = Validator;
