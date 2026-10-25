import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PROVINCES,
  findAdministrativeDistrict,
  findAdministrativeSubdistrict,
  getAdministrativeDistricts,
  getAdministrativeSubdistricts,
} from '../data/locations';
import { addPoints, getDeviceId, loginAccount, registerAccount, socialLoginAccount, googleLoginAccount } from '../api';
import { encodeProfilePhoto } from '../utils/profilePhoto';
import { getBangkokDate } from '../utils/date';

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

const defaultDistrict = findAdministrativeDistrict('bangkok', 'samphanthawong')
  || getAdministrativeDistricts('bangkok')[0];
const defaultTambon = findAdministrativeSubdistrict('bangkok', defaultDistrict?.id, 'ตลาดน้อย')
  || getAdministrativeSubdistricts('bangkok', defaultDistrict?.id)[0];
const todayDate = getBangkokDate();

export default function AuthGatePage({ onAuthenticated }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('register'); // 'register' | 'login'

  // Register form states
  const [nickname, setNickname] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [province, setProvince] = useState('bangkok');
  const [amphoe, setAmphoe] = useState(defaultDistrict?.id || '');
  const [tambon, setTambon] = useState(defaultTambon?.id || '');
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
  const [socialLoading, setSocialLoading] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');

  // Real Google OAuth Configuration state
  const envGoogleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '66274212738-mn58k9bda2n8ig62m0ifa8dcavitkcoa.apps.googleusercontent.com';
  const [googleClientId, setGoogleClientId] = useState(() => {
    try {
      return localStorage.getItem('daypass_google_client_id') || envGoogleClientId;
    } catch {
      return envGoogleClientId;
    }
  });
  const [tempClientIdInput, setTempClientIdInput] = useState(googleClientId);
  const [googleSetupTab, setGoogleSetupTab] = useState('config'); // 'config' | 'guide' | 'demo'
  const googleBtnContainerRef = useRef(null);
  const amphoeList = getAdministrativeDistricts(province);
  const tambonList = getAdministrativeSubdistricts(province, amphoe);

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
          setFullName(legacy.fullName || '');
          setPhoneOrEmail(legacy.phoneOrEmail || '');
          setEmail(legacy.email || '');
          setDateOfBirth(legacy.dateOfBirth || '');
          setCurrentAddress(legacy.currentAddress || '');
          setProfilePhoto(legacy.profilePhoto || '');
          const savedProvince = PROVINCES.some((item) => item.id === legacy.province)
            ? legacy.province
            : 'bangkok';
          setProvince(savedProvince);
          const savedAmphoe = legacy.amphoe || legacy.district;
          const matchedAmphoe = findAdministrativeDistrict(savedProvince, savedAmphoe)
            || getAdministrativeDistricts(savedProvince)[0];
          setAmphoe(matchedAmphoe?.id || '');
          const matchedTambon = findAdministrativeSubdistrict(savedProvince, matchedAmphoe?.id, legacy.tambon)
            || getAdministrativeSubdistricts(savedProvince, matchedAmphoe?.id)[0];
          setTambon(matchedTambon?.id || '');
          setLegacyProfileAvailable(true);
        }
      }
    } catch {
      setLegacyProfileAvailable(false);
    }
  }, []);

  async function handleProfilePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      setProfilePhoto(await encodeProfilePhoto(file));
    } catch (err) {
      setError(err.message || 'ไม่สามารถใช้รูปนี้ได้ กรุณาเลือกรูปใหม่');
    } finally {
      e.target.value = '';
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

  function handleRemoveSavedAccount(accountToRemove) {
    const updatedAccounts = savedAccounts.filter((account) => (
      account.accountId && accountToRemove.accountId
        ? account.accountId !== accountToRemove.accountId
        : account.phoneOrEmail !== accountToRemove.phoneOrEmail
    ));
    setSavedAccounts(updatedAccounts);
    try {
      localStorage.setItem('daypass_saved_accounts', JSON.stringify(updatedAccounts));
    } catch (err) {
      console.warn('Could not update saved accounts on this device:', err);
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
      setError('กรุณากรอกเบอร์โทรศัพท์');
      return;
    }
    if (!fullName.trim() || !email.trim() || !dateOfBirth) {
      setError('กรุณากรอกชื่อ-นามสกุล อีเมล และวันเดือนปีเกิดให้ครบ');
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
      const selectedTambon = tambonList.find((item) => item.id === tambon);

      const accountData = {
        nickname: nickname.trim(),
        fullName: fullName.trim(),
        phoneOrEmail: phoneOrEmail.trim(),
        email: email.trim(),
        dateOfBirth,
        currentAddress: currentAddress.trim(),
        profilePhoto,
        password: registerPassword,
        province,
        provinceName: selectedProvince ? selectedProvince.name : province,
        provinceEmoji: selectedProvince ? selectedProvince.emoji : '🏙️',
        amphoe,
        amphoeName: selectedAmphoe ? selectedAmphoe.name : amphoe,
        tambon: selectedTambon?.name || '',
        lat: selectedProvince?.lat || 13.7563,
        lng: selectedProvince?.lng || 100.5018,
      };

      const { account: authData } = await registerAccount(accountData, getDeviceId());
      const userProfile = {
        nickname: authData.nickname,
        fullName: authData.fullName,
        phoneOrEmail: authData.phoneOrEmail,
        email: authData.email,
        dateOfBirth: authData.dateOfBirth,
        currentAddress: authData.currentAddress,
        profilePhoto: authData.profilePhoto,
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
        fullName: authData.fullName,
        phoneOrEmail: authData.phoneOrEmail,
        email: authData.email,
        dateOfBirth: authData.dateOfBirth,
        currentAddress: authData.currentAddress,
        profilePhoto: authData.profilePhoto,
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

  // Handle successful Google auth from either Credential (JWT) or Access Token
  async function handleGoogleLoginSuccess(responsePayload) {
    setError('');
    setSocialLoading('google');
    setSubmitting(true);
    try {
      const { account: authData } = await googleLoginAccount(responsePayload, getDeviceId());
      const userProfile = {
        nickname: authData.nickname,
        fullName: authData.fullName,
        phoneOrEmail: authData.phoneOrEmail,
        email: authData.email,
        dateOfBirth: authData.dateOfBirth,
        currentAddress: authData.currentAddress,
        profilePhoto: authData.profilePhoto,
        province: authData.province,
        district: authData.amphoe,
        tambon: authData.tambon,
        lat: authData.lat || 13.7313,
        lng: authData.lng || 100.5105,
        homeBaseName: `${authData.provinceName || 'กรุงเทพมหานคร'} - ${authData.amphoeName || 'สัมพันธวงศ์'}`,
      };
      completeAuthAndEnter(authData, userProfile);
    } catch (err) {
      setError(err.message || 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้');
      setSubmitting(false);
      setSocialLoading('');
    }
  }

  // Real Google Sign-In Trigger
  function triggerRealGoogleLogin() {
    setError('');
    const activeClientId = googleClientId?.trim();
    if (!activeClientId) {
      setShowGoogleModal(true);
      return;
    }

    setSocialLoading('google');

    if (window.google?.accounts?.id) {
      try {
        setSubmitting(true);
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment() || notification.isDismissedMoment()) {
            setSocialLoading('');
            setSubmitting(false);
            setError('Google ไม่แสดงหน้าต่างเลือกบัญชี กรุณากดปุ่ม Google ด้านล่าง หรืออนุญาตการลงชื่อเข้าใช้ในเบราว์เซอร์');
          }
        });
        return;
      } catch (err) {
        console.warn('Google prompt failed:', err);
      }
    }

    setSocialLoading('');
    setSubmitting(false);
    setError('ระบบ Google Sign-In กำลังโหลด กรุณารอสักครู่แล้วลองกดใหม่อีกครั้ง');
  }

  // Initialize Google Identity Services when googleClientId changes
  useEffect(() => {
    const activeClientId = googleClientId?.trim();
    if (!activeClientId) return;

    function initGis() {
      if (!window.google?.accounts?.id) return;
      try {
        window.google.accounts.id.initialize({
          client_id: activeClientId,
          callback: async (res) => {
            if (res.credential) {
              await handleGoogleLoginSuccess({ credential: res.credential });
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        if (googleBtnContainerRef.current) {
          googleBtnContainerRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'pill',
            logo_alignment: 'left',
            width: 280,
          });
        }
      } catch (err) {
        console.warn('Google Identity Services init error:', err);
      }
    }

    if (window.google?.accounts?.id) {
      initGis();
    } else {
      const timer = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(timer);
          initGis();
        }
      }, 300);
      return () => clearInterval(timer);
    }
  }, [googleClientId]);

  function handleSaveGoogleClientId(e) {
    e?.preventDefault();
    const cleanId = tempClientIdInput.trim();
    if (!cleanId) {
      setError('กรุณากรอก Google Client ID');
      return;
    }
    try {
      localStorage.setItem('daypass_google_client_id', cleanId);
    } catch {}
    setGoogleClientId(cleanId);
    setShowGoogleModal(false);
    setError('');
    setTimeout(() => {
      triggerRealGoogleLogin();
    }, 350);
  }

  function handleResetGoogleClientId() {
    try {
      localStorage.removeItem('daypass_google_client_id');
    } catch {}
    setGoogleClientId(envGoogleClientId || '');
    setTempClientIdInput(envGoogleClientId || '');
    setError('');
  }

  async function handleSocialLogin(provider, customData = null) {
    setError('');
    setSocialLoading(provider);
    setSubmitting(true);
    try {
      let payload;
      if (provider === 'google') {
        const email = customData?.email?.trim().toLowerCase() || 'somchai.traveler@gmail.com';
        const name = customData?.name?.trim() || 'สมชาย ใจดี';
        payload = {
          provider: 'google',
          providerId: `google_${email}`,
          email,
          name,
          avatar: '/mascot/nong-pass-guide.jpg',
        };
      } else {
        payload = {
          provider: 'line',
          providerId: `line_${Date.now()}`,
          email: 'linetraveler@line.me',
          name: 'นักเดินทาง LINE',
          avatar: '/mascot/nong-pass-wave.jpg',
        };
      }

      const { account: authData } = await socialLoginAccount(payload, getDeviceId());
      const userProfile = {
        nickname: authData.nickname,
        fullName: authData.fullName,
        phoneOrEmail: authData.phoneOrEmail,
        email: authData.email,
        dateOfBirth: authData.dateOfBirth,
        currentAddress: authData.currentAddress,
        profilePhoto: authData.profilePhoto,
        province: authData.province,
        district: authData.amphoe,
        tambon: authData.tambon,
        lat: authData.lat || 13.7313,
        lng: authData.lng || 100.5105,
        homeBaseName: `${authData.provinceName || 'กรุงเทพมหานคร'} - ${authData.amphoeName || 'สัมพันธวงศ์'}`,
      };

      completeAuthAndEnter(authData, userProfile);
    } catch (err) {
      setError(err.message || 'ไม่สามารถเข้าสู่ระบบด้วย Social Account ได้');
      setSubmitting(false);
      setSocialLoading('');
    }
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
                    "สวัสดีครับ! สมัครสมาชิกเพื่อบันทึกประวัติพาสและแต้มสะสม รับฟรี <strong>50 แต้มต้อนรับ</strong> ทันทีค้าบ!"
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
              <span>ระบบระบุตำแหน่งปัจจุบันและแนะนำย่านใกล้ตัวแบบเรียลไทม์</span>
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

            {/* ── FAST 1-CLICK SOCIAL LOGIN (Google & LINE) ── */}
            <div className="mt-5 p-4 rounded-3xl bg-gradient-to-br from-amber-50/70 via-orange-50/40 to-emerald-50/50 border border-amber-200/90 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <span className="text-amber-500 animate-pulse">⚡</span> เข้าใช้งานด่วน 1 คลิก (สะดวกรวดเร็ว ไม่ต้องจำรหัสผ่าน)
                </span>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500 text-white shadow-xs">
                  ✨ แนะนำ
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {/* LINE Button */}
                <button
                  type="button"
                  id="btn-social-line"
                  onClick={() => handleSocialLogin('line')}
                  disabled={submitting}
                  className="w-full max-w-[280px] mx-auto flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-[#06C755] hover:bg-[#05b34c] text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-98 cursor-pointer group"
                  style={{ boxShadow: '0 4px 14px rgba(6,199,85,0.25)' }}
                >
                  <svg className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .626.285.626.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                  </svg>
                  <span>{socialLoading === 'line' ? 'กำลังเชื่อมต่อ LINE...' : 'เข้าสู่ระบบด้วย LINE'}</span>
                </button>
              </div>

              <div ref={googleBtnContainerRef} className="mt-2.5 flex justify-center [&>div]:mx-auto" />

              {/* Google OAuth setup/status */}
              <div className="mt-2.5 pt-2 border-t border-amber-200/50 flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${googleClientId ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  <span>{googleClientId ? 'เชื่อมต่อ Google OAuth แล้ว' : 'ยังไม่ได้เชื่อมต่อ Client ID'}</span>
                </span>
                <button
                  type="button"
                  id="btn-custom-google-toggle"
                  onClick={() => setShowGoogleModal(true)}
                  className="font-bold text-brand-600 hover:text-brand-800 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>⚙️ ตั้งค่า Google OAuth จริง</span>
                </button>
              </div>
            </div>

            {/* Google Real OAuth / Custom Setup Modal */}
            {showGoogleModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
                <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 text-sm">เชื่อมต่อกับ Google จริง (OAuth 2.0)</h3>
                        <p className="text-[11px] text-slate-500">เลือกบัญชี Google จริงและล็อกอินทันที</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowGoogleModal(false)}
                      className="text-slate-400 hover:text-slate-600 text-base font-bold cursor-pointer p-1"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Tab Navigation inside Modal */}
                  <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setGoogleSetupTab('config')}
                      className={`flex-1 py-1.5 rounded-lg transition-all ${
                        googleSetupTab === 'config' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      🔑 กรอก Client ID
                    </button>
                    <button
                      type="button"
                      onClick={() => setGoogleSetupTab('guide')}
                      className={`flex-1 py-1.5 rounded-lg transition-all ${
                        googleSetupTab === 'guide' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      📋 วิธีขอ ID ฟรี
                    </button>
                    <button
                      type="button"
                      onClick={() => setGoogleSetupTab('demo')}
                      className={`flex-1 py-1.5 rounded-lg transition-all ${
                        googleSetupTab === 'demo' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      ⚡ Quick Demo
                    </button>
                  </div>

                  {/* Tab Content 1: Client ID Configuration */}
                  {googleSetupTab === 'config' && (
                    <form onSubmit={handleSaveGoogleClientId} className="space-y-3">
                      <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-2xl text-[11px] text-sky-900 leading-relaxed">
                        <span className="font-bold">💡 Google กำหนดความปลอดภัย:</span> ใช้ Google OAuth Client ID จาก Google Cloud Console ค่านี้ที่บันทึกตรงนี้มีผลเฉพาะเบราว์เซอร์นี้ หากต้องการให้ผู้ใช้ทุกคนล็อกอินได้ ให้ตั้ง <strong>VITE_GOOGLE_CLIENT_ID</strong> และ <strong>GOOGLE_CLIENT_ID</strong> ฝั่งเซิร์ฟเวอร์ให้ตรงกันด้วย
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Google Client ID (ลงท้ายด้วย .apps.googleusercontent.com)
                        </label>
                        <input
                          type="text"
                          required
                          value={tempClientIdInput}
                          onChange={(e) => setTempClientIdInput(e.target.value)}
                          placeholder="เช่น 123456789-abcdefg.apps.googleusercontent.com"
                          className="input-field py-2 text-xs font-mono"
                        />
                      </div>

                      {googleClientId && (
                        <div className="flex items-center justify-between text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                          <span>✓ ปัจจุบันกำลังใช้งาน Client ID นี้</span>
                          <button
                            type="button"
                            onClick={handleResetGoogleClientId}
                            className="font-bold text-rose-600 hover:underline cursor-pointer"
                          >
                            ล้างค่า
                          </button>
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowGoogleModal(false)}
                          className="flex-1 py-2 text-xs font-bold text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer"
                        >
                          ปิด
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2 text-xs font-bold text-white rounded-xl bg-brand-500 hover:bg-brand-600 shadow-sm cursor-pointer"
                        >
                          บันทึก & ล็อกอินจริงทันที 🚀
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Tab Content 2: Step-by-Step Guide */}
                  {googleSetupTab === 'guide' && (
                    <div className="space-y-3 text-xs text-slate-700">
                      <div className="space-y-2 p-3 bg-amber-50/60 rounded-2xl border border-amber-200/80">
                        <p className="font-black text-amber-900">4 ขั้นตอนง่าย ๆ ใน Google Cloud Console (ฟรี):</p>
                        <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-slate-700 leading-relaxed">
                          <li>
                            เข้าสู่หน้าเว็บ{' '}
                            <a
                              href="https://console.cloud.google.com/apis/credentials"
                              target="_blank"
                              rel="noreferrer"
                              className="font-bold text-brand-600 underline"
                            >
                              Google Cloud Console Credentials ↗
                            </a>
                          </li>
                          <li>กดปุ่ม <strong>+ CREATE CREDENTIALS</strong> แล้วเลือก <strong>OAuth client ID</strong></li>
                          <li>เลือก Application type เป็น <strong>Web application</strong></li>
                          <li>
                            ในหัวข้อ <strong>Authorized JavaScript origins</strong> เพิ่ม URL:
                            <div className="mt-1 font-mono text-[10px] bg-white p-2 rounded-lg border border-amber-200 space-y-0.5 select-all">
                              <div>http://localhost:5173</div>
                              <div>http://localhost:5000</div>
                              <div>{window.location.origin}</div>
                            </div>
                          </li>
                          <li>คัดลอก <strong>Client ID</strong> มาวางในแท็บ "กรอก Client ID" หรือเพิ่มใน Vercel Environment Variables: <code className="font-bold">VITE_GOOGLE_CLIENT_ID</code></li>
                        </ol>
                      </div>

                      <button
                        type="button"
                        onClick={() => setGoogleSetupTab('config')}
                        className="w-full py-2 text-xs font-bold text-brand-600 bg-orange-50 hover:bg-orange-100 rounded-xl border border-orange-200 cursor-pointer"
                      >
                        นำ Client ID มากรอกที่นี่ ➡️
                      </button>
                    </div>
                  )}

                  {/* Tab Content 3: Quick Demo Fallback */}
                  {googleSetupTab === 'demo' && (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-600">
                        หากยังไม่ได้ตั้งค่า Google Cloud สามารถใช้บัญชีตัวอย่างเพื่อทดสอบระบบได้ทันที:
                      </p>

                      <div className="space-y-2.5">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">ชื่อที่แสดง</label>
                          <input
                            type="text"
                            value={customGoogleName}
                            onChange={(e) => setCustomGoogleName(e.target.value)}
                            placeholder="เช่น สมชาย ใจดี"
                            className="input-field py-2 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">อีเมล Gmail</label>
                          <input
                            type="email"
                            value={customGoogleEmail}
                            onChange={(e) => setCustomGoogleEmail(e.target.value)}
                            placeholder="yourname@gmail.com"
                            className="input-field py-2 text-xs"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setShowGoogleModal(false);
                          handleSocialLogin('google', {
                            name: customGoogleName || 'สมชาย ใจดี',
                            email: customGoogleEmail || 'somchai.traveler@gmail.com',
                          });
                        }}
                        className="w-full py-2.5 text-xs font-bold text-white rounded-xl bg-brand-500 hover:bg-brand-600 shadow-sm cursor-pointer"
                      >
                        เข้าสู่ระบบด้วยบัญชีทดสอบทันที ✨
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-400 font-semibold">
                  หรือกรอกแบบฟอร์มด้านล่าง
                </span>
              </div>
            </div>

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

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">ข้อมูลบัญชีและโปรไฟล์</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">กรอกข้อมูลจำเป็นให้ครบ รูปโปรไฟล์และที่อยู่เป็นข้อมูลเพิ่มเติม</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="input-register-nickname" className="text-xs font-bold text-slate-700 mb-1 block">
                        👤 ชื่อเล่น <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="input-register-nickname"
                        type="text"
                        autoComplete="nickname"
                        required
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="เช่น ยิม, มีน, แบงค์"
                        className="input-field py-2.5 text-xs sm:text-sm font-medium"
                        maxLength={40}
                      />
                    </div>
                    <div>
                      <label htmlFor="input-register-full-name" className="text-xs font-bold text-slate-700 mb-1 block">
                        ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="input-register-full-name"
                        type="text"
                        autoComplete="name"
                        required
                        maxLength={120}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="ชื่อและนามสกุล"
                        className="input-field py-2.5 text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="input-register-contact" className="text-xs font-bold text-slate-700 mb-1 block">
                        📱 เบอร์โทรศัพท์ <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="input-register-contact"
                        type="tel"
                        autoComplete="tel"
                        required
                        pattern="[0-9+\s()-]{8,20}"
                        value={phoneOrEmail}
                        onChange={(e) => setPhoneOrEmail(e.target.value)}
                        placeholder="081-xxx-xxxx"
                        className="input-field py-2.5 text-xs sm:text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label htmlFor="input-register-email" className="text-xs font-bold text-slate-700 mb-1 block">
                        อีเมล <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="input-register-email"
                        type="email"
                        autoComplete="email"
                        required
                        maxLength={254}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="input-field py-2.5 text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="input-register-date-of-birth" className="text-xs font-bold text-slate-700 mb-1 block">
                        วันเดือนปีเกิด <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="input-register-date-of-birth"
                        type="date"
                        required
                        max={todayDate}
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="input-field py-2.5 text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="input-register-profile-photo" className="text-xs font-bold text-slate-700 mb-1 block">
                        รูปโปรไฟล์ <span className="font-normal text-slate-400">(ไม่บังคับ)</span>
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-white border border-slate-200 flex items-center justify-center text-xl shrink-0">
                          {profilePhoto ? <img src={profilePhoto} alt="ตัวอย่างรูปโปรไฟล์" className="w-full h-full object-cover" /> : '👤'}
                        </div>
                        <input
                          id="input-register-profile-photo"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleProfilePhotoChange}
                          className="block min-w-0 w-full text-[11px] text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-white file:px-2.5 file:py-2 file:text-[11px] file:font-bold file:text-brand-700"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-500 font-semibold">หรือเลือกรูปมาสคอต:</span>
                        <button
                          type="button"
                          onClick={() => setProfilePhoto('/mascot/nong-pass-wave.jpg')}
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border transition-all cursor-pointer ${
                            profilePhoto === '/mascot/nong-pass-wave.jpg'
                              ? 'bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-400/50'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          🐻 น้องพาส
                        </button>
                        <button
                          type="button"
                          onClick={() => setProfilePhoto('/mascot/nong-pass-guide.jpg')}
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border transition-all cursor-pointer ${
                            profilePhoto === '/mascot/nong-pass-guide.jpg'
                              ? 'bg-sky-100 text-sky-900 border-sky-300 ring-2 ring-sky-400/50'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          🧭 น้องพาสไกด์
                        </button>
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="input-register-current-address" className="text-xs font-bold text-slate-700 mb-1 block">
                        ที่อยู่ปัจจุบัน <span className="font-normal text-slate-400">(ไม่บังคับ)</span>
                      </label>
                      <textarea
                        id="input-register-current-address"
                        maxLength={300}
                        rows={2}
                        value={currentAddress}
                        onChange={(e) => setCurrentAddress(e.target.value)}
                        placeholder="บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด"
                        className="input-field py-2.5 text-xs sm:text-sm resize-y"
                      />
                    </div>
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
                    <span>⟳ กำลังสร้างบัญชี...</span>
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
                        <div
                          key={acc.accountId || `${acc.phoneOrEmail}-${idx}`}
                          className="w-full p-2.5 rounded-2xl bg-white border border-amber-200/60 shadow-xs flex items-center justify-between gap-2"
                        >
                          <button
                            type="button"
                            onClick={() => handleSelectSavedAccount(acc)}
                            className="min-w-0 flex-1 flex items-center gap-2.5 text-left cursor-pointer"
                          >
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-500 to-amber-400 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                              {acc.nickname?.[0] || '👤'}
                            </div>
                            <div className="min-w-0">
                              <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                                {acc.nickname}
                              </div>
                              <div className="text-[11px] text-slate-500 truncate">
                                {acc.phoneOrEmail} {acc.provinceName ? `· ${acc.provinceName}` : ''}
                              </div>
                            </div>
                            <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded-xl border border-brand-200 shrink-0">
                              เลือกบัญชี
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveSavedAccount(acc)}
                            aria-label={`ลบบัญชี ${acc.nickname || acc.phoneOrEmail} ออกจากอุปกรณ์นี้`}
                            title="ลบออกจากรายการบนอุปกรณ์นี้"
                            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer shrink-0"
                          >
                            <span aria-hidden="true" className="text-lg leading-none">×</span>
                          </button>
                        </div>
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
