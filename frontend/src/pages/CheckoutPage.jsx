import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  QrCode,
  Coins,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { createOrder, confirmOrder, getPoints } from '../api';
import { getDeviceId, savePassId } from '../utils/device';

export default function CheckoutPage({ plan, people = 1, onPassPurchased }) {
  const navigate = useNavigate();
  const deviceId = getDeviceId();

  const [availablePoints, setAvailablePoints] = useState(0);
  const [pointValueBaht, setPointValueBaht] = useState(2);
  const [usePoints, setUsePoints] = useState(0);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Fetch available points first
  useEffect(() => {
    getPoints(deviceId)
      .then((data) => {
        setAvailablePoints(data.totalPoints || 0);
        setPointValueBaht(data.pointValueBaht || 2);
      })
      .catch((err) => console.error('Failed to get points', err));
  }, [deviceId]);

  // Create order whenever usePoints or plan changes
  useEffect(() => {
    if (!plan) return;

    setLoading(true);
    setError(null);

    createOrder({
      deviceId,
      plan,
      people,
      usePoints
    })
      .then((orderData) => {
        setOrder(orderData);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || 'ไม่สามารถสร้างออเดอร์ได้');
      })
      .finally(() => setLoading(false));
  }, [plan, people, usePoints, deviceId]);

  // Handle mock payment confirmation
  const handleConfirmPayment = async () => {
    if (!order) return;

    setConfirming(true);
    setError(null);

    try {
      const res = await confirmOrder(order.orderId);
      if (res && res.passId) {
        // Trigger celebratory confetti
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });

        savePassId(res.passId);
        if (onPassPurchased) onPassPurchased(res.passId);

        // Transition to active DayPass view
        setTimeout(() => {
          navigate(`/pass/${res.passId}`);
        }, 800);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'เกิดข้อผิดพลาดในการยืนยันคำสั่งซื้อ');
      setConfirming(false);
    }
  };

  const handleCopyPromptPay = () => {
    navigator.clipboard.writeText('0812345678');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!plan) {
    return (
      <div className="max-w-md mx-auto px-4 pt-16 text-center space-y-4">
        <h2 className="text-lg font-bold text-white">ไม่พบคำสั่งซื้อ</h2>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 rounded-2xl bg-indigo-600 text-white text-xs font-semibold"
        >
          กลับหน้าหลัก
        </button>
      </div>
    );
  }

  const grossTotal = people * 199;
  const maxDiscountAllowed = Math.floor(grossTotal * 0.3);
  const maxUsablePoints = Math.min(availablePoints, Math.floor(maxDiscountAllowed / pointValueBaht));

  return (
    <div className="pb-28 max-w-md mx-auto px-4 pt-3 space-y-4 animate-fade-in">
      {/* Top Nav */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>ย้อนกลับไปดูแผน</span>
      </button>

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-extrabold text-white tracking-tight">
          ชำระเงิน DayPass
        </h1>
        <p className="text-xs text-slate-400">
          สแกน QR PromptPay เพื่อออกบัตรพาสและรับคูปองอาหารทันที
        </p>
      </div>

      {/* Order Summary & Points Reducer */}
      <div className="glass-panel rounded-3xl p-5 border border-slate-700/80 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="text-xs font-bold text-white truncate max-w-[220px]">
              {plan.title}
            </div>
            <div className="text-[11px] text-slate-400">
              สำหรับ {people} คน • รวมคูปองอาหาร {plan.items.filter((i) => i.coupon).length} ใบ
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-white">฿{grossTotal}</span>
          </div>
        </div>

        {/* Points Discount Slider */}
        {availablePoints > 0 ? (
          <div className="space-y-2 bg-indigo-950/40 rounded-2xl p-3.5 border border-indigo-500/20">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-indigo-300 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>ใช้แต้มสะสมแลกส่วนลด</span>
              </span>
              <span className="text-amber-400 font-bold">
                -{usePoints * pointValueBaht} บาท ({usePoints} แต้ม)
              </span>
            </div>

            <input
              type="range"
              min="0"
              max={maxUsablePoints}
              step="1"
              value={usePoints}
              onChange={(e) => setUsePoints(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />

            <div className="flex justify-between text-[10px] text-slate-400">
              <span>คุณมี {availablePoints} แต้ม</span>
              <span>ใช้ได้สูงสุด {maxUsablePoints} แต้ม (-฿{maxUsablePoints * pointValueBaht})</span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/60 rounded-2xl p-3 border border-slate-800/80 text-xs text-slate-400 flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              คุณยังไม่มีแต้มสะสม ทำมิชชั่นในทริปนี้เพื่อรับแต้มใช้เป็นส่วนลดพาสครั้งถัดไป!
            </span>
          </div>
        )}

        {/* Final Net Amount */}
        <div className="pt-1 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">ยอดชำระสุทธิ</span>
          <span className="text-2xl font-black text-amber-400">
            ฿{order ? order.amount : grossTotal}
          </span>
        </div>
      </div>

      {/* PromptPay QR Section */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-700/80 text-center space-y-4 shadow-xl relative overflow-hidden">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
          <QrCode className="w-4 h-4 text-indigo-400" />
          <span>PromptPay QR</span>
        </div>

        {/* QR Code Container */}
        <div className="mx-auto w-56 h-56 bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center gap-2 text-slate-500 text-xs">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span>กำลังสร้าง QR Code...</span>
            </div>
          ) : order && order.qrDataUrl ? (
            <img
              src={order.qrDataUrl}
              alt="PromptPay QR Code"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-xs text-rose-500">สร้าง QR ไม่สำเร็จ</div>
          )}
        </div>

        {/* PromptPay Info */}
        <div className="bg-slate-900/80 rounded-2xl p-3 border border-slate-800 space-y-1.5">
          <div className="text-[11px] text-slate-400">
            สแกนจ่ายผ่านแอปพลิเคชันธนาคารทุกแห่ง หรือโอนไปที่
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono text-sm font-bold text-white tracking-wider">
              081-234-5678
            </span>
            <button
              onClick={handleCopyPromptPay}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
            </button>
          </div>
          <div className="text-[10px] text-slate-500">
            ชื่อบัญชี: DayPass Official (บริษัท เดย์พาส จำกัด)
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* "ฉันโอนแล้ว" Confirmation Button */}
        <div className="space-y-2 pt-2">
          <button
            onClick={handleConfirmPayment}
            disabled={confirming || loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 hover:from-emerald-400 hover:to-emerald-400 text-slate-950 font-extrabold text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 transition-transform hover:scale-101 active:scale-99 disabled:opacity-50"
          >
            {confirming ? (
              <>
                <div className="w-5 h-5 border-3 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                <span>กำลังออกบัตร DayPass...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>ฉันโอนเงินแล้ว (ออกพาสทันที)</span>
              </>
            )}
          </button>

          <p className="text-[10px] text-slate-400">
            ⚡ เดโม่สำหรับการแข่งขัน: กดปุ่มเพื่อยืนยันและออกพาสพร้อมคูปองได้ทันที
          </p>
        </div>
      </div>
    </div>
  );
}
