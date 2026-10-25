require('dotenv').config();

const fs = require('node:fs');
const express = require('express');
const cors = require('cors');
const db = require('./db');
const { uploadsDir } = require('./lib/storagePaths');
const seedShops = require('./seed');

const app = express();
const port = Number(process.env.PORT || 5000);
fs.mkdirSync(uploadsDir, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(uploadsDir, {
  setHeaders(res) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
  },
}));

const ready = db.init().then(async () => {
  if (!await db.get('SELECT 1 FROM shops LIMIT 1')) {
    await seedShops();
  }
});

app.use((_req, _res, next) => {
  ready.then(() => next(), next);
});

app.get('/api/health', async (_req, res, next) => {
  try {
    await db.get('SELECT 1');
    res.json({
      ok: true,
      service: 'daypass-api',
      database: db.isPostgres ? 'postgres' : 'sqlite',
      demoMode: process.env.DEMO_MODE === 'true',
    });
  } catch (error) {
    next(error);
  }
});

const mounts = [
  ['/api/auth', require('./routes/auth')],
  ['/api/shops', require('./routes/shops')],
  ['/api/orders', require('./routes/orders')],
  ['/api/passes', require('./routes/passes')],
  ['/api/coupons', require('./routes/coupons')],
  ['/api/checkin', require('./routes/checkin')],
  ['/api/plans', require('./routes/plans')],
  ['/api/missions', require('./routes/missions')],
  ['/api/points', require('./routes/points')]
];

for (const [mountPath, router] of mounts) {
  app.use(mountPath, router);
}

app.use((err, _req, res, _next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'รูปแบบ JSON ไม่ถูกต้อง' });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'ไฟล์ใหญ่เกิน 5 MB กรุณาเลือกรูปขนาดเล็กลง' });
  }
  if (err.name === 'MulterError') {
    return res.status(400).json({ error: 'รูปแบบไฟล์หรือช่องอัปโหลดไม่ถูกต้อง' });
  }
  if (err.status === 400 && err.message === 'รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WEBP)') {
    return res.status(400).json({ error: err.message });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'ข้อมูลที่ส่งมีขนาดใหญ่เกินกำหนด' });
  }
  console.error(err);
  res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
});

const server = app.listen(port, () => {
  console.log(`DayPass API listening on http://localhost:${port}`);
});

function shutdown() {
  server.close(() => {
    db.close().finally(() => process.exit(0));
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = app;
