const express = require('express');
const router = express.Router();
const db = require('../db');
const { generatePlan } = require('../lib/planner');
const { DISTRICTS } = require('../lib/districts');

const serializeShop = (row) => ({
  id: row.id,
  name: row.name,
  district: row.district,
  category: row.category,
  lat: row.lat,
  lng: row.lng,
  avgPrice: row.avgPrice,
  tags: JSON.parse(row.tagsJson || '[]'),
  recommendedMenu: row.recommendedMenu,
  coupon: row.couponJson ? JSON.parse(row.couponJson) : null,
  openFrom: row.openFrom,
  openTo: row.openTo,
  durationMin: row.durationMin,
  mission: row.missionJson ? JSON.parse(row.missionJson) : null
});

/**
 * POST /api/plans/generate
 * Contract-compliant AI planner endpoint reading from Person B's SQLite shops table
 */
router.post('/generate', (req, res) => {
  try {
    const { districtId, budget, style, radiusKm, startLat, startLng, people, startTime } = req.body || {};

    const numBudget = Number(budget);
    if (!Number.isFinite(numBudget) || numBudget <= 0) {
      return res.status(400).json({ error: 'กรุณาระบุงบประมาณให้ถูกต้อง' });
    }
    if (style && !['chill', 'challenge'].includes(style)) {
      return res.status(400).json({ error: 'สไตล์ต้องเป็น chill หรือ challenge' });
    }

    if (districtId && !DISTRICTS[districtId]) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลร้านค้าสำหรับย่านที่เลือก' });
    }

    const rows = districtId
      ? db.prepare('SELECT * FROM shops WHERE district = ?').all(DISTRICTS[districtId])
      : db.prepare('SELECT * FROM shops').all();
    const shops = rows.map(serializeShop);

    const result = generatePlan(shops, {
      budget: numBudget,
      style: style || 'chill',
      radiusKm: Number(radiusKm) || 3,
      startLat: Number(startLat) || 13.7335,
      startLng: Number(startLng) || 100.5126,
      people: Number(people) || 1,
      startTime: startTime || '10:00',
      districtName: districtId ? DISTRICTS[districtId] : undefined
    });

    if (!result.plan || result.plan.items.length === 0) {
      return res.status(404).json({ error: result.warning || 'ไม่พบสถานที่ท่องเที่ยวในเงื่อนไขที่กำหนด' });
    }

    result.plan.districtId = districtId || null;
    return res.json({ plan: result.plan, warning: result.warning });
  } catch (error) {
    console.error('[Error POST /api/plans/generate]:', error);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้างแผนท่องเที่ยว' });
  }
});

module.exports = router;
