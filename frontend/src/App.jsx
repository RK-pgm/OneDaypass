import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import PlanFormPage from './pages/PlanFormPage';
import PlanResultPage from './pages/PlanResultPage';
import CheckoutPage from './pages/CheckoutPage';
import PassPage from './pages/PassPage';

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/plan/new" element={<PlanFormPage />} />
          <Route path="/plan/result" element={<PlanResultPage />} />
          <Route path="/checkout/:orderId" element={<CheckoutPage />} />
          <Route path="/pass/:passId" element={<PassPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

