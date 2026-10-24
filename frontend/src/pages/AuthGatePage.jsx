import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PROVINCES, REGIONS, getAmphoes, detectLocationFromGPS } from '../data/locations';
import { addPoints, getDeviceId, loginAccount, registerAccount } from '../api';

function getSavedAccounts() {
  try {
    const raw = localStorage.getItem('daypass_saved_accounts');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAccountToList(account) {
  try {
    const list = getSavedAccounts().filter(
      (a) => a.phoneOrEmail !== account.phoneOrEmail && a.nickname !== account.nickname
    );
    list.unshift({ ...account, lastLogin: new Date().toISOString() });
    localStorage.setItem('daypass_saved_accounts', JSON.stringify(list.slice(0, 5)));
  } catch {}
}

export default function AuthGatePage({ onAuthenticated }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('register'); // 'register' | 'login'

  // Register form states
  const [nickname, setNickname] = useState('');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [province, setProvince] = useState('bangkok');
  const [amphoe, setAmphoe] = useState('samphanthawong');
  const [tambon, setTambon] = useState('ตลาดน้อย');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Login form states
  const [loginPhoneOrEmail, setLoginPhoneOrEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [legacyProfileAvailable, setLegacyProfileAvailable] = useState(false);

  // Saved accounts list
  const [savedAccounts, setSavedAccounts] = useState([]);

  // UI status states
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // GPS state
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');
  const [detectedCoords, setDetectedCoords] = useState(null);

  const amphoeList = getAmphoes(province);

  // Load saved accounts on mount
  useEffect(() => {
    const accs = getSavedAccounts();
    setSavedAccounts(accs);
    try {
      const existingAuth = JSON.parse(localStorage.getItem('daypass_user_auth') || 'null');
      const existingProfile = JSON.parse(localStorage.getItem('daypass_user_profile') || 'null');
      if (!existingAuth?.accountId) {
        const legacy = { ...existingAuth, ...existingProfile };
        if (legacy.nickname || legacy.phoneOrEmail) {
          setNickname(legacy.nickname || '');
          setPhoneOrEmail(legacy.phoneOrEmail || '');
          const savedProvince = PROVINCES.some((item) => item.id === legacy.province)
            ? legacy.province
            : 'bangkok';
          setProvince(savedProvince);
          const savedAmphoe = legacy.amphoe || legacy.district;
          if (getAmphoes(savedProvince).some((item) => item.id === savedAmphoe)) setAmphoe(savedAmphoe);
          setTambon(legacy.tambon || 'ตลาดน้อย');
          setLegacyProfileAvailable(true);
        }
      }
    } catch {
      setLegacyProfileAvailable(false);
    }
  }, []);

  function handleProvinceChange(e) {
    const newProv = e.target.value;
    setProvince(newProv);
    const newAmphoes = getAmphoes(newProv);
    if (newAmphoes.length > 0) {
      setAmphoe(newAmphoes[0].id);
    } else {
      setAmphoe('');
    }
  }

  // Instant Authentication & Navigation Handler
  function completeAuthAndEnter(authData, userProfile) {
    try {
      localStorage.setItem('daypass_user_auth', JSON.stringify(authData));
      if (authData.accountId) localStorage.setItem('daypass_device_id', authData.accountId);
      if (userProfile) {
        localStorage.setItem('daypass_user_profile', JSON.stringify(userProfile));
        localStorage.setItem('daypass_profile', JSON.stringify(userProfile));
      }
      if (rememberMe) {
        saveAccountToList(authData);
      }
    } catch (e) {
      console.warn('Storage warning:', e);
    }
    // Navigate immediately to '/'
    navigate('/', { replace: true });
    // Trigger authentication state update synchronously
    if (onAuthenticated) onAuthenticated(authData);
    window.dispatchEvent(new Event('daypass_auth_changed'));
  }

  // GPS Auto-detect
  async function handleDetectGPS() {
    setGpsLoading(true);
    setError('');
    setGpsStatus('กำลังค้นหาพิกัดดาวเทียม GPS...');
    try {
      const detected = await detectLocationFromGPS();
      setProvince(detected.province);
      const newAmphoes = getAmphoes(detected.province);
      const matchedAmp = newAmphoes.find((a) => a.id === detected.amphoe);
      setAmphoe(matchedAmp ? matchedAmp.id : newAmphoes[0]?.id || '');
      setTambon(detected.tambon || 'ในเมือง');
      setDetectedCoords({ lat: detected.lat, lng: detected.lng, accuracy: detected.accuracy });
      setGpsStatus(`✓ ปักหมุดพิกัดสำเร็จ: ${detected.provinceName} (±${detected.accuracy}ม.)`);
      setTimeout(() => setGpsStatus(''), 4000);
    } catch (err) {
      setError(err.message || 'ไม่สามารถดึงตำแหน่ง GPS ได้');
      setGpsStatus('');
    } finally {
      setGpsLoading(false);
    }
  }

  async function handleRegister(e) {
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
    if (registerPassword.length < 8) {
      setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
      return;
    }
    if (registerPassword !== confirmPassword) {
      setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
      return;
    }

    setSubmitting(true);
    try {
      const selectedProvince = PROVINCES.find((p) => p.id === province);
      const selectedAmphoe = amphoeList.find((a) => a.id === amphoe);

      const accountData = {
        nickname: nickname.trim(),
        phoneOrEmail: phoneOrEmail.trim(),
        password: registerPassword,
        province,
        provinceName: selectedProvince ? selectedProvince.name : province,
        provinceEmoji: selectedProvince ? selectedProvince.emoji : '🏙️',
        amphoe,
        amphoeName: selectedAmphoe ? selectedAmphoe.name : amphoe,
        tambon: tambon.trim() || 'ในเมือง',
        lat: detectedCoords?.lat || selectedProvince?.lat || 13.7563,
        lng: detectedCoords?.lng || selectedProvince?.lng || 100.5018,
        registeredAt: new Date().toISOString(),
      };

      const { account: authData } = await registerAccount(accountData, getDeviceId());
      const userProfile = {
        nickname: authData.nickname,
        phoneOrEmail: authData.phoneOrEmail,
        province: authData.province,
        district: authData.amphoe,
        tambon: authData.tambon,
        lat: authData.lat,
        lng: authData.lng,
        homeBaseName: `${authData.provinceName} - ${authData.amphoeName} (${authData.tambon})`,
      };

      completeAuthAndEnter(authData, userProfile);
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่อีกครั้ง');
      setSubmitting(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError('');

    if (!loginPhoneOrEmail.trim()) {
      setError('กรุณากรอกเบอร์โทรศัพท์หรืออีเมล');
      return;
    }
    if (!loginPassword) {
      setError('กรุณากรอกรหัสผ่าน');
      return;
    }

    setSubmitting(true);
    try {
      const { account: authData } = await loginAccount(loginPhoneOrEmail.trim(), loginPassword, getDeviceId());
      const userProfile = {
        nickname: authData.nickname,
        phoneOrEmail: authData.phoneOrEmail,
        province: authData.province,
        district: authData.amphoe,
        tambon: authData.tambon,
        lat: authData.lat || 13.7563,
        lng: authData.lng || 100.5018,
        homeBaseName: `${authData.provinceName || 'กรุงเทพฯ'} - ${authData.amphoeName || ''}`,
      };

      completeAuthAndEnter(authData, userProfile);
    } catch (err) {
      setError(err.message || 'ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง');
      setSubmitting(false);
    }
  }

  // Selecting a saved account only fills its identifier; a password is still required.
  function handleSelectSavedAccount(acc) {
    setLoginPhoneOrEmail(acc.phoneOrEmail || '');
    setLoginPassword('');
    setError('');
  }

  // Quick Demo Guest Login (Instant!)
  function handleGuestDemo() {
    setSubmitting(true);
    setError('');
    const demoAuth = {
      nickname: 'ยิม (Demo Traveler)',
      phoneOrEmail: 'demo@onedaypass.travel',
      province: 'bangkok',
      provinceName: 'กรุงเทพมหานคร',
      provinceEmoji: '🏙️',
      amphoe: 'samphanthawong',
      amphoeName: 'เขตสัมพันธวงศ์ (ตลาดน้อย-เยาวราช)',
      tambon: 'ตลาดน้อย',
      lat: 13.7313,
      lng: 100.5105,
      registeredAt: new Date().toISOString(),
      isDemo: true,
    };

    const userProfile = {
      nickname: 'ยิม (Demo Traveler)',
      phoneOrEmail: 'demo@onedaypass.travel',
      province: 'bangkok',
      district: 'samphanthawong',
      tambon: 'ตลาดน้อย',
      lat: 13.7313,
      lng: 100.5105,
      homeBaseName: 'กรุงเทพมหานคร - เขตสัมพันธวงศ์ (ตลาดน้อย)',
    };

    addPoints(getDeviceId(), 50, 'welcome_bonus', 'ของขวัญต้อนรับสมาชิกใหม่ OneDaypass ✨')
      .catch((error) => console.error('Demo welcome points could not be added:', error));
    completeAuthAndEnter(demoAuth, userProfile);
  }

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-3 sm:p-6 lg:p-8 overflow-x-hidden font-sans bg-gradient-to-br from-amber-50 via-sky-50 to-orange-100/60">
      {/* Decorative ambient elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-orange-300/20 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-sky-300/25 blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] rounded-full bg-amber-200/20 blur-2xl" />

        {/* Floating Travel Emojis */}
        <span className="absolute top-10 left-[8%] text-3xl opacity-20 animate-float" style={{ animationDelay: '0s' }}>✈️</span>
        <span className="absolute top-28 right-[12%] text-4xl opacity-25 animate-float" style={{ animationDelay: '1.5s' }}>☁️</span>
        <span className="absolute bottom-20 left-[15%] text-3xl opacity-20 animate-float" style={{ animationDelay: '2.5s' }}>🌴</span>
        <span className="absolute bottom-32 right-[8%] text-3xl opacity-25 animate-float" style={{ animationDelay: '1s' }}>🎟️</span>
        <span className="absolute top-1/2 right-[5%] text-2xl opacity-15 animate-float" style={{ animationDelay: '3s' }}>🧭</span>
      </div>

      {/* Main Container Card */}
      <div className="relative z-10 w-full max-w-5xl bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        
        {/* ─── LEFT COLUMN: Brand, Mascot & Value Propositions ─── */}
        <div className="lg:col-span-5 bg-gradient-to-br from-sky-500 via-brand-500 to-amber-500 p-6 sm:p-8 lg:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-black/10 rounded-full blur-xl pointer-events-none" />

          {/* Top Header */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black tracking-wider uppercase border border-white/30 shadow-sm mb-3.5">
              <span>✈️</span>
              <span>OneDaypass Thailand</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight tracking-tight">
              เที่ยววันเดียว <br />
              <span className="text-amber-200">คุ้ม ครบ สนุก</span> ทั่วไทย
            </h1>

            <p className="text-sky-100 text-xs sm:text-sm mt-2 leading-relaxed">
              ครอบคลุม 77 จังหวัดทั่วไทย เลือกลุยได้ทั้งทริปสตรีทฟู้ด คาเฟ่ ธรรมชาติ และมรดกวัฒนธรรม
            </p>
          </div>

          {/* Mascot Showcase with Speech Bubble */}
          <div className="my-5 lg:my-6 relative z-10">
            {/* Speech bubble */}
            <div className="relative bg-white text-slate-800 p-4 rounded-2xl shadow-xl border border-amber-200 mb-3.5 animate-float">
              <div className="flex items-start gap-2.5">
                <span className="text-2xl">🐻</span>
                <div>
                  <div className="text-xs font-black text-brand-600 uppercase tracking-wide">น้องพาส • ไกด์ประจำตัว</div>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed mt-0.5">
                    "สวัสดีครับ! ก่อนเริ่มจัดทริป กรอกข้อมูลสั้นๆ หรือแตะ <strong>ระบุด้วย GPS</strong> ได้เลย รับฟรี <strong>50 แต้มต้อนรับ</strong> ทันทีค้าบ!"
                  </p>
                </div>
              </div>
              <div className="absolute -bottom-2 left-10 w-4 h-4 bg-white transform rotate-45 border-r border-b border-amber-200" />
            </div>

            {/* Mascot Avatar Card */}
            <div className="flex items-center gap-4 bg-white/15 backdrop-blur-md p-3 rounded-2xl border border-white/25">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden border-2 border-white shadow-lg bg-white flex-shrink-0">
                <img
                  src="/mascot/nong-pass-wave.jpg"
                  alt="น้องพาส มาสคอต OneDaypass"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="text-sm sm:text-base font-black flex items-center gap-1.5">
                  <span>น้องพาส (Nong Pass)</span>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="text-xs text-sky-100">มาสคอตนักเดินทาง & ที่ปรึกษาทริป</div>
                <div className="text-[11px] text-amber-200 font-bold mt-1">
                  ⭐ สมาชิกใหม่รับ +50 แต้มทันที
                </div>
              </div>
            </div>
          </div>

          {/* Feature Highlights Footer */}
          <div className="space-y-1.5 relative z-10 pt-3.5 border-t border-white/20 text-xs text-sky-50">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] flex-shrink-0 font-bold">✓</span>
              <span>เลือกเที่ยวย่านดังได้ครบ 77 จังหวัดทั่วไทย</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] flex-shrink-0 font-bold">✓</span>
              <span>มีตั๋วพาส, แผนที่เวลา, คูปองส่วนลดร้านดัง, และมิชชั่นถ่ายรูป</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] flex-shrink-0 font-bold">✓</span>
              <span>ระบบ GPS ตรวจจับตำแหน่งและแนะนำย่านใกล้ตัวแบบเรียลไทม์</span>
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: Auth Form (Register / Login) ─── */}
        <div className="lg:col-span-7 p-5 sm:p-8 lg:p-10 flex flex-col justify-between bg-white overflow-y-auto">
          <div>
            {/* Top Bar: Tabs & Quick Guest Demo */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
              {/* Tab Selector */}
              <div className="inline-flex p-1 bg-slate-100 rounded-2xl w-full sm:w-auto">
                <button
                  type="button"
                  id="tab-btn-register"
                  onClick={() => { setActiveTab('register'); setError(''); }}
                  className={`flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
                    activeTab === 'register'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🎉 ลงทะเบียน (+50 แต้ม)
                </button>
                <button
                  type="button"
                  id="tab-btn-login"
                  onClick={() => { setActiveTab('login'); setError(''); }}
                  className={`flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
                    activeTab === 'login'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🔑 เข้าสู่ระบบ
                </button>
              </div>

              {/* One-click Demo Button */}
              <button
                type="button"
                id="btn-guest-demo"
                onClick={handleGuestDemo}
                disabled={submitting}
                className="text-xs font-bold text-brand-600 hover:text-brand-800 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 cursor-pointer shadow-xs"
                title="ทดลองเข้าชมเว็บบอร์ดได้ทันทีไม่ต้องพิมพ์"
              >
                <span>⚡</span>
                <span>ทดลองเข้าชมด่วน (Demo)</span>
              </button>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-shake">
                <span className="text-base flex-shrink-0">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* ──────── TAB 1: REGISTER ──────── */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegister} className="mt-5 space-y-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    สร้างบัญชีนักเดินทางใหม่
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    สร้างบัญชีด้วยรหัสผ่าน เพื่อใช้ประวัติพาสและแต้มสะสมบัญชีเดียวกันได้ทุกอุปกรณ์
                  </p>
                </div>
                {legacyProfileAvailable && (
                  <p className="text-[11px] text-sky-800 bg-sky-50 border border-sky-200 rounded-xl p-2.5">
                    พบข้อมูลเดิมในอุปกรณ์นี้แล้ว ตรวจสอบข้อมูลและตั้งรหัสผ่านเพื่อเชื่อมบัญชี
                  </p>
                )}

                {/* Nickname & Contact (2 Columns) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">
                      👤 ชื่อเล่น / ชื่อที่ใช้เรียก <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="input-register-nickname"
                      type="text"
                      required
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="เช่น ยิม, มีน, แบงค์"
                      className="input-field py-2.5 text-xs sm:text-sm font-medium"
                      maxLength={40}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">
                      📱 เบอร์โทรศัพท์ หรือ Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="input-register-contact"
                      type="text"
                      required
                      value={phoneOrEmail}
                      onChange={(e) => setPhoneOrEmail(e.target.value)}
                      placeholder="081-xxx-xxxx หรือ email"
                      className="input-field py-2.5 text-xs sm:text-sm font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">
                    🔒 รหัสผ่าน <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-register-password"
                    type="password"
                    required
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="อย่างน้อย 8 ตัวอักษร"
                    className="input-field py-2.5 text-xs sm:text-sm font-medium"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">ใช้เบอร์/อีเมลและรหัสผ่านนี้เข้าสู่ระบบจากอุปกรณ์อื่น</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">
                    🔒 ยืนยันรหัสผ่าน <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-register-confirm-password"
                    type="password"
                    required
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่านเดิมอีกครั้ง"
                    className="input-field py-2.5 text-xs sm:text-sm font-medium"
                  />
                </div>
                <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                  เว็บทดลองยังไม่มี OTP หรือระบบกู้รหัสผ่าน โปรดเก็บรหัสผ่านนี้ไว้และอย่าใช้ซ้ำกับบริการอื่น
                </p>

                {/* Home Location Panel (Full width inputs to prevent truncation) */}
                <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200/90 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <span>🏠</span> ตำแหน่งที่อยู่ Home Base ของคุณ
                    </span>
                    
                    <button
                      type="button"
                      id="btn-register-detect-gps"
                      onClick={handleDetectGPS}
                      disabled={gpsLoading}
                      className="text-[11px] font-bold text-sky-700 bg-sky-100 hover:bg-sky-200 border border-sky-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      {gpsLoading ? (
                        <>
                          <span className="inline-block animate-spin text-xs">⟳</span>
                          <span>กำลังจับสัญญาณ GPS...</span>
                        </>
                      ) : (
                        <>
                          <span>🛰️</span>
                          <span>ดึงพิกัดจาก GPS อัตโนมัติ</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* GPS Status feedback */}
                  {gpsStatus && (
                    <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5 animate-fade-in">
                      <span>✓</span>
                      <span>{gpsStatus}</span>
                    </div>
                  )}

                  {/* Clarification banner as requested */}
                  <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200 leading-relaxed">
                    💡 <strong>คำแนะนำ:</strong> ข้อมูลนี้ใช้บันทึกที่อยู่บ้านของคุณ สำหรับแนะนำกิจกรรมใกล้ตัว โดยเวลาซื้อพาส <strong>คุณสามารถเลือกไปเที่ยวจังหวัดหรือย่านอื่นใดก็ได้ตามต้องการ</strong>
                  </div>

                  {/* Location Inputs: Province gets full width row, Amphoe and Tambon get 2 columns */}
                  <div className="space-y-2.5">
                    {/* Province - Full Width */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 mb-1 block">
                        จังหวัด (เลือกได้ครบทั้ง 77 จังหวัดทั่วไทย)
                      </label>
                      <select
                        id="select-register-province"
                        value={province}
                        onChange={handleProvinceChange}
                        className="input-field py-2.5 text-xs sm:text-sm font-semibold w-full"
                      >
                        {REGIONS.map((region) => {
                          const provInRegion = PROVINCES.filter((p) => p.region === region.id);
                          return (
                            <optgroup key={region.id} label={`── ${region.name} (${provInRegion.length} จังหวัด) ──`}>
                              {provInRegion.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.emoji} {p.name} ({p.nameEn})
                                </option>
                              ))}
                            </optgroup>
                          );
                        })}
                      </select>
                    </div>

                    {/* Amphoe & Tambon - 2 Columns */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Amphoe */}
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 mb-1 block">
                          อำเภอ / เขต
                        </label>
                        <select
                          id="select-register-amphoe"
                          value={amphoe}
                          onChange={(e) => setAmphoe(e.target.value)}
                          className="input-field py-2.5 text-xs sm:text-sm font-semibold w-full"
                        >
                          {amphoeList.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Tambon */}
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 mb-1 block">
                          ตำบล / แขวง
                        </label>
                        <input
                          id="input-register-tambon"
                          type="text"
                          value={tambon}
                          onChange={(e) => setTambon(e.target.value)}
                          placeholder="เช่น ตลาดน้อย, สุเทพ, บางแสน"
                          className="input-field py-2.5 text-xs sm:text-sm w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Welcome Bonus Privilege Box */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎁</span>
                    <div>
                      <div className="text-xs font-black text-amber-900">รับทันที 50 แต้มต้อนรับสมาชิกใหม่!</div>
                      <div className="text-[11px] text-amber-700">ใช้เป็นส่วนลด 100 บาทสำหรับพาสใบแรกทันที</div>
                    </div>
                  </div>
                  <span className="badge bg-amber-500 text-white font-black text-xs px-2.5 py-1 shadow-sm">
                    +50 แต้ม
                  </span>
                </div>

                {/* Remember Me */}
                <div className="flex items-center gap-2 pt-1 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    id="chk-remember-me"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                  />
                  <label htmlFor="chk-remember-me" className="cursor-pointer font-medium select-none">
                    บันทึกบัญชีไว้ให้เลือกครั้งหน้า (ยังต้องกรอกรหัสผ่าน)
                  </label>
                </div>

                {/* Submit Register Button */}
                <button
                  id="btn-submit-register"
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full py-3.5 text-base font-black shadow-xl shadow-brand-500/25 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-[0.98]"
                >
                  {submitting ? (
                    <span>⟳ กำลังเข้าสู่ระบบ...</span>
                  ) : (
                    <>
                      <span>🎉 ลงทะเบียน & เริ่มต้นออกเดินทาง</span>
                      <span className="text-lg">→</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ──────── TAB 2: LOGIN ──────── */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="mt-5 space-y-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    เข้าสู่ระบบบัญชีของคุณ
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    เลือกบัญชีที่เคยใช้งานบนเครื่องนี้ หรือ                    ใช้เบอร์โทรหรืออีเมลและรหัสผ่านที่ลงทะเบียนไว้
                  </p>
                </div>

                {/* Saved Accounts Fast Switcher */}
                {savedAccounts.length > 0 && (
                  <div className="p-3.5 rounded-3xl bg-amber-50/80 border border-amber-200/80 space-y-2">
                    <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                      <span>⚡</span> บัญชีที่เคยใช้บนอุปกรณ์นี้ (เลือกเพื่อกรอกเบอร์/อีเมล)
                    </span>
                    <div className="space-y-1.5">
                      {savedAccounts.map((acc, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectSavedAccount(acc)}
                          className="w-full p-2.5 rounded-2xl bg-white hover:bg-orange-50/80 border border-amber-200/60 shadow-xs flex items-center justify-between text-left transition-all active:scale-98 cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-500 to-amber-400 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                              {acc.nickname?.[0] || '👤'}
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                                {acc.nickname}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {acc.phoneOrEmail} {acc.provinceName ? `· ${acc.provinceName}` : ''}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded-xl border border-brand-200">
                            เลือกบัญชี
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manual Credentials */}
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                    📱 เบอร์โทรศัพท์ หรือ Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-login-contact"
                    type="text"
                    required
                    value={loginPhoneOrEmail}
                    onChange={(e) => setLoginPhoneOrEmail(e.target.value)}
                    autoComplete="username"
                    placeholder="เบอร์โทรศัพท์หรืออีเมลที่ลงทะเบียน"
                    className="input-field py-3 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                    🔒 รหัสผ่าน <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-login-password"
                    type="password"
                    required
                    maxLength={128}
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่านของบัญชี"
                    className="input-field py-3 text-sm font-medium"
                  />
                </div>
                <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                  หากลืมรหัสผ่าน รุ่นทดลองนี้ยังไม่มีระบบกู้คืน กรุณาเก็บรหัสผ่านไว้ให้ปลอดภัย
                </p>
                <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 text-sky-800 text-xs flex items-center gap-2.5">
                  <span className="text-lg">💡</span>
                  <span>ระบบจะดึงประวัติการซื้อพาส แต้มสะสม และคูปองของคุณขึ้นมาโดยอัตโนมัติ</span>
                </div>

                {/* Remember Me */}
                <div className="flex items-center gap-2 pt-1 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    id="chk-login-remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                  />
                  <label htmlFor="chk-login-remember" className="cursor-pointer font-medium select-none">
                    บันทึกเบอร์/อีเมลไว้บนอุปกรณ์นี้ (ไม่บันทึกรหัสผ่าน)
                  </label>
                </div>

                {/* Submit Login Button */}
                <button
                  id="btn-submit-login"
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full py-3.5 text-base font-black shadow-xl shadow-brand-500/25 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-[0.98]"
                >
                  {submitting ? (
                    <span>⟳ กำลังเข้าสู่ระบบ...</span>
                  ) : (
                    <>
                      <span>🔓 เข้าสู่ระบบ & เริ่มท่องเที่ยวทันที</span>
                      <span className="text-lg">→</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Privacy & Footer Note */}
          <div className="pt-5 mt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span>🔒</span>
              <span>ข้อมูลของคุณปลอดภัยและใช้เพื่อบริการจัดทริป OneDaypass เท่านั้น</span>
            </div>
            <div>
              OneDaypass Thailand © 2026
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
