import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { addPoints, getDeviceId, getPoints, DISTRICTS } from '../api';
import { getBangkokDate } from '../utils/date';

const NONG_PASS_TIPS = [
  'พกพาวเวอร์แบงก์ พกรอยยิ้ม แล้วออกไปลุยกันครับ! 🔋✨',
  'ตลาดน้อยมีมุมกราฟฟิตี้และตรอกลับถ่ายรูปสวยมาก ห้ามพลาดนะ! 📸',
  'เยาวราชช่วงเย็นของกินเปิดเพียบ วอร์มท้องให้พร้อมเลยครับ 🍜🍢',
  'ถ้าเหนื่อยแวะคาเฟ่ชิลๆ ตากแอร์สั่งกาแฟเย็นแก้วนึง สดชื่นแน่นอน ☕🧊',
  'ทำควิซ 8 ข้อแล้วยัง? ให้น้องพาสช่วยหาสไตล์เที่ยวที่เป๊ะที่สุดให้ได้นะ 🧭',
  'เช็กอินตามสถานที่ในพาสเพื่อรับแต้มสะสมแลกส่วนลดได้ด้วยนะคร้าบ! 🎟️⭐',
  'ย่านอารีย์มีคาเฟ่มินิมอลและร้านบรันช์น่ารักเพียบ ลองไปแวะดูนะ 🥐',
  'เที่ยวคนเดียวก็สนุก มีน้องพาสเป็นเพื่อนร่วมทางตลอดทริป! 🎒'
];

export default function NongPassWidget() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [bubbleText, setBubbleText] = useState('สวัสดีครับ! ให้น้องพาสช่วยแนะนำทริปไหมครับ? ✨');
  const [showBubble, setShowBubble] = useState(true);
  const [hasClaimedDaily, setHasClaimedDaily] = useState(false);
  const [claimedReward, setClaimedReward] = useState(null);
  const [luckyDistrict, setLuckyDistrict] = useState(null);
  const [pokeCount, setPokeCount] = useState(0);

  // Check daily bonus status
  useEffect(() => {
    const todayKey = `daypass_nongpass_daily_${getBangkokDate()}`;
    if (localStorage.getItem(todayKey)) {
      setHasClaimedDaily(true);
    }
  }, []);

  // Context-aware speech bubbles based on page
  useEffect(() => {
    if (location.pathname === '/quiz') {
      setBubbleText('สู้ๆ ครับ! ตอบตามฟีลลิ่งเลย เดี๋ยวผมประมวลผลให้ 🧭');
    } else if (location.pathname === '/plan/new') {
      setBubbleText('เลือกย่านและงบที่ชอบได้เลยครับ จัดแผนง่ายมาก! 🗺️');
    } else if (location.pathname.startsWith('/pass/')) {
      setBubbleText('นี่ไงพาสของคุณ! อย่าลืมกดเช็กอินสะสมแต้มนะ 🎟️⭐');
    } else if (location.pathname === '/profile') {
      setBubbleText('ดูสถิติและแต้มสะสมของคุณได้ที่นี่เลยครับ! 🎖️');
    } else {
      setBubbleText('สวัสดีครับ! น้องพาสพาเที่ยววันเดียวจบ แตะคุยกับผมได้นะ 🎒');
    }
  }, [location.pathname]);

  // Handle Mascot poke (clicking the floating avatar)
  function handlePoke(e) {
    e.stopPropagation();
    setPokeCount((c) => c + 1);
    const pokeReactions = [
      'ฮิๆ จั๊กจี้จัง! พร้อมพาคุณไปลุยแล้วครับ 😆',
      'น้องพาสอยู่นี่แล้ว! วันนี้อยากไปเที่ยวไหนดีครับ? 🗺️',
      'ปิ๊ง! น้องพาสให้กำลังใจทริปนี้ ขอให้เป็นวันที่แสนพิเศษนะ 💛',
      'เย้! ลองกดปุ่มรับของขวัญประจำวันดูสิ มีแต้มฟรีให้นะ 🎁',
      'อย่าลืมดื่มน้ำเยอะๆ และถ่ายรูปสวยๆ มาฝากด้วยนะคร้าบ 📸'
    ];
    setBubbleText(pokeReactions[pokeCount % pokeReactions.length]);
    setShowBubble(true);
  }

  // Claim Daily Points Bonus
  async function handleClaimDaily() {
    if (hasClaimedDaily) return;
    try {
      const todayKey = `daypass_nongpass_daily_${getBangkokDate()}`;
      const rewardPoints = 35;
      await addPoints(getDeviceId(), rewardPoints, 'daily_bonus', 'ของขวัญเช็กอินประจำวันจากน้องพาส 🎁');
      localStorage.setItem(todayKey, 'true');
      setHasClaimedDaily(true);
      setClaimedReward(rewardPoints);
      setBubbleText(`เย้! ได้รับ +${rewardPoints} แต้มจากน้องพาสแล้วครับ! 🎉`);
    } catch (err) {
      console.error(err);
    }
  }

  // Random lucky district recommendation
  function handleRollLuckyDistrict() {
    const random = DISTRICTS[Math.floor(Math.random() * DISTRICTS.length)];
    setLuckyDistrict(random);
    setBubbleText(`น้องพาสขอแนะนำย่าน "${random.name}" เหมาะกับวันนี้สุดๆ เลยครับ! ✨`);
  }

  function handleGoToLuckyDistrict() {
    if (luckyDistrict) {
      sessionStorage.setItem('daypass_selected_district', luckyDistrict.id);
      navigate('/plan/new');
      setIsOpen(false);
    }
  }

  return (
    <>
      {/* ── Floating Mascot Trigger (Bottom Right) ── */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end pointer-events-auto select-none">
        {/* Speech Bubble */}
        {!isOpen && showBubble && (
          <div 
            onClick={() => setIsOpen(true)}
            className="mb-2 max-w-xs bg-white text-slate-800 text-xs font-medium px-3.5 py-2.5 rounded-2xl shadow-xl border border-orange-200/80 cursor-pointer hover:border-brand-400 transition-all duration-200 animate-bounce-slow flex items-start gap-2 relative group"
          >
            <span className="text-sm">💬</span>
            <span className="leading-snug">{bubbleText}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowBubble(false);
              }}
              className="text-slate-400 hover:text-slate-600 ml-1 text-xs"
              title="ซ่อนข้อความ"
            >
              ✕
            </button>
            {/* Bubble Tail */}
            <div className="absolute -bottom-2 right-6 w-3 h-3 bg-white border-b border-r border-orange-200/80 transform rotate-45" />
          </div>
        )}

        {/* Mascot Avatar Button */}
        <div className="flex items-center gap-2">
          <button
            id="btn-nongpass-mascot"
            onClick={() => setIsOpen(!isOpen)}
            className="relative group rounded-full p-1 bg-gradient-to-tr from-brand-500 via-amber-400 to-sky-400 shadow-xl shadow-brand-500/30 hover:shadow-brand-500/50 hover:scale-105 active:scale-95 transition-all duration-300"
            title="คุยกับน้องพาส มาสคอต DayPass"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-white bg-sky-100 flex items-center justify-center relative">
              <img
                src="/mascot/nong-pass-wave.jpg"
                alt="น้องพาส มาสคอต OneDaypass"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>

            {/* Badge Indicator */}
            {!hasClaimedDaily && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-white text-[9px] font-extrabold items-center justify-center">
                  🎁
                </span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Interactive Mascot Dialog / Drawer ── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-end sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full sm:w-[420px] max-h-[90vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-orange-100 flex flex-col overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Nong Pass Card */}
            <div className="relative bg-gradient-to-br from-sky-400 via-brand-500 to-amber-500 p-5 text-white">
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white font-bold text-sm transition-all"
              >
                ✕
              </button>

              <div className="flex items-center gap-4">
                <div 
                  onClick={handlePoke}
                  className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/80 shadow-lg bg-sky-100 cursor-pointer hover:rotate-3 transition-transform"
                  title="จิ้มน้องพาสเล่นได้นะ!"
                >
                  <img
                    src="/mascot/nong-pass-wave.jpg"
                    alt="น้องพาส"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-semibold tracking-wide">
                    <span>🌟</span> มาสคอตประจำ OneDaypass
                  </div>
                  <h3 className="text-xl font-extrabold mt-1">น้องพาส (Nong Pass)</h3>
                  <p className="text-xs text-sky-100 mt-0.5">เพื่อนตัวกลมพาเที่ยว 1 วัน จบ ครบทุกฟีล!</p>
                </div>
              </div>

              {/* Speech Box */}
              <div className="mt-3 bg-white/15 backdrop-blur-md rounded-xl p-2.5 text-xs text-white leading-relaxed flex items-start gap-2 border border-white/20">
                <span className="text-sm">🐻</span>
                <span>"{bubbleText}"</span>
              </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 max-h-[calc(90vh-170px)]">
              
              {/* Daily Bonus Section */}
              <div className="rounded-2xl p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center text-2xl shadow-md shadow-amber-500/20">
                    🎁
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">ของขวัญประจำวัน</h4>
                    <p className="text-xs text-slate-500">รับแต้มสะสมฟรีจากน้องพาส</p>
                  </div>
                </div>

                {hasClaimedDaily ? (
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1">
                    <span>✓</span> รับแล้ว {claimedReward ? `+${claimedReward}` : ''}
                  </span>
                ) : (
                  <button
                    onClick={handleClaimDaily}
                    className="btn-primary py-2 px-3 text-xs font-bold shadow-md shadow-brand-500/25 animate-pulse"
                  >
                    กดรับ +35 แต้ม!
                  </button>
                )}
              </div>

              {/* Quick Actions with Nong Pass */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">ให้น้องพาสช่วยอะไรดีครับ?</p>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      navigate('/quiz');
                      setIsOpen(false);
                    }}
                    className="p-3 rounded-2xl border border-slate-200 hover:border-brand-400 hover:bg-brand-50/40 text-left transition-all group"
                  >
                    <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">🧭</div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-brand-600">ทำควิซค้นหาสไตล์</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">8 ข้อ แนะนำย่านที่ใช่</div>
                  </button>

                  <button
                    onClick={() => {
                      navigate('/plan/new');
                      setIsOpen(false);
                    }}
                    className="p-3 rounded-2xl border border-slate-200 hover:border-brand-400 hover:bg-brand-50/40 text-left transition-all group"
                  >
                    <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">🗺️</div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-brand-600">จัดแผนเที่ยวทันที</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">ระบุงบ เลือกรัศมีพิกัด</div>
                  </button>

                  <button
                    onClick={handleRollLuckyDistrict}
                    className="p-3 rounded-2xl border border-slate-200 hover:border-brand-400 hover:bg-brand-50/40 text-left transition-all group"
                  >
                    <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">🔮</div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-brand-600">สุ่มย่านเที่ยววันนี้</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">คิดไม่ออก น้องพาสเลือกให้</div>
                  </button>

                  <button
                    onClick={() => {
                      navigate('/profile');
                      setIsOpen(false);
                    }}
                    className="p-3 rounded-2xl border border-slate-200 hover:border-brand-400 hover:bg-brand-50/40 text-left transition-all group"
                  >
                    <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">🎟️</div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-brand-600">พาสและแต้มของฉัน</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">ดูคูปองและรางวัล</div>
                  </button>
                </div>
              </div>

              {/* Lucky District Card (if rolled) */}
              {luckyDistrict && (
                <div className="rounded-2xl p-3.5 bg-gradient-to-br from-brand-50 to-amber-50 border border-brand-200 animate-fade-in">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-brand-700 flex items-center gap-1">
                      <span>✨</span> ย่านที่น้องพาสจับสลากให้:
                    </span>
                    <span className="text-xl">{luckyDistrict.coverEmoji}</span>
                  </div>
                  <h5 className="font-extrabold text-base text-slate-900">{luckyDistrict.name}</h5>
                  <p className="text-xs text-slate-600 mt-1">{luckyDistrict.highlight}</p>
                  <button
                    onClick={handleGoToLuckyDistrict}
                    className="btn-primary w-full py-2 text-xs font-bold mt-3 shadow-md"
                  >
                    🚀 ไปจัดแผนย่านนี้เลย →
                  </button>
                </div>
              )}

              {/* Nong Pass Travel Advice */}
              <div className="rounded-2xl p-4 bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">💡</span>
                  <span className="text-xs font-bold text-slate-700">ทิปส์เดินทางจากน้องพาส</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  "{NONG_PASS_TIPS[Math.floor(Math.random() * NONG_PASS_TIPS.length)]}"
                </p>
              </div>

            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-400">
                OneDaypass Companion • น้องพาสคอยอยู่เคียงข้างคุณทุกทริป 💛
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
