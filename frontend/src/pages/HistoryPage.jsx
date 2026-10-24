import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchPassHistory, getDeviceId } from '../api';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'active' | 'completed' | 'expired'
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPassId, setExpandedPassId] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchPassHistory(getDeviceId())
      .then((items) => {
        if (!cancelled) setHistory(items);
      })
      .catch((error) => {
        if (!cancelled) setHistoryError(error.message || 'ไม่สามารถโหลดประวัติพาสได้');
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const totalPasses = history.length;
  const activeCount = history.filter((p) => p.status === 'active').length;
  const completedCount = history.filter((p) => p.status === 'completed').length;
  const totalSpent = history.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  const totalPointsEarned = history.reduce((sum, p) => sum + (p.pointsEarned || 0), 0);
  const estimatedSavings = history.reduce((sum, p) => sum + (p.discount || 0) + ((p.couponsUsed || p.couponsCount || 2) * 45), 0);

  const filteredHistory = history.filter((item) => {
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDistrict = item.districtName?.toLowerCase().includes(q);
      const matchProvince = item.provinceName?.toLowerCase().includes(q);
      const matchCode = item.code?.toLowerCase().includes(q);
      const matchPackage = item.packageName?.toLowerCase().includes(q);
      if (!matchDistrict && !matchProvince && !matchCode && !matchPackage) return false;
    }
    return true;
  });

  function getStatusBadge(status) {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            กำลังใช้งาน
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            เที่ยวสำเร็จแล้ว
          </span>
        );
      case 'expired':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            หมดอายุ
          </span>
        );
    }
  }

  return (
    <div className="flex-1 flex flex-col py-6 sm:py-10 animate-fade-in">
      <div className="page-container max-w-5xl">
        
        {/* Navigation / Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 shadow-sm active:scale-95 transition-all"
              aria-label="ย้อนกลับ"
            >
              ←
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎟️</span>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">ประวัติการซื้อพาส</h1>
                <span className="badge bg-brand-50 text-brand-700 border border-brand-200 text-xs font-bold">
                  {totalPasses} รายการ
                </span>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                ดูย้อนหลังตั๋วพาส คูปองที่เคยใช้ และแผนการเดินทางทั้งหมดของคุณ
              </p>
            </div>
          </div>

          <Link
            to="/plan/new"
            className="btn-primary inline-flex items-center gap-2 text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-md self-start sm:self-auto"
          >
            <span>✨</span>
            <span>ซื้อพาสเที่ยวใหม่</span>
          </Link>
        </div>

        {/* Stats Overview Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="glass-card bg-gradient-to-br from-white to-orange-50/40 border border-orange-100 p-4">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
              <span>พาสทั้งหมด</span>
              <span>🎫</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalPasses} <span className="text-xs font-normal text-slate-500">ใบ</span></div>
            <div className="text-[11px] text-emerald-600 font-bold mt-1">
              กำลังใช้งาน {activeCount} ใบ · สำเร็จ {completedCount} ใบ
            </div>
          </div>

          <div className="glass-card bg-gradient-to-br from-white to-emerald-50/40 border border-emerald-100 p-4">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
              <span>ยอดประหยัดสะสม</span>
              <span>💸</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">~{estimatedSavings.toLocaleString()} <span className="text-xs font-normal text-slate-500">บาท</span></div>
            <div className="text-[11px] text-slate-500 mt-1">
              จากส่วนลดคูปอง & สิทธิพิเศษ
            </div>
          </div>

          <div className="glass-card bg-gradient-to-br from-white to-amber-50/40 border border-amber-100 p-4">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
              <span>แต้มที่ได้รับคืน</span>
              <span>🌟</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-600">+{totalPointsEarned} <span className="text-xs font-normal text-slate-500">แต้ม</span></div>
            <div className="text-[11px] text-slate-500 mt-1">
              สะสมแลกส่วนลดทริปต่อไป
            </div>
          </div>

          <div className="glass-card bg-gradient-to-br from-white to-blue-50/40 border border-blue-100 p-4">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
              <span>ยอดสั่งซื้อรวม</span>
              <span>💳</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalSpent.toLocaleString()} <span className="text-xs font-normal text-slate-500">บาท</span></div>
            <div className="text-[11px] text-slate-500 mt-1">
              เฉลี่ย {totalPasses ? Math.round(totalSpent / totalPasses) : 0} ฿/พาส
            </div>
          </div>
        </div>

        {/* Mascot Banner */}
        <div className="glass-card bg-gradient-to-r from-brand-50 via-orange-50/60 to-amber-50/40 border border-brand-200/80 p-4 sm:p-5 rounded-3xl mb-6 sm:mb-8 flex flex-col sm:flex-row items-center gap-4">
          <img
            src="/mascot_nongpass.png"
            alt="น้องพาส"
            className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-md flex-shrink-0 animate-bounce-subtle"
          />
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="font-extrabold text-slate-900 text-sm sm:text-base">น้องพาสเก็บประวัติไว้ให้ครบเลย!</span>
              <span className="badge bg-brand-500 text-white text-[10px] font-black px-2 py-0.5">Nong Pass Log</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
              ทุกพาสที่พี่เคยซื้อจะถูกบันทึกไว้ที่นี่ สามารถคลิกเปิดตั๋วพาสย้อนหลัง ดูกราฟฟิตี้ คูปอง หรือกดใช้แผนเดิมเพื่อเที่ยวซ้ำได้ตลอดเวลาเลยครับ!
            </p>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="glass-card bg-white p-4 rounded-2xl mb-6 shadow-sm border border-slate-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {[
                { id: 'all', label: 'ทั้งหมด' },
                { id: 'active', label: '🟢 กำลังใช้งาน' },
                { id: 'completed', label: '🔵 เที่ยวสำเร็จแล้ว' },
                { id: 'expired', label: '⚪ หมดอายุ' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    filterStatus === tab.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative min-w-[220px]">
              <input
                type="text"
                placeholder="ค้นหาชื่อย่าน, จังหวัด, รหัสพาส..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field text-xs py-2 pl-8 pr-3"
              />
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {historyError && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700" role="alert">
            {historyError}
          </div>
        )}

        {/* History List */}
        {historyLoading ? (
          <div className="glass-card bg-white p-10 text-center rounded-3xl" role="status">
            <span className="text-4xl mb-3 block">🎟️</span>
            <p className="text-slate-500 text-sm font-semibold">กำลังโหลดประวัติพาส...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="glass-card bg-white p-10 text-center rounded-3xl border border-dashed border-slate-300">
            <span className="text-5xl mb-3 block">📭</span>
            <h3 className="text-lg font-extrabold text-slate-800">ไม่พบประวัติพาสที่ตรงกับการค้นหา</h3>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-md mx-auto">
              ลองเปลี่ยนคำค้นหา หรือเลือกตัวกรองสถานะอื่น หรือวางแผนสร้างพาสเที่ยวใหม่ได้เลย
            </p>
            <Link to="/plan/new" className="btn-primary inline-flex items-center gap-2 mt-4 text-xs font-bold py-2.5 px-5">
              <span>🎟️</span>
              <span>วางแผนซื้อพาสใหม่</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((pass) => {
              const isExpanded = expandedPassId === pass.id;
              return (
                <div
                  key={pass.id}
                  className={`glass-card bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                    pass.status === 'active'
                      ? 'border-emerald-300 shadow-md shadow-emerald-500/5 hover:border-emerald-400'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-slate-900 text-sm tracking-wide bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                          {pass.code || 'DP-PASS'}
                        </span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          pass.packageBadge?.includes('🔥')
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {pass.packageBadge || pass.packageName}
                        </span>
                        {getStatusBadge(pass.status)}
                      </div>

                      <div className="text-slate-400 text-xs font-medium flex items-center gap-1">
                        <span>🕒</span>
                        <span>ซื้อเมื่อ: {pass.purchaseDate}</span>
                      </div>
                    </div>

                    {/* Card Main Body */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">📍</span>
                          <h3 className="text-lg font-black text-slate-900">
                            {pass.districtName}
                          </h3>
                          <span className="text-xs text-slate-500 font-semibold">({pass.provinceName || 'กรุงเทพมหานคร'})</span>
                        </div>
                        
                        <p className="text-xs text-slate-600 line-clamp-1">
                          <span className="font-bold text-slate-700">แพ็กเกจ:</span> {pass.packageName} · สำหรับ {pass.people || 1} คน · ครอบคลุม {pass.placesCount || 4} จุดเช็กอิน
                        </p>

                        {pass.transitAdvice && (
                          <div className="flex items-start gap-1.5 text-xs text-brand-700 bg-brand-50/60 p-2 rounded-xl border border-brand-100">
                            <span className="text-sm">🚇</span>
                            <span className="leading-snug">{pass.transitAdvice}</span>
                          </div>
                        )}
                      </div>

                      {/* Pricing and Stats */}
                      <div className="flex items-center gap-4 sm:gap-6 bg-slate-50/80 p-3 rounded-2xl border border-slate-100 flex-shrink-0">
                        <div className="text-center sm:text-right">
                          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">ยอดชำระ</div>
                          <div className="text-lg sm:text-xl font-black text-slate-900">
                            {(pass.totalAmount || 0).toLocaleString()} <span className="text-xs font-bold text-slate-500">฿</span>
                          </div>
                          {pass.discount > 0 && (
                            <span className="text-[10px] font-bold text-emerald-600">ลดไป {pass.discount}฿</span>
                          )}
                        </div>

                        <div className="w-[1px] h-8 bg-slate-200"></div>

                        <div className="text-center sm:text-right">
                          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">แต้มที่ได้</div>
                          <div className="text-lg sm:text-xl font-black text-amber-600">
                            +{pass.pointsEarned || 15}
                          </div>
                          <span className="text-[10px] text-slate-400">Cashback</span>
                        </div>
                      </div>
                    </div>

                    {/* Mascot review bubble */}
                    {pass.mascotFeedback && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-600 bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/60">
                        <span className="text-base">🐾</span>
                        <span className="italic font-medium">น้องพาส: &ldquo;{pass.mascotFeedback}&rdquo;</span>
                      </div>
                    )}

                    {/* Card Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <button
                        onClick={() => setExpandedPassId(isExpanded ? null : pass.id)}
                        className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 py-1"
                      >
                        <span>{isExpanded ? '▲ ซ่อนรายละเอียดใบเสร็จ' : '▼ ดูใบเสร็จ & คูปองในพาส'}</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (pass.plan) {
                              sessionStorage.setItem('daypass_plan', JSON.stringify(pass.plan));
                              sessionStorage.setItem('daypass_people', String(pass.people || 1));
                            }
                            navigate(`/plan/result`);
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all"
                        >
                          🗺️ ดูแผนที่เที่ยว
                        </button>

                        <button
                          onClick={() => navigate(`/pass/${pass.passId || pass.id}`)}
                          className="btn-primary text-xs font-bold py-1.5 px-4 rounded-xl shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
                        >
                          <span>📱</span>
                          <span>เปิดตั๋วพาส (Digital Pass)</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Receipt & Coupon details */}
                  {isExpanded && (
                    <div className="bg-slate-50 p-4 sm:p-5 border-t border-slate-200 animate-fade-in text-xs space-y-3">
                      <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                        <span>🧾</span>
                        <span>รายละเอียดคำสั่งซื้อ #{pass.orderId || pass.id}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                        <div className="space-y-1">
                          <div className="flex justify-between text-slate-600">
                            <span>วันที่ใช้งาน:</span>
                            <span className="font-bold text-slate-800">{pass.validDate}</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>จำนวนผู้เดินทาง:</span>
                            <span className="font-bold text-slate-800">{pass.people || 1} ท่าน</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>คูปองที่ใช้แล้ว:</span>
                            <span className="font-bold text-emerald-600">{pass.couponsUsed || 0} / {pass.couponsCount || 3} ใบ</span>
                          </div>
                        </div>

                        <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-slate-100 sm:pl-3 pt-2 sm:pt-0">
                          <div className="flex justify-between text-slate-600">
                            <span>ราคาพาสรวม:</span>
                            <span className="font-bold text-slate-800">{((pass.totalAmount || 0) + (pass.discount || 0)).toLocaleString()} ฿</span>
                          </div>
                          {pass.discount > 0 && (
                            <div className="flex justify-between text-emerald-600">
                              <span>ส่วนลดแต้ม:</span>
                              <span className="font-bold">-{pass.discount} ฿ ({pass.pointsUsed} แต้ม)</span>
                            </div>
                          )}
                          <div className="flex justify-between font-extrabold text-slate-900 border-t border-slate-100 pt-1">
                            <span>ยอดสุทธิ:</span>
                            <span className="text-brand-600 text-sm">{(pass.totalAmount || 0).toLocaleString()} ฿</span>
                          </div>
                        </div>
                      </div>

                      {pass.plan?.items && pass.plan.items.length > 0 && (
                        <div>
                          <p className="font-bold text-slate-700 mb-2">📍 สถานที่เช็กอินในพาสนี้ ({pass.plan.items.length} จุด):</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {pass.plan.items.map((place, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200">
                                <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-[10px]">
                                  {idx + 1}
                                </span>
                                <span className="font-bold text-slate-800 truncate">{place.shopName}</span>
                                {place.coupon && (
                                  <span className="ml-auto text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">
                                    มีคูปอง
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
