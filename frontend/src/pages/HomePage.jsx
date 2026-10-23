import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Coffee,
  Flame,
  Users,
  Clock,
  Navigation,
  Sparkles,
  ChevronRight,
  MapPin,
  Check,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { fetchShops, generatePlan } from '../api';
import LeafletMap from '../components/LeafletMap';

export default function HomePage({ onPlanGenerated }) {
  const navigate = useNavigate();

  // Generator inputs
  const [budget, setBudget] = useState(500);
  const [style, setStyle] = useState('chill'); // 'chill' | 'challenge'
  const [radiusKm, setRadiusKm] = useState(2);
  const [people, setPeople] = useState(2);
  const [startTime, setStartTime] = useState('10:00');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shops, setShops] = useState([]);
  const [showMap, setShowMap] = useState(false);

  // Load shops for highlight preview
  useEffect(() => {
    fetchShops(13.7335, 100.5126, radiusKm)
      .then((data) => setShops(data.shops || []))
      .catch((err) => console.error('Failed to load shops', err));
  }, [radiusKm]);

  // Quick Preset Handlers
  const applyPreset = (presetBudget, presetStyle, presetRadius, presetPeople) => {
    setBudget(presetBudget);
    setStyle(presetStyle);
    setRadiusKm(presetRadius);
    setPeople(presetPeople);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await generatePlan({
        budget,
        style,
        radiusKm,
        startLat: 13.7335,
        startLng: 100.5126,
        people,
        startTime
      });

      if (res && res.plan) {
        onPlanGenerated(res.plan, people);
        navigate('/plan');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'ไม่สามารถสร้างแผนได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-28 max-w-md mx-auto px-4 pt-4 space-y-5 animate-fade-in">
      {/* Hero Banner */}
      <div className="relative rounded-3xl p-5 overflow-hidden border border-indigo-500/20 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 shadow-xl">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-36 h-36 bg-indigo-500/15 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-6 -mb-6 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl"></div>

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[11px] font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>พาสเที่ยว 1 ย่าน ใน 1 วัน</span>
          </div>

          <h1 className="text-2xl font-extrabold text-white tracking-tight leading-snug">
            เที่ยวตลาดน้อยแบบโปร <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-300 to-pink-400 bg-clip-text text-transparent">
              แผนเป๊ะ คูปองแน่น แต้มแลกได้จริง
            </span>
          </h1>

          <p className="text-xs text-slate-300 leading-relaxed pt-1">
            เลือกงบและสไตล์ ระบบจัดแผนเที่ยวเรียงเวลาจริง พร้อมคูปองอาหารร้านดัง 2-3 ร้าน เช็กอินทำมิชชั่นรับแต้มลดพาสถัดไป
          </p>

          <div className="pt-2 flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> เริ่มต้น ฿199
            </span>
            <span className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-amber-400" /> ฟรีคูปองร้านเด็ด
            </span>
          </div>
        </div>
      </div>

      {/* Quick Demo Presets */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold uppercase tracking-wider text-[11px]">ทางลัดแผนยอดนิยม (Quick Presets)</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => applyPreset(450, 'chill', 2, 2)}
            className={`p-2.5 rounded-2xl text-left border transition-all ${
              style === 'chill' && budget === 450
                ? 'bg-indigo-600/20 border-indigo-500 text-white'
                : 'glass-card border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="text-base mb-1">☕</div>
            <div className="text-xs font-bold truncate">สโลว์ไลฟ์</div>
            <div className="text-[10px] text-slate-400">฿450 • ชิลริมน้ำ</div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset(350, 'challenge', 3, 1)}
            className={`p-2.5 rounded-2xl text-left border transition-all ${
              style === 'challenge' && budget === 350
                ? 'bg-amber-500/20 border-amber-500 text-white'
                : 'glass-card border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="text-base mb-1">🏃</div>
            <div className="text-xs font-bold truncate">สายลุยล่าแต้ม</div>
            <div className="text-[10px] text-slate-400">฿350 • ตรอกลับ</div>
          </button>

          <button
            type="button"
            onClick={() => applyPreset(700, 'chill', 2, 2)}
            className={`p-2.5 rounded-2xl text-left border transition-all ${
              budget === 700
                ? 'bg-pink-600/20 border-pink-500 text-white'
                : 'glass-card border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="text-base mb-1">💑</div>
            <div className="text-xs font-bold truncate">เดทคู่รัก</div>
            <div className="text-[10px] text-slate-400">฿700 • อิ่มครบ</div>
          </button>
        </div>
      </div>

      {/* Main Form: Plan Customizer */}
      <form onSubmit={handleGenerate} className="glass-panel rounded-3xl p-5 border border-slate-700/80 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-base text-white">ปรับแต่งแผนเที่ยวของคุณ</h2>
          </div>
          <span className="text-xs text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
            ย่านตลาดน้อย
          </span>
        </div>

        {/* 1. Style Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>สไตล์การเที่ยว</span>
            <span className="text-indigo-400 text-[11px]">
              {style === 'chill' ? 'เน้นนั่งสบาย คาเฟ่ วิวแม่น้ำ' : 'เน้นเดินสำรวจ สตรีตอาร์ต มิชชั่นท้าทาย'}
            </span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setStyle('chill')}
              className={`py-2.5 px-3 rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 border transition-all ${
                style === 'chill'
                  ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Coffee className="w-4 h-4" />
              <span>สายชิล (Chill)</span>
            </button>

            <button
              type="button"
              onClick={() => setStyle('challenge')}
              className={`py-2.5 px-3 rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 border transition-all ${
                style === 'challenge'
                  ? 'bg-amber-600 border-amber-400 text-white shadow-lg shadow-amber-600/30'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>สายลุย (Challenge)</span>
            </button>
          </div>
        </div>

        {/* 2. Budget Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">งบประมาณเที่ยว / คน</span>
            <span className="text-amber-400 font-bold text-sm">฿{budget} บาท</span>
          </div>
          <input
            type="range"
            min="200"
            max="900"
            step="50"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>ประหยัด ฿200</span>
            <span>พอดีๆ ฿500</span>
            <span>จัดเต็ม ฿900</span>
          </div>
        </div>

        {/* 3. Distance Radius Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">ระยะทางรัศมีเดินเที่ยว</span>
            <span className="text-indigo-400 font-bold text-sm">{radiusKm} กม.</span>
          </div>
          <input
            type="range"
            min="1"
            max="4"
            step="0.5"
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>ใกล้ๆ 1 กม.</span>
            <span>รอบย่าน 2-3 กม.</span>
            <span>ข้ามโซน 4 กม.</span>
          </div>
        </div>

        {/* 4. People count & Start Time */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>จำนวนคน</span>
            </label>
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl p-1">
              <button
                type="button"
                onClick={() => setPeople(Math.max(1, people - 1))}
                className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold text-sm flex items-center justify-center"
              >
                -
              </button>
              <span className="flex-1 text-center font-bold text-white text-sm">
                {people} คน
              </span>
              <button
                type="button"
                onClick={() => setPeople(Math.min(6, people + 1))}
                className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold text-sm flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>เริ่มเที่ยวเวลา</span>
            </label>
            <select
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-3 py-2 text-sm font-semibold text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="09:00">09:00 น.</option>
              <option value="10:00">10:00 น.</option>
              <option value="11:00">11:00 น.</option>
              <option value="13:00">13:00 น.</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Submit CTA Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-101 active:scale-99 disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>กำลังคำนวณแผนเที่ยวที่คุ้มที่สุด...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>สร้างแผนเที่ยววันนี้ทันที</span>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Map Preview Toggle & Talat Noi Shops */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-sm text-white">ร้านเด็ดในตลาดน้อย ({shops.length} ร้าน)</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            {showMap ? 'ซ่อนแผนที่' : 'ดูบนแผนที่'}
          </button>
        </div>

        {showMap && (
          <div className="animate-fade-in">
            <LeafletMap shops={shops} radiusKm={radiusKm} height="260px" />
          </div>
        )}

        {/* Horizontal Mini Shop Cards */}
        <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar">
          {shops.slice(0, 8).map((shop) => (
            <div
              key={shop.id}
              className="w-48 shrink-0 glass-card rounded-2xl p-3 border border-slate-800 space-y-1.5"
            >
              <div className="flex items-center justify-between text-[10px]">
                <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">
                  {shop.category}
                </span>
                <span className="text-amber-400 font-bold">฿{shop.avgPrice}</span>
              </div>
              <h4 className="font-bold text-xs text-white truncate">{shop.name}</h4>
              <p className="text-[11px] text-slate-400 truncate">{shop.recommendedMenu}</p>
              {shop.coupon && (
                <div className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded truncate font-medium">
                  🎟️ {shop.coupon.title}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
