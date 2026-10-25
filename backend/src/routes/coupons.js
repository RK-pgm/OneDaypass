const express = require('express');
const db = require('../db');
const { bangkokDate } = require('../lib/dates');
const router = express.Router();

router.post('/:couponId/redeem', async (req, res, next) => {
  try {
  const { passId, deviceId } = req.body || {};
  if (typeof passId !== 'string' || !passId || typeof deviceId !== 'string' || !deviceId.trim() || deviceId.length > 128) return res.status(400).json({ error: 'กรุณาระบุ passId และ deviceId' });
  const coupon = await db.get(`
    SELECT c.id, c.used, p.status AS passStatus, p.validDate, o.deviceId, s.isDemo AS shopIsDemo
    FROM coupons c
    JOIN passes p ON p.id = c.passId
    JOIN orders o ON o.id = p.orderId
    LEFT JOIN shops s ON s.id = c.shopId
    WHERE c.id = ? AND c.passId = ?
  `, req.params.couponId, passId);
  if (!coupon) return res.status(404).json({ error: 'ไม่พบคูปองในพาสนี้' });
  if (coupon.deviceId !== deviceId) return res.status(403).json({ error: 'คูปองนี้ไม่ได้เป็นของบัญชีที่กำลังใช้งาน' });
  if (coupon.shopIsDemo) return res.status(409).json({ error: 'คูปองตัวอย่างนี้ใช้สิทธิ์กับร้านค้าจริงไม่ได้' });
  if (coupon.passStatus !== 'active' || coupon.validDate !== bangkokDate()) {
    return res.status(410).json({ error: 'พาสนี้หมดอายุแล้ว ไม่สามารถใช้คูปองได้' });
  }
  if (coupon.used) return res.status(409).json({ error: 'คูปองนี้ถูกใช้ไปแล้ว' });
  const redeemedAt = new Date().toISOString();
  const result = await db.run('UPDATE coupons SET used = 1, redeemedAt = ? WHERE id = ? AND passId = ? AND used = 0',
    redeemedAt, coupon.id, passId);
  if (result.changes !== 1) return res.status(409).json({ error: 'คูปองนี้ถูกใช้ไปแล้ว' });
  return res.json({ ok: true, redeemedAt });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
