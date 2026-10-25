const crypto = require('node:crypto');
const express = require('express');
const db = require('../db');
const { distanceM } = require('../lib/haversine');
const { bangkokDate } = require('../lib/dates');
const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
  const { passId, shopId, deviceId, lat, lng, simulate = false } = req.body || {};
  if (typeof passId !== 'string' || !passId || typeof shopId !== 'string' || !shopId || typeof deviceId !== 'string' || !deviceId.trim() || deviceId.length > 128) return res.status(400).json({ error: 'กรุณาระบุ passId, shopId และ deviceId' });
  if (typeof lat !== 'number' || !Number.isFinite(lat) || lat < -90 || lat > 90 || typeof lng !== 'number' || !Number.isFinite(lng) || lng < -180 || lng > 180) return res.status(400).json({ error: 'พิกัด lat/lng ไม่ถูกต้อง' });
  if (typeof simulate !== 'boolean') return res.status(400).json({ error: 'simulate ต้องเป็น true หรือ false' });
  if (simulate && process.env.DEMO_MODE !== 'true') return res.status(403).json({ error: 'โหมดจำลองใช้ได้เมื่อ DEMO_MODE=true เท่านั้น' });
  const pass = await db.get(`
    SELECT p.id, p.validDate, o.deviceId
    FROM passes p JOIN orders o ON o.id = p.orderId
    WHERE p.id = ? AND p.status = 'active'
  `, passId);
  if (!pass) return res.status(404).json({ error: 'ไม่พบพาสที่ใช้งานได้' });
  if (pass.deviceId !== deviceId) return res.status(403).json({ error: 'พาสนี้ไม่ได้เป็นของบัญชีที่กำลังใช้งาน' });
  if (pass.validDate !== bangkokDate()) return res.status(410).json({ error: 'พาสนี้หมดอายุแล้ว ใช้เช็กอินได้เฉพาะวันที่ระบุบนพาส' });
  const planRow = await db.get('SELECT o.planJson, o.deviceId FROM orders o JOIN passes p ON p.orderId = o.id WHERE p.id = ?', passId);
  let plan;
  try { plan = JSON.parse(planRow.planJson); } catch { return res.status(500).json({ error: 'ข้อมูลแผนในพาสเสียหาย' }); }
  if (!Array.isArray(plan.items) || !plan.items.some((item) => item.shopId === shopId)) return res.status(403).json({ error: 'ร้านนี้ไม่ได้อยู่ในแผนของพาส' });
  const shop = await db.get('SELECT id, lat, lng, missionJson FROM shops WHERE id = ?', shopId);
  if (!shop) return res.status(404).json({ error: 'ไม่พบร้านนี้ในระบบ' });
  const distance = distanceM(lat, lng, shop.lat, shop.lng);
  if (!simulate && distance > 150) return res.status(403).json({ error: 'อยู่ห่างจากร้านเกิน 150 เมตร', distanceM: Math.round(distance) });
  const at = new Date().toISOString();
  let totalPoints = 0;
  await db.transaction(async () => {
    const inserted = await db.run(`
      INSERT INTO checkins (id, passId, shopId, lat, lng, at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(passId, shopId) DO NOTHING
    `, `ci_${crypto.randomUUID()}`, passId, shopId, lat, lng, at);
    if (inserted.changes !== 1) throw new Error('CHECKIN_ALREADY_RECORDED');
    await db.run(`
      INSERT INTO points_ledger (id, deviceId, delta, reason, at)
      VALUES (?, ?, 3, ?, ?)
    `, `pt_${crypto.randomUUID()}`, planRow.deviceId, `แต้มสะสมจากการเช็กอิน ${shopId}`, at);
    const balance = await db.get(
      'SELECT COALESCE(SUM(delta), 0) AS total FROM points_ledger WHERE deviceId = ?', planRow.deviceId
    );
    totalPoints = Math.max(0, Number(balance?.total) || 0);
  });
  const unlockedMissionIds = shop.missionJson && !await db.get('SELECT 1 FROM mission_submissions WHERE passId = ? AND missionId = ?', passId, `m-${shopId}`)
    ? [`m-${shopId}`] : [];
  return res.json({ ok: true, distanceM: Math.round(distance), unlockedMissionIds, pointsAwarded: 3, totalPoints });
  } catch (error) {
    if (error.message === 'CHECKIN_ALREADY_RECORDED') return res.status(409).json({ error: 'เช็กอินร้านนี้แล้ว' });
    return next(error);
  }
});

module.exports = router;
