/**
 * Core Itinerary Planner Algorithm
 * รับผิดชอบโดย: คน C (สมองของ DayPass)
 *
 * ฟังก์ชันล้วน ไม่ผูกกับ Database หรือ Express สามารถทดสอบด้วย Unit Test ได้โดยตรง
 */

const { distanceKm } = require('./haversine');

/**
 * แปลงเวลา "HH:mm" เป็นจำนวนนาทีนับจาก 00:00
 */
function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 600; // default 10:00
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * แปลงจำนวนนาทีเป็นสตริงเวลา "HH:mm"
 */
function minutesToTime(totalMins) {
  const norm = ((totalMins % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * คำนวณเวลาเดิน (นาที) จากระยะทางกิโลเมตร
 * สมมติฐาน: เดินตรอกซอกซอย 4.5 กม./ชม. (~13 นาที/กม.) มีขั้นต่ำ 5 นาที
 */
function walkingTimeMinutes(distKm) {
  if (!distKm || distKm <= 0.05) return 3;
  return Math.max(5, Math.round(distKm * 13));
}

/**
 * ตรวจสอบว่าร้านเปิดบริการในช่วงเวลาที่จะไปถึงหรือไม่
 */
function isShopOpen(shop, arrivalMins, stayMins) {
  const openMins = shop.openFrom ? timeToMinutes(shop.openFrom) : 480; // default 08:00
  const closeMins = shop.openTo ? timeToMinutes(shop.openTo) : 1260; // default 21:00
  const arrivalOfDay = ((arrivalMins % 1440) + 1440) % 1440;
  const leaving = arrivalOfDay + stayMins;
  if (closeMins <= openMins) {
    // ร้านที่เปิดข้ามเที่ยงคืน เช่น 18:00-02:00
    return arrivalOfDay >= openMins
      ? leaving <= 1440 + closeMins + 15
      : arrivalOfDay < closeMins && leaving <= closeMins + 15;
  }
  return arrivalOfDay >= openMins && leaving <= closeMins + 15;
}

/**
 * สรุปคำอธิบายกิจกรรมภาษาไทยตามหมวดหมู่และเมนูแนะนำ
 */
function createActivityText(shop) {
  switch (shop.category) {
    case 'cafe':
      return `นั่งพักผ่อนชิลๆ จิบเครื่องดื่ม ลอง ${shop.recommendedMenu}`;
    case 'food':
      return `ลิ้มลองมื้ออร่อยประจำย่าน ${shop.recommendedMenu}`;
    case 'dessert':
      return `เติมความหวานกับเมนูเด็ด ${shop.recommendedMenu}`;
    case 'photo':
      return `ถ่ายรูปเช็กอินไฮไลต์ ${shop.recommendedMenu || shop.name}`;
    case 'activity':
      return `เปิดประสบการณ์และชมวัฒนธรรม ${shop.recommendedMenu || shop.name}`;
    default:
      return `แวะเช็กอินและเพลิดเพลินที่ ${shop.name}`;
  }
}

/**
 * อัลกอริทึมสร้างแผนเที่ยวหลัก (generatePlan)
 *
 * @param {Array} shops ข้อมูลร้านทั้งหมด (array of objects)
 * @param {Object} options ตัวแปรเงื่อนไข { budget, style, radiusKm, startLat, startLng, people, startTime }
 * @returns {Object} { plan: { title, style, totalCostPerPerson, items }, warning: string|null }
 */
function generatePlan(shops = [], options = {}) {
  const {
    budget = 500,
    style = 'chill',
    radiusKm = 3,
    startLat = 13.7335,
    startLng = 100.5126,
    people = 1,
    startTime = '10:00',
    maxDurationMin,
    districtName = 'ตลาดน้อย',
    targetStops,
    requiredCoupons = 0,
    requiredMissions = 0,
  } = options;

  const numBudget = Math.max(100, Number(budget) || 500);
  const numRadius = Math.max(0.2, Number(radiusKm) || 3);
  const numStartLat = Number(startLat) || 13.7335;
  const numStartLng = Number(startLng) || 100.5126;

  // 1. กรองร้านตามระยะทางจากจุดเริ่มต้น
  const shopsInRange = shops
    .map((s) => ({
      ...s,
      distFromStart: distanceKm(numStartLat, numStartLng, s.lat, s.lng)
    }))
    .filter((s) => s.distFromStart <= numRadius);

  // กรณีไม่พบร้านเลยในระยะ
  if (shopsInRange.length === 0) {
    return {
      plan: {
        title: `DayPass ${districtName} (${style === 'challenge' ? 'สายลุย' : 'สายชิล'})`,
        style,
        totalCostPerPerson: 0,
        items: []
      },
      warning: `ไม่พบสถานที่ท่องเที่ยวในรัศมี ${numRadius} กม. กรุณาเพิ่มระยะทางค้นหา`
    };
  }

  // 2. กำหนดโครงสร้างลำดับจุดเที่ยว (Slot Blueprint) ตามสไตล์
  // ชิล = 4 จุด (cafe -> food -> photo/dessert -> food เย็น)
  // ท้าทาย = 5-6 จุด (activity -> food -> photo -> activity -> food -> dessert)
  const chillSlots = [
    { targetCategories: ['cafe'], maxStayMin: 60 },
    { targetCategories: ['food'], maxStayMin: 45 },
    { targetCategories: ['photo', 'dessert', 'activity'], maxStayMin: 35 },
    { targetCategories: ['food', 'cafe'], maxStayMin: 60 }
  ];

  const challengeSlots = [
    { targetCategories: ['activity', 'photo'], maxStayMin: 35 },
    { targetCategories: ['food'], maxStayMin: 35 },
    { targetCategories: ['photo'], maxStayMin: 25 },
    { targetCategories: ['activity', 'cafe'], maxStayMin: 40 },
    { targetCategories: ['food'], maxStayMin: 40 },
    { targetCategories: ['dessert', 'cafe'], maxStayMin: 25 }
  ];

  const baseBlueprint = style === 'challenge' ? challengeSlots : chillSlots;
  const blueprint = Number.isInteger(targetStops) && targetStops > 0
    ? Array.from({ length: targetStops }, (_, index) => baseBlueprint[Math.min(index, baseBlueprint.length - 1)])
    : baseBlueprint;

  // 3. วนเลือกร้านทีละช่วงด้วย Greedy Nearest-Neighbor
  const selectedItems = [];
  const usedShopIds = new Set();
  let currentLat = numStartLat;
  let currentLng = numStartLng;
  let currentMins = timeToMinutes(startTime);
  let accumulatedCost = 0;

  for (let slotIdx = 0; slotIdx < blueprint.length; slotIdx++) {
    const slot = blueprint[slotIdx];
    const remainingBudget = numBudget - accumulatedCost;
    const selectedCoupons = selectedItems.filter((item) => item.shop.coupon).length;
    const selectedMissions = selectedItems.filter((item) => item.shop.mission).length;
    const remainingSlots = blueprint.length - slotIdx;

    // หาร้านที่ยังไม่เคยใช้ และอยู่ในหมวดหมู่ที่ต้องการ
    let candidates = shopsInRange.filter(
      (s) => !usedShopIds.has(s.id) && slot.targetCategories.includes(s.category)
    );

    // ถ้าไม่มีร้านตรงหมวดในสล็อต ให้ผ่อนปรนเอาร้านใดก็ได้ที่ยังไม่ใช้
    if (candidates.length === 0) {
      candidates = shopsInRange.filter((s) => !usedShopIds.has(s.id));
    }

    if (candidates.length === 0) break; // ไม่มีร้านเหลือแล้ว

    // Never pick a stop that makes the itinerary exceed the requested budget.
    // If this slot has no affordable option, try any affordable stop in range
    // before ending the plan early.
    const affordableCandidates = candidates.filter(
      (shop) => Number(shop.avgPrice) <= remainingBudget
    );
    if (affordableCandidates.length > 0) {
      candidates = affordableCandidates;
    } else {
      candidates = shopsInRange.filter(
        (shop) => !usedShopIds.has(shop.id) && Number(shop.avgPrice) <= remainingBudget
      );
      if (candidates.length === 0) break;
    }

    // ให้คะแนนและเรียงลำดับร้าน:
    // - ตรงกับเวลาเปิด-ปิด (ต้องเปิด)
    // - คุมให้อยู่ในงบประมาณ (ถ้างบเกิน ให้หักคะแนนหนัก)
    // - ใกล้จุดก่อนหน้ามากที่สุด (Nearest Neighbor)
    // - ตรงกับแท็กสไตล์ (chill / challenge)
    const evaluatedCandidates = candidates.map((shop) => {
      const distFromPrev = distanceKm(currentLat, currentLng, shop.lat, shop.lng);
      const walkMins = walkingTimeMinutes(distFromPrev);
      const arrivalMins = currentMins + walkMins;
      const stayDuration = Math.min(shop.durationMin || 45, slot.maxStayMin);
      const isOpen = isShopOpen(shop, arrivalMins, stayDuration);
      const withinTripTime = !Number.isFinite(maxDurationMin)
        || arrivalMins + stayDuration <= timeToMinutes(startTime) + maxDurationMin;
      const matchesStyle = Array.isArray(shop.tags) && shop.tags.includes(style);

      let score = 0;
      if (isOpen) {
        score += 200;
      } else {
        score -= 1000; // ร้านปิด หักคะแนนรุนแรง
      }
      if (!withinTripTime) score -= 1000;

      score += 100;
      // ถ้างบเหลือน้อย ให้ความสำคัญกับร้านที่ราคาประหยัด
      if (remainingBudget < 250) {
        score += Math.max(0, 200 - shop.avgPrice);
      }

      if (matchesStyle) score += 30;
      if (shop.coupon && selectedCoupons < requiredCoupons && remainingSlots >= requiredCoupons - selectedCoupons) {
        score += 500;
      }
      if (shop.mission && selectedMissions < requiredMissions && remainingSlots >= requiredMissions - selectedMissions) {
        score += 500;
      }
      score -= distFromPrev * 15;

      return {
        shop,
        distFromPrev,
        walkMins,
        arrivalMins,
        stayDuration,
        isOpen,
        score
      };
    });

    // เรียงจากคะแนนมากไปน้อย
    evaluatedCandidates.sort((a, b) => b.score - a.score);

    // เลือกร้านที่ดีที่สุด
    const bestChoice = evaluatedCandidates[0];
    if (!bestChoice || bestChoice.score < -400) break;

    const chosenShop = bestChoice.shop;
    usedShopIds.add(chosenShop.id);
    accumulatedCost += chosenShop.avgPrice;

    // คำนวณเวลา
    const arrivalTimeStr = minutesToTime(bestChoice.arrivalMins);
    currentMins = bestChoice.arrivalMins + bestChoice.stayDuration;
    currentLat = chosenShop.lat;
    currentLng = chosenShop.lng;

    selectedItems.push({
      shop: chosenShop,
      time: arrivalTimeStr,
      durationMin: bestChoice.stayDuration,
      distFromPrevKm: bestChoice.distFromPrev,
      estCost: chosenShop.avgPrice
    });
  }

  // 4. จัดคูปองให้ 2-3 ร้านอาหาร/คาเฟ่ และใส่มิชชั่น
  let couponAssignedCount = 0;
  const maxCoupons = Number.isInteger(requiredCoupons) && requiredCoupons > 0 ? requiredCoupons : 3;

  const planItems = selectedItems.map((item, index) => {
    const s = item.shop;

    // ใส่คูปอง (ถ้ามี และยังไม่เกินโควตา 3 ใบ)
    let couponObj = null;
    if (s.coupon && couponAssignedCount < maxCoupons) {
      couponObj = {
        id: `c-${s.id}`,
        title: s.coupon.title,
        valueText: s.coupon.valueText || ''
      };
      couponAssignedCount++;
    }

    // ใส่มิชชั่น (ถ้ามี)
    let missionObj = null;
    if (s.mission) {
      missionObj = {
        id: `m-${s.id}`,
        title: s.mission.title,
        points: s.mission.points || 5
      };
    }

    return {
      order: index + 1,
      time: item.time,
      shopId: s.id,
      shopName: s.name,
      category: s.category,
      lat: s.lat,
      lng: s.lng,
      activity: createActivityText(s),
      estCost: item.estCost,
      durationMin: item.durationMin,
      distanceFromPrevKm: item.distFromPrevKm,
      coupon: couponObj,
      mission: missionObj
    };
  });

  const totalCostPerPerson = planItems.reduce((sum, it) => sum + it.estCost, 0);

  const title =
    style === 'challenge'
      ? `DayPass ${districtName} สายลุยล่าแต้ม & เช็กอินจุดลับ (${planItems.length} จุดเด็ด)`
      : `DayPass ${districtName} วันเดียวเที่ยวเพลินฉบับสโลว์ไลฟ์ (${planItems.length} จุดเช็กอิน)`;

  let warning = null;
  if (planItems.length < blueprint.length) {
    warning = `พบสถานที่ที่เปิดบริการและอยู่ในรัศมีเพียง ${planItems.length} จุด ระบบจึงจัดแผนที่ดีที่สุดเท่าที่มีให้ครับ`;
  }

  return {
    plan: {
      title,
      style,
      totalCostPerPerson,
      items: planItems
    },
    warning
  };
}

module.exports = {
  generatePlan,
  walkingTimeMinutes,
  isShopOpen,
  timeToMinutes,
  minutesToTime
};
