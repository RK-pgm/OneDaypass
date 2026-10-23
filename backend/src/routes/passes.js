const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/:passId', (req, res) => {
  const pass = db.prepare(`SELECT p.*, o.planJson, o.people FROM passes p
    JOIN orders o ON o.id = p.orderId WHERE p.id = ?`).get(req.params.passId);
  if (!pass) return res.status(404).json({ error: 'ไม่พบพาสนี้' });
  const coupons = db.prepare('SELECT id, shopId, title, used FROM coupons WHERE passId = ? ORDER BY rowid').all(pass.id)
    .map((coupon) => ({ ...coupon, used: Boolean(coupon.used) }));
  const checkins = db.prepare('SELECT shopId, at FROM checkins WHERE passId = ? ORDER BY at').all(pass.id);
  const unlockedMissionIds = db.prepare(`SELECT DISTINCT 'm-' || s.id AS missionId
    FROM checkins c JOIN shops s ON s.id = c.shopId
    WHERE c.passId = ? AND s.missionJson IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM mission_submissions ms WHERE ms.passId = c.passId AND ms.missionId = 'm-' || s.id
    )`).all(pass.id).map((row) => row.missionId);
  const completedMissionIds = db.prepare('SELECT missionId FROM mission_submissions WHERE passId = ?').all(pass.id)
    .map((row) => row.missionId);
  return res.json({ id: pass.id, code: pass.code, status: pass.status, validDate: pass.validDate,
    people: pass.people, plan: JSON.parse(pass.planJson), coupons, checkins, unlockedMissionIds, completedMissionIds });
});

module.exports = router;
