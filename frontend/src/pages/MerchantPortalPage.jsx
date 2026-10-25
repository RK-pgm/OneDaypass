import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getEligibleMerchantShops,
  getMerchantSession,
  hasMerchantSession,
  loginMerchant,
  lookupMerchantPass,
  logoutMerchant,
  redeemMerchantCoupon,
  registerMerchant,
} from '../api';

const EMPTY_REGISTRATION = {
  shopName: '',
  ownerName: '',
  phone: '',
  address: '',
  password: '',
};

function passCodeFromScan(value) {
  const match = String(value || '').match(/DP-[A-Z0-9]{5}/i);
  return match ? match[0].toUpperCase() : '';
}

export default function MerchantPortalPage() {
  const [merchant, setMerchant] = useState(null);
  const [shops, setShops] = useState([]);
  const [registering, setRegistering] = useState(false);
  const [loginForm, setLoginForm] = useState({ shopName: '', password: '' });
  const [registration, setRegistration] = useState(EMPTY_REGISTRATION);
  const [passCode, setPassCode] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [scanMessage, setScanMessage] = useState('');
  const videoRef = useRef(null);

  useEffect(() => {
    let active = true;
    getEligibleMerchantShops()
      .then(({ shops: eligibleShops }) => {
        if (active) setShops(Array.isArray(eligibleShops) ? eligibleShops : []);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'โหลดรายชื่อร้านที่ร่วมรายการไม่สำเร็จ');
      });

    if (hasMerchantSession()) {
      getMerchantSession()
        .then(({ merchant: sessionMerchant }) => {
          if (active) setMerchant(sessionMerchant);
        })
        .catch(() => {
          if (active) setMerchant(null);
        });
    }

    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!scanning) return undefined;
    const video = videoRef.current;
    if (!video) return undefined;
    let active = true;
    let stream;
    let timeoutId;

    async function startScanner() {
      try {
        if (!navigator.mediaDevices?.getUserMedia || !window.BarcodeDetector) {
          setScanMessage('อุปกรณ์นี้สแกน QR ในเบราว์เซอร์ไม่ได้ กรุณากรอกรหัสพาสด้านล่าง');
          setScanning(false);
          return;
        }
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (!active) return;
        video.srcObject = stream;
        await video.play();

        const scanFrame = async () => {
          if (!active) return;
          try {
            const detections = await detector.detect(video);
            const detectedCode = passCodeFromScan(detections[0]?.rawValue);
            if (detectedCode) {
              setPassCode(detectedCode);
              setScanMessage('อ่าน QR แล้ว กด “ตรวจสอบพาส” เพื่อดูคูปองของร้าน');
              setScanning(false);
              return;
            }
          } catch {
            // A frame may be undecodable while the camera is moving.
          }
          timeoutId = window.setTimeout(scanFrame, 350);
        };
        scanFrame();
      } catch (cameraError) {
        if (active) {
          setScanMessage(cameraError.message || 'เปิดกล้องไม่สำเร็จ กรุณาอนุญาตการใช้กล้องหรือกรอกรหัสพาส');
          setScanning(false);
        }
      }
    }

    startScanner();
    return () => {
      active = false;
      window.clearTimeout(timeoutId);
      stream?.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    };
  }, [scanning]);

  async function handleAuthenticate(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const result = registering
        ? await registerMerchant(registration)
        : await loginMerchant(loginForm.shopName, loginForm.password);
      setMerchant(result.merchant);
      setLoginForm({ shopName: result.merchant.shopName, password: '' });
      setRegistration(EMPTY_REGISTRATION);
      setNotice(registering ? 'ลงทะเบียนสำเร็จ เข้าสู่ระบบร้านค้าแล้ว' : '');
    } catch (requestError) {
      setError(requestError.message || 'เข้าสู่ระบบร้านค้าไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  async function handleLookup(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');
    setScanMessage('');
    setLookupResult(null);
    try {
      const normalizedCode = passCodeFromScan(passCode) || passCode.trim().toUpperCase();
      const result = await lookupMerchantPass(normalizedCode);
      setPassCode(normalizedCode);
      setLookupResult(result);
      if (result.pass.isDemo) {
        setNotice('พาสต้นแบบสำหรับทดลองระบบ — การยืนยันคูปองจะบันทึกในระบบทดสอบเท่านั้น');
      }
    } catch (requestError) {
      setError(requestError.message || 'ตรวจสอบพาสไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  async function handleRedeem(couponId) {
    if (!window.confirm('ยืนยันว่าลูกค้าใช้คูปองนี้แล้วหรือไม่?')) return;
    setLoading(true);
    setError('');
    setNotice('');
    try {
      await redeemMerchantCoupon(couponId);
      setLookupResult((current) => current && ({
        ...current,
        coupons: current.coupons.map((coupon) => coupon.id === couponId
          ? { ...coupon, used: true }
          : coupon),
      }));
      setNotice('ยืนยันใช้คูปองแล้ว');
    } catch (requestError) {
      setError(requestError.message || 'ยืนยันใช้คูปองไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await logoutMerchant();
    } catch (requestError) {
      setError(requestError.message || 'ออกจากระบบร้านค้าไม่สำเร็จ');
    }
    setMerchant(null);
    setLookupResult(null);
    setPassCode('');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <Link to="/" className="font-extrabold text-slate-900 hover:text-orange-600">← DayPass</Link>
          <span className="rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-bold text-orange-700">ศูนย์ร้านค้า</span>
        </header>

        <main className="rounded-3xl border border-orange-100 bg-white p-5 shadow-xl shadow-orange-900/5 sm:p-8">
          {merchant ? (
            <>
              <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-orange-600">บัญชีร้านค้า</p>
                  <h1 className="mt-1 text-2xl font-extrabold text-slate-900">{merchant.shopName}</h1>
                  <p className="mt-1 text-sm text-slate-500">{merchant.district} · เจ้าของร้าน {merchant.ownerName}</p>
                </div>
                <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50" onClick={handleLogout}>
                  ออกจากระบบ
                </button>
              </div>

              <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
                สแกน QR บนพาสของลูกค้า หรือกรอกรหัสพาส ระบบจะแสดงเฉพาะคูปองที่ผูกกับร้านนี้
                <span className="mt-1 block text-xs text-amber-800">พาสที่ขึ้นว่า “ต้นแบบ” ใช้ทดสอบการทำงาน ไม่ใช่การชำระเงินจริง</span>
              </div>

              {scanning && (
                <div className="mb-4 overflow-hidden rounded-2xl bg-slate-950">
                  <video ref={videoRef} className="max-h-80 w-full object-cover" playsInline muted />
                </div>
              )}

              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700"
                  onClick={() => { setScanMessage(''); setScanning((value) => !value); }}
                  type="button"
                >
                  {scanning ? 'ปิดกล้อง' : '📷 สแกน QR'}
                </button>
              </div>
              {scanMessage && <p className="mb-3 text-sm text-slate-600" role="status">{scanMessage}</p>}

              <form className="flex flex-col gap-2 sm:flex-row" onSubmit={handleLookup}>
                <label className="sr-only" htmlFor="merchant-pass-code">รหัสพาส</label>
                <input
                  id="merchant-pass-code"
                  className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 font-mono uppercase tracking-wider outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  value={passCode}
                  onChange={(event) => setPassCode(event.target.value)}
                  placeholder="กรอกรหัส เช่น DP-ABCDE"
                  autoComplete="off"
                  required
                />
                <button className="rounded-xl bg-orange-500 px-5 py-3 font-bold text-white hover:bg-orange-600 disabled:opacity-50" disabled={loading}>
                  {loading ? 'กำลังตรวจสอบ...' : 'ตรวจสอบพาส'}
                </button>
              </form>

              {lookupResult && (
                <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="font-extrabold text-slate-900">{lookupResult.pass.title}</h2>
                      <p className="mt-1 text-xs text-slate-500">รหัส {lookupResult.pass.code} · ใช้ได้ถึง {lookupResult.pass.validDate} · {lookupResult.pass.people} ท่าน</p>
                    </div>
                    {lookupResult.pass.isDemo && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">ต้นแบบ</span>}
                  </div>
                  <div className="mt-4 space-y-3">
                    {lookupResult.coupons.map((coupon) => (
                      <div key={coupon.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
                        <div>
                          <p className="font-bold text-slate-800">{coupon.title}</p>
                          <p className={`mt-0.5 text-xs font-semibold ${coupon.used ? 'text-slate-500' : 'text-emerald-700'}`}>
                            {coupon.used ? 'ใช้สิทธิ์แล้ว' : 'ยังไม่ใช้'}
                          </p>
                        </div>
                        <button
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                          disabled={loading || coupon.used}
                          onClick={() => handleRedeem(coupon.id)}
                          type="button"
                        >
                          ยืนยันใช้สิทธิ์
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-sm font-semibold text-orange-600">DayPass สำหรับผู้ประกอบการ</p>
                <h1 className="mt-1 text-3xl font-extrabold text-slate-900">{registering ? 'ลงทะเบียนร้านค้า' : 'เข้าสู่ระบบร้านค้า'}</h1>
                <p className="mt-2 text-sm text-slate-500">ใช้บัญชีร้านค้าเพื่อตรวจพาสและยืนยันคูปองของร้าน</p>
              </div>

              <div className="mb-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
                <button
                  className={`rounded-lg py-2 text-sm font-bold ${registering ? 'bg-white text-orange-700 shadow-sm' : 'text-slate-500'}`}
                  onClick={() => { setRegistering(true); setError(''); }}
                  type="button"
                >
                  ลงทะเบียน
                </button>
                <button
                  className={`rounded-lg py-2 text-sm font-bold ${!registering ? 'bg-white text-orange-700 shadow-sm' : 'text-slate-500'}`}
                  onClick={() => { setRegistering(false); setError(''); }}
                  type="button"
                >
                  เข้าสู่ระบบ
                </button>
              </div>

              <form className="space-y-4" onSubmit={handleAuthenticate}>
                {registering ? (
                  <>
                    <label className="block text-sm font-semibold text-slate-700">
                      ชื่อร้าน
                      <input
                        className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        list="merchant-eligible-shops"
                        value={registration.shopName}
                        onChange={(event) => setRegistration((current) => ({ ...current, shopName: event.target.value }))}
                        placeholder="เลือกร้านที่ร่วมรายการ"
                        maxLength={160}
                        required
                      />
                      <datalist id="merchant-eligible-shops">
                        {shops.map((shop) => <option key={shop.id} value={shop.name}>{shop.district}</option>)}
                      </datalist>
                    </label>
                    <label className="block text-sm font-semibold text-slate-700">
                      ชื่อเจ้าของร้าน
                      <input
                        className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        value={registration.ownerName}
                        onChange={(event) => setRegistration((current) => ({ ...current, ownerName: event.target.value }))}
                        autoComplete="name"
                        maxLength={120}
                        required
                      />
                    </label>
                    <label className="block text-sm font-semibold text-slate-700">
                      เบอร์โทรศัพท์ร้าน
                      <input
                        className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        value={registration.phone}
                        onChange={(event) => setRegistration((current) => ({ ...current, phone: event.target.value }))}
                        type="tel"
                        autoComplete="tel"
                        maxLength={20}
                        required
                      />
                    </label>
                    <label className="block text-sm font-semibold text-slate-700">
                      ที่อยู่ร้าน
                      <textarea
                        className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        value={registration.address}
                        onChange={(event) => setRegistration((current) => ({ ...current, address: event.target.value }))}
                        autoComplete="street-address"
                        maxLength={300}
                        rows={2}
                        required
                      />
                    </label>
                    <label className="block text-sm font-semibold text-slate-700">
                      รหัสผ่าน
                      <input
                        className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        value={registration.password}
                        onChange={(event) => setRegistration((current) => ({ ...current, password: event.target.value }))}
                        type="password"
                        autoComplete="new-password"
                        minLength={8}
                        maxLength={128}
                        required
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <label className="block text-sm font-semibold text-slate-700">
                      ชื่อร้าน
                      <input
                        className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        list="merchant-eligible-shops"
                        value={loginForm.shopName}
                        onChange={(event) => setLoginForm((current) => ({ ...current, shopName: event.target.value }))}
                        placeholder="ชื่อร้านที่ลงทะเบียนไว้"
                        autoComplete="username"
                        required
                      />
                      <datalist id="merchant-eligible-shops">
                        {shops.map((shop) => <option key={shop.id} value={shop.name}>{shop.district}</option>)}
                      </datalist>
                    </label>
                    <label className="block text-sm font-semibold text-slate-700">
                      รหัสผ่าน
                      <input
                        className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        value={loginForm.password}
                        onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                        type="password"
                        autoComplete="current-password"
                        required
                      />
                    </label>
                  </>
                )}

                {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700" role="alert">{error}</p>}
                {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700" role="status">{notice}</p>}
                <button className="w-full rounded-xl bg-orange-500 px-5 py-3 font-bold text-white hover:bg-orange-600 disabled:opacity-50" disabled={loading || (registering && shops.length === 0)}>
                  {loading ? 'กำลังดำเนินการ...' : registering ? 'ลงทะเบียนและเข้าสู่ระบบ' : 'เข้าสู่ระบบ'}
                </button>
              </form>
              {registering && shops.length === 0 && (
                <p className="mt-4 text-sm text-amber-700">ขณะนี้ยังไม่มีร้านที่เปิดให้ลงทะเบียนในระบบ</p>
              )}
              <p className="mt-5 text-center text-xs leading-relaxed text-slate-500">
                สมัครได้เฉพาะร้านที่มีคูปองและเป็นร้านที่ร่วมรายการในระบบ DayPass
              </p>
            </>
          )}
          {error && merchant && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700" role="alert">{error}</p>}
          {notice && merchant && <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700" role="status">{notice}</p>}
        </main>
      </div>
    </div>
  );
}
