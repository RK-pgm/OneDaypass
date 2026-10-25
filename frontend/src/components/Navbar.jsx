import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getDeviceId, getPoints, logoutAccount } from '../api';

const NAV_ITEMS = [
  { path: '/', label: 'หน้าแรก', icon: '🏠', mobileLabel: 'หน้าแรก' },
  { path: '/plan/new', label: 'วางแผน', icon: '🗺️', mobileLabel: 'แผน' },
  { path: '/quiz', label: 'ควิซ', icon: '🧭', mobileLabel: 'ควิซ' },
  { path: '/history', label: 'ประวัติ', icon: '🎟️', mobileLabel: 'ประวัติ' },
  { path: '/profile', label: 'โปรไฟล์', icon: '👤', mobileLabel: 'ฉัน' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [points, setPoints] = useState(10);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userAuth, setUserAuth] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('daypass_user_auth') || 'null');
    } catch {
      return null;
    }
  });
  const recentPassId = sessionStorage.getItem('daypass_passId') || localStorage.getItem('daypass_recent_pass_id');

  useEffect(() => {
    try {
      setUserAuth(JSON.parse(localStorage.getItem('daypass_user_auth') || 'null'));
    } catch {}
    getPoints(getDeviceId())
      .then((p) => setPoints(p.totalPoints))
      .catch(() => {});
  }, [location]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  function handleGoPass() {
    if (recentPassId) {
      navigate(`/pass/${recentPassId}`);
    } else {
      const input = prompt('กรอกรหัสพาสของคุณ (เช่น DP-4F7K2):', 'DP-4F7K2');
      if (input) navigate(`/pass/${input.trim()}`);
    }
  }

  function handleLogout() {
    logoutAccount();
    navigate('/', { replace: true });
  }

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const activeNavItem = NAV_ITEMS.find((item) => isActive(item.path));

  return (
    <>
      {/* ─── TOP NAVBAR ─── */}
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'shadow-[0_4px_24px_-4px_rgba(0,0,0,0.12)]'
            : ''
        }`}
        style={{
          background: scrolled
            ? 'rgba(255,255,255,0.95)'
            : 'rgba(250,248,245,0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: scrolled
            ? '1px solid rgba(249,115,22,0.12)'
            : '1px solid rgba(0,0,0,0.04)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* ── Brand Logo ── */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 cursor-pointer group select-none"
              aria-label="DayPass หน้าแรก"
            >
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 opacity-20 group-hover:opacity-30 transition-opacity" />
                <div className="w-full h-full rounded-xl overflow-hidden border border-orange-200/50 shadow-md shadow-orange-500/20 group-hover:shadow-orange-500/30 transition-shadow">
                  <img
                    src="/mascot/nong-pass-wave.jpg"
                    alt="น้องพาส"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>
              <div className="leading-none">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 group-hover:text-orange-600 transition-colors duration-200">
                    DayPass
                  </span>
                  <span
                    className="hidden sm:inline text-[10px] font-bold px-1.5 py-0.5 rounded-md tracking-wide"
                    style={{
                      background: 'linear-gradient(135deg,#fff7ed,#ffedd5)',
                      color: '#c2410c',
                      border: '1px solid rgba(249,115,22,0.2)',
                    }}
                  >
                    ✈️ ท่องเที่ยว
                  </span>
                </div>
                <p className="hidden sm:block text-[10.5px] text-slate-400 font-medium mt-0.5">
                  เที่ยว 1 ย่าน ใน 1 วัน
                </p>
              </div>
            </button>

            {/* ── Desktop Nav Links ── */}
            <div className="hidden md:flex items-center gap-0.5 lg:gap-1">
              {[
                { path: '/', label: 'หน้าแรก' },
                { path: '/plan/new', label: '🗺️ วางแผนเที่ยว' },
                { path: '/quiz', label: '🧭 ควิซ' },
                { path: '/history', label: '🎟️ ประวัติพาส' },
              ].map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`
                    px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                    ${isActive(item.path)
                      ? 'text-orange-600 bg-orange-50 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/80'
                    }
                  `}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* ── Right Actions ── */}
            <div className="flex items-center gap-2 sm:gap-2.5">

              <button
                onClick={() => navigate('/merchant')}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition-colors hover:border-orange-300 hover:bg-orange-50"
              >
                🏪 <span className="hidden lg:inline">ร้านค้า</span>
              </button>

              {/* Points pill */}
              <button
                onClick={() => navigate('/profile')}
                title={`${points} แต้ม = ${points * 2} บาท`}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 hover:shadow-md"
                style={{
                  background: 'linear-gradient(135deg,#fef3c7,#fde68a)',
                  color: '#92400e',
                  border: '1px solid rgba(245,158,11,0.3)',
                }}
              >
                <span className="animate-spin-slow">⭐</span>
                <span>{points}</span>
                <span className="hidden sm:inline text-amber-600/70 font-normal">แต้ม</span>
              </button>

              {/* Profile */}
              <button
                onClick={() => navigate('/profile')}
                className={`
                  hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all
                  ${isActive('/profile')
                    ? 'text-white shadow-md'
                    : 'text-slate-700 border border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50'
                  }
                `}
                style={
                  isActive('/profile')
                    ? { background: 'linear-gradient(135deg,#f97316,#f59e0b)', border: 'none' }
                    : {}
                }
                title={userAuth ? `${userAuth.nickname}` : 'โปรไฟล์'}
              >
                <span>👤</span>
                <span className="font-semibold max-w-[80px] truncate">
                  {userAuth?.nickname || 'โปรไฟล์'}
                </span>
              </button>

              {/* Logout / Switch User — desktop */}
              {userAuth && (
                <button
                  onClick={handleLogout}
                  title="ออกจากระบบ / สลับบัญชี"
                  className="hidden lg:flex items-center justify-center w-8 h-8 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-all text-xs"
                >
                  🚪
                </button>
              )}

              {/* CTA Button — desktop */}
              <button
                onClick={() => navigate('/plan/new')}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all duration-200 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg,#f97316,#f59e0b)',
                  boxShadow: '0 4px 16px -4px rgba(249,115,22,0.45)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 6px 20px -4px rgba(249,115,22,0.55)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 16px -4px rgba(249,115,22,0.45)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span>✨ สร้างแผน</span>
              </button>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden btn-icon"
                aria-label={mobileMenuOpen ? 'ปิดเมนู' : 'เปิดเมนู'}
              >
                <span className="text-slate-700 text-lg leading-none">
                  {mobileMenuOpen ? '✕' : '☰'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile Dropdown Menu ── */}
        {mobileMenuOpen && (
          <div
            className="md:hidden animate-slide-down"
            style={{
              background: 'rgba(255,255,255,0.98)',
              backdropFilter: 'blur(24px)',
              borderTop: '1px solid rgba(249,115,22,0.1)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            }}
          >
            <div className="px-5 py-4 flex flex-col gap-2">
              {/* User greeting */}
              {userAuth && (
                <div
                  className="flex items-center gap-3 p-3 rounded-2xl mb-1"
                  style={{ background: 'linear-gradient(135deg,#fff7ed,#fef3c7)' }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#f97316,#f59e0b)' }}
                  >
                    {userAuth.nickname?.[0] || '?'}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{userAuth.nickname}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <span>⭐ {points} แต้ม</span>
                      <span>·</span>
                      <span>🏠 {userAuth.province || 'ไม่ระบุ'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Nav links */}
              {[
                { path: '/', label: '🏠 หน้าแรก' },
                { path: '/plan/new', label: '🗺️ วางแผนเที่ยวใหม่' },
                { path: '/quiz', label: '🧭 ทำควิซหาสไตล์' },
                { path: '/history', label: '📜 ประวัติการซื้อพาส' },
                { path: '/profile', label: '👤 โปรไฟล์ & แต้มสะสม' },
                { path: '/merchant', label: '🏪 ศูนย์ร้านค้า' },
              ].map((item) => (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                  className={`
                    w-full text-left py-3 px-4 rounded-xl text-sm font-semibold transition-all
                    ${isActive(item.path)
                      ? 'bg-orange-50 text-orange-700 font-bold border border-orange-200/50'
                      : 'text-slate-700 hover:bg-slate-50'
                    }
                  `}
                >
                  {item.label}
                </button>
              ))}

              {/* Pass shortcut */}
              {recentPassId && (
                <button
                  onClick={() => { navigate(`/pass/${recentPassId}`); setMobileMenuOpen(false); }}
                  className="w-full text-left py-3 px-4 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                >
                  <span>🎟️ ดูพาสปัจจุบัน</span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: '#d1fae5', color: '#065f46' }}
                  >
                    กำลังใช้งาน
                  </span>
                </button>
              )}

              <div className="h-px bg-slate-100 my-1" />

              <button
                onClick={() => { navigate('/plan/new'); setMobileMenuOpen(false); }}
                className="btn-primary py-3 text-sm font-bold"
              >
                <span>✨ เริ่มวางแผนเที่ยว (ฟรี)</span>
              </button>

              {userAuth && (
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="w-full text-center py-2 px-4 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-100 flex items-center justify-center gap-1.5 transition-all mt-1"
                >
                  <span>🚪</span>
                  <span>ออกจากระบบ / สลับบัญชี</span>
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ─── BOTTOM NAV (Mobile Only) ─── */}
      <nav className="bottom-nav md:hidden" aria-label="เมนูนำทางมือถือ">
        <div className="flex items-center px-1 py-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`bottom-nav-item ${active ? 'active' : ''}`}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.mobileLabel}</span>
                {item.path === '/plan/new' && (
                  <span
                    className="absolute top-1 right-1/2 translate-x-3 w-2 h-2 rounded-full"
                    style={{ background: '#10b981' }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
