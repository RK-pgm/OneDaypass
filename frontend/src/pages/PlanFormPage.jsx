import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generatePlan, getDeviceId, DISTRICTS, USE_MOCK } from '../api';

const BUDGET_OPTIONS = [
  { value: 199, label: '199', sub: 'ประหยัด', badge: 'คุ้มค่า' },
  { value: 299, label: '299', sub: 'พอดี', badge: 'ยอดฮิต' },
  { value: 399, label: '399', sub: 'สบายๆ', badge: 'จัดเต็ม' },
  { value: 500, label: '500+', sub: 'หรูหน่อย', badge: 'พรีเมียม' },
];

const RADIUS_LABELS = [
  { max: 1, label: 'เดินเท้าชิลๆ' },
  { max: 3, label: 'ขี่จักรยาน / มอเตอร์ไซค์' },
  { max: 7, label: 'ขับรถ / แท็กซี่ไม่ไกล' },
  { max: 15, label: 'ครอบคลุมทั้งย่าน' },
  { max: 30, label: 'ทั่วเมืองกรุงเทพฯ' },
  { max: 50, label: 'ออกนอกเมือง' },
];

function getRadiusLabel(km) {
  for (const r of RADIUS_LABELS) {
    if (km <= r.max) return r.label;
  }
  return 'ออกนอกเมือง';
}

export default function PlanFormPage() {
  const navigate = useNavigate();
  const availableDistricts = USE_MOCK ? DISTRICTS : DISTRICTS.filter((district) => district.id === 'taladnoi');

  const [selectedDistrict, setSelectedDistrict] = useState(() => {
    const savedDistrictId = sessionStorage.getItem('daypass_selected_district');
    return availableDistricts.find((district) => district.id === savedDistrictId) || availableDistricts[0];
  });
  const [budget, setBudget] = useState(() => {
    const savedBudget = Number(sessionStorage.getItem('daypass_preset_budget'));
    return BUDGET_OPTIONS.some((option) => option.value === savedBudget) ? savedBudget : 299;
  });
  const [style, setStyle] = useState('chill');
  const [radiusKm, setRadiusKm] = useState(5);
  const [people, setPeople] = useState(2);
  const [startTime, setStartTime] = useState('10:00');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleGetLocation() {
    if (!navigator.geolocation) {
      alert('เบราว์เซอร์ไม่รองรับ GPS');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGpsLoading(false);
      },
      () => {
        setGpsLoading(false);
        alert('ไม่สามารถดึงตำแหน่งปัจจุบันได้ ใช้พิกัดศูนย์กลางของย่านแทน');
      },
      { timeout: 8000 }
    );
  }

  async function handleSubmit() {
    setError('');
    setLoading(true);
    try {
      const startLat = userCoords ? userCoords.lat : selectedDistrict.lat;
      const startLng = userCoords ? userCoords.lng : selectedDistrict.lng;

      const planRequest = {
        districtId: selectedDistrict.id,
        budget,
        style,
        radiusKm,
        startLat,
        startLng,
        people,
        startTime,
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

  const totalEstimate = budget * people;

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
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">สร้างแผนเที่ยวของคุณ</h1>
            <p className="text-slate-500 text-xs sm:text-sm">ปรับแต่งงบ สไตล์ และเส้นทางที่ต้องการ</p>
          </div>
        </div>

        {/* 2-Column Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* Left Form Controls */}
          <div className="lg:col-span-7 flex flex-col gap-6">

            {/* 1. เลือกย่าน */}
            <div className="glass-card bg-white">
              <p className="section-title">
                <span>📍</span>
                <span>เลือกย่านที่อยากไป</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {availableDistricts.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedDistrict(d)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all duration-150 ${
                      selectedDistrict.id === d.id
                        ? 'bg-brand-50 border-brand-500 text-brand-900 shadow-md shadow-brand-500/10 ring-2 ring-brand-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-2xl mb-1">{d.coverEmoji}</span>
                    <span className="font-bold text-xs sm:text-sm leading-tight">{d.name.split(' - ')[0]}</span>
                    <span className="text-[10px] text-brand-600 font-semibold mt-1">{d.stopsCount} จุดเด่น</span>
                  </button>
                ))}
              </div>
              <p className="text-slate-500 text-xs mt-3 flex items-center justify-between">
                <span>ย่านที่เลือก: <strong className="text-slate-900">{selectedDistrict.name}</strong></span>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="text-brand-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  {gpsLoading ? '⟳ กำลังค้นหา GPS...' : '📍 ใช้พิกัดฉัน'}
                </button>
              </p>
            </div>

            {/* 2. งบต่อคน */}
            <div className="glass-card bg-white">
              <div className="flex justify-between items-center mb-3">
                <p className="section-title mb-0">
                  <span>💰</span>
                  <span>งบประมาณต่อคน</span>
                </p>
                <span className="badge bg-brand-50 text-brand-700 border border-brand-200 font-bold">{budget} บาท</span>
              </div>
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {BUDGET_OPTIONS.map((b) => (
                  <button
                    key={b.value}
                    id={`budget-${b.value}`}
                    type="button"
                    onClick={() => setBudget(b.value)}
                    className={`rounded-2xl py-3 px-2 flex flex-col items-center justify-center transition-all duration-150 border relative ${
                      budget === b.value
                        ? 'bg-brand-50 border-brand-500 text-brand-800 ring-2 ring-brand-500/20 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">{b.badge}</span>
                    <span className="font-extrabold text-base sm:text-lg text-slate-900">{b.label}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">{b.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. สไตล์การเที่ยว */}
            <div className="glass-card bg-white">
              <p className="section-title">
                <span>🎨</span>
                <span>สไตล์การเที่ยว</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    value: 'chill',
                    label: 'สายชิล สบายๆ',
                    icon: '☕',
                    desc: 'เน้นคาเฟ่นั่งคุย ถ่ายรูปชิคๆ บรรยากาศผ่อนคลาย ไม่เร่งรีบ',
                  },
                  {
                    value: 'challenge',
                    label: 'สายกินลุย แหลกท้าทาย',
                    icon: '⚡',
                    desc: 'ตระเวนสตรีทฟู้ดมิชลิน เก็บแต้มมิชชั่น ถ่ายรูปมุมฮิตสุดขอบย่าน',
                  },
                ].map((s) => (
                  <button
                    key={s.value}
                    id={`style-${s.value}`}
                    type="button"
                    onClick={() => setStyle(s.value)}
                    className={`rounded-2xl p-4 text-left flex items-start gap-3 border transition-all duration-150 ${
                      style === s.value
                        ? 'bg-brand-50 border-brand-500 ring-2 ring-brand-500/20 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-3xl p-2 rounded-xl bg-white shadow-sm border border-slate-200/60">{s.icon}</span>
                    <div>
                      <span className={`font-bold text-sm sm:text-base block ${style === s.value ? 'text-brand-700' : 'text-slate-900'}`}>
                        {s.label}
                      </span>
                      <span className="text-slate-500 text-xs mt-1 block leading-relaxed">{s.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. ระยะรัศมี */}
            <div className="glass-card bg-white">
              <div className="flex justify-between items-baseline mb-3">
                <p className="section-title mb-0">
                  <span>🚶</span>
                  <span>รัศมีการเดินทาง</span>
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{getRadiusLabel(radiusKm)}</span>
                  <span className="text-brand-700 font-bold text-sm bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200">
                    {radiusKm} กม.
                  </span>
                </div>
              </div>
              <input
                id="slider-radius"
                type="range"
                min={1}
                max={50}
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-slate-400 text-xs mt-3 font-mono font-medium">
                <span>1 กม. (เดินเท้า)</span>
                <span>15 กม. (ขี่รถ)</span>
                <span>50 กม. (ทั้งเมือง)</span>
              </div>
            </div>

            {/* 5. จำนวนคน & เวลาเริ่มต้น */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* จำนวนคน */}
              <div className="glass-card bg-white">
                <p className="section-title">
                  <span>👥</span>
                  <span>จำนวนคน</span>
                </p>
                <div className="flex items-center gap-4 justify-center py-2">
                  <button
                    id="btn-people-minus"
                    type="button"
                    onClick={() => setPeople((p) => Math.max(1, p - 1))}
                    className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xl font-bold flex items-center justify-center active:scale-95 transition-all shadow-sm"
                  >
                    −
                  </button>
                  <div className="text-center w-16">
                    <span className="text-slate-900 font-extrabold text-3xl">{people}</span>
                    <span className="text-[10px] text-slate-400 font-semibold block">คน</span>
                  </div>
                  <button
                    id="btn-people-plus"
                    type="button"
                    onClick={() => setPeople((p) => Math.min(10, p + 1))}
                    className="w-11 h-11 rounded-xl bg-brand-50 hover:bg-brand-100 border border-brand-300 text-brand-700 text-xl font-bold flex items-center justify-center active:scale-95 transition-all shadow-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* เวลาเริ่มต้น */}
              <div className="glass-card bg-white">
                <p className="section-title">
                  <span>🕙</span>
                  <span>เวลาเริ่มทริป</span>
                </p>
                <div className="py-2">
                  <input
                    id="input-start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="input-field text-center text-xl font-bold"
                  />
                </div>
              </div>

            </div>

            {error && (
              <div className="glass-card border-rose-200 bg-rose-50 text-rose-700 text-sm text-center py-3 font-medium">
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* Right Sticky Summary Panel */}
          <div className="lg:col-span-5 sticky top-24">
            <div className="glass-card border-brand-200 shadow-xl shadow-brand-500/10 bg-white">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedDistrict.coverEmoji}</span>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base leading-tight">{selectedDistrict.name}</h3>
                    <p className="text-[11px] text-slate-500">{selectedDistrict.tag}</p>
                  </div>
                </div>
                <span className="badge bg-brand-50 text-brand-700 border border-brand-200 text-xs font-bold">
                  {style === 'chill' ? '☕ ชิลๆ' : '⚡ ท้าทาย'}
                </span>
              </div>

              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">จุดแวะในแผน</span>
                  <span className="text-slate-900 font-bold">4 จุด (อาหาร คาเฟ่ ถ่ายรูป)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">คูปองที่แถมให้</span>
                  <span className="text-emerald-600 font-bold">3 ใบพร้อมใช้</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">มิชชั่นถ่ายรูป</span>
                  <span className="text-purple-600 font-bold">สะสมแต้มสูงสุด +25 แต้ม</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">งบต่อคน</span>
                  <span className="text-slate-900 font-bold">{budget.toLocaleString()} บาท</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">จำนวนผู้เดินทาง</span>
                  <span className="text-slate-900 font-bold">{people} คน</span>
                </div>
              </div>

              {/* Total Summary */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500">ยอดรวมประมาณการ</span>
                  <p className="text-3xl font-extrabold text-brand-600 font-mono">
                    ~{totalEstimate.toLocaleString()} <span className="text-xs font-normal text-slate-500">บาท</span>
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 text-right">
                  เริ่มต้นเวลา {startTime} น.
                </span>
              </div>

              {/* Submit CTA button inside sticky card */}
              <div className="mt-5">
                <button
                  id="btn-generate-plan"
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn-primary flex items-center justify-center gap-2 py-4 text-base font-bold"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin text-xl">⟳</span>
                      <span>กำลังจัดทำแผนเที่ยวสุดพิเศษ...</span>
                    </>
                  ) : (
                    <>
                      <span>✨ สร้างแผนเที่ยวทันที</span>
                      <span>→</span>
                    </>
                  )}
                </button>
                <p className="text-center text-slate-400 text-[11px] mt-2">
                  ฟรี ไม่มีข้อผูกมัด สามารถปรับแก้ได้ตลอดเวลา
                </p>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Mobile Fixed CTA for easy thumb reach on small screens */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 px-4 pb-6 pt-3 border-t border-slate-200 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-2 text-xs">
          <span className="text-slate-600">ยอดรวม {people} คน:</span>
          <span className="text-brand-600 font-extrabold font-mono text-base">~{totalEstimate.toLocaleString()} บาท</span>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="btn-primary py-3.5 text-base font-bold flex items-center justify-center gap-2"
        >
          {loading ? '⟳ กำลังสร้างแผน...' : '✨ สร้างแผนเที่ยว →'}
        </button>
      </div>
    </div>
  );
}
