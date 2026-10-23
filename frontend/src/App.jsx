import { lazy, Suspense } from 'react';
import { Link, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

const HomePage = lazy(() => import('./pages/HomePage'));
const PlanFormPage = lazy(() => import('./pages/PlanFormPage'));
const PlanResultPage = lazy(() => import('./pages/PlanResultPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const PassPage = lazy(() => import('./pages/PassPage'));

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Suspense fallback={<div className="flex-1 flex min-h-[40vh] items-center justify-center text-slate-500" role="status">กำลังโหลดหน้า...</div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/plan/new" element={<PlanFormPage />} />
            <Route path="/plan/result" element={<PlanResultPage />} />
            <Route path="/checkout/:orderId" element={<CheckoutPage />} />
            <Route path="/pass/:passId" element={<PassPage />} />
            <Route path="*" element={(
              <div className="flex-1 flex flex-col min-h-[50vh] items-center justify-center px-6 text-center">
                <p className="text-6xl mb-3">🧭</p>
                <h1 className="text-2xl font-extrabold text-slate-900">ไม่พบหน้านี้</h1>
                <p className="text-slate-500 mt-2">ลิงก์อาจไม่ถูกต้องหรือหน้านี้ไม่มีอยู่แล้ว</p>
                <Link to="/" className="btn-primary mt-5 px-5 py-3">กลับหน้าแรก</Link>
              </div>
            )} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

