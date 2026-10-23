import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Tag,
  Camera,
  Coins,
  ChevronRight,
  Map,
  List,
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import LeafletMap from '../components/LeafletMap';

const PASS_BASE_PRICE = 199; // 199 ฿/คน

export default function PlanPreviewPage({ plan, people = 1 }) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'

  if (!plan || !plan.items || plan.items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 pt-16 text-center space-y-4">
        <div className="text-4xl">🗺️</div>
        <h2 className="text-lg font-bold text-white">ยังไม่มีแผนเที่ยวที่เลือก</h2>
        <p className="text-xs text-slate-400">กรุณากลับไปเลือกงบและสไตล์ในหน้าแรกก่อน</p>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 rounded-2xl bg-indigo-600 text-white text-xs font-semibold"
        >
          กลับหน้าหลัก
        </button>
      </div>
    );
  }

  const totalPassPrice = PASS_BASE_PRICE * people;
  const couponCount = plan.items.filter((i) => i.coupon).length;
  const missionCount = plan.items.filter((i) => i.mission).length;
  const totalPointsPotential = missionCount * 5;

  return (
    <div className="pb-36 max-w-md mx-auto px-4 pt-3 space-y-4 animate-fade-in">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ปรับแต่งใหม่</span>
        </button>

        {/* View Toggle */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-0.5">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              viewMode === 'list'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>ไทม์ไลน์</span>
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              viewMode === 'map'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>แผนที่เส้นทาง</span>
          </button>
        </div>
      </div>

      {/* Plan Header Card */}
      <div className="glass-panel rounded-3xl p-5 border border-indigo-500/30 space-y-3 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
            {plan.style === 'challenge' ? 'สายลุย Challenge' : 'สายชิล Chill'}
          </span>
          <span className="text-xs text-slate-400">• ตลาดน้อย</span>
        </div>

        <h1 className="text-lg font-extrabold text-white leading-snug">
          {plan.title}
        </h1>

        {/* Benefits summary row */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/80 text-center">
          <div className="bg-slate-900/80 rounded-2xl p-2 border border-slate-800">
            <div className="text-[10px] text-slate-400">จุดแวะทั้งหมด</div>
            <div className="text-sm font-bold text-white mt-0.5">{plan.items.length} จุด</div>
          </div>
          <div className="bg-slate-900/80 rounded-2xl p-2 border border-slate-800">
            <div className="text-[10px] text-slate-400">คูปองร้านเด็ด</div>
            <div className="text-sm font-bold text-emerald-400 mt-0.5">{couponCount} ใบ</div>
          </div>
          <div className="bg-slate-900/80 rounded-2xl p-2 border border-slate-800">
            <div className="text-[10px] text-slate-400">ล่าแต้มได้สูงสุด</div>
            <div className="text-sm font-bold text-amber-400 mt-0.5">+{totalPointsPotential} แต้ม</div>
          </div>
        </div>
      </div>

      {/* Map View Mode */}
      {viewMode === 'map' && (
        <div className="space-y-2 animate-fade-in">
          <LeafletMap routeItems={plan.items} height="360px" />
          <div className="text-center text-[11px] text-slate-400">
            เส้นทางเดินเที่ยวเรียงลำดับจุดที่ 1 ถึง {plan.items.length} ในย่านตลาดน้อย
          </div>
        </div>
      )}

      {/* List Timeline View Mode */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              แผนการเดินทางเรียงเวลาจริง
            </span>
            <span>{plan.items.length} จุดเช็กอิน</span>
          </div>

          <div className="relative pl-4 space-y-4 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-indigo-400/50 before:to-slate-800">
            {plan.items.map((item, index) => (
              <div key={item.shopId} className="relative group">
                {/* Timeline node icon */}
                <div className="absolute -left-4 top-1.5 w-5 h-5 rounded-full bg-slate-950 border-2 border-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shadow-md">
                  {item.order}
                </div>

                <div className="ml-3 glass-card rounded-2xl p-3.5 border border-slate-800/80 hover:border-indigo-500/40 transition-colors space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">
                      ⏰ {item.time} น. ({item.durationMin} นาที)
                    </span>
                    <span className="text-xs font-semibold text-slate-300">
                      งบ ~฿{item.estCost}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-white">{item.shopName}</h3>
                    <p className="text-xs text-slate-300 mt-0.5">{item.activity}</p>
                  </div>

                  {item.distanceFromPrevKm > 0 && (
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>เดินจากจุดก่อนหน้า {item.distanceFromPrevKm} กม. (~{Math.round(item.distanceFromPrevKm * 12)} นาที)</span>
                    </div>
                  )}

                  {/* Highlights pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.coupon && (
                      <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        <Tag className="w-3 h-3 text-emerald-400" />
                        <span>คูปอง: {item.coupon.title}</span>
                      </div>
                    )}
                    {item.mission && (
                      <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                        <Camera className="w-3 h-3 text-amber-400" />
                        <span>มิชชั่น: {item.mission.title} (+{item.mission.points} แต้ม)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Value Proposition Note */}
      <div className="bg-slate-900/60 rounded-2xl p-3 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          ซื้อ DayPass ครั้งเดียว ได้ครบทั้งแผนเวลา คูปองอาหารร้านละ 2-3 ร้าน และสิทธิ์ทำมิชชั่นรับแต้ม
        </span>
      </div>

      {/* Sticky Bottom Checkout Action */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 glass-nav border-t border-slate-800/90 shadow-2xl">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] text-slate-400">
              ราคาพาส ({people} คน)
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-amber-400">
                ฿{totalPassPrice}
              </span>
              <span className="text-[11px] text-slate-400 line-through">
                ฿{plan.totalCostPerPerson * people}
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-transform hover:scale-101 active:scale-99"
          >
            <span>ซื้อ DayPass นี้</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
