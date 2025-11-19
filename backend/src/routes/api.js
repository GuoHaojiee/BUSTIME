const express = require('express');
const router = express.Router();
const stopController = require('../controllers/stopController');

/**
 * API 路由定义
 */

// 获取常用站点
// GET /api/frequent-stops
router.get('/frequent-stops', stopController.getFrequentStops.bind(stopController));

// 搜索站点
// GET /api/search?q=关键词
router.get('/search', stopController.searchStops.bind(stopController));

// 获取站点实时到站信息
// GET /api/stop/:stopId
router.get('/stop/:stopId', stopController.getStopInfo.bind(stopController));

module.exports = router;
