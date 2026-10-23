import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getDeviceId, getPoints } from '../api';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [points, setPoints] = useState(10);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const recentPassId = sessionStorage.getItem('daypass_passId') || localStorage.getItem('daypass_recent_pass_id');

  useEffect(() => {
    // Check points
    getPoints(getDeviceId())
      .then((p) => setPoints(p.totalPoints))
      .catch(() => {});

  }, [location]);

  function handleGoPass() {
    if (recentPassId) {
      navigate(`/pass/${recentPassId}`);
    } else {
      const input = prompt('กรอกรหัสพาสของคุณ (เช่น DP-4F7K2):', 'DP-4F7K2');
      if (input) navigate(`/pass/${input.trim()}`);
    }
    setMobileMenuOpen(false);
  }

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/85 border-b border-slate-200/80 transition-all duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <div 
            onClick={() => navigate('/')} 
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-amber-400 flex items-center justify-center text-xl shadow-md shadow-brand-500/30 group-hover:scale-105 transition-transform duration-200">
              🎟️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-slate-900 group-hover:text-brand-500 transition-colors">
                  DayPass
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-brand-50 text-brand-600 border border-brand-200">
                  Bangkok
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-none hidden sm:block">เที่ยว 1 ย่าน ใน 1 วัน</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => navigate('/')}
              className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                isActive('/') 
                  ? 'bg-slate-100 text-slate-900 font-bold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              หน้าแรก
            </button>
            <button
              onClick={() => navigate('/plan/new')}
              className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                isActive('/plan/new') 
                  ? 'bg-slate-100 text-slate-900 font-bold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              วางแผนเที่ยว
            </button>
            <button
              onClick={handleGoPass}
              className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                location.pathname.startsWith('/pass/')
                  ? 'bg-slate-100 text-slate-900 font-bold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>พาสของฉัน</span>
              {recentPassId && (
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              )}
            </button>
          </div>

          {/* Right Action: Points badge + Start CTA */}
          <div className="flex items-center gap-3">
            {/* Points pill */}
            <div 
              title="แต้มสะสมใช้เป็นส่วนลดพาสถัดไปได้ (1 แต้ม = 2 บาท)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold cursor-default"
            >
              <span className="animate-spin-slow">🌟</span>
              <span>{points} แต้ม</span>
              <span className="hidden sm:inline text-slate-400 font-normal">({points * 2}฿)</span>
            </div>

            {/* Desktop Start button */}
            <button
              onClick={() => navigate('/plan/new')}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 hover:to-amber-500 shadow-md shadow-brand-500/20 active:scale-95 transition-all duration-150 cursor-pointer"
            >
              <span>✨ สร้างแผน</span>
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 active:scale-95 transition-transform"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-2xl px-5 py-4 flex flex-col gap-3 shadow-xl animate-fade-in">
          <button
            onClick={() => { navigate('/'); setMobileMenuOpen(false); }}
            className={`w-full text-left py-2.5 px-3 rounded-xl text-sm font-medium ${isActive('/') ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-600'}`}
          >
            🏠 หน้าแรก
          </button>
          <button
            onClick={() => { navigate('/plan/new'); setMobileMenuOpen(false); }}
            className={`w-full text-left py-2.5 px-3 rounded-xl text-sm font-medium ${isActive('/plan/new') ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-600'}`}
          >
            🗺️ วางแผนเที่ยวใหม่
          </button>
          <button
            onClick={handleGoPass}
            className="w-full text-left py-2.5 px-3 rounded-xl text-sm font-medium text-slate-600 flex items-center justify-between"
          >
            <span>🎟️ ดูพาสของฉัน</span>
            {recentPassId && <span className="badge bg-green-50 text-green-700 border border-green-200 text-[10px]">มีพาสใช้งาน</span>}
          </button>
          <div className="divider my-1" />
          <button
            onClick={() => { navigate('/plan/new'); setMobileMenuOpen(false); }}
            className="btn-primary py-3 text-center text-sm font-bold"
          >
            ✨ เริ่มวางแผนเที่ยว (ฟรี)
          </button>
        </div>
      )}
    </nav>
  );
}
