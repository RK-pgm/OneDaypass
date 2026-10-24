import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generatePlan, getDeviceId } from '../api';
import { PROVINCES, REGIONS, getAmphoes, getDestinations, DISTRICT_DESTINATIONS, detectLocationFromGPS } from '../data/locations';

const BUDGET_OPTIONS = [
  { value: 149, label: '149', sub: 'ประหยัด', badge: 'สบายกระเป๋า' },
  { value: 199, label: '199', sub: 'มาตรฐาน', badge: 'คุ้มค่า' },
  { value: 299, label: '299', sub: 'ยอดนิยม', badge: 'แนะนำ ⭐' },
  { value: 399, label: '399', sub: 'ชิลสบาย', badge: 'ร้านเด่น' },
  { value: 499, label: '499', sub: 'พรีเมียม', badge: 'คาเฟ่&ดินเนอร์' },
  { value: 699, label: '699', sub: 'จัดเต็ม', badge: 'กิจกรรมแน่น' },
  { value: 899, label: '899', sub: 'วีไอพี', badge: 'เอ็กซ์คลูซีฟ' },
];

const TRAVEL_STYLES = [
  {
    value: 'chill',
    label: 'สายชิล สบายๆ',
    icon: '☕',
    color: 'from-blue-400 to-cyan-400',
    desc: 'เน้นคาเฟ่นั่งคุย ถ่ายรูปชิคๆ บรรยากาศผ่อนคลาย ไม่เร่งรีบ',
  },
  {
    value: 'cafe',
    label: 'สายคาเฟ่ โฮปปิ้ง',
    icon: '🥐',
    color: 'from-amber-400 to-yellow-400',
    desc: 'ตามล่าคาเฟ่ใหม่ ขนมน่ารัก บรรยากาศสวย เปลี่ยนร้านบ่อยๆ',
  },
  {
    value: 'foodie',
    label: 'สายกินลุย 🔥',
    icon: '🍜',
    color: 'from-orange-500 to-red-500',
    desc: 'ตระเวนกินสตรีทฟู้ดมิชลิน ชุมชนอาหาร ไม่กลัวแดดและแถว',
  },
  {
    value: 'photo',
    label: 'สายถ่ายรูป',
    icon: '📸',
    color: 'from-pink-400 to-rose-500',
    desc: 'หามุมแปลกใหม่ ฟีด IG ต้องสวย เก็บทุก shot ทุกบรรยากาศ',
  },
  {
    value: 'art',
    label: 'สายอาร์ต สตรีท',
    icon: '🎨',
    color: 'from-purple-400 to-violet-500',
    desc: 'ชอบกราฟฟิตี้ งานศิลปะ ย่านเก่า สถาปัตยกรรมมีเรื่องราว',
  },
  {
    value: 'heritage',
    label: 'สายวัฒนธรรม',
    icon: '🏛️',
    color: 'from-stone-400 to-amber-600',
    desc: 'สถานที่ประวัติศาสตร์ อาหารต้นตำรับ เรียนรู้รากเหง้าของย่าน',
  },
  {
    value: 'challenge',
    label: 'สายท้าทาย แหลก',
    icon: '⚡',
    color: 'from-green-400 to-emerald-500',
    desc: 'ลุยทุกอย่างให้หมด มิชชั่นก็ชอบ เช็กอินก็โปร กลับบ้านหมดแรง',
  },
  {
    value: 'night',
    label: 'สายราตรี ไฟสวย',
    icon: '🌙',
    color: 'from-indigo-500 to-purple-600',
    desc: 'ชอบช่วงเย็น-กลางคืน บาร์ดี ดนตรีสด บรรยากาศไฟสวย',
  },
];

const RADIUS_TIERS = [
  { km: 0.5, label: 'เดินเท้าชิลล์ๆ ไม่เมื่อย', icon: '🚶' },
  { km: 1.5, label: 'เดินเพลิน ซอยใกล้เคียง', icon: '🚲' },
  { km: 3.0, label: 'ครอบคลุมทั้งย่าน หรือนั่งวิน', icon: '🛵' },
  { km: 5.0, label: 'ข้ามย่านใกล้เคียง ตุ๊กตุ๊ก/MRT', icon: '🚗' },
  { km: 10.0, label: 'ทั่วมหานคร/เชื่อมรถไฟฟ้า', icon: '🚆' },
  { km: 25.0, label: 'ครอบคลุมทั่วจังหวัด', icon: '🗺️' },
];

function getRadiusTier(km) {
  for (const t of RADIUS_TIERS) {
    if (km <= t.km) return t;
  }
  return RADIUS_TIERS[RADIUS_TIERS.length - 1];
}

function loadUserProfile() {
  try {
    return JSON.parse(localStorage.getItem('daypass_user_auth') || localStorage.getItem('daypass_user_profile') || 'null');
  } catch {
    return null;
  }
}

export default function PlanFormPage() {
  const navigate = useNavigate();
  const userProfile = loadUserProfile();

  // Read quiz-suggested style if available
  const savedQuizStyle = (() => {
    try {
      const r = JSON.parse(localStorage.getItem('daypass_quiz_result') || 'null');
      return r?.style || null;
    } catch {
      return null;
    }
  })();

  // 1. Cascading Location States (Province > Amphoe > District)
  const [selectedProvince, setSelectedProvince] = useState(() => {
    const presetDistrictId = sessionStorage.getItem('daypass_selected_district');
    const matched = DISTRICT_DESTINATIONS.find((d) => d.id === presetDistrictId);
    return matched ? matched.provinceId : 'bangkok';
  });

  const [selectedAmphoe, setSelectedAmphoe] = useState(() => {
    const presetDistrictId = sessionStorage.getItem('daypass_selected_district');
    const matched = DISTRICT_DESTINATIONS.find((d) => d.id === presetDistrictId);
    return matched ? matched.amphoeId : 'samphanthawong';
  });

  const [selectedDistrict, setSelectedDistrict] = useState(() => {
    const savedDistrictId = sessionStorage.getItem('daypass_selected_district');
    const matched = DISTRICT_DESTINATIONS.find((d) => d.id === savedDistrictId);
    return matched || DISTRICT_DESTINATIONS[0];
  });

  // Filtered lists
  const availableAmphoes = getAmphoes(selectedProvince);
  const availableDistrictsInProvince = getDestinations(selectedProvince);

  // 2. Budget State
  const [budget, setBudget] = useState(() => {
    const saved = Number(sessionStorage.getItem('daypass_preset_budget'));
    return BUDGET_OPTIONS.some((o) => o.value === saved) ? saved : 299;
  });
  const [isCustomBudget, setIsCustomBudget] = useState(false);
  const [customBudgetValue, setCustomBudgetValue] = useState('350');

  // 3. Style State
  const [style, setStyle] = useState(() => {
    const presetStyle = sessionStorage.getItem('daypass_preset_style') || savedQuizStyle;
    return TRAVEL_STYLES.some((s) => s.value === presetStyle) ? presetStyle : 'chill';
  });

  // 4. Radius State (Slider)
  const [radiusKm, setRadiusKm] = useState(3.0);

  // 5. Trip Time Range & Hours Calculation
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('18:00');
  const [people, setPeople] = useState(2);

  // GPS & Status States
  const [gpsLoading, setGpsLoading] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto calculate total trip duration
  const { totalHours, totalMinutes, durationText, paceAdvice } = (() => {
    const [sH, sM] = startTime.split(':').map(Number);
    const [eH, eM] = endTime.split(':').map(Number);
    let diff = (eH * 60 + (eM || 0)) - (sH * 60 + (sM || 0));
    if (diff <= 0) diff += 1440; // crosses midnight

    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    const durStr = `${hours} ชม.${minutes > 0 ? ` ${minutes} นาที` : ''}`;

    let advice = 'ทริป 1 วันกำลังดี เดินสบาย ไม่เร่งรีบ (3-4 จุดเด็ด)';
    if (hours < 4) {
      advice = '⚡ ทริปด่วนครึ่งวัน (2-3 จุดกระชับ ไม่เหนื่อย)';
    } else if (hours >= 8 && hours <= 11) {
      advice = '🌟 ทริปจัดเต็มครบวัน (4-5 จุด ได้ทั้งมื้อหลัก คาเฟ่ และวิวเย็น)';
    } else if (hours > 11) {
      advice = '🔥 ทริปมาราธอน เช้าจรดค่ำ รวมไนต์ไลฟ์และอาหารมื้อดึก';
    }

    return { totalHours: hours, totalMinutes: minutes, durationText: durStr, paceAdvice: advice };
  })();

  // Province change handler
  function handleProvinceChange(e) {
    const prov = e.target.value;
    setSelectedProvince(prov);
    const amphoes = getAmphoes(prov);
    if (amphoes.length > 0) {
      setSelectedAmphoe(amphoes[0].id);
    }
    const districts = getDestinations(prov, amphoes[0]?.id);
    if (districts.length > 0) {
      setSelectedDistrict(districts[0]);
      setSelectedAmphoe(districts[0].amphoeId || amphoes[0]?.id || '');
    }
  }

  // Amphoe change handler
  function handleAmphoeChange(e) {
    const amp = e.target.value;
    setSelectedAmphoe(amp);
    const matched = getDestinations(selectedProvince, amp)[0];
    if (matched) {
      setSelectedDistrict(matched);
    }
  }

  // GPS handler using smart detection
  async function handleGetLocation() {
    setGpsLoading(true);
    try {
      const loc = await detectLocationFromGPS();
      setUserCoords({ lat: loc.lat, lng: loc.lng });
      // If the detected province has destinations, select it!
      const provDestinations = getDestinations(loc.province);
      if (provDestinations.length > 0) {
        setSelectedProvince(loc.province);
        const amphoes = getAmphoes(loc.province);
        if (amphoes.length > 0) {
          setSelectedAmphoe(provDestinations[0].amphoeId || amphoes[0].id);
        }
        setSelectedDistrict(provDestinations[0]);
      }
    } catch (err) {
      alert(err.message || 'ไม่สามารถดึงตำแหน่งปัจจุบันได้ ใช้พิกัดศูนย์กลางของย่านแทน');
    } finally {
      setGpsLoading(false);
    }
  }

  // Submit plan generation
  async function handleSubmit() {
    setError('');
    setLoading(true);
    try {
      const activeBudget = isCustomBudget ? (Math.max(100, Number(customBudgetValue) || 299)) : budget;
      const startLat = userCoords ? userCoords.lat : selectedDistrict.lat;
      const startLng = userCoords ? userCoords.lng : selectedDistrict.lng;

      const planRequest = {
        districtId: selectedDistrict.id,
        districtName: selectedDistrict.name,
        provinceId: selectedProvince,
        provinceName: PROVINCES.find((item) => item.id === selectedProvince)?.name || selectedProvince,
        amphoeId: selectedAmphoe,
        budget: activeBudget,
        style,
        radiusKm,
        startLat,
        startLng,
        people,
        startTime,
        endTime,
        durationHours: totalHours,
        deviceId: getDeviceId(),
      };

      sessionStorage.setItem('daypass_plan_request', JSON.stringify(planRequest));
      const result = await generatePlan(planRequest);

      sessionStorage.setItem('daypass_plan', JSON.stringify(result.plan));
      sessionStorage.setItem('daypass_people', String(people));
      navigate('/plan/result');
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาด ลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  }

  const activeBudget = isCustomBudget ? (Number(customBudgetValue) || 299) : budget;
  const totalEstimate = activeBudget * people;
  const selectedStyleData = TRAVEL_STYLES.find((s) => s.value === style) || TRAVEL_STYLES[0];
  const radiusTier = getRadiusTier(radiusKm);

  return (
    <div className="flex-1 flex flex-col py-6 sm:py-10 animate-fade-in">
      <div className="page-container">
        
        {/* Navigation / Header */}
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 shadow-sm active:scale-95 transition-all"
            aria-label="ย้อนกลับ"
          >
            ←
          </button>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">สร้างแผนเที่ยววันเดียวจบ</h1>
            <p className="text-slate-500 text-xs sm:text-sm">เลือกจังหวัด ย่าน งบประมาณ และเวลาเที่ยวที่ต้องการ</p>
          </div>
          {/* Quiz shortcut */}
          <button
            onClick={() => navigate('/quiz')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold hover:bg-purple-100 transition-all shadow-sm"
          >
            🧭 ทำควิซหาสไตล์
          </button>
        </div>

        {/* Home Base Notice */}
        {userProfile && (
          <div className="mb-5 p-3 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-between gap-3 text-xs text-sky-900">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏠</span>
              <span>
                ตำแหน่งบ้านของคุณ: <strong>{userProfile.tambon || ''} {PROVINCES.find((p) => p.id === userProfile.province)?.name || userProfile.province}</strong>
              </span>
            </div>
            <span className="text-[11px] text-sky-600 bg-white px-2.5 py-1 rounded-lg border border-sky-200 font-bold hidden sm:inline-block">
              ✓ คุณสามารถเลือกเที่ยวจังหวัดหรือย่านอื่นได้อิสระ
            </span>
          </div>
        )}

        {/* 2-Column Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* Left Form Controls */}
          <div className="lg:col-span-7 flex flex-col gap-6">

            {/* 1. เลือกย่านแบบเลือก จังหวัด > อำเภอ/เขต > ตำบล/ย่าน */}
            <div className="glass-card bg-white border-brand-200">
              <div className="flex items-center justify-between mb-3">
                <p className="section-title mb-0">
                  <span>📍</span>
                  <span>เลือกจุดหมายปลายทาง</span>
                </p>
                <span className="text-xs text-brand-600 font-bold bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                  ทั่วไทย
                </span>
              </div>

              {/* Step A: Select Province, Amphoe, Tambon */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 mb-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">1. เลือกจังหวัด</label>
                  <select
                    id="plan-select-province"
                    value={selectedProvince}
                    onChange={handleProvinceChange}
                    className="input-field py-2 text-xs font-semibold bg-white"
                  >
                    {REGIONS.map((region) => {
                      const provInRegion = PROVINCES.filter((p) => p.region === region.id);
                      return (
                        <optgroup key={region.id} label={`── ${region.name} (${provInRegion.length} จังหวัด) ──`}>
                          {provInRegion.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.emoji} {p.name}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">2. เลือกอำเภอ / เขต</label>
                  <select
                    id="plan-select-amphoe"
                    value={selectedAmphoe}
                    onChange={handleAmphoeChange}
                    className="input-field py-2 text-xs font-semibold bg-white"
                  >
                    {availableAmphoes.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">3. ย่านในอำเภอนี้</label>
                  <select
                    id="plan-select-district-in-amphoe"
                    value={selectedDistrict.id}
                    onChange={(e) => {
                      const matched = DISTRICT_DESTINATIONS.find((d) => d.id === e.target.value);
                      if (matched) setSelectedDistrict(matched);
                    }}
                    className="input-field py-2 text-xs font-semibold bg-white"
                  >
                    {availableDistrictsInProvince.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.coverEmoji} {d.name.split(' - ')[0]} ({d.tambonName || ''})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Step B: Quick Select Popular Districts Grid */}
              <label className="text-xs font-bold text-slate-600 mb-2 block flex items-center justify-between">
                <span>ย่านท่องเที่ยวยอดนิยมใน {PROVINCES.find((p) => p.id === selectedProvince)?.name}</span>
                <span className="text-[11px] text-slate-400 font-normal">แตะเพื่อเลือกทันที</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {availableDistrictsInProvince.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      setSelectedDistrict(d);
                      setSelectedAmphoe(d.amphoeId);
                    }}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all duration-150 ${
                      selectedDistrict.id === d.id
                        ? 'bg-brand-50 border-brand-500 text-brand-900 shadow-md shadow-brand-500/15 ring-2 ring-brand-500/25'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-2xl">{d.coverEmoji}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                          {d.tambonName || 'ย่านเด็ด'}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-xs sm:text-sm leading-tight text-slate-900">
                        {d.name.split(' - ')[0]}
                      </h4>
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                        {d.highlight}
                      </p>
                    </div>
                    <div className="text-[11px] text-brand-600 font-bold mt-2">
                      งบ ~{d.avgCost} ฿/คน
                    </div>
                  </button>
                ))}
              </div>

              {/* GPS Button */}
              <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-600">
                  ย่านที่เลือก: <strong className="text-slate-900">{selectedDistrict.name}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="text-brand-600 hover:underline flex items-center gap-1 font-bold"
                >
                  {gpsLoading ? '⟳ กำลังค้นหา GPS...' : '📍 ใช้ GPS ปัจจุบัน'}
                </button>
              </div>

              {userCoords && (
                <p className="mt-2 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <span>✓ ตรวจพบพิกัด GPS: {userCoords.lat.toFixed(4)}, {userCoords.lng.toFixed(4)}</span>
                  <button onClick={() => setUserCoords(null)} className="text-rose-500 hover:underline text-xs">ยกเลิก</button>
                </p>
              )}
            </div>

            {/* 2. งบประมาณต่อคน — หลากหลายตัวเลือก + กำหนดเอง */}
            <div className="glass-card bg-white">
              <div className="flex justify-between items-center mb-3">
                <p className="section-title mb-0">
                  <span>💰</span>
                  <span>งบประมาณต่อคน</span>
                </p>
                <span className="badge bg-brand-50 text-brand-700 border border-brand-200 font-extrabold text-xs">
                  {activeBudget} บาท/คน
                </span>
              </div>

              {/* Preset buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                {BUDGET_OPTIONS.map((b) => {
                  const isSelected = !isCustomBudget && budget === b.value;
                  return (
                    <button
                      key={b.value}
                      id={`budget-${b.value}`}
                      type="button"
                      onClick={() => {
                        setBudget(b.value);
                        setIsCustomBudget(false);
                      }}
                      className={`rounded-2xl p-2.5 flex flex-col items-center justify-center transition-all duration-150 border ${
                        isSelected
                          ? 'bg-brand-50 border-brand-500 text-brand-900 ring-2 ring-brand-500/25 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">{b.badge}</span>
                      <span className="font-extrabold text-base text-slate-900">{b.label} ฿</span>
                      <span className="text-[10px] text-slate-500">{b.sub}</span>
                    </button>
                  );
                })}

                {/* Custom Budget Button */}
                <button
                  type="button"
                  onClick={() => setIsCustomBudget(true)}
                  className={`rounded-2xl p-2.5 flex flex-col items-center justify-center transition-all duration-150 border ${
                    isCustomBudget
                      ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/25 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">กำหนดเอง</span>
                  <span className="font-extrabold text-base text-slate-900">ระบุงบ</span>
                  <span className="text-[10px] text-slate-500">พิมพ์ตัวเลข</span>
                </button>
              </div>

              {/* Custom Budget Input if active */}
              {isCustomBudget && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-center gap-3 animate-fade-in">
                  <label className="text-xs font-bold text-amber-900 whitespace-nowrap">พิมพ์งบที่คุณต้องการ:</label>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min={100}
                      max={5000}
                      step={50}
                      value={customBudgetValue}
                      onChange={(e) => setCustomBudgetValue(e.target.value)}
                      className="input-field py-1.5 px-3 text-sm font-bold text-slate-900"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">บาท/คน</span>
                  </div>
                </div>
              )}
            </div>

            {/* 3. สไตล์การเที่ยว — พร้อมตัวเลือกทำควิซเพิ่มเติม */}
            <div className="glass-card bg-white">
              <div className="flex items-center justify-between mb-3">
                <p className="section-title mb-0">
                  <span>🎨</span>
                  <span>สไตล์การเที่ยว</span>
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/quiz')}
                  className="text-xs text-purple-700 font-bold bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1 rounded-full transition-all flex items-center gap-1 shadow-sm"
                >
                  <span>🧭</span>
                  <span>ไม่รู้สไตล์ไหน? ทำควิซ (+20 แต้ม)</span>
                </button>
              </div>

              {/* Quiz recommendation alert if user has taken quiz */}
              {savedQuizStyle && (
                <div className="mb-3.5 p-3 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-purple-900">
                    <span className="text-xl">✨</span>
                    <span>
                      ผลควิซวิเคราะห์ว่าคุณคือ <strong>{TRAVEL_STYLES.find((s) => s.value === savedQuizStyle)?.label}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStyle(savedQuizStyle)}
                    className={`font-bold px-3 py-1 rounded-xl transition-all ${
                      style === savedQuizStyle
                        ? 'bg-purple-600 text-white'
                        : 'bg-white border border-purple-300 text-purple-700 hover:bg-purple-100'
                    }`}
                  >
                    {style === savedQuizStyle ? '✓ ใช้อยู่' : 'เลือกสไตล์นี้'}
                  </button>
                </div>
              )}

              {/* Styles Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {TRAVEL_STYLES.map((s) => (
                  <button
                    key={s.value}
                    id={`style-${s.value}`}
                    type="button"
                    onClick={() => setStyle(s.value)}
                    className={`rounded-2xl p-3 text-center border transition-all duration-150 flex flex-col items-center gap-1 ${
                      style === s.value
                        ? 'bg-brand-50 border-brand-500 ring-2 ring-brand-500/25 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span className={`text-2xl p-2 rounded-xl shadow-sm border border-white/60 bg-gradient-to-br ${s.color} text-white`}>
                      {s.icon}
                    </span>
                    <span className={`font-bold text-[11px] sm:text-xs leading-tight text-center ${style === s.value ? 'text-brand-700' : 'text-slate-800'}`}>
                      {s.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Description */}
              <p className="mt-3 text-xs text-slate-600 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100 leading-relaxed">
                <strong className="text-slate-900">{selectedStyleData.icon} {selectedStyleData.label}:</strong>{' '}
                {selectedStyleData.desc}
              </p>
            </div>

            {/* 4. รัศมีการเดินทาง — เส้นเลื่อนเด่นชัดสะดุดตา */}
            <div className="glass-card bg-gradient-to-br from-white via-orange-50/30 to-amber-50/40 border-orange-200 shadow-md">
              <div className="flex justify-between items-center mb-3">
                <p className="section-title mb-0">
                  <span>🚶</span>
                  <span>รัศมีการเดินทาง</span>
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-base">{radiusTier.icon}</span>
                  <span className="text-brand-700 font-extrabold text-sm bg-white px-3 py-1 rounded-full border border-orange-200 shadow-sm">
                    {radiusKm} กม.
                  </span>
                </div>
              </div>

              {/* Status explanation pill */}
              <div className="p-3 bg-white rounded-2xl border border-orange-200/80 mb-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <span className="text-lg">{radiusTier.icon}</span>
                  <span>ระดับระยะทาง: {radiusTier.label}</span>
                </div>
                <span className="text-[11px] font-semibold text-brand-600">รัศมี ~{radiusKm} กม.</span>
              </div>

              {/* PROMINENT SLIDER */}
              <div className="py-2 px-1">
                <div className="relative flex items-center">
                  <input
                    id="slider-radius"
                    type="range"
                    min={0.5}
                    max={25}
                    step={0.5}
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    className="w-full h-3.5 bg-gradient-to-r from-emerald-400 via-amber-400 to-brand-500 rounded-full appearance-none cursor-pointer shadow-inner accent-brand-600"
                  />
                </div>
              </div>

              {/* Quick Select Buttons */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mt-3 pt-3 border-t border-orange-100">
                {[0.5, 1.5, 3.0, 5.0, 10.0, 20.0].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setRadiusKm(val)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                      radiusKm === val
                        ? 'bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/20'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {val < 1 ? '500 ม.' : `${val} กม.`}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. เวลาเริ่มทริป - จบทริป & คำนวณชั่วโมงรวม */}
            <div className="glass-card bg-white border-slate-200">
              <div className="flex justify-between items-center mb-3">
                <p className="section-title mb-0">
                  <span>⏱️</span>
                  <span>ช่วงเวลาเที่ยว & คำนวณชั่วโมง</span>
                </p>
                <span className="badge bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold text-xs">
                  รวม {durationText}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                {/* เวลาเริ่มทริป */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <span>⏰</span> เวลาเริ่มทริป
                  </label>
                  <input
                    id="input-start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="input-field text-center text-lg font-extrabold bg-white"
                  />
                </div>

                {/* เวลาจบทริป */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <span>🏁</span> เวลาจบทริป
                  </label>
                  <input
                    id="input-end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="input-field text-center text-lg font-extrabold bg-white"
                  />
                </div>
              </div>

              {/* Total hours advice box */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-sm">
                  ⏳
                </div>
                <div>
                  <div className="text-xs font-extrabold text-emerald-950">
                    รวมเวลาท่องเที่ยว: {durationText}
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-0.5 leading-snug">
                    {paceAdvice}
                  </div>
                </div>
              </div>

              {/* จำนวนคน */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800">👥 จำนวนคนร่วมทริป</span>
                  <span className="text-[11px] text-slate-400 block">ออกพาสใบเดียวรองรับทั้งกลุ่ม</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    id="btn-people-minus"
                    type="button"
                    onClick={() => setPeople((p) => Math.max(1, p - 1))}
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-lg font-bold flex items-center justify-center active:scale-95 transition-all shadow-sm"
                  >
                    −
                  </button>
                  <span className="font-extrabold text-xl text-slate-900 w-8 text-center">{people}</span>
                  <button
                    id="btn-people-plus"
                    type="button"
                    onClick={() => setPeople((p) => Math.min(10, p + 1))}
                    className="w-9 h-9 rounded-xl bg-brand-50 hover:bg-brand-100 border border-brand-300 text-brand-700 text-lg font-bold flex items-center justify-center active:scale-95 transition-all shadow-sm"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="glass-card border-rose-200 bg-rose-50 text-rose-700 text-sm text-center py-3 font-medium">
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* Right Summary & Submit Column */}
          <div className="lg:col-span-5 flex flex-col gap-5 sticky top-24">
            
            {/* Live Trip Preview Card */}
            <div className="glass-card bg-white border-brand-200 shadow-xl overflow-hidden p-0">
              <div className="bg-gradient-to-r from-brand-500 via-amber-500 to-orange-500 p-5 text-white">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-extrabold tracking-wider uppercase mb-1">
                  สรุปรายละเอียดทริป
                </span>
                <h3 className="text-xl font-extrabold">OneDaypass Plan Summary</h3>
                <p className="text-xs text-orange-100 mt-0.5">จัดแผนอัตโนมัติพร้อมคูปองและพิกัดแผนที่</p>
              </div>

              <div className="p-5 space-y-3.5 text-xs text-slate-700">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">จังหวัด & ย่าน</span>
                  <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1">
                    <span>{selectedDistrict.coverEmoji}</span>
                    <span>{selectedDistrict.name}</span>
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">สไตล์การเที่ยว</span>
                  <span className="font-bold text-slate-900">{selectedStyleData.icon} {selectedStyleData.label}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">รัศมีเดินทาง</span>
                  <span className="font-bold text-slate-900">{radiusTier.icon} {radiusKm} กม. ({radiusTier.label})</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">เวลาเที่ยว</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {startTime} - {endTime} ({durationText})
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">งบประมาณต่อคน</span>
                  <span className="font-extrabold text-brand-600 text-sm">{activeBudget} บาท/คน</span>
                </div>

                <div className="flex justify-between items-center py-2 bg-slate-50 px-3 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-700">ประมาณการทั้งกลุ่ม ({people} คน)</span>
                  <span className="font-extrabold text-lg text-brand-600 font-mono">
                    ~{totalEstimate.toLocaleString()} บาท
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  id="btn-submit-plan"
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn-primary w-full py-4 text-base font-bold shadow-xl shadow-brand-500/30 flex items-center justify-center gap-2 mt-4"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin text-lg">⟳</span>
                      <span>น้องพาสกำลังจัดแผนเที่ยว...</span>
                    </>
                  ) : (
                    <>
                      <span>✨ สร้างแผน & ดูตัวเลือกพาส</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Mascot Mini Tips */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-amber-50 border border-orange-200 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-white shadow-sm flex-shrink-0 bg-sky-100">
                <img src="/mascot/nong-pass-wave.jpg" alt="น้องพาส" className="w-full h-full object-cover" />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "น้องพาสจะคัดเลือกร้านเด็ด คูปองลับ และคำนวณเส้นทางให้พอดีกับงบและเวลาที่คุณเลือกเลยครับ!"
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
