const crypto = require('node:crypto');
const { promisify } = require('node:util');
const express = require('express');
const db = require('../db');
const { bangkokDate } = require('../lib/dates');

const router = express.Router();
const scrypt = promisify(crypto.scrypt);
const PASSWORD_BYTES = 64;
const DEFAULT_GOOGLE_CLIENT_ID = '66274212738-mn58k9bda2n8ig62m0ifa8dcavitkcoa.apps.googleusercontent.com';
const GOOGLE_CLIENT_IDS = new Set(
  (process.env.GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID)
    .split(',')
    .map((clientId) => clientId.trim())
    .filter(Boolean)
);

function isCompactJwt(value) {
  const parts = value.split('.');
  if (parts.length !== 3 || parts.some((part) => !/^[A-Za-z0-9_-]+$/.test(part))) return false;
  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return Boolean(header && typeof header === 'object' && !Array.isArray(header) && payload && typeof payload === 'object' && !Array.isArray(payload));
  } catch {
    return false;
  }
}

function getEmailJsonExtractSql() {
  return db.isPostgres
    ? "profileJson::json->>'email'"
    : "json_extract(profileJson, '$.email')";
}

function normalizeLogin(value) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }
  let digits = trimmed.replace(/[\s()-]/g, '');
  if (digits.startsWith('+66')) {
    digits = '0' + digits.slice(3);
  } else if (digits.startsWith('66') && digits.length >= 11) {
    digits = '0' + digits.slice(2);
  }
  return digits;
}

function isValidLogin(value) {
  if (typeof value !== 'string') return false;
  const normalized = normalizeLogin(value);
  if (normalized.includes('@')) return isValidEmail(normalized);
  return /^0\d{8,9}$/.test(normalized) || /^\+?\d{8,15}$/.test(normalized);
}

function isValidEmail(value) {
  return typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidDateOfBirth(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value &&
    value <= bangkokDate();
}

function isValidProfilePhoto(value) {
  return typeof value === 'string' &&
    value.length <= 500_000 &&
    (/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value) || /^\/(?:mascot|images)\/[a-zA-Z0-9_\-./]+\.(?:jpg|jpeg|png|webp|svg)$/i.test(value));
}

function publicAccount(row) {
  return {
    ...JSON.parse(row.profileJson),
    accountId: row.id,
  };
}

async function migrateDeviceData(fromDeviceId, accountId) {
  if (!fromDeviceId || fromDeviceId === accountId) return;
  for (const table of ['orders', 'points_ledger', 'mission_submissions']) {
    await db.run(`UPDATE ${table} SET deviceId = ? WHERE deviceId = ?`, accountId, fromDeviceId);
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
    const normalizedEmail = email.trim().toLowerCase();
    const emailExtract = getEmailJsonExtractSql();
    const existing = await db.get(
      `SELECT id FROM accounts WHERE loginKey = ? OR loginKey = ? OR ${emailExtract} = ?`,
      loginKey, normalizedEmail, normalizedEmail
    );
    if (existing) return res.status(409).json({ error: 'เบอร์โทรศัพท์หรืออีเมลนี้มีบัญชีแล้ว กรุณาเข้าสู่ระบบ' });

    const id = `acct_${crypto.randomUUID()}`;
    const salt = crypto.randomBytes(16);
    const passwordHash = await scrypt(password, salt, PASSWORD_BYTES);
    const now = new Date().toISOString();
    const profile = {
      nickname: nickname.trim(),
      fullName: fullName.trim(),
      phoneOrEmail: phoneOrEmail.trim(),
      email: normalizedEmail,
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

    await db.transaction(async () => {
      await db.run(`
        INSERT INTO accounts (id, loginKey, phoneOrEmail, passwordSalt, passwordHash, profileJson, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, id, loginKey, phoneOrEmail.trim(), salt.toString('hex'), passwordHash.toString('hex'), JSON.stringify(profile), now, now);
      await migrateDeviceData(previousDeviceId, id);
      const welcomeReason = 'ของขวัญต้อนรับสมาชิกใหม่ OneDaypass ✨';
      const hasWelcomeBonus = await db.get(
        'SELECT 1 FROM points_ledger WHERE deviceId = ? AND reason = ? LIMIT 1', id, welcomeReason
      );
      if (!hasWelcomeBonus) {
        await db.run(`
          INSERT INTO points_ledger (id, deviceId, delta, reason, at)
          VALUES (?, ?, 50, ?, ?)
        `, `pt_${crypto.randomUUID()}`, id, welcomeReason, now);
      }
    });

    const row = await db.get('SELECT id, profileJson FROM accounts WHERE id = ?', id);
    return res.status(201).json({ ok: true, account: publicAccount(row) });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.code === '23505') {
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

    const loginInput = normalizeLogin(phoneOrEmail);
    const emailExtract = getEmailJsonExtractSql();
    const row = await db.get(`
      SELECT id, loginKey, passwordSalt, passwordHash, profileJson
      FROM accounts
      WHERE loginKey = ? OR phoneOrEmail = ? OR ${emailExtract} = ?
    `, loginInput, phoneOrEmail.trim(), loginInput);
    if (!row) return res.status(401).json({ error: 'เบอร์โทรศัพท์/อีเมลหรือรหัสผ่านไม่ถูกต้อง' });

    const candidate = await scrypt(password, Buffer.from(row.passwordSalt, 'hex'), PASSWORD_BYTES);
    const expected = Buffer.from(row.passwordHash, 'hex');
    if (candidate.length !== expected.length || !crypto.timingSafeEqual(candidate, expected)) {
      return res.status(401).json({ error: 'เบอร์โทรศัพท์/อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    if (typeof previousDeviceId === 'string' && previousDeviceId.trim() && previousDeviceId.length <= 128) {
      await db.transaction(() => migrateDeviceData(previousDeviceId, row.id));
    }
    return res.json({ ok: true, account: publicAccount(row) });
  } catch (error) {
    console.error('[Error POST /api/auth/login]:', error);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง' });
  }
});

router.put('/profile', async (req, res) => {
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

    const row = await db.get('SELECT loginKey, profileJson FROM accounts WHERE id = ?', accountId);
    if (!row) return res.status(404).json({ error: 'ไม่พบบัญชีผู้ใช้' });
    const current = JSON.parse(row.profileJson);

    let nextLoginKey = row.loginKey;
    if (typeof profile.email === 'string') {
      const newEmail = profile.email.trim().toLowerCase();
      if (newEmail !== current.email) {
        const emailExtract = getEmailJsonExtractSql();
        const conflict = await db.get(
          `SELECT id FROM accounts WHERE id != ? AND (loginKey = ? OR ${emailExtract} = ?)`,
          accountId, newEmail, newEmail
        );
        if (conflict) {
          return res.status(409).json({ error: 'อีเมลนี้ถูกใช้งานโดยบัญชีอื่นแล้ว' });
        }
        if (row.loginKey === current.email) {
          nextLoginKey = newEmail;
        }
      }
    }

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
    await db.run('UPDATE accounts SET loginKey = ?, profileJson = ?, updatedAt = ? WHERE id = ?',
      nextLoginKey, JSON.stringify(updated), updated.updatedAt, accountId);
    return res.json({ ok: true, account: { ...updated, accountId } });
  } catch (error) {
    console.error('[Error PUT /api/auth/profile]:', error);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการบันทึกโปรไฟล์' });
  }
});

router.post('/social', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production' || process.env.DEMO_MODE !== 'true') {
      return res.status(403).json({ error: 'เข้าสู่ระบบด้วย Social แบบจำลองไม่ได้เปิดใช้ในระบบนี้' });
    }
    const { provider, providerId, email, name, avatar, previousDeviceId } = req.body || {};
    if (!provider || !['google', 'line'].includes(provider)) {
      return res.status(400).json({ error: 'ผู้ให้บริการ Social Login ไม่ถูกต้อง' });
    }
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'อีเมลจาก Social Account ไม่ถูกต้อง' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailExtract = getEmailJsonExtractSql();

    const row = await db.get(`
      SELECT id, loginKey, passwordSalt, passwordHash, profileJson
      FROM accounts
      WHERE loginKey = ? OR phoneOrEmail = ? OR ${emailExtract} = ?
    `, normalizedEmail, normalizedEmail, normalizedEmail);

    if (row) {
      if (typeof previousDeviceId === 'string' && previousDeviceId.trim() && previousDeviceId.length <= 128) {
        await db.transaction(() => migrateDeviceData(previousDeviceId, row.id));
      }
      return res.json({ ok: true, account: publicAccount(row), isNew: false });
    }

    const id = `acct_${crypto.randomUUID()}`;
    const salt = crypto.randomBytes(16);
    const randomSecret = crypto.randomBytes(32).toString('hex');
    const passwordHash = await scrypt(randomSecret, salt, PASSWORD_BYTES);
    const now = new Date().toISOString();

    const nickname = (name && typeof name === 'string' && name.trim())
      ? name.trim().slice(0, 40)
      : (provider === 'line' ? 'นักเดินทาง LINE' : 'Google Traveler');
    const fullName = (name && typeof name === 'string' && name.trim())
      ? name.trim().slice(0, 120)
      : nickname;
    const profilePhoto = (avatar && typeof avatar === 'string' && avatar.length <= 500_000)
      ? avatar
      : (provider === 'line'
        ? '/mascot/nong-pass-wave.jpg'
        : '/mascot/nong-pass-guide.jpg');

    const profile = {
      nickname,
      fullName,
      phoneOrEmail: normalizedEmail,
      email: normalizedEmail,
      provider,
      providerId: typeof providerId === 'string' ? providerId.slice(0, 128) : `${provider}_${Date.now()}`,
      dateOfBirth: '2000-01-01',
      currentAddress: 'กรุงเทพมหานคร',
      profilePhoto,
      province: 'bangkok',
      provinceName: 'กรุงเทพมหานคร',
      provinceEmoji: '🏙️',
      amphoe: 'samphanthawong',
      amphoeName: 'สัมพันธวงศ์',
      tambon: 'ตลาดน้อย',
      lat: 13.7313,
      lng: 100.5105,
      registeredAt: now,
    };

    await db.transaction(async () => {
      await db.run(`
        INSERT INTO accounts (id, loginKey, phoneOrEmail, passwordSalt, passwordHash, profileJson, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, id, normalizedEmail, normalizedEmail, salt.toString('hex'), passwordHash.toString('hex'), JSON.stringify(profile), now, now);
      await migrateDeviceData(previousDeviceId, id);
      const welcomeReason = 'ของขวัญต้อนรับสมาชิกใหม่ OneDaypass ✨';
      const hasWelcomeBonus = await db.get(
        'SELECT 1 FROM points_ledger WHERE deviceId = ? AND reason = ? LIMIT 1', id, welcomeReason
      );
      if (!hasWelcomeBonus) {
        await db.run(`
          INSERT INTO points_ledger (id, deviceId, delta, reason, at)
          VALUES (?, ?, 50, ?, ?)
        `, `pt_${crypto.randomUUID()}`, id, welcomeReason, now);
      }
    });

    const newRow = await db.get('SELECT id, profileJson FROM accounts WHERE id = ?', id);
    return res.status(201).json({ ok: true, account: publicAccount(newRow), isNew: true });
  } catch (error) {
    console.error('[Error POST /api/auth/social]:', error);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Social Account' });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { credential, previousDeviceId } = req.body || {};
    if (typeof credential !== 'string' || !credential.trim()) {
      return res.status(400).json({ error: 'ไม่พบข้อมูล Google Token สำหรับยืนยันตัวตน' });
    }
    if (!isCompactJwt(credential)) {
      return res.status(401).json({ error: 'Google Token ไม่ถูกต้องหรือหมดอายุแล้ว' });
    }

    const tokenUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
    let googleRes;
    try {
      googleRes = await fetch(tokenUrl);
    } catch (error) {
      console.error('[Google Tokeninfo Unavailable]:', error.message);
      return res.status(503).json({ error: 'ระบบยืนยันตัวตน Google ไม่พร้อมใช้งานชั่วคราว กรุณาลองใหม่อีกครั้ง' });
    }
    if (!googleRes.ok) {
      const errText = await googleRes.text().catch(() => '');
      console.error('[Google Tokeninfo Error]:', errText);
      return res.status(401).json({ error: 'Google Token ไม่ถูกต้องหรือหมดอายุแล้ว' });
    }
    const data = await googleRes.json();
    const validIssuer = ['accounts.google.com', 'https://accounts.google.com'].includes(data.iss);
    if (!GOOGLE_CLIENT_IDS.has(data.aud) || !validIssuer || !data.sub || !data.email || String(data.email_verified) !== 'true') {
      return res.status(401).json({ error: 'Google Token ไม่ได้ออกให้กับแอปนี้ หรือบัญชียังยืนยันอีเมลไม่สำเร็จ' });
    }
    const googleProfile = {
      sub: data.sub,
      email: data.email,
      name: data.name || data.given_name || 'Google User',
      picture: data.picture,
    };

    const normalizedEmail = googleProfile.email.trim().toLowerCase();
    const emailExtract = getEmailJsonExtractSql();

    const row = await db.get(`
      SELECT id, loginKey, passwordSalt, passwordHash, profileJson
      FROM accounts
      WHERE loginKey = ? OR phoneOrEmail = ? OR ${emailExtract} = ?
    `, normalizedEmail, normalizedEmail, normalizedEmail);

    if (row) {
      if (typeof previousDeviceId === 'string' && previousDeviceId.trim() && previousDeviceId.length <= 128) {
        await db.transaction(() => migrateDeviceData(previousDeviceId, row.id));
      }
      return res.json({ ok: true, account: publicAccount(row), isNew: false });
    }

    const id = `acct_${crypto.randomUUID()}`;
    const salt = crypto.randomBytes(16);
    const randomSecret = crypto.randomBytes(32).toString('hex');
    const passwordHash = await scrypt(randomSecret, salt, PASSWORD_BYTES);
    const now = new Date().toISOString();

    const nickname = (googleProfile.name || 'Google Traveler').slice(0, 40);
    const fullName = (googleProfile.name || 'Google Traveler').slice(0, 120);
    const profilePhoto = (googleProfile.picture && typeof googleProfile.picture === 'string' && googleProfile.picture.length <= 500_000)
      ? googleProfile.picture
      : '/mascot/nong-pass-guide.jpg';

    const profile = {
      nickname,
      fullName,
      phoneOrEmail: normalizedEmail,
      email: normalizedEmail,
      provider: 'google',
      providerId: googleProfile.sub,
      dateOfBirth: '2000-01-01',
      currentAddress: 'กรุงเทพมหานคร',
      profilePhoto,
      province: 'bangkok',
      provinceName: 'กรุงเทพมหานคร',
      provinceEmoji: '🏙️',
      amphoe: 'samphanthawong',
      amphoeName: 'สัมพันธวงศ์',
      tambon: 'ตลาดน้อย',
      lat: 13.7313,
      lng: 100.5105,
      registeredAt: now,
    };

    await db.transaction(async () => {
      await db.run(`
        INSERT INTO accounts (id, loginKey, phoneOrEmail, passwordSalt, passwordHash, profileJson, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, id, normalizedEmail, normalizedEmail, salt.toString('hex'), passwordHash.toString('hex'), JSON.stringify(profile), now, now);
      await migrateDeviceData(previousDeviceId, id);
      const welcomeReason = 'ของขวัญต้อนรับสมาชิกใหม่ OneDaypass ✨';
      const hasWelcomeBonus = await db.get(
        'SELECT 1 FROM points_ledger WHERE deviceId = ? AND reason = ? LIMIT 1', id, welcomeReason
      );
      if (!hasWelcomeBonus) {
        await db.run(`
          INSERT INTO points_ledger (id, deviceId, delta, reason, at)
          VALUES (?, ?, 50, ?, ?)
        `, `pt_${crypto.randomUUID()}`, id, welcomeReason, now);
      }
    });

    const newRow = await db.get('SELECT id, profileJson FROM accounts WHERE id = ?', id);
    return res.status(201).json({ ok: true, account: publicAccount(newRow), isNew: true });
  } catch (error) {
    console.error('[Error POST /api/auth/google]:', error);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการยืนยันตัวตนกับ Google' });
  }
});

module.exports = router;
