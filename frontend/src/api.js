// ============================================================
//  api.js  — ชั้นเรียก API ทั้งหมด
//  เปลี่ยน USE_MOCK = false เมื่อ backend พร้อม
// ============================================================

export const USE_MOCK = String(import.meta.env.VITE_USE_MOCK ?? 'true').toLowerCase() !== 'false';
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

// ── deviceId (แทน login) ────────────────────────────────────
export function getDeviceId() {
  let id = localStorage.getItem('daypass_device_id');
  if (!id) {
    id = 'dev_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('daypass_device_id', id);
  }
  return id;
}

// ── helper fetch ────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const { headers, ...requestOptions } = options;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...requestOptions,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ─────────────────────────────────────────────────────────────
//  MOCK DATA & DISTRICT PLANS
// ─────────────────────────────────────────────────────────────
export const DISTRICTS = [
  {
    id: 'taladnoi',
    name: 'ตลาดน้อย - เจริญกรุง',
    tag: '🔥 ฮิตตลอดกาล',
    highlight: 'คาเฟ่วินเทจ สตรีทอาร์ตริมเจ้าพระยา และอาหารต้นตำรับ',
    lat: 13.7313,
    lng: 100.5105,
    coverEmoji: '🎨',
    stopsCount: 4,
    avgCost: 299,
  },
  {
    id: 'ari',
    name: 'อารีย์ - พหลโยธิน',
    tag: '☕ สายคาเฟ่ & ชิค',
    highlight: 'คาเฟ่มินิมอล ขนมโฮมเมด บรรยากาศร่มรื่น ถ่ายรูปคุมโทน',
    lat: 13.7797,
    lng: 100.5447,
    coverEmoji: '🥐',
    stopsCount: 4,
    avgCost: 350,
  },
  {
    id: 'banthatthong',
    name: 'บรรทัดทอง - สามย่าน',
    tag: '🍜 สวรรค์สตรีทฟู้ด',
    highlight: 'รวมดาวร้านดังระดับมิชลิน ข้าวต้มปลา โทสต์ฉ่ำเนย บัวลอยลาวา',
    lat: 13.7425,
    lng: 100.5235,
    coverEmoji: '🔥',
    stopsCount: 4,
    avgCost: 250,
  },
  {
    id: 'phranakorn',
    name: 'พระนคร - เสาชิงช้า',
    tag: '🏛️ ย้อนยุคสุดคลาสสิก',
    highlight: 'เดินลัดเลาะเกาะรัตนโกสินทร์ ของกินในตำนาน วิวพระปรางค์',
    lat: 13.7525,
    lng: 100.5015,
    coverEmoji: '🏮',
    stopsCount: 4,
    avgCost: 220,
  },
];

const DISTRICT_PLANS = {
  taladnoi: {
    title: 'วันชิลๆ ย่านตลาดน้อย-เจริญกรุง',
    items: [
      {
        order: 1,
        time: '10:00',
        shopId: 'tn01',
        shopName: 'The Bookshop Cafe ตลาดน้อย',
        category: 'cafe',
        lat: 13.7313,
        lng: 100.5105,
        activity: 'นั่งอ่านหนังสือ จิบกาแฟ Signature Dirty Matcha',
        estCost: 120,
        durationMin: 60,
        distanceFromPrevKm: 0,
        coupon: { id: 'c-tn01', title: 'แถมน้ำแร่ออร์แกนิก 1 ขวด' },
        mission: { id: 'm-tn01', title: 'ถ่ายรูปกาแฟคู่หนังสือเล่มโปรด', points: 5 },
      },
      {
        order: 2,
        time: '11:15',
        shopId: 'tn02',
        shopName: 'Talad Noi Graffiti Alley',
        category: 'photo',
        lat: 13.7325,
        lng: 100.5098,
        activity: 'ถ่ายรูปกราฟฟิตี้และมุมกำแพงโบราณริมแม่น้ำเจ้าพระยา',
        estCost: 0,
        durationMin: 45,
        distanceFromPrevKm: 0.3,
        coupon: null,
        mission: { id: 'm-tn02', title: 'ถ่ายรูปโพสท่าเท่ๆ กับ Street Art', points: 8 },
      },
      {
        order: 3,
        time: '12:15',
        shopId: 'tn03',
        shopName: 'นายมง หอยทอด กระทะเหล็ก',
        category: 'food',
        lat: 13.7298,
        lng: 100.5115,
        activity: 'ชิมหอยนางรมทอดกรอบสูตรเตาถ่านรางวัลมิชลิน',
        estCost: 150,
        durationMin: 45,
        distanceFromPrevKm: 0.5,
        coupon: { id: 'c-tn03', title: 'ลดทันที 20 บาท เมื่อสั่งชุดหอยนางรม' },
        mission: { id: 'm-tn03', title: 'ถ่ายรูปจานหอยทอดควันกรุ่น', points: 5 },
      },
      {
        order: 4,
        time: '13:30',
        shopId: 'tn04',
        shopName: 'บ้านหวานโบราณ Dessert Bar',
        category: 'dessert',
        lat: 13.7308,
        lng: 100.5125,
        activity: 'บิงซูชาไทย และบัวลอยน้ำขิงสูตรลับ 80 ปี',
        estCost: 95,
        durationMin: 40,
        distanceFromPrevKm: 0.2,
        coupon: { id: 'c-tn04', title: 'แถมท็อปปิ้งเฉาก๊วยหนึบ 1 ที่' },
        mission: { id: 'm-tn04', title: 'ถ่ายรูปของหวานคู่แก้วพาส', points: 6 },
      },
    ],
  },
  ari: {
    title: 'วันเก๋ฮอปปิ้ง ย่านอารีย์',
    items: [
      {
        order: 1,
        time: '10:30',
        shopId: 'ar01',
        shopName: 'Nana Coffee Roasters Ari',
        category: 'cafe',
        lat: 13.7797,
        lng: 100.5447,
        activity: 'จิบ Specialty Drip Coffee ท่ามกลางสวนธรรมชาติใจกลางกรุง',
        estCost: 140,
        durationMin: 50,
        distanceFromPrevKm: 0,
        coupon: { id: 'c-ar01', title: 'อัปเกรดเมล็ดกาแฟพรีเมียมฟรี' },
        mission: { id: 'm-ar01', title: 'ถ่ายรูปแสงแดดส่องแก้วกาแฟในสวน', points: 6 },
      },
      {
        order: 2,
        time: '11:30',
        shopId: 'ar02',
        shopName: 'Gump’s Ari Community Space',
        category: 'photo',
        lat: 13.7812,
        lng: 100.5435,
        activity: 'แวะช้อปปิ้ง ถ่ายรูปมุมบันไดนีออนและตู้สติกเกอร์',
        estCost: 0,
        durationMin: 40,
        distanceFromPrevKm: 0.3,
        coupon: null,
        mission: { id: 'm-ar02', title: 'ถ่ายรูปกับฉากสีพาสเทลสุดเก๋', points: 7 },
      },
      {
        order: 3,
        time: '12:30',
        shopId: 'ar03',
        shopName: 'Josh Homemade Pasta & Grill',
        category: 'food',
        lat: 13.7825,
        lng: 100.5412,
        activity: 'พาสต้าเส้นสดทรัฟเฟิล และสลัดผักออร์แกนิก',
        estCost: 190,
        durationMin: 60,
        distanceFromPrevKm: 0.4,
        coupon: { id: 'c-ar03', title: 'รับฟรีขนมปังกระเทียมโฮมเมด 1 ตะกร้า' },
        mission: { id: 'm-ar03', title: 'ถ่ายรูปจานพาสต้าคลุกชีส', points: 5 },
      },
      {
        order: 4,
        time: '14:00',
        shopId: 'ar04',
        shopName: 'Yellow Spoon Pastry',
        category: 'dessert',
        lat: 13.7801,
        lng: 100.5429,
        activity: 'เค้กเลมอนเมอแรงค์ และชาร้อนหอมฟุ้ง',
        estCost: 110,
        durationMin: 45,
        distanceFromPrevKm: 0.3,
        coupon: { id: 'c-ar04', title: 'ส่วนลด 15% สำหรับเครื่องดื่มทุกแก้ว' },
        mission: { id: 'm-ar04', title: 'ถ่ายรูปเค้กสไตล์ฝรั่งเศส', points: 5 },
      },
    ],
  },
  banthatthong: {
    title: 'วันตระเวนกินแหลก ย่านบรรทัดทอง',
    items: [
      {
        order: 1,
        time: '16:00',
        shopId: 'bt01',
        shopName: 'ข้าวต้มปลาสะพานเหลือง บรรทัดทอง',
        category: 'food',
        lat: 13.7425,
        lng: 100.5235,
        activity: 'เปิดหัวด้วยข้าวต้มปลากะพงสด น้ำซุปใสกลมกล่อม',
        estCost: 120,
        durationMin: 45,
        distanceFromPrevKm: 0,
        coupon: { id: 'c-bt01', title: 'แถมน้ำเก๊กฮวยโบราณแก้วใหญ่ 1 แก้ว' },
        mission: { id: 'm-bt01', title: 'ถ่ายรูปเนื้อปลาชิ้นโตควันฉุย', points: 6 },
      },
      {
        order: 2,
        time: '17:00',
        shopId: 'bt02',
        shopName: 'เจ๊โอว หมูกรอบ & ยำแซ่บ',
        category: 'food',
        lat: 13.7441,
        lng: 100.5222,
        activity: 'ลิ้มลองหมูกรอบในตำนาน จิ้มซีอิ๊วหวานสูตรพิเศษ',
        estCost: 150,
        durationMin: 50,
        distanceFromPrevKm: 0.4,
        coupon: { id: 'c-bt02', title: 'สิทธิพิเศษ Fast-lane จองคิวพาส' },
        mission: { id: 'm-bt02', title: 'ถ่ายรูปความกรอบของหมูกรอบจานทอง', points: 8 },
      },
      {
        order: 3,
        time: '18:15',
        shopId: 'bt03',
        shopName: 'หนึ่ง นม นัว (Nueng Nom Nua)',
        category: 'dessert',
        lat: 13.7418,
        lng: 100.5241,
        activity: 'นมสดตุ๋นแท้ คู่โทสต์เนยสดชุ่มฉ่ำสังขยาใบเตย',
        estCost: 85,
        durationMin: 40,
        distanceFromPrevKm: 0.3,
        coupon: { id: 'c-bt03', title: 'รับดิปปิ้งสังขยาเพิ่ม 1 ถ้วยฟรี' },
        mission: { id: 'm-bt03', title: 'ถ่ายรูปคลิปจิ้มโทสต์ลงในดิปปิ้ง', points: 5 },
      },
      {
        order: 4,
        time: '19:15',
        shopId: 'bt04',
        shopName: 'ถ้วยถังไอติม บรรทัดทอง',
        category: 'dessert',
        lat: 13.7432,
        lng: 100.5255,
        activity: 'ไอศกรีมน้ำเต้าหู้ และหมั่นโถวทอดกรอบนอกนุ่มใน',
        estCost: 90,
        durationMin: 40,
        distanceFromPrevKm: 0.3,
        coupon: { id: 'c-bt04', title: 'ลด 10% ทุกเมนูหมั่นโถวทอด' },
        mission: { id: 'm-bt04', title: 'ถ่ายรูปเซ็ตถ้วยถังพร้อมป้ายร้าน', points: 5 },
      },
    ],
  },
  phranakorn: {
    title: 'วันเสน่ห์ย้อนยุค ย่านพระนคร',
    items: [
      {
        order: 1,
        time: '10:00',
        shopId: 'pn01',
        shopName: 'ออน ล็อก หยุ่น เก่าแก่ 90 ปี',
        category: 'cafe',
        lat: 13.7485,
        lng: 100.5015,
        activity: 'ชุดอาหารเช้า ขนมปังปิ้งเนยน้ำตาล และชาเย็นโบราณ',
        estCost: 90,
        durationMin: 45,
        distanceFromPrevKm: 0,
        coupon: { id: 'c-pn01', title: 'แถมชาร้อนกาโบราณฟรี 1 กา' },
        mission: { id: 'm-pn01', title: 'ถ่ายรูปบรรยากาศร้านสไตล์สภากาแฟ', points: 5 },
      },
      {
        order: 2,
        time: '11:00',
        shopId: 'pn02',
        shopName: 'จุดชมวิวเสาชิงช้า & ลานคนเมือง',
        category: 'photo',
        lat: 13.7518,
        lng: 100.5012,
        activity: 'เช็กอินถ่ายภาพแลนด์มาร์กสีแดงสง่างามคู่พระนคร',
        estCost: 0,
        durationMin: 35,
        distanceFromPrevKm: 0.4,
        coupon: null,
        mission: { id: 'm-pn02', title: 'ถ่ายรูปมุมเสาชิงช้าแบบชิคๆ', points: 8 },
      },
      {
        order: 3,
        time: '12:00',
        shopId: 'pn03',
        shopName: 'ทิพย์สมัย ผัดไทยประตูผี',
        category: 'food',
        lat: 13.7525,
        lng: 100.5048,
        activity: 'ผัดไทยเส้นจันท์มันกุ้งห่อไข่ และน้ำส้มคั้นแท้เกล็ดส้ม',
        estCost: 160,
        durationMin: 50,
        distanceFromPrevKm: 0.5,
        coupon: { id: 'c-pn03', title: 'ฟรีเครื่องเคียงเกี๊ยวกรอบทอด' },
        mission: { id: 'm-pn03', title: 'ถ่ายรูปผัดไทยห่อไข่สีทอง', points: 6 },
      },
      {
        order: 4,
        time: '13:30',
        shopId: 'pn04',
        shopName: 'มนต์ นมสด เสาชิงช้า',
        category: 'dessert',
        lat: 13.7533,
        lng: 100.5009,
        activity: 'ขนมปังนึ่งสังขยาไข่ และนมสดแท้ 100% หอมมัน',
        estCost: 80,
        durationMin: 45,
        distanceFromPrevKm: 0.4,
        coupon: { id: 'c-pn04', title: 'รับฟรีขนมปังอบกรอบ 1 ซอง' },
        mission: { id: 'm-pn04', title: 'ถ่ายรูปจานสังขยาเยิ้มๆ', points: 5 },
      },
    ],
  },
};

const MOCK_PLAN = {
  ...DISTRICT_PLANS.taladnoi,
  style: 'chill',
  totalCostPerPerson: 299,
};

const MOCK_ORDER = {
  orderId: 'o_demo001',
  amount: 598,
  discount: 0,
  status: 'pending',
  promptpayPayload: '00020101021229370016A000000677010111011300669999999990217DEMO000000000015303764540475605802TH5910DayPass6304ABCD',
  qrDataUrl:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
};

const MOCK_PASS = {
  id: 'p_demo001',
  code: 'DP-4F7K2',
  status: 'active',
  validDate: new Date().toISOString().split('T')[0],
  people: 2,
  plan: MOCK_PLAN,
  coupons: [
    { id: 'c-tn01', shopId: 'tn01', title: 'แถมน้ำแร่ออร์แกนิก 1 ขวด', used: false },
    { id: 'c-tn03', shopId: 'tn03', title: 'ลดทันที 20 บาท เมื่อสั่งชุดหอยนางรม', used: false },
    { id: 'c-tn04', shopId: 'tn04', title: 'แถมท็อปปิ้งเฉาก๊วยหนึบ 1 ที่', used: false },
  ],
  checkins: [],
  unlockedMissionIds: [],
  completedMissionIds: [],
};

const MOCK_POINTS = { totalPoints: 10, pointValueBaht: 2 };

// ─────────────────────────────────────────────────────────────
//  API FUNCTIONS
// ─────────────────────────────────────────────────────────────

/** 1. GET /api/shops */
export async function getShops({ lat, lng, radiusKm } = {}) {
  if (USE_MOCK) {
    return { shops: [] };
  }
  const params = new URLSearchParams();
  if (lat != null) params.set('lat', lat);
  if (lng != null) params.set('lng', lng);
  if (radiusKm != null) params.set('radiusKm', radiusKm);
  return apiFetch(`/shops?${params}`);
}

/** 2. POST /api/plans/generate */
export async function generatePlan(body) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 900));
    const districtKey = body.districtId && DISTRICT_PLANS[body.districtId] ? body.districtId : 'taladnoi';
    const basePlan = DISTRICT_PLANS[districtKey];
    const generated = {
      ...basePlan,
      districtId: districtKey,
      style: body.style || 'chill',
      totalCostPerPerson: body.budget || 299,
    };
    return { plan: generated };
  }
  return apiFetch('/plans/generate', { method: 'POST', body: JSON.stringify(body) });
}

/** 3. POST /api/orders */
export async function createOrder(body) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 800));
    const subtotal = Math.round(body.plan.totalCostPerPerson * body.people);
    return {
      ...MOCK_ORDER,
      subtotal,
      amount: subtotal,
      discount: 0,
      pointsUsed: 0,
      deviceId: body.deviceId,
      plan: body.plan,
      people: body.people,
    };
  }
  return apiFetch('/orders', { method: 'POST', body: JSON.stringify(body) });
}

/** POST /api/orders/:orderId/points */
export async function updateOrderPoints(orderId, deviceId, usePoints) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 250));
    const stored = JSON.parse(sessionStorage.getItem('daypass_order') || 'null');
    if (!stored || stored.orderId !== orderId) throw new Error('ไม่พบคำสั่งซื้อ กรุณาสร้างแผนใหม่');
    const balance = await getPoints(deviceId);
    const subtotal = Number(stored.subtotal ?? (stored.amount + (stored.discount || 0)));
    const pointsUsed = Math.min(
      usePoints,
      balance.totalPoints,
      Math.floor(Math.floor(subtotal * 0.3) / balance.pointValueBaht),
    );
    const discount = pointsUsed * balance.pointValueBaht;
    const updated = {
      ...stored,
      amount: subtotal - discount,
      subtotal,
      discount,
      pointsUsed,
      // Mark this as a demonstration QR payload; it cannot collect real payment.
      promptpayPayload: `DAYPASS-DEMO:${orderId}:${subtotal - discount}`,
    };
    sessionStorage.setItem('daypass_order', JSON.stringify(updated));
    return updated;
  }
  return apiFetch(`/orders/${encodeURIComponent(orderId)}/points`, {
    method: 'POST',
    body: JSON.stringify({ deviceId, usePoints }),
  });
}

/** 4. POST /api/orders/:orderId/confirm */
export async function confirmOrder(orderId, slipImageName) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 600));
    const order = JSON.parse(sessionStorage.getItem('daypass_order') || 'null');
    if (!order || order.orderId !== orderId) throw new Error('ไม่พบคำสั่งซื้อ กรุณาสร้างแผนใหม่');
    const pass = {
      ...JSON.parse(JSON.stringify(MOCK_PASS)),
      plan: order.plan || MOCK_PASS.plan,
      people: order.people || MOCK_PASS.people,
      coupons: (order.plan?.items || MOCK_PASS.plan.items)
        .filter((item) => item.coupon)
        .map((item) => ({ id: item.coupon.id, shopId: item.shopId, title: item.coupon.title, used: false })),
      checkins: [],
      unlockedMissionIds: [],
      completedMissionIds: [],
    };
    localStorage.setItem(`daypass_pass_${pass.id}`, JSON.stringify(pass));
    return { passId: 'p_demo001', status: 'paid' };
  }
  return apiFetch(`/orders/${orderId}/confirm`, {
    method: 'POST',
    body: JSON.stringify({ slipImageName }),
  });
}

/** 5. GET /api/passes/:passId */
export async function getPass(passId) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    // ดึงข้อมูลพาสจาก localStorage ก็ได้ (ถ้ามีการ update ในเซสชัน)
    const saved = localStorage.getItem(`daypass_pass_${passId}`);
    return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(MOCK_PASS));
  }
  return apiFetch(`/passes/${passId}`);
}

/** 6. POST /api/coupons/:couponId/redeem */
export async function redeemCoupon(couponId, passId) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    const storageKey = `daypass_pass_${passId}`;
    const pass = JSON.parse(localStorage.getItem(storageKey) || 'null') || JSON.parse(JSON.stringify(MOCK_PASS));
    const coupon = pass.coupons.find((item) => item.id === couponId);
    if (!coupon) throw new Error('ไม่พบคูปองในพาสนี้');
    if (coupon.used) throw new Error('คูปองนี้ถูกใช้ไปแล้ว');
    const redeemedAt = new Date().toISOString();
    coupon.used = true;
    coupon.redeemedAt = redeemedAt;
    localStorage.setItem(storageKey, JSON.stringify(pass));
    return { ok: true, redeemedAt };
  }
  return apiFetch(`/coupons/${couponId}/redeem`, {
    method: 'POST',
    body: JSON.stringify({ passId }),
  });
}

/** 7. POST /api/checkin */
export async function checkin(body) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 600));
    return { ok: true, distanceM: 42, unlockedMissionIds: [body.shopId ? `m-${body.shopId}` : 'm-s01'] };
  }
  return apiFetch('/checkin', { method: 'POST', body: JSON.stringify(body) });
}

/** 8. POST /api/missions/:missionId/submit */
export async function submitMission(missionId, formData) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 800));
    const passId = formData.get('passId');
    const deviceId = formData.get('deviceId');
    const storageKey = `daypass_pass_${passId}`;
    const pass = JSON.parse(localStorage.getItem(storageKey) || 'null') || JSON.parse(JSON.stringify(MOCK_PASS));
    const completed = new Set(pass.completedMissionIds || []);
    if (completed.has(missionId)) throw new Error('ภารกิจนี้ส่งภาพรับแต้มไปแล้วในพาสนี้');

    const award = pass.plan.items.find((item) => item.mission?.id === missionId)?.mission?.points || 5;
    completed.add(missionId);
    pass.completedMissionIds = [...completed];
    pass.unlockedMissionIds = (pass.unlockedMissionIds || []).filter((id) => id !== missionId);
    localStorage.setItem(storageKey, JSON.stringify(pass));

    const points = await getPoints(deviceId);
    const totalPoints = points.totalPoints + award;
    localStorage.setItem(`daypass_points_${deviceId}`, String(totalPoints));
    return { ok: true, pointsAwarded: award, totalPoints };
  }
  const res = await fetch(`${BASE_URL}/missions/${missionId}/submit`, {
    method: 'POST',
    body: formData, // multipart
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

/** 9. GET /api/points */
export async function getPoints(deviceId) {
  if (USE_MOCK) {
    const saved = localStorage.getItem(`daypass_points_${deviceId}`);
    return { ...MOCK_POINTS, totalPoints: saved === null ? MOCK_POINTS.totalPoints : Math.max(0, Number(saved) || 0) };
  }
  return apiFetch(`/points?deviceId=${encodeURIComponent(deviceId)}`);
}
