const crypto = require('node:crypto');
const express = require('express');
const db = require('../db');
const { distanceM } = require('../lib/haversine');
const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
  const { passId, shopId, lat, lng, simulate = false } = req.body || {};
  if (typeof passId !== 'string' || !passId || typeof shopId !== 'string' || !shopId) return res.status(400).json({ error: 'กรุณาระบุ passId และ shopId' });
  if (typeof lat !== 'number' || !Number.isFinite(lat) || lat < -90 || lat > 90 || typeof lng !== 'number' || !Number.isFinite(lng) || lng < -180 || lng > 180) return res.status(400).json({ error: 'พิกัด lat/lng ไม่ถูกต้อง' });
  if (typeof simulate !== 'boolean') return res.status(400).json({ error: 'simulate ต้องเป็น true หรือ false' });
  if (simulate && process.env.DEMO_MODE !== 'true') return res.status(403).json({ error: 'โหมดจำลองใช้ได้เมื่อ DEMO_MODE=true เท่านั้น' });
  const pass = await db.get("SELECT id FROM passes WHERE id = ? AND status = 'active'", passId);
  if (!pass) return res.status(404).json({ error: 'ไม่พบพาสที่ใช้งานได้' });
  const planRow = await db.get('SELECT o.planJson FROM orders o JOIN passes p ON p.orderId = o.id WHERE p.id = ?', passId);
  let plan;
  try { plan = JSON.parse(planRow.planJson); } catch { return res.status(500).json({ error: 'ข้อมูลแผนในพาสเสียหาย' }); }
  if (!Array.isArray(plan.items) || !plan.items.some((item) => item.shopId === shopId)) return res.status(403).json({ error: 'ร้านนี้ไม่ได้อยู่ในแผนของพาส' });
  const shop = await db.get('SELECT id, lat, lng, missionJson FROM shops WHERE id = ?', shopId);
  if (!shop) return res.status(404).json({ error: 'ไม่พบร้านนี้ในระบบ' });
  const distance = distanceM(lat, lng, shop.lat, shop.lng);
  if (!simulate && distance > 150) return res.status(403).json({ error: 'อยู่ห่างจากร้านเกิน 150 เมตร', distanceM: Math.round(distance) });
  if (await db.get('SELECT 1 FROM checkins WHERE passId = ? AND shopId = ?', passId, shopId)) return res.status(409).json({ error: 'เช็กอินร้านนี้แล้ว' });
  await db.run('INSERT INTO checkins (id, passId, shopId, lat, lng, at) VALUES (?, ?, ?, ?, ?, ?)',
    `ci_${crypto.randomUUID()}`, passId, shopId, lat, lng, new Date().toISOString());
  const unlockedMissionIds = shop.missionJson && !await db.get('SELECT 1 FROM mission_submissions WHERE passId = ? AND missionId = ?', passId, `m-${shopId}`)
    ? [`m-${shopId}`] : [];
  return res.json({ ok: true, distanceM: Math.round(distance), unlockedMissionIds });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
