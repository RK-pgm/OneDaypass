import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { confirmOrder, getPoints, getDeviceId, updateOrderPoints, USE_MOCK } from '../api';

export default function CheckoutPage() {
  const { orderId } = useParams();
  return <CheckoutContent key={orderId} orderId={orderId} />;
}

function readStoredOrder(orderId) {
  try {
    const stored = JSON.parse(sessionStorage.getItem('daypass_order') || 'null');
    return stored?.orderId === orderId && Number.isFinite(stored.amount) ? stored : null;
  } catch {
    return null;
  }
}

function CheckoutContent({ orderId }) {
  const navigate = useNavigate();

  const [order, setOrder] = useState(() => readStoredOrder(orderId));
  const [points, setPoints] = useState({ totalPoints: 10, pointValueBaht: 2 });
  const [usePoints, setUsePoints] = useState(() => readStoredOrder(orderId)?.pointsUsed || 0);
  const [applyingPoints, setApplyingPoints] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('qr'); // 'qr' | 'confirming' | 'done'
  const canSimulatePayment = USE_MOCK || import.meta.env.DEV;

  useEffect(() => {
    getPoints(getDeviceId())
      .then((p) => setPoints({ totalPoints: 0, pointValueBaht: 2, ...p }))
      .catch(() => {});
  }, []);

  if (!order) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] px-6 text-center text-slate-500">
        <div>
          <p className="text-4xl mb-2">🔍</p>
          <p className="font-bold">ไม่พบคำสั่งซื้อนี้ในอุปกรณ์</p>
          <p className="text-sm mt-1">กลับไปสร้างแผนเที่ยวใหม่เพื่อเริ่มการสั่งซื้อ</p>
          <button className="btn-primary mt-5 px-5 py-3" onClick={() => navigate('/plan/new')}>
            กลับไปสร้างแผน
          </button>
        </div>
      </div>
    );
  }

  const subtotal = Number(order.subtotal ?? (order.amount + (order.discount || 0)));
  const pointValue = points.pointValueBaht || 2;
  const maxPointsByOrder = Math.floor(Math.floor(subtotal * 0.3) / pointValue);
  const pointsLimit = Math.min(points.totalPoints, maxPointsByOrder);
  const selectedPoints = Math.min(usePoints, pointsLimit);
  const pointDiscount = order.discount || 0;
  const selectedDiscount = selectedPoints * pointValue;
  const finalAmount = order.amount;
  const qrValue = order.promptpayPayload || `DAYPASS-DEMO:${orderId}:${finalAmount}`;

  async function handleApplyPoints() {
    setError('');
    setApplyingPoints(true);
    try {
      const quote = await updateOrderPoints(orderId, getDeviceId(), selectedPoints);
      const updatedOrder = { ...order, ...quote, subtotal };
      setOrder(updatedOrder);
      setUsePoints(quote.pointsUsed || 0);
      sessionStorage.setItem('daypass_order', JSON.stringify(updatedOrder));
    } catch (err) {
      setError(err.message || 'ใช้แต้มไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setApplyingPoints(false);
    }
  }

  async function handleConfirm() {
    if (!canSimulatePayment) {
      setError('ระบบยังไม่สามารถตรวจสอบยอดโอนจริงได้ จึงยังออกพาสจากรายการชำระเงินจริงไม่ได้');
      return;
    }
    setError('');
    setConfirming(true);
    setStep('confirming');
    try {
      const result = await confirmOrder(orderId);
      sessionStorage.setItem('daypass_passId', result.passId);
      localStorage.setItem('daypass_recent_pass_id', result.passId);
      setStep('done');
      setTimeout(() => navigate(`/pass/${result.passId}`), 1200);
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการตรวจสอบ');
      setStep('qr');
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col py-6 sm:py-10 animate-fade-in">
      <div className="page-container max-w-4xl">
        
        {/* Header navigation */}
        <div className="flex items-center gap-3 mb-6 sm:mb-8 pb-4 border-b border-slate-200">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 shadow-sm active:scale-95 transition-all"
            aria-label="ย้อนกลับ"
          >
            ←
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">ชำระเงินผ่าน PromptPay</h1>
            <p className="text-slate-500 text-xs sm:text-sm">
              {canSimulatePayment
                ? 'โหมดสาธิตเท่านั้น QR นี้ไม่รับเงินจริงและไม่ควรนำไปสแกนจ่าย'
                : 'ตรวจสอบชื่อผู้รับและยอดเงินในแอปธนาคารก่อนชำระ'}
            </p>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start">
          
          {/* Left Column: QR Code & PromptPay Info */}
          <div className="md:col-span-6 flex flex-col items-center">
            <div className="glass-card w-full flex flex-col items-center p-6 border-slate-200 bg-white shadow-xl shadow-slate-200/60">
              
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs uppercase font-bold tracking-wider text-slate-700">
                  {canSimulatePayment ? 'QR จำลองสำหรับสาธิต' : 'พร้อมเพย์ (PromptPay QR)'}
                </span>
              </div>

              {/* QR Container */}
              <div className="bg-white p-5 rounded-2xl shadow-xl shadow-slate-200/80 border-2 border-slate-200 flex flex-col items-center">
                <QRCodeSVG
                  value={qrValue}
                  size={210}
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                  level="M"
                />
                <div className="mt-3 flex items-center gap-1.5 text-slate-900 text-xs font-bold font-mono">
                  <span>{canSimulatePayment ? '🧪 รหัสตัวอย่าง — ห้ามชำระเงินจริง' : `📱 ยอดชำระ ${finalAmount.toLocaleString()} บาท`}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
                {canSimulatePayment
                  ? 'การกดยืนยันด้านล่างเป็นเพียงการจำลองออกพาส'
                  : 'โปรดตรวจสอบชื่อบัญชีและยอดเงินที่แสดงในแอปธนาคารก่อนยืนยัน'}
              </div>
            </div>
          </div>

          {/* Right Column: Order Breakdown & Points Discount */}
          <div className="md:col-span-6 flex flex-col gap-5">
            
            {/* Amount card */}
            <div className="glass-card p-6 text-center md:text-left bg-gradient-to-br from-brand-50 via-white to-amber-50 border-brand-200">
              <span className="text-slate-500 text-xs uppercase tracking-wider font-bold">ยอดชำระสุทธิ</span>
              <div className="flex items-baseline justify-center md:justify-start gap-2 mt-1">
                <span className="text-4xl sm:text-5xl font-extrabold text-brand-600 font-mono">
                  {finalAmount.toLocaleString()}
                </span>
                <span className="text-slate-600 font-bold text-base">บาท</span>
              </div>
              {pointDiscount > 0 && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                  <span>🎉</span>
                  <span>ใช้ {usePoints} แต้ม ลดไป {pointDiscount} บาท</span>
                </div>
              )}
            </div>

            {/* Points Slider */}
            {pointsLimit > 0 && (
              <div className="glass-card bg-white">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span>🌟</span>
                    <span>ใช้แต้มสะสมแลกส่วนลด</span>
                  </span>
                  <span className="text-xs text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    มี {points.totalPoints} แต้ม (= {points.totalPoints * points.pointValueBaht}฿)
                  </span>
                </div>
                <p className="text-slate-500 text-xs mb-3 font-medium">1 แต้ม = 2 บาท ใช้ลดค่าพาสได้ทันที</p>
                
                <input
                  id="input-use-points"
                  type="range"
                  min={0}
                  max={pointsLimit}
                  value={selectedPoints}
                  disabled={applyingPoints || confirming || step === 'done'}
                  onChange={(e) => setUsePoints(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                />

                <div className="flex justify-between items-center text-xs mt-3">
                  <span className="text-slate-400 font-medium">0 แต้ม</span>
                  <span className="text-brand-700 font-bold bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                    เลือกใช้: {selectedPoints} แต้ม (-{selectedDiscount}฿)
                  </span>
                  <span className="text-slate-400 font-medium">{pointsLimit} แต้ม</span>
                </div>
                <div className="flex items-center justify-between gap-3 mt-3">
                  <span className="text-xs text-slate-500">
                    {order.pointsUsed ? `ใช้แล้ว ${order.pointsUsed} แต้ม` : 'แต้มจะมีผลเมื่ออัปเดต QR'}
                  </span>
                  <button
                    type="button"
                    onClick={handleApplyPoints}
                    disabled={applyingPoints || confirming || step === 'done' || selectedPoints === (order.pointsUsed || 0)}
                    className="btn-sm bg-amber-50 border border-amber-200 text-amber-800 font-bold disabled:opacity-50"
                  >
                    {applyingPoints ? 'กำลังอัปเดต QR...' : 'นำแต้มไปใช้'}
                  </button>
                </div>
              </div>
            )}

            {/* Order Details list */}
            <div className="glass-card bg-white">
              <span className="text-slate-400 text-xs uppercase tracking-wider font-bold block mb-3">
                รายละเอียดออเดอร์
              </span>
              <div className="space-y-2.5 text-xs sm:text-sm">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">รหัสออเดอร์</span>
                  <span className="text-slate-900 font-mono font-bold">{orderId}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">ราคาพาส</span>
                  <span className="text-slate-900 font-bold">{subtotal.toLocaleString()} บาท</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">ส่วนลดจากแต้ม</span>
                  <span className="text-emerald-600 font-bold">{pointDiscount > 0 ? `-${pointDiscount} บาท` : '—'}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-600">สถานะ</span>
                  <span className="text-amber-600 font-bold">รอการชำระเงิน</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-medium">
                ⚠️ {error}
              </div>
            )}

            {step === 'done' && (
              <div className="glass-card border-emerald-300 bg-emerald-50 text-emerald-800 text-center py-4 animate-bounce-in shadow-md">
                <div className="text-2xl mb-1">🎉</div>
                <p className="font-extrabold text-base">ชำระเงินสำเร็จแล้ว!</p>
                <p className="text-xs text-slate-600 mt-1">กำลังพาคุณไปยังหน้าพาสดิจิทัล...</p>
              </div>
            )}

            {/* Confirm Button */}
            <div className="mt-2">
              <button
                id="btn-confirm-payment"
                onClick={handleConfirm}
                disabled={!canSimulatePayment || confirming || step === 'done'}
                className="btn-primary py-4 text-base font-bold shadow-xl shadow-brand-500/25 flex items-center justify-center gap-2"
              >
                {confirming ? (
                  <>
                    <span className="animate-spin text-lg">⟳</span>
                    <span>กำลังตรวจสอบยอดโอน...</span>
                  </>
                ) : step === 'done' ? (
                  '✅ ยืนยันเรียบร้อยแล้ว!'
                ) : canSimulatePayment ? (
                  USE_MOCK ? '🧪 จำลองการรับพาส (DEMO)' : '✅ ยืนยันการชำระเงิน (โหมดพัฒนา)'
                ) : (
                  'ระบบยืนยันการชำระเงินยังไม่พร้อม'
                )}
              </button>
              <p className="text-center text-slate-400 text-xs mt-2">
                {canSimulatePayment
                  ? 'โหมดตัวอย่างเท่านั้น ปุ่มนี้ไม่ได้ตรวจสอบหรือรับเงินจริง'
                  : 'ระบบจะเปิดปุ่มนี้เมื่อเชื่อมต่อการตรวจสอบการชำระเงินจริงแล้ว'}
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
