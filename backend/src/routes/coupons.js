const express = require('express');
const db = require('../db');
const router = express.Router();

router.post('/:couponId/redeem', async (req, res, next) => {
  try {
  const { passId } = req.body || {};
  if (typeof passId !== 'string' || !passId) return res.status(400).json({ error: 'กรุณาระบุ passId' });
  const coupon = await db.get('SELECT id, used FROM coupons WHERE id = ? AND passId = ?', req.params.couponId, passId);
  if (!coupon) return res.status(404).json({ error: 'ไม่พบคูปองในพาสนี้' });
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
