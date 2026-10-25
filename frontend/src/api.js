// ============================================================
//  api.js  — ชั้นเรียก API ทั้งหมด
//  ใช้ mock เฉพาะตอนพัฒนาในเครื่อง; production เรียก backend จริงเป็นค่าเริ่มต้น
// ============================================================

import { DISTRICT_DESTINATIONS, findDestinationById, PROVINCES } from './data/locations';
import { getBangkokDate } from './utils/date';

export const USE_MOCK = String(import.meta.env.VITE_USE_MOCK ?? (import.meta.env.DEV ? 'true' : 'false')).toLowerCase() !== 'false';
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

// ── deviceId (แทน login) ────────────────────────────────────
export function getDeviceId() {
  try {
    const account = JSON.parse(localStorage.getItem('daypass_user_auth') || 'null');
    if (typeof account?.accountId === 'string' && account.accountId) {
      localStorage.setItem('daypass_device_id', account.accountId);
      return account.accountId;
    }
  } catch {}
  let id = localStorage.getItem('daypass_device_id');
  if (!id) {
    id = 'dev_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('daypass_device_id', id);
  }
  return id;
}

export function resetDeviceId() {
  const id = `dev_${typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 14)}`;
  localStorage.setItem('daypass_device_id', id);
  return id;
}

export function logoutAccount() {
  localStorage.removeItem('daypass_user_auth');
  localStorage.removeItem('daypass_user_profile');
  localStorage.removeItem('daypass_profile');
  localStorage.removeItem('daypass_recent_pass_id');
  sessionStorage.removeItem('daypass_passId');
  resetDeviceId();
  window.dispatchEvent(new Event('daypass_auth_changed'));
}

// ── helper fetch ────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const { headers, ...requestOptions } = options;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...requestOptions,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || `HTTP ${res.status}`);
    error.status = res.status;
    throw error;
  }
  return data;
}

export async function getApiHealth() {
  if (USE_MOCK) return { ok: true, demoMode: true };
  return apiFetch('/health');
}

export async function registerAccount(account, previousDeviceId) {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ ...account, previousDeviceId }),
  });
}

export async function loginAccount(phoneOrEmail, password, previousDeviceId) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phoneOrEmail, password, previousDeviceId }),
  });
}

export async function updateAccountProfile(accountId, profile) {
  return apiFetch('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify({ accountId, profile }),
  });
}

export async function socialLoginAccount(socialData, previousDeviceId) {
  return apiFetch('/auth/social', {
    method: 'POST',
    body: JSON.stringify({ ...socialData, previousDeviceId }),
  });
}

export async function googleLoginAccount(googleAuthPayload, previousDeviceId) {
  return apiFetch('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ ...googleAuthPayload, previousDeviceId }),
  });
}

const MERCHANT_SESSION_KEY = 'daypass_merchant_session';

async function merchantFetch(path, options = {}) {
  const token = localStorage.getItem(MERCHANT_SESSION_KEY);
  try {
    return await apiFetch(`/merchant${path}`, {
      ...options,
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    });
  } catch (error) {
    if (error.status === 401) localStorage.removeItem(MERCHANT_SESSION_KEY);
    throw error;
  }
}

export function hasMerchantSession() {
  return Boolean(localStorage.getItem(MERCHANT_SESSION_KEY));
}

function saveMerchantSession(result) {
  localStorage.setItem(MERCHANT_SESSION_KEY, result.token);
  return result;
}

export async function getEligibleMerchantShops() {
  return apiFetch('/merchant/eligible-shops');
}

export async function registerMerchant(merchant) {
  return saveMerchantSession(await apiFetch('/merchant/register', {
    method: 'POST',
    body: JSON.stringify(merchant),
  }));
}

export async function loginMerchant(shopName, password) {
  return saveMerchantSession(await apiFetch('/merchant/login', {
    method: 'POST',
    body: JSON.stringify({ shopName, password }),
  }));
}

export async function getMerchantSession() {
  return merchantFetch('/me');
}

export async function lookupMerchantPass(passCode) {
  return merchantFetch('/passes/lookup', {
    method: 'POST',
    body: JSON.stringify({ passCode }),
  });
}

export async function redeemMerchantCoupon(couponId) {
  return merchantFetch(`/coupons/${encodeURIComponent(couponId)}/redeem`, { method: 'POST' });
}

export async function logoutMerchant() {
  try {
    await merchantFetch('/logout', { method: 'POST' });
  } finally {
    localStorage.removeItem(MERCHANT_SESSION_KEY);
  }
}

// ─────────────────────────────────────────────────────────────
//  MOCK DATA & DISTRICT PLANS
// ─────────────────────────────────────────────────────────────
export const DISTRICTS = DISTRICT_DESTINATIONS;



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
  isDemo: true,
  amount: 598,
  discount: 0,
  status: 'pending',
  promptpayPayload: '00020101021229370016A000000677010111011300669999999990217DEMO000000000015303764540475605802TH5910DayPass6304ABCD',
  qrDataUrl:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
};

const MOCK_PASS = {
  id: 'p_demo001',
  isDemo: true,
  code: 'DP-4F7K2',
  status: 'active',
  validDate: getBangkokDate(),
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
    await new Promise((r) => setTimeout(r, 600));
    const targetDest = findDestinationById(body.districtId);
    const districtKey = body.districtId && DISTRICT_PLANS[body.districtId] ? body.districtId : 'taladnoi';
    let basePlan = DISTRICT_PLANS[districtKey];

    const isSyntheticDestination = !DISTRICT_PLANS[body.districtId];
    // Destinations without curated plans use clearly labeled prototype stops.
    if (isSyntheticDestination) {
      basePlan = {
        title: `ทริปท่องเที่ยว ${targetDest.name}`,
        items: [
          {
            order: 1,
            time: '10:00',
            shopId: `${targetDest.id}_01`,
            shopName: `จุดนัดพบ & คาเฟ่ ${targetDest.name}`,
            category: 'cafe',
            lat: targetDest.lat,
            lng: targetDest.lng,
            activity: 'จิบกาแฟเครื่องดื่ม Signature สัมผัสบรรยากาศท้องถิ่น',
            estCost: Math.round((body.budget || 299) * 0.3),
            durationMin: 50,
            distanceFromPrevKm: 0,
            coupon: { id: `c-${targetDest.id}-01`, title: 'แถมเครื่องดื่ม/ของว่าง 1 ที่' },
            mission: { id: `m-${targetDest.id}-01`, title: 'ถ่ายรูปเช็กอินจุดแรก', points: 6 },
          },
          {
            order: 2,
            time: '11:30',
            shopId: `${targetDest.id}_02`,
            shopName: `ร้านอาหารขึ้นชื่อ ${targetDest.name}`,
            category: 'food',
            lat: targetDest.lat + 0.003,
            lng: targetDest.lng + 0.002,
            activity: 'ชิมอาหารจานเด็ดระดับตำนานประจำย่าน รสชาติต้นตำรับ',
            estCost: Math.round((body.budget || 299) * 0.4),
            durationMin: 60,
            distanceFromPrevKm: 0.4,
            coupon: { id: `c-${targetDest.id}-02`, title: 'รับส่วนลดพิเศษ 15% ทันที' },
            mission: { id: `m-${targetDest.id}-02`, title: 'ถ่ายรูปจานอาหารเมนูแนะนำ', points: 8 },
          },
          {
            order: 3,
            time: '13:00',
            shopId: `${targetDest.id}_03`,
            shopName: `จุดชมวิวและศิลปะ ${targetDest.name}`,
            category: 'photo',
            lat: targetDest.lat - 0.002,
            lng: targetDest.lng + 0.003,
            activity: 'เดินถ่ายภาพสตรีทอาร์ต วิวสวยประจำเมือง เก็บภาพความประทับใจ',
            estCost: 0,
            durationMin: 45,
            distanceFromPrevKm: 0.5,
            coupon: null,
            mission: { id: `m-${targetDest.id}-03`, title: 'ถ่ายรูปโพสท่าชิคๆ ริมจุดชมวิว', points: 7 },
          },
          {
            order: 4,
            time: '14:30',
            shopId: `${targetDest.id}_04`,
            shopName: `ร้านของหวาน & ของฝาก ${targetDest.name}`,
            category: 'dessert',
            lat: targetDest.lat + 0.001,
            lng: targetDest.lng - 0.002,
            activity: 'ของหวานปิดท้ายทริป เลือกซื้อของฝากท้องถิ่น',
            estCost: Math.round((body.budget || 299) * 0.25),
            durationMin: 45,
            distanceFromPrevKm: 0.3,
            coupon: { id: `c-${targetDest.id}-04`, title: 'รับของหวานไซส์มินิฟรี 1 ที่' },
            mission: { id: `m-${targetDest.id}-04`, title: 'เช็กอินพร้อมของฝาก', points: 5 },
          },
        ],
      };
    }

    // Dynamic schedule timing based on body.startTime
    const startHour = body.startTime ? parseInt(body.startTime.split(':')[0], 10) : 10;
    const startMin = body.startTime ? parseInt(body.startTime.split(':')[1], 10) : 0;
    let currentMinutes = startHour * 60 + startMin;

    const adjustedItems = basePlan.items.map((item) => {
      const h = Math.floor(currentMinutes / 60) % 24;
      const m = currentMinutes % 60;
      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      currentMinutes += item.durationMin + 15;
      return {
        ...item,
        time: timeStr,
        ...(isSyntheticDestination ? { isDemo: true } : {}),
        coupon: item.coupon ? { ...item.coupon, isDemo: true } : null,
      };
    });
    let planItems = adjustedItems;
    const targetStops = body.passPackageId === 'explorer' ? 6 : body.passPackageId === 'single' ? 4 : null;
    if (targetStops) {
      let extraCurrentMinutes = currentMinutes;
      const extraItems = Array.from({ length: Math.max(0, targetStops - adjustedItems.length) }, (_, index) => {
        const previous = adjustedItems.at(-1);
        const order = adjustedItems.length + index + 1;
        const hour = Math.floor(extraCurrentMinutes / 60) % 24;
        const minute = extraCurrentMinutes % 60;
        const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        extraCurrentMinutes += 45;
        return {
          order,
          time,
          shopId: `${targetDest.id}_demo_${order}`,
          shopName: `จุดแวะตัวอย่าง ${order} · ${targetDest.name}`,
          category: index === 0 ? 'photo' : 'activity',
          lat: previous.lat + 0.001 * (index + 1),
          lng: previous.lng + 0.001 * (index + 1),
          activity: 'จุดแวะตัวอย่างสำหรับแผนพาส 6 จุด',
          estCost: 0,
          durationMin: 30,
          distanceFromPrevKm: 0.2,
          coupon: null,
          isDemo: true,
          mission: index === 0 ? {
            id: `m-${targetDest.id}_demo_${order}`,
            title: `ภารกิจถ่ายรูปจุดแวะ ${order}`,
            points: 5,
          } : null,
        };
      });
      currentMinutes = extraCurrentMinutes;
      planItems = [...adjustedItems, ...extraItems].slice(0, targetStops).map((item, index) => ({
        ...item,
        order: index + 1,
      }));
      if (body.passPackageId === 'explorer') {
        let couponCount = 0;
        planItems = planItems.map((item) => {
          if (item.coupon && couponCount < 2) {
            couponCount += 1;
            return item;
          }
          if (item.coupon) return { ...item, coupon: null };
          if (couponCount >= 2) return item;
          couponCount += 1;
          return {
            ...item,
            isDemo: true,
            coupon: {
              id: `c-${item.shopId}-sample`,
              title: 'คูปองตัวอย่าง (ไม่มีสิทธิ์ร้านค้าจริง)',
              isDemo: true,
            },
          };
        });
        if (!planItems.some((item) => item.mission)) {
          planItems[0] = {
            ...planItems[0],
            isDemo: true,
            mission: { id: `m-${planItems[0].shopId}-sample`, title: 'ภารกิจตัวอย่าง', points: 5 },
          };
        }
      }
    }

    const endH = Math.floor(currentMinutes / 60) % 24;
    const endM = currentMinutes % 60;
    const computedEndTime = body.endTime || `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    const startTotalMin = startHour * 60 + startMin;
    const endParts = computedEndTime.split(':').map(Number);
    let totalTripMin = (endParts[0] * 60 + (endParts[1] || 0)) - startTotalMin;
    if (totalTripMin <= 0) totalTripMin += 1440;
    const tripHours = Math.floor(totalTripMin / 60);
    const tripRemainderMin = totalTripMin % 60;

    const generated = {
      ...basePlan,
      title: targetStops ? `${basePlan.title} · แผนพาส ${targetStops} จุด` : basePlan.title,
      districtId: body.districtId || districtKey,
      districtName: targetDest?.name || basePlan.title,
      provinceId: body.provinceId || targetDest?.provinceId,
      provinceName: body.provinceName || PROVINCES.find((province) => province.id === targetDest?.provinceId)?.name,
      style: body.style || 'chill',
      totalCostPerPerson: body.budget || 299,
      startTime: body.startTime || '10:00',
      endTime: computedEndTime,
      tripDurationText: `${tripHours} ชม. ${tripRemainderMin > 0 ? `${tripRemainderMin} นาที` : ''}`,
      tripTotalHours: tripHours,
      demoGenerated: isSyntheticDestination || planItems.some((item) => item.isDemo || item.coupon?.isDemo),
      items: planItems,
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

    const passId = `p_${Date.now().toString(36)}`;
    const passCode = `DP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const targetPlan = order.plan || MOCK_PASS.plan;
    const now = new Date();
    const thaiDateStr = now.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const pass = {
      ...JSON.parse(JSON.stringify(MOCK_PASS)),
      id: passId,
      code: passCode,
      status: 'active',
      validDate: getBangkokDate(now),
      purchaseDateText: thaiDateStr,
      purchase: {
        orderId: order.orderId,
        amount: order.amount || 299,
        discount: order.discount || 0,
        pointsUsed: order.pointsUsed || 0,
        purchasedAt: now.toISOString(),
      },
      plan: targetPlan,
      people: order.people || MOCK_PASS.people,
      totalAmount: order.amount || 299,
      discount: order.discount || 0,
      pointsUsed: order.pointsUsed || 0,
      selectedPackage: targetPlan.selectedPackage || {
        id: 'single',
        title: 'Standard 1-Day Pass',
        badge: 'พาส 1 วัน ย่านเดียว',
      },
      coupons: (targetPlan.items || MOCK_PASS.plan.items)
        .filter((item) => item.coupon)
        .map((item) => ({
          id: item.coupon.id,
          shopId: item.shopId,
          title: item.coupon.title,
          used: false,
          isDemo: Boolean(item.coupon.isDemo),
        }))
        .flatMap((coupon) => targetPlan.selectedPackage?.id === 'explorer'
          ? Array.from({ length: order.people || 1 }, (_, index) => ({
            ...coupon,
            id: `${coupon.id}_p${index + 1}`,
            title: `${coupon.title} (ท่านที่ ${index + 1}/${order.people || 1})`,
          }))
          : [coupon]),
      checkins: [],
      unlockedMissionIds: [],
      completedMissionIds: [],
    };

    localStorage.setItem(`daypass_pass_${pass.id}`, JSON.stringify(pass));
    localStorage.setItem('daypass_pass_p_demo001', JSON.stringify(pass));
    localStorage.setItem('daypass_recent_pass_id', pass.id);

    // Save to retroactive purchase history
    const historyEntry = {
      id: pass.id,
      passId: pass.id,
      orderId: order.orderId,
      code: pass.code,
      status: 'active',
      purchaseDate: thaiDateStr,
      validDate: pass.validDate,
      districtId: targetPlan.districtId || 'taladnoi',
      districtName: targetPlan.districtName || 'ตลาดน้อย-เจริญกรุง',
      provinceName: targetPlan.provinceName || 'กรุงเทพมหานคร',
      packageName: pass.selectedPackage?.title || 'Standard 1-Day Pass',
      packageBadge: pass.selectedPackage?.badge || 'พาส 1 วัน ย่านเดียว',
      people: pass.people,
      totalAmount: pass.totalAmount,
      discount: pass.discount,
      pointsUsed: pass.pointsUsed,
      pointsEarned: Math.max(10, Math.round(pass.totalAmount * 0.05)),
      placesCount: targetPlan.items?.length || 4,
      couponsCount: pass.coupons.length,
      couponsUsed: 0,
      transitAdvice: pass.selectedPackage?.transitAdvice || 'เดินทางด้วยการเดินเท้าหรือระบบขนส่งสาธารณะ',
      plan: targetPlan,
      mascotFeedback: 'เย่! พาสใหม่เปิดใช้งานแล้ว ออกไปเที่ยวให้สนุกเลยนะค้าบ~',
    };

    savePassToHistory(historyEntry);

    // Award cashback points
    if (order.deviceId) {
      await addPoints(order.deviceId, historyEntry.pointsEarned, 'cashback', `แต้มสะสมจากการซื้อ ${historyEntry.packageName}`);
    }

    return { passId: pass.id, status: 'paid' };
  }
  return apiFetch(`/orders/${orderId}/confirm`, {
    method: 'POST',
    body: JSON.stringify({ slipImageName }),
  });
}

export const SEED_PASS_HISTORY = [
  {
    id: 'p_hist_01',
    passId: 'p_hist_01',
    orderId: 'o_hist_001',
    code: 'DP-BKK92',
    status: 'completed',
    purchaseDate: '21 ต.ค. 2026, 10:15 น.',
    validDate: '2026-10-21',
    districtId: 'taladnoi',
    districtName: 'ตลาดน้อย-เจริญกรุง',
    provinceName: 'กรุงเทพมหานคร',
    packageName: 'Standard 1-Day Pass',
    packageBadge: 'พาส 1 วัน ย่านเดียว',
    people: 2,
    totalAmount: 598,
    discount: 0,
    pointsUsed: 0,
    pointsEarned: 30,
    placesCount: 4,
    couponsCount: 3,
    couponsUsed: 3,
    transitAdvice: 'เดินทางด้วยการเดินเท้าในตรอกซอกซอยตลาดน้อย สัมผัสวิถีชุมชนโบราณ',
    mascotFeedback: 'ทริปนี้พี่เช็กอินครบ 4 จุด และใช้คูปองครบ 3 ใบ สุดยอดมากเลย!',
  },
  {
    id: 'p_hist_02',
    passId: 'p_hist_02',
    orderId: 'o_hist_002',
    code: 'DP-ARI77',
    status: 'completed',
    purchaseDate: '15 ต.ค. 2026, 14:00 น.',
    validDate: '2026-10-15',
    districtId: 'ari',
    districtName: 'อารีย์-ประดิพัทธ์',
    provinceName: 'กรุงเทพมหานคร',
    packageName: 'Twin-District Explorer Pass',
    packageBadge: 'คอมโบ 2 ย่านเชื่อมต่อ 🔥',
    people: 1,
    totalAmount: 398,
    discount: 20,
    pointsUsed: 10,
    pointsEarned: 20,
    placesCount: 4,
    couponsCount: 4,
    couponsUsed: 3,
    transitAdvice: 'เชื่อมต่อระหว่างซอยอารีย์กับประดิพัทธ์ด้วยรถตุ๊กตุ๊กไฟฟ้า MuvMi สะดวกสบาย',
    mascotFeedback: 'คาเฟ่อารีย์กาแฟหอมฟิน น้องพาสชอบมุมถ่ายรูปตู้สติกเกอร์ที่ Gump’s Ari มากๆ~',
  },
];

export function getPassHistory() {
  try {
    const raw = localStorage.getItem('daypass_pass_history');
    if (!raw) {
      localStorage.setItem('daypass_pass_history', JSON.stringify(SEED_PASS_HISTORY));
      return SEED_PASS_HISTORY;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_PASS_HISTORY;
  } catch {
    return SEED_PASS_HISTORY;
  }
}

export function savePassToHistory(passEntry) {
  const current = getPassHistory();
  const updated = [passEntry, ...current.filter((item) => item.id !== passEntry.id)];
  localStorage.setItem('daypass_pass_history', JSON.stringify(updated));
  return updated;
}

/** GET /api/passes?deviceId= */
export async function fetchPassHistory(deviceId) {
  if (USE_MOCK) return getPassHistory();
  const result = await apiFetch(`/passes?deviceId=${encodeURIComponent(deviceId)}`);
  return Array.isArray(result.history) ? result.history : [];
}

/** 5. GET /api/passes/:passId */
export async function getPass(passId) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    const saved = localStorage.getItem(`daypass_pass_${passId}`);
    if (saved) return JSON.parse(saved);

    const history = getPassHistory();
    const histMatch = history.find((h) => h.passId === passId || h.id === passId);
    if (histMatch) {
      const defaultDistrictPlan = DISTRICT_PLANS[histMatch.districtId] || DISTRICT_PLANS.taladnoi;
      const reconstructed = {
        ...JSON.parse(JSON.stringify(MOCK_PASS)),
        id: histMatch.passId,
        code: histMatch.code,
        status: histMatch.status,
        validDate: histMatch.validDate,
        people: histMatch.people || 1,
        plan: histMatch.plan || {
          ...defaultDistrictPlan,
          districtId: histMatch.districtId || 'taladnoi',
          districtName: histMatch.districtName || defaultDistrictPlan.title,
          totalCostPerPerson: Math.round(histMatch.totalAmount / (histMatch.people || 1)),
        },
        coupons: (histMatch.plan?.items || defaultDistrictPlan.items)
          .filter((i) => i.coupon)
          .map((i) => ({ id: i.coupon.id, shopId: i.shopId, title: i.coupon.title, used: histMatch.status === 'completed' })),
        checkins: histMatch.status === 'completed' ? ['1', '2', '3', '4'] : [],
        unlockedMissionIds: histMatch.status === 'completed' ? ['m-hist1'] : [],
        completedMissionIds: histMatch.status === 'completed' ? ['m-hist1'] : [],
      };
      localStorage.setItem(`daypass_pass_${passId}`, JSON.stringify(reconstructed));
      return reconstructed;
    }

    return JSON.parse(JSON.stringify(MOCK_PASS));
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
    if (coupon.isDemo) throw new Error('คูปองตัวอย่างนี้ใช้สิทธิ์กับร้านค้าจริงไม่ได้');
    if (coupon.used) throw new Error('คูปองนี้ถูกใช้ไปแล้ว');
    const redeemedAt = new Date().toISOString();
    coupon.used = true;
    coupon.redeemedAt = redeemedAt;
    localStorage.setItem(storageKey, JSON.stringify(pass));
    return { ok: true, redeemedAt };
  }
  return apiFetch(`/coupons/${couponId}/redeem`, {
    method: 'POST',
    body: JSON.stringify({ passId, deviceId: getDeviceId() }),
  });
}

/** 7. POST /api/checkin */
export async function checkin(body) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 600));
    const passKey = `daypass_pass_${body.passId}`;
    const savedPass = localStorage.getItem(passKey);
    const pass = savedPass
      ? JSON.parse(savedPass)
      : body.passId === MOCK_PASS.id ? JSON.parse(JSON.stringify(MOCK_PASS)) : null;
    if (!pass) throw new Error('ไม่พบพาสนี้ในอุปกรณ์');
    if (!pass.plan?.items?.some((item) => item.shopId === body.shopId)) {
      throw new Error('ร้านนี้ไม่ได้อยู่ในแผนของพาส');
    }
    if (pass.checkins?.some((entry) => entry.shopId === body.shopId)) {
      throw new Error('เช็กอินร้านนี้แล้ว');
    }

    // Award +3 points for checkin
    const deviceId = body.deviceId || getDeviceId();
    const balanceKey = `daypass_points_${deviceId}`;
    const historyKey = `daypass_points_transactions_${deviceId}`;
    const saved = Number(localStorage.getItem(balanceKey) || '0');
    const newTotal = saved + 3;
    localStorage.setItem(balanceKey, String(newTotal));
    const history = (() => { try { return JSON.parse(localStorage.getItem(historyKey) || '[]'); } catch { return []; } })();
    history.unshift({ delta: 3, reason: `เช็กอิน`, at: new Date().toISOString() });
    localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 20)));
    const mission = pass.plan.items.find((item) => item.shopId === body.shopId)?.mission;
    return {
      ok: true,
      distanceM: 42,
      unlockedMissionIds: mission?.id ? [mission.id] : [],
      pointsAwarded: 3,
      totalPoints: newTotal,
    };
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
    const historyKey = `daypass_points_transactions_${deviceId}`;
    const history = Array.isArray(points.transactions) ? points.transactions.slice() : [];
    history.unshift({ delta: award, reason: `ทำมิชชั่น ${pass.plan.items.find((item) => item.mission?.id === missionId)?.mission?.title || missionId}`, at: new Date().toISOString() });
    localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 20)));
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
    const balanceKey = `daypass_points_${deviceId}`;
    const historyKey = `daypass_points_transactions_${deviceId}`;
    let transactions = [];
    try {
      transactions = JSON.parse(localStorage.getItem(historyKey) || '[]');
      if (!Array.isArray(transactions)) transactions = [];
    } catch {
      transactions = [];
    }
    let saved = localStorage.getItem(balanceKey);
    if (saved === null) {
      saved = String(MOCK_POINTS.totalPoints);
      localStorage.setItem(balanceKey, saved);
      if (transactions.length === 0 && MOCK_POINTS.totalPoints > 0) {
        transactions = [{ delta: MOCK_POINTS.totalPoints, reason: 'แต้มทดลองเริ่มต้น', at: new Date().toISOString() }];
        localStorage.setItem(historyKey, JSON.stringify(transactions));
      }
    }
    return { ...MOCK_POINTS, totalPoints: Math.max(0, Number(saved) || 0), transactions: transactions.slice(0, 20) };
  }
  return apiFetch(`/points?deviceId=${encodeURIComponent(deviceId)}`);
}

/** 10. POST /api/points/add */
export async function addPoints(deviceId, delta, type = 'bonus', reason = 'รับแต้มพิเศษ') {
  if (USE_MOCK) {
    const balanceKey = `daypass_points_${deviceId}`;
    const historyKey = `daypass_points_transactions_${deviceId}`;
    const current = await getPoints(deviceId);
    const newTotal = Math.max(0, current.totalPoints + delta);
    localStorage.setItem(balanceKey, String(newTotal));
    
    let history = Array.isArray(current.transactions) ? current.transactions.slice() : [];
    history.unshift({ delta, reason, at: new Date().toISOString() });
    localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 20)));

    return { ok: true, totalPoints: newTotal, delta };
  }
  return apiFetch('/points/add', {
    method: 'POST',
    body: JSON.stringify({ deviceId, delta, type, reason }),
  });
}
