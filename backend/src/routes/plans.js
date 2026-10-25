const express = require('express');
const crypto = require('node:crypto');
const router = express.Router();
const db = require('../db');
const { generatePlan } = require('../lib/planner');
const { DISTRICTS } = require('../lib/districts');
const { PASS_PACKAGE_CONFIG } = require('../lib/passPackages');

const TRAVEL_STYLES = new Set(['chill', 'cafe', 'foodie', 'photo', 'art', 'heritage', 'challenge', 'night']);
const CHALLENGE_STYLES = new Set(['foodie', 'challenge', 'night']);
const DEMO_SHOP_CATEGORIES = ['cafe', 'food', 'photo', 'dessert', 'activity', 'food'];

async function createDemoDestinationShops({ districtId, districtName, startLat, startLng, includeDemoBenefits = false }) {
  if (
    typeof districtId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(districtId) ||
    typeof districtName !== 'string' || !districtName.trim() || districtName.length > 120 ||
    !Number.isFinite(startLat) || startLat < -90 || startLat > 90 ||
    !Number.isFinite(startLng) || startLng < -180 || startLng > 180
  ) return null;

  const key = crypto.createHash('sha256')
    .update(`${districtId}:${startLat}:${startLng}:${includeDemoBenefits ? 'benefits' : 'stops'}`)
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
      avgPrice: 0,
      tagsJson: JSON.stringify(['chill', 'challenge']),
      recommendedMenu: 'จุดแวะตัวอย่างสำหรับจัดเส้นทางเดโม',
      couponJson: includeDemoBenefits && index < 2
        ? JSON.stringify({
          title: `คูปองตัวอย่าง ${index + 1} (ไม่มีสิทธิ์ร้านค้าจริง)`,
          valueText: 'สิทธิ์ตัวอย่างสำหรับทดลองระบบเท่านั้น',
        })
        : null,
      openFrom: '08:00',
      openTo: '21:00',
      durationMin: 40,
      missionJson: includeDemoBenefits && index === 0
        ? JSON.stringify({ title: 'ภารกิจตัวอย่าง (ไม่มีสิทธิ์ร้านค้าจริง)', points: 5 })
        : null,
    };
    return row;
  });

  const insertDemoShop = `
    INSERT INTO shops
      (id, name, district, category, lat, lng, avgPrice, tagsJson, recommendedMenu,
       couponJson, openFrom, openTo, durationMin, missionJson, isDemo)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name, district=excluded.district, category=excluded.category,
      lat=excluded.lat, lng=excluded.lng, avgPrice=excluded.avgPrice,
      tagsJson=excluded.tagsJson, recommendedMenu=excluded.recommendedMenu,
      couponJson=excluded.couponJson, durationMin=excluded.durationMin,
      missionJson=excluded.missionJson,
      openFrom=excluded.openFrom, openTo=excluded.openTo, isDemo=1
  `;
  await db.transaction(async () => {
    for (const shop of rows) {
      await db.run(insertDemoShop,
        shop.id, shop.name, shop.district, shop.category, shop.lat, shop.lng, shop.avgPrice,
        shop.tagsJson, shop.recommendedMenu, shop.couponJson, shop.openFrom, shop.openTo,
        shop.durationMin, shop.missionJson);
    }
  });
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
  mission: row.missionJson ? JSON.parse(row.missionJson) : null,
  isDemo: Boolean(row.isDemo)
});

/**
 * POST /api/plans/generate
 * Contract-compliant AI planner endpoint reading from Person B's SQLite shops table
 */
router.post('/generate', async (req, res, next) => {
  try {
    const {
      districtId, districtName, provinceId, provinceName,
      budget, style, radiusKm, startLat, startLng, people, startTime, passPackageId
    } = req.body || {};

    const requestedPackage = passPackageId ? PASS_PACKAGE_CONFIG[passPackageId] : null;
    if (passPackageId && !requestedPackage) {
      return res.status(400).json({ error: 'รูปแบบพาสไม่ถูกต้อง กรุณาเลือกพาสที่มีในระบบ' });
    }
    const numBudget = Number(budget);
    if (!Number.isFinite(numBudget) || numBudget <= 0) {
      return res.status(400).json({ error: 'กรุณาระบุงบประมาณให้ถูกต้อง' });
    }
    if (style && !TRAVEL_STYLES.has(style)) {
      return res.status(400).json({ error: 'สไตล์การท่องเที่ยวไม่ถูกต้อง' });
    }
    const isTime = (value) => typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
    if ((startTime !== undefined && !isTime(startTime)) || (req.body?.endTime !== undefined && !isTime(req.body.endTime))) {
      return res.status(400).json({ error: 'ช่วงเวลาเที่ยวไม่ถูกต้อง' });
    }
    const planStartTime = startTime || '10:00';
    const planEndTime = req.body?.endTime || '18:00';
    const timeMinutes = (value) => {
      const [hours, minutes] = value.split(':').map(Number);
      return hours * 60 + minutes;
    };
    const startMinutes = timeMinutes(planStartTime);
    let endMinutes = timeMinutes(planEndTime);
    if (endMinutes <= startMinutes) endMinutes += 24 * 60;

    const rows = districtId
      ? DISTRICTS[districtId]
        ? await db.all('SELECT * FROM shops WHERE district = ? AND isDemo = 0', DISTRICTS[districtId])
        : []
      : await db.all('SELECT * FROM shops WHERE isDemo = 0');

    const shops = rows.map(serializeShop);
    const requiredCoupons = requestedPackage?.couponCount || 0;
    const requiredMissions = requestedPackage?.missionCount || 0;
    const planOptions = {
      budget: numBudget,
      style: CHALLENGE_STYLES.has(style) ? 'challenge' : 'chill',
      radiusKm: Number(radiusKm) || 3,
      startLat: Number(startLat) || 13.7335,
      startLng: Number(startLng) || 100.5126,
      people: Number(people) || 1,
      startTime: planStartTime,
      endTime: planEndTime,
      maxDurationMin: endMinutes - startMinutes,
      districtName: districtId ? (DISTRICTS[districtId] || districtName) : undefined,
      targetStops: requestedPackage?.placesCount,
      requiredCoupons,
      requiredMissions,
    };
    let result = generatePlan(shops, planOptions);
    const packagePlanIsComplete = (plan) => plan &&
      plan.items.length === requestedPackage?.placesCount &&
      plan.items.filter((item) => item.coupon).length >= requiredCoupons &&
      plan.items.filter((item) => item.mission).length >= requiredMissions;
    const packageNeedsDemoStops = requestedPackage && !packagePlanIsComplete(result.plan);
    const regularPlanNeedsDemoStops = !requestedPackage && districtId && result.plan?.items.length < 3;
    if (packageNeedsDemoStops || regularPlanNeedsDemoStops) {
      const demoShops = await createDemoDestinationShops({
        districtId: districtId || 'custom',
        districtName: districtName || DISTRICTS[districtId] || 'ย่านที่เลือก',
        startLat: planOptions.startLat,
        startLng: planOptions.startLng,
        includeDemoBenefits: Boolean(requestedPackage?.couponCount),
      }) || [];
      result = generatePlan([...shops, ...demoShops].map(serializeShop), planOptions);
    }

    if (!result.plan || result.plan.items.length === 0) {
      return res.status(404).json({ error: result.warning || 'ไม่พบสถานที่ท่องเที่ยวในเงื่อนไขที่กำหนด' });
    }
    if (requestedPackage && (
      result.plan.items.length !== requestedPackage.placesCount ||
      result.plan.items.filter((item) => item.coupon).length < requiredCoupons ||
      result.plan.items.filter((item) => item.mission).length < requiredMissions
    )) {
      return res.status(422).json({ error: `ไม่สามารถจัดแผน ${requestedPackage.placesCount} จุดพร้อมสิทธิประโยชน์ที่กำหนดได้ กรุณาขยายเวลาเที่ยวหรือปรับรัศมีค้นหา` });
    }

    result.plan.districtId = districtId || null;
    result.plan.style = style || 'chill';
    result.plan.startTime = planStartTime;
    result.plan.endTime = planEndTime;
    const demoGenerated = result.plan.items.some((item) => item.isDemo);
    if (demoGenerated) {
      result.plan.demoGenerated = true;
      result.plan.title = `${result.plan.title} · มีจุดตัวอย่าง`;
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
        ? 'ข้อมูลร้านจริงในย่านนี้ไม่เพียงพอ จึงเติมจุดตัวอย่างให้ครบตามพาส คูปองและมิชชั่นที่ระบุว่าเป็นตัวอย่างใช้สิทธิ์กับร้านค้าจริงไม่ได้'
        : result.warning
    });
  } catch (error) {
    console.error('[Error POST /api/plans/generate]:', error);
    return next(error);
  }
});

module.exports = router;
