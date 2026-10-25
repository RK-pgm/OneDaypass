const crypto = require('node:crypto');
const express = require('express');
const multer = require('multer');
const path = require('node:path');
const fs = require('node:fs');
const db = require('../db');
const { bangkokDate } = require('../lib/dates');

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
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };
    if (allowedTypes[ext] === file.mimetype.toLowerCase()) {
      return cb(null, true);
    }
    const error = new Error('รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WEBP)');
    error.status = 400;
    cb(error);
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
router.post('/:missionId/submit', upload.single('image'), async (req, res, next) => {
  try {
    const { missionId } = req.params;
    const { passId, deviceId } = req.body || {};

    if (typeof passId !== 'string' || !passId || typeof deviceId !== 'string' || !deviceId.trim() || deviceId.length > 128) {
      return res.status(400).json({ error: 'กรุณาระบุ passId และ deviceId' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'กรุณาแนบรูปภาพภารกิจ' });
    }

    // 1. ตรวจสอบพาส
    const pass = await db.get(`
      SELECT p.*, o.planJson, o.deviceId AS ownerDeviceId
      FROM passes p 
      JOIN orders o ON o.id = p.orderId 
      WHERE p.id = ?
    `, passId);

    if (!pass) {
      return res.status(404).json({ error: 'ไม่พบพาสนี้ในระบบ' });
    }
    if (pass.status !== 'active' || pass.validDate !== bangkokDate()) {
      return res.status(410).json({ error: 'พาสหมดอายุแล้ว ไม่สามารถส่งภารกิจได้' });
    }
    if (pass.ownerDeviceId !== deviceId) {
      return res.status(403).json({ error: 'พาสนี้ไม่ได้เป็นของบัญชีที่กำลังใช้งาน' });
    }

    const plan = JSON.parse(pass.planJson);
    const planItem = plan.items.find((item) => item.mission && item.mission.id === missionId);

    if (!planItem) {
      return res.status(404).json({ error: 'ไม่พบมิชชั่นนี้ในแผนเที่ยว' });
    }

    const shopId = planItem.shopId;
    const pointsAwarded = Number(planItem.mission.points) || 5;

    // 2. กฎ: ต้องเช็กอินร้านนั้นในพาสนี้ก่อน (403)
    const checkin = await db.get('SELECT 1 FROM checkins WHERE passId = ? AND shopId = ?', passId, shopId);
    if (!checkin) {
      return res.status(403).json({ error: 'ต้องเช็กอินร้านนี้ก่อน จึงจะสามารถส่งภาพภารกิจได้' });
    }

    // 3. กฎ: ส่งซ้ำมิชชั่นเดิมในพาสเดิมไม่ได้ (409)
    const existing = await db.get('SELECT 1 FROM mission_submissions WHERE passId = ? AND missionId = ?', passId, missionId);
    if (existing) {
      return res.status(409).json({ error: 'ภารกิจนี้ส่งภาพรับแต้มไปแล้วในพาสนี้' });
    }

    const now = new Date().toISOString();
    const imagePath = req.file.filename;
    const submissionId = `ms_${crypto.randomUUID()}`;
    const ledgerId = `pt_${crypto.randomUUID()}`;

    // 4. บันทึก mission_submissions และเพิ่มแต้มใน points_ledger
    let totalPoints = 0;
    await db.transaction(async () => {
      await db.run(`
        INSERT INTO mission_submissions (id, passId, missionId, deviceId, imagePath, points, at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, submissionId, passId, missionId, deviceId, imagePath, pointsAwarded, now);

      await db.run(`
        INSERT INTO points_ledger (id, deviceId, delta, reason, at)
        VALUES (?, ?, ?, ?, ?)
      `, ledgerId, deviceId, pointsAwarded, `ทำมิชชั่น ${planItem.mission.title} สำเร็จ`, now);

      const balanceRow = await db.get(
        'SELECT COALESCE(SUM(delta), 0) AS total FROM points_ledger WHERE deviceId = ?', deviceId
      );

      totalPoints = Math.max(0, Number(balanceRow?.total) || pointsAwarded);
    });

    return res.json({
      ok: true,
      pointsAwarded,
      totalPoints
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
