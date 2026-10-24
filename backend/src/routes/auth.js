const crypto = require('node:crypto');
const { promisify } = require('node:util');
const express = require('express');
const db = require('../db');

const router = express.Router();
const scrypt = promisify(crypto.scrypt);
const PASSWORD_BYTES = 64;

function normalizeLogin(value) {
  const trimmed = value.trim();
  return trimmed.includes('@')
    ? trimmed.toLowerCase()
    : trimmed.replace(/[\s()-]/g, '');
}

function isValidLogin(value) {
  const normalized = normalizeLogin(value);
  if (normalized.includes('@')) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
  return /^\+?\d{8,15}$/.test(normalized);
}

function isValidEmail(value) {
  return typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidDateOfBirth(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value &&
    date <= new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
}

function isValidProfilePhoto(value) {
  return typeof value === 'string' &&
    value.length <= 500_000 &&
    /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
}

function publicAccount(row) {
  return {
    ...JSON.parse(row.profileJson),
    accountId: row.id,
  };
}

function migrateDeviceData(fromDeviceId, accountId) {
  if (!fromDeviceId || fromDeviceId === accountId) return;
  for (const table of ['orders', 'points_ledger', 'mission_submissions']) {
    db.prepare(`UPDATE ${table} SET deviceId = ? WHERE deviceId = ?`).run(accountId, fromDeviceId);
  }
}

router.post('/register', async (req, res) => {
  try {
    const {
      nickname,
      fullName,
      phoneOrEmail,
      email,
      dateOfBirth,
      currentAddress,
      profilePhoto,
      password,
      province,
      provinceName,
      provinceEmoji,
      amphoe,
      amphoeName,
      tambon,
      lat,
      lng,
      previousDeviceId,
    } = req.body || {};

    if (typeof nickname !== 'string' || !nickname.trim() || nickname.trim().length > 40) {
      return res.status(400).json({ error: 'กรุณากรอกชื่อที่มีความยาวไม่เกิน 40 ตัวอักษร' });
    }
    if (typeof fullName !== 'string' || !fullName.trim() || fullName.trim().length > 120) {
      return res.status(400).json({ error: 'กรุณากรอกชื่อ-นามสกุลให้ถูกต้อง' });
    }
    if (typeof phoneOrEmail !== 'string' || !phoneOrEmail.trim() || phoneOrEmail.length > 254 || !isValidLogin(phoneOrEmail)) {
      return res.status(400).json({ error: 'กรุณากรอกอีเมลหรือเบอร์โทรศัพท์ให้ถูกต้อง' });
    }
    if (!isValidEmail(email)) return res.status(400).json({ error: 'กรุณากรอกอีเมลให้ถูกต้อง' });
    if (!isValidDateOfBirth(dateOfBirth)) return res.status(400).json({ error: 'กรุณากรอกวันเกิดให้ถูกต้อง' });
    if (typeof currentAddress !== 'string' || !currentAddress.trim() || currentAddress.trim().length > 300) {
      return res.status(400).json({ error: 'กรุณากรอกที่อยู่ปัจจุบันให้ถูกต้อง' });
    }
    if (!isValidProfilePhoto(profilePhoto)) return res.status(400).json({ error: 'กรุณาเพิ่มรูปโปรไฟล์ JPG, PNG หรือ WebP' });
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return res.status(400).json({ error: 'รหัสผ่านต้องมีความยาว 8-128 ตัวอักษร' });
    }
    if (typeof previousDeviceId !== 'string' || !previousDeviceId.trim() || previousDeviceId.length > 128) {
      return res.status(400).json({ error: 'ไม่พบข้อมูลอุปกรณ์เดิมสำหรับเชื่อมประวัติ' });
    }
    if (
      typeof province !== 'string' || province.length > 80 ||
      typeof amphoe !== 'string' || amphoe.length > 100 ||
      typeof tambon !== 'string' || tambon.length > 100 ||
      (lat !== undefined && (!Number.isFinite(lat) || lat < -90 || lat > 90)) ||
      (lng !== undefined && (!Number.isFinite(lng) || lng < -180 || lng > 180))
    ) {
      return res.status(400).json({ error: 'ข้อมูล Home Base ไม่ถูกต้อง' });
    }

    const loginKey = normalizeLogin(phoneOrEmail);
    const existing = db.prepare('SELECT id FROM accounts WHERE loginKey = ?').get(loginKey);
    if (existing) return res.status(409).json({ error: 'เบอร์โทรศัพท์หรืออีเมลนี้มีบัญชีแล้ว กรุณาเข้าสู่ระบบ' });

    const id = `acct_${crypto.randomUUID()}`;
    const salt = crypto.randomBytes(16);
    const passwordHash = await scrypt(password, salt, PASSWORD_BYTES);
    const now = new Date().toISOString();
    const profile = {
      nickname: nickname.trim(),
      fullName: fullName.trim(),
      phoneOrEmail: phoneOrEmail.trim(),
      email: email.trim().toLowerCase(),
      dateOfBirth,
      currentAddress: currentAddress.trim(),
      profilePhoto,
      province: province.trim(),
      provinceName: typeof provinceName === 'string' ? provinceName.slice(0, 100) : province.trim(),
      provinceEmoji: typeof provinceEmoji === 'string' ? provinceEmoji.slice(0, 8) : '🏙️',
      amphoe: amphoe.trim(),
      amphoeName: typeof amphoeName === 'string' ? amphoeName.slice(0, 120) : amphoe.trim(),
      tambon: tambon.trim(),
      lat: Number.isFinite(lat) ? lat : 13.7563,
      lng: Number.isFinite(lng) ? lng : 100.5018,
      registeredAt: now,
    };

    const createAccount = db.transaction(() => {
      db.prepare(`
        INSERT INTO accounts (id, loginKey, phoneOrEmail, passwordSalt, passwordHash, profileJson, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, loginKey, phoneOrEmail.trim(), salt.toString('hex'), passwordHash.toString('hex'), JSON.stringify(profile), now, now);
      migrateDeviceData(previousDeviceId, id);
      const welcomeReason = 'ของขวัญต้อนรับสมาชิกใหม่ OneDaypass ✨';
      const hasWelcomeBonus = db.prepare(
        'SELECT 1 FROM points_ledger WHERE deviceId = ? AND reason = ? LIMIT 1'
      ).get(id, welcomeReason);
      if (!hasWelcomeBonus) {
        db.prepare(`
          INSERT INTO points_ledger (id, deviceId, delta, reason, at)
          VALUES (?, ?, 50, ?, ?)
        `).run(`pt_${crypto.randomUUID()}`, id, welcomeReason, now);
      }
    });
    createAccount();

    const row = db.prepare('SELECT id, profileJson FROM accounts WHERE id = ?').get(id);
    return res.status(201).json({ ok: true, account: publicAccount(row) });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'เบอร์โทรศัพท์หรืออีเมลนี้มีบัญชีแล้ว กรุณาเข้าสู่ระบบ' });
    }
    console.error('[Error POST /api/auth/register]:', error);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่อีกครั้ง' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { phoneOrEmail, password, previousDeviceId } = req.body || {};
    if (typeof phoneOrEmail !== 'string' || !phoneOrEmail.trim() || !isValidLogin(phoneOrEmail)) {
      return res.status(400).json({ error: 'กรุณากรอกอีเมลหรือเบอร์โทรศัพท์ให้ถูกต้อง' });
    }
    if (typeof password !== 'string' || password.length < 1 || password.length > 128) {
      return res.status(400).json({ error: 'กรุณากรอกรหัสผ่าน' });
    }

    const row = db.prepare(`
      SELECT id, passwordSalt, passwordHash, profileJson
      FROM accounts WHERE loginKey = ?
    `).get(normalizeLogin(phoneOrEmail));
    if (!row) return res.status(401).json({ error: 'เบอร์โทรศัพท์/อีเมลหรือรหัสผ่านไม่ถูกต้อง' });

    const candidate = await scrypt(password, Buffer.from(row.passwordSalt, 'hex'), PASSWORD_BYTES);
    const expected = Buffer.from(row.passwordHash, 'hex');
    if (candidate.length !== expected.length || !crypto.timingSafeEqual(candidate, expected)) {
      return res.status(401).json({ error: 'เบอร์โทรศัพท์/อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    if (typeof previousDeviceId === 'string' && previousDeviceId.trim() && previousDeviceId.length <= 128) {
      db.transaction(() => migrateDeviceData(previousDeviceId, row.id))();
    }
    return res.json({ ok: true, account: publicAccount(row) });
  } catch (error) {
    console.error('[Error POST /api/auth/login]:', error);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง' });
  }
});

router.put('/profile', (req, res) => {
  try {
    const { accountId, profile } = req.body || {};
    if (typeof accountId !== 'string' || !accountId.startsWith('acct_') || !profile || typeof profile !== 'object') {
      return res.status(400).json({ error: 'ข้อมูลบัญชีไม่ถูกต้อง' });
    }
    if (
      typeof profile.nickname !== 'string' || !profile.nickname.trim() || profile.nickname.trim().length > 40 ||
      typeof profile.province !== 'string' || profile.province.length > 80 ||
      typeof profile.district !== 'string' || profile.district.length > 100 ||
      typeof profile.tambon !== 'string' || profile.tambon.length > 100 ||
      (profile.lat != null && (!Number.isFinite(profile.lat) || profile.lat < -90 || profile.lat > 90)) ||
      (profile.lng != null && (!Number.isFinite(profile.lng) || profile.lng < -180 || profile.lng > 180))
    ) {
      return res.status(400).json({ error: 'ข้อมูลโปรไฟล์ไม่ถูกต้อง' });
    }
    if (
      ('fullName' in profile && (typeof profile.fullName !== 'string' || !profile.fullName.trim() || profile.fullName.trim().length > 120)) ||
      ('email' in profile && !isValidEmail(profile.email)) ||
      ('dateOfBirth' in profile && !isValidDateOfBirth(profile.dateOfBirth)) ||
      ('currentAddress' in profile && (typeof profile.currentAddress !== 'string' || !profile.currentAddress.trim() || profile.currentAddress.trim().length > 300)) ||
      ('profilePhoto' in profile && !isValidProfilePhoto(profile.profilePhoto))
    ) {
      return res.status(400).json({ error: 'ข้อมูลโปรไฟล์ไม่ถูกต้อง' });
    }

    const row = db.prepare('SELECT profileJson FROM accounts WHERE id = ?').get(accountId);
    if (!row) return res.status(404).json({ error: 'ไม่พบบัญชีผู้ใช้' });
    const current = JSON.parse(row.profileJson);
    const updated = {
      ...current,
      nickname: profile.nickname.trim(),
      ...(typeof profile.fullName === 'string' ? { fullName: profile.fullName.trim() } : {}),
      ...(typeof profile.email === 'string' ? { email: profile.email.trim().toLowerCase() } : {}),
      ...(typeof profile.dateOfBirth === 'string' ? { dateOfBirth: profile.dateOfBirth } : {}),
      ...(typeof profile.currentAddress === 'string' ? { currentAddress: profile.currentAddress.trim() } : {}),
      ...(typeof profile.profilePhoto === 'string' ? { profilePhoto: profile.profilePhoto } : {}),
      province: profile.province,
      provinceName: typeof profile.provinceName === 'string' ? profile.provinceName.slice(0, 100) : profile.province,
      provinceEmoji: typeof profile.provinceEmoji === 'string' ? profile.provinceEmoji.slice(0, 8) : '🏙️',
      amphoe: profile.district,
      amphoeName: typeof profile.districtName === 'string' ? profile.districtName.slice(0, 120) : profile.district,
      tambon: profile.tambon.trim(),
      lat: Number.isFinite(profile.lat) ? profile.lat : current.lat,
      lng: Number.isFinite(profile.lng) ? profile.lng : current.lng,
      updatedAt: new Date().toISOString(),
    };
    db.prepare('UPDATE accounts SET profileJson = ?, updatedAt = ? WHERE id = ?')
      .run(JSON.stringify(updated), updated.updatedAt, accountId);
    return res.json({ ok: true, account: { ...updated, accountId } });
  } catch (error) {
    console.error('[Error PUT /api/auth/profile]:', error);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการบันทึกโปรไฟล์' });
  }
});

module.exports = router;
