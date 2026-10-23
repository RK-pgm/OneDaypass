import React from 'react';
import { X, TrendingUp, DollarSign, Users, Store, Target, Sparkles } from 'lucide-react';

export default function PitchModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-md glass-panel rounded-3xl p-6 shadow-2xl border border-amber-500/30 relative my-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
              Make Me Money Pitch
            </span>
            <h3 className="font-bold text-lg text-white">โมเดลธุรกิจ DayPass</h3>
          </div>
        </div>

        <p className="text-xs text-slate-300 mb-5 leading-relaxed">
          DayPass เปลี่ยนการเดินเที่ยวที่กระจัดกระจาย ให้กลายเป็น <strong>"แพ็กเกจพาสเที่ยว 1 ย่าน"</strong> ที่สร้างรายได้ตั้งแต่วันแรก ไม่ใช่แค่แอปดูรีวิวฟรี
        </p>

        {/* 3 Pillars of Monetization */}
        <div className="space-y-3 mb-5">
          {/* Revenue Stream 1 */}
          <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <DollarSign className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">1. ค่า DayPass Ticket (199-399 ฿/คน)</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                รายได้หลักจากการขายพาสสำเร็จรูป Platform หัก Gross Margin 25-30% (~60 บาท/พาส) ส่วนที่เหลือคือส่วนลดคูปองอาหารร้านพันธมิตร
              </p>
            </div>
          </div>

          {/* Revenue Stream 2 */}
          <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <Store className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">2. ค่าคอมมิชชันร้านค้า (Merchant Rev-Share)</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                ร้านได้ลูกค้ากลุ่มคุณภาพที่พร้อมจ่ายตามแผนเที่ยว ร้านจ่ายค่า GP พิเศษเฉพาะบิลที่เกิดจากการ Redeem คูปอง DayPass
              </p>
            </div>
          </div>

          {/* Revenue Stream 3 */}
          <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <Target className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">3. สปอนเซอร์มิชชั่น & จุดเช็กอิน (Brand Quests)</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                แบรนด์เครื่องดื่ม/สินค้าท้องถิ่นซื้อสปอนเซอร์ภารกิจ เช่น "ถ่ายรูปคู่ขวดชา รับแต้ม x2" สร้างรายได้ B2B ประจำเดือน
              </p>
            </div>
          </div>
        </div>

        {/* Flywheel Retention */}
        <div className="bg-indigo-950/40 rounded-2xl p-3.5 border border-indigo-500/20 mb-5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>วงจรสร้างการกลับมาซื้อซ้ำ (Flywheel)</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            แต้มที่ได้จากภารกิจถ่ายรูป <strong>ใช้เป็นส่วนลดพาสย่านต่อไปได้ทันที</strong> (เช่น ตลาดน้อย ➜ ทรงวาด ➜ อารีย์) ล็อกให้ผู้ใช้ไม่หนีไปไหน
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all"
        >
          ปิดหน้าต่าง Pitch
        </button>
      </div>
    </div>
  );
}
