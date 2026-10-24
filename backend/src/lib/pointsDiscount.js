/**
 * Points Discount Calculator Utility
 * รับผิดชอบโดย: คน C (ส่งให้คน B เรียกใช้ในระบบคำสั่งซื้อ POST /api/orders)
 *
 * กฎการแลกแต้ม:
 * 1. อัตราแลกเปลี่ยน: 1 แต้ม = ส่วนลด 2 บาท
 * 2. เพดานสูงสุด: ใช้ลดได้ไม่เกิน 30% ของยอดรวมคำสั่งซื้อ
 * 3. จำนวนแต้มที่ใช้ได้จริง ต้องไม่เกินแต้มสะสมที่ผู้ใช้มีอยู่
 */

/**
 * คำนวณส่วนลดจากแต้มและยอดชำระสุทธิ
 *
 * @param {number} totalPoints แต้มสะสมทั้งหมดที่ผู้ใช้มีในระบบ
 * @param {number} pointsToUse จำนวนแต้มที่ผู้ใช้ระบุว่าต้องการนำมาใช้
 * @param {number} orderAmount ยอดรวมคำสั่งซื้อก่อนหักส่วนลด (บาท)
 * @returns {Object} { discountBaht, pointsDeducted, finalAmount }
 */
function calcPointsDiscount(totalPoints, pointsToUse, orderAmount) {
  const grossAmount = Math.max(0, Number(orderAmount) || 0);
  const userPoints = Math.max(0, parseInt(totalPoints, 10) || 0);
  const requested = Math.max(0, parseInt(pointsToUse, 10) || 0);

  // เพดานส่วนลด 30% ของยอดออเดอร์ (แปลงเป็นเพดานแต้มสูงสุด)
  const maxDiscountAllowed = Math.floor(grossAmount * 0.3);
  const maxPointsAllowed = Math.floor(maxDiscountAllowed / 2);

  // จำนวนแต้มที่ใช้ได้จริง (ไม่เกินที่ขอ ไม่เกินที่มี และไม่เกินเพดาน 30%)
  const pointsDeducted = Math.min(requested, userPoints, maxPointsAllowed);

  // มูลค่าส่วนลดจริง (1 แต้ม = 2 บาท)
  const discountBaht = pointsDeducted * 2;

  // ยอดชำระสุทธิ
  const finalAmount = Math.max(0, grossAmount - discountBaht);

  return {
    discountBaht,
    pointsDeducted,
    finalAmount
  };
}

module.exports = {
  calcPointsDiscount
};
