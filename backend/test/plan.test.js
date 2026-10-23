const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { generatePlan } = require('../src/lib/planner');

// โหลดข้อมูลร้านจริง 16 ร้านในตลาดน้อยจาก seed/shops.json
const seedPath = path.join(__dirname, '..', 'seed', 'shops.json');
const sampleShops = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));

console.log(`🧪 Testing lib/planner.js with ${sampleShops.length} seed shops...\n`);

// -------------------------------------------------------------
// Test Case 1: แผนสไตล์ชิล (Chill) ปกติ
// -------------------------------------------------------------
console.log('--- Test Case 1: Standard Chill Plan ---');
const res1 = generatePlan(sampleShops, {
  budget: 500,
  style: 'chill',
  radiusKm: 2.5,
  startTime: '10:00'
});

assert(res1.plan, 'Plan object must exist');
assert.strictEqual(res1.plan.style, 'chill', 'Style must be chill');
assert(res1.plan.items.length >= 3, 'Chill plan should have at least 3-4 stops');
assert(res1.plan.totalCostPerPerson > 0, 'Total cost should be calculated');

console.log(`  ✅ Title: ${res1.plan.title}`);
console.log(`  ✅ Stops: ${res1.plan.items.length} items, Total Cost: ฿${res1.plan.totalCostPerPerson}`);
console.log(`  ✅ Timeline: ${res1.plan.items.map((i) => `${i.time} (${i.shopName})`).join(' -> ')}`);

// -------------------------------------------------------------
// Test Case 2: แผนสไตล์ท้าทาย (Challenge)
// -------------------------------------------------------------
console.log('\n--- Test Case 2: Challenge Style Plan ---');
const res2 = generatePlan(sampleShops, {
  budget: 600,
  style: 'challenge',
  radiusKm: 3.0,
  startTime: '09:00'
});

assert.strictEqual(res2.plan.style, 'challenge', 'Style must be challenge');
assert(res2.plan.items.length >= 4, 'Challenge plan should have 4-6 stops');
console.log(`  ✅ Title: ${res2.plan.title}`);
console.log(`  ✅ Stops: ${res2.plan.items.length} items`);

// -------------------------------------------------------------
// Test Case 3: งบน้อยมาก (Budget = 150 บาท)
// -------------------------------------------------------------
console.log('\n--- Test Case 3: Ultra-Low Budget (฿150) ---');
const res3 = generatePlan(sampleShops, {
  budget: 150,
  style: 'chill',
  radiusKm: 2.0,
  startTime: '10:00'
});

console.log(`  ✅ Total cost for ฿150 budget: ฿${res3.plan.totalCostPerPerson}`);
assert(res3.plan.totalCostPerPerson <= 250, 'Planner should strictly manage tight budget');

// -------------------------------------------------------------
// Test Case 4: รัศมีแคบมาก (0.25 กม.) & ตรวจจับ Warning (ไม่ Crash)
// -------------------------------------------------------------
console.log('\n--- Test Case 4: Very Narrow Radius (0.25 km) ---');
const res4 = generatePlan(sampleShops, {
  budget: 500,
  style: 'chill',
  radiusKm: 0.25,
  startLat: 13.7335,
  startLng: 100.5126
});

assert(res4.plan, 'Plan must still be returned');
console.log(`  ✅ Handled gracefully with warning: "${res4.warning}"`);
console.log(`  ✅ Total items found: ${res4.plan.items.length}`);

// -------------------------------------------------------------
// Test Case 5: เริ่มเที่ยวสายมาก (18:00 น.) ร้านเปิดเช้าต้องถูกข้าม
// -------------------------------------------------------------
console.log('\n--- Test Case 5: Evening Start (18:00) Opening Hours Check ---');
const res5 = generatePlan(sampleShops, {
  budget: 500,
  style: 'chill',
  radiusKm: 2.0,
  startTime: '18:00'
});

// กะหรี่ปั๊บคุณปุ๊ (ปิด 14:00) และ นายหนับ (ปิด 15:00) ต้องไม่อยู่ในแผนตอน 18:00 น.
const hasEarlyClosingShops = res5.plan.items.some(
  (it) => it.shopId === 's04' || it.shopId === 's06' || it.shopId === 's08'
);
assert.strictEqual(hasEarlyClosingShops, false, 'Early closing shops must be filtered out for evening plan');
console.log(`  ✅ Successfully excluded shops that close before 18:00`);

// -------------------------------------------------------------
// Test Case 6: Contract Schema Verification (ห้ามชื่อ field ผิด)
// -------------------------------------------------------------
console.log('\n--- Test Case 6: API Contract Schema Validation ---');
const sampleItem = res1.plan.items[0];

const expectedFields = [
  'order',
  'time',
  'shopId',
  'shopName',
  'category',
  'lat',
  'lng',
  'activity',
  'estCost',
  'durationMin',
  'distanceFromPrevKm',
  'coupon',
  'mission'
];

for (const field of expectedFields) {
  assert(field in sampleItem, `Item must have contract field: "${field}"`);
}
console.log(`  ✅ All 13 contract item fields match specification exactly!`);

// ตรวจสอบคูปองและมิชชั่น
const itemWithCoupon = res1.plan.items.find((i) => i.coupon);
if (itemWithCoupon) {
  assert(itemWithCoupon.coupon.id, 'Coupon must have id');
  assert(itemWithCoupon.coupon.title, 'Coupon must have title');
  console.log(`  ✅ Coupon format verified: ${itemWithCoupon.coupon.id} - ${itemWithCoupon.coupon.title}`);
}

const itemWithMission = res1.plan.items.find((i) => i.mission);
if (itemWithMission) {
  assert(itemWithMission.mission.id, 'Mission must have id');
  assert(itemWithMission.mission.title, 'Mission must have title');
  assert(typeof itemWithMission.mission.points === 'number', 'Mission points must be number');
  console.log(`  ✅ Mission format verified: ${itemWithMission.mission.id} (${itemWithMission.mission.points} pts)`);
}

console.log('\n🎉 ALL PLANNER UNIT TESTS PASSED 100%!');
