const express = require('express');
const db = require('../db');
const { bangkokDate } = require('../lib/dates');
const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
  const { deviceId } = req.query;
  if (typeof deviceId !== 'string' || !deviceId.trim() || deviceId.length > 128) {
    return res.status(400).json({ error: 'กรุณาระบุ deviceId' });
  }

  const rows = await db.all(`
    SELECT p.id, p.code, p.status, p.validDate, p.createdAt AS passCreatedAt,
      o.id AS orderId, o.planJson, o.people, o.amount, o.discount, o.pointsUsed, o.isDemo,
      o.createdAt AS orderCreatedAt
    FROM passes p
    JOIN orders o ON o.id = p.orderId
    WHERE o.deviceId = ? AND o.status = 'paid'
    ORDER BY p.createdAt DESC
  `, deviceId);

  const history = [];
  for (const row of rows) {
    const plan = JSON.parse(row.planJson);
    const purchaseDate = new Date(row.orderCreatedAt || row.passCreatedAt).toLocaleString('th-TH', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    const coupons = await db.all('SELECT used FROM coupons WHERE passId = ?', row.id);
    const checkins = await db.get('SELECT COUNT(*) AS total FROM checkins WHERE passId = ?', row.id);
    history.push({
      id: row.id,
      passId: row.id,
      orderId: row.orderId,
      code: row.code,
      status: row.status === 'active' && row.validDate < bangkokDate() ? 'expired' : row.status,
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
      isDemo: Boolean(row.isDemo),
      pointsEarned: Math.max(10, Math.round(row.amount * 0.05)),
      placesCount: plan.items?.length || 0,
      couponsCount: coupons.length,
      couponsUsed: coupons.filter((coupon) => coupon.used).length,
      checkinsCount: Number(checkins.total) || 0,
      plan
    });
  }
  return res.json({ history });
  } catch (error) {
    return next(error);
  }
});

router.get('/:passId', async (req, res, next) => {
  try {
  const pass = await db.get(`SELECT p.*, o.id AS orderId, o.planJson, o.people,
    o.amount, o.discount, o.pointsUsed, o.isDemo, o.createdAt AS orderCreatedAt
    FROM passes p
    JOIN orders o ON o.id = p.orderId WHERE p.id = ?`, req.params.passId);
  if (!pass) return res.status(404).json({ error: 'ไม่พบพาสนี้' });
  const coupons = (await db.all('SELECT id, shopId, title, used FROM coupons WHERE passId = ? ORDER BY id', pass.id))
    .map((coupon) => ({ ...coupon, used: Boolean(coupon.used) }));
  const checkins = await db.all('SELECT shopId, at FROM checkins WHERE passId = ? ORDER BY at', pass.id);
  const unlockedMissionIds = (await db.all(`SELECT DISTINCT 'm-' || s.id AS missionId
    FROM checkins c JOIN shops s ON s.id = c.shopId
    WHERE c.passId = ? AND s.missionJson IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM mission_submissions ms WHERE ms.passId = c.passId AND ms.missionId = 'm-' || s.id
    )`, pass.id)).map((row) => row.missionId);
  const completedMissionIds = (await db.all('SELECT missionId FROM mission_submissions WHERE passId = ?', pass.id))
    .map((row) => row.missionId);
  const status = pass.status === 'active' && pass.validDate < bangkokDate() ? 'expired' : pass.status;
  return res.json({ id: pass.id, code: pass.code, status, isDemo: Boolean(pass.isDemo), validDate: pass.validDate,
    people: pass.people, plan: JSON.parse(pass.planJson), coupons, checkins, unlockedMissionIds, completedMissionIds,
    purchase: {
      orderId: pass.orderId,
      amount: pass.amount,
      discount: pass.discount,
      pointsUsed: pass.pointsUsed,
      purchasedAt: pass.orderCreatedAt
    } });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
