import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Calendar, Users, ChevronRight, Sparkles, Plus } from 'lucide-react';
import { getSavedPassIds } from '../utils/device';
import { getPass } from '../api';

export default function MyPassesPage() {
  const navigate = useNavigate();
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = getSavedPassIds();
    if (ids.length === 0) {
      setLoading(false);
      return;
    }

    Promise.allSettled(ids.map((id) => getPass(id)))
      .then((results) => {
        const successful = results
          .filter((r) => r.status === 'fulfilled')
          .map((r) => r.value);
        setPasses(successful);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="pb-28 max-w-md mx-auto px-4 pt-4 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white">บัตรท่องเที่ยวของฉัน</h1>
          <p className="text-xs text-slate-400">ประวัติ DayPass ที่ซื้อไว้ทั้งหมด</p>
        </div>

        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>ซื้อพาสใหม่</span>
        </button>
      </div>

      {loading ? (
        <div className="pt-16 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="text-xs text-slate-400">กำลังโหลดรายการพาส...</div>
        </div>
      ) : passes.length === 0 ? (
        <div className="glass-panel rounded-3xl p-8 text-center space-y-4 border border-slate-800">
          <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-2xl">
            🎫
          </div>
          <div>
            <h3 className="font-bold text-base text-white">ยังไม่มี DayPass</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
              เลือกงบและสไตล์ในหน้าแรก เพื่อออกแผนเที่ยวและรับบัตรพาสพร้อมคูปองส่วนลด
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30"
          >
            สร้างแผนเที่ยวใบแรก
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {passes.map((p) => {
            const plan = p.plan || {};
            const itemCount = plan.items ? plan.items.length : 0;
            const couponCount = p.coupons ? p.coupons.length : 0;

            return (
              <div
                key={p.id}
                onClick={() => navigate(`/pass/${p.id}`)}
                className="glass-card rounded-2xl p-4 border border-slate-800/80 hover:border-indigo-500/40 cursor-pointer transition-all space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-extrabold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md">
                    {p.code}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {p.status}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors">
                  {plan.title || 'DayPass ตลาดน้อย'}
                </h3>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800">
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{p.validDate}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-500" />
                      <span>{p.people} คน</span>
                    </span>
                  </div>

                  <span className="text-[11px] font-semibold text-indigo-400 flex items-center gap-0.5">
                    <span>เปิดบัตร</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
