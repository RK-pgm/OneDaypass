// ============================================================
// locations.js — ฐานข้อมูล 77 จังหวัดทั่วไทย & พิกัด GPS อัจฉริยะ
// ============================================================

import destinationPhotos from './destinationPhotos.json' with { type: 'json' };
import thaiAdministrativeAreas from './thaiAdministrativeAreas.json' with { type: 'json' };

export const REGIONS = [
  { id: 'central', name: 'ภาคกลาง & กรุงเทพฯ' },
  { id: 'north', name: 'ภาคเหนือ' },
  { id: 'northeast', name: 'ภาคตะวันออกเฉียงเหนือ (อีสาน)' },
  { id: 'south', name: 'ภาคใต้' },
  { id: 'east', name: 'ภาคตะวันออก' },
  { id: 'west', name: 'ภาคตะวันตก' },
];

export const PROVINCES = [
  // ── ภาคกลาง & กรุงเทพฯ (22) ───────────────────
  { id: 'bangkok', name: 'กรุงเทพมหานคร', nameEn: 'Bangkok', emoji: '🏙️', region: 'central', lat: 13.7563, lng: 100.5018 },
  { id: 'nonthaburi', name: 'นนทบุรี', nameEn: 'Nonthaburi', emoji: '🛶', region: 'central', lat: 13.8591, lng: 100.5217 },
  { id: 'pathumthani', name: 'ปทุมธานี', nameEn: 'Pathum Thani', emoji: '🪷', region: 'central', lat: 14.0208, lng: 100.5250 },
  { id: 'samutprakan', name: 'สมุทรปราการ', nameEn: 'Samut Prakan', emoji: '🐊', region: 'central', lat: 13.5991, lng: 100.5998 },
  { id: 'samutsakhon', name: 'สมุทรสาคร', nameEn: 'Samut Sakhon', emoji: '⚓', region: 'central', lat: 13.5475, lng: 100.2744 },
  { id: 'samutsongkhram', name: 'สมุทรสงคราม', nameEn: 'Samut Songkhram', emoji: '🐟', region: 'central', lat: 13.4098, lng: 99.9997 },
  { id: 'ayutthaya', name: 'พระนครศรีอยุธยา', nameEn: 'Phra Nakhon Si Ayutthaya', emoji: '🏛️', region: 'central', lat: 14.3532, lng: 100.5684 },
  { id: 'saraburi', name: 'สระบุรี', nameEn: 'Saraburi', emoji: '🌻', region: 'central', lat: 14.5289, lng: 100.9108 },
  { id: 'nakhonnayok', name: 'นครนายก', nameEn: 'Nakhon Nayok', emoji: '🏞️', region: 'central', lat: 14.2069, lng: 101.2131 },
  { id: 'lopburi', name: 'ลพบุรี', nameEn: 'Lopburi', emoji: '🐒', region: 'central', lat: 14.7995, lng: 100.6534 },
  { id: 'singburi', name: 'สิงห์บุรี', nameEn: 'Sing Buri', emoji: '🗡️', region: 'central', lat: 14.8911, lng: 100.4048 },
  { id: 'angthong', name: 'อ่างทอง', nameEn: 'Ang Thong', emoji: '🌾', region: 'central', lat: 14.5896, lng: 100.4550 },
  { id: 'chainat', name: 'ชัยนาท', nameEn: 'Chainat', emoji: '🦜', region: 'central', lat: 15.1852, lng: 100.1251 },
  { id: 'suphanburi', name: 'สุพรรณบุรี', nameEn: 'Suphan Buri', emoji: '🐘', region: 'central', lat: 14.4745, lng: 100.1177 },
  { id: 'nakhonpathom', name: 'นครปฐม', nameEn: 'Nakhon Pathom', emoji: '🍊', region: 'central', lat: 13.8196, lng: 100.0601 },
  { id: 'nakhonsawan', name: 'นครสวรรค์', nameEn: 'Nakhon Sawan', emoji: '🐲', region: 'central', lat: 15.7058, lng: 100.1384 },
  { id: 'uthai_thani', name: 'อุทัยธานี', nameEn: 'Uthai Thani', emoji: '🌳', region: 'central', lat: 15.3835, lng: 100.0247 },
  { id: 'phichit', name: 'พิจิตร', nameEn: 'Phichit', emoji: '🐊', region: 'central', lat: 16.4419, lng: 100.3488 },
  { id: 'phitsanulok', name: 'พิษณุโลก', nameEn: 'Phitsanulok', emoji: '🛕', region: 'central', lat: 16.8211, lng: 100.2659 },
  { id: 'kamphaengphet', name: 'กำแพงเพชร', nameEn: 'Kamphaeng Phet', emoji: '🍌', region: 'central', lat: 16.4828, lng: 99.5227 },
  { id: 'sukhothai', name: 'สุโขทัย', nameEn: 'Sukhothai', emoji: '🪔', region: 'central', lat: 17.0056, lng: 99.8264 },
  { id: 'phetchabun', name: 'เพชรบูรณ์', nameEn: 'Phetchabun', emoji: '⛰️', region: 'central', lat: 16.4190, lng: 101.1567 },

  // ── ภาคเหนือ (9) ──────────────────────────────
  { id: 'chiangmai', name: 'เชียงใหม่', nameEn: 'Chiang Mai', emoji: '🌿', region: 'north', lat: 18.7883, lng: 98.9853 },
  { id: 'lampang', name: 'ลำปาง', nameEn: 'Lampang', emoji: '🐴', region: 'north', lat: 18.2888, lng: 99.4928 },
  { id: 'lamphun', name: 'ลำพูน', nameEn: 'Lamphun', emoji: '🍇', region: 'north', lat: 18.5744, lng: 99.0087 },
  { id: 'chiangrai', name: 'เชียงราย', nameEn: 'Chiang Rai', emoji: '🍵', region: 'north', lat: 19.9072, lng: 99.8325 },
  { id: 'phayao', name: 'พะเยา', nameEn: 'Phayao', emoji: '🦢', region: 'north', lat: 19.1664, lng: 99.9022 },
  { id: 'nan', name: 'น่าน', nameEn: 'Nan', emoji: '🌄', region: 'north', lat: 18.7756, lng: 100.7730 },
  { id: 'phrae', name: 'แพร่', nameEn: 'Phrae', emoji: '🪵', region: 'north', lat: 18.1446, lng: 100.1411 },
  { id: 'mae_hong_son', name: 'แม่ฮ่องสอน', nameEn: 'Mae Hong Son', emoji: '🌫️', region: 'north', lat: 19.3021, lng: 97.9654 },
  { id: 'uttaradit', name: 'อุตรดิตถ์', nameEn: 'Uttaradit', emoji: '🍈', region: 'north', lat: 17.6201, lng: 100.0993 },

  // ── ภาคอีสาน (20) ─────────────────────────────
  { id: 'korat', name: 'นครราชสีมา', nameEn: 'Nakhon Ratchasima', emoji: '🌾', region: 'northeast', lat: 14.9799, lng: 102.0978 },
  { id: 'khonkaen', name: 'ขอนแก่น', nameEn: 'Khon Kaen', emoji: '🌻', region: 'northeast', lat: 16.4419, lng: 102.8359 },
  { id: 'udon_thani', name: 'อุดรธานี', nameEn: 'Udon Thani', emoji: '🪷', region: 'northeast', lat: 17.4138, lng: 102.7872 },
  { id: 'ubon_ratchathani', name: 'อุบลราชธานี', nameEn: 'Ubon Ratchathani', emoji: '🌅', region: 'northeast', lat: 15.2448, lng: 104.8473 },
  { id: 'buriram', name: 'บุรีรัมย์', nameEn: 'Buriram', emoji: '🏰', region: 'northeast', lat: 14.9951, lng: 103.1029 },
  { id: 'surin', name: 'สุรินทร์', nameEn: 'Surin', emoji: '🐘', region: 'northeast', lat: 14.8829, lng: 103.4936 },
  { id: 'sisaket', name: 'ศรีสะเกษ', nameEn: 'Sisaket', emoji: '🧄', region: 'northeast', lat: 15.1186, lng: 104.3220 },
  { id: 'roi_et', name: 'ร้อยเอ็ด', nameEn: 'Roi Et', emoji: '🗼', region: 'northeast', lat: 16.0538, lng: 103.6520 },
  { id: 'mahasarakham', name: 'มหาสารคาม', nameEn: 'Maha Sarakham', emoji: '🎓', region: 'northeast', lat: 16.1852, lng: 103.3007 },
  { id: 'kalasin', name: 'กาฬสินธุ์', nameEn: 'Kalasin', emoji: '🦕', region: 'northeast', lat: 16.4322, lng: 103.5061 },
  { id: 'chaiyaphum', name: 'ชัยภูมิ', nameEn: 'Chaiyaphum', emoji: '🌸', region: 'northeast', lat: 15.8063, lng: 102.0315 },
  { id: 'loei', name: 'เลย', nameEn: 'Loei', emoji: '🍁', region: 'northeast', lat: 17.4860, lng: 101.7223 },
  { id: 'nong_khai', name: 'หนองคาย', nameEn: 'Nong Khai', emoji: '🐉', region: 'northeast', lat: 17.8783, lng: 102.7420 },
  { id: 'bueng_kan', name: 'บึงกาฬ', nameEn: 'Bueng Kan', emoji: '🐳', region: 'northeast', lat: 18.3633, lng: 103.6529 },
  { id: 'nong_bua_lamphu', name: 'หนองบัวลำภู', nameEn: 'Nong Bua Lamphu', emoji: '🪨', region: 'northeast', lat: 17.2044, lng: 102.4410 },
  { id: 'sakonnakhon', name: 'สกลนคร', nameEn: 'Sakon Nakhon', emoji: '🐄', region: 'northeast', lat: 17.1546, lng: 104.1486 },
  { id: 'nakhonphanom', name: 'นครพนม', nameEn: 'Nakhon Phanom', emoji: '🛕', region: 'northeast', lat: 17.3999, lng: 104.7801 },
  { id: 'mukdahan', name: 'มุกดาหาร', nameEn: 'Mukdahan', emoji: '🌉', region: 'northeast', lat: 16.5434, lng: 104.7235 },
  { id: 'yasothon', name: 'ยโสธร', nameEn: 'Yasothon', emoji: '🚀', region: 'northeast', lat: 15.7926, lng: 104.1451 },
  { id: 'amnat_charoen', name: 'อำนาจเจริญ', nameEn: 'Amnat Charoen', emoji: '🌾', region: 'northeast', lat: 15.8585, lng: 104.6295 },

  // ── ภาคใต้ (14) ──────────────────────────────
  { id: 'phuket', name: 'ภูเก็ต', nameEn: 'Phuket', emoji: '🏝️', region: 'south', lat: 7.8804, lng: 98.3923 },
  { id: 'songkhla', name: 'สงขลา (หาดใหญ่)', nameEn: 'Songkhla', emoji: '🐟', region: 'south', lat: 7.1898, lng: 100.5954 },
  { id: 'suratthani', name: 'สุราษฎร์ธานี (สมุย)', nameEn: 'Surat Thani', emoji: '🥥', region: 'south', lat: 9.1382, lng: 99.3217 },
  { id: 'krabi', name: 'กระบี่', nameEn: 'Krabi', emoji: '⛵', region: 'south', lat: 8.0863, lng: 98.9063 },
  { id: 'phang_nga', name: 'พังงา', nameEn: 'Phang Nga', emoji: '⛰️', region: 'south', lat: 8.4501, lng: 98.5255 },
  { id: 'nakhonsithammarat', name: 'นครศรีธรรมราช', nameEn: 'Nakhon Si Thammarat', emoji: '🪔', region: 'south', lat: 8.4304, lng: 99.9631 },
  { id: 'trang', name: 'ตรัง', nameEn: 'Trang', emoji: '🍰', region: 'south', lat: 7.5563, lng: 99.6114 },
  { id: 'phatthalung', name: 'พัทลุง', nameEn: 'Phatthalung', emoji: '🛶', region: 'south', lat: 7.6167, lng: 100.0833 },
  { id: 'chumphon', name: 'ชุมพร', nameEn: 'Chumphon', emoji: '☕', region: 'south', lat: 10.4930, lng: 99.1800 },
  { id: 'ranong', name: 'ระนอง', nameEn: 'Ranong', emoji: '♨️', region: 'south', lat: 9.9529, lng: 98.6348 },
  { id: 'satun', name: 'สตูล', nameEn: 'Satun', emoji: '🐠', region: 'south', lat: 6.6238, lng: 100.0674 },
  { id: 'pattani', name: 'ปัตตานี', nameEn: 'Pattani', emoji: '🕌', region: 'south', lat: 6.8696, lng: 101.2501 },
  { id: 'yala', name: 'ยะลา (เบตง)', nameEn: 'Yala', emoji: '🐦', region: 'south', lat: 6.5411, lng: 101.2813 },
  { id: 'narathiwat', name: 'นราธิวาส', nameEn: 'Narathiwat', emoji: '🌊', region: 'south', lat: 6.4255, lng: 101.8253 },

  // ── ภาคตะวันออก (7) ──────────────────────────
  { id: 'chonburi', name: 'ชลบุรี (พัทยา-บางแสน)', nameEn: 'Chonburi', emoji: '🌊', region: 'east', lat: 13.3611, lng: 100.9847 },
  { id: 'rayong', name: 'ระยอง (เสม็ด)', nameEn: 'Rayong', emoji: '🥭', region: 'east', lat: 12.6814, lng: 101.2816 },
  { id: 'chanthaburi', name: 'จันทบุรี', nameEn: 'Chanthaburi', emoji: '💎', region: 'east', lat: 12.6114, lng: 102.1039 },
  { id: 'trat', name: 'ตราด (เกาะช้าง-กูด)', nameEn: 'Trat', emoji: '🏝️', region: 'east', lat: 12.2428, lng: 102.5175 },
  { id: 'chachoengsao', name: 'ฉะเชิงเทรา', nameEn: 'Chachoengsao', emoji: '🛕', region: 'east', lat: 13.6904, lng: 101.0779 },
  { id: 'prachinburi', name: 'ปราจีนบุรี', nameEn: 'Prachinburi', emoji: '🎋', region: 'east', lat: 14.0509, lng: 101.3717 },
  { id: 'sa_kaeo', name: 'สระแก้ว', nameEn: 'Sa Kaeo', emoji: '🦋', region: 'east', lat: 13.8140, lng: 102.0583 },

  // ── ภาคตะวันตก (5) ───────────────────────────
  { id: 'kanchanaburi', name: 'กาญจนบุรี', nameEn: 'Kanchanaburi', emoji: '🚂', region: 'west', lat: 14.0228, lng: 99.5328 },
  { id: 'ratchaburi', name: 'ราชบุรี', nameEn: 'Ratchaburi', emoji: '🏺', region: 'west', lat: 13.5283, lng: 99.8134 },
  { id: 'phetchaburi', name: 'เพชรบุรี (ชะอำ)', nameEn: 'Phetchaburi', emoji: '🍬', region: 'west', lat: 13.1114, lng: 99.9391 },
  { id: 'prachuap_khiri_khan', name: 'ประจวบคีรีขันธ์ (หัวหิน)', nameEn: 'Prachuap Khiri Khan', emoji: '🏖️', region: 'west', lat: 11.8124, lng: 99.7971 },
  { id: 'tak', name: 'ตาก', nameEn: 'Tak', emoji: '🌲', region: 'west', lat: 16.8839, lng: 99.1258 },
];

export const AMPHOES_BY_PROVINCE = {
  bangkok: [
    { id: 'samphanthawong', name: 'เขตสัมพันธวงศ์ (ตลาดน้อย-เยาวราช)' },
    { id: 'phayathai', name: 'เขตพญาไท (อารีย์)' },
    { id: 'pathumwan', name: 'เขตปทุมวัน (สยาม-บรรทัดทอง)' },
    { id: 'phranakorn', name: 'เขตพระนคร (เกาะเมืองเก่า)' },
    { id: 'bangrak', name: 'เขตบางรัก (สีลม-สาทร)' },
    { id: 'watthana', name: 'เขตวัฒนา (ทองหล่อ-เอกมัย)' },
    { id: 'phrakhanong', name: 'เขตพระโขนง (อ่อนนุช)' },
    { id: 'chatuchak', name: 'เขตจตุจักร' },
  ],
  chiangmai: [
    { id: 'mueang_cm', name: 'อ.เมืองเชียงใหม่ (นิมมาน-คูเมือง)' },
    { id: 'mae_rim', name: 'อ.แม่ริม (ม่อนแจ่ม)' },
    { id: 'hang_dong', name: 'อ.หางดง' },
    { id: 'san_kamphaeng', name: 'อ.สันกำแพง' },
    { id: 'chom_thong', name: 'อ.จอมทอง (ดอยอินทนนท์)' },
  ],
  chonburi: [
    { id: 'banglamung', name: 'อ.บางละมุง (พัทยา-นาเกลือ)' },
    { id: 'mueang_chon', name: 'อ.เมืองชลบุรี (บางแสน)' },
    { id: 'sriracha', name: 'อ.ศรีราชา (เกาะลอย-เกาะสีชัง)' },
    { id: 'sattahip', name: 'อ.สัตหีบ (บางเสร่)' },
  ],
  phuket: [
    { id: 'mueang_phuket', name: 'อ.เมืองภูเก็ต (เมืองเก่า-ราไวย์)' },
    { id: 'kathu', name: 'อ.กะทู้ (ป่าตอง)' },
    { id: 'thalang', name: 'อ.ถลาง (ไม้ขาว-เชิงทะเล)' },
  ],
  ayutthaya: [
    { id: 'ayutthaya_city', name: 'อ.พระนครศรีอยุธยา (เกาะเมืองเก่า)' },
    { id: 'bang_pa_in', name: 'อ.บางปะอิน' },
  ],
  khonkaen: [
    { id: 'mueang_kk', name: 'อ.เมืองขอนแก่น (กังสดาล-บึงแก่นนคร)' },
  ],
  korat: [
    { id: 'mueang_korat', name: 'อ.เมืองนครราชสีมา' },
    { id: 'pak_chong', name: 'อ.ปากช่อง (เขาใหญ่)' },
  ],
  songkhla: [
    { id: 'hat_yai', name: 'อ.หาดใหญ่' },
    { id: 'mueang_songkhla', name: 'อ.เมืองสงขลา (นางงาม)' },
  ],
  suratthani: [
    { id: 'ko_samui', name: 'เกาะสมุย' },
    { id: 'ko_phangan', name: 'เกาะพะงัน' },
    { id: 'mueang_surat', name: 'อ.เมืองสุราษฎร์ธานี' },
  ],
  krabi: [
    { id: 'mueang_krabi', name: 'อ.เมืองกระบี่ (อ่าวนาง-ไร่เลย์)' },
    { id: 'ko_lanta', name: 'เกาะลันตา' },
  ],
  kanchanaburi: [
    { id: 'mueang_kan', name: 'อ.เมืองกาญจนบุรี (สะพานข้ามแม่น้ำแคว)' },
    { id: 'sai_yok', name: 'อ.ไทรโยค (น้ำตก-แพริมน้ำ)' },
    { id: 'sangkhla_buri', name: 'อ.สังขละบุรี (สะพานมอญ)' },
  ],
  prachuap_khiri_khan: [
    { id: 'hua_hin', name: 'อ.หัวหิน' },
    { id: 'pran_buri', name: 'อ.ปราณบุรี (ปากน้ำปราณ)' },
    { id: 'mueang_prachuap', name: 'อ.เมืองประจวบคีรีขันธ์' },
  ],
  chiangrai: [
    { id: 'mueang_cr', name: 'อ.เมืองเชียงราย (ริมกก-วัดร่องขุ่น)' },
    { id: 'mae_suai', name: 'อ.แม่สรวย (ดอยช้าง-วาวี)' },
    { id: 'chiang_saen', name: 'อ.เชียงแสน (สามเหลี่ยมทองคำ)' },
  ],
  nan: [
    { id: 'mueang_nan', name: 'อ.เมืองน่าน (วัดภูมินทร์-กระซิบรัก)' },
    { id: 'pua', name: 'อ.ปัว (ดอยภูคา-ทุ่งนา)' },
  ],
  rayong: [
    { id: 'mueang_rayong', name: 'อ.เมืองระยอง (ถนนยมจินดา-ปากน้ำ)' },
    { id: 'klaeng', name: 'อ.แกลง (แหลมแม่พิมพ์-เกาะเสม็ด)' },
  ],
  phetchaburi: [
    { id: 'cha_am', name: 'อ.ชะอำ (หาดชะอำ)' },
    { id: 'mueang_phet', name: 'อ.เมืองเพชรบุรี (เขาวัง)' },
  ],
  samutsongkhram: [
    { id: 'amphawa', name: 'อ.อัมพวา (ตลาดน้ำอัมพวา)' },
    { id: 'mueang_ssk', name: 'อ.เมืองสมุทรสงคราม (ตลาดร่มหุบ)' },
  ],
  nonthaburi: [
    { id: 'pak_kret', name: 'อ.ปากเกร็ด (เกาะเกร็ด)' },
    { id: 'mueang_non', name: 'อ.เมืองนนทบุรี' },
  ],
  nakhonpathom: [
    { id: 'mueang_np', name: 'อ.เมืองนครปฐม (องค์พระปฐมเจดีย์)' },
    { id: 'sam_phran', name: 'อ.สามพราน (ตลาดดอนหวาย)' },
  ],
  udon_thani: [
    { id: 'mueang_udon', name: 'อ.เมืองอุดรธานี (หนองประจักษ์)' },
    { id: 'kumphawapi', name: 'อ.กุมภวาปี (ทะเลบัวแดง)' },
  ],
  ubon_ratchathani: [
    { id: 'mueang_ubon', name: 'อ.เมืองอุบลราชธานี (ทุ่งศรีเมือง)' },
    { id: 'khong_chiam', name: 'อ.โขงเจียม (ผาแต้ม)' },
  ],
};

export const DISTRICT_DESTINATIONS = [
  // ── BANGKOK ─────────────────────────
  {
    id: 'taladnoi',
    provinceId: 'bangkok',
    amphoeId: 'samphanthawong',
    tambonName: 'แขวงตลาดน้อย',
    name: 'ตลาดน้อย - เจริญกรุง',
    tag: '🔥 ฮิตตลอดกาล',
    highlight: 'คาเฟ่วินเทจ สตรีทอาร์ตริมเจ้าพระยา และอาหารจีนกวางตุ้งต้นตำรับ',
    lat: 13.7313,
    lng: 100.5105,
    coverEmoji: '🎨',
    coverPhoto: {
      src: '/images/destinations/talat-noi-street-art.jpg',
      alt: 'ภาพจิตรกรรมฝาผนังสีสันสดใสบนอาคารในตลาดน้อย',
      author: 'Phoebus 28',
      license: 'CC BY-SA 4.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Talat_Noi_Street_Art.jpg',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    },
    stopsCount: 4,
    avgCost: 299,
  },
  {
    id: 'yaowarat',
    provinceId: 'bangkok',
    amphoeId: 'samphanthawong',
    tambonName: 'แขวงเยาวราช',
    name: 'เยาวราช - ไชน่าทาวน์',
    tag: '🏮 สตรีทฟู้ดในตำนาน',
    highlight: 'สตรีทฟู้ดมิชลิน ซีฟู้ดไฟลุก ขนมปังปิ้งไส้ทะลัก บรรยากาศไฟนีออนคึกคัก',
    lat: 13.7404,
    lng: 100.5133,
    coverEmoji: '🦞',
    coverPhoto: {
      src: '/images/destinations/yaowarat-night.jpg',
      alt: 'ถนนเยาวราชยามค่ำคืนที่ประดับด้วยป้ายไฟ',
      author: 'Deepak-nsk',
      license: 'CC0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Chinatown_in_Bangkok_(Yaowarat)_at_night.jpg',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    stopsCount: 4,
    avgCost: 350,
  },
  {
    id: 'ari',
    provinceId: 'bangkok',
    amphoeId: 'phayathai',
    tambonName: 'แขวงสามเสนใน',
    name: 'อารีย์ - พหลโยธิน',
    tag: '☕ คาเฟ่ & ชิค',
    highlight: 'คาเฟ่มินิมอล ขนมโฮมเมด บรรยากาศร่มรื่น ถ่ายรูปคุมโทนสายอาร์ต',
    lat: 13.7797,
    lng: 100.5447,
    coverEmoji: '🥐',
    coverPhoto: {
      src: '/images/destinations/ari-bts-station.jpg',
      alt: 'รถไฟฟ้าจอดที่สถานีอารีย์ กรุงเทพฯ',
      author: 'Crcolas',
      license: 'CC BY-SA 4.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Ari_BTS_Station.jpg',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    },
    stopsCount: 4,
    avgCost: 350,
  },
  {
    id: 'banthatthong',
    provinceId: 'bangkok',
    amphoeId: 'pathumwan',
    tambonName: 'แขวงวังใหม่',
    name: 'บรรทัดทอง - สามย่าน',
    tag: '🍜 สวรรค์สายกินดึก',
    highlight: 'รวมดาวร้านดัง ข้าวต้มปลา โทสต์ฉ่ำเนย นมสดตุ๋น บัวลอยลาวาคิวทอง',
    lat: 13.7425,
    lng: 100.5235,
    coverEmoji: '🔥',
    stopsCount: 4,
    avgCost: 250,
  },
  {
    id: 'phranakorn',
    provinceId: 'bangkok',
    amphoeId: 'phranakorn',
    tambonName: 'แขวงเสาชิงช้า',
    name: 'พระนคร - เสาชิงช้า',
    tag: '🏛️ เกาะรัตนโกสินทร์',
    highlight: 'เดินลัดเลาะเกาะเมืองเก่า ของกินในตำนาน วิวพระปรางค์ และมนต์นมสด',
    lat: 13.7525,
    lng: 100.5015,
    coverEmoji: '🏮',
    stopsCount: 4,
    avgCost: 220,
  },
  {
    id: 'silom',
    provinceId: 'bangkok',
    amphoeId: 'bangrak',
    tambonName: 'แขวงสีลม',
    name: 'สีลม - สาทร',
    tag: '🌆 ไนต์ไลฟ์ & รูฟท็อป',
    highlight: 'บาร์แจ๊ส อาหารนานาชาติ บาร์ค็อกเทลดาดฟ้าชมแสงไฟมหานคร',
    lat: 13.7244,
    lng: 100.5259,
    coverEmoji: '🍸',
    stopsCount: 4,
    avgCost: 400,
  },
  {
    id: 'thonglor',
    provinceId: 'bangkok',
    amphoeId: 'watthana',
    tambonName: 'แขวงคลองตันเหนือ',
    name: 'ทองหล่อ - เอกมัย',
    tag: '✨ พรีเมียมไลฟ์สไตล์',
    highlight: 'อาหารญี่ปุ่นระดับพรีเมียม สเปเชียลตี้คอฟฟี่ บรันช์ชิคๆ สังสรรค์เพื่อนฝูง',
    lat: 13.7319,
    lng: 100.5844,
    coverEmoji: '🍣',
    stopsCount: 4,
    avgCost: 450,
  },
  {
    id: 'onnut',
    provinceId: 'bangkok',
    amphoeId: 'phrakhanong',
    tambonName: 'แขวงบางจาก',
    name: 'อ่อนนุช - ปุณณวิถี',
    tag: '🌿 ชุมชนคนรุ่นใหม่',
    highlight: 'คาเฟ่ลับในซอย ตลาดคอมมูนิตี้ อาหารฟิวชั่น เดินทางง่ายด้วย BTS',
    lat: 13.7011,
    lng: 100.5984,
    coverEmoji: '🚲',
    stopsCount: 4,
    avgCost: 230,
  },
  {
    id: 'chatuchak',
    provinceId: 'bangkok',
    amphoeId: 'chatuchak',
    tambonName: 'แขวงจตุจักร',
    name: 'จตุจักร - สวนรถไฟ',
    tag: '🎪 ช้อปปิ้ง & พักผ่อน',
    highlight: 'ตลาดนัดสุดสัปดาห์ใหญ่ที่สุด ปั่นจักรยานสูดอากาศที่สวนรถไฟ ช้อปของวินเทจ',
    lat: 13.7999,
    lng: 100.5508,
    coverEmoji: '🌳',
    stopsCount: 4,
    avgCost: 280,
  },

  // ── CHIANG MAI ──────────────────────
  {
    id: 'nimman',
    provinceId: 'chiangmai',
    amphoeId: 'mueang_cm',
    tambonName: 'ต.สุเทพ',
    name: 'นิมมานเหมินทร์',
    tag: '☕ คาเฟ่ฮอปปิ้งภาคเหนือ',
    highlight: 'สเปเชียลตี้คอฟฟี่ระดับแชมป์โลก ข้าวซอยฟิวชั่น แกลเลอรี่ One Nimman',
    lat: 18.7967,
    lng: 98.9691,
    coverEmoji: '☕',
    stopsCount: 4,
    avgCost: 320,
  },
  {
    id: 'oldcity_cm',
    provinceId: 'chiangmai',
    amphoeId: 'mueang_cm',
    tambonName: 'ต.ศรีภูมิ',
    name: 'คูเมืองเก่าเชียงใหม่',
    tag: '🏛️ วัฒนธรรมล้านนา',
    highlight: 'ปั่นจักรยานไหว้พระวัดเจดีย์หลวง กาแฟโบราณ ขนมหวานพื้นเมือง ถนนคนเดินท่าแพ',
    lat: 18.7904,
    lng: 98.9877,
    coverEmoji: '🛕',
    stopsCount: 4,
    avgCost: 240,
  },
  {
    id: 'maerim',
    provinceId: 'chiangmai',
    amphoeId: 'mae_rim',
    tambonName: 'ต.แม่แรม',
    name: 'แม่ริม - ม่อนแจ่ม',
    tag: '🌸 ชมหมอก & ดอกไม้',
    highlight: 'ไร่ส้ม กาแฟดริปริมลำธาร สวนดอกไม้ขั้นบันได อากาศเย็นสดชื่นตลอดปี',
    lat: 18.9175,
    lng: 98.8608,
    coverEmoji: '⛰️',
    stopsCount: 3,
    avgCost: 300,
  },

  // ── CHONBURI ────────────────────────
  {
    id: 'bangsaen',
    provinceId: 'chonburi',
    amphoeId: 'mueang_chon',
    tambonName: 'ต.แสนสุข',
    name: 'บางแสน - เขาสามมุข',
    tag: '🌊 ทะเลใกล้กรุง',
    highlight: 'ซีฟู้ดสดริมหาด คาเฟ่วิวทะเลเขาสามมุข ถ่ายรูปกังหันลม และอาหารเช้าสะพานปลา',
    lat: 13.2842,
    lng: 100.9149,
    coverEmoji: '🏖️',
    stopsCount: 4,
    avgCost: 280,
  },
  {
    id: 'pattaya',
    provinceId: 'chonburi',
    amphoeId: 'banglamung',
    tambonName: 'เมืองพัทยา',
    name: 'พัทยา - หาดจอมเทียน',
    tag: '🌴 สีสันเมืองตากอากาศ',
    highlight: 'บีชคลับริมหาด กีฬาทางน้ำ พระอาทิตย์ตกจุดชมวิวเขาพระตำหนัก สตรีทฟู้ดนานาชาติ',
    lat: 12.9236,
    lng: 100.8825,
    coverEmoji: '🏄',
    stopsCount: 4,
    avgCost: 390,
  },

  // ── PHUKET ──────────────────────────
  {
    id: 'oldphuket',
    provinceId: 'phuket',
    amphoeId: 'mueang_phuket',
    tambonName: 'ต.ตลาดใหญ่',
    name: 'ภูเก็ตเมืองเก่า (Old Phuket Town)',
    tag: '🏛️ ชิโนโปรตุกีส',
    highlight: 'ตึกโบราณสีพาสเทล โรตีแถวน้ำ หมี่ฮกเกี้ยนมิชลิน กาแฟโบราณสไตล์เปอรานากัน',
    lat: 7.8841,
    lng: 98.3892,
    coverEmoji: '🕌',
    stopsCount: 4,
    avgCost: 310,
  },
  {
    id: 'rawai_phuket',
    provinceId: 'phuket',
    amphoeId: 'mueang_phuket',
    tambonName: 'ต.ราไวย์',
    name: 'ราไวย์ - แหลมพรหมเทพ',
    tag: '🌅 จุดชมวิวทะเลใต้',
    highlight: 'ซีฟู้ดตลาดปลาสด ชมพระอาทิตย์ตกดินที่แหลมพรหมเทพ คาเฟ่ริมหน้าผา',
    lat: 7.7639,
    lng: 98.3053,
    coverEmoji: '⛵',
    stopsCount: 3,
    avgCost: 350,
  },

  // ── AYUTTHAYA ───────────────────────
  {
    id: 'ayutthaya_old',
    provinceId: 'ayutthaya',
    amphoeId: 'ayutthaya_city',
    tambonName: 'ต.ประตูชัย',
    name: 'เกาะเมืองอยุธยา',
    tag: '🪷 มรดกโลก',
    highlight: 'วัดมหาธาตุ กุ้งแม่น้ำเผาเตาถ่าน โรตีสายไหมต้นตำรับ คาเฟ่วิวเจดีย์เก่า',
    lat: 14.3532,
    lng: 100.5684,
    coverEmoji: '🛕',
    stopsCount: 4,
    avgCost: 320,
  },

  // ── KHON KAEN ───────────────────────
  {
    id: 'kangsadan',
    provinceId: 'khonkaen',
    amphoeId: 'mueang_kk',
    tambonName: 'ต.ในเมือง',
    name: 'กังสดาล - มข.',
    tag: '🌻 คาเฟ่ & บึงหนองแวง',
    highlight: 'คาเฟ่สุดคูลรอบรั้วมอดินแดง อาหารอีสานรสแซ่บ เดินเล่นริมบึงสีฐาน',
    lat: 16.4533,
    lng: 102.8236,
    coverEmoji: '🌾',
    stopsCount: 4,
    avgCost: 200,
  },

  // ── KORAT ───────────────────────────
  {
    id: 'pakchong_khaoyai',
    provinceId: 'korat',
    amphoeId: 'pak_chong',
    tambonName: 'ต.หมูสี',
    name: 'ปากช่อง - เขาใหญ่',
    tag: '🌲 สูดโอโซนธรรมชาติ',
    highlight: 'คาเฟ่กลางหุบเขา คาร์เนชั่นฟาร์ม สเต๊กเนื้อพรีเมียม สูดอากาศบริสุทธิ์',
    lat: 14.5361,
    lng: 101.4011,
    coverEmoji: '⛰️',
    stopsCount: 4,
    avgCost: 360,
  },

  // ── SONGKHLA (HAT YAI) ──────────────
  {
    id: 'hatyai_central',
    provinceId: 'songkhla',
    amphoeId: 'hat_yai',
    tambonName: 'ต.หาดใหญ่',
    name: 'หาดใหญ่ - ตลาดกิมหยง',
    tag: '🍗 สตรีทฟู้ดแดนใต้',
    highlight: 'ไก่ทอดหาดใหญ่ต้นตำรับ บักกุ๊ดเต๋ร้อนๆ ช้อปขนมนำเข้าตลาดกิมหยง บะหมี่เบตง',
    lat: 7.0084,
    lng: 100.4767,
    coverEmoji: '🍜',
    stopsCount: 4,
    avgCost: 230,
  },

  // ── KANCHANABURI ────────────────────
  {
    id: 'kanchanaburi_river',
    provinceId: 'kanchanaburi',
    amphoeId: 'mueang_kan',
    tambonName: 'ต.บ้านใต้',
    name: 'สะพานข้ามแม่น้ำแคว - ริมน้ำ',
    tag: '🚂 ประวัติศาสตร์ & ล่องแพ',
    highlight: 'เดินสะพานข้ามแม่น้ำแคว คาเฟ่แพริมน้ำ อาหารปลาคังรสเด็ด รถไฟสายมรณะ',
    lat: 14.0415,
    lng: 99.5038,
    coverEmoji: '🚂',
    stopsCount: 4,
    avgCost: 260,
  },

  // ── PRACHUAP (HUA HIN) ──────────────
  {
    id: 'huahin_beach',
    provinceId: 'prachuap_khiri_khan',
    amphoeId: 'hua_hin',
    tambonName: 'ต.หัวหิน',
    name: 'หัวหิน - ตลาดโต้รุ่ง',
    tag: '🏖️ ชายหาดคลาสสิก',
    highlight: 'ขี่ม้าชายหาดหัวหิน ซีฟู้ดตลาดโต้รุ่ง ชิมกาแฟสถานีรถไฟหัวหินโบราณ',
    lat: 12.5684,
    lng: 99.9577,
    coverEmoji: '🏖️',
    stopsCount: 4,
    avgCost: 320,
  },
  {
    id: 'pranburi_beach',
    provinceId: 'prachuap_khiri_khan',
    amphoeId: 'pran_buri',
    tambonName: 'ต.ปากน้ำปราณ',
    name: 'ปากน้ำปราณ - วนอุทยานปราณบุรี',
    tag: '🌿 สงบ & ชิลริมเล',
    highlight: 'ป่าสนริมหาด ทางเดินสะพานไม้โกงกาง คาเฟ่มินิมอลวิวทะเล ซีฟู้ดหมึกแดดเดียว',
    lat: 12.3852,
    lng: 100.0051,
    coverEmoji: '🦀',
    stopsCount: 4,
    avgCost: 290,
  },

  // ── BANGKOK (ADDITIONAL) ────────────
  {
    id: 'siam_ratchaprasong',
    provinceId: 'bangkok',
    amphoeId: 'pathumwan',
    tambonName: 'แขวงปทุมวัน',
    name: 'สยาม - ราชประสงค์',
    tag: '🛍️ ช้อปปิ้ง & มูเตลู',
    highlight: 'ไหว้พระพรหม-พระพิฆเนศ ช้อปปิ้งสยามสแควร์ คาเฟ่เกาหลี แหล่งรวมแฟชั่นวัยรุ่น',
    lat: 13.7443,
    lng: 100.5348,
    coverEmoji: '🛍️',
    stopsCount: 4,
    avgCost: 350,
  },
  {
    id: 'wanglang_thonburi',
    provinceId: 'bangkok',
    amphoeId: 'bangkok_noi',
    tambonName: 'แขวงศิริราช',
    name: 'วังหลัง - ท่าเตียน',
    tag: '🥐 สตรีทฟู้ดริมแม่น้ำ',
    highlight: 'ขนมปังอบเนยสดวังหลัง ล่องเรือด่วนเจ้าพระยา ชมพระปรางค์วัดอรุณ คาเฟ่ตึกเก่า',
    lat: 13.7554,
    lng: 100.4862,
    coverEmoji: '⛵',
    stopsCount: 4,
    avgCost: 220,
  },
  {
    id: 'banglamphu_khaosan',
    provinceId: 'bangkok',
    amphoeId: 'phranakorn',
    tambonName: 'แขวงตลาดยอด',
    name: 'บางลำพู - ถนนข้าวสาร',
    tag: '🎒 แบ็กแพ็กเกอร์ & ของอร่อย',
    highlight: 'โรตีมะตะบะเจ้าเก่า ก๋วยเตี๋ยวเนื้อต้มยำ ดนตรีสดอะคูสติก บรรยากาศนานาชาติ',
    lat: 13.7592,
    lng: 100.4975,
    coverEmoji: '🎸',
    stopsCount: 4,
    avgCost: 250,
  },

  // ── CHIANG MAI (ADDITIONAL) ─────────
  {
    id: 'maekampong',
    provinceId: 'chiangmai',
    amphoeId: 'mae_on',
    tambonName: 'ต.ห้วยแก้ว',
    name: 'แม่กำปอง - แม่ออน',
    tag: '🏡 หมู่บ้านกลางหุบเขา',
    highlight: 'กาแฟริมลำธาร น้ำตกเย็นฉ่ำ ชิมไส้อั่วโฮมเมด สูดกลิ่นไอหมอกบนยอดดอย',
    lat: 18.8653,
    lng: 99.3501,
    coverEmoji: '🏡',
    stopsCount: 4,
    avgCost: 280,
  },
  {
    id: 'sankamphaeng',
    provinceId: 'chiangmai',
    amphoeId: 'san_kamphaeng',
    tambonName: 'ต.ต้นเปา',
    name: 'สันกำแพง - ร่มบ่อสร้าง',
    tag: '🎨 หัตถกรรม & คาเฟ่ดินเผา',
    highlight: 'เพ้นท์ร่มบ่อสร้าง ชิมไข่ต้มน้ำพุร้อนสันกำแพง คาเฟ่สไตล์ล้านนาโมเดิร์น',
    lat: 18.7451,
    lng: 99.1172,
    coverEmoji: '☂️',
    stopsCount: 4,
    avgCost: 260,
  },

  // ── CHONBURI (ADDITIONAL) ───────────
  {
    id: 'sattahip_bangsaray',
    provinceId: 'chonburi',
    amphoeId: 'sattahip',
    tambonName: 'ต.บางเสร่',
    name: 'บางเสร่ - สัตหีบ',
    tag: '⚓ วิถีประมง & ชายหาดสงบ',
    highlight: 'สะพานปลาบางเสร่ คาเฟ่เรือนไม้โบราณริมน้ำ อาหารทะเลสดจากเรือ ปลากะพงทอดน้ำปลา',
    lat: 12.7663,
    lng: 100.8988,
    coverEmoji: '🐟',
    stopsCount: 4,
    avgCost: 320,
  },
  {
    id: 'kohsichang',
    provinceId: 'chonburi',
    amphoeId: 'sriracha',
    tambonName: 'ต.ท่าเทววงษ์',
    name: 'เกาะสีชัง - ช่องเขาขาด',
    tag: '🌊 พักใจเกาะใกล้กรุง',
    highlight: 'สะพานอัษฎางค์สีขาว พระจุฑาธุชราชฐาน ชมพระอาทิตย์ตกช่องเขาขาด ขี่สกายแล็ป',
    lat: 13.1517,
    lng: 100.8118,
    coverEmoji: '🌅',
    stopsCount: 4,
    avgCost: 300,
  },

  // ── PHUKET (ADDITIONAL) ─────────────
  {
    id: 'patong_beach',
    provinceId: 'phuket',
    amphoeId: 'kathu',
    tambonName: 'ต.ป่าตอง',
    name: 'หาดป่าตอง - ถนนบางลา',
    tag: '🏄 เซิร์ฟ & บีชคลับ',
    highlight: 'นอนชิลริมหาดทรายขาว พาราเซลลิ่ง คาเฟ่สไตล์บาหลี แสงสีเสียงไฟนีออนริมเล',
    lat: 7.8966,
    lng: 98.2981,
    coverEmoji: '🏄',
    stopsCount: 4,
    avgCost: 400,
  },

  // ── CHIANG RAI ──────────────────────
  {
    id: 'doichang_cr',
    provinceId: 'chiangrai',
    amphoeId: 'mae_suai',
    tambonName: 'ต.วาวี',
    name: 'ดอยช้าง - แดนสวรรค์กาแฟ',
    tag: '☕ สเปเชียลตี้คอฟฟี่ & ทะเลหมอก',
    highlight: 'จิบกาแฟระดับโลกชมวิวขุนเขา แวะฟาร์มแกะดอยช้าง สัมผัสอากาศหนาวเย็นสดชื่น',
    lat: 19.8052,
    lng: 99.5583,
    coverEmoji: '🐑',
    stopsCount: 4,
    avgCost: 290,
  },
  {
    id: 'rimkok_cr',
    provinceId: 'chiangrai',
    amphoeId: 'mueang_cr',
    tambonName: 'ต.เวียง',
    name: 'ริมกก - ตัวเมืองเชียงราย',
    tag: '🛕 วัดร่องขุ่น & ศิลปะล้านนา',
    highlight: 'ชมสถาปัตยกรรมอาจารย์เฉลิมชัย คาเฟ่ริมแม่น้ำกก ข้าวซอยน้ำเงี้ยวป้าสุขในตำนาน',
    lat: 19.9072,
    lng: 99.8325,
    coverEmoji: '🎨',
    stopsCount: 4,
    avgCost: 250,
  },

  // ── NAN ─────────────────────────────
  {
    id: 'pua_nan',
    provinceId: 'nan',
    amphoeId: 'pua',
    tambonName: 'ต.ศิลาแลง',
    name: 'อ.ปัว - ทุ่งนาดอยภูคา',
    tag: '🌾 สโลว์ไลฟ์กลางทุ่งนา',
    highlight: 'กาแฟบ้านไทลื้อ วิวดอยภูคาเขียวขจี ลำดวนผ้าทอ ลมหนาวพัดโชยผ่อนคลายจิตใจ',
    lat: 19.1764,
    lng: 100.9167,
    coverEmoji: '🌾',
    stopsCount: 4,
    avgCost: 240,
  },
  {
    id: 'city_nan',
    provinceId: 'nan',
    amphoeId: 'mueang_nan',
    tambonName: 'ต.ในเมือง',
    name: 'ตัวเมืองน่าน - วัดภูมินทร์',
    tag: '💑 กระซิบรักบันลือโลก',
    highlight: 'ภาพปู่ม่านย่าม่านวัดภูมินทร์ ซุ้มลีลาวดีพิพิธภัณฑ์น่าน กาแฟโบราณ ข้าวซอยต้นน้ำ',
    lat: 18.7756,
    lng: 100.7730,
    coverEmoji: '🛕',
    stopsCount: 4,
    avgCost: 210,
  },

  // ── SURAT THANI ─────────────────────
  {
    id: 'samui_bophut',
    provinceId: 'suratthani',
    amphoeId: 'ko_samui',
    tambonName: 'ต.บ่อผุด',
    name: 'สมุย - ฟิชเชอร์แมนวิลเลจ',
    tag: '🌴 ถนนคนเดินริมทะเล',
    highlight: 'ร้านอาหารริมหาดทราย บาร์ไฟสีส้มชมดาว กาแฟมะพร้าวสมุย สปาอโรมาผ่อนคลาย',
    lat: 9.5562,
    lng: 100.0336,
    coverEmoji: '🥥',
    stopsCount: 4,
    avgCost: 420,
  },

  // ── KRABI ───────────────────────────
  {
    id: 'aonang_railay',
    provinceId: 'krabi',
    amphoeId: 'mueang_krabi',
    tambonName: 'ต.อ่าวนาง',
    name: 'อ่าวนาง - หาดไร่เลย์',
    tag: '🧗 หน้าผาหินปูน & ถ้ำพระนาง',
    highlight: 'นั่งเรือหางยาวข้ามฟาก ปีนผาไร่เลย์ พายเรือคายัคชมถ้ำ ซีฟู้ดสดน้ำจิ้มซีฟู้ดรสเด็ด',
    lat: 8.0125,
    lng: 98.8398,
    coverEmoji: '⛵',
    stopsCount: 4,
    avgCost: 380,
  },

  // ── SAMUT SONGKHRAM ─────────────────
  {
    id: 'amphawa_floating',
    provinceId: 'samutsongkhram',
    amphoeId: 'amphawa',
    tambonName: 'ต.อัมพวา',
    name: 'ตลาดน้ำอัมพวา - ริมคลอง',
    tag: '🛶 วิถีริมน้ำ & หิ่งห้อย',
    highlight: 'ซีฟู้ดย่างบนเรือพาย ก๋วยเตี๋ยวเรือโบราณ นั่งเรือชมหิ่งห้อยยามค่ำคืน ขนมไทยโบราณ',
    lat: 13.4258,
    lng: 99.9554,
    coverEmoji: '🛶',
    stopsCount: 4,
    avgCost: 240,
  },

  // ── NONTHABURI ──────────────────────
  {
    id: 'kohkret_non',
    provinceId: 'nonthaburi',
    amphoeId: 'pak_kret',
    tambonName: 'ต.เกาะเกร็ด',
    name: 'เกาะเกร็ด - เครื่องปั้นดินเผา',
    tag: '🏺 ชุมชนมอญ & ขนมหวาน',
    highlight: 'ปั่นจักรยานรอบเกาะ แวะชิมทอดมันหน่อกะลา ข้าวแช่โบราณ ชาใส่นมในคนโทดินเผา',
    lat: 13.9128,
    lng: 100.4897,
    coverEmoji: '🏺',
    stopsCount: 4,
    avgCost: 200,
  },

  // ── NAKHON PATHOM ───────────────────
  {
    id: 'phrapathom_np',
    provinceId: 'nakhonpathom',
    amphoeId: 'mueang_np',
    tambonName: 'ต.พระปฐมเจดีย์',
    name: 'องค์พระปฐมเจดีย์ - ตลาดโต้รุ่ง',
    tag: '🛕 เจดีย์ใหญ่ที่สุด & ของกิน',
    highlight: 'ไหว้พระร่วงโรจนฤทธิ์ ตลาดโต้รุ่งองค์พระ ไอศกรีมลอยฟ้า หอยทอดนายผอม ข้าวหมูกรอบ',
    lat: 13.8196,
    lng: 100.0601,
    coverEmoji: '🛕',
    stopsCount: 4,
    avgCost: 220,
  },

  // ── RAYONG ──────────────────────────
  {
    id: 'kohsamed_rayong',
    provinceId: 'rayong',
    amphoeId: 'klaeng',
    tambonName: 'ต.เพ',
    name: 'เกาะเสม็ด - หาดทรายแก้ว',
    tag: '🏖️ หาดทรายขาวเนียน',
    highlight: 'โชว์ควงกระบองไฟริมหาด อาหารทะเลสดปิ้งย่าง ดำน้ำตื้นชมปะการัง คาเฟ่ริมอ่าว',
    lat: 12.5638,
    lng: 101.4589,
    coverEmoji: '🔥',
    stopsCount: 4,
    avgCost: 350,
  },

  // ── PHETCHABURI ─────────────────────
  {
    id: 'chaam_beach',
    provinceId: 'phetchaburi',
    amphoeId: 'cha_am',
    tambonName: 'ต.ชะอำ',
    name: 'หาดชะอำ - สะพานปลา',
    tag: '🏖️ ทะเลครอบครัว & ขนมหวาน',
    highlight: 'ปูม้าเป็นนึ่งสะพานปลา กิจกรรมบานาน่าโบ๊ท ข้าวเหนียวมะม่วงและหม้อแกงเมืองเพชร',
    lat: 12.7984,
    lng: 99.9822,
    coverEmoji: '🦀',
    stopsCount: 4,
    avgCost: 280,
  },

  // ── UDON THANI ──────────────────────
  {
    id: 'nongprajak_udon',
    provinceId: 'udon_thani',
    amphoeId: 'mueang_udon',
    tambonName: 'ต.หมากแข้ง',
    name: 'หนองประจักษ์ - เป็ดยักษ์',
    tag: '🦆 สตรีทฟู้ดอีสาน & แลนด์มาร์ก',
    highlight: 'ถ่ายรูปเป็ดเหลืองหนองประจักษ์ ไข่กระทะร้านคิงส์โอชา แหนมเนือง VT ส้มตำแซ่บนัว',
    lat: 17.4138,
    lng: 102.7872,
    coverEmoji: '🦆',
    stopsCount: 4,
    avgCost: 210,
  },

  // ── UBON RATCHATHANI ────────────────
  {
    id: 'thungsrimeuang_ubon',
    provinceId: 'ubon_ratchathani',
    amphoeId: 'mueang_ubon',
    tambonName: 'ต.ในเมือง',
    name: 'ทุ่งศรีเมือง - ริมแม่น้ำมูล',
    tag: '🌅 เมืองดอกบัวงาม',
    highlight: 'กวยจั๊บญวนสูตรโบราณ ข้าวต้มปลาแม่น้ำมูล คาเฟ่ริมแม่น้ำ ชมเทียนพรรษาเอกลักษณ์',
    lat: 15.2448,
    lng: 104.8473,
    coverEmoji: '🌅',
    stopsCount: 4,
    avgCost: 200,
  },
];

for (const destination of DISTRICT_DESTINATIONS) {
  const coverPhoto = destinationPhotos[destination.id];
  if (coverPhoto) destination.coverPhoto = coverPhoto;
}

// ───────────────────────────────────────────────
//  HELPER FUNCTIONS & SMART GPS DETECTOR
// ───────────────────────────────────────────────

export function getProvinces() {
  return PROVINCES;
}

export function getProvincesByRegion(regionId) {
  if (!regionId || regionId === 'all') return PROVINCES;
  return PROVINCES.filter((p) => p.region === regionId);
}

export function getAmphoes(provinceId) {
  if (!provinceId) return [];
  if (AMPHOES_BY_PROVINCE[provinceId] && AMPHOES_BY_PROVINCE[provinceId].length > 0) {
    return AMPHOES_BY_PROVINCE[provinceId];
  }
  const prov = PROVINCES.find((p) => p.id === provinceId);
  const provName = prov ? prov.name : '';
  return [
    { id: `mueang_${provinceId}`, name: `อ.เมือง${provName}` },
    { id: `central_${provinceId}`, name: 'ย่านการค้าใจกลางเมือง' },
    { id: `outer_${provinceId}`, name: 'อำเภอรอบนอก / แหล่งท่องเที่ยว' },
  ];
}

function normalizeAdministrativeName(value) {
  return String(value || '')
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/^(อำเภอ|ตำบล|เขต|แขวง|อ\.|ต\.)\s*/, '')
    .trim();
}

function getAdministrativeProvinceName(provinceId) {
  const province = PROVINCES.find((item) => item.id === provinceId);
  return province ? normalizeAdministrativeName(province.name) : '';
}

export function getAdministrativeDistricts(provinceId) {
  const provinceName = getAdministrativeProvinceName(provinceId);
  return (thaiAdministrativeAreas[provinceName] || []).map(([name]) => ({ id: name, name }));
}

export function getAdministrativeSubdistricts(provinceId, districtName) {
  const provinceName = getAdministrativeProvinceName(provinceId);
  const district = (thaiAdministrativeAreas[provinceName] || []).find(([name]) => name === districtName);
  return (district?.[1] || []).map((name) => ({ id: name, name }));
}

export function findAdministrativeDistrict(provinceId, value) {
  const districts = getAdministrativeDistricts(provinceId);
  const directMatch = districts.find((item) => item.id === value || item.name === value);
  if (directMatch) return directMatch;

  const oldDistrictName = getAmphoes(provinceId).find((item) => item.id === value)?.name;
  const normalizedNames = [value, oldDistrictName].map(normalizeAdministrativeName).filter(Boolean);
  return districts.find((item) => normalizedNames.includes(normalizeAdministrativeName(item.name))) || null;
}

export function findAdministrativeSubdistrict(provinceId, districtName, value) {
  const subdistricts = getAdministrativeSubdistricts(provinceId, districtName);
  const directMatch = subdistricts.find((item) => item.id === value || item.name === value);
  if (directMatch) return directMatch;

  const normalizedValue = normalizeAdministrativeName(value);
  return subdistricts.find((item) => normalizeAdministrativeName(item.name) === normalizedValue) || null;
}

/**
 * ดึงย่านท่องเที่ยว พร้อมระบบสร้างย่านจำลองอัตโนมัติหากจังหวัดนั้นยังไม่มี preset
 */
export function getDestinations(provinceId, amphoeId) {
  let list = DISTRICT_DESTINATIONS.filter((d) => {
    if (provinceId && d.provinceId !== provinceId) return false;
    if (amphoeId && d.amphoeId !== amphoeId) return false;
    return true;
  });

  // ถ้าเลือกจังหวัดแล้ว แต่ยังไม่มีย่านในระบบ ให้สร้างย่านไฮไลต์ของจังหวัดนั้นขึ้นมาทันที 100% เสถียร!
  if (list.length === 0 && provinceId) {
    const prov = PROVINCES.find((p) => p.id === provinceId);
    if (prov) {
      list = [
        {
          id: `custom_${provinceId}`,
          provinceId: prov.id,
          amphoeId: amphoeId || `mueang_${prov.id}`,
          tambonName: 'ในเมือง',
          name: `ย่านท่องเที่ยวไฮไลต์ ${prov.name}`,
          tag: '✨ ไฮไลต์น่าเที่ยวประจำจังหวัด',
          highlight: `รวมจุดเช็กอินยอดนิยม คาเฟ่เด่น ร้านอร่อย และวัฒนธรรมท้องถิ่นของ ${prov.name}`,
          lat: prov.lat || 13.7563,
          lng: prov.lng || 100.5018,
          coverEmoji: prov.emoji || '📍',
          stopsCount: 4,
          avgCost: 280,
        },
      ];
    }
  }

  return list;
}

export function findDestinationById(id) {
  const destination = DISTRICT_DESTINATIONS.find((d) => d.id === id);
  if (destination) return destination;
  if (typeof id === 'string' && id.startsWith('custom_')) {
    return getDestinations(id.slice('custom_'.length))[0] || DISTRICT_DESTINATIONS[0];
  }
  return DISTRICT_DESTINATIONS[0];
}

/**
 * คำนวณระยะทางแบบ Haversine (กิโลเมตร)
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * ค้นหาจังหวัดที่ใกล้เคียงที่สุดจากพิกัด GPS (ทำงานได้ทันทีแบบ Offline)
 */
export function findNearestProvince(lat, lng) {
  let nearest = PROVINCES[0];
  let minDistance = Infinity;

  for (const p of PROVINCES) {
    if (typeof p.lat === 'number' && typeof p.lng === 'number') {
      const d = calculateDistanceKm(lat, lng, p.lat, p.lng);
      if (d < minDistance) {
        minDistance = d;
        nearest = { ...p, distanceKm: d };
      }
    }
  }
  return nearest;
}

/**
 * ดึงพิกัด GPS จริงจากเบราว์เซอร์ พร้อมระบุจังหวัด/อำเภอ/ตำบล
 */
export async function detectLocationFromGPS() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('อุปกรณ์หรือเบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const nearestProvince = findNearestProvince(latitude, longitude);

        const amphoes = getAmphoes(nearestProvince.id);
        const defaultAmphoe = amphoes[0] || { id: '', name: 'อำเภอเมือง' };

        const result = {
          province: nearestProvince.id,
          provinceName: nearestProvince.name,
          provinceEmoji: nearestProvince.emoji,
          amphoe: defaultAmphoe.id,
          amphoeName: defaultAmphoe.name,
          tambon: 'ในเมือง',
          lat: latitude,
          lng: longitude,
          accuracy: Math.round(accuracy || 10),
          distanceToProvinceCenterKm: nearestProvince.distanceKm,
          timestamp: new Date().toISOString(),
        };

        // Try reverse geocoding via OpenStreetMap with 3.5s timeout for high accuracy
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};

            // Match province name in Thai
            const matchedProv = PROVINCES.find(
              (p) =>
                addr.province?.includes(p.name) ||
                addr.state?.includes(p.name) ||
                addr.city?.includes(p.name)
            );
            if (matchedProv) {
              result.province = matchedProv.id;
              result.provinceName = matchedProv.name;
              result.provinceEmoji = matchedProv.emoji;
            }

            const rawAmphoe = addr.district || addr.suburb || addr.city_district || addr.county || '';
            if (rawAmphoe) {
              result.amphoeName = rawAmphoe;
            }

            const rawTambon = addr.subdistrict || addr.neighbourhood || addr.quarter || addr.village || '';
            if (rawTambon) {
              result.tambon = rawTambon;
            }
          }
        } catch {
          // If network reverse geocoding fails, nearest fallback is already set!
        }

        resolve(result);
      },
      (err) => {
        let msg = 'ไม่สามารถระบุพิกัดตำแหน่งได้';
        if (err.code === 1) {
          msg = 'กรุณาอนุญาตให้เบราว์เซอร์เข้าถึงตำแหน่งของอุปกรณ์';
        } else if (err.code === 2) {
          msg = 'ไม่พบสัญญาณดาวเทียมหรือพิกัดตำแหน่ง';
        } else if (err.code === 3) {
          msg = 'หมดเวลาค้นหาตำแหน่ง กรุณาลองใหม่อีกครั้ง';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 30000,
      }
    );
  });
}
