import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addPoints, getDeviceId } from '../api';

const NONG_PASS_QUIZ_CHEERS = [
  'เลือกจุดสตาร์ทของวันเลยครับ! ☀️',
  'เรื่องกินเรื่องใหญ่ น้องพาสก็สายกินเหมือนกันนะ 🍜',
  'มุมถ่ายรูปสวยๆ ช่วยเก็บความทรงจำได้ดีเสมอ 📸',
  'วางแผนสไตล์ไหนก็สนุกได้ทั้งนั้นครับ ⏰',
  'แต่ละย่านในกรุงเทพมีเสน่ห์ไม่ซ้ำกันเลย 🏙️',
  'สบายกระเป๋าหรือจัดเต็ม น้องพาสช่วยคุมงบได้ 💰',
  'ไปคนเดียวหรือไปกับใคร ก็ฟินได้หมด 👥',
  'ข้อสุดท้ายแล้วครับ! กำลังจะได้ผลลัพธ์แล้ว ✨'
];

const QUIZ_QUESTIONS = [
  {
    id: 'q1',
    emoji: '☀️',
    question: 'ทริปในฝันของคุณเริ่มต้นยังไง?',
    options: [
      { label: 'จิบกาแฟช้าๆ ในร้านแสงดีๆ', tags: ['chill', 'cafe'] },
      { label: 'หาของกินตั้งแต่เปิดตา', tags: ['foodie', 'challenge'] },
      { label: 'ถ่ายรูปแสงเช้าสวยๆ ก่อนเลย', tags: ['photo', 'art'] },
      { label: 'ตื่นสาย แล้วค่อยออกตามอารมณ์', tags: ['night', 'chill'] },
    ],
  },
  {
    id: 'q2',
    emoji: '🍽️',
    question: 'อาหารที่คุณตามหาตลอดคือ?',
    options: [
      { label: 'สตรีทฟู้ดราคาโดนใจ กินเยอะคุ้มมาก', tags: ['foodie', 'challenge'] },
      { label: 'ร้านบรรยากาศดี อาหารสวยงามถ่ายรูปได้', tags: ['chill', 'photo'] },
      { label: 'ร้านเก่าแก่ดั้งเดิม รสต้นตำรับ', tags: ['heritage', 'art'] },
      { label: 'ของหวาน คาเฟ่ ขนมน่าลอง', tags: ['cafe', 'night'] },
    ],
  },
  {
    id: 'q3',
    emoji: '📸',
    question: 'คุณถ่ายรูปแบบไหนบ้าง?',
    options: [
      { label: 'ชอบมุมที่คนอื่นไม่ค่อยเจอ', tags: ['photo', 'challenge'] },
      { label: 'ถ่ายรูปกินอาหารทุกจานเลย', tags: ['foodie', 'photo'] },
      { label: 'ไม่ค่อยถ่าย เน้นอยู่ในโมเมนต์', tags: ['chill', 'night'] },
      { label: 'ถ่ายงานศิลปะ กราฟฟิตี้ สถาปัตย์', tags: ['art', 'heritage'] },
    ],
  },
  {
    id: 'q4',
    emoji: '⏰',
    question: 'คุณเป็นคนประเภทไหน?',
    options: [
      { label: 'วางแผนละเอียด รู้ว่าจะไปไหนทุกชั่วโมง', tags: ['challenge', 'heritage'] },
      { label: 'มีไอเดียคร่าวๆ แต่ยืดหยุ่นได้', tags: ['chill', 'art'] },
      { label: 'สุ่มเดิน เจออะไรก็กิน/ดู', tags: ['foodie', 'night'] },
      { label: 'ตามเพื่อน ขอแค่ไม่เหนื่อยมาก', tags: ['chill', 'cafe'] },
    ],
  },
  {
    id: 'q5',
    emoji: '🏙️',
    question: 'บรรยากาศย่านในฝันของคุณ?',
    options: [
      { label: 'ตรอกเล็กๆ กำแพงเก่า สีสันย้อนยุค', tags: ['art', 'heritage'] },
      { label: 'ย่านทันสมัย มีคาเฟ่และร้านน่ารัก', tags: ['cafe', 'chill'] },
      { label: 'ตลาดคึกคัก กลิ่นอาหาร เสียงดัง', tags: ['foodie', 'challenge'] },
      { label: 'ย่านราตรี บาร์ดนตรีสด ไฟสวย', tags: ['night', 'art'] },
    ],
  },
  {
    id: 'q6',
    emoji: '💰',
    question: 'คุณมองเรื่องงบยังไง?',
    options: [
      { label: 'กินดีอยู่ดี ไม่อั้น ขอแค่คุ้ม', tags: ['challenge', 'foodie'] },
      { label: 'ประหยัดได้ แต่ขอของดีนะ', tags: ['heritage', 'photo'] },
      { label: 'เดินเตร็ดก็ได้ ไม่ต้องใช้เงินมาก', tags: ['art', 'chill'] },
      { label: 'ขอบรรยากาศดีหน่อยก็พอ', tags: ['cafe', 'night'] },
    ],
  },
  {
    id: 'q7',
    emoji: '👥',
    question: 'มักไปเที่ยวกับใคร?',
    options: [
      { label: 'คนเดียว ฟินในแบบของตัวเอง', tags: ['chill', 'photo'] },
      { label: 'คู่รัก โรแมนติกนิดๆ', tags: ['cafe', 'night'] },
      { label: 'กลุ่มเพื่อน เฮฮา กินเยอะ', tags: ['foodie', 'challenge'] },
      { label: 'ครอบครัว ทุกวัย ทุกคนต้องสนุก', tags: ['heritage', 'chill'] },
    ],
  },
  {
    id: 'q8',
    emoji: '🎯',
    question: 'สิ่งที่ต้องมีทุกทริปคือ?',
    options: [
      { label: 'เมนูเด็ดที่ต้องลอง', tags: ['foodie', 'challenge'] },
      { label: 'รูปสวยๆ สักหนึ่งใบ', tags: ['photo', 'art'] },
      { label: 'ได้นั่งพัก นิ่งๆ ชาร์จแบต', tags: ['chill', 'cafe'] },
      { label: 'เรื่องราวและประวัติศาสตร์', tags: ['heritage', 'art'] },
    ],
  },
];

const STYLE_PROFILES = {
  chill:     { label: 'สายชิล สบายๆ ☕',    icon: '☕', color: 'from-blue-400 to-cyan-400',     desc: 'คุณชอบบรรยากาศผ่อนคลาย ไม่รีบ เน้นนั่งคาเฟ่ ถ่ายรูปแสงดี ฟีลดีทั้งวัน' },
  cafe:      { label: 'สายคาเฟ่ โฮปปิ้ง 🥐', icon: '🥐', color: 'from-amber-400 to-yellow-400',  desc: 'ตามล่าคาเฟ่ใหม่ ขนมน่ารัก บรรยากาศสวย เปลี่ยนร้านบ่อยๆ ตกหลุมรักทุกแก้ว' },
  foodie:    { label: 'สายกินลุย 🍜',         icon: '🍜', color: 'from-orange-500 to-red-500',     desc: 'ตระเวนกินจัดเต็ม ตามหาของอร่อยทุกซอย ไม่กลัวแดด ไม่กลัวแถว ขอแค่อร่อย' },
  photo:     { label: 'สายถ่ายรูป 📸',         icon: '📸', color: 'from-pink-400 to-rose-500',      desc: 'ชอบหามุมแปลกใหม่ ถ่ายรูปทุกอย่าง ฟีด IG ต้องสวย ตามหาแสงและบรรยากาศ' },
  art:       { label: 'สายอาร์ต สตรีท 🎨',   icon: '🎨', color: 'from-purple-400 to-violet-500',   desc: 'ชอบกราฟฟิตี้ งานศิลปะ สถาปัตยกรรม ย่านเก่าที่มีเรื่องราวและสีสัน' },
  heritage:  { label: 'สายมรดกวัฒนธรรม 🏛️', icon: '🏛️', color: 'from-stone-400 to-amber-600',    desc: 'ชอบสถานที่มีประวัติศาสตร์ ย่านเก่าแก่ อาหารต้นตำรับ รู้สึกเชื่อมต่อกับอดีต' },
  challenge: { label: 'สายท้าทาย แหลก ⚡',   icon: '⚡', color: 'from-green-400 to-emerald-500',   desc: 'ชอบลุยเต็มที่ ตะลุยทุกอย่างให้หมด มิชชั่นก็ชอบ เช็กอินก็โปร กลับบ้านหมด' },
  night:     { label: 'สายราตรี ไฟสวย 🌙',    icon: '🌙', color: 'from-indigo-500 to-purple-600',  desc: 'ชื่นชอบช่วงเย็น-กลางคืน บรรยากาศไฟสวย ดนตรีสด บาร์ดีๆ บิวเวิร์ดทุกคืน' },
};

// Map style → suggested districts
const STYLE_DISTRICT_MAP = {
  chill:     ['ari', 'silom'],
  cafe:      ['ari', 'thonglor'],
  foodie:    ['banthatthong', 'taladnoi', 'yaowarat'],
  photo:     ['taladnoi', 'phranakorn', 'chinatown'],
  art:       ['taladnoi', 'phranakorn'],
  heritage:  ['phranakorn', 'bangkokNoi'],
  challenge: ['banthatthong', 'yaowarat'],
  night:     ['thonglor', 'silom'],
};

function computeResult(answers) {
  const tally = {};
  answers.forEach((optIdx, qIdx) => {
    const q = QUIZ_QUESTIONS[qIdx];
    if (optIdx === null || optIdx === undefined) return;
    const tags = q.options[optIdx]?.tags || [];
    tags.forEach((t) => { tally[t] = (tally[t] || 0) + 1; });
  });
  const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  const topStyle = sorted[0]?.[0] || 'chill';
  return { style: topStyle, tally, suggestedDistricts: STYLE_DISTRICT_MAP[topStyle] || ['taladnoi'] };
}

export default function TravelQuizPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('intro'); // 'intro' | 'quiz' | 'result'
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState(Array(QUIZ_QUESTIONS.length).fill(null));
  const [result, setResult] = useState(null);
  const [animating, setAnimating] = useState(false);

  function handleAnswer(optIdx) {
    if (animating) return;
    const newAnswers = [...answers];
    newAnswers[currentQ] = optIdx;
    setAnswers(newAnswers);
    setAnimating(true);
    setTimeout(() => {
      setAnimating(false);
      if (currentQ < QUIZ_QUESTIONS.length - 1) {
        setCurrentQ((q) => q + 1);
      } else {
        const res = computeResult(newAnswers);
        setResult(res);
        // save to localStorage & award quiz points
        try {
          localStorage.setItem('daypass_travel_style', res.style);
          localStorage.setItem('daypass_quiz_result', JSON.stringify(res));
          addPoints(getDeviceId(), 20, 'quiz_complete', 'ทำควิซค้นหาสไตล์เที่ยวกับน้องพาส 🧭').catch(() => {});
        } catch {}
        setStep('result');
      }
    }, 350);
  }

  function handleUseSuggestion() {
    if (!result) return;
    sessionStorage.setItem('daypass_selected_district', result.suggestedDistricts[0]);
    sessionStorage.setItem('daypass_preset_style', result.style);
    navigate('/plan/new');
  }

  const progress = ((currentQ + (answers[currentQ] !== null ? 1 : 0)) / QUIZ_QUESTIONS.length) * 100;
  const q = QUIZ_QUESTIONS[currentQ];

  // ─── INTRO ──────────────────────────────────────────────────────────
  if (step === 'intro') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 animate-fade-in">
        <div className="max-w-lg w-full text-center">
          {/* Mascot Greeting */}
          <div className="relative inline-block mb-4">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-sky-100 mx-auto animate-bounce-slow ring-4 ring-brand-200">
              <img
                src="/mascot/nong-pass-wave.jpg"
                alt="น้องพาส ชวนทำควิซ"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="absolute bottom-1 right-2 px-2.5 py-0.5 rounded-full bg-brand-500 text-white text-[10px] font-extrabold shadow">
              น้องพาสพาเที่ยว ✨
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">
            ค้นหา<span className="bg-gradient-to-r from-brand-500 to-amber-500 bg-clip-text text-transparent">สไตล์เที่ยว</span>กับน้องพาส
          </h1>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-2">
            ตอบคำถาม 8 ข้อสั้นๆ ให้น้องพาสช่วยประมวลผลว่า ย่านไหนและสไตล์ไหนที่เหมาะกับคุณที่สุด!
          </p>
          <p className="text-slate-400 text-sm mb-6">รับฟรี 20 แต้มสะสมเมื่อทำควิซจบ 💛</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {Object.entries(STYLE_PROFILES).slice(0, 4).map(([key, s]) => (
              <div key={key} className={`rounded-2xl p-3 text-center bg-gradient-to-br ${s.color} text-white shadow-md`}>
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-xs font-bold leading-tight">{s.label.split(' ')[0]}</div>
              </div>
            ))}
          </div>

          <button
            id="btn-quiz-start"
            onClick={() => setStep('quiz')}
            className="btn-primary py-4 text-base font-bold shadow-xl shadow-brand-500/25 max-w-xs mx-auto"
          >
            🧭 เริ่มทำควิซเลย →
          </button>
          <button
            onClick={() => navigate(-1)}
            className="mt-3 block text-slate-400 text-sm hover:text-slate-600 transition-colors mx-auto"
          >
            ← ย้อนกลับ
          </button>
        </div>
      </div>
    );
  }

  // ─── RESULT ─────────────────────────────────────────────────────────
  if (step === 'result' && result) {
    const profile = STYLE_PROFILES[result.style] || STYLE_PROFILES.chill;
    const top3 = Object.entries(result.tally)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([style]) => STYLE_PROFILES[style])
      .filter(Boolean);

    return (
      <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 animate-fade-in">
        <div className="max-w-lg w-full">
          {/* Nong Pass Celebration Banner */}
          <div className="glass-card mb-4 bg-gradient-to-r from-sky-50 via-white to-amber-50 border-orange-200 flex items-center gap-4 p-4 shadow-lg">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-sky-100 flex-shrink-0">
              <img
                src="/mascot/nong-pass-guide.jpg"
                alt="น้องพาส ยินดีด้วย"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="text-[11px] font-bold text-brand-600 uppercase tracking-wide bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200">
                น้องพาสคำนวณสำเร็จ! 🎉
              </span>
              <h3 className="font-extrabold text-slate-900 text-base mt-1">ยินดีด้วยครับ! ได้สไตล์ที่ใช่แล้ว</h3>
              <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                น้องพาสพร้อมนำทางตามพิกัดและร้านเด็ดที่คัดสรรมาให้คุณโดยเฉพาะ
              </p>
            </div>
          </div>

          {/* Result card */}
          <div className={`rounded-3xl bg-gradient-to-br ${profile.color} p-1 shadow-2xl mb-5`}>
            <div className="bg-white rounded-[22px] p-6 sm:p-8 text-center">
              <div className="text-6xl mb-3">{profile.icon}</div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">สไตล์การเที่ยวของคุณ</div>
              <h1 className={`text-2xl sm:text-3xl font-extrabold mb-3 bg-gradient-to-r ${profile.color} bg-clip-text text-transparent`}>
                {profile.label}
              </h1>
              <p className="text-slate-600 text-sm leading-relaxed">{profile.desc}</p>

              {/* Score bars */}
              <div className="mt-5 space-y-2 text-left">
                {top3.map((p, i) => {
                  const score = result.tally[Object.keys(STYLE_PROFILES).find(k => STYLE_PROFILES[k] === p)] || 0;
                  const maxScore = Math.max(...Object.values(result.tally));
                  return (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="w-5">{p.icon}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${p.color} transition-all duration-700`}
                          style={{ width: `${(score / maxScore) * 100}%` }}
                        />
                      </div>
                      <span className="text-slate-500 w-16 truncate">{p.label.split(' ')[0]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Suggested districts */}
          <div className="glass-card bg-white mb-4">
            <p className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <span>📍</span> ย่านแนะนำสำหรับคุณ
            </p>
            <div className="flex flex-wrap gap-2">
              {result.suggestedDistricts.map((d) => (
                <span key={d} className="px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold">
                  {d}
                </span>
              ))}
            </div>
          </div>

          {/* CTA buttons */}
          <button
            id="btn-quiz-use-result"
            onClick={handleUseSuggestion}
            className="btn-primary py-4 font-bold text-base mb-3"
          >
            ✨ ไปวางแผนเที่ยวตามผลลัพธ์ →
          </button>
          <button
            onClick={() => {
              setStep('quiz');
              setCurrentQ(0);
              setAnswers(Array(QUIZ_QUESTIONS.length).fill(null));
              setResult(null);
            }}
            className="btn-secondary py-3 text-sm font-semibold"
          >
            🔄 ทำควิซใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  // ─── QUIZ ────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col py-8 px-4 animate-fade-in">
      <div className="max-w-xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => currentQ > 0 ? setCurrentQ(q => q - 1) : setStep('intro')}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 active:scale-95 transition-all shadow-sm text-sm"
          >
            ←
          </button>
          <div className="text-center">
            <span className="text-xs text-slate-400 font-semibold">ข้อ {currentQ + 1} / {QUIZ_QUESTIONS.length}</span>
          </div>
          <div className="w-9" />
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 mb-6 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-amber-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Nong Pass Companion Cheer */}
        <div className="flex items-center justify-center gap-2 mb-6 animate-fade-in">
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-brand-300 shadow-sm flex-shrink-0 bg-sky-100">
            <img src="/mascot/nong-pass-wave.jpg" alt="น้องพาส" className="w-full h-full object-cover" />
          </div>
          <div className="bg-brand-50 border border-brand-200 text-brand-800 text-xs px-3.5 py-1.5 rounded-full font-medium shadow-sm flex items-center gap-1.5">
            <span className="font-bold text-brand-600">น้องพาส:</span>
            <span>{NONG_PASS_QUIZ_CHEERS[currentQ] || 'น้องพาสกำลังฟังอยู่เลยครับ! ✨'}</span>
          </div>
        </div>

        {/* Question */}
        <div className={`text-center mb-8 transition-all duration-300 ${animating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
          <div className="text-5xl mb-4">{q.emoji}</div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">{q.question}</h2>
        </div>

        {/* Options */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 transition-all duration-300 ${animating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
          {q.options.map((opt, idx) => {
            const isSelected = answers[currentQ] === idx;
            return (
              <button
                key={idx}
                id={`quiz-q${currentQ + 1}-opt${idx + 1}`}
                onClick={() => handleAnswer(idx)}
                className={`p-4 rounded-2xl text-left border transition-all duration-150 font-medium text-sm leading-relaxed ${
                  isSelected
                    ? 'bg-brand-50 border-brand-500 text-brand-800 ring-2 ring-brand-500/20 shadow-md'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-brand-300 hover:bg-brand-50/50 hover:shadow-sm'
                }`}
              >
                <span className="mr-1.5">{['A', 'B', 'C', 'D'][idx]}.</span>
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center gap-1.5 mt-8">
          {QUIZ_QUESTIONS.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === currentQ
                  ? 'w-5 h-2 bg-brand-500'
                  : answers[i] !== null
                  ? 'w-2 h-2 bg-brand-300'
                  : 'w-2 h-2 bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
