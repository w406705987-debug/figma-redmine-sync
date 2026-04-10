/**
 * 同步记录路由
 */

const express = require('express');
const router = express.Router();
const recordService = require('../services/recordService');

/**
 * GET /api/records
 * 获取所有记录
 */
router.get('/', (req, res) => {
  try {
    const records = recordService.getAllRecords();
    res.json({ records, total: records.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/records/today
 * 获取今日记录
 */
router.get('/today', (req, res) => {
  try {
    const records = recordService.getTodayRecords();
    res.json({ records, total: records.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/records/date/:date
 * 获取指定日期记录
 */
router.get('/date/:date', (req, res) => {
  try {
    const records = recordService.getRecordsByDate(req.params.date);
    res.json({ records, total: records.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/records
 * 添加记录
 */
router.post('/', (req, res) => {
  try {
    const record = recordService.addRecord(req.body);
    res.json({ success: true, record });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/records/report
 * 生成日报
 */
router.get('/report', (req, res) => {
  try {
    const { date } = req.query;
    const report = recordService.generateDailyReport(date);
    res.json({ report });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/records/:id
 * 删除指定记录
 */
router.delete('/:id', (req, res) => {
  try {
    const result = recordService.deleteRecord(parseInt(req.params.id));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/records
 * 清空所有记录
 */
router.delete('/', (req, res) => {
  try {
    const result = recordService.clearAllRecords();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
