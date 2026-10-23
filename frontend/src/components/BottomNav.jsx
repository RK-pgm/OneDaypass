import React from 'react';
import { NavLink } from 'react-router-dom';
import { Compass, Map, Ticket, Coins } from 'lucide-react';

export default function BottomNav({ onOpenWallet, activePassCount = 0 }) {
  const navItemClass = ({ isActive }) =>
    `flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all ${
      isActive
        ? 'text-indigo-400 font-semibold'
        : 'text-slate-400 hover:text-slate-200'
    }`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-3 pointer-events-none">
      <nav className="max-w-md mx-auto pointer-events-auto glass-nav rounded-3xl shadow-2xl shadow-black/80 px-4 py-1.5 flex items-center justify-around border border-slate-700/60">
        <NavLink to="/" className={navItemClass} end>
          <Compass className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">สำรวจ</span>
        </NavLink>

        <NavLink to="/map" className={navItemClass}>
          <Map className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">แผนที่</span>
        </NavLink>

        <NavLink to="/passes" className={({ isActive }) => `${navItemClass({ isActive })} relative`}>
          <div className="relative">
            <Ticket className="w-5 h-5 mb-0.5" />
            {activePassCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-slate-900 animate-ping"></span>
            )}
          </div>
          <span className="text-[11px]">พาสของฉัน</span>
        </NavLink>

        <button
          onClick={onOpenWallet}
          className="flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl text-slate-400 hover:text-amber-300 transition-colors"
        >
          <Coins className="w-5 h-5 mb-0.5 text-amber-400" />
          <span className="text-[11px]">แต้มสะสม</span>
        </button>
      </nav>
    </div>
  );
}
