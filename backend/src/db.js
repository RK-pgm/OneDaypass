const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

const { databasePath: dbPath } = require('./lib/storagePaths');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

db.exec(`
  CREATE TABLE IF NOT EXISTS shops (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    district TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('cafe','food','dessert','photo','activity')),
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    avgPrice INTEGER NOT NULL DEFAULT 0 CHECK(avgPrice >= 0),
    tagsJson TEXT NOT NULL DEFAULT '[]',
    recommendedMenu TEXT,
    couponJson TEXT,
    openFrom TEXT,
    openTo TEXT,
    durationMin INTEGER NOT NULL DEFAULT 60 CHECK(durationMin > 0),
    missionJson TEXT
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    deviceId TEXT NOT NULL,
    planJson TEXT NOT NULL,
    people INTEGER NOT NULL CHECK(people > 0),
    amount INTEGER NOT NULL CHECK(amount >= 0),
    discount INTEGER NOT NULL DEFAULT 0 CHECK(discount >= 0),
    pointsUsed INTEGER NOT NULL DEFAULT 0 CHECK(pointsUsed >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','cancelled')),
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS passes (
    id TEXT PRIMARY KEY,
    orderId TEXT NOT NULL UNIQUE REFERENCES orders(id),
    code TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','expired','cancelled')),
    validDate TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS coupons (
    id TEXT PRIMARY KEY,
    passId TEXT NOT NULL REFERENCES passes(id),
    shopId TEXT NOT NULL,
    title TEXT NOT NULL,
    used INTEGER NOT NULL DEFAULT 0 CHECK(used IN (0,1)),
    redeemedAt TEXT,
    UNIQUE(passId, shopId)
  );

  CREATE TABLE IF NOT EXISTS checkins (
    id TEXT PRIMARY KEY,
    passId TEXT NOT NULL REFERENCES passes(id),
    shopId TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    at TEXT NOT NULL,
    UNIQUE(passId, shopId)
  );

  CREATE TABLE IF NOT EXISTS mission_submissions (
    id TEXT PRIMARY KEY,
    passId TEXT NOT NULL REFERENCES passes(id),
    missionId TEXT NOT NULL,
    deviceId TEXT NOT NULL,
    imagePath TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 0 CHECK(points >= 0),
    at TEXT NOT NULL,
    UNIQUE(passId, missionId)
  );

  CREATE TABLE IF NOT EXISTS points_ledger (
    id TEXT PRIMARY KEY,
    deviceId TEXT NOT NULL,
    delta INTEGER NOT NULL,
    reason TEXT NOT NULL,
    at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    loginKey TEXT NOT NULL UNIQUE,
    phoneOrEmail TEXT NOT NULL,
    passwordSalt TEXT NOT NULL,
    passwordHash TEXT NOT NULL,
    profileJson TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_coupons_pass ON coupons(passId);
  CREATE INDEX IF NOT EXISTS idx_checkins_pass ON checkins(passId);
  CREATE INDEX IF NOT EXISTS idx_mission_submissions_device ON mission_submissions(deviceId);
  CREATE INDEX IF NOT EXISTS idx_points_ledger_device ON points_ledger(deviceId);
  CREATE INDEX IF NOT EXISTS idx_shops_district ON shops(district);
`);

module.exports = db;
