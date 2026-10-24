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
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (_req, res) => {
  try {
    db.prepare('SELECT 1').get();
    res.json({ ok: true, service: 'daypass-api', database: 'connected' });
  } catch (error) {
    res.status(503).json({ error: 'ฐานข้อมูลยังไม่พร้อมใช้งาน' });
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

if (!db.prepare('SELECT 1 FROM shops LIMIT 1').get()) {
  seedShops();
}

app.use((err, _req, res, _next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'รูปแบบ JSON ไม่ถูกต้อง' });
  }
  console.error(err);
  res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
});

const server = app.listen(port, () => {
  console.log(`DayPass API listening on http://localhost:${port}`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = app;
