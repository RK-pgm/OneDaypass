import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { getPass, redeemCoupon, checkin, submitMission, getDeviceId, getPoints, getApiHealth, USE_MOCK } from '../api';

const CATEGORY_ICON = {
  cafe: '☕ คาเฟ่',
  food: '🍜 สตรีทฟู้ด',
  dessert: '🍧 ของหวาน',
  photo: '📸 จุดถ่ายรูป',
  activity: '🎯 กิจกรรม',
};

// ── Sub-component: CouponCard ────────────────────────────────
function CouponCard({ coupon, passId, onRedeemed }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRedeem() {
    setLoading(true);
    try {
      await redeemCoupon(coupon.id, passId);
      onRedeemed(coupon.id);
    } catch {
      alert('ไม่สามารถใช้คูปองได้');
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  return (
    <div
      className={`glass-card relative overflow-hidden transition-all duration-300 bg-white ${
        coupon.used 
          ? 'opacity-40 grayscale border-slate-200' 
          : 'border-emerald-200 hover:border-emerald-400 shadow-md shadow-emerald-500/5'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🎫</span>
            <span className="text-xs uppercase font-mono font-bold text-slate-400 tracking-wider">
              {coupon.shopId.toUpperCase()}
            </span>
          </div>
          <p className="text-emerald-700 font-extrabold text-base sm:text-lg">{coupon.title}</p>
          <p className="text-slate-500 text-xs mt-1">
            {coupon.isDemo ? 'คูปองตัวอย่าง ไม่สามารถใช้สิทธิ์กับร้านค้าจริงได้' : 'แสดงหน้าร้านเพื่อรับสิทธิ์กับพนักงาน'}
          </p>
        </div>

        {coupon.used ? (
          <span className="badge bg-slate-100 text-slate-500 border border-slate-200 text-xs font-semibold">
            ✓ ใช้แล้ว
          </span>
        ) : coupon.isDemo ? (
          <span className="badge bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
            ตัวอย่าง
          </span>
        ) : confirming ? (
          <div className="flex flex-col sm:flex-row gap-1.5 flex-shrink-0">
            <button
              className="btn-sm bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-semibold"
              onClick={() => setConfirming(false)}
            >
              ยกเลิก
            </button>
            <button
              id={`btn-redeem-confirm-${coupon.id}`}
              className="btn-sm bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-600/30"
              onClick={handleRedeem}
              disabled={loading}
            >
              {loading ? '...' : 'ยืนยันใช้'}
            </button>
          </div>
        ) : (
          <button
            id={`btn-redeem-${coupon.id}`}
            className="btn-sm bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 text-xs sm:text-sm font-bold flex-shrink-0"
            onClick={() => setConfirming(true)}
          >
            กดใช้คูปอง
          </button>
        )}
      </div>
    </div>
  );
}

// ── Sub-component: MissionCard ───────────────────────────────
function MissionCard({ item, passId, alreadyCompleted, onPointsEarned }) {
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(alreadyCompleted);
  const [earnedPoints, setEarnedPoints] = useState(null);

  if (!item.mission) return null;

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    if (!imageFile) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('passId', passId);
      fd.append('deviceId', getDeviceId());
      fd.append('image', imageFile);
      const result = await submitMission(item.mission.id, fd);
      setDone(true);
      setEarnedPoints(result.pointsAwarded || item.mission.points || 5);
      onPointsEarned(result.totalPoints || 15);
    } catch (err) {
      alert(err.message || 'ส่งมิชชั่นไม่ได้');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`glass-card bg-white border-purple-200 transition-all ${done ? 'opacity-90 bg-purple-50/40 border-purple-300' : 'hover:border-purple-300'}`}>
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-xl flex-shrink-0 shadow-sm">
          📸
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-purple-800 font-extrabold text-base sm:text-lg">{item.mission.title}</p>
            <span className="badge bg-purple-50 text-purple-700 border border-purple-200 text-xs font-extrabold font-mono">
              +{item.mission.points} แต้ม
            </span>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm font-medium">จุดเช็กอิน: {item.shopName}</p>

          {done ? (
            <div className="mt-3 flex items-center gap-3">
              <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                ✓ ทำภารกิจสำเร็จแล้ว
              </span>
              {earnedPoints !== null && (
                <span className="text-amber-600 text-sm font-extrabold animate-bounce-in flex items-center gap-1">
                  🌟 ได้รับ +{earnedPoints} แต้มแล้ว!
                </span>
              )}
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-2.5">
              {preview && (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 max-h-48 shadow-sm">
                  <img
                    src={preview}
                    alt="รูปภาพภารกิจ"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => { setImageFile(null); setPreview(null); }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-900/70 text-white text-xs flex items-center justify-center hover:bg-slate-900"
                  >
                    ✕
                  </button>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <label
                  id={`btn-mission-photo-${item.mission.id}`}
                  className="btn-sm bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-center cursor-pointer flex items-center gap-1.5 font-bold"
                >
                  <span>📷</span>
                  <span>{preview ? 'เปลี่ยนรูป' : 'ถ่ายรูป / แนบภาพ'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>

                {imageFile && (
                  <button
                    id={`btn-mission-submit-${item.mission.id}`}
                    className="btn-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-center flex items-center gap-1 shadow-md shadow-purple-500/20"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? '⟳ กำลังส่ง...' : '✉️ ส่งเพื่อรับแต้ม'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-component: CheckinButton ─────────────────────────────
function CheckinButton({ item, passId, alreadyCheckedIn, onCheckin, demoMode }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(alreadyCheckedIn);

  async function handleCheckin(simulate = false) {
    setLoading(true);
    try {
      if (!simulate) {
        const pos = await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
        );
        const result = await checkin({
          passId,
          shopId: item.shopId,
          deviceId: getDeviceId(),
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          simulate: false,
        });
        setDone(true);
        onCheckin(item.shopId, result.unlockedMissionIds, result.totalPoints);
      } else {
        const result = await checkin({
          passId,
          shopId: item.shopId,
          deviceId: getDeviceId(),
          lat: item.lat,
          lng: item.lng,
          simulate: true,
        });
        setDone(true);
        onCheckin(item.shopId, result.unlockedMissionIds, result.totalPoints);
      }
    } catch (err) {
      alert(err.message || 'เช็กอินไม่สำเร็จ (แนะนำให้กดปุ่ม "จำลองพิกัด" เพื่อทดสอบ)');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
        ✓ เช็กอินแล้ว
      </span>
    );
  }

  return (
    <div className="flex gap-1.5 items-center">
      <button
        id={`btn-checkin-${item.shopId}`}
        className="btn-sm bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-300 text-xs font-bold"
        onClick={() => handleCheckin(false)}
        disabled={loading}
      >
        {loading ? '...' : '📍 เช็กอินด้วยตำแหน่ง'}
      </button>
      {demoMode && (
        <button
          id={`btn-simulate-${item.shopId}`}
          title="จำลองว่าอยู่ที่ร้านแล้วสำหรับทดสอบระบบ"
          className="btn-sm bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 text-xs font-semibold"
          onClick={() => handleCheckin(true)}
          disabled={loading}
        >
          จำลอง
        </button>
      )}
    </div>
  );
}

// ── Main Page Component ──────────────────────────────────────
export default function PassPage() {
  const { passId } = useParams();
  const navigate = useNavigate();

  const [pass, setPass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(10);
  const [pointTransactions, setPointTransactions] = useState([]);
  const [tab, setTab] = useState('plan');
  const [copied, setCopied] = useState(false);
  const [demoMode, setDemoMode] = useState(USE_MOCK || import.meta.env.DEV);

  const loadPass = useCallback(async () => {
    try {
      const data = await getPass(passId);
      setPass(data);
      const pts = await getPoints(getDeviceId());
      setTotalPoints(pts.totalPoints);
      setPointTransactions(Array.isArray(pts.transactions) ? pts.transactions : []);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [passId]);

  useEffect(() => {
    loadPass();
  }, [loadPass]);

  useEffect(() => {
    let mounted = true;
    getApiHealth()
      .then((config) => { if (mounted) setDemoMode(config.demoMode === true); })
      .catch(() => { if (mounted) setDemoMode(false); });
    return () => { mounted = false; };
  }, []);

  function handleCopyCode() {
    if (pass?.code) {
      navigator.clipboard.writeText(pass.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleCouponRedeemed(couponId) {
    setPass((prev) => {
      const updated = {
        ...prev,
        coupons: prev.coupons.map((c) => (c.id === couponId ? { ...c, used: true } : c)),
      };
      localStorage.setItem(`daypass_pass_${passId}`, JSON.stringify(updated));
      return updated;
    });
  }

  function handleCheckin(shopId, unlockedMissionIds, updatedPoints) {
    setPass((prev) => {
      const newCheckins = [...prev.checkins, { shopId, at: new Date().toISOString() }];
      const newUnlocked = [...new Set([...prev.unlockedMissionIds, ...unlockedMissionIds])];
      const updated = { ...prev, checkins: newCheckins, unlockedMissionIds: newUnlocked };
      localStorage.setItem(`daypass_pass_${passId}`, JSON.stringify(updated));
      return updated;
    });
    if (Number.isFinite(updatedPoints)) setTotalPoints(updatedPoints);
    getPoints(getDeviceId()).then((balance) => {
      setPointTransactions(Array.isArray(balance.transactions) ? balance.transactions : []);
    }).catch(() => {});
  }

  function handlePointsEarned(newTotal) {
    setTotalPoints(newTotal);
    getPoints(getDeviceId()).then((balance) => {
      setTotalPoints(balance.totalPoints);
      setPointTransactions(Array.isArray(balance.transactions) ? balance.transactions : []);
    }).catch(() => {});
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center animate-pulse-soft">
          <div className="text-5xl mb-3">🎟️</div>
          <p className="text-slate-600 font-bold">กำลังโหลดข้อมูลพาสดิจิทัลของคุณ...</p>
        </div>
      </div>
    );
  }

  if (!pass) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
        <div className="text-6xl">😢</div>
        <h2 className="text-xl font-bold text-slate-900">ไม่พบพาสนี้ในระบบ</h2>
        <p className="text-slate-500 text-sm max-w-sm">อาจเกิดจากรหัสพาสไม่ถูกต้อง หรือหมดอายุแล้ว</p>
        <button className="btn-secondary max-w-xs" onClick={() => navigate('/')}>
          🏠 กลับหน้าแรก
        </button>
      </div>
    );
  }

  const checkedInShopIds = new Set(pass.checkins.map((c) => c.shopId));
  const planItems = pass.plan.items;
  const activeCouponsCount = pass.coupons.filter((c) => !c.used).length;
  const purchaseDate = pass.purchase?.purchasedAt
    ? new Intl.DateTimeFormat('th-TH', {
      dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Bangkok',
    }).format(new Date(pass.purchase.purchasedAt))
    : pass.purchaseDateText || 'ไม่พบข้อมูลวันที่ซื้อ';
  const purchaseAmount = Number(pass.purchase?.amount ?? pass.totalAmount ?? 0);
  const purchaseDiscount = Number(pass.purchase?.discount ?? pass.discount ?? 0);
  const purchasePoints = Number(pass.purchase?.pointsUsed ?? pass.pointsUsed ?? 0);

  return (
    <div className="flex-1 flex flex-col py-6 sm:py-10 animate-fade-in">
      <div className="page-container max-w-5xl">

        {/* ── DIGITAL PASS TICKET HEADER ─────────────────── */}
        <div className="glass-card relative overflow-hidden border-orange-200 p-6 sm:p-8 bg-gradient-to-r from-orange-50 via-white to-amber-50 shadow-2xl shadow-orange-500/10 mb-8">
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-100/60 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            
            {/* Left Ticket Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`badge font-extrabold text-xs uppercase tracking-wider border ${
                  pass.isDemo
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-brand-100 text-brand-800 border-brand-300'
                }`}>
                  {pass.isDemo ? '🧪 พาสตัวอย่าง · Prototype' : '🎟️ Official DayPass Bangkok'}
                </span>
                <span className="badge bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300">
                  {pass.isDemo ? '● ตัวอย่างเท่านั้น' : '● ใช้งานได้'}
                </span>
              </div>

              {pass.isDemo && (
                <p className="mb-3 max-w-2xl rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900" role="note">
                  พาสนี้สร้างเพื่อสาธิตการใช้งานเท่านั้น ไม่ใช่บัตรที่ใช้แลกรับสิทธิประโยชน์หรือยืนยันการชำระเงินจริง
                </p>
              )}

              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
                {pass.plan.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-4 text-xs sm:text-sm text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">รหัสพาส</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono font-extrabold text-slate-900 text-lg tracking-widest">{pass.code}</span>
                    <button
                      onClick={handleCopyCode}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold border border-slate-200"
                    >
                      {copied ? '✓ คัดลอกแล้ว' : 'คัดลอก'}
                    </button>
                  </div>
                </div>

                <div className="border-l border-slate-200 pl-3 sm:pl-6">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">วันที่ใช้งาน</span>
                  <span className="font-extrabold text-slate-900 mt-0.5 block">{pass.validDate}</span>
                </div>

                <div className="border-l border-slate-200 pl-3 sm:pl-6">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">ผู้ใช้งาน</span>
                  <span className="font-extrabold text-slate-900 mt-0.5 block">{pass.people} ท่าน</span>
                </div>
              </div>
            </div>

            {/* Right QR & Points Widget */}
            <div className="flex sm:flex-row md:flex-col items-center gap-4 flex-shrink-0">
              <div className="bg-white p-3 rounded-2xl shadow-xl shadow-slate-300/50 border-2 border-slate-200 flex flex-col items-center">
                <QRCodeSVG value={pass.code} size={96} bgColor="#ffffff" fgColor="#0f172a" level="M" />
                <span className="text-[10px] text-slate-700 font-mono font-bold mt-1">
                  {pass.isDemo ? 'QR ตัวอย่าง' : 'สแกนหน้าร้าน'}
                </span>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold shadow-sm">
                <span className="text-base">🌟</span>
                <div>
                  <span className="block font-extrabold">{totalPoints} แต้มสะสม</span>
                  <span className="text-[10px] text-slate-500 font-medium">= {totalPoints * 2} บาท</span>
                  <span className="text-[10px] text-slate-500 font-medium block">ใช้ลดได้สูงสุด 30% ต่อออเดอร์</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        <section className="glass-card bg-white mb-6 border border-slate-200" aria-labelledby="purchase-details-title">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 id="purchase-details-title" className="font-extrabold text-slate-900">รายละเอียดการซื้อ</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {pass.isDemo ? 'ข้อมูลตัวอย่าง ไม่มีการเรียกเก็บเงินจริง' : 'ข้อมูลคำสั่งซื้อที่ออกพาสใบนี้'}
              </p>
            </div>
            <span className="text-2xl" aria-hidden="true">🧾</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-slate-50 p-3">
              <span className="block text-xs text-slate-500">รหัสคำสั่งซื้อ</span>
              <span className="font-mono font-bold text-slate-900 break-all">
                {pass.purchase?.orderId || pass.orderId || '—'}
              </span>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <span className="block text-xs text-slate-500">วันที่ซื้อ</span>
              <span className="font-bold text-slate-900">{purchaseDate}</span>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <span className="block text-xs text-slate-500">{pass.isDemo ? 'ยอดตัวอย่าง' : 'ยอดชำระ'}</span>
              <span className="font-bold text-slate-900">{purchaseAmount.toLocaleString()} บาท</span>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <span className="block text-xs text-slate-500">ส่วนลดจากแต้ม</span>
              <span className="font-bold text-emerald-700">
                {purchaseDiscount > 0 ? `-${purchaseDiscount.toLocaleString()} บาท (${purchasePoints} แต้ม)` : 'ไม่มีส่วนลด'}
              </span>
            </div>
          </div>
        </section>

        <section className="glass-card bg-white mb-6" aria-labelledby="points-history-title">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 id="points-history-title" className="font-extrabold text-slate-900">ประวัติแต้มล่าสุด</h2>
            <span className="text-xs text-slate-500">1 แต้ม = 2 บาท · ใช้ลดได้ไม่เกิน 30% ของยอดต่อออเดอร์</span>
          </div>
          {pointTransactions.length === 0 ? (
            <p className="text-sm text-slate-500">ยังไม่มีรายการแต้ม</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {pointTransactions.slice(0, 10).map((transaction, index) => {
                const date = new Date(transaction.at);
                const dateLabel = Number.isNaN(date.getTime())
                  ? 'ไม่ทราบวันที่'
                  : new Intl.DateTimeFormat('th-TH', {
                    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Bangkok',
                  }).format(date);
                return (
                  <li key={`${transaction.at}-${index}`} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="text-slate-800 font-medium truncate">{transaction.reason || 'รายการแต้ม'}</p>
                      <time className="text-xs text-slate-500" dateTime={transaction.at}>{dateLabel}</time>
                    </div>
                    <span className={`flex-shrink-0 font-extrabold ${transaction.delta >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {transaction.delta > 0 ? '+' : ''}{transaction.delta} แต้ม
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ── TABS BAR ────────────────────────────────────── */}
        <div className="flex border-b border-slate-200 mb-6 gap-2 sm:gap-4 overflow-x-auto scrollbar-none">
          {[
            { key: 'plan', label: '📋 แผนเที่ยว & เช็กอิน', count: `${pass.checkins.length}/${planItems.length}` },
            { key: 'coupons', label: '🎫 คูปองอาหาร & เครื่องดื่ม', count: activeCouponsCount },
            { key: 'missions', label: '📸 มิชชั่นถ่ายรูปสะสมแต้ม', count: `${planItems.filter(p => p.mission).length} จุด` },
          ].map((t) => (
            <button
              key={t.key}
              id={`tab-${t.key}`}
              onClick={() => setTab(t.key)}
              className={`pb-3 px-3 sm:px-4 text-sm sm:text-base font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                tab === t.key
                  ? 'text-brand-600 border-brand-500'
                  : 'text-slate-500 border-transparent hover:text-slate-800'
              }`}
            >
              <span>{t.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                tab === t.key ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'bg-slate-100 text-slate-500'
              }`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* ── TAB CONTENTS ─────────────────────────────────── */}
        <div className="animate-fade-in">
          
          {/* TAB 1: PLAN & CHECKIN */}
          {tab === 'plan' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1 mb-2 font-medium">
                <span>📍 เดินทางไปตามร้านแล้วกด "เช็กอิน" เพื่อยืนยันและปลดล็อกมิชชั่น</span>
                <span className="hidden sm:inline">กดปุ่ม "จำลอง" ข้างๆ ได้เลยหากกำลังทดสอบระบบ</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {planItems.map((item) => {
                  const isCheckedIn = checkedInShopIds.has(item.shopId);
                  return (
                    <div
                      key={item.shopId}
                      className={`glass-card bg-white transition-all ${
                        isCheckedIn ? 'border-emerald-300 bg-emerald-50/30' : 'hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="badge bg-slate-100 text-slate-700 font-mono text-xs font-bold">
                              🕒 {item.time}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              {CATEGORY_ICON[item.category] || '📍 จุดเช็กอิน'}
                            </span>
                          </div>
                          <h3 className="text-slate-900 font-extrabold text-base sm:text-lg">{item.shopName}</h3>
                        </div>

                        <CheckinButton
                          item={item}
                          passId={passId}
                          alreadyCheckedIn={isCheckedIn}
                          onCheckin={handleCheckin}
                          demoMode={demoMode}
                        />
                      </div>

                      <p className="text-slate-600 text-xs sm:text-sm mb-3 leading-relaxed">
                        {item.activity}
                      </p>

                      <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 text-xs">
                        {item.coupon && (
                          <span className="text-emerald-700 font-bold">
                            🎫 มีคูปอง: {item.coupon.title}
                          </span>
                        )}
                        {item.mission && (
                          <span className={`font-bold ${isCheckedIn ? 'text-purple-700' : 'text-slate-400'}`}>
                            📸 {isCheckedIn ? `พร้อมทำมิชชั่น (+${item.mission.points}แต้ม)` : '🔒 เช็กอินก่อนทำมิชชั่น'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: COUPONS */}
          {tab === 'coupons' && (
            <div>
              <div className="mb-4">
                <p className="text-slate-500 text-xs sm:text-sm font-medium">
                  💡 ยื่นคูปองให้พนักงานที่ร้านดู แล้วกด "กดใช้คูปอง" เพื่อแลกรับสิทธิ์
                </p>
              </div>

              {pass.coupons.length === 0 ? (
                <div className="glass-card bg-white text-center py-12 text-slate-400">
                  <p className="text-4xl mb-2">🎫</p>
                  <p>ไม่มีคูปองสำหรับพาสนี้</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pass.coupons.map((coupon) => (
                    <CouponCard
                      key={coupon.id}
                      coupon={coupon}
                      passId={passId}
                      onRedeemed={handleCouponRedeemed}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MISSIONS */}
          {tab === 'missions' && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-slate-500 text-xs sm:text-sm font-medium">
                  📸 ถ่ายรูปตามภารกิจเพื่อสะสมแต้ม แต้มใช้เป็นส่วนลดพาสครั้งถัดไป (1 แต้ม = 2 บาท)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {planItems
                  .filter((item) => item.mission)
                  .map((item) => {
                    const isCheckedIn = checkedInShopIds.has(item.shopId);
                    const isCompleted = (pass.completedMissionIds || []).includes(item.mission.id);

                    return (
                      <div key={item.mission.id}>
                        {isCheckedIn ? (
                          <MissionCard
                            item={item}
                            passId={passId}
                            alreadyCompleted={isCompleted}
                            onPointsEarned={handlePointsEarned}
                          />
                        ) : (
                          <div className="glass-card bg-white opacity-60 border-dashed">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl grayscale">🔒</span>
                              <div>
                                <p className="text-slate-700 font-bold text-sm">{item.mission.title}</p>
                                <p className="text-slate-400 text-xs mt-0.5">
                                  ยังล็อคอยู่ — กรุณาไปเช็กอินที่ร้าน <strong>{item.shopName}</strong> ก่อน
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

        </div>

        {/* ── BOTTOM NAV SHORTCUT ──────────────────────────── */}
        <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={() => navigate('/')}
            className="btn-secondary w-full sm:w-auto px-6 py-3 text-sm font-bold flex items-center justify-center gap-2"
          >
            <span>🏠 กลับหน้าแรก</span>
          </button>

          <button
            onClick={() => navigate('/plan/new')}
            className="btn-primary w-full sm:w-auto px-6 py-3 text-sm font-bold flex items-center justify-center gap-2"
          >
            <span>✨ สร้างแผนเที่ยวย่านอื่น →</span>
          </button>
        </div>

      </div>
    </div>
  );
}
