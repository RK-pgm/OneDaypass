require('dotenv').config();

const fs = require('node:fs');
const express = require('express');
const cors = require('cors');
const db = require('./db');
const createStubRouter = require('./routes/stub');
const { uploadsDir } = require('./lib/storagePaths');

const app = express();
const port = Number(process.env.PORT || 3000);
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
  ['/api/shops', './routes/shops', 'ร้านค้า'],
  ['/api/orders', './routes/orders', 'คำสั่งซื้อ'],
  ['/api/passes', './routes/passes', 'พาส'],
  ['/api/coupons', './routes/coupons', 'คูปอง'],
  ['/api/checkin', './routes/checkin', 'เช็กอิน'],
  ['/api/plans', './routes/plans', 'แผนเที่ยว'],
  ['/api/missions', './routes/missions', 'มิชชั่น'],
  ['/api/points', './routes/points', 'แต้ม']
];

for (const [mountPath, modulePath, label] of mounts) {
  let router;
  try {
    router = require(modulePath);
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND' || !error.message.includes(modulePath)) throw error;
    router = createStubRouter(label);
  }
  app.use(mountPath, router);
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
