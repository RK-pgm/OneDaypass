import { useState, useEffect, lazy, Suspense } from 'react';
import { Link, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import NongPassWidget from './components/NongPassWidget';
import AuthGatePage from './pages/AuthGatePage';

import HomePage from './pages/HomePage';
import PlanFormPage from './pages/PlanFormPage';
import ProfilePage from './pages/ProfilePage';
const PlanResultPage = lazy(() => import('./pages/PlanResultPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const PassPage = lazy(() => import('./pages/PassPage'));
const TravelQuizPage = lazy(() => import('./pages/TravelQuizPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));

export default function App() {
  const [userAuth, setUserAuth] = useState(() => {
    try {
      const saved = localStorage.getItem('daypass_user_auth');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Listen to auth changes (e.g. login, logout, switch account)
  useEffect(() => {
    const handleAuthChange = () => {
      try {
        const saved = localStorage.getItem('daypass_user_auth');
        setUserAuth(saved ? JSON.parse(saved) : null);
      } catch {
        setUserAuth(null);
      }
    };

    window.addEventListener('daypass_auth_changed', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener('daypass_auth_changed', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  // ── PRE-ENTRY AUTH GATE ──
  // If user is not logged in / registered, show the dedicated AuthGatePage before entering
  if (!userAuth) {
    return <AuthGatePage onAuthenticated={(auth) => setUserAuth(auth)} />;
  }

  // ── MAIN WEBSITE APPLICATION ──
  return (
    <div className="app-shell">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Suspense fallback={
          <div className="flex-1 flex min-h-[50vh] items-center justify-center" role="status">
            <div className="text-center">
              <div className="text-5xl mb-3 animate-bounce-slow">✈️</div>
              <p className="text-slate-500 text-sm font-medium">กำลังโหลด...</p>
            </div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/plan/new" element={<PlanFormPage />} />
            <Route path="/plan/result" element={<PlanResultPage />} />
            <Route path="/checkout/:orderId" element={<CheckoutPage />} />
            <Route path="/pass/:passId" element={<PassPage />} />
            <Route path="/quiz" element={<TravelQuizPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="*" element={(
              <div className="flex-1 flex flex-col min-h-[50vh] items-center justify-center px-6 text-center pb-mobile-nav">
                <div className="text-7xl mb-4 animate-float">🗺️</div>
                <h1 className="text-2xl font-extrabold text-slate-900">ไม่พบหน้านี้</h1>
                <p className="text-slate-500 mt-2 mb-6">ลิงก์อาจไม่ถูกต้องหรือหน้านี้ไม่มีอยู่แล้ว</p>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#f97316,#f59e0b)', boxShadow: '0 8px 24px rgba(249,115,22,0.3)' }}
                >
                  ✈️ กลับหน้าแรก
                </Link>
              </div>
            )} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <NongPassWidget />
    </div>
  );
}
