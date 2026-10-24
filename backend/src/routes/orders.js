const crypto = require('node:crypto');
const express = require('express');
const db = require('../db');
const { calcPointsDiscount } = require('../lib/pointsDiscount');

const router = express.Router();
const TRAVEL_STYLES = new Set(['chill', 'cafe', 'foodie', 'photo', 'art', 'heritage', 'challenge', 'night']);
async function balanceFor(deviceId) {
  const row = await db.get(
    'SELECT COALESCE(SUM(delta), 0) AS total FROM points_ledger WHERE deviceId = ?', deviceId
  );
  return Math.max(0, Number(row.total) || 0);
}

function passCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return `DP-${Array.from(crypto.randomBytes(5), (b) => alphabet[b % alphabet.length]).join('')}`;
}

function bangkokDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
}

async function findShopsForPlan(items) {
  if (!Array.isArray(items) || items.length < 1 || items.length > 12) return null;
  const shopIds = items.map((item) => item?.shopId);
  if (shopIds.some((id) => typeof id !== 'string' || !id.trim()) || new Set(shopIds).size !== shopIds.length) return null;

  const placeholders = shopIds.map(() => '?').join(',');
  const rows = await db.all(`SELECT * FROM shops WHERE id IN (${placeholders})`, ...shopIds);
  if (rows.length !== shopIds.length) return null;
  const demoGenerated = rows.some((row) => Boolean(row.isDemo));

  const byId = new Map(rows.map((row) => [row.id, row]));
  const planItems = items.map((item, index) => {
    const shop = byId.get(item.shopId);
    const coupon = shop.couponJson ? JSON.parse(shop.couponJson) : null;
    const mission = shop.missionJson ? JSON.parse(shop.missionJson) : null;
    return {
      order: index + 1,
      time: typeof item.time === 'string' ? item.time : '',
      shopId: shop.id,
      shopName: shop.name,
      category: shop.category,
      lat: shop.lat,
      lng: shop.lng,
      activity: typeof item.activity === 'string' ? item.activity : shop.recommendedMenu || shop.name,
      estCost: shop.avgPrice,
      durationMin: shop.durationMin,
      distanceFromPrevKm: Number.isFinite(item.distanceFromPrevKm) ? item.distanceFromPrevKm : 0,
      coupon: coupon ? { id: `c-${shop.id}`, title: coupon.title, valueText: coupon.valueText || '' } : null,
      mission: mission ? { id: `m-${shop.id}`, title: mission.title, points: mission.points || 5 } : null
    };
  });

  return {
    title: typeof items.title === 'string' ? items.title : 'แผนเที่ยว DayPass',
    style: ['chill', 'challenge'].includes(items.style) ? items.style : 'chill',
    ...(demoGenerated ? { demoGenerated: true } : {}),
    items: planItems,
    totalCostPerPerson: planItems.reduce((sum, item) => sum + item.estCost, 0)
  };
}

router.post('/', async (req, res, next) => {
  try {
    const { deviceId, plan, people, usePoints = 0 } = req.body || {};
    if (typeof deviceId !== 'string' || !deviceId.trim() || deviceId.length > 128) return res.status(400).json({ error: 'กรุณาระบุ deviceId' });
    if (!plan || !Array.isArray(plan.items)) return res.status(400).json({ error: 'ข้อมูลแผนเที่ยวไม่ถูกต้อง' });
    if (!Number.isInteger(people) || people < 1 || people > 20) return res.status(400).json({ error: 'จำนวนคนต้องอยู่ระหว่าง 1 ถึง 20' });
    if (!Number.isInteger(usePoints) || usePoints < 0) return res.status(400).json({ error: 'จำนวนแต้มที่ใช้ไม่ถูกต้อง' });
    const trustedPlan = await findShopsForPlan(plan.items);
    if (!trustedPlan) return res.status(400).json({ error: 'แผนมีร้านซ้ำ หรือมีร้านที่ไม่อยู่ในระบบ' });
    trustedPlan.title = typeof plan.title === 'string' ? plan.title : trustedPlan.title;
    trustedPlan.style = TRAVEL_STYLES.has(plan.style) ? plan.style : 'chill';
    for (const field of ['districtId', 'districtName', 'provinceId', 'provinceName']) {
      if (typeof plan[field] === 'string' && plan[field].length <= 120) trustedPlan[field] = plan[field];
    }
    if (plan.selectedPackage && typeof plan.selectedPackage === 'object') {
      trustedPlan.selectedPackage = Object.fromEntries(
        ['id', 'title', 'badge', 'transitAdvice']
          .filter((field) => typeof plan.selectedPackage[field] === 'string')
          .map((field) => [field, plan.selectedPackage[field].slice(0, 200)])
      );
    }
    const subtotal = Math.round(trustedPlan.totalCostPerPerson * people);
    if (subtotal <= 0) return res.status(400).json({ error: 'แผนเที่ยวนี้ไม่มีค่าใช้จ่าย ไม่สามารถสร้างคำสั่งซื้อได้' });
    const pointsBalance = await balanceFor(deviceId);
    if (usePoints > pointsBalance) return res.status(400).json({ error: 'แต้มของคุณไม่เพียงพอ' });
    const isDemo = true;
    const discount = calcPointsDiscount(pointsBalance, usePoints, subtotal);
    const quote = {
      amount: discount.finalAmount,
      discount: discount.discountBaht,
      pointsUsed: discount.pointsDeducted,
      qrDataUrl: null,
      promptpayPayload: null,
    };
    const orderId = `o_${crypto.randomUUID()}`;
    await db.run(`INSERT INTO orders (id, deviceId, planJson, people, amount, discount, pointsUsed, isDemo, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      orderId, deviceId, JSON.stringify({ ...trustedPlan, demoGenerated: isDemo || undefined }),
      people, quote.amount, quote.discount, quote.pointsUsed, Number(isDemo)
    );
    return res.status(201).json({ orderId, ...quote, isDemo, status: 'pending' });
  } catch (error) { return next(error); }
});

router.post('/:orderId/points', async (req, res, next) => {
  try {
    const { deviceId, usePoints } = req.body || {};
    if (typeof deviceId !== 'string' || !deviceId.trim() || deviceId.length > 128) return res.status(400).json({ error: 'กรุณาระบุ deviceId' });
    if (!Number.isInteger(usePoints) || usePoints < 0) return res.status(400).json({ error: 'จำนวนแต้มที่ใช้ไม่ถูกต้อง' });

    const order = await db.get('SELECT * FROM orders WHERE id = ?', req.params.orderId);
    if (!order) return res.status(404).json({ error: 'ไม่พบคำสั่งซื้อนี้' });
    if (order.deviceId !== deviceId) return res.status(403).json({ error: 'ไม่มีสิทธิ์แก้ไขคำสั่งซื้อนี้' });
    if (order.status !== 'pending') return res.status(409).json({ error: 'แก้ไขส่วนลดได้เฉพาะคำสั่งซื้อที่รอชำระเงิน' });

    const pointsBalance = await balanceFor(deviceId);
    if (usePoints > pointsBalance) return res.status(400).json({ error: 'แต้มของคุณไม่เพียงพอ' });
    const subtotal = order.amount + order.discount;
    const discount = calcPointsDiscount(pointsBalance, usePoints, subtotal);
    const quote = {
      amount: discount.finalAmount,
      discount: discount.discountBaht,
      pointsUsed: discount.pointsDeducted,
      qrDataUrl: null,
      promptpayPayload: null,
    };
    const updated = await db.run(`UPDATE orders SET amount = ?, discount = ?, pointsUsed = ?
      WHERE id = ? AND status = 'pending'`, quote.amount, quote.discount, quote.pointsUsed, order.id);
    if (updated.changes !== 1) return res.status(409).json({ error: 'คำสั่งซื้อเปลี่ยนสถานะแล้ว กรุณาโหลดหน้าใหม่' });
    return res.json({ orderId: order.id, ...quote, isDemo: Boolean(order.isDemo), status: 'pending' });
  } catch (error) { return next(error); }
});

router.post('/:orderId/confirm', async (req, res, next) => {
  try {
    const order = await db.get('SELECT * FROM orders WHERE id = ?', req.params.orderId);
    if (!order) return res.status(404).json({ error: 'ไม่พบคำสั่งซื้อนี้' });
    if (!order.isDemo && (process.env.NODE_ENV === 'production' || process.env.DEMO_MODE !== 'true')) {
      return res.status(503).json({ error: 'ระบบยืนยันการชำระเงินจริงยังไม่พร้อมใช้งาน กรุณาติดต่อผู้ดูแลระบบ' });
    }
    const existingPass = await db.get('SELECT id FROM passes WHERE orderId = ?', order.id);
    if (existingPass) return res.json({ passId: existingPass.id, status: 'paid' });
    if (order.status !== 'pending') return res.status(409).json({ error: 'คำสั่งซื้อนี้ไม่อยู่ในสถานะรอชำระเงิน' });

    const plan = JSON.parse(order.planJson);
    const passId = `p_${crypto.randomUUID()}`;
    let code = passCode();
    while (await db.get('SELECT 1 FROM passes WHERE code = ?', code)) code = passCode();
    const now = new Date().toISOString();
    const pointsEarned = Math.max(10, Math.round(order.amount * 0.05));
    await db.transaction(async () => {
      const update = await db.run("UPDATE orders SET status = 'paid' WHERE id = ? AND status = 'pending'", order.id);
      if (update.changes !== 1) throw new Error('ORDER_ALREADY_CONFIRMED');
      await db.run('INSERT INTO passes (id, orderId, code, status, validDate) VALUES (?, ?, ?, ?, ?)',
        passId, order.id, code, 'active', bangkokDate());
      for (const item of plan.items) {
        if (typeof item?.shopId === 'string' && typeof item?.coupon?.title === 'string' && item.coupon.title.trim()) {
          await db.run(`INSERT INTO coupons (id, passId, shopId, title) VALUES (?, ?, ?, ?)
            ON CONFLICT DO NOTHING`, `c_${passId}_${item.shopId}`, passId, item.shopId, item.coupon.title.trim());
        }
      }
      if (order.pointsUsed > 0) {
        if (await balanceFor(order.deviceId) < order.pointsUsed) throw new Error('POINTS_BALANCE_CHANGED');
        await db.run('INSERT INTO points_ledger (id, deviceId, delta, reason, at) VALUES (?, ?, ?, ?, ?)',
          `pt_${crypto.randomUUID()}`, order.deviceId, -order.pointsUsed, `ใช้แต้มกับออเดอร์ ${order.id}`, now);
      }
      await db.run('INSERT INTO points_ledger (id, deviceId, delta, reason, at) VALUES (?, ?, ?, ?, ?)',
        `pt_${crypto.randomUUID()}`, order.deviceId, pointsEarned,
        `แต้มสะสมจากการซื้อ ${plan.selectedPackage?.title || 'พาส OneDaypass'}`, now);
    });
    return res.json({ passId, status: 'paid', pointsEarned });
  } catch (error) {
    if (error.message === 'POINTS_BALANCE_CHANGED') return res.status(409).json({ error: 'แต้มเปลี่ยนแปลงระหว่างทำรายการ กรุณาสร้างคำสั่งซื้อใหม่' });
    if (error.message === 'ORDER_ALREADY_CONFIRMED') return res.status(409).json({ error: 'คำสั่งซื้อนี้ได้รับการยืนยันแล้ว' });
    return next(error);
  }
});

module.exports = router;
