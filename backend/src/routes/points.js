const express = require('express');
const crypto = require('node:crypto');
const router = express.Router();
const db = require('../db');

const POINT_VALUE_BAHT = 2; // 1 แต้ม = 2 บาท

/**
 * GET /api/points?deviceId=
 * Aggregates points balance from points_ledger
 */
router.get('/', async (req, res, next) => {
  try {
    const { deviceId } = req.query;

    if (!deviceId || typeof deviceId !== 'string' || !deviceId.trim()) {
      return res.status(400).json({ error: 'กรุณาระบุ deviceId' });
    }

    const row = await db.get(
      'SELECT COALESCE(SUM(delta), 0) AS total FROM points_ledger WHERE deviceId = ?', deviceId
    );

    const totalPoints = Math.max(0, row ? row.total : 0);
    const transactions = await db.all(`
      SELECT delta, reason, at
      FROM points_ledger
      WHERE deviceId = ?
      ORDER BY at DESC, id DESC
      LIMIT 20
    `, deviceId);

    return res.json({
      totalPoints,
      points: totalPoints,
      pointValueBaht: POINT_VALUE_BAHT,
      transactions
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/add', async (req, res, next) => {
  try {
    const { deviceId, delta, type } = req.body || {};
    if (typeof deviceId !== 'string' || !deviceId.trim() || deviceId.length > 128) {
      return res.status(400).json({ error: 'กรุณาระบุ deviceId' });
    }
    const rewards = {
      welcome_bonus: { delta: 50, reason: 'ของขวัญต้อนรับสมาชิกใหม่ OneDaypass ✨', once: true },
      daily_bonus: { delta: 35, reason: 'ของขวัญเช็กอินประจำวันจากน้องพาส 🎁', once: false },
      quiz_complete: { delta: 20, reason: 'ทำควิซค้นหาสไตล์เที่ยวกับน้องพาส 🧭', once: true },
    };
    const reward = Object.hasOwn(rewards, type) ? rewards[type] : null;
    if (!reward || delta !== reward.delta) {
      return res.status(400).json({ error: 'จำนวนแต้มที่เพิ่มไม่ถูกต้อง' });
    }

    const at = new Date().toISOString();
    const day = at.slice(0, 10);
    const dateClause = reward.once ? '' : 'AND substr(at, 1, 10) = ?';
    const statement = `
      INSERT INTO points_ledger (id, deviceId, delta, reason, at)
      SELECT ?, ?, ?, ?, ?
      WHERE NOT EXISTS (
        SELECT 1 FROM points_ledger WHERE deviceId = ? AND reason = ? ${dateClause}
      )
    `;
    const values = [
      `pt_${crypto.randomUUID()}`, deviceId, delta, reward.reason, at,
      deviceId, reward.reason,
    ];
    if (!reward.once) values.push(day);
    const result = await db.run(statement, ...values);
    if (result.changes !== 1) {
      return res.status(409).json({ error: 'คุณรับแต้มรายการนี้แล้ว' });
    }

    const row = await db.get(
      'SELECT COALESCE(SUM(delta), 0) AS total FROM points_ledger WHERE deviceId = ?', deviceId
    );
    return res.status(201).json({ ok: true, totalPoints: Math.max(0, row.total), delta, type });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
