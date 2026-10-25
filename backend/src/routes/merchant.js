const crypto = require('node:crypto');
const { promisify } = require('node:util');
const express = require('express');
const db = require('../db');
const { bangkokDate } = require('../lib/dates');

const router = express.Router();
const scrypt = promisify(crypto.scrypt);
const PASSWORD_BYTES = 64;
const SESSION_DAYS = 7;

function publicMerchant(row) {
  return {
    id: row.id,
    shopId: row.shopId,
    shopName: row.shopName,
    district: row.district,
    ownerName: row.ownerName,
  };
}

async function createSession(merchantId) {
  const token = crypto.randomBytes(32).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await db.run(
    'INSERT INTO merchant_sessions (tokenHash, merchantId, expiresAt) VALUES (?, ?, ?)',
    tokenHash, merchantId, expiresAt
  );
  return { token, expiresAt };
}

async function requireMerchant(req, res, next) {
  const authorization = req.get('authorization') || '';
  const match = /^Bearer ([A-Za-z0-9_-]{40,})$/.exec(authorization);
  if (!match) return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบร้านค้าก่อน' });

  try {
    const tokenHash = crypto.createHash('sha256').update(match[1]).digest('hex');
    const row = await db.get(`
      SELECT ms.tokenHash, ma.id, ma.shopId, ma.ownerName, s.name AS shopName, s.district
      FROM merchant_sessions ms
      JOIN merchant_accounts ma ON ma.id = ms.merchantId
      JOIN shops s ON s.id = ma.shopId
      WHERE ms.tokenHash = ? AND ms.expiresAt > ?
    `, tokenHash, new Date().toISOString());
    if (!row) return res.status(401).json({ error: 'เซสชันร้านค้าหมดอายุ กรุณาเข้าสู่ระบบใหม่' });
    req.merchant = { ...publicMerchant(row), tokenHash: row.tokenHash };
    return next();
  } catch (error) {
    return next(error);
  }
}

router.get('/eligible-shops', async (_req, res, next) => {
  try {
    const shops = await db.all(`
      SELECT id, name, district
      FROM shops
      WHERE couponJson IS NOT NULL AND isDemo = 0
      ORDER BY district, name
    `);
    return res.json({ shops });
  } catch (error) {
    return next(error);
  }
});

router.post('/register', async (req, res, next) => {
  try {
    const { shopName, ownerName, phone, address, password } = req.body || {};
    if (typeof shopName !== 'string' || !shopName.trim() || shopName.trim().length > 160) {
      return res.status(400).json({ error: 'กรุณาเลือกร้านค้าที่ร่วมรายการ' });
    }
    if (typeof ownerName !== 'string' || !ownerName.trim() || ownerName.trim().length > 120) {
      return res.status(400).json({ error: 'กรุณากรอกชื่อเจ้าของร้าน' });
    }
    if (typeof phone !== 'string' || !/^\+?[0-9\s()-]{8,20}$/.test(phone.trim())) {
      return res.status(400).json({ error: 'กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง' });
    }
    if (typeof address !== 'string' || !address.trim() || address.trim().length > 300) {
      return res.status(400).json({ error: 'กรุณากรอกที่อยู่ร้านให้ถูกต้อง' });
    }
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return res.status(400).json({ error: 'รหัสผ่านต้องมีความยาว 8-128 ตัวอักษร' });
    }

    const shop = await db.get(`
      SELECT id, name FROM shops
      WHERE name = ? AND couponJson IS NOT NULL AND isDemo = 0
    `, shopName.trim());
    if (!shop) {
      return res.status(400).json({ error: 'ร้านนี้ยังไม่มีคูปองในรายการร้านที่ร่วมสิทธิ์' });
    }
    if (await db.get('SELECT id FROM merchant_accounts WHERE shopId = ?', shop.id)) {
      return res.status(409).json({ error: 'ร้านนี้มีบัญชีแล้ว กรุณาเข้าสู่ระบบ' });
    }

    const id = `merchant_${crypto.randomUUID()}`;
    const salt = crypto.randomBytes(16);
    const passwordHash = await scrypt(password, salt, PASSWORD_BYTES);
    const createdAt = new Date().toISOString();
    await db.run(`
      INSERT INTO merchant_accounts
        (id, shopId, ownerName, phone, address, passwordSalt, passwordHash, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, id, shop.id, ownerName.trim(), phone.trim(), address.trim(),
    salt.toString('hex'), passwordHash.toString('hex'), createdAt);

    const merchant = await db.get(`
      SELECT ma.id, ma.shopId, ma.ownerName, s.name AS shopName, s.district
      FROM merchant_accounts ma JOIN shops s ON s.id = ma.shopId
      WHERE ma.id = ?
    `, id);
    const session = await createSession(id);
    return res.status(201).json({ ok: true, ...session, merchant: publicMerchant(merchant) });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.code === '23505') {
      return res.status(409).json({ error: 'ร้านนี้มีบัญชีแล้ว กรุณาเข้าสู่ระบบ' });
    }
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { shopName, password } = req.body || {};
    if (typeof shopName !== 'string' || !shopName.trim() || shopName.trim().length > 160 ||
      typeof password !== 'string' || !password || password.length > 128) {
      return res.status(400).json({ error: 'กรุณากรอกชื่อร้านและรหัสผ่าน' });
    }

    const row = await db.get(`
      SELECT ma.id, ma.shopId, ma.passwordSalt, ma.passwordHash, ma.ownerName,
        s.name AS shopName, s.district
      FROM merchant_accounts ma JOIN shops s ON s.id = ma.shopId
      WHERE s.name = ?
    `, shopName.trim());
    if (!row) return res.status(401).json({ error: 'ชื่อร้านหรือรหัสผ่านไม่ถูกต้อง' });

    const candidate = await scrypt(password, Buffer.from(row.passwordSalt, 'hex'), PASSWORD_BYTES);
    const expected = Buffer.from(row.passwordHash, 'hex');
    if (candidate.length !== expected.length || !crypto.timingSafeEqual(candidate, expected)) {
      return res.status(401).json({ error: 'ชื่อร้านหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const session = await createSession(row.id);
    return res.json({ ok: true, ...session, merchant: publicMerchant(row) });
  } catch (error) {
    return next(error);
  }
});

router.get('/me', requireMerchant, (req, res) => {
  return res.json({ merchant: publicMerchant(req.merchant) });
});

router.post('/logout', requireMerchant, async (req, res, next) => {
  try {
    await db.run('DELETE FROM merchant_sessions WHERE tokenHash = ?', req.merchant.tokenHash);
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.post('/passes/lookup', requireMerchant, async (req, res, next) => {
  try {
    const passCode = typeof req.body?.passCode === 'string' ? req.body.passCode.trim().toUpperCase() : '';
    if (!/^DP-[A-Z0-9]{5}$/.test(passCode)) {
      return res.status(400).json({ error: 'กรุณาสแกนหรือกรอกรหัสพาสให้ถูกต้อง' });
    }

    const pass = await db.get(`
      SELECT p.id, p.code, p.status, p.validDate, o.planJson, o.people, o.isDemo
      FROM passes p
      JOIN orders o ON o.id = p.orderId
      WHERE p.code = ? AND o.status = 'paid'
    `, passCode);
    if (!pass) return res.status(404).json({ error: 'ไม่พบพาสที่ชำระเงินแล้ว' });
    if (pass.status !== 'active' || pass.validDate !== bangkokDate()) {
      return res.status(410).json({ error: 'พาสนี้หมดอายุหรือไม่สามารถใช้งานได้แล้ว' });
    }

    const coupons = await db.all(`
      SELECT id, title, used
      FROM coupons
      WHERE passId = ? AND shopId = ?
      ORDER BY id
    `, pass.id, req.merchant.shopId);
    if (coupons.length === 0) {
      return res.status(404).json({ error: 'พาสนี้ไม่มีคูปองของร้านคุณ' });
    }

    const plan = JSON.parse(pass.planJson);
    return res.json({
      pass: {
        id: pass.id,
        code: pass.code,
        status: pass.status,
        validDate: pass.validDate,
        people: pass.people,
        isDemo: Boolean(pass.isDemo),
        title: plan.title || 'พาส OneDaypass',
      },
      coupons: coupons.map((coupon) => ({ ...coupon, used: Boolean(coupon.used) })),
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/coupons/:couponId/redeem', requireMerchant, async (req, res, next) => {
  try {
    const coupon = await db.get(`
      SELECT c.id, c.used, p.id AS passId, p.status AS passStatus, p.validDate
      FROM coupons c
      JOIN passes p ON p.id = c.passId
      JOIN orders o ON o.id = p.orderId
      JOIN shops s ON s.id = c.shopId
      WHERE c.id = ? AND c.shopId = ? AND o.status = 'paid'
    `, req.params.couponId, req.merchant.shopId);
    if (!coupon) return res.status(404).json({ error: 'ไม่พบคูปองของร้านคุณ' });
    if (coupon.passStatus !== 'active' || coupon.validDate !== bangkokDate()) {
      return res.status(410).json({ error: 'พาสนี้หมดอายุหรือไม่สามารถใช้งานได้แล้ว' });
    }
    if (coupon.used) return res.status(409).json({ error: 'คูปองนี้ถูกใช้ไปแล้ว' });

    const redeemedAt = new Date().toISOString();
    const result = await db.run(
      'UPDATE coupons SET used = 1, redeemedAt = ? WHERE id = ? AND passId = ? AND shopId = ? AND used = 0',
      redeemedAt, coupon.id, coupon.passId, req.merchant.shopId
    );
    if (result.changes !== 1) return res.status(409).json({ error: 'คูปองนี้ถูกใช้ไปแล้ว' });
    return res.json({ ok: true, redeemedAt });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
