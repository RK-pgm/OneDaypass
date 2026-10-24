import { useState, useEffect } from 'react';
import { PROVINCES, AMPHOES_BY_PROVINCE } from '../data/locations';
import { addPoints, getDeviceId } from '../api';

export default function AuthGateModal({ onAuthenticated }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(false);

  // Form states
  const [nickname, setNickname] = useState('');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [province, setProvince] = useState('bangkok');
  const [amphoe, setAmphoe] = useState('samphanthawong');
  const [tambon, setTambon] = useState('ตลาดน้อย');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Check auth state on load
  useEffect(() => {
    try {
      const auth = localStorage.getItem('daypass_user_auth');
      if (!auth) {
        setIsOpen(true);
      }
    } catch {
      setIsOpen(true);
    }
  }, []);

  // Update amphoe options when province changes
  const amphoeList = AMPHOES_BY_PROVINCE[province] || [];

  function handleProvinceChange(e) {
    const newProv = e.target.value;
    setProvince(newProv);
    const newAmphoes = AMPHOES_BY_PROVINCE[newProv] || [];
    if (newAmphoes.length > 0) {
      setAmphoe(newAmphoes[0].id);
    } else {
      setAmphoe('');
    }
  }

  async function handleRegisterOrLogin(e) {
    e.preventDefault();
    setError('');

    if (!nickname.trim()) {
      setError('กรุณากรอกชื่อเล่นหรือชื่อที่ต้องการให้เรียก');
      return;
    }
    if (!phoneOrEmail.trim()) {
      setError('กรุณากรอกเบอร์โทรศัพท์หรืออีเมล');
      return;
    }

    setSubmitting(true);
    try {
      const authData = {
        nickname: nickname.trim(),
        phoneOrEmail: phoneOrEmail.trim(),
        province,
        amphoe,
        tambon: tambon.trim() || 'ในเมือง',
        registeredAt: new Date().toISOString(),
      };

      // Save to localStorage
      localStorage.setItem('daypass_user_auth', JSON.stringify(authData));

      // Also sync user profile
      const userProfile = {
        nickname: nickname.trim(),
        phoneOrEmail: phoneOrEmail.trim(),
        province,
        district: amphoe,
        tambon: tambon.trim(),
        homeBaseName: `${PROVINCES.find((p) => p.id === province)?.name || ''} - ${tambon || ''}`,
      };
      localStorage.setItem('daypass_user_profile', JSON.stringify(userProfile));
      localStorage.setItem('daypass_profile', JSON.stringify(userProfile));

      // Award welcome bonus points if new register
      if (!isLoginMode) {
        await addPoints(getDeviceId(), 50, 'welcome_bonus', 'ของขวัญต้อนรับสมาชิกใหม่ OneDaypass ✨').catch(() => {});
      }

      setIsOpen(false);
      if (onAuthenticated) onAuthenticated(authData);
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-orange-200 overflow-hidden flex flex-col animate-slide-up"
        role="dialog"
        aria-modal="true"
      >
        {/* Header with Mascot */}
        <div className="bg-gradient-to-r from-sky-400 via-brand-500 to-amber-500 p-6 text-white relative">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-white shadow-lg bg-sky-100 flex-shrink-0 animate-bounce-slow">
              <img
                src="/mascot/nong-pass-wave.jpg"
                alt="น้องพาส"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold tracking-wide mb-1">
                🐻 ยินดีต้อนรับสู่ OneDaypass!
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold leading-tight">
                {isLoginMode ? 'เข้าสู่ระบบบัญชีของคุณ' : 'ลงทะเบียนก่อนเริ่มเที่ยว'}
              </h2>
              <p className="text-xs text-sky-100 mt-1 leading-snug">
                {isLoginMode 
                  ? 'กรอกข้อมูลเดิมของคุณเพื่อเปิดใช้งานพาสและแต้มสะสม' 
                  : 'กรอกข้อมูลสั้นๆ พร้อมรับฟรี 50 แต้มต้อนรับทันที ✨'}
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleRegisterOrLogin} className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              ⚠️ {error}
            </div>
          )}

          {/* Nickname & Phone/Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">
                👤 ชื่อเล่น / ชื่อที่ใช้เรียก <span className="text-rose-500">*</span>
              </label>
              <input
                id="auth-input-nickname"
                type="text"
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="เช่น น้องมีน, แบงค์, พลอย"
                className="input-field py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">
                📱 เบอร์โทรศัพท์ หรือ Email <span className="text-rose-500">*</span>
              </label>
              <input
                id="auth-input-contact"
                type="text"
                required
                value={phoneOrEmail}
                onChange={(e) => setPhoneOrEmail(e.target.value)}
                placeholder="081-xxx-xxxx หรือ email"
                className="input-field py-2.5 text-sm"
              />
            </div>
          </div>

          {/* Address Section (Province, Amphoe, Tambon) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <span>🏠</span> ตำแหน่งที่อยู่ปัจจุบันของคุณ (Home Base)
              </span>
              <span className="text-[10px] bg-slate-200/80 text-slate-600 px-2 py-0.5 rounded font-bold">
                เก็บข้อมูล
              </span>
            </div>

            {/* Explanatory banner as requested by user */}
            <p className="text-[11px] text-slate-500 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-200">
              💡 <strong>คำแนะนำ:</strong> ข้อมูลนี้ใช้สำหรับบันทึกที่อยู่บ้านของคุณ เมื่อคุณต้องการซื้อพาส คุณสามารถเลือกไปเที่ยวจังหวัดหรือย่านอื่นใดก็ได้ตามต้องการ
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Province */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">จังหวัด</label>
                <select
                  id="auth-select-province"
                  value={province}
                  onChange={handleProvinceChange}
                  className="input-field py-2 text-xs font-medium"
                >
                  {PROVINCES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.emoji} {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amphoe / Khet */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">อำเภอ / เขต</label>
                <select
                  id="auth-select-amphoe"
                  value={amphoe}
                  onChange={(e) => setAmphoe(e.target.value)}
                  className="input-field py-2 text-xs font-medium"
                >
                  {amphoeList.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tambon / Khwaeng */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">ตำบล / แขวง</label>
                <input
                  id="auth-input-tambon"
                  type="text"
                  value={tambon}
                  onChange={(e) => setTambon(e.target.value)}
                  placeholder="เช่น ตลาดน้อย, สุเทพ"
                  className="input-field py-2 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Welcome Points Privilege Card */}
          {!isLoginMode && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🎁</span>
                <div>
                  <div className="text-xs font-extrabold text-amber-900">รับทันที 50 แต้มต้อนรับสมาชิกใหม่!</div>
                  <div className="text-[11px] text-amber-700">ใช้ลดราคาพาสได้ 100 บาททันทีในทริปแรก</div>
                </div>
              </div>
              <span className="badge bg-amber-500 text-white font-extrabold text-xs px-2.5 py-1">
                +50 แต้ม
              </span>
            </div>
          )}

          {/* Submit Button */}
          <button
            id="btn-auth-submit"
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-3.5 text-base font-bold shadow-xl shadow-brand-500/25 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <span>⟳ กำลังบันทึกข้อมูล...</span>
            ) : (
              <>
                <span>{isLoginMode ? '🔓 เข้าสู่ระบบเลย' : '🎉 ลงทะเบียน & เริ่มใช้งาน'}</span>
                <span>→</span>
              </>
            )}
          </button>

          {/* Toggle Login / Register */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setError('');
              }}
              className="text-xs text-brand-600 hover:text-brand-800 font-bold hover:underline"
            >
              {isLoginMode 
                ? '← ยังไม่มีบัญชี? ลงทะเบียนใหม่รับ 50 แต้ม' 
                : 'มีบัญชีอยู่แล้ว? กดเพื่อเข้าสู่ระบบ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
