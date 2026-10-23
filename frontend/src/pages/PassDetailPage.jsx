import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Ticket,
  QrCode,
  MapPin,
  CheckCircle2,
  Lock,
  Camera,
  Coins,
  Sparkles,
  Calendar,
  Users,
  ChevronRight,
  X,
  AlertCircle,
  Tag,
  Clock,
  Navigation,
  Upload
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getPass, redeemCoupon, checkin, submitMission } from '../api';
import { getDeviceId } from '../utils/device';

export default function PassDetailPage({ onPointsUpdated }) {
  const { passId } = useParams();
  const navigate = useNavigate();
  const deviceId = getDeviceId();

  const [pass, setPass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active Tab: 'timeline' | 'coupons' | 'missions'
  const [activeTab, setActiveTab] = useState('timeline');

  // Presentation Demo GPS Simulation Mode (defaults to true for hackathon!)
  const [simulateGps, setSimulateGps] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);

  // Modals
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [missionTarget, setMissionTarget] = useState(null);

  // Load pass data
  const loadPassData = () => {
    if (!passId) return;
    setLoading(true);
    getPass(passId)
      .then((data) => {
        setPass(data);
        setError(null);
      })
      .catch((err) => {
        console.error('Failed to load pass', err);
        setError(err.message || 'ไม่พบข้อมูลบัตรท่องเที่ยว');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPassData();
  }, [passId]);

  // Handle Check-in
  const handleCheckin = async (shopId) => {
    setActionLoading(true);
    setActionMsg(null);

    let lat = 13.7335;
    let lng = 100.5126;

    if (!simulateGps && navigator.geolocation) {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch (err) {
        console.warn('Geolocation failed, falling back to simulated GPS', err);
      }
    }

    try {
      const res = await checkin({
        passId,
        shopId,
        lat,
        lng,
        simulate: simulateGps
      });

      if (res && res.ok) {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
        setActionMsg(`เช็กอินสำเร็จ! ห่างจากร้านเพียง ${res.distanceM} เมตร และปลดล็อกภารกิจแล้ว 🎉`);
        loadPassData();
      }
    } catch (err) {
      console.error(err);
      setActionMsg(`เช็กอินไม่สำเร็จ: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Coupon Redemption
  const handleRedeemCoupon = async () => {
    if (!selectedCoupon) return;
    setActionLoading(true);

    try {
      const res = await redeemCoupon(selectedCoupon.id, passId);
      if (res && res.ok) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setSelectedCoupon(null);
        loadPassData();
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'ไม่สามารถใช้งานคูปองได้');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Mission Submit
  const handleMissionSubmit = async (missionId, imageFile = null) => {
    setActionLoading(true);

    try {
      const res = await submitMission({
        missionId,
        passId,
        deviceId,
        imageFile
      });

      if (res && res.ok) {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
        setMissionTarget(null);
        if (onPointsUpdated) onPointsUpdated(res.totalPoints);
        loadPassData();
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'ส่งภาพภารกิจไม่สำเร็จ');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 pt-24 text-center space-y-3">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <div className="text-sm font-semibold text-slate-300">กำลังโหลดบัตร DayPass...</div>
      </div>
    );
  }

  if (error || !pass) {
    return (
      <div className="max-w-md mx-auto px-4 pt-16 text-center space-y-4">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-lg font-bold text-white">ไม่พบบัตร DayPass</h2>
        <p className="text-xs text-slate-400">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 rounded-2xl bg-indigo-600 text-white text-xs font-semibold"
        >
          กลับหน้าหลัก
        </button>
      </div>
    );
  }

  const checkinSet = new Set((pass.checkins || []).map((c) => c.shopId));
  const unlockedSet = new Set(pass.unlockedMissionIds || []);

  return (
    <div className="pb-32 max-w-md mx-auto px-4 pt-3 space-y-4 animate-fade-in">
      {/* Presentation Demo Banner */}
      <div className="glass-panel rounded-2xl p-3 border border-amber-500/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <div>
            <div className="text-xs font-bold text-white">โหมดจำลองสำหรับกรรมการ</div>
            <div className="text-[10px] text-slate-400">เช็กอินและทดสอบได้ทันทีบนเวที</div>
          </div>
        </div>

        <button
          onClick={() => setSimulateGps(!simulateGps)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            simulateGps
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}
        >
          {simulateGps ? 'เปิดจำลอง GPS' : 'GPS จริง (150ม.)'}
        </button>
      </div>

      {actionMsg && (
        <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between animate-fade-in">
          <span>{actionMsg}</span>
          <button onClick={() => setActionMsg(null)} className="text-emerald-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main DayPass Ticket Card */}
      <div className="rounded-3xl p-5 border border-indigo-500/40 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/15 rounded-full blur-3xl"></div>

        {/* Top Badges */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              Active Pass
            </span>
          </div>

          <div className="font-mono text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-indigo-300">
            {pass.code}
          </div>
        </div>

        {/* Pass Title */}
        <h1 className="text-base font-extrabold text-white leading-snug">
          {pass.plan.title}
        </h1>

        {/* Pass Info Row */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>ใช้ได้วันนี้: {pass.validDate}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>ผู้ร่วมทริป: {pass.people} คน</span>
          </div>
        </div>

        {/* Show QR Action Button */}
        <button
          onClick={() => setShowQrModal(true)}
          className="mt-4 w-full py-2.5 rounded-2xl bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-bold flex items-center justify-center gap-2 border border-indigo-400/30 shadow-lg shadow-indigo-600/20 transition-all hover:scale-101"
        >
          <QrCode className="w-4 h-4" />
          <span>แสดง QR พาสหน้าร้าน</span>
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex bg-slate-900 border border-slate-800 rounded-2xl p-1 gap-1">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'timeline'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>แผนเที่ยว ({pass.plan.items.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('coupons')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'coupons'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>คูปองอาหาร ({pass.coupons.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('missions')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'missions'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>มิชชั่นแต้ม ({pass.plan.items.filter((i) => i.mission).length})</span>
        </button>
      </div>

      {/* TAB 1: Timeline & Check-in */}
      {activeTab === 'timeline' && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              เช็กอินตามจุดเที่ยวเพื่อปลดล็อกมิชชั่น
            </span>
            <span className="text-emerald-400 font-bold">
              เช็กอินแล้ว {pass.checkins.length}/{pass.plan.items.length} จุด
            </span>
          </div>

          <div className="space-y-3">
            {pass.plan.items.map((item) => {
              const isCheckedIn = checkinSet.has(item.shopId);

              return (
                <div
                  key={item.shopId}
                  className={`glass-card rounded-2xl p-4 border transition-all ${
                    isCheckedIn
                      ? 'border-emerald-500/40 bg-emerald-950/20'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">
                      จุดที่ {item.order} • {item.time} น.
                    </span>

                    {isCheckedIn ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>เช็กอินสำเร็จแล้ว</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleCheckin(item.shopId)}
                        disabled={actionLoading}
                        className="flex items-center gap-1 px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-transform active:scale-95 disabled:opacity-50"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>กดเช็กอินที่ร้าน</span>
                      </button>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-white">{item.shopName}</h3>
                  <p className="text-xs text-slate-300 mt-1">{item.activity}</p>

                  <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-slate-800/80 text-[11px]">
                    {item.coupon && (
                      <span className="text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        🎟️ มีคูปอง: {item.coupon.title}
                      </span>
                    )}
                    {item.mission && (
                      <span className="text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md">
                        📸 ภารกิจ: {item.mission.title} (+{item.mission.points} แต้ม)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Food Coupons */}
      {activeTab === 'coupons' && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              คูปองสำหรับแสดงที่ร้านค้า (ใช้ได้ร้านละ 1 ครั้ง)
            </span>
          </div>

          {pass.coupons.length === 0 ? (
            <div className="glass-panel rounded-2xl p-6 text-center text-xs text-slate-400">
              ไม่มีคูปองในพาสนี้
            </div>
          ) : (
            pass.coupons.map((coupon) => (
              <div
                key={coupon.id}
                className={`glass-card rounded-2xl p-4 border relative overflow-hidden transition-all ${
                  coupon.used
                    ? 'border-slate-800 opacity-60'
                    : 'border-emerald-500/40 bg-gradient-to-r from-emerald-950/20 via-slate-900 to-slate-900 shadow-lg shadow-emerald-950/20'
                }`}
              >
                {/* Coupon left notched cut */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0b0f19] border border-slate-700"></div>
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0b0f19] border border-slate-700"></div>

                <div className="flex items-start justify-between pl-3 pr-2">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      Food Voucher
                    </span>
                    <h3 className="font-bold text-sm text-white pt-0.5">{coupon.title}</h3>
                    <p className="text-xs text-slate-400">{coupon.valueText}</p>
                  </div>

                  {coupon.used ? (
                    <span className="shrink-0 px-2.5 py-1 rounded-xl bg-slate-800 text-slate-500 text-xs font-bold border border-slate-700">
                      ใช้งานแล้ว
                    </span>
                  ) : (
                    <button
                      onClick={() => setSelectedCoupon(coupon)}
                      className="shrink-0 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold shadow-md shadow-emerald-500/25 transition-transform active:scale-95"
                    >
                      กดใช้สิทธิ์
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: Photo Missions & Points */}
      {activeTab === 'missions' && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              ถ่ายรูปเพื่อรับแต้มส่วนลดพาสถัดไป
            </span>
          </div>

          <div className="space-y-3">
            {pass.plan.items
              .filter((item) => item.mission)
              .map((item) => {
                const isCheckedIn = checkinSet.has(item.shopId);
                const isUnlocked = unlockedSet.has(item.mission.id);

                return (
                  <div
                    key={item.mission.id}
                    className={`glass-card rounded-2xl p-4 border transition-all ${
                      isUnlocked
                        ? 'border-amber-500/40 bg-amber-950/15 shadow-lg'
                        : 'border-slate-800 opacity-70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">{item.shopName}</span>
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30">
                            +{item.mission.points} แต้ม
                          </span>
                        </div>
                        <h4 className="font-semibold text-xs text-slate-200">
                          {item.mission.title}
                        </h4>
                      </div>

                      {isUnlocked ? (
                        <button
                          onClick={() => setMissionTarget(item.mission)}
                          className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-transform"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>ส่งรูปภารกิจ</span>
                        </button>
                      ) : (
                        <div className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 text-slate-500 text-[11px] font-semibold border border-slate-800">
                          <Lock className="w-3.5 h-3.5" />
                          <span>ต้องเช็กอินก่อน</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Coupon Redeem Confirmation Modal */}
      {selectedCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm glass-panel rounded-3xl p-6 shadow-2xl border border-emerald-500/40 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <Tag className="w-6 h-6 text-emerald-400" />
            </div>

            <div>
              <h3 className="font-bold text-base text-white">{selectedCoupon.title}</h3>
              <p className="text-xs text-slate-400 mt-1">{selectedCoupon.valueText}</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-amber-300">
              ⚠️ กรุณายื่นหน้าจอนี้ให้พนักงานร้านกดเพื่อยืนยันการรับสิทธิ์
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedCoupon(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleRedeemCoupon}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/25"
              >
                {actionLoading ? 'กำลังใช้...' : 'พนักงานกดยืนยัน'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mission Photo Upload / Camera Modal */}
      {missionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm glass-panel rounded-3xl p-6 shadow-2xl border border-amber-500/40 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto">
              <Camera className="w-6 h-6 text-amber-400" />
            </div>

            <div>
              <h3 className="font-bold text-base text-white">{missionTarget.title}</h3>
              <p className="text-xs text-amber-300 mt-0.5">
                สำเร็จภารกิจ รับทันที +{missionTarget.points} แต้ม
              </p>
            </div>

            <div className="p-4 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/60 flex flex-col items-center justify-center gap-2">
              <Upload className="w-6 h-6 text-slate-400" />
              <span className="text-xs text-slate-300">ถ่ายรูปเมนูหรือสถานที่ที่ร้าน</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                id="mission-file-input"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleMissionSubmit(missionTarget.id, e.target.files[0]);
                  }
                }}
              />
              <label
                htmlFor="mission-file-input"
                className="cursor-pointer py-1.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-600"
              >
                เลือกรูปถ่าย / เปิดกล้อง
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setMissionTarget(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                ยกเลิก
              </button>
              {/* Demo button for quick presentation on stage */}
              <button
                onClick={() => handleMissionSubmit(missionTarget.id, null)}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/25"
              >
                {actionLoading ? 'กำลังตรวจ...' : 'จำลองส่งรูป (+5 แต้ม)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Pass QR Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm glass-panel rounded-3xl p-6 shadow-2xl border border-indigo-500/40 text-center space-y-4 relative">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
              DayPass Official Ticket
            </span>

            <div className="bg-white p-4 rounded-2xl inline-block shadow-2xl">
              <div className="w-52 h-52 bg-slate-950 flex flex-col items-center justify-center rounded-xl text-white font-mono p-4 space-y-2">
                <QrCode className="w-28 h-28 text-indigo-400" />
                <div className="text-base font-extrabold tracking-widest text-amber-400">
                  {pass.code}
                </div>
                <div className="text-[10px] text-slate-400">
                  {pass.people} คน • ตลาดน้อย
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-300">
              แสดง QR นี้แก่พนักงานเพื่อรับสิทธิประโยชน์และส่วนลด
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
