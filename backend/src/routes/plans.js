const express = require('express');
const crypto = require('node:crypto');
const router = express.Router();
const db = require('../db');
const { generatePlan } = require('../lib/planner');
const { DISTRICTS } = require('../lib/districts');

const TRAVEL_STYLES = new Set(['chill', 'cafe', 'foodie', 'photo', 'art', 'heritage', 'challenge', 'night']);
const CHALLENGE_STYLES = new Set(['foodie', 'challenge', 'night']);
const DEMO_SHOP_CATEGORIES = ['cafe', 'food', 'photo', 'dessert', 'activity', 'food'];

function createDemoDestinationShops({ districtId, districtName, startLat, startLng, budget }) {
  if (
    typeof districtId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(districtId) ||
    typeof districtName !== 'string' || !districtName.trim() || districtName.length > 120 ||
    !Number.isFinite(startLat) || startLat < -90 || startLat > 90 ||
    !Number.isFinite(startLng) || startLng < -180 || startLng > 180
  ) return null;

  const key = crypto.createHash('sha256')
    .update(`${districtId}:${startLat}:${startLng}:${budget}`)
    .digest('hex')
    .slice(0, 16);
  const rows = DEMO_SHOP_CATEGORIES.map((category, index) => {
    const id = `demo_${key}_${index + 1}`;
    const name = `จุดตัวอย่าง ${index + 1} · ${districtName.trim()}`;
    const row = {
      id,
      name,
      district: districtName.trim(),
      category,
      lat: startLat + (index % 2 === 0 ? 1 : -1) * 0.0002 * (index + 1),
      lng: startLng + (index % 3 === 0 ? -1 : 1) * 0.0002 * (index + 1),
      avgPrice: Math.floor(budget * [0.2, 0.25, 0, 0.1, 0.1, 0.15][index]),
      tagsJson: JSON.stringify(['chill', 'challenge']),
      recommendedMenu: 'จุดแวะตัวอย่างสำหรับจัดเส้นทางเดโม',
      couponJson: null,
      openFrom: '08:00',
      openTo: '21:00',
      durationMin: 40,
      missionJson: null,
    };
    return row;
  });

  const insertDemoShop = db.prepare(`
    INSERT INTO shops
      (id, name, district, category, lat, lng, avgPrice, tagsJson, recommendedMenu,
       couponJson, openFrom, openTo, durationMin, missionJson, isDemo)
    VALUES
      (@id, @name, @district, @category, @lat, @lng, @avgPrice, @tagsJson, @recommendedMenu,
       @couponJson, @openFrom, @openTo, @durationMin, @missionJson, 1)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name, district=excluded.district, category=excluded.category,
      lat=excluded.lat, lng=excluded.lng, avgPrice=excluded.avgPrice,
      tagsJson=excluded.tagsJson, recommendedMenu=excluded.recommendedMenu,
      openFrom=excluded.openFrom, openTo=excluded.openTo, isDemo=1
  `);
  db.transaction((shops) => shops.forEach((shop) => insertDemoShop.run(shop)))(rows);
  return rows.map((row) => ({ ...row, isDemo: 1 }));
}

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
    const {
      districtId, districtName, provinceId, provinceName,
      budget, style, radiusKm, startLat, startLng, people, startTime
    } = req.body || {};

    const numBudget = Number(budget);
    if (!Number.isFinite(numBudget) || numBudget <= 0) {
      return res.status(400).json({ error: 'กรุณาระบุงบประมาณให้ถูกต้อง' });
    }
    if (style && !TRAVEL_STYLES.has(style)) {
      return res.status(400).json({ error: 'สไตล์การท่องเที่ยวไม่ถูกต้อง' });
    }

    const rows = districtId
      ? DISTRICTS[districtId]
        ? db.prepare('SELECT * FROM shops WHERE district = ? AND isDemo = 0').all(DISTRICTS[districtId])
        : []
      : db.prepare('SELECT * FROM shops WHERE isDemo = 0').all();

    const shops = rows.map(serializeShop);
    const planOptions = {
      budget: numBudget,
      style: CHALLENGE_STYLES.has(style) ? 'challenge' : 'chill',
      radiusKm: Number(radiusKm) || 3,
      startLat: Number(startLat) || 13.7335,
      startLng: Number(startLng) || 100.5126,
      people: Number(people) || 1,
      startTime: startTime || '10:00',
      districtName: districtId ? (DISTRICTS[districtId] || districtName) : undefined
    };
    let result = generatePlan(shops, planOptions);
    let demoGenerated = false;
    if (districtId && result.plan?.items.length < 3) {
      const demoShops = createDemoDestinationShops({
        districtId,
        districtName: districtName || DISTRICTS[districtId] || 'ย่านที่เลือก',
        startLat: planOptions.startLat,
        startLng: planOptions.startLng,
        budget: numBudget,
      }) || [];
      result = generatePlan(demoShops.map(serializeShop), planOptions);
      demoGenerated = result.plan?.items.length > 0;
    }

    if (!result.plan || result.plan.items.length === 0) {
      return res.status(404).json({ error: result.warning || 'ไม่พบสถานที่ท่องเที่ยวในเงื่อนไขที่กำหนด' });
    }

    result.plan.districtId = districtId || null;
    result.plan.style = style || 'chill';
    if (demoGenerated) {
      result.plan.demoGenerated = true;
      result.plan.title = `แผนตัวอย่างเดโม · ${districtName || DISTRICTS[districtId] || 'ย่านที่เลือก'}`;
    }
    if (typeof districtName === 'string' && districtName.length <= 120) {
      result.plan.districtName = districtName;
    }
    if (typeof provinceId === 'string' && provinceId.length <= 120) {
      result.plan.provinceId = provinceId;
    }
    if (typeof provinceName === 'string' && provinceName.length <= 120) {
      result.plan.provinceName = provinceName;
    }
    return res.json({
      plan: result.plan,
      warning: demoGenerated
        ? 'ย่านนี้มีข้อมูลร้านจริงไม่เพียงพอสำหรับจัดแผน จึงใช้จุดตัวอย่างที่ไม่มีคูปองหรือสิทธิประโยชน์จริง โปรดตรวจสอบสถานที่ก่อนเดินทาง'
        : result.warning
    });
  } catch (error) {
    console.error('[Error POST /api/plans/generate]:', error);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้างแผนท่องเที่ยว' });
  }
});

module.exports = router;
