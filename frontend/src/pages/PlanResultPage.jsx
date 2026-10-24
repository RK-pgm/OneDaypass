import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { createOrder, getDeviceId } from '../api';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function createNumberedIcon(num) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:34px;height:34px;border-radius:50%;
      background:linear-gradient(135deg,#f97316,#ea580c);
      border:2.5px solid white;
      color:white;font-weight:700;font-size:14px;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 4px 12px rgba(249,115,22,0.45);
      font-family:'Prompt',sans-serif;
    ">${num}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

const CATEGORY_ICON = {
  cafe: '☕ คาเฟ่',
  food: '🍜 สตรีทฟู้ด',
  dessert: '🍧 ของหวาน',
  photo: '📸 จุดถ่ายรูป',
  activity: '🎯 กิจกรรม',
};

function distanceKm(aLat, aLng, bLat, bLng) {
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const dLat = radians(bLat - aLat);
  const dLng = radians(bLng - aLng);
  const value = Math.sin(dLat / 2) ** 2
    + Math.cos(radians(aLat)) * Math.cos(radians(bLat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function walkingMinutes(km) {
  return km <= 0.05 ? 3 : Math.max(5, Math.round(km * 13));
}

function timeToMinutes(value) {
  const [hours, minutes] = (value || '10:00').split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

function formatTime(value) {
  const normalized = ((value % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`;
}

function readSharedTrip() {
  const token = new URLSearchParams(window.location.search).get('share');
  if (!token || token.length > 12000) return null;
  try {
    const base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const bytes = Uint8Array.from(atob(paddedBase64), (char) => char.charCodeAt(0));
    const shared = JSON.parse(new TextDecoder().decode(bytes));
    if (!shared?.plan || !Array.isArray(shared.plan.items) || shared.plan.items.length < 1 || shared.plan.items.length > 12) return null;
    const items = shared.plan.items.map((item, index) => {
      if (typeof item?.shopId !== 'string' || !item.shopId || !Number.isFinite(item.lat) || !Number.isFinite(item.lng)
        || item.lat < -90 || item.lat > 90 || item.lng < -180 || item.lng > 180) return null;
      return {
        ...item,
        order: index + 1,
        shopName: String(item.shopName || 'สถานที่ท่องเที่ยว'),
        time: /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(item.time) ? item.time : '10:00',
        durationMin: Number.isFinite(item.durationMin) ? Math.max(1, Math.min(480, item.durationMin)) : 45,
        estCost: Number.isFinite(item.estCost) ? Math.max(0, item.estCost) : 0,
      };
    });
    if (items.some((item) => !item)) return null;
    const plan = {
      ...shared.plan,
      title: String(shared.plan.title || 'แผนเที่ยว DayPass'),
      style: ['chill', 'challenge'].includes(shared.plan.style) ? shared.plan.style : 'chill',
      totalCostPerPerson: Number.isFinite(shared.plan.totalCostPerPerson)
        ? Math.max(0, shared.plan.totalCostPerPerson)
        : items.reduce((sum, item) => sum + item.estCost, 0),
      items,
    };
    const people = Number.isInteger(shared.people) && shared.people >= 1 && shared.people <= 10 ? shared.people : 1;
    return { plan, people };
  } catch {
    return null;
  }
}

function encodeSharePayload(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export default function PlanResultPage() {
  const navigate = useNavigate();
  const [sharedTrip] = useState(readSharedTrip);
  const [plan, setPlan] = useState(() => {
    if (sharedTrip?.plan) return sharedTrip.plan;
    try {
      const parsed = JSON.parse(sessionStorage.getItem('daypass_plan') || 'null');
      return parsed && Array.isArray(parsed.items) && parsed.items.length ? parsed : null;
    } catch {
      return null;
    }
  });
  const [people] = useState(() => {
    if (sharedTrip?.people) return sharedTrip.people;
    const savedPeople = Number(sessionStorage.getItem('daypass_people'));
    return Number.isInteger(savedPeople) && savedPeople >= 1 && savedPeople <= 10 ? savedPeople : 2;
  });
  const [loading, setLoading] = useState(false);
  const [optimizationMessage, setOptimizationMessage] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [error, setError] = useState('');
  const mapRef = useRef(null);

  useEffect(() => {
    if (!plan) navigate('/plan/new', { replace: true });
  }, [navigate, plan]);

  if (!plan) return null;

  const mapCenter = plan.items[0]
    ? [plan.items[0].lat, plan.items[0].lng]
    : [13.7313, 100.5105];

  const polylinePositions = plan.items.map((item) => [item.lat, item.lng]);

  const totalMinutes = plan.items.reduce(
    (acc, curr) => acc + (curr.durationMin || 45) + walkingMinutes(curr.distanceFromPrevKm || 0),
    0
  );
  const totalCost = plan.totalCostPerPerson * people;
  const couponCount = plan.items.filter((item) => item.coupon).length;
  const missionPoints = plan.items.reduce((sum, item) => sum + (item.mission?.points || 0), 0);

  function optimizeItinerary() {
    const request = JSON.parse(sessionStorage.getItem('daypass_plan_request') || '{}');
    const origin = {
      lat: Number.isFinite(Number(request.startLat)) ? Number(request.startLat) : plan.items[0].lat,
      lng: Number.isFinite(Number(request.startLng)) ? Number(request.startLng) : plan.items[0].lng,
    };
    let route = plan.items.slice();
    const routeDistance = (items) => {
      let total = distanceKm(origin.lat, origin.lng, items[0].lat, items[0].lng);
      for (let index = 1; index < items.length; index += 1) {
        total += distanceKm(items[index - 1].lat, items[index - 1].lng, items[index].lat, items[index].lng);
      }
      return total;
    };

    // Apply 2-opt swaps until no reversal shortens the open walking route.
    let improved = true;
    while (improved) {
      improved = false;
      let bestDistance = routeDistance(route);
      let bestRoute = route;
      for (let start = 0; start < route.length - 1; start += 1) {
        for (let end = start + 1; end < route.length; end += 1) {
          const candidate = [
            ...route.slice(0, start),
            ...route.slice(start, end + 1).reverse(),
            ...route.slice(end + 1),
          ];
          const candidateDistance = routeDistance(candidate);
          if (candidateDistance < bestDistance - 0.001) {
            bestDistance = candidateDistance;
            bestRoute = candidate;
          }
        }
      }
      if (bestRoute !== route) {
        route = bestRoute;
        improved = true;
      }
    }

    const originalDistance = routeDistance(plan.items);
    const optimizedDistance = routeDistance(route);
    if (originalDistance - optimizedDistance < 0.01) {
      setOptimizationMessage('เส้นทางปัจจุบันเดินสั้นที่สุดแล้ว');
      return;
    }

    let currentTime = timeToMinutes(request.startTime || '10:00');
    let previous = origin;
    const items = route.map((item, index) => {
      const distance = distanceKm(previous.lat, previous.lng, item.lat, item.lng);
      currentTime += walkingMinutes(distance);
      const updated = {
        ...item,
        order: index + 1,
        time: formatTime(currentTime),
        distanceFromPrevKm: Number(distance.toFixed(2)),
      };
      currentTime += item.durationMin || 45;
      previous = item;
      return updated;
    });

    const updatedPlan = { ...plan, items };
    setPlan(updatedPlan);
    sessionStorage.setItem('daypass_plan', JSON.stringify(updatedPlan));
    const savedKm = originalDistance - optimizedDistance;
    setOptimizationMessage(`จัดเส้นทางใหม่แล้ว ลดระยะเดินประมาณ ${savedKm.toFixed(1)} กม. โดยคงสถานที่และงบเดิม`);
  }

  async function shareItinerary() {
    const url = new URL(window.location.href);
    url.searchParams.set('share', encodeSharePayload({ plan, people }));
    const shareData = {
      title: 'แผนเที่ยว DayPass',
      text: `${plan.items.length} จุด · รวม ${totalCost.toLocaleString()} บาท (${people} คน · เฉลี่ย ${Math.round(totalCost / people).toLocaleString()} บาท/คน)`,
      url: url.toString(),
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareMessage('แชร์แผนเที่ยวเรียบร้อยแล้ว');
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url.toString());
        setShareMessage('คัดลอกลิงก์แผนเที่ยวแล้ว ส่งให้เพื่อนเปิดดูได้เลย');
      } else {
        setShareMessage('อุปกรณ์นี้ไม่รองรับการแชร์ลิงก์ กรุณาเปิดบนเบราว์เซอร์ที่รองรับ');
      }
    } catch (shareError) {
      if (shareError.name !== 'AbortError') setShareMessage('แชร์ไม่สำเร็จ กรุณาลองอีกครั้ง');
    }
  }

  async function handleBuy() {
    setError('');
    setLoading(true);
    try {
      const result = await createOrder({
        deviceId: getDeviceId(),
        plan,
        people,
        usePoints: 0,
      });
      sessionStorage.setItem('daypass_order', JSON.stringify(result));
      navigate(`/checkout/${result.orderId}`);
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาด ลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col py-6 sm:py-10 animate-fade-in">
      <div className="page-container">
        
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/plan/new')}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 shadow-sm active:scale-95 transition-all"
              aria-label="ย้อนกลับ"
            >
              ←
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">{plan.title}</h1>
                <span className={`badge text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  plan.style === 'chill'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {plan.style === 'chill' ? '☕ ชิลๆ สบายๆ' : '⚡ ตระเวนท้าทาย'}
                </span>
              </div>
              <button
                type="button"
                onClick={optimizeItinerary}
                className="mt-2 inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs sm:text-sm font-bold text-brand-700 hover:bg-brand-100 transition-colors"
              >
                ✨ ปรับทริปให้คุ้มกว่าเดิม
              </button>
              <p className="mt-1 text-[11px] text-slate-500">เรียงจุดใหม่เพื่อลดระยะเดิน โดยคงสถานที่และงบเดิม</p>
              {optimizationMessage && <p className="mt-1 text-xs font-medium text-emerald-700" role="status">{optimizationMessage}</p>}
              <button
                type="button"
                onClick={shareItinerary}
                className="mt-2 ml-2 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                🔗 แชร์แผนให้เพื่อน
              </button>
              {shareMessage && <p className="mt-1 text-xs font-medium text-slate-600" role="status">{shareMessage}</p>}
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                {plan.items.length} จุดเช็กอิน · ใช้เวลาตามแผนประมาณ {Math.floor(totalMinutes / 60)} ชม. {totalMinutes % 60} นาที (รวมเวลาเดิน) · สำหรับ {people} คน
              </p>
              {plan.districtId && plan.districtId !== 'taladnoi' && (
                <p className="mt-2 max-w-2xl rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800" role="note">
                  แผนนี้ใช้ข้อมูลตัวอย่าง โปรดตรวจสอบพิกัด เวลาเปิด ราคา และสิทธิประโยชน์กับสถานที่ก่อนเดินทาง
                </p>
              )}
            </div>
          </div>

          {/* Quick Buy CTA button (desktop) */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="text-right">
              <span className="text-[11px] text-slate-500 font-semibold block">ราคารวม ({people} คน)</span>
              <span className="text-2xl font-extrabold text-brand-600 font-mono">{totalCost.toLocaleString()} บาท</span>
            </div>
            <button
              onClick={handleBuy}
              disabled={loading}
              className="btn-primary py-3 px-6 text-sm font-bold flex items-center gap-2 shadow-lg shadow-brand-500/20"
            >
              {loading ? '⟳ กำลังดำเนินการ...' : '🎫 ซื้อพาสนี้เลย →'}
            </button>
          </div>
        </div>

        {/* Responsive Grid: Left Map + Right Itinerary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* Left Column: Interactive Map & Route Summary */}
          <div className="lg:col-span-5 flex flex-col gap-5 sticky top-24">
            
            {/* Map Container */}
            <div className="glass-card p-2 overflow-hidden border-slate-200 bg-white shadow-xl shadow-slate-200/50">
              <div className="h-64 sm:h-80 lg:h-[420px] rounded-xl overflow-hidden relative">
                <MapContainer
                  center={mapCenter}
                  zoom={15}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={true}
                  ref={mapRef}
                >
                  <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Polyline
                    positions={polylinePositions}
                    pathOptions={{ color: '#f97316', weight: 4, dashArray: '6,6', opacity: 0.85 }}
                  />
                  {plan.items.map((item) => (
                    <Marker
                      key={item.shopId}
                      position={[item.lat, item.lng]}
                      icon={createNumberedIcon(item.order)}
                    >
                      <Popup>
                        <div className="text-sm p-1 font-thai">
                          <strong className="text-brand-600 text-base">{item.order}. {item.shopName}</strong>
                          <div className="text-xs text-slate-600 mt-1">
                            🕒 {item.time} ({item.durationMin} นาที)
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {item.activity}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>

              {/* Map footer helper */}
              <div className="flex items-center justify-between px-3 py-2 text-xs text-slate-500">
                <span>คลิกที่หมุดตัวเลขเพื่อดูรายละเอียด</span>
                <span className="text-brand-600 font-bold">● เส้นทางเชื่อมต่ออัตโนมัติ</span>
              </div>
            </div>

            {/* Included Perks Summary */}
            <div className="glass-card bg-white">
              <h3 className="font-extrabold text-slate-900 text-sm mb-2 flex items-center gap-2">
                <span>🎁</span>
                <span>สิ่งที่คุณจะได้รับในพาสนี้</span>
              </h3>
              <div className="space-y-2 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>คูปองจากร้านค้า {couponCount} รายการ</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-600 font-bold">✓</span>
                  <span>มิชชั่นในแผนนี้สะสมได้สูงสุด +{missionPoints} แต้ม</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-brand-600 font-bold">✓</span>
                  <span>ระบบเช็กอิน GPS อัตโนมัติ ไม่ต้องพกตั๋วกระดาษ</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Timeline Itinerary & Checkout Card */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="section-title mb-0">
                <span>📋</span>
                <span>กำหนดการเดินทางทีละจุด</span>
              </h2>
              <span className="text-xs text-slate-500">เรียงตามเวลาและความสะดวกในการเดิน</span>
            </div>

            {/* Timeline List */}
            <div className="space-y-4">
              {plan.items.map((item, idx) => (
                <div key={item.shopId} className="flex gap-3 sm:gap-4 group">
                  
                  {/* Left Timeline Node */}
                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-brand-50 border border-brand-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                      <span className="text-brand-700 text-sm sm:text-base font-extrabold">{item.order}</span>
                    </div>
                    {idx < plan.items.length - 1 && (
                      <div className="w-0.5 flex-1 bg-gradient-to-b from-brand-300 via-brand-200 to-transparent my-2" />
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="glass-card bg-white flex-1 mb-2 group-hover:border-brand-400 transition-all shadow-sm">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="badge bg-slate-100 text-slate-700 font-mono text-xs font-bold">
                            🕒 {item.time}
                          </span>
                          {item.distanceFromPrevKm > 0 && (
                            <span className="text-slate-400 text-xs">
                              ห่างจุดก่อน {item.distanceFromPrevKm} กม.
                            </span>
                          )}
                        </div>
                        <h3 className="text-slate-900 font-extrabold text-base sm:text-lg group-hover:text-brand-600 transition-colors">
                          {item.shopName}
                        </h3>
                      </div>
                      <span className="badge bg-slate-50 text-slate-600 border border-slate-200 text-xs font-medium">
                        {CATEGORY_ICON[item.category] || '📍 จุดเช็กอิน'}
                      </span>
                    </div>

                    <p className="text-slate-600 text-xs sm:text-sm mb-3 leading-relaxed">
                      {item.activity}
                    </p>

                    {/* Tags / Badges */}
                    <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100">
                      {item.estCost > 0 && (
                        <span className="badge bg-slate-100 text-slate-600 border border-slate-200">
                          💸 ~{item.estCost} บาท
                        </span>
                      )}
                      <span className="badge bg-slate-100 text-slate-600 border border-slate-200">
                        ⏱ อยู่จุดนี้ ~{item.durationMin} นาที
                      </span>
                      {item.coupon && (
                        <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                          🎫 {item.coupon.title}
                        </span>
                      )}
                      {item.mission && (
                        <span className="badge bg-purple-50 text-purple-700 border border-purple-200 font-bold">
                          📸 มิชชั่น +{item.mission.points} แต้ม
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>

            {/* Price & Checkout Summary Card */}
            <div className="glass-card border-brand-200 bg-gradient-to-br from-brand-50 via-white to-amber-50 p-5 sm:p-6 mt-2 shadow-xl shadow-brand-500/10">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-slate-500 text-xs uppercase tracking-wider font-bold">ยอดรวมการสั่งซื้อ</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-brand-600 font-mono">
                      {totalCost.toLocaleString()}
                    </span>
                    <span className="text-slate-600 text-sm font-semibold">บาท ({people} คน · เฉลี่ย ~{plan.totalCostPerPerson} ฿/คน)</span>
                  </div>
                </div>

                <button
                  id="btn-buy-pass"
                  onClick={handleBuy}
                  disabled={loading}
                  className="btn-primary w-full sm:w-auto px-8 py-4 text-base font-bold shadow-xl shadow-brand-500/30 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin text-lg">⟳</span>
                      <span>กำลังจัดเตรียมออเดอร์...</span>
                    </>
                  ) : (
                    <>
                      <span>🎫 ซื้อพาสนี้เลย</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-medium">
                  ⚠️ {error}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Mobile Sticky Bottom CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 px-4 pb-6 pt-3 border-t border-slate-200 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-600 font-medium">ยอดรวม ({people} คน):</span>
          <span className="text-brand-600 font-extrabold font-mono text-base">{totalCost.toLocaleString()} บาท</span>
        </div>
        <button
          onClick={handleBuy}
          disabled={loading}
          className="btn-primary py-3.5 text-base font-bold flex items-center justify-center gap-2"
        >
          {loading ? '⟳ กำลังดำเนินการ...' : `🎫 ซื้อพาสนี้ · ${totalCost.toLocaleString()} บาท`}
        </button>
      </div>
    </div>
  );
}
