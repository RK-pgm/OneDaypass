import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Ticket, Coins, MapPin, Sparkles, Award } from 'lucide-react';

export default function Navbar({ points = 0, onOpenWallet, onOpenPitch }) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-400 p-0.5 shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Ticket className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                DayPass
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                PRO
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <MapPin className="w-2.5 h-2.5 text-slate-400 inline" />
              <span>ตลาดน้อย</span>
            </div>
          </div>
        </Link>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Pitch Deck helper button for judges */}
          <button
            onClick={onOpenPitch}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium hover:bg-amber-500/25 transition-colors"
            title="คลิกดูจุดเด่นธุรกิจ Make Me Money สำหรับกรรมการ"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
            <span className="hidden sm:inline">Pitch</span>
            <span>Biz</span>
          </button>

          {/* Points Wallet Pill */}
          <button
            onClick={onOpenWallet}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-indigo-500/50 text-xs font-semibold text-slate-200 transition-all hover:scale-102 active:scale-98"
          >
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>{points}</span>
            <span className="text-[10px] text-slate-400 font-normal">แต้ม</span>
          </button>
        </div>
      </div>
    </header>
  );
}
