import { useNavigate } from 'react-router-dom';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer
      className="mt-auto relative overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #1a0f05 0%, #2d1a08 50%, #1a1209 100%)',
        borderTop: '1px solid rgba(249,115,22,0.15)',
      }}
    >
      {/* Ambient blobs */}
      <div
        className="absolute top-0 left-1/4 w-64 h-64 rounded-full pointer-events-none opacity-30"
        style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.2), transparent 70%)', filter: 'blur(60px)' }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-48 h-48 rounded-full pointer-events-none opacity-20"
        style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.25), transparent 70%)', filter: 'blur(50px)' }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">

          {/* Brand Column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-orange-500/30 shadow-lg shadow-orange-500/20">
                <img src="/mascot/nong-pass-wave.jpg" alt="น้องพาส" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="font-extrabold text-lg text-white tracking-tight">DayPass</span>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs mb-4">
              พาสเที่ยว 1 ย่าน ใน 1 วัน ปลดล็อกคาเฟ่ สตรีทฟู้ด และมิชชั่นถ่ายรูปแลกแต้มสะสม
            </p>
            {/* Social / contact chips */}
            <div className="flex flex-wrap gap-2">
              {['โหมดตัวอย่าง', 'ไม่รับเงินจริง', 'พาสจำลอง'].map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{
                    background: 'rgba(249,115,22,0.15)',
                    color: '#fb923c',
                    border: '1px solid rgba(249,115,22,0.2)',
                  }}
                >
                  ✓ {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
              <span
                className="w-5 h-5 rounded-md flex items-center justify-center text-xs"
                style={{ background: 'rgba(249,115,22,0.2)' }}
              >
                🗺️
              </span>
              สำรวจ
            </h3>
            <ul className="space-y-2.5">
              {[
                { label: 'หน้าแรก', path: '/' },
                { label: 'วางแผนเที่ยว', path: '/plan/new' },
                { label: 'ทำควิซหาสไตล์', path: '/quiz' },
                { label: 'ประวัติการซื้อพาส', path: '/history' },
              ].map((item) => (
                <li key={item.path}>
                  <button
                    onClick={() => navigate(item.path)}
                    className="text-sm text-slate-400 hover:text-orange-400 transition-colors duration-200 flex items-center gap-1.5 group"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-200"
                      style={{ background: 'rgba(249,115,22,0.4)' }}
                    />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Destinations */}
          <div>
            <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
              <span
                className="w-5 h-5 rounded-md flex items-center justify-center text-xs"
                style={{ background: 'rgba(249,115,22,0.2)' }}
              >
                📍
              </span>
              ย่านยอดนิยม
            </h3>
            <ul className="space-y-2.5">
              {['ตลาดน้อย', 'เยาวราช', 'อารีย์', 'บรรทัดทอง', 'เกาะรัตนโกสินทร์'].map((district) => (
                <li key={district}>
                  <button
                    onClick={() => navigate('/plan/new')}
                    className="text-sm text-slate-400 hover:text-orange-400 transition-colors duration-200 flex items-center gap-1.5"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: 'rgba(249,115,22,0.4)' }}
                    />
                    {district}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* About / CTA */}
          <div>
            <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
              <span
                className="w-5 h-5 rounded-md flex items-center justify-center text-xs"
                style={{ background: 'rgba(249,115,22,0.2)' }}
              >
                🌟
              </span>
              เริ่มเที่ยวเลย
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              สร้างแผนเที่ยวอัตโนมัติ พร้อมคูปองลดราคาร้านดัง ใน 2 นาที!
            </p>
            <button
              onClick={() => navigate('/plan/new')}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:shadow-lg active:scale-95"
              style={{
                background: 'linear-gradient(135deg,#f97316,#f59e0b)',
                boxShadow: '0 4px 16px rgba(249,115,22,0.25)',
              }}
            >
              ✨ สร้างแผนฟรี →
            </button>
          </div>
        </div>

        {/* Divider */}
        <div
          className="h-px mb-6"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(249,115,22,0.2), transparent)' }}
        />

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-xs text-center sm:text-left">
            © {CURRENT_YEAR} DayPass Team · สงวนลิขสิทธิ์ · 
            <span className="text-orange-500/70 ml-1">Made with ❤️ in Thailand</span>
          </p>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <span>🔒</span> ปลอดภัย
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <span>📱</span> ทุกอุปกรณ์
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <span>⚡</span> ฟาสต์
            </span>
          </div>
        </div>

      </div>

      {/* Mobile bottom nav spacer */}
      <div className="md:hidden h-20" />
    </footer>
  );
}
