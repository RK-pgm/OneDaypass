const assert = require('assert');
const { calcPointsDiscount } = require('../src/lib/pointsDiscount');

console.log('🧪 Testing lib/pointsDiscount.js...\n');

// Case 1: ไม่ใช้แต้มเลย
const res1 = calcPointsDiscount(50, 0, 398);
assert.strictEqual(res1.discountBaht, 0);
assert.strictEqual(res1.pointsDeducted, 0);
assert.strictEqual(res1.finalAmount, 398);
console.log('  ✅ Case 1: 0 points requested -> 0 discount');

// Case 2: ใช้แต้ม 10 แต้ม (มูลค่า 20 บาท, อยู่ในกรอบ 30% ของ 398 = 119 บาท)
const res2 = calcPointsDiscount(50, 10, 398);
assert.strictEqual(res2.discountBaht, 20);
assert.strictEqual(res2.pointsDeducted, 10);
assert.strictEqual(res2.finalAmount, 378);
console.log('  ✅ Case 2: 10 points -> ฿20 discount (฿398 -> ฿378)');

// Case 3: ขอใช้แต้ม 100 แต้ม (เกินเพดาน 30% ของ 398 = 119 บาท)
// 119 บาท / 2 = สูงสุด 59 แต้ม (ลดได้ 118 บาท)
const res3 = calcPointsDiscount(100, 100, 398);
assert(res3.discountBaht <= 119, 'Discount must not exceed 30% ceiling');
assert.strictEqual(res3.discountBaht, 118);
assert.strictEqual(res3.pointsDeducted, 59);
assert.strictEqual(res3.finalAmount, 280);
console.log(`  ✅ Case 3: 100 points capped at 30% ceiling -> ฿${res3.discountBaht} discount (${res3.pointsDeducted} pts used)`);

// Case 4: ขอใช้แต้มมากกว่าที่ตนเองมี (มี 5 แต้ม แต่ขอใช้ 20 แต้ม)
const res4 = calcPointsDiscount(5, 20, 398);
assert.strictEqual(res4.discountBaht, 10); // 5 แต้ม * 2 = 10 บาท
assert.strictEqual(res4.pointsDeducted, 5);
assert.strictEqual(res4.finalAmount, 388);
console.log('  ✅ Case 4: Requesting more than available capped at user balance (5 pts -> ฿10 discount)');

console.log('\n🎉 ALL POINTS DISCOUNT TESTS PASSED 100%!');
