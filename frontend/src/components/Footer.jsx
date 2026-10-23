import { useNavigate } from 'react-router-dom';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="border-t border-slate-200 bg-white/70 backdrop-blur-md mt-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div>
          <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
            <span className="text-2xl">🎟️</span>
            <span className="text-xl font-bold text-slate-900 tracking-tight">DayPass</span>
            <span className="badge bg-brand-50 text-brand-600 border border-brand-200 text-xs">Bangkok Districts</span>
          </div>
          <p className="text-slate-500 text-xs max-w-sm">
            พาสเที่ยว 1 ย่าน ใน 1 วัน ปลดล็อกประสบการณ์สตรีทฟู้ด คาเฟ่ และมิชชั่นถ่ายรูปแลกแต้ม
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 font-medium">
          <button onClick={() => navigate('/')} className="hover:text-brand-600 transition-colors">
            หน้าแรก
          </button>
          <span>·</span>
          <button onClick={() => navigate('/plan/new')} className="hover:text-brand-600 transition-colors">
            สร้างแผนเที่ยว
          </button>
          <span>·</span>
          <span className="text-brand-600 font-semibold">PromptPay รองรับทุกธนาคาร</span>
        </div>

        <p className="text-slate-400 text-xs">
          © {CURRENT_YEAR} DayPass Team. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
