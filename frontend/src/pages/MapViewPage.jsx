import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Tag, Coffee, Utensils, Camera, Sparkles, X } from 'lucide-react';
import LeafletMap from '../components/LeafletMap';
import { fetchShops } from '../api';

const CATEGORIES = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'cafe', label: 'คาเฟ่' },
  { id: 'food', label: 'อาหาร' },
  { id: 'dessert', label: 'ของหวาน' },
  { id: 'photo', label: 'ถ่ายรูป' },
  { id: 'activity', label: 'กิจกรรม' }
];

export default function MapViewPage() {
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [radiusKm, setRadiusKm] = useState(2.5);
  const [selectedShop, setSelectedShop] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchShops(13.7335, 100.5126, radiusKm)
      .then((data) => {
        setShops(data.shops || []);
      })
      .finally(() => setLoading(false));
  }, [radiusKm]);

  const filteredShops =
    selectedCategory === 'all'
      ? shops
      : shops.filter((s) => s.category === selectedCategory);

  return (
    <div className="pb-28 max-w-md mx-auto px-4 pt-3 space-y-3 animate-fade-in">
      <div>
        <h1 className="text-xl font-extrabold text-white">แผนที่สำรวจย่านตลาดน้อย</h1>
        <p className="text-xs text-slate-400">ร้านอาหาร คาเฟ่ และจุดถ่ายรูปทั้งหมด {shops.length} แห่ง</p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
              selectedCategory === cat.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'glass-card text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Interactive Map */}
      <div className="relative">
        <LeafletMap
          shops={filteredShops}
          radiusKm={radiusKm}
          height="400px"
          onSelectShop={(shop) => setSelectedShop(shop)}
        />

        {/* Floating Selected Shop Popup Card */}
        {selectedShop && (
          <div className="absolute bottom-3 left-3 right-3 z-30 glass-panel rounded-2xl p-3.5 border border-indigo-500/50 shadow-2xl animate-fade-in">
            <button
              onClick={() => setSelectedShop(null)}
              className="absolute top-2.5 right-2.5 p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-start gap-2.5 pr-6">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold uppercase">
                    {selectedShop.category}
                  </span>
                  <span className="text-amber-400 font-bold">฿{selectedShop.avgPrice} / คน</span>
                </div>
                <h3 className="font-bold text-sm text-white">{selectedShop.name}</h3>
                <p className="text-xs text-slate-300">เมนูแนะนำ: {selectedShop.recommendedMenu}</p>
                {selectedShop.coupon && (
                  <div className="text-[11px] text-emerald-400 font-semibold pt-1">
                    🎟️ {selectedShop.coupon.title}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Radius slider */}
      <div className="glass-card rounded-2xl p-3 border border-slate-800 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300">รัศมีค้นหาบนแผนที่</span>
          <span className="text-indigo-400 font-bold">{radiusKm} กม.</span>
        </div>
        <input
          type="range"
          min="1"
          max="4"
          step="0.5"
          value={radiusKm}
          onChange={(e) => setRadiusKm(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
      </div>

      {/* CTA to Generate Plan */}
      <button
        onClick={() => navigate('/')}
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30"
      >
        <Sparkles className="w-4 h-4 text-amber-300" />
        <span>สร้างแผนเที่ยวอัตโนมัติจากร้านเหล่านี้</span>
      </button>
    </div>
  );
}
