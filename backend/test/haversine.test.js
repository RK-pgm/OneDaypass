const assert = require('assert');
const { distanceKm, distanceM } = require('../src/lib/haversine');

console.log('🧪 Testing lib/haversine.js...');

// จุดที่ 1: ฮงเซียงกง ตลาดน้อย (13.7335, 100.5126)
// จุดที่ 2: มาเธอร์ โรสเตอร์ ตลาดน้อย (13.7352, 100.5141)
const p1 = { lat: 13.7335, lng: 100.5126 };
const p2 = { lat: 13.7352, lng: 100.5141 };

// 1. จุดเดียวกัน ระยะทางต้องเป็น 0
const zeroKm = distanceKm(p1.lat, p1.lng, p1.lat, p1.lng);
const zeroM = distanceM(p1.lat, p1.lng, p1.lat, p1.lng);
assert.strictEqual(zeroKm, 0, 'Distance to same point should be 0 km');
assert.strictEqual(zeroM, 0, 'Distance to same point should be 0 m');
console.log('  ✅ Case 1: Same point distance is 0');

// 2. ระยะห่างระหว่าง 2 ร้านในตลาดน้อย (ประมาณ 250 เมตร)
const km = distanceKm(p1.lat, p1.lng, p2.lat, p2.lng);
const m = distanceM(p1.lat, p1.lng, p2.lat, p2.lng);

console.log(`  📍 Hong Sieng Kong -> Mother Roaster: ${km} km (${m} m)`);
assert(km > 0.15 && km < 0.35, 'Distance should be around 0.25 km');
assert(m > 150 && m < 350, 'Distance should be around 250 meters');
console.log('  ✅ Case 2: Realistic Talat Noi shops distance calculation');

// 3. ทดสอบการตรวจจับเงื่อนไขเช็กอิน 150 เมตร
// จุดที่ 3: ห่างจากฮงเซียงกง 50 เมตร (อยู่ในระยะ 150 ม. เช็กอินผ่าน)
const p3 = { lat: 13.7338, lng: 100.5128 };
const mClose = distanceM(p1.lat, p1.lng, p3.lat, p3.lng);
console.log(`  📍 Distance close (within 150m): ${mClose} m`);
assert(mClose <= 150, 'Should be within 150m check-in radius');
console.log('  ✅ Case 3: Within 150m checkin rule passed');

// 4. จุดที่ 4: ห่างจากฮงเซียงกง 1.2 กม. (เกิน 150 ม. เช็กอินไม่ผ่าน)
const p4 = { lat: 13.7435, lng: 100.5190 };
const mFar = distanceM(p1.lat, p1.lng, p4.lat, p4.lng);
console.log(`  📍 Distance far (exceeds 150m): ${mFar} m`);
assert(mFar > 150, 'Should exceed 150m check-in radius');
console.log('  ✅ Case 4: Exceeding 150m checkin rule rejected');

console.log('🎉 All haversine tests passed successfully!\n');
