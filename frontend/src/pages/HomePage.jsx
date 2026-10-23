import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DISTRICTS } from '../api';

export default function HomePage() {
  const navigate = useNavigate();
  const [selectedPreviewDistrict, setSelectedPreviewDistrict] = useState(DISTRICTS[0]);
  const [activeFaq, setActiveFaq] = useState(null);

  function handleStartPlan(districtId) {
    if (districtId) {
      sessionStorage.setItem('daypass_selected_district', districtId);
    }
    navigate('/plan/new');
  }

  const faqs = [
    {
      q: 'ต้องดาวน์โหลดแอปพลิเคชันหรือไม่?',
      a: 'ไม่ต้องเลย! DayPass ทำงานบนเว็บเบราว์เซอร์มือถือ แท็บเล็ต และคอมพิวเตอร์ของคุณได้ทันที เพียงเปิดลิงก์ก็ใช้งานได้ทันที มี QR code และคูปองพร้อมใช้',
    },
    {
      q: 'ได้รับอะไรบ้างเมื่อซื้อพาส 1 วัน?',
      a: 'คุณจะได้รับ: (1) แผนที่และกำหนดการเดินทางเรียงตามเวลาจริง (2) คูปองอาหาร/เครื่องดื่มฟรีหรือส่วนลดจากร้านเด็ดในย่าน (3) สิทธิ์ทำมิชชั่นถ่ายรูปเพื่อสะสมแต้มแลกเป็นส่วนลดพาสถัดไป',
    },
    {
      q: 'ชำระเงินอย่างไร มีความปลอดภัยไหม?',
      a: 'ชำระเงินผ่าน PromptPay QR Code มาตรฐาน ได้ทุกธนาคารในไทย จ่ายเสร็จระบบจะออกพาสดิจิทัลให้ทันทีภายในไม่กี่วินาที',
    },
    {
      q: 'ถ้าไปเป็นกลุ่มหรือกับเพื่อน ซื้อร่วมกันได้ไหม?',
      a: 'ได้เลย! ในขั้นตอนสร้างแผน คุณสามารถระบุจำนวนคน (1-10 คน) ระบบจะคำนวณราคาและออกพาสที่รองรับจำนวนคนในกลุ่มของคุณพร้อมกัน',
    },
  ];

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-200/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-0 w-80 h-80 bg-rose-200/30 rounded-full blur-[100px] pointer-events-none" />

      {/* ── HERO SECTION ─────────────────────────────────── */}
      <section className="relative pt-8 sm:pt-16 pb-12 sm:pb-20">
        <div className="page-container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Headlines & Call to Action */}
            <div className="lg:col-span-7 flex flex-col gap-5 sm:gap-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs sm:text-sm font-semibold w-fit mx-auto lg:mx-0 animate-fade-in shadow-sm">
                <span>⚡</span>
                <span>พาสเที่ยว 1 ย่าน ใน 1 วัน — งบเริ่มต้นเพียง 199.-</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.18]">
                เที่ยวครบย่าน <br />
                <span className="bg-gradient-to-r from-brand-600 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                  วันเดียวจบ ครบทุกฟีล
                </span>
              </h1>

              <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
                เลือกงบ สไตล์ และย่านที่อยากไป ระบบจัดแผนเที่ยวเรียงเวลาให้อัตโนมัติ พร้อมคูปองอาหารร้านดัง และมิชชั่นถ่ายรูปสะสมแต้มแลกส่วนลด
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start pt-2">
                <button
                  id="btn-hero-start"
                  onClick={() => handleStartPlan()}
                  className="btn-primary w-full sm:w-auto px-8 py-4 text-base font-bold shadow-xl shadow-brand-500/25 flex items-center justify-center gap-2"
                >
                  <span>✨ เริ่มวางแผนเที่ยวฟรี</span>
                  <span>→</span>
                </button>
                <button
                  onClick={() => navigate('/pass/p_demo001')}
                  className="btn-secondary w-full sm:w-auto px-6 py-4 text-base font-bold flex items-center justify-center gap-2"
                >
                  <span>🎟️ ดูตัวอย่างพาส</span>
                </button>
              </div>

              {/* Value props badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-3 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span> ไม่ต้องโหลดแอป
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span> PromptPay ทันใจ
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span> คูปองฟรี 2-3 ร้าน/พาส
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span> รองรับทุกอุปกรณ์
                </div>
              </div>
            </div>

            {/* Right Column: Live Interactive Pass Simulator */}
            <div className="lg:col-span-5">
              <div className="glass-card relative overflow-hidden border-orange-200 shadow-2xl shadow-orange-500/10 bg-white">
                <div className="absolute top-0 right-0 w-40 h-40 bg-brand-100/60 rounded-full blur-2xl pointer-events-none" />
                
                {/* Simulator Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-400" />
                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="text-xs text-slate-500 ml-1 font-mono font-medium">DayPass Ticket Preview</span>
                  </div>
                  <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">● Active</span>
                </div>

                {/* District quick tabs */}
                <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                  {DISTRICTS.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setSelectedPreviewDistrict(d)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                        selectedPreviewDistrict.id === d.id
                          ? 'bg-brand-500 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
                      }`}
                    >
                      {d.coverEmoji} {d.name.split(' - ')[0]}
                    </button>
                  ))}
                </div>

                {/* Ticket Details */}
                <div className="mt-3 bg-slate-50 rounded-xl p-4 border border-slate-200/80">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-xs text-brand-600 font-bold">{selectedPreviewDistrict.tag}</span>
                      <h3 className="text-lg font-bold text-slate-900">{selectedPreviewDistrict.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{selectedPreviewDistrict.highlight}</p>
                    </div>
                    <span className="text-3xl">{selectedPreviewDistrict.coverEmoji}</span>
                  </div>

                  {/* Highlights list */}
                  <div className="space-y-2 my-3">
                    <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200/60">
                      <span className="text-slate-600">จำนวนจุดเช็กอิน</span>
                      <span className="text-slate-900 font-bold">{selectedPreviewDistrict.stopsCount} จุด (คาเฟ่ + ถ่ายรูป + สตรีทฟู้ด)</span>
                    </div>
                    <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200/60">
                      <span className="text-slate-600">คูปองที่ได้รับ</span>
                      <span className="text-emerald-600 font-bold">3 ใบ (ของแถม & ส่วนลด)</span>
                    </div>
                    <div className="flex items-center justify-between text-xs py-1.5">
                      <span className="text-slate-600">งบประมาณแนะนำ</span>
                      <span className="text-brand-600 font-extrabold text-sm">~{selectedPreviewDistrict.avgCost} บาท/คน</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartPlan(selectedPreviewDistrict.id)}
                    className="w-full py-2.5 rounded-xl bg-white hover:bg-brand-500 hover:text-white text-slate-800 font-bold text-xs border border-slate-200 hover:border-transparent transition-all duration-150 flex items-center justify-center gap-1.5 shadow-sm"
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

      {/* ── POPULAR DISTRICTS (ย่านยอดฮิต) ────────────────── */}
      <section className="py-14 bg-white border-y border-slate-200/70">
        <div className="page-container">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="badge bg-brand-50 text-brand-700 border border-brand-200 text-xs mb-2 font-semibold">🗺️ ย่านน่าเที่ยวแนะนำ</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900">4 ย่านเด็ดกรุงเทพฯ เที่ยวได้ทันที</h2>
            <p className="text-slate-500 text-sm sm:text-base mt-2">
              แต่ละย่านมีเอกลักษณ์เฉพาะตัว ออกแบบเส้นทางให้เดินง่าย คาเฟ่สวย อาหารอร่อย
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {DISTRICTS.map((district) => (
              <div
                key={district.id}
                onClick={() => handleStartPlan(district.id)}
                className="glass-card-interactive group flex flex-col justify-between bg-white"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-4xl group-hover:scale-110 transition-transform">{district.coverEmoji}</span>
                    <span className="badge bg-slate-100 text-slate-700 text-[10px] font-bold">{district.tag}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                    {district.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {district.highlight}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold">งบประมาณเริ่มต้น</p>
                    <p className="text-brand-600 font-bold text-sm">~{district.avgCost} ฿/คน</p>
                  </div>
                  <span className="text-xs font-bold text-slate-600 group-hover:text-brand-600 flex items-center gap-1">
                    จัดแผนย่านนี้ →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS (วิธีใช้งาน 4 ขั้นตอน) ───────────── */}
      <section className="py-14 sm:py-20">
        <div className="page-container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="badge bg-purple-50 text-purple-700 border border-purple-200 text-xs mb-2 font-semibold">⚡ ง่ายใน 4 ขั้นตอน</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900">วิธีเที่ยวกับ DayPass</h2>
            <p className="text-slate-500 text-sm sm:text-base mt-2">
              ไม่ต้องคิดเยอะ ระบบเตรียมเส้นทางและสิทธิพิเศษให้หมดแล้ว
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                step: '01',
                icon: '🎯',
                title: 'เลือกงบและสไตล์',
                desc: 'ระบุงบต่อคน (199-500+), เลือกรัศมี, และสไตล์ทริป เช่น สายชิลคาเฟ่ หรือ สายกินท้าทาย',
              },
              {
                step: '02',
                icon: '🗺️',
                title: 'รับแผนเที่ยวทันที',
                desc: 'ระบบ AI เรียงเวลาและลำดับร้านตามพิกัดจริง พร้อมคำนวณระยะทางและงบแต่ละจุด',
              },
              {
                step: '03',
                icon: '💳',
                title: 'ชำระเงิน PromptPay',
                desc: 'สแกนจ่ายผ่าน QR Code ทุกธนาคาร รับพาสตั๋วดิจิทัลและคูปองของแถมบนมือถือทันที',
              },
              {
                step: '04',
                icon: '📸',
                title: 'เช็กอิน & สะสมแต้ม',
                desc: 'ไปถึงร้านกดเช็กอินตามพิกัด ถ่ายรูปอาหารทำมิชชั่นเพื่อสะสมแต้มแลกส่วนลดครั้งถัดไป',
              },
            ].map((item) => (
              <div key={item.step} className="glass-card relative overflow-hidden bg-white">
                <span className="absolute -top-3 -right-2 text-5xl font-black text-slate-100 select-none font-mono">
                  {item.step}
                </span>
                <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-2xl mb-4 shadow-sm">
                  {item.icon}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING TIERS (แพ็กเกจงบประมาณ) ───────────────── */}
      <section className="py-14 bg-white border-y border-slate-200/70">
        <div className="page-container">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs mb-2 font-semibold">💰 ราคาสบายกระเป๋า</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900">เลือกงบที่เหมาะกับคุณ</h2>
            <p className="text-slate-500 text-sm mt-1">ราคาคุ้มค่า รวมทั้งแผนเที่ยว คูปอง และแต้มสะสม</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                price: '199',
                title: 'สายประหยัด สบายๆ',
                badge: 'คุ้มค่า',
                badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
                popular: false,
                features: ['แผนเที่ยว 3-4 จุดเน้นความคุ้ม', 'คูปองร้านอาหาร 2 ร้าน', 'มิชชั่นสะสมแต้ม 2 จุด', 'แผนที่ GPS นำทาง'],
              },
              {
                price: '299',
                title: 'สายเที่ยวชิล ยอดฮิต',
                badge: '🔥 ยอดนิยมอันดับ 1',
                badgeColor: 'bg-brand-50 text-brand-700 border-brand-300',
                popular: true,
                features: ['แผนเที่ยว 4 จุดครบทุกหมวด', 'คูปองอาหาร & เครื่องดื่ม 3 ร้าน', 'มิชชั่นถ่ายรูปแต้มพิเศษ', 'แผนที่ GPS นำทาง', 'Fast-lane จองคิวพาส'],
              },
              {
                price: '399',
                title: 'สายจัดเต็ม พรีเมียม',
                badge: 'จัดเต็ม',
                badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
                popular: false,
                features: ['แผนเที่ยวคาเฟ่ Specialty & Fine Dine', 'คูปองส่วนลดสูงสุด 4 ร้าน', 'แต้มสะสม x2 สำหรับทริปถัดไป', 'แผนที่ GPS นำทาง', 'สิทธิ์ปลดล็อกแลนด์มาร์กลับ'],
              },
            ].map((tier) => (
              <div
                key={tier.price}
                className={`glass-card flex flex-col justify-between relative bg-white ${
                  tier.popular ? 'border-brand-400 shadow-xl shadow-brand-500/15 ring-2 ring-brand-400/30' : ''
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-brand-500 to-amber-500 text-white text-[10px] font-bold uppercase tracking-wider shadow">
                    Recommended
                  </div>
                )}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className={`badge ${tier.badgeColor} font-semibold`}>{tier.badge}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{tier.title}</h3>
                  <div className="mt-3 mb-5 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-900">{tier.price}</span>
                    <span className="text-slate-500 text-sm font-medium">บาท / คน</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <span className="text-brand-600 font-bold">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => {
                      sessionStorage.setItem('daypass_preset_budget', tier.price);
                      navigate('/plan/new');
                    }}
                    className={tier.popular ? 'btn-primary py-3 text-sm font-bold' : 'btn-secondary py-3 text-sm font-bold'}
                  >
                    เริ่มด้วยงบ {tier.price}.-
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ACCORDION ─────────────────────────────────── */}
      <section className="py-14">
        <div className="page-container max-w-3xl">
          <div className="text-center mb-8">
            <span className="badge bg-slate-100 text-slate-700 text-xs mb-2 font-semibold">❓ มีข้อสงสัย?</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">คำถามที่พบบ่อย</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={faq.q}
                  className="glass-card cursor-pointer transition-all bg-white hover:border-slate-300"
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                >
                  <div className="flex justify-between items-center gap-4">
                    <p className="font-bold text-slate-900 text-sm sm:text-base">{faq.q}</p>
                    <span className="text-brand-600 font-bold text-lg">{isOpen ? '−' : '+'}</span>
                  </div>
                  {isOpen && (
                    <p className="text-slate-600 text-xs sm:text-sm mt-3 pt-3 border-t border-slate-100 leading-relaxed animate-fade-in">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA BANNER ─────────────────────────────── */}
      <section className="py-12 bg-gradient-to-t from-slate-100 to-transparent">
        <div className="page-container text-center">
          <div className="glass-card max-w-3xl mx-auto py-10 px-6 sm:px-12 border-orange-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 shadow-xl shadow-orange-500/10">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mb-3">
              พร้อมออกไปสัมผัสย่านโปรดหรือยัง?
            </h2>
            <p className="text-slate-600 text-sm sm:text-base max-w-lg mx-auto mb-6">
              ใช้เวลาแค่นาทีเดียว เลือกสไตล์ที่ใช่ แล้วรับแผนเที่ยวพร้อมคูปองไปลุยได้เลย
            </p>
            <button
              onClick={() => handleStartPlan()}
              className="btn-primary max-w-sm mx-auto text-base sm:text-lg font-bold py-4 shadow-xl shadow-brand-500/30"
            >
              ✨ เริ่มวางแผนเที่ยวตอนนี้ →
            </button>
            <p className="text-slate-400 text-xs mt-3">ใช้งานฟรี รองรับทั้งมือถือ ไอแพด และคอมพิวเตอร์</p>
          </div>
        </div>
      </section>
    </div>
  );
}
