import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDeviceId, getPoints, getPassHistory, logoutAccount, updateAccountProfile } from '../api';
import {
  PROVINCES,
  REGIONS,
  detectLocationFromGPS,
  findAdministrativeDistrict,
  findAdministrativeSubdistrict,
  getAdministrativeDistricts,
  getAdministrativeSubdistricts,
} from '../data/locations';
import { encodeProfilePhoto } from '../utils/profilePhoto';

const STYLE_PROFILES = {
  chill:     { label: 'สายชิล สบายๆ', icon: '☕' },
  cafe:      { label: 'สายคาเฟ่ โฮปปิ้ง', icon: '🥐' },
  foodie:    { label: 'สายกินลุย', icon: '🍜' },
  photo:     { label: 'สายถ่ายรูป', icon: '📸' },
  art:       { label: 'สายอาร์ต สตรีท', icon: '🎨' },
  heritage:  { label: 'สายวัฒนธรรม', icon: '🏛️' },
  challenge: { label: 'สายท้าทาย แหลก', icon: '⚡' },
  night:     { label: 'สายราตรี', icon: '🌙' },
};

const RANK_BADGES = [
  { min: 0,   label: '🌱 มือใหม่',    color: 'text-green-700 bg-green-50 border-green-200' },
  { min: 25,  label: '🥉 นักเดินทาง', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { min: 75,  label: '🥈 นักผจญภัย',  color: 'text-slate-600 bg-slate-50 border-slate-300' },
  { min: 150, label: '🥇 Pro Traveler',color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  { min: 300, label: '💎 ตำนาน DayPass',color: 'text-purple-700 bg-purple-50 border-purple-200' },
];
const todayDate = new Date().toISOString().slice(0, 10);

function getRank(points) {
  let rank = RANK_BADGES[0];
  for (const r of RANK_BADGES) {
    if (points >= r.min) rank = r;
  }
  return rank;
}

function loadProfile() {
  try {
    const fromProfile = JSON.parse(localStorage.getItem('daypass_user_profile') || 'null');
    const fromAuth = JSON.parse(localStorage.getItem('daypass_user_auth') || 'null');
    if (!fromProfile && !fromAuth) return null;

    const profile = {
      ...fromAuth,
      ...fromProfile,
      district: fromProfile?.district || fromAuth?.amphoe || '',
    };
    const province = PROVINCES.some((item) => item.id === profile.province) ? profile.province : 'bangkok';
    const districts = getAdministrativeDistricts(province);
    const district = findAdministrativeDistrict(province, profile.district) || districts[0];
    const subdistricts = getAdministrativeSubdistricts(province, district?.id);
    const tambon = findAdministrativeSubdistrict(province, district?.id, profile.tambon) || subdistricts[0];

    return {
      ...profile,
      province,
      district: district?.id || '',
      tambon: tambon?.id || '',
      travelStyle: profile.travelStyle || 'chill',
    };
  } catch {
    return null;
  }
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const deviceId = getDeviceId();

  const [profile, setProfile] = useState(() => loadProfile() || {
    nickname: '',
    fullName: '',
    phoneOrEmail: '',
    email: '',
    dateOfBirth: '',
    currentAddress: '',
    profilePhoto: '',
    province: 'bangkok',
    district: getAdministrativeDistricts('bangkok').find((item) => item.name === 'สัมพันธวงศ์')?.id || '',
    tambon: '',
    travelStyle: 'chill',
    lat: null,
    lng: null,
    gpsAccuracy: null,
  });

  const [points, setPoints] = useState({ totalPoints: 0, pointValueBaht: 2, transactions: [] });
  const [passHistory, setPassHistory] = useState(() => getPassHistory());
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'history' | 'points'

  // Location state
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsMessage, setGpsMessage] = useState('');
  const [gpsError, setGpsError] = useState('');

  const quizResult = (() => {
    try { return JSON.parse(localStorage.getItem('daypass_quiz_result') || 'null'); } catch { return null; }
  })();

  useEffect(() => {
    setPassHistory(getPassHistory());
    getPoints(deviceId)
      .then((p) => setPoints({ totalPoints: 0, pointValueBaht: 2, transactions: [], ...p }))
      .catch(() => {});
  }, [deviceId]);

  const rank = getRank(points.totalPoints);
  const amphoes = getAdministrativeDistricts(profile.province);
  const tambons = getAdministrativeSubdistricts(profile.province, profile.district);
  const currentProvince = PROVINCES.find((p) => p.id === profile.province) || PROVINCES[0];

  // Current location handler
  async function handleDetectGPS() {
    setGpsLoading(true);
    setGpsError('');
    setGpsMessage('กำลังระบุตำแหน่งปัจจุบัน...');

    try {
      const detected = await detectLocationFromGPS();
      const district = findAdministrativeDistrict(detected.province, detected.amphoeName)
        || getAdministrativeDistricts(detected.province)[0];
      const tambon = findAdministrativeSubdistrict(detected.province, district?.id, detected.tambon)
        || getAdministrativeSubdistricts(detected.province, district?.id)[0];
      setProfile((prev) => ({
        ...prev,
        province: detected.province,
        district: district?.id || '',
        tambon: tambon?.id || '',
        lat: detected.lat,
        lng: detected.lng,
        gpsAccuracy: detected.accuracy,
        detectedProvinceName: detected.provinceName,
      }));

      setGpsMessage(`✓ ระบุพิกัดสำเร็จ: ${detected.provinceName} (ความแม่นยำ ±${detected.accuracy}ม.)`);
      setTimeout(() => setGpsMessage(''), 4500);
    } catch (err) {
      setGpsError(err.message || 'ไม่สามารถระบุตำแหน่งปัจจุบันได้');
      setTimeout(() => setGpsError(''), 5000);
    } finally {
      setGpsLoading(false);
    }
  }

  async function handleProfilePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setGpsError('');
    try {
      const profilePhoto = await encodeProfilePhoto(file);
      setProfile((prev) => ({ ...prev, profilePhoto }));
    } catch (err) {
      setGpsError(err.message || 'ไม่สามารถใช้รูปนี้ได้ กรุณาเลือกรูปใหม่');
    } finally {
      e.target.value = '';
    }
  }

  // Save profile
  async function handleSave() {
    if (!profile.nickname.trim()) return;
    setSaving(true);
    setGpsError('');

    const provObj = PROVINCES.find((p) => p.id === profile.province);
    const districtObj = amphoes.find((a) => a.id === profile.district);
    const updatedProfile = {
      ...profile,
      homeBaseName: `${provObj?.name || profile.province} - ${profile.district || ''} (${profile.tambon || 'ในเมือง'})`,
      updatedAt: new Date().toISOString(),
    };

    try {
      const existingAuth = JSON.parse(localStorage.getItem('daypass_user_auth') || 'null');
      let syncedAuth = existingAuth;
      if (existingAuth?.accountId) {
        const { account } = await updateAccountProfile(existingAuth.accountId, {
          nickname: profile.nickname.trim(),
          ...(profile.fullName?.trim() ? { fullName: profile.fullName.trim() } : {}),
          ...(profile.email?.trim() ? { email: profile.email.trim() } : {}),
          ...(profile.dateOfBirth ? { dateOfBirth: profile.dateOfBirth } : {}),
          ...(profile.currentAddress?.trim() ? { currentAddress: profile.currentAddress.trim() } : {}),
          ...(profile.profilePhoto ? { profilePhoto: profile.profilePhoto } : {}),
          province: profile.province,
          provinceName: provObj?.name || profile.province,
          provinceEmoji: provObj?.emoji || '🏙️',
          district: profile.district,
          districtName: districtObj?.name || profile.district,
          tambon: profile.tambon || 'ในเมือง',
          lat: profile.lat,
          lng: profile.lng,
        });
        syncedAuth = account;
      } else if (existingAuth) {
        syncedAuth = {
          ...existingAuth,
          nickname: profile.nickname.trim(),
          fullName: profile.fullName,
          email: profile.email,
          dateOfBirth: profile.dateOfBirth,
          currentAddress: profile.currentAddress,
          profilePhoto: profile.profilePhoto,
          province: profile.province,
          provinceName: provObj?.name || profile.province,
          provinceEmoji: provObj?.emoji || '🏙️',
          amphoe: profile.district,
          amphoeName: districtObj?.name || profile.district,
          tambon: profile.tambon || 'ในเมือง',
          lat: profile.lat,
          lng: profile.lng,
        };
      }

      const syncedProfile = {
        ...updatedProfile,
        nickname: profile.nickname.trim(),
        fullName: syncedAuth?.fullName || profile.fullName,
        email: syncedAuth?.email || profile.email,
        dateOfBirth: syncedAuth?.dateOfBirth || profile.dateOfBirth,
        currentAddress: syncedAuth?.currentAddress || profile.currentAddress,
        profilePhoto: syncedAuth?.profilePhoto || profile.profilePhoto,
        phoneOrEmail: syncedAuth?.phoneOrEmail || profile.phoneOrEmail,
      };
      localStorage.setItem('daypass_user_profile', JSON.stringify(syncedProfile));
      localStorage.setItem('daypass_profile', JSON.stringify(syncedProfile));
      if (syncedAuth) localStorage.setItem('daypass_user_auth', JSON.stringify(syncedAuth));
      setProfile(syncedProfile);
      window.dispatchEvent(new Event('daypass_auth_changed'));
    } catch (err) {
      setGpsError(err.message || 'ไม่สามารถบันทึกข้อมูลโปรไฟล์ได้');
      setSaving(false);
      return;
    }

    await new Promise((r) => setTimeout(r, 300));
    setSaving(false);
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="flex-1 flex flex-col py-6 sm:py-10 animate-fade-in pb-mobile-nav">
      <div className="page-container max-w-2xl px-4 sm:px-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 shadow-sm active:scale-95 transition-all flex-shrink-0"
              aria-label="ย้อนกลับ"
            >
              ←
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight whitespace-nowrap">
                  โปรไฟล์นักเดินทาง
                </h1>
                <span className="text-[11px] font-bold text-brand-600 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                  77 จังหวัด
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-0.5">จัดการข้อมูลโปรไฟล์ ที่อยู่บ้าน และตำแหน่งปัจจุบัน</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/plan/new')}
            className="btn-primary text-xs py-2.5 px-4 shadow-sm w-auto self-start sm:self-auto flex items-center gap-1.5 whitespace-nowrap flex-shrink-0"
          >
            <span>🗺️</span>
            <span>เริ่มวางแผนเที่ยว</span>
          </button>
        </div>

        {/* Avatar + Rank + Points Card */}
        <div className="glass-card bg-gradient-to-br from-brand-50 via-amber-50 to-orange-50 border-brand-200 mb-5 p-4 sm:p-5 rounded-3xl shadow-sm flex flex-col sm:flex-row items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-brand-500 to-amber-400 flex items-center justify-center text-3xl sm:text-4xl shadow-lg shadow-brand-500/25 flex-shrink-0 border-2 border-white">
            {profile.profilePhoto
              ? <img src={profile.profilePhoto} alt="รูปโปรไฟล์" className="w-full h-full object-cover" />
              : profile.travelStyle ? STYLE_PROFILES[profile.travelStyle]?.icon || '🧭' : '🧭'}
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="font-black text-slate-900 text-lg sm:text-xl truncate">
              {profile.nickname || 'นักเดินทาง OneDaypass'}
            </div>
            {profile.fullName && <div className="text-xs text-slate-600 mt-0.5">{profile.fullName}</div>}
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap mt-1">
              <span className={`badge border text-xs font-bold ${rank.color}`}>
                {rank.label}
              </span>
              <span className="badge bg-white border border-slate-200 text-slate-700 text-xs font-semibold">
                {currentProvince.emoji} {currentProvince.name}
              </span>
              {profile.lat && profile.lng && (
                <span className="badge bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  ระบุตำแหน่งแล้ว
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 mt-1 font-mono">
              ID: {deviceId.slice(0, 14)}...
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm px-4 py-2.5 rounded-2xl border border-amber-200/80 text-center flex-shrink-0 w-full sm:w-auto shadow-sm">
            <div className="text-2xl font-black text-amber-500 leading-none">
              {points.totalPoints}
            </div>
            <div className="text-[10px] font-bold text-amber-800 mt-0.5">
              แต้มสะสม (= {points.totalPoints * (points.pointValueBaht || 2)} บาท)
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex p-1 bg-slate-100 rounded-2xl mb-5">
          {[
            { id: 'profile', label: '👤 ข้อมูลโปรไฟล์' },
            { id: 'history', label: `🎟️ ประวัติพาส (${passHistory.length})` },
            { id: 'points',  label: '🌟 แต้มสะสม' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ──────── TAB 1: PROFILE & LOCATION ──────── */}
        {activeTab === 'profile' && (
          <div className="space-y-4">

            {/* Current location banner */}
            <div className="p-4 rounded-3xl bg-gradient-to-r from-sky-50 via-indigo-50 to-amber-50 border border-sky-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="w-11 h-11 rounded-2xl bg-sky-500 text-white flex items-center justify-center text-xl flex-shrink-0 shadow-md shadow-sky-500/20">
                  🛰️
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">
                    ระบุตำแหน่งปัจจุบันของคุณ
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    อัปเดตจังหวัด อำเภอ และพิกัดจริงเพื่อความแม่นยำในการแนะนำสถานที่
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="btn-profile-detect-gps"
                onClick={handleDetectGPS}
                disabled={gpsLoading}
                className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs shadow-md shadow-sky-600/25 flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap cursor-pointer"
              >
                {gpsLoading ? (
                  <>
                    <span className="inline-block animate-spin">⟳</span>
                    <span>กำลังระบุพิกัด...</span>
                  </>
                ) : (
                  <>
                    <span>📍</span>
                    <span>ใช้ตำแหน่งปัจจุบัน</span>
                  </>
                )}
              </button>
            </div>

            {/* Location feedback */}
            {gpsMessage && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
                <span>✓</span>
                <span>{gpsMessage}</span>
              </div>
            )}
            {gpsError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-shake">
                <span>⚠️</span>
                <span>{gpsError}</span>
              </div>
            )}

            {/* Current coordinates */}
            {profile.lat && profile.lng && (
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">●</span>
                  <span className="font-mono font-bold text-slate-800">
                    พิกัดปัจจุบัน: {Number(profile.lat).toFixed(4)}, {Number(profile.lng).toFixed(4)}
                  </span>
                  {profile.gpsAccuracy && (
                    <span className="text-[11px] text-slate-500">
                      (±{profile.gpsAccuracy} ม.)
                    </span>
                  )}
                </div>
                <span className="text-[11px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
                  ตรวจจับแล้ว
                </span>
              </div>
            )}

            {/* Nickname & Contact Card */}
            <div className="glass-card bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <span>👤</span> ข้อมูลทั่วไป
                </span>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-brand-600 text-xs font-bold hover:underline"
                  >
                    ✏️ แก้ไขข้อมูล
                  </button>
                ) : (
                  <span className="text-xs font-bold text-amber-600">กำลังแก้ไข...</span>
                )}
              </div>

              {editing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">ชื่อเล่น / ชื่อเรียก</label>
                    <input
                      id="input-profile-nickname"
                      type="text"
                      value={profile.nickname}
                      onChange={(e) => setProfile((p) => ({ ...p, nickname: e.target.value }))}
                      className="input-field py-2.5 text-sm"
                      placeholder="เช่น มีน, ก้อง"
                      maxLength={35}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">เบอร์โทรศัพท์ / Email</label>
                    <input
                      id="input-profile-contact"
                      type="text"
                      value={profile.phoneOrEmail || ''}
                      className="input-field py-2.5 text-sm"
                      readOnly
                      aria-describedby="profile-contact-note"
                    />
                    <p id="profile-contact-note" className="mt-1 text-[11px] text-slate-500">ใช้เป็นข้อมูลเข้าสู่ระบบ ติดต่อฝ่ายดูแลหากต้องการเปลี่ยน</p>
                  </div>
                  <div>
                    <label htmlFor="input-profile-full-name" className="text-xs font-bold text-slate-600 mb-1 block">ชื่อ-นามสกุล</label>
                    <input
                      id="input-profile-full-name"
                      type="text"
                      maxLength={120}
                      value={profile.fullName || ''}
                      onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
                      className="input-field py-2.5 text-sm"
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <label htmlFor="input-profile-email" className="text-xs font-bold text-slate-600 mb-1 block">อีเมล</label>
                    <input
                      id="input-profile-email"
                      type="email"
                      maxLength={254}
                      value={profile.email || ''}
                      onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                      className="input-field py-2.5 text-sm"
                      autoComplete="email"
                    />
                  </div>
                  <div>
                    <label htmlFor="input-profile-date-of-birth" className="text-xs font-bold text-slate-600 mb-1 block">วันเดือนปีเกิด</label>
                    <input
                      id="input-profile-date-of-birth"
                      type="date"
                      max={todayDate}
                      value={profile.dateOfBirth || ''}
                      onChange={(e) => setProfile((p) => ({ ...p, dateOfBirth: e.target.value }))}
                      className="input-field py-2.5 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="input-profile-current-address" className="text-xs font-bold text-slate-600 mb-1 block">ที่อยู่ปัจจุบัน</label>
                    <textarea
                      id="input-profile-current-address"
                      rows={2}
                      maxLength={300}
                      value={profile.currentAddress || ''}
                      onChange={(e) => setProfile((p) => ({ ...p, currentAddress: e.target.value }))}
                      className="input-field py-2.5 text-sm resize-y"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center text-2xl shrink-0">
                      {profile.profilePhoto ? <img src={profile.profilePhoto} alt="ตัวอย่างรูปโปรไฟล์" className="w-full h-full object-cover" /> : '👤'}
                    </div>
                    <div className="min-w-0">
                      <label htmlFor="input-profile-photo" className="text-xs font-bold text-slate-600 mb-1 block">รูปโปรไฟล์</label>
                      <input
                        id="input-profile-photo"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleProfilePhotoChange}
                        className="block max-w-full text-[11px] text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-100 file:px-2.5 file:py-2 file:text-[11px] file:font-bold file:text-slate-700"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">รูปจะถูกย่อก่อนบันทึกและซิงก์กับบัญชี</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-slate-400 block mb-0.5">ชื่อเล่น:</span>
                    <span className="text-sm font-bold text-slate-800">
                      {profile.nickname || '(ยังไม่ได้ระบุ)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">เบอร์โทร / Email:</span>
                    <span className="text-sm font-bold text-slate-800">
                      {profile.phoneOrEmail || '(ยังไม่ได้ระบุ)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">ชื่อ-นามสกุล:</span>
                    <span className="text-sm font-bold text-slate-800">{profile.fullName || '(ยังไม่ได้ระบุ)'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">อีเมล:</span>
                    <span className="text-sm font-bold text-slate-800">{profile.email || '(ยังไม่ได้ระบุ)'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">วันเดือนปีเกิด:</span>
                    <span className="text-sm font-bold text-slate-800">{profile.dateOfBirth || '(ยังไม่ได้ระบุ)'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block mb-0.5">ที่อยู่ปัจจุบัน:</span>
                    <span className="text-sm font-bold text-slate-800">{profile.currentAddress || '(ยังไม่ได้ระบุ)'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Home Location Card (77 Provinces & Amphoe & Tambon) */}
            <div className="glass-card bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <span>🏠</span> ตำแหน่งที่อยู่ Home Base (รองรับ 77 จังหวัด)
                </span>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                  77 จังหวัดทั่วไทย
                </span>
              </div>

              {/* Clarification banner */}
              <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                💡 <strong>ข้อแนะนำ:</strong> ตำแหน่งนี้ใช้บันทึกเป็นที่อยู่บ้านของคุณ สำหรับแนะนำทริปหรือคำนวณจุดเริ่มต้น โดยเวลาซื้อพาส <strong>คุณสามารถเลือกไปเที่ยวจังหวัดหรือย่านท่องเที่ยวอื่นๆ ได้อย่างอิสระ!</strong>
              </p>

              {editing ? (
                <div className="space-y-3 pt-1">
                  {/* Province Selector with 6 Regions optgroups */}
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">
                      จังหวัด (เลือกได้ครบทั้ง 77 จังหวัด)
                    </label>
                    <select
                      id="select-profile-province"
                      value={profile.province}
                      onChange={(e) => {
                        const newProv = e.target.value;
                        const newAmphoes = getAdministrativeDistricts(newProv);
                        const newDistrict = newAmphoes[0]?.id || '';
                        setProfile((p) => ({
                          ...p,
                          province: newProv,
                          district: newDistrict,
                          tambon: getAdministrativeSubdistricts(newProv, newDistrict)[0]?.id || '',
                        }));
                      }}
                      className="input-field py-2.5 text-xs font-semibold"
                    >
                      {REGIONS.map((region) => {
                        const provInRegion = PROVINCES.filter((p) => p.region === region.id);
                        return (
                          <optgroup key={region.id} label={`── ${region.name} (${provInRegion.length} จังหวัด) ──`}>
                            {provInRegion.map((pv) => (
                              <option key={pv.id} value={pv.id}>
                                {pv.emoji} {pv.name} ({pv.nameEn})
                              </option>
                            ))}
                          </optgroup>
                        );
                      })}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Amphoe Selector */}
                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1 block">
                        อำเภอ / เขต
                      </label>
                      <select
                        id="select-profile-district"
                        value={profile.district}
                        onChange={(e) => {
                          const newDistrict = e.target.value;
                          setProfile((p) => ({
                            ...p,
                            district: newDistrict,
                            tambon: getAdministrativeSubdistricts(profile.province, newDistrict)[0]?.id || '',
                          }));
                        }}
                        className="input-field py-2.5 text-xs font-semibold"
                      >
                        {amphoes.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Subdistrict selector */}
                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1 block">
                        ตำบล / แขวง
                      </label>
                      <select
                        id="select-profile-tambon"
                        value={profile.tambon || ''}
                        onChange={(e) => setProfile((p) => ({ ...p, tambon: e.target.value }))}
                        className="input-field py-2.5 text-xs"
                      >
                        {tambons.map((item) => (
                          <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 pt-1 text-xs">
                  <div className="flex items-center gap-2 p-3 rounded-2xl bg-orange-50/60 border border-orange-200/80">
                    <span className="text-2xl">{currentProvince.emoji}</span>
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm">
                        {currentProvince.name}
                      </div>
                      <div className="text-slate-600 text-xs">
                        {amphoes.find((a) => a.id === profile.district)?.name || profile.district || 'อำเภอเมือง'}
                        {profile.tambon ? ` · ต.${profile.tambon}` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Travel Style Card */}
            <div className="glass-card bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <span>🧭</span> สไตล์การท่องเที่ยวที่ชอบ
                </span>
                <button
                  onClick={() => navigate('/quiz')}
                  className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
                >
                  <span>ทำควิซหาสไตล์</span>
                  <span>→</span>
                </button>
              </div>

              {quizResult && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">✨</span>
                    <span>ผลควิซล่าสุดของคุณคือ: <strong>{quizResult.styleName}</strong></span>
                  </div>
                  <button
                    onClick={() => {
                      setProfile((p) => ({ ...p, travelStyle: quizResult.styleId }));
                      setEditing(true);
                    }}
                    className="text-[11px] font-bold text-amber-800 underline ml-2"
                  >
                    ใช้สไตล์นี้
                  </button>
                </div>
              )}

              {editing ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {Object.entries(STYLE_PROFILES).map(([key, st]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setProfile((p) => ({ ...p, travelStyle: key }))}
                      className={`p-2.5 rounded-2xl border text-center transition-all text-xs font-bold ${
                        profile.travelStyle === key
                          ? 'bg-brand-50 border-brand-400 text-brand-700 shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xl mb-1">{st.icon}</div>
                      <div>{st.label}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-slate-50 flex items-center gap-3">
                  <span className="text-2xl">
                    {STYLE_PROFILES[profile.travelStyle]?.icon || '☕'}
                  </span>
                  <div>
                    <div className="font-extrabold text-slate-900 text-sm">
                      {STYLE_PROFILES[profile.travelStyle]?.label || 'สายชิล สบายๆ'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      ระบบจะคัดเลือกร้านและมิชชั่นที่ตรงกับรสนิยมของคุณเป็นพิเศษ
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Save Buttons */}
            {editing && (
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="btn-secondary flex-1 py-3 text-xs font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  id="btn-save-profile"
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary flex-2 py-3 text-sm font-black shadow-lg shadow-brand-500/25 cursor-pointer"
                >
                  {saving ? '⟳ กำลังบันทึก...' : '💾 บันทึกโปรไฟล์ & พิกัด'}
                </button>
              </div>
            )}
            {saved && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold text-center">
                ✓ บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว!
              </div>
            )}

            {/* Logout / Switch Account */}
            <div className="pt-4 border-t border-slate-200 text-center">
              <button
                type="button"
                onClick={() => {
                  logoutAccount();
                  navigate('/', { replace: true });
                }}
                className="text-xs text-rose-600 hover:text-rose-800 font-bold hover:underline py-2"
              >
                🚪 ออกจากระบบ / สลับบัญชีผู้ใช้
              </button>
            </div>
          </div>
        )}

        {/* ──────── TAB 2: PASS HISTORY ──────── */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="glass-card bg-gradient-to-r from-brand-50 to-amber-50/50 border border-brand-200/80 p-4 rounded-2xl flex items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">ประวัติการซื้อพาส ({passHistory.length} รายการ)</h3>
                <p className="text-xs text-slate-500 mt-0.5">เปิดดูตั๋วพาสย้อนหลัง คูปอง หรือซื้อพาสซ้ำได้ทันที</p>
              </div>
              <button
                onClick={() => navigate('/history')}
                className="text-xs font-bold text-brand-600 hover:text-brand-800 bg-white px-3 py-1.5 rounded-xl border border-brand-200 shadow-sm whitespace-nowrap"
              >
                ดูหน้าเต็ม ↗
              </button>
            </div>

            {passHistory.length === 0 ? (
              <div className="glass-card bg-white p-8 text-center rounded-2xl border border-dashed border-slate-300">
                <span className="text-4xl mb-2 block">🎟️</span>
                <p className="font-bold text-slate-700 text-sm">ยังไม่มีประวัติการซื้อพาส</p>
                <p className="text-xs text-slate-500 mt-1">เริ่มต้นเลือกย่านและวางแผนเที่ยววันเดียวได้เลย</p>
                <button
                  onClick={() => navigate('/plan/new')}
                  className="btn-primary mt-3 text-xs py-2 px-4"
                >
                  วางแผนซื้อพาสใหม่
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {passHistory.map((pass) => (
                  <div
                    key={pass.id}
                    className="glass-card bg-white p-4 rounded-2xl border border-slate-200 hover:border-brand-300 transition-all shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                          {pass.code}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          pass.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {pass.status === 'active' ? '🟢 กำลังใช้งาน' : '🔵 สำเร็จ'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">{pass.purchaseDate}</span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-black text-slate-900 text-base flex items-center gap-1.5">
                          <span>{pass.districtEmoji || '📍'}</span>
                          <span>{pass.districtName}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          ราคา ฿{pass.price} · {pass.stopsCount || 4} ร้านในแผน
                        </div>
                      </div>

                      <button
                        onClick={() => navigate(`/pass/${pass.id}`)}
                        className="btn-primary text-xs py-2 px-3 whitespace-nowrap shadow-sm"
                      >
                        เปิดตั๋วพาส →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ──────── TAB 3: POINTS & REWARDS ──────── */}
        {activeTab === 'points' && (
          <div className="space-y-4">
            <div className="glass-card bg-gradient-to-r from-amber-400 to-orange-500 text-white p-6 rounded-3xl shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs font-bold text-amber-100 uppercase tracking-wide">คะแนนสะสมของคุณ</div>
                  <div className="text-4xl font-black mt-1">{points.totalPoints} <span className="text-base font-semibold">แต้ม</span></div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-amber-100">มูลค่าส่วนลด</div>
                  <div className="text-2xl font-black mt-1">฿{points.totalPoints * (points.pointValueBaht || 2)}</div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/20 text-xs">
                {(() => {
                  const currentIdx = RANK_BADGES.indexOf(rank);
                  const nextRank = RANK_BADGES[currentIdx + 1];
                  if (!nextRank) return <span>คุณอยู่ในระดับสูงสุดแล้ว 🎉</span>;
                  const ptsNeeded = nextRank.min - points.totalPoints;
                  return (
                    <div className="flex justify-between items-center">
                      <span>เป้าหมายถัดไป: <strong>{nextRank.label}</strong></span>
                      <span>ต้องการอีก {ptsNeeded} แต้ม</span>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* How to earn */}
            <div className="glass-card bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-2.5">
              <h3 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                <span>💡</span> วิธีสะสมแต้มกับ OneDaypass
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                  <span className="text-xl">📸</span>
                  <div>
                    <div className="font-bold text-slate-800">ทำมิชชั่นถ่ายรูป</div>
                    <div className="text-[11px] text-slate-500">+5 ถึง +10 แต้มต่อภารกิจ</div>
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                  <span className="text-xl">📍</span>
                  <div>
                    <div className="font-bold text-slate-800">เช็กอินร้านค้า</div>
                    <div className="text-[11px] text-slate-500">+3 แต้มต่อร้านค้า</div>
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                  <span className="text-xl">🎟️</span>
                  <div>
                    <div className="font-bold text-slate-800">ซื้อพาสสำเร็จ</div>
                    <div className="text-[11px] text-slate-500">+10 แต้มต่อพาส</div>
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                  <span className="text-xl">💰</span>
                  <div>
                    <div className="font-bold text-slate-800">ใช้แต้มลดค่าพาส</div>
                    <div className="text-[11px] text-slate-500">1 แต้ม = 2 บาท ลดสูงสุด 30%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
