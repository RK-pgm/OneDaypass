const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', (req, res) => {
  const { deviceId } = req.query;
  if (typeof deviceId !== 'string' || !deviceId.trim() || deviceId.length > 128) {
    return res.status(400).json({ error: 'กรุณาระบุ deviceId' });
  }

  const rows = db.prepare(`
    SELECT p.id, p.code, p.status, p.validDate, p.createdAt AS passCreatedAt,
      o.id AS orderId, o.planJson, o.people, o.amount, o.discount, o.pointsUsed,
      o.createdAt AS orderCreatedAt
    FROM passes p
    JOIN orders o ON o.id = p.orderId
    WHERE o.deviceId = ? AND o.status = 'paid'
    ORDER BY p.createdAt DESC
  `).all(deviceId);

  const history = rows.map((row) => {
    const plan = JSON.parse(row.planJson);
    const purchaseDate = new Date(row.orderCreatedAt || row.passCreatedAt).toLocaleString('th-TH', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    const coupons = db.prepare('SELECT used FROM coupons WHERE passId = ?').all(row.id);
    const checkins = db.prepare('SELECT COUNT(*) AS total FROM checkins WHERE passId = ?').get(row.id);
    return {
      id: row.id,
      passId: row.id,
      orderId: row.orderId,
      code: row.code,
      status: row.status,
      purchaseDate,
      validDate: row.validDate,
      districtId: plan.districtId || null,
      districtName: plan.districtName || plan.items?.[0]?.district || 'ไม่ระบุย่าน',
      provinceName: plan.provinceName || 'ประเทศไทย',
      packageName: plan.selectedPackage?.title || 'Standard 1-Day Pass',
      packageBadge: plan.selectedPackage?.badge || 'พาส 1 วัน',
      people: row.people,
      totalAmount: row.amount,
      discount: row.discount,
      pointsUsed: row.pointsUsed,
      pointsEarned: Math.max(10, Math.round(row.amount * 0.05)),
      placesCount: plan.items?.length || 0,
      couponsCount: coupons.length,
      couponsUsed: coupons.filter((coupon) => coupon.used).length,
      checkinsCount: checkins.total,
      plan
    };
  });
  return res.json({ history });
});

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
