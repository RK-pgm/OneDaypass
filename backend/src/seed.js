const db = require('./db');

const shops = require('../seed/shops.json');
const allowedCategories = new Set(['cafe', 'food', 'dessert', 'photo', 'activity']);

function validateShop(shop, index) {
  const prefix = `shops[${index}]`;
  if (!shop || typeof shop !== 'object' || Array.isArray(shop)) throw new Error(`${prefix} ต้องเป็น object`);
  if (typeof shop.id !== 'string' || !shop.id.trim()) throw new Error(`${prefix}.id ต้องเป็นข้อความ`);
  if (typeof shop.name !== 'string' || !shop.name.trim()) throw new Error(`${prefix}.name ต้องเป็นข้อความ`);
  if (typeof shop.district !== 'string' || !shop.district.trim()) throw new Error(`${prefix}.district ต้องเป็นข้อความ`);
  if (!allowedCategories.has(shop.category)) throw new Error(`${prefix}.category ไม่อยู่ในหมวดที่กำหนด`);
  if (typeof shop.lat !== 'number' || !Number.isFinite(shop.lat) || shop.lat < -90 || shop.lat > 90) throw new Error(`${prefix}.lat ไม่ถูกต้อง`);
  if (typeof shop.lng !== 'number' || !Number.isFinite(shop.lng) || shop.lng < -180 || shop.lng > 180) throw new Error(`${prefix}.lng ไม่ถูกต้อง`);
  if (!Number.isInteger(shop.avgPrice) || shop.avgPrice < 0) throw new Error(`${prefix}.avgPrice ต้องเป็นจำนวนเต็มไม่ติดลบ`);
  if (!Array.isArray(shop.tags) || shop.tags.some((tag) => !['chill', 'challenge'].includes(tag))) throw new Error(`${prefix}.tags ต้องเป็น array ของ chill/challenge`);
  if (!Number.isInteger(shop.durationMin) || shop.durationMin < 1) throw new Error(`${prefix}.durationMin ต้องมากกว่า 0`);
  if (shop.coupon !== null && (!shop.coupon || typeof shop.coupon.title !== 'string')) throw new Error(`${prefix}.coupon ต้องเป็น object ที่มี title หรือ null`);
  if (shop.mission !== null && (!shop.mission || typeof shop.mission.title !== 'string' || !Number.isInteger(shop.mission.points))) throw new Error(`${prefix}.mission ต้องมี title และ points หรือ null`);
}

function seedShops() {
  if (!Array.isArray(shops)) throw new Error('ไฟล์ shops.json ต้องเป็น array');
  shops.forEach(validateShop);

  const upsert = db.prepare(`INSERT INTO shops
    (id, name, district, category, lat, lng, avgPrice, tagsJson, recommendedMenu,
     couponJson, openFrom, openTo, durationMin, missionJson)
    VALUES (@id, @name, @district, @category, @lat, @lng, @avgPrice, @tagsJson,
     @recommendedMenu, @couponJson, @openFrom, @openTo, @durationMin, @missionJson)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name, district=excluded.district, category=excluded.category,
      lat=excluded.lat, lng=excluded.lng, avgPrice=excluded.avgPrice,
      tagsJson=excluded.tagsJson, recommendedMenu=excluded.recommendedMenu,
      couponJson=excluded.couponJson, openFrom=excluded.openFrom, openTo=excluded.openTo,
      durationMin=excluded.durationMin, missionJson=excluded.missionJson`);
  const seed = db.transaction((records) => {
    for (const shop of records) {
      upsert.run({
        ...shop,
        tagsJson: JSON.stringify(shop.tags),
        recommendedMenu: shop.recommendedMenu || null,
        couponJson: shop.coupon ? JSON.stringify(shop.coupon) : null,
        openFrom: shop.openFrom || null,
        openTo: shop.openTo || null,
        missionJson: shop.mission ? JSON.stringify(shop.mission) : null
      });
    }
  });
  seed(shops);
  console.log(`Seeded ${shops.length} shops`);
}

if (require.main === module) {
  try {
    seedShops();
  } catch (error) {
    console.error(`Seed failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

module.exports = seedShops;
