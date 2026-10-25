const { AsyncLocalStorage } = require('node:async_hooks');
const fs = require('node:fs');
const path = require('node:path');

const { databasePath: dbPath } = require('./lib/storagePaths');
const isPostgres = Boolean(process.env.DATABASE_URL);
if (process.env.VERCEL && !isPostgres) {
  throw new Error('DATABASE_URL must be configured for persistent Vercel storage');
}

const transactionContext = new AsyncLocalStorage();
let sqlite;
let postgres;
let initialized;
let sqliteQueue = Promise.resolve();

const sqliteSchema = `
  CREATE TABLE IF NOT EXISTS shops (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, district TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('cafe','food','dessert','photo','activity')),
    lat REAL NOT NULL, lng REAL NOT NULL,
    avgPrice INTEGER NOT NULL DEFAULT 0 CHECK(avgPrice >= 0),
    tagsJson TEXT NOT NULL DEFAULT '[]', recommendedMenu TEXT, couponJson TEXT,
    openFrom TEXT, openTo TEXT, durationMin INTEGER NOT NULL DEFAULT 60 CHECK(durationMin > 0),
    missionJson TEXT, isDemo INTEGER NOT NULL DEFAULT 0 CHECK(isDemo IN (0, 1))
  );
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY, deviceId TEXT NOT NULL, planJson TEXT NOT NULL,
    people INTEGER NOT NULL CHECK(people > 0), amount INTEGER NOT NULL CHECK(amount >= 0),
    discount INTEGER NOT NULL DEFAULT 0 CHECK(discount >= 0),
    pointsUsed INTEGER NOT NULL DEFAULT 0 CHECK(pointsUsed >= 0),
    isDemo INTEGER NOT NULL DEFAULT 0 CHECK(isDemo IN (0, 1)),
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','cancelled')),
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS passes (
    id TEXT PRIMARY KEY, orderId TEXT NOT NULL UNIQUE REFERENCES orders(id),
    code TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','expired','cancelled')),
    validDate TEXT NOT NULL, createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS coupons (
    id TEXT PRIMARY KEY, passId TEXT NOT NULL REFERENCES passes(id),
    shopId TEXT NOT NULL, title TEXT NOT NULL, holderIndex INTEGER NOT NULL DEFAULT 1 CHECK(holderIndex > 0),
    used INTEGER NOT NULL DEFAULT 0 CHECK(used IN (0,1)), redeemedAt TEXT,
    UNIQUE(passId, shopId, holderIndex)
  );
  CREATE TABLE IF NOT EXISTS checkins (
    id TEXT PRIMARY KEY, passId TEXT NOT NULL REFERENCES passes(id), shopId TEXT NOT NULL,
    lat REAL NOT NULL, lng REAL NOT NULL, at TEXT NOT NULL, UNIQUE(passId, shopId)
  );
  CREATE TABLE IF NOT EXISTS mission_submissions (
    id TEXT PRIMARY KEY, passId TEXT NOT NULL REFERENCES passes(id), missionId TEXT NOT NULL,
    deviceId TEXT NOT NULL, imagePath TEXT NOT NULL, points INTEGER NOT NULL DEFAULT 0 CHECK(points >= 0),
    at TEXT NOT NULL, UNIQUE(passId, missionId)
  );
  CREATE TABLE IF NOT EXISTS points_ledger (
    id TEXT PRIMARY KEY, deviceId TEXT NOT NULL, delta INTEGER NOT NULL, reason TEXT NOT NULL, at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY, loginKey TEXT NOT NULL UNIQUE, phoneOrEmail TEXT NOT NULL,
    passwordSalt TEXT NOT NULL, passwordHash TEXT NOT NULL, profileJson TEXT NOT NULL,
    createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_coupons_pass ON coupons(passId);
  CREATE INDEX IF NOT EXISTS idx_checkins_pass ON checkins(passId);
  CREATE INDEX IF NOT EXISTS idx_mission_submissions_device ON mission_submissions(deviceId);
  CREATE INDEX IF NOT EXISTS idx_points_ledger_device ON points_ledger(deviceId);
  CREATE INDEX IF NOT EXISTS idx_shops_district ON shops(district);
`;

const postgresSchema = [
  `CREATE TABLE IF NOT EXISTS shops (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, district TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('cafe','food','dessert','photo','activity')),
    lat DOUBLE PRECISION NOT NULL, lng DOUBLE PRECISION NOT NULL,
    avgPrice INTEGER NOT NULL DEFAULT 0 CHECK(avgPrice >= 0),
    tagsJson TEXT NOT NULL DEFAULT '[]', recommendedMenu TEXT, couponJson TEXT,
    openFrom TEXT, openTo TEXT, durationMin INTEGER NOT NULL DEFAULT 60 CHECK(durationMin > 0),
    missionJson TEXT, isDemo SMALLINT NOT NULL DEFAULT 0 CHECK(isDemo IN (0, 1))
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY, deviceId TEXT NOT NULL, planJson TEXT NOT NULL,
    people INTEGER NOT NULL CHECK(people > 0), amount INTEGER NOT NULL CHECK(amount >= 0),
    discount INTEGER NOT NULL DEFAULT 0 CHECK(discount >= 0),
    pointsUsed INTEGER NOT NULL DEFAULT 0 CHECK(pointsUsed >= 0),
    isDemo SMALLINT NOT NULL DEFAULT 0 CHECK(isDemo IN (0, 1)),
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','cancelled')),
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text
  )`,
  `CREATE TABLE IF NOT EXISTS passes (
    id TEXT PRIMARY KEY, orderId TEXT NOT NULL UNIQUE REFERENCES orders(id),
    code TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','expired','cancelled')),
    validDate TEXT NOT NULL, createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text
  )`,
  `CREATE TABLE IF NOT EXISTS coupons (
    id TEXT PRIMARY KEY, passId TEXT NOT NULL REFERENCES passes(id),
    shopId TEXT NOT NULL, title TEXT NOT NULL, holderIndex INTEGER NOT NULL DEFAULT 1 CHECK(holderIndex > 0),
    used SMALLINT NOT NULL DEFAULT 0 CHECK(used IN (0,1)), redeemedAt TEXT,
    UNIQUE(passId, shopId, holderIndex)
  )`,
  `CREATE TABLE IF NOT EXISTS checkins (
    id TEXT PRIMARY KEY, passId TEXT NOT NULL REFERENCES passes(id), shopId TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL, lng DOUBLE PRECISION NOT NULL,
    at TEXT NOT NULL, UNIQUE(passId, shopId)
  )`,
  `CREATE TABLE IF NOT EXISTS mission_submissions (
    id TEXT PRIMARY KEY, passId TEXT NOT NULL REFERENCES passes(id), missionId TEXT NOT NULL,
    deviceId TEXT NOT NULL, imagePath TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 0 CHECK(points >= 0), at TEXT NOT NULL, UNIQUE(passId, missionId)
  )`,
  `CREATE TABLE IF NOT EXISTS points_ledger (
    id TEXT PRIMARY KEY, deviceId TEXT NOT NULL, delta INTEGER NOT NULL, reason TEXT NOT NULL, at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY, loginKey TEXT NOT NULL UNIQUE, phoneOrEmail TEXT NOT NULL,
    passwordSalt TEXT NOT NULL, passwordHash TEXT NOT NULL, profileJson TEXT NOT NULL,
    createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
  )`,
  'CREATE INDEX IF NOT EXISTS idx_coupons_pass ON coupons(passId)',
  'CREATE INDEX IF NOT EXISTS idx_checkins_pass ON checkins(passId)',
  'CREATE INDEX IF NOT EXISTS idx_mission_submissions_device ON mission_submissions(deviceId)',
  'CREATE INDEX IF NOT EXISTS idx_points_ledger_device ON points_ledger(deviceId)',
  'CREATE INDEX IF NOT EXISTS idx_shops_district ON shops(district)',
];

const camelColumns = new Map(Object.entries({
  createdat: 'createdAt',
  deviceid: 'deviceId',
  avgprice: 'avgPrice',
  imagepath: 'imagePath',
  isdemo: 'isDemo',
  loginkey: 'loginKey',
  missionid: 'missionId',
  missionjson: 'missionJson',
  openfrom: 'openFrom',
  opento: 'openTo',
  orderid: 'orderId',
  passcreatedat: 'passCreatedAt',
  passid: 'passId',
  passwordhash: 'passwordHash',
  passwordsalt: 'passwordSalt',
  phoneoremail: 'phoneOrEmail',
  planjson: 'planJson',
  profilejson: 'profileJson',
  pointsused: 'pointsUsed',
  recommendedmenu: 'recommendedMenu',
  redeemedat: 'redeemedAt',
  shopid: 'shopId',
  tagsjson: 'tagsJson',
  couponjson: 'couponJson',
  durationmin: 'durationMin',
  updatedat: 'updatedAt',
  validdate: 'validDate',
  holderindex: 'holderIndex',
}));

function mapPostgresRow(row) {
  if (!row) return row;
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [camelColumns.get(key) || key, value]));
}

function toPostgresPlaceholders(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

function withSqliteLock(operation) {
  const result = sqliteQueue.then(operation, operation);
  sqliteQueue = result.then(() => undefined, () => undefined);
  return result;
}

function executeSql(mode, sql, params) {
  const context = transactionContext.getStore();
  if (isPostgres) {
    const client = context?.client || postgres;
    return client.query(toPostgresPlaceholders(sql), params).then((result) => ({
      rows: result.rows.map(mapPostgresRow),
      changes: result.rowCount,
    }));
  }

  const execute = () => {
    const statement = sqlite.prepare(sql);
    if (mode === 'all') return { rows: statement.all(...params), changes: 0 };
    if (mode === 'get') return { rows: [statement.get(...params)].filter(Boolean), changes: 0 };
    const result = statement.run(...params);
    return { rows: [], changes: result.changes };
  };
  return context?.sqlite ? Promise.resolve(execute()) : withSqliteLock(execute);
}

const db = {
  isPostgres,
  async init() {
    if (!initialized) {
      initialized = (async () => {
        if (isPostgres) {
          const { Pool } = require('pg');
          postgres = new Pool({
            connectionString: process.env.DATABASE_URL,
            max: 2,
            connectionTimeoutMillis: 10_000,
          });
          const client = await postgres.connect();
          try {
            await client.query('BEGIN');
            await client.query("SELECT pg_advisory_xact_lock(hashtext('onedaypass-schema-v1'))");
            for (const statement of postgresSchema) await client.query(statement);
            await client.query('ALTER TABLE coupons ADD COLUMN IF NOT EXISTS holderIndex INTEGER NOT NULL DEFAULT 1 CHECK(holderIndex > 0)');
            await client.query('ALTER TABLE coupons DROP CONSTRAINT IF EXISTS coupons_passid_shopid_key');
            await client.query('ALTER TABLE coupons DROP CONSTRAINT IF EXISTS coupons_holder_unique');
            await client.query('ALTER TABLE coupons ADD CONSTRAINT coupons_holder_unique UNIQUE (passId, shopId, holderIndex)');
            await client.query("UPDATE shops SET isDemo = 1 WHERE substr(id, 1, 5) = 'demo_' AND isDemo = 0");
            await client.query('COMMIT');
          } catch (error) {
            await client.query('ROLLBACK');
            throw error;
          } finally {
            client.release();
          }
          return;
        }

        const Database = require('better-sqlite3');
        fs.mkdirSync(path.dirname(dbPath), { recursive: true });
        sqlite = new Database(dbPath);
        sqlite.pragma('journal_mode = WAL');
        sqlite.pragma('foreign_keys = ON');
        sqlite.pragma('busy_timeout = 5000');
        sqlite.exec(sqliteSchema);
        const couponColumns = sqlite.prepare('PRAGMA table_info(coupons)').all();
        if (!couponColumns.some((column) => column.name === 'holderIndex')) {
          sqlite.exec(`
            PRAGMA foreign_keys = OFF;
            BEGIN IMMEDIATE;
            CREATE TABLE coupons_new (
              id TEXT PRIMARY KEY, passId TEXT NOT NULL REFERENCES passes(id), shopId TEXT NOT NULL,
              title TEXT NOT NULL, holderIndex INTEGER NOT NULL DEFAULT 1 CHECK(holderIndex > 0),
              used INTEGER NOT NULL DEFAULT 0 CHECK(used IN (0,1)), redeemedAt TEXT,
              UNIQUE(passId, shopId, holderIndex)
            );
            INSERT INTO coupons_new (id, passId, shopId, title, used, redeemedAt)
              SELECT id, passId, shopId, title, used, redeemedAt FROM coupons;
            DROP TABLE coupons;
            ALTER TABLE coupons_new RENAME TO coupons;
            CREATE INDEX IF NOT EXISTS idx_coupons_pass ON coupons(passId);
            COMMIT;
            PRAGMA foreign_keys = ON;
          `);
        }
        if (!sqlite.prepare('PRAGMA table_info(shops)').all().some((column) => column.name === 'isDemo')) {
          sqlite.exec('ALTER TABLE shops ADD COLUMN isDemo INTEGER NOT NULL DEFAULT 0 CHECK(isDemo IN (0, 1))');
        }
        if (!sqlite.prepare('PRAGMA table_info(orders)').all().some((column) => column.name === 'isDemo')) {
          sqlite.exec('ALTER TABLE orders ADD COLUMN isDemo INTEGER NOT NULL DEFAULT 0 CHECK(isDemo IN (0, 1))');
        }
        sqlite.exec("UPDATE shops SET isDemo = 1 WHERE substr(id, 1, 5) = 'demo_' AND isDemo = 0");
      })();
    }
    return initialized;
  },
  async get(sql, ...params) {
    const result = await executeSql('get', sql, params);
    return result.rows[0];
  },
  async all(sql, ...params) {
    const result = await executeSql('all', sql, params);
    return result.rows;
  },
  async run(sql, ...params) {
    return executeSql('run', sql, params);
  },
  async transaction(callback) {
    await db.init();
    if (isPostgres) {
      const client = await postgres.connect();
      try {
        await client.query('BEGIN');
        const result = await transactionContext.run({ client }, callback);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }
    return withSqliteLock(async () => {
      sqlite.exec('BEGIN IMMEDIATE');
      try {
        const result = await transactionContext.run({ sqlite: true }, callback);
        sqlite.exec('COMMIT');
        return result;
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    });
  },
  async close() {
    if (isPostgres && postgres) await postgres.end();
    if (!isPostgres && sqlite?.open) sqlite.close();
  },
};

module.exports = db;
