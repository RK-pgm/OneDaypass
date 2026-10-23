import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Coffee, Utensils, Cake, Camera, Sparkles, Navigation } from 'lucide-react';

// Custom Map center updater hook
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

// Category color mappings
const CATEGORY_STYLES = {
  cafe: { bg: '#f59e0b', text: '#fff', label: 'คาเฟ่' },
  food: { bg: '#ef4444', text: '#fff', label: 'อาหาร' },
  dessert: { bg: '#ec4899', text: '#fff', label: 'ของหวาน' },
  photo: { bg: '#8b5cf6', text: '#fff', label: 'ถ่ายรูป' },
  activity: { bg: '#10b981', text: '#fff', label: 'กิจกรรม' }
};

// Create custom DOM/SVG Marker
function createCustomIcon(category, number = null) {
  const style = CATEGORY_STYLES[category] || { bg: '#6366f1', text: '#fff' };
  const badgeContent = number !== null ? number : '';

  const html = `
    <div style="
      background-color: ${style.bg};
      color: ${style.text};
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 13px;
      border: 2px solid #ffffff;
      box-shadow: 0 4px 10px rgba(0,0,0,0.45);
      position: relative;
    ">
      ${badgeContent || '★'}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18]
  });
}

export default function LeafletMap({
  shops = [],
  routeItems = [],
  center = [13.7335, 100.5126],
  zoom = 15,
  radiusKm = null,
  height = '320px',
  onSelectShop = null
}) {
  const hasRoute = routeItems && routeItems.length > 0;

  // Build route polyline coordinates if itinerary items provided
  const polylinePositions = hasRoute
    ? routeItems.map((item) => [item.lat, item.lng])
    : [];

  return (
    <div style={{ height }} className="w-full rounded-2xl overflow-hidden shadow-inner relative border border-slate-700/80">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <ChangeView center={center} zoom={zoom} />

        {/* Clean CartoDB Dark Matter tile layer for premium dark aesthetics */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* Radius circle */}
        {radiusKm && (
          <Circle
            center={center}
            radius={radiusKm * 1000}
            pathOptions={{
              color: '#6366f1',
              fillColor: '#6366f1',
              fillOpacity: 0.12,
              weight: 1.5,
              dashArray: '4, 8'
            }}
          />
        )}

        {/* Route Polyline */}
        {polylinePositions.length > 1 && (
          <Polyline
            positions={polylinePositions}
            pathOptions={{
              color: '#4f46e5',
              weight: 4,
              opacity: 0.85,
              dashArray: '6, 8'
            }}
          />
        )}

        {/* Route stops markers (numbered) */}
        {hasRoute &&
          routeItems.map((item) => (
            <Marker
              key={`route-${item.order}-${item.shopId}`}
              position={[item.lat, item.lng]}
              icon={createCustomIcon(item.category, item.order)}
            >
              <Popup>
                <div className="p-1 text-slate-900">
                  <div className="text-[11px] font-bold text-indigo-600">
                    จุดที่ {item.order} • {item.time} น.
                  </div>
                  <div className="font-bold text-sm text-slate-900">{item.shopName}</div>
                  <div className="text-xs text-slate-600 mt-0.5">{item.activity}</div>
                  {item.coupon && (
                    <div className="mt-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                      🎟️ {item.coupon.title}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

        {/* General shops markers (if no active route shown) */}
        {!hasRoute &&
          shops.map((shop) => (
            <Marker
              key={shop.id}
              position={[shop.lat, shop.lng]}
              icon={createCustomIcon(shop.category)}
            >
              <Popup>
                <div className="p-1 text-slate-900">
                  <div className="text-[10px] uppercase font-semibold text-indigo-600">
                    {CATEGORY_STYLES[shop.category]?.label || shop.category}
                  </div>
                  <div className="font-bold text-sm text-slate-900">{shop.name}</div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    เมนูแนะนำ: {shop.recommendedMenu}
                  </div>
                  <div className="text-xs font-semibold text-slate-800 mt-1">
                    เฉลี่ย ฿{shop.avgPrice} / คน
                  </div>
                  {shop.coupon && (
                    <div className="mt-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                      🎟️ {shop.coupon.title}
                    </div>
                  )}
                  {onSelectShop && (
                    <button
                      onClick={() => onSelectShop(shop)}
                      className="mt-2 w-full py-1 bg-indigo-600 text-white rounded text-xs font-semibold"
                    >
                      เลือกใส่แผน
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
