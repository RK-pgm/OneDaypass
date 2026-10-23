import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import WalletModal from './components/WalletModal';
import PitchModal from './components/PitchModal';
import HomePage from './pages/HomePage';
import PlanPreviewPage from './pages/PlanPreviewPage';
import CheckoutPage from './pages/CheckoutPage';
import PassDetailPage from './pages/PassDetailPage';
import MyPassesPage from './pages/MyPassesPage';
import MapViewPage from './pages/MapViewPage';
import { getPoints } from './api';
import { getDeviceId, getSavedPassIds } from './utils/device';

export default function App() {
  const deviceId = getDeviceId();
  const [points, setPoints] = useState(0);
  const [pointValueBaht, setPointValueBaht] = useState(2);
  const [activePlan, setActivePlan] = useState(null);
  const [activePeople, setActivePeople] = useState(2);
  const [savedPassCount, setSavedPassCount] = useState(0);

  // Modals
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isPitchOpen, setIsPitchOpen] = useState(false);

  // Refresh points and pass count
  const refreshUserStats = () => {
    getPoints(deviceId)
      .then((data) => {
        setPoints(data.totalPoints || 0);
        setPointValueBaht(data.pointValueBaht || 2);
      })
      .catch((err) => console.error('Error fetching points', err));

    const saved = getSavedPassIds();
    setSavedPassCount(saved.length);
  };

  useEffect(() => {
    refreshUserStats();
  }, [deviceId]);

  const handlePlanGenerated = (plan, people) => {
    setActivePlan(plan);
    setActivePeople(people);
  };

  const handlePassPurchased = (passId) => {
    refreshUserStats();
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#070b14] flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
        {/* Subtle ambient lighting effects for premium aesthetics */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/10 blur-[130px] pointer-events-none"></div>
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/5 blur-[140px] pointer-events-none"></div>

        {/* Top App Navbar */}
        <Navbar
          points={points}
          onOpenWallet={() => setIsWalletOpen(true)}
          onOpenPitch={() => setIsPitchOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-md mx-auto">
          <Routes>
            <Route
              path="/"
              element={<HomePage onPlanGenerated={handlePlanGenerated} />}
            />
            <Route
              path="/plan"
              element={
                <PlanPreviewPage
                  plan={activePlan}
                  people={activePeople}
                />
              }
            />
            <Route
              path="/checkout"
              element={
                <CheckoutPage
                  plan={activePlan}
                  people={activePeople}
                  onPassPurchased={handlePassPurchased}
                />
              }
            />
            <Route
              path="/pass/:passId"
              element={
                <PassDetailPage
                  onPointsUpdated={(newTotal) => {
                    setPoints(newTotal);
                    refreshUserStats();
                  }}
                />
              }
            />
            <Route path="/passes" element={<MyPassesPage />} />
            <Route path="/map" element={<MapViewPage />} />
          </Routes>
        </main>

        {/* Bottom Floating Navigation */}
        <BottomNav
          onOpenWallet={() => setIsWalletOpen(true)}
          activePassCount={savedPassCount}
        />

        {/* Global Modals */}
        <WalletModal
          isOpen={isWalletOpen}
          onClose={() => setIsWalletOpen(false)}
          points={points}
          pointValueBaht={pointValueBaht}
        />

        <PitchModal
          isOpen={isPitchOpen}
          onClose={() => setIsPitchOpen(false)}
        />
      </div>
    </BrowserRouter>
  );
}
