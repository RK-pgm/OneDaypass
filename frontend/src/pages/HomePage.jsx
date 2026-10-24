import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DISTRICTS } from '../api';

// ────────────────────────────────────────────────────
// Data
// ────────────────────────────────────────────────────
const STYLE_PILLS = [
  { icon: '☕', label: 'สายชิล', color: '#3b82f6' },
  { icon: '🍜', label: 'สายกินลุย', color: '#f97316' },
  { icon: '📸', label: 'สายถ่ายรูป', color: '#ec4899' },
  { icon: '🎨', label: 'สายอาร์ต', color: '#8b5cf6' },
  { icon: '🥐', label: 'สายคาเฟ่', color: '#f59e0b' },
  { icon: '🌙', label: 'สายราตรี', color: '#6366f1' },
  { icon: '🏛️', label: 'สายวัฒนธรรม', color: '#78716c' },
  { icon: '⚡', label: 'สายท้าทาย', color: '#10b981' },
];

const HOW_IT_WORKS = [
  {
    step: '01', icon: '📍', title: 'เลือกย่านและจังหวัด',
    desc: 'เลือกจังหวัด อำเภอ และตำบลที่อยากไป ระบบมีทั่วไทย',
    color: '#f97316',
  },
  {
    step: '02', icon: '✨', title: 'ตั้งงบ สไตล์ เวลา',
    desc: 'ระบุงบต่อคน เลือกสไตล์ทริป กำหนดเวลาเริ่ม-จบ ระบบคำนวณให้อัตโนมัติ',
    color: '#f59e0b',
  },
  {
    step: '03', icon: '🗺️', title: 'รับแผนเที่ยวทันที',
    desc: 'ระบบจัดลำดับจุดแวะตามเวลา พิกัด และงบ พร้อมแผนที่และพาสตัวอย่างให้ทดลองชม',
    color: '#10b981',
  },
  {
    step: '04', icon: '🎟️', title: 'ใช้พาส สะสมแต้ม',
    desc: 'เช็กอินตามจุด ถ่ายรูปมิชชั่น สะสมแต้มแลกส่วนลดทริปหน้า',
    color: '#8b5cf6',
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const availableDistricts = DISTRICTS;
  const [selectedPreviewDistrict, setSelectedPreviewDistrict] = useState(availableDistricts[0]);
  const [activeFaq, setActiveFaq] = useState(null);

  function handleStartPlan(districtId) {
    if (districtId) sessionStorage.setItem('daypass_selected_district', districtId);
    navigate('/plan/new');
  }

  const faqs = [
    {
      q: 'ต้องดาวน์โหลดแอปพลิเคชันหรือไม่?',
      a: 'ไม่ต้องเลย! DayPass ทำงานบนเว็บเบราว์เซอร์มือถือ แท็บเล็ต และคอมพิวเตอร์ของคุณได้ทันที เพียงเปิดลิงก์ก็ใช้งานได้ทันที มี QR code และคูปองพร้อมใช้',
    },
    {
      q: 'ได้รับอะไรบ้างเมื่อซื้อพาส 1 วัน?',
      a: 'พาสแสดงกำหนดการและแผนที่ของสถานที่ที่เลือก คูปองจะแสดงตามร้านที่อยู่ในแผน และเช็กอินเพื่อปลดล็อกมิชชั่นสะสมแต้มได้',
    },
    {
      q: 'ชำระเงินอย่างไร มีความปลอดภัยไหม?',
      a: 'เว็บนี้เป็น prototype สำหรับสาธิตเท่านั้น การซื้อพาสและยอดเงินเป็นตัวอย่าง ไม่มีการชำระเงินจริงหรือเรียกเก็บเงิน',
    },
    {
      q: 'ถ้าไปเป็นกลุ่มหรือกับเพื่อน ซื้อร่วมกันได้ไหม?',
      a: 'ได้เลย! ในขั้นตอนสร้างแผน คุณสามารถระบุจำนวนคน (1-10 คน) ระบบจะคำนวณราคาและออกพาสที่รองรับจำนวนคนในกลุ่มของคุณพร้อมกัน',
    },
    {
      q: 'สามารถเลือกเที่ยวจังหวัดอื่นได้ไหม ถ้าที่อยู่กับที่อยากไปต่างกัน?',
      a: 'ได้เลยครับ! ข้อมูลที่อยู่ที่ลงทะเบียนไว้ใช้แค่เก็บ Home Base เท่านั้น เวลาสร้างแผนเที่ยวสามารถเลือกจังหวัดและย่านที่ต้องการได้อิสระ',
    },
  ];

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden pb-mobile-nav">

      {/* ══════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════ */}
      <section className="relative bg-hero-travel min-h-[85vh] sm:min-h-0 flex items-center pt-8 sm:pt-16 pb-16 sm:pb-24 overflow-hidden">
        {/* Ambient blobs */}
        <div className="travel-blob-orange w-[500px] h-[500px] -top-20 -right-20" />
        <div className="travel-blob-sky w-[400px] h-[400px] top-1/2 -left-32" />
        <div className="travel-blob-gold w-[300px] h-[300px] bottom-0 right-1/3" />

        {/* Floating emoji decorations — hidden on small screens */}
        <div
          className="hidden lg:block absolute top-28 left-[8%] text-4xl opacity-20 animate-float select-none"
          style={{ animationDelay: '0s' }}
        >✈️</div>
        <div
          className="hidden lg:block absolute bottom-24 left-[12%] text-3xl opacity-20 animate-float select-none"
          style={{ animationDelay: '1.2s' }}
        >🗺️</div>
        <div
          className="hidden lg:block absolute top-32 right-[8%] text-3xl opacity-15 animate-float select-none"
          style={{ animationDelay: '0.6s' }}
        >📸</div>
        <div
          className="hidden lg:block absolute bottom-32 right-[14%] text-4xl opacity-20 animate-float select-none"
          style={{ animationDelay: '1.8s' }}
        >🏖️</div>

        <div className="page-container relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

            {/* Left: Headlines & CTA */}
            <div className="lg:col-span-7 flex flex-col gap-5 sm:gap-6 text-center lg:text-left animate-fade-in">

              {/* Eyebrow badge */}
              <div className="flex justify-center lg:justify-start">
                <div
                  className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-sm font-semibold shadow-sm"
                  style={{
                    background: 'rgba(255,255,255,0.9)',
                    border: '1px solid rgba(249,115,22,0.25)',
                    color: '#c2410c',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-orange-200 flex-shrink-0">
                    <img src="/mascot/nong-pass-wave.jpg" alt="น้องพาส" className="w-full h-full object-cover" />
                  </div>
                  <span>พาส 1 วัน งบเริ่ม 149.- • เที่ยวทั่วไทย! 🎒</span>
                </div>
              </div>

              {/* Headline */}
              <h1
                className="font-extrabold tracking-tight leading-[1.15]"
                style={{ fontSize: 'clamp(2rem, 6vw, 4rem)' }}
              >
                เที่ยวครบย่าน
                <br />
                <span
                  className="inline-block"
                  style={{
                    background: 'linear-gradient(135deg, #f97316 0%, #f59e0b 50%, #ef4444 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  วันเดียวจบ ครบทุกฟีล
                </span>
              </h1>

              <p
                className="text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0"
                style={{ fontSize: 'clamp(0.9375rem, 2vw, 1.125rem)' }}
              >
                เลือกจังหวัด ย่าน งบ และสไตล์ที่อยากไป ระบบจัดแผนเที่ยวเรียงเวลาให้อัตโนมัติ
                พร้อมคูปองร้านดัง มิชชั่นถ่ายรูป และแต้มสะสมแลกส่วนลด
              </p>

              {/* Style pills scrollable */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                {STYLE_PILLS.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => navigate('/quiz')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: `${s.color}18`,
                      color: s.color,
                      border: `1px solid ${s.color}30`,
                    }}
                  >
                    <span>{s.icon}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-center lg:justify-start pt-1">
                <button
                  id="btn-hero-start"
                  onClick={() => handleStartPlan()}
                  className="btn-primary sm:w-auto px-8 py-4 text-base font-bold flex items-center justify-center gap-2"
                  style={{ width: 'auto' }}
                >
                  <span>✨ เริ่มวางแผนเที่ยวฟรี</span>
                  <span>→</span>
                </button>
                <button
                  onClick={() => navigate('/quiz')}
                  className="btn-secondary sm:w-auto px-6 py-4 text-base font-bold flex items-center justify-center gap-2"
                  style={{ width: 'auto' }}
                >
                  <span>🧭 ทำควิซหาสไตล์</span>
                </button>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 pt-1 text-xs text-slate-500 font-medium">
                {[
                  { icon: '✓', text: 'ไม่ต้องโหลดแอป' },
                  { icon: '✓', text: 'รองรับทุกอุปกรณ์' },
                  { icon: '✓', text: 'คูปองฟรี 2-3 ร้าน/พาส' },
                  { icon: '✓', text: 'ทั่วไทย' },
                ].map((b) => (
                  <div key={b.text} className="flex items-center gap-1.5">
                    <span className="text-emerald-500 font-bold">{b.icon}</span>
                    <span>{b.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Interactive district preview card */}
            <div className="lg:col-span-5 animate-slide-up" style={{ animationDelay: '0.15s' }}>
              <div
                className="relative bg-white rounded-3xl overflow-hidden"
                style={{
                  boxShadow: '0 24px 80px -16px rgba(249,115,22,0.18), 0 8px 24px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(249,115,22,0.15)',
                }}
              >
                {/* Card header — like a browser bar */}
                <div
                  className="flex items-center justify-between px-5 py-3 border-b"
                  style={{ borderColor: 'rgba(0,0,0,0.06)', background: '#fafafa' }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="text-[11px] text-slate-400 ml-2 font-mono">DayPass Ticket Preview</span>
                  </div>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: '#fff7ed', color: '#f97316', border: '1px solid rgba(249,115,22,0.2)' }}
                  >
                    ● ตัวอย่าง
                  </span>
                </div>

                <div className="p-5">
                  {/* District tabs */}
                  <div className="flex gap-1.5 overflow-x-auto pb-3 scrollbar-none mb-4">
                    {availableDistricts.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setSelectedPreviewDistrict(d)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0"
                        style={
                          selectedPreviewDistrict.id === d.id
                            ? {
                                background: 'linear-gradient(135deg,#f97316,#f59e0b)',
                                color: 'white',
                                boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
                              }
                            : {
                                background: '#f5f5f5',
                                color: '#64748b',
                              }
                        }
                      >
                        <span>{d.coverEmoji}</span>
                        <span>{d.name.split(' - ')[0]}</span>
                      </button>
                    ))}
                  </div>

                  {/* District info */}
                  <div
                    className="rounded-2xl p-4 mb-4"
                    style={{ background: 'linear-gradient(135deg,#fff7ed,#fffbf5)', border: '1px solid rgba(249,115,22,0.1)' }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-xs font-bold" style={{ color: '#f97316' }}>{selectedPreviewDistrict.tag}</span>
                        <h3 className="text-lg font-extrabold text-slate-900">{selectedPreviewDistrict.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5 leading-snug">{selectedPreviewDistrict.highlight}</p>
                      </div>
                      <span className="text-4xl">{selectedPreviewDistrict.coverEmoji}</span>
                    </div>

                    <div className="space-y-1.5 mt-3">
                      {[
                        { k: 'จุดเช็กอิน', v: 'จัดตามงบและสไตล์ที่เลือก' },
                        { k: 'คูปองที่ได้', v: '✓ แสดงตามร้านในแผนเที่ยว', accent: true },
                        { k: 'งบประมาณ', v: `~${selectedPreviewDistrict.avgCost} บาท/คน`, orange: true },
                      ].map((row) => (
                        <div
                          key={row.k}
                          className="flex items-center justify-between py-1.5 text-xs border-b last:border-0"
                          style={{ borderColor: 'rgba(249,115,22,0.08)' }}
                        >
                          <span className="text-slate-500">{row.k}</span>
                          <span
                            className="font-bold"
                            style={{ color: row.orange ? '#f97316' : row.accent ? '#10b981' : '#1a1209' }}
                          >
                            {row.v}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartPlan(selectedPreviewDistrict.id)}
                    className="w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                    style={{
                      background: 'white',
                      color: '#1a1209',
                      border: '1.5px solid rgba(0,0,0,0.1)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg,#f97316,#f59e0b)';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.color = '#1a1209';
                      e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)';
                    }}
                  >
                    <span>เลือกย่านนี้และรับแผนเที่ยว</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          POPULAR DISTRICTS
      ══════════════════════════════════════════ */}
      <section className="py-14 sm:py-20 relative" style={{ background: '#fff' }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 10% 50%, rgba(249,115,22,0.04) 0%, transparent 50%), radial-gradient(circle at 90% 20%, rgba(245,158,11,0.04) 0%, transparent 50%)',
          }}
        />
        <div className="page-container relative">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="section-eyebrow justify-center">🗺️ ย่านน่าเที่ยวแนะนำ</p>
            <h2
              className="font-extrabold text-slate-900 mb-3"
              style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}
            >
              ย่านท่องเที่ยวยอดนิยมทั่วไทย
            </h2>
            <p className="text-slate-500 text-sm sm:text-base">
              แต่ละย่านมีเอกลักษณ์เฉพาะตัว ออกแบบเส้นทางให้เดินง่าย คาเฟ่สวย อาหารอร่อย
            </p>
          </div>

          <div className="grid-destinations">
            {availableDistricts.map((district, i) => (
              <div
                key={district.id}
                className="destination-card group relative animate-fade-in"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <button
                  type="button"
                  onClick={() => handleStartPlan(district.id)}
                  className="block w-full cursor-pointer text-left"
                >
                  <div
                    className="h-32 sm:h-36 flex items-center justify-center relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${
                        ['#fff7ed,#fde68a', '#ecfdf5,#a7f3d0', '#eff6ff,#bfdbfe', '#fdf4ff,#e9d5ff'][i % 4]
                      })`,
                    }}
                  >
                    {district.coverPhoto ? (
                      <img
                        src={district.coverPhoto.src}
                        alt={district.coverPhoto.alt}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <span className="text-7xl group-hover:scale-110 transition-transform duration-300 select-none">
                        {district.coverEmoji}
                      </span>
                    )}
                    <div
                      className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.9)', color: '#1a1209' }}
                    >
                      {district.tag}
                    </div>
                  </div>

                  <div className="p-4">
                    <h3
                      className="text-base font-extrabold text-slate-900 group-hover:text-orange-600 transition-colors mb-1"
                    >
                      {district.name}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {district.highlight}
                    </p>

                    <div
                      className="mt-4 pt-3 flex items-center justify-between"
                      style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}
                    >
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold">งบเริ่มต้น</p>
                        <p className="font-extrabold text-sm" style={{ color: '#f97316' }}>
                          ~{district.avgCost} ฿/คน
                        </p>
                      </div>
                      <span
                        className="text-xs font-bold flex items-center gap-1 group-hover:gap-2 transition-all"
                        style={{ color: '#f97316' }}
                      >
                        จัดแผน
                        <span>→</span>
                      </span>
                    </div>
                  </div>
                </button>
                {district.coverPhoto && (
                  <span className="absolute left-2 top-[104px] sm:top-[120px] z-10 inline-flex items-center gap-1 rounded bg-white/90 px-1.5 py-1 text-[9px] leading-none text-slate-800 shadow">
                    <a href={district.coverPhoto.sourceUrl} target="_blank" rel="noreferrer" className="hover:underline">
                      ภาพ: {district.coverPhoto.author}
                    </a>
                    <span aria-hidden="true">·</span>
                    <a href={district.coverPhoto.licenseUrl} target="_blank" rel="noreferrer" className="hover:underline">
                      {district.coverPhoto.license}
                    </a>
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          NONG PASS MASCOT SHOWCASE
      ══════════════════════════════════════════ */}
      <section
        className="py-14 sm:py-20 relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #f0f9ff 0%, #fff 40%, #fff7ed 100%)',
        }}
      >
        <div className="travel-blob-orange w-80 h-80 -top-20 -right-20 opacity-50" />
        <div className="travel-blob-sky w-64 h-64 bottom-0 -left-20 opacity-40" />

        <div className="page-container relative z-10">
          <div
            className="rounded-3xl overflow-hidden p-6 sm:p-10"
            style={{
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(249,115,22,0.15)',
              boxShadow: '0 24px 80px -16px rgba(249,115,22,0.12)',
            }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

              {/* Mascot Photo */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center">
                <div className="relative group">
                  <div
                    className="absolute -inset-3 rounded-3xl opacity-25 group-hover:opacity-40 transition-opacity"
                    style={{ background: 'linear-gradient(135deg,#f97316,#f59e0b)', filter: 'blur(20px)' }}
                  />
                  <div
                    className="relative w-52 h-52 sm:w-64 sm:h-64 rounded-3xl overflow-hidden group-hover:scale-105 transition-transform duration-300"
                    style={{
                      border: '4px solid white',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                    }}
                  >
                    <img
                      src="/mascot/nong-pass-guide.jpg"
                      alt="น้องพาสพาเที่ยว"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Speech bubble */}
                  <div
                    className="absolute -bottom-4 -right-2 sm:-right-6 px-4 py-2 rounded-2xl text-xs font-bold text-slate-800 animate-bounce-slow flex items-center gap-1.5 whitespace-nowrap"
                    style={{
                      background: 'white',
                      border: '1px solid rgba(249,115,22,0.2)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    }}
                  >
                    <span>🌟</span>
                    <span>น้องพาส เพื่อนคู่ใจทริปวันเดียว!</span>
                  </div>
                </div>
              </div>

              {/* Mascot info */}
              <div className="lg:col-span-7 flex flex-col gap-5 text-center lg:text-left">
                <div>
                  <p className="section-eyebrow justify-center lg:justify-start">🐻 มาสคอตน้องพาส</p>
                  <h2
                    className="font-extrabold text-slate-900 leading-snug"
                    style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}
                  >
                    ทริปนี้ไม่เหงา
                    <br />
                    <span
                      style={{
                        background: 'linear-gradient(135deg,#f97316,#f59e0b,#3b82f6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      ให้น้องพาสนำทางความสนุก
                    </span>
                  </h2>
                </div>

                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  "น้องพาส" คือเพื่อนตัวกลมผู้เชี่ยวชาญการเที่ยว 1 วัน คอยช่วยวางแผนแบบวันเดียวจบ
                  คัดร้านเด็ด คำนวณงบประมาณให้พอดี แจกคูปองลับ และให้แต้มสะสมแลกส่วนลดในทุกการเดินทาง!
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { icon: '🧭', title: 'ควิซสไตล์เที่ยว', desc: '8 ข้อ จับคู่ย่านที่ตรงใจเป๊ะๆ', color: '#f97316' },
                    { icon: '🎁', title: 'ของขวัญประจำวัน', desc: 'กดรับแต้มฟรีกับน้องพาสทุกวัน', color: '#f59e0b' },
                    { icon: '📍', title: 'สุ่มย่านท้าทาย', desc: 'น้องพาสหมุนวงล้อเลือกให้ทันที', color: '#8b5cf6' },
                  ].map((f) => (
                    <div
                      key={f.title}
                      className="p-3.5 rounded-2xl text-left transition-all hover:-translate-y-1"
                      style={{
                        background: `${f.color}0c`,
                        border: `1px solid ${f.color}20`,
                      }}
                    >
                      <div className="text-2xl mb-2">{f.icon}</div>
                      <h4 className="font-bold text-xs text-slate-900">{f.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{f.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-center justify-center lg:justify-start pt-1">
                  <button
                    onClick={() => navigate('/quiz')}
                    className="btn-primary sm:w-auto px-6 py-3.5 text-sm font-bold"
                    style={{ width: 'auto' }}
                  >
                    <span>🧭 ทำควิซกับน้องพาส (+20 แต้ม)</span>
                    <span>→</span>
                  </button>
                  <button
                    onClick={() => { sessionStorage.setItem('daypass_selected_district', 'taladnoi'); navigate('/plan/new'); }}
                    className="btn-secondary sm:w-auto px-5 py-3.5 text-sm font-bold"
                    style={{ width: 'auto' }}
                  >
                    <span>🗺️ เที่ยวตามรอยตลาดน้อย</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════ */}
      <section className="py-14 sm:py-20" style={{ background: '#faf8f5' }}>
        <div className="page-container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="section-eyebrow justify-center">⚡ เริ่มเที่ยวง่ายใน 4 ขั้นตอน</p>
            <h2 className="font-extrabold text-slate-900" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
              วิธีเที่ยวกับ DayPass
            </h2>
            <p className="text-slate-500 text-sm sm:text-base mt-2">
              ไม่ต้องคิดเยอะ ระบบเตรียมเส้นทางและสิทธิพิเศษให้หมดแล้ว
            </p>
          </div>

          {/* Steps grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HOW_IT_WORKS.map((item, i) => (
              <div
                key={item.step}
                className="travel-card relative overflow-hidden animate-fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {/* Big step number watermark */}
                <span
                  className="absolute -top-2 -right-2 font-black select-none font-mono leading-none"
                  style={{ fontSize: '5rem', color: `${item.color}14` }}
                >
                  {item.step}
                </span>

                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 relative z-10"
                  style={{
                    background: `${item.color}15`,
                    border: `1px solid ${item.color}25`,
                    boxShadow: `0 4px 12px ${item.color}20`,
                  }}
                >
                  {item.icon}
                </div>

                <span
                  className="text-[10px] font-bold tracking-widest uppercase mb-1 block relative z-10"
                  style={{ color: item.color }}
                >
                  ขั้นตอนที่ {item.step}
                </span>
                <h3 className="text-base font-bold text-slate-900 mb-2 relative z-10">{item.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed relative z-10">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          QUIZ CTA
      ══════════════════════════════════════════ */}
      <section className="py-14 sm:py-20" style={{ background: '#fff' }}>
        <div className="page-container">
          <div
            className="max-w-5xl mx-auto rounded-3xl overflow-hidden p-8 sm:p-12 relative"
            style={{
              background: 'linear-gradient(135deg,#fdf4ff 0%,#fff 50%,#fff7ed 100%)',
              border: '1px solid rgba(139,92,246,0.15)',
              boxShadow: '0 24px 80px -16px rgba(139,92,246,0.12)',
            }}
          >
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle,rgba(139,92,246,0.08),transparent 70%)', filter: 'blur(40px)' }} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="relative z-10">
                <p className="section-eyebrow">🧭 ค้นหาสไตล์เที่ยวของคุณ</p>
                <h2
                  className="font-extrabold text-slate-900 mb-3"
                  style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)' }}
                >
                  ไม่รู้จะไปย่านไหน?
                  <br />
                  <span
                    style={{
                      background: 'linear-gradient(135deg,#8b5cf6,#f97316)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    ลองทำควิซดู!
                  </span>
                </h2>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
                  ตอบ 8 คำถามง่ายๆ ระบบวิเคราะห์สไตล์การเที่ยวของคุณ
                  แล้วแนะนำย่านและแผนเที่ยวที่เหมาะที่สุด พร้อมรับ 20 แต้มฟรี!
                </p>
                <button
                  id="btn-home-quiz"
                  onClick={() => navigate('/quiz')}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-white transition-all active:scale-95 hover:-translate-y-1"
                  style={{
                    background: 'linear-gradient(135deg,#8b5cf6,#f97316)',
                    boxShadow: '0 8px 24px rgba(139,92,246,0.3)',
                    fontSize: 'clamp(0.875rem,2vw,1rem)',
                  }}
                >
                  🧭 เริ่มทำควิซ (ฟรี) →
                </button>
              </div>

              {/* Style grid */}
              <div className="grid grid-cols-4 gap-2 sm:gap-3 relative z-10">
                {STYLE_PILLS.map((s, i) => (
                  <button
                    key={s.label}
                    onClick={() => navigate('/quiz')}
                    className="rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center gap-1.5 transition-all hover:-translate-y-1 hover:shadow-lg animate-fade-in"
                    style={{
                      background: `${s.color}15`,
                      border: `1px solid ${s.color}25`,
                      animationDelay: `${i * 0.05}s`,
                    }}
                  >
                    <span className="text-2xl sm:text-3xl">{s.icon}</span>
                    <span className="text-[10px] font-bold" style={{ color: s.color }}>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          BUDGET TIERS
      ══════════════════════════════════════════ */}
      <section
        className="py-14 sm:py-20 relative overflow-hidden"
        style={{ background: '#faf8f5' }}
      >
        <div className="travel-blob-gold w-96 h-96 top-0 left-1/2 -translate-x-1/2 opacity-40" />
        <div className="page-container relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="section-eyebrow justify-center">💰 ราคาสบายกระเป๋า</p>
            <h2
              className="font-extrabold text-slate-900 mb-2"
              style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}
            >
              เลือกงบที่เหมาะกับคุณ
            </h2>
            <p className="text-slate-500 text-sm">
              ตัวเลขเป็นงบสูงสุดต่อคน ค่าใช้จ่ายจริงแสดงจากร้านในแผนที่เลือก
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 max-w-4xl mx-auto">
            {[
              { price: '199', title: 'งบเริ่มต้น', badge: 'ประหยัด', popular: false, badgeColor: '#3b82f6', features: ['ตั้งงบสูงสุด 199 บาท/คน', 'แผนเที่ยวอัตโนมัติ', 'คูปองและมิชชั่น', 'เส้นทางใน 1 ย่าน'] },
              { price: '299', title: 'งบแนะนำ', badge: '🔥 ยอดนิยม', popular: true, badgeColor: '#f97316', features: ['ตั้งงบสูงสุด 299 บาท/คน', 'แผนเที่ยวอัตโนมัติ', 'คูปองและมิชชั่น', 'สะสมแต้มสูงขึ้น'] },
              { price: '499+', title: 'งบยืดหยุ่น', badge: 'จัดเต็ม', popular: false, badgeColor: '#8b5cf6', features: ['กำหนดงบเองได้เลย', 'แผนเที่ยวอัตโนมัติ', 'คูปองพรีเมียม', 'วีไอพีประสบการณ์'] },
            ].map((tier, i) => (
              <div
                key={tier.price}
                className="relative animate-fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {tier.popular && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wider z-10 whitespace-nowrap"
                    style={{
                      background: 'linear-gradient(135deg,#f97316,#f59e0b)',
                      boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
                    }}
                  >
                    ✨ แนะนำ
                  </div>
                )}
                <div
                  className="travel-card h-full flex flex-col"
                  style={
                    tier.popular
                      ? {
                          border: `1.5px solid rgba(249,115,22,0.35)`,
                          boxShadow: '0 20px 60px -12px rgba(249,115,22,0.2)',
                        }
                      : {}
                  }
                >
                  <div className="flex justify-between items-center mb-3">
                    <span
                      className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                      style={{
                        background: `${tier.badgeColor}15`,
                        color: tier.badgeColor,
                        border: `1px solid ${tier.badgeColor}25`,
                      }}
                    >
                      {tier.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{tier.title}</h3>
                  <div className="flex items-baseline gap-1 mt-3 mb-5">
                    <span className="font-extrabold" style={{ fontSize: '2.25rem', color: '#1a1209' }}>{tier.price}</span>
                    <span className="text-slate-400 text-sm font-medium">บาท/คน</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600 flex-1">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <span className="font-bold" style={{ color: tier.badgeColor }}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="pt-5 mt-5" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <button
                      onClick={() => {
                        sessionStorage.setItem('daypass_preset_budget', tier.price.replace('+', ''));
                        navigate('/plan/new');
                      }}
                      className={tier.popular ? 'btn-primary py-3 text-sm font-bold' : 'btn-secondary py-3 text-sm font-bold'}
                    >
                      เริ่มด้วยงบ {tier.price}.-
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════ */}
      <section className="py-14 sm:py-20" style={{ background: '#fff' }}>
        <div className="page-container-sm">
          <div className="text-center mb-10">
            <p className="section-eyebrow justify-center">❓ มีข้อสงสัย?</p>
            <h2 className="font-extrabold text-slate-900" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)' }}>
              คำถามที่พบบ่อย
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={faq.q}
                  className="rounded-2xl overflow-hidden cursor-pointer transition-all"
                  style={{
                    background: isOpen ? '#fff7ed' : 'white',
                    border: isOpen ? '1.5px solid rgba(249,115,22,0.2)' : '1px solid rgba(0,0,0,0.07)',
                    boxShadow: isOpen ? '0 8px 24px -8px rgba(249,115,22,0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                >
                  <div className="flex justify-between items-center gap-4 p-5">
                    <p className="font-bold text-slate-900 text-sm sm:text-base">{faq.q}</p>
                    <span
                      className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-bold text-base transition-transform duration-200"
                      style={{
                        background: isOpen ? 'rgba(249,115,22,0.15)' : 'rgba(0,0,0,0.06)',
                        color: isOpen ? '#f97316' : '#64748b',
                        transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                      }}
                    >
                      +
                    </span>
                  </div>
                  {isOpen && (
                    <p className="text-slate-600 text-sm leading-relaxed px-5 pb-5 animate-fade-in">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          BOTTOM CTA
      ══════════════════════════════════════════ */}
      <section className="py-12 sm:py-16">
        <div className="page-container">
          <div
            className="max-w-3xl mx-auto rounded-3xl py-12 px-6 sm:px-14 text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg,#f97316 0%,#f59e0b 50%,#ef4444 100%)',
              boxShadow: '0 32px 80px -16px rgba(249,115,22,0.4)',
            }}
          >
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle,white,transparent 70%)' }} />
            <div className="absolute bottom-0 left-0 w-36 h-36 rounded-full opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle,white,transparent 70%)' }} />

            <div className="text-5xl sm:text-6xl mb-4 animate-bounce-slow">✈️</div>
            <h2
              className="font-extrabold text-white mb-3 relative z-10"
              style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)' }}
            >
              พร้อมออกไปสัมผัสย่านโปรดหรือยัง?
            </h2>
            <p className="text-orange-100 text-sm sm:text-base mb-8 max-w-md mx-auto leading-relaxed relative z-10">
              ใช้เวลาแค่นาทีเดียว เลือกสไตล์ที่ใช่ แล้วรับแผนเที่ยวพร้อมคูปองไปลุยได้เลย
            </p>
            <button
              onClick={() => handleStartPlan()}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-orange-600 transition-all hover:-translate-y-1 hover:shadow-2xl active:scale-95 relative z-10"
              style={{
                background: 'white',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                fontSize: 'clamp(0.9375rem,2vw,1.0625rem)',
              }}
            >
              <span>✨ เริ่มวางแผนเที่ยวตอนนี้</span>
              <span>→</span>
            </button>
            <p className="text-orange-200/80 text-xs mt-4 relative z-10">
              ฟรี · รองรับทั้งมือถือ ไอแพด และคอมพิวเตอร์
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
