const crypto = require('node:crypto');
const express = require('express');
const multer = require('multer');
const path = require('node:path');
const fs = require('node:fs');
const db = require('../db');

const router = express.Router();

const { uploadsDir: uploadDir } = require('../lib/storagePaths');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `m_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/i;
    if (allowed.test(path.extname(file.originalname)) || allowed.test(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error('รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WEBP)'));
  }
});

/**
 * POST /api/missions/:missionId/submit
 * Submits mission photo.
 * Requirements:
 * 1. Must check in to the shop first (403)
 * 2. Duplicate submission prevention (409)
 * 3. Records in mission_submissions and points_ledger
 * 4. Returns { ok: true, pointsAwarded, totalPoints }
 */
router.post('/:missionId/submit', upload.single('image'), (req, res) => {
  try {
    const { missionId } = req.params;
    const { passId, deviceId } = req.body || {};

    if (!passId || !deviceId) {
      return res.status(400).json({ error: 'กรุณาระบุ passId และ deviceId' });
    }

    // 1. ตรวจสอบพาส
    const pass = db.prepare(`
      SELECT p.*, o.planJson 
      FROM passes p 
      JOIN orders o ON o.id = p.orderId 
      WHERE p.id = ?
    `).get(passId);

    if (!pass) {
      return res.status(404).json({ error: 'ไม่พบพาสนี้ในระบบ' });
    }

    const plan = JSON.parse(pass.planJson);
    const planItem = plan.items.find((item) => item.mission && item.mission.id === missionId);

    if (!planItem) {
      return res.status(404).json({ error: 'ไม่พบมิชชั่นนี้ในแผนเที่ยว' });
    }

    const shopId = planItem.shopId;
    const pointsAwarded = Number(planItem.mission.points) || 5;

    // 2. กฎ: ต้องเช็กอินร้านนั้นในพาสนี้ก่อน (403)
    const checkin = db.prepare('SELECT 1 FROM checkins WHERE passId = ? AND shopId = ?').get(passId, shopId);
    if (!checkin) {
      return res.status(403).json({ error: 'ต้องเช็กอินร้านนี้ก่อน จึงจะสามารถส่งภาพภารกิจได้' });
    }

    // 3. กฎ: ส่งซ้ำมิชชั่นเดิมในพาสเดิมไม่ได้ (409)
    const existing = db.prepare('SELECT 1 FROM mission_submissions WHERE passId = ? AND missionId = ?').get(passId, missionId);
    if (existing) {
      return res.status(409).json({ error: 'ภารกิจนี้ส่งภาพรับแต้มไปแล้วในพาสนี้' });
    }

    const now = new Date().toISOString();
    const imagePath = req.file ? req.file.filename : 'simulated.jpg';
    const submissionId = `ms_${crypto.randomUUID()}`;
    const ledgerId = `pt_${crypto.randomUUID()}`;

    // 4. บันทึก mission_submissions และเพิ่มแต้มใน points_ledger
    let totalPoints = 0;
    db.transaction(() => {
      db.prepare(`
        INSERT INTO mission_submissions (id, passId, missionId, deviceId, imagePath, points, at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(submissionId, passId, missionId, deviceId, imagePath, pointsAwarded, now);

      db.prepare(`
        INSERT INTO points_ledger (id, deviceId, delta, reason, at)
        VALUES (?, ?, ?, ?, ?)
      `).run(ledgerId, deviceId, pointsAwarded, `ทำมิชชั่น ${planItem.mission.title} สำเร็จ`, now);

      const balanceRow = db.prepare(
        'SELECT COALESCE(SUM(delta), 0) AS total FROM points_ledger WHERE deviceId = ?'
      ).get(deviceId);

      totalPoints = Math.max(0, balanceRow ? balanceRow.total : pointsAwarded);
    })();

    return res.json({
      ok: true,
      pointsAwarded,
      totalPoints
    });
  } catch (error) {
    console.error('[Error POST /api/missions/:missionId/submit]:', error);
    return res.status(500).json({ error: error.message || 'เกิดข้อผิดพลาดในการส่งรูปมิชชั่น' });
  }
});

module.exports = router;
