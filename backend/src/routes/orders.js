const crypto = require('node:crypto');
const express = require('express');
const promptpay = require('promptpay-qr');
const QRCode = require('qrcode');
const db = require('../db');

const router = express.Router();
const POINT_BAHT = 2;
const balanceFor = (deviceId) => Math.max(0, db.prepare(
  'SELECT COALESCE(SUM(delta), 0) AS total FROM points_ledger WHERE deviceId = ?'
).get(deviceId).total);

function passCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return `DP-${Array.from(crypto.randomBytes(5), (b) => alphabet[b % alphabet.length]).join('')}`;
}

function bangkokDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
}

router.post('/', async (req, res, next) => {
  try {
    const { deviceId, plan, people, usePoints = 0 } = req.body || {};
    if (typeof deviceId !== 'string' || !deviceId.trim() || deviceId.length > 128) return res.status(400).json({ error: 'กรุณาระบุ deviceId' });
    if (!plan || !Array.isArray(plan.items) || !Number.isFinite(plan.totalCostPerPerson) || plan.totalCostPerPerson <= 0) return res.status(400).json({ error: 'ข้อมูลแผนเที่ยวไม่ถูกต้อง' });
    if (!Number.isInteger(people) || people < 1 || people > 20) return res.status(400).json({ error: 'จำนวนคนต้องอยู่ระหว่าง 1 ถึง 20' });
    if (!Number.isInteger(usePoints) || usePoints < 0) return res.status(400).json({ error: 'จำนวนแต้มที่ใช้ไม่ถูกต้อง' });
    const promptpayId = process.env.PROMPTPAY_ID;
    if (!promptpayId) return res.status(503).json({ error: 'ยังไม่ได้ตั้งค่า PROMPTPAY_ID ในไฟล์ .env' });

    const subtotal = Math.round(plan.totalCostPerPerson * people);
    const pointsBalance = balanceFor(deviceId);
    if (usePoints > pointsBalance) return res.status(400).json({ error: 'แต้มของคุณไม่เพียงพอ' });
    const pointsUsed = Math.min(usePoints, Math.floor(Math.floor(subtotal * 0.3) / POINT_BAHT));
    const discount = pointsUsed * POINT_BAHT;
    const amount = subtotal - discount;
    const orderId = `o_${crypto.randomUUID()}`;
    const payload = promptpay(promptpayId, { amount });
    const qrDataUrl = await QRCode.toDataURL(payload, { errorCorrectionLevel: 'M', margin: 2, width: 320 });
    db.prepare(`INSERT INTO orders (id, deviceId, planJson, people, amount, discount, pointsUsed, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`).run(
      orderId, deviceId, JSON.stringify(plan), people, amount, discount, pointsUsed
    );
    return res.status(201).json({ orderId, amount, discount, status: 'pending', promptpayPayload: payload, qrDataUrl });
  } catch (error) { return next(error); }
});

router.post('/:orderId/confirm', (req, res, next) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'ไม่พบคำสั่งซื้อนี้' });
    const existingPass = db.prepare('SELECT id FROM passes WHERE orderId = ?').get(order.id);
    if (existingPass) return res.json({ passId: existingPass.id, status: 'paid' });
    if (order.status !== 'pending') return res.status(409).json({ error: 'คำสั่งซื้อนี้ไม่อยู่ในสถานะรอชำระเงิน' });

    const plan = JSON.parse(order.planJson);
    const passId = `p_${crypto.randomUUID()}`;
    let code = passCode();
    while (db.prepare('SELECT 1 FROM passes WHERE code = ?').get(code)) code = passCode();
    const now = new Date().toISOString();
    db.transaction(() => {
      const update = db.prepare("UPDATE orders SET status = 'paid' WHERE id = ? AND status = 'pending'").run(order.id);
      if (update.changes !== 1) throw new Error('ORDER_ALREADY_CONFIRMED');
      db.prepare('INSERT INTO passes (id, orderId, code, status, validDate) VALUES (?, ?, ?, ?, ?)')
        .run(passId, order.id, code, 'active', bangkokDate());
      const insertCoupon = db.prepare('INSERT OR IGNORE INTO coupons (id, passId, shopId, title) VALUES (?, ?, ?, ?)');
      for (const item of plan.items) {
        if (typeof item?.shopId === 'string' && typeof item?.coupon?.title === 'string' && item.coupon.title.trim()) {
          insertCoupon.run(`c_${passId}_${item.shopId}`, passId, item.shopId, item.coupon.title.trim());
        }
      }
      if (order.pointsUsed > 0) {
        if (balanceFor(order.deviceId) < order.pointsUsed) throw new Error('POINTS_BALANCE_CHANGED');
        db.prepare('INSERT INTO points_ledger (id, deviceId, delta, reason, at) VALUES (?, ?, ?, ?, ?)')
          .run(`pt_${crypto.randomUUID()}`, order.deviceId, -order.pointsUsed, `ใช้แต้มกับออเดอร์ ${order.id}`, now);
      }
    })();
    return res.json({ passId, status: 'paid' });
  } catch (error) {
    if (error.message === 'POINTS_BALANCE_CHANGED') return res.status(409).json({ error: 'แต้มเปลี่ยนแปลงระหว่างทำรายการ กรุณาสร้างคำสั่งซื้อใหม่' });
    if (error.message === 'ORDER_ALREADY_CONFIRMED') return res.status(409).json({ error: 'คำสั่งซื้อนี้ได้รับการยืนยันแล้ว' });
    return next(error);
  }
});

module.exports = router;
