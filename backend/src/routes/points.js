const express = require('express');
const router = express.Router();
const db = require('../db');

const POINT_VALUE_BAHT = 2; // 1 แต้ม = 2 บาท

/**
 * GET /api/points?deviceId=
 * Aggregates points balance from points_ledger
 */
router.get('/', (req, res) => {
  try {
    const { deviceId } = req.query;

    if (!deviceId || typeof deviceId !== 'string' || !deviceId.trim()) {
      return res.status(400).json({ error: 'กรุณาระบุ deviceId' });
    }

    const row = db.prepare(
      'SELECT COALESCE(SUM(delta), 0) AS total FROM points_ledger WHERE deviceId = ?'
    ).get(deviceId);

    const totalPoints = Math.max(0, row ? row.total : 0);

    return res.json({
      totalPoints,
      points: totalPoints,
      pointValueBaht: POINT_VALUE_BAHT
    });
  } catch (error) {
    console.error('[Error GET /api/points]:', error);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลแต้มสะสม' });
  }
});

module.exports = router;
