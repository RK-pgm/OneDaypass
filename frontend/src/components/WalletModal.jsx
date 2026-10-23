import React from 'react';
import { X, Coins, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export default function WalletModal({ isOpen, onClose, points = 0, pointValueBaht = 2 }) {
  if (!isOpen) return null;

  const totalBahtValue = points * pointValueBaht;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm glass-panel rounded-3xl p-6 shadow-2xl border border-slate-700/80 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
            <Coins className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">กระเป๋าแต้ม DayPass</h3>
            <p className="text-xs text-slate-400">สะสมแต้มแลกส่วนลดพาสถัดไป</p>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 rounded-2xl p-5 border border-indigo-500/30 mb-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
          <span className="text-xs uppercase tracking-wider font-semibold text-indigo-300">
            แต้มสะสมปัจจุบัน
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-extrabold text-white tracking-tight">{points}</span>
            <span className="text-slate-400 text-sm">แต้ม</span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400">มูลค่าส่วนลดเงินสด</span>
            <span className="text-base font-bold text-amber-400">
              ≈ ฿{totalBahtValue.toLocaleString()} บาท
            </span>
          </div>
        </div>

        {/* Rules & How to Earn */}
        <div className="space-y-3 mb-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            กฎการใช้งาน & วิธีสะสม
          </h4>

          <div className="flex items-start gap-2.5 text-xs text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-white">1 แต้ม = 2 บาท</strong> ลดได้ทันทีตอนซื้อพาสครั้งต่อไป
            </span>
          </div>

          <div className="flex items-start gap-2.5 text-xs text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              ใช้ลดได้สูงสุด <strong className="text-white">30%</strong> ของยอดสั่งซื้อแต่ละครั้ง
            </span>
          </div>

          <div className="flex items-start gap-2.5 text-xs text-slate-300">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              เช็กอินร้านตามแผน + ถ่ายรูปเมนู/จุดแลนด์มาร์ก รับทันที <strong className="text-amber-300">+5 แต้ม/ภารกิจ</strong>
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/30"
        >
          เข้าใจแล้ว
        </button>
      </div>
    </div>
  );
}
