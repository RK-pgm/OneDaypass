import { Link } from 'react-router-dom';

function PageNavigation({ page }) {
  return (
    <nav aria-label="เมนูข้อมูล DayPass" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-slate-600">
      <Link to="/about" className={page === 'about' ? 'text-orange-700' : 'hover:text-orange-700'}>เกี่ยวกับ</Link>
      <Link to="/privacy" className={page === 'privacy' ? 'text-orange-700' : 'hover:text-orange-700'}>ความเป็นส่วนตัว</Link>
      <Link to="/terms" className={page === 'terms' ? 'text-orange-700' : 'hover:text-orange-700'}>ข้อกำหนด</Link>
      <Link to="/" className="rounded-xl bg-orange-600 px-4 py-2 text-white hover:bg-orange-700">เข้าสู่ DayPass</Link>
    </nav>
  );
}

function AboutPage() {
  return (
    <>
      <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-orange-700">เที่ยวครบย่าน วันเดียว</p>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">วางแผนเที่ยวและค้นพบร้านน่าแวะกับ DayPass</h1>
      <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
        DayPass ช่วยจัดแผนเที่ยวรายวัน แนะนำร้านและกิจกรรมในย่านต่าง ๆ พร้อมแสดงข้อมูลพาส คูปอง การเช็กอิน ภารกิจ และแต้มสะสมในที่เดียว
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {[
          ['วางแผนเที่ยว', 'เลือกย่านและความสนใจเพื่อดูเส้นทางและรายการสถานที่ที่แนะนำ'],
          ['ดูข้อมูลร้าน', 'สำรวจร้านอาหาร คาเฟ่ ขนม สถานที่ถ่ายรูป และกิจกรรม'],
          ['จัดการพาส', 'ดูสถานะพาส คูปอง และประวัติการเช็กอินจากบัญชีของคุณ'],
          ['ร่วมภารกิจ', 'ส่งภาพกิจกรรมในพาสเพื่อบันทึกภารกิจและแต้มในระบบ'],
        ].map(([title, description]) => (
          <section key={title} className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-bold text-slate-900">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </section>
        ))}
      </div>
      <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-950">
        <h2 className="font-bold">สถานะบริการในรุ่นปัจจุบัน</h2>
        <p className="mt-1">ระบบสั่งซื้อและชำระเงินยังเป็นโหมดสาธิต ไม่มีการรับชำระเงินจริงหรือออกพาสที่ชำระเงินจริงในรุ่นนี้ กรุณาอย่าโอนเงินจาก QR ตัวอย่างในระบบ</p>
      </div>
      <p className="mt-8 text-sm leading-7 text-slate-600">
        ก่อนใช้งาน โปรดอ่าน <Link className="font-semibold text-orange-700 underline" to="/privacy">นโยบายความเป็นส่วนตัว</Link> และ <Link className="font-semibold text-orange-700 underline" to="/terms">ข้อกำหนดการใช้งาน</Link>
      </p>
    </>
  );
}

function PrivacyPage() {
  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">นโยบายความเป็นส่วนตัว</h1>
      <p className="mt-2 text-sm text-slate-500">มีผลตั้งแต่วันที่เผยแพร่บนเว็บไซต์ DayPass</p>
      <div className="mt-7 space-y-7 text-sm leading-7 text-slate-700">
        <section>
          <h2 className="text-lg font-bold text-slate-900">ข้อมูลที่เราเก็บ</h2>
          <p className="mt-2">เมื่อสมัครหรือแก้ไขโปรไฟล์ คุณอาจให้ชื่อ ชื่อเล่น อีเมล เบอร์โทรศัพท์ วันเกิด ที่อยู่ จังหวัด/อำเภอ/ตำบล และรูปโปรไฟล์ หากเลือกลงชื่อเข้าใช้ด้วย Google เราได้รับรหัสบัญชี Google ชื่อ อีเมล และรูปโปรไฟล์ที่ Google ส่งให้เพื่อยืนยันตัวตน</p>
          <p className="mt-2">เมื่อใช้บริการ ระบบอาจบันทึกแผนเที่ยว รายการคำสั่งซื้อและพาส คูปอง การเช็กอิน แต้ม ภารกิจ และภาพที่ส่งในภารกิจ อาจใช้รหัสอุปกรณ์ที่สร้างในเบราว์เซอร์เพื่อเชื่อมข้อมูลการใช้งานกับบัญชี</p>
          <p className="mt-2">หากคุณอนุญาตให้ใช้ตำแหน่ง ระบบอาจอ่านพิกัดเพื่อช่วยตั้งค่าพื้นที่หรือยืนยันการเช็กอิน และบันทึกพิกัดที่เกี่ยวข้องกับโปรไฟล์หรือการเช็กอิน</p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-slate-900">เราใช้ข้อมูลอย่างไร</h2>
          <p className="mt-2">เราใช้ข้อมูลเพื่อสร้างและดูแลบัญชี แสดงแผนเที่ยวและโปรไฟล์ จัดการพาส/คูปอง/เช็กอิน/ภารกิจ/แต้ม ป้องกันการใช้บัญชีผิดปกติ และตอบคำขอช่วยเหลือ ข้อมูล Google ใช้เพื่อยืนยันตัวตนและเชื่อมบัญชี DayPass เท่านั้น เราไม่ขอเข้าถึง Gmail, Drive หรือข้อมูล Google อื่นที่ไม่จำเป็นต่อการลงชื่อเข้าใช้</p>
          <p className="mt-2">รหัสผ่านที่สมัครกับ DayPass ถูกแฮชพร้อม salt ก่อนจัดเก็บ ส่วนโทเคน Google ใช้ตรวจสอบการลงชื่อเข้าใช้และไม่ถูกบันทึกเป็นข้อมูลโปรไฟล์</p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-slate-900">การจัดเก็บและผู้ให้บริการ</h2>
          <p className="mt-2">ข้อมูลบัญชีและกิจกรรมที่ต้องใช้ข้ามอุปกรณ์จัดเก็บในฐานข้อมูลของบริการ ข้อมูลแผนและสถานะบางรายการอาจถูกเก็บใน local storage หรือ session storage ของเบราว์เซอร์บนอุปกรณ์ของคุณ ข้อมูลภาพโปรไฟล์และภาพภารกิจอาจถูกส่งไปยังระบบของ DayPass เพื่อแสดงหรือบันทึกภารกิจ</p>
          <p className="mt-2">การลงชื่อเข้าใช้ประมวลผลผ่าน Google และเว็บไซต์/เซิร์ฟเวอร์ของ DayPass ให้บริการผ่าน Vercel; แผนที่อาจโหลดแผนที่จาก OpenStreetMap ผู้ให้บริการเหล่านี้อาจประมวลผลข้อมูลทางเทคนิคที่จำเป็นต่อการให้บริการตามนโยบายของตน</p>
          <p className="mt-2">เราไม่ขายข้อมูลส่วนบุคคลและไม่ใช้ข้อมูล Google เพื่อโฆษณา เราเปิดเผยข้อมูลแก่ผู้ให้บริการที่จำเป็นต่อระบบ หรือเมื่อกฎหมายกำหนดเท่านั้น</p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-slate-900">ระยะเวลาและสิทธิของคุณ</h2>
          <p className="mt-2">เราเก็บข้อมูลเท่าที่จำเป็นต่อการให้บริการ ดูแลบัญชี และปฏิบัติตามกฎหมาย คุณสามารถขอเข้าถึง แก้ไข หรือขอลบข้อมูลส่วนบุคคลได้ผ่านอีเมลสนับสนุนที่แสดงในหน้าลงชื่อเข้าใช้ Google ของ DayPass ทั้งนี้ ข้อมูลบางอย่างอาจต้องเก็บต่อเมื่อกฎหมายหรือการจัดการข้อพิพาทกำหนด</p>
          <p className="mt-2">คุณสามารถปฏิเสธสิทธิ์ตำแหน่งได้จากเบราว์เซอร์ และล้างข้อมูลใน local storage/session storage ได้จากการตั้งค่าเบราว์เซอร์ การล้างข้อมูลในอุปกรณ์อาจทำให้การเข้าสู่ระบบหรือข้อมูลที่เก็บไว้เฉพาะอุปกรณ์หายไป</p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-slate-900">การเปลี่ยนแปลงนโยบาย</h2>
          <p className="mt-2">หากแนวทางจัดการข้อมูลเปลี่ยนแปลง เราจะปรับปรุงนโยบายนี้บนหน้านี้และแสดงวันที่มีผลฉบับล่าสุด</p>
        </section>
      </div>
    </>
  );
}

function TermsPage() {
  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">ข้อกำหนดการใช้งาน DayPass</h1>
      <p className="mt-2 text-sm text-slate-500">มีผลตั้งแต่วันที่เผยแพร่บนเว็บไซต์ DayPass</p>
      <div className="mt-7 space-y-7 text-sm leading-7 text-slate-700">
        <section>
          <h2 className="text-lg font-bold text-slate-900">บริการ</h2>
          <p className="mt-2">DayPass ช่วยจัดแผนเที่ยวและแสดงข้อมูลสถานที่ พาส คูปอง เช็กอิน ภารกิจ และแต้ม รายละเอียดสถานที่ เวลาเปิด และสิทธิประโยชน์อาจเปลี่ยนแปลงได้ โปรดตรวจสอบข้อมูลกับสถานที่หรือผู้จัดกิจกรรมก่อนเดินทาง</p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-slate-900">บัญชีผู้ใช้</h2>
          <p className="mt-2">คุณต้องให้ข้อมูลที่ถูกต้อง รักษาข้อมูลเข้าสู่ระบบของตน และใช้บริการตามกฎหมาย ห้ามใช้บัญชีหรือพาสของผู้อื่นโดยไม่ได้รับอนุญาต ห้ามรบกวนระบบหรือส่งข้อมูลที่ผิดกฎหมาย</p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-slate-900">คำสั่งซื้อและการชำระเงิน</h2>
          <p className="mt-2">ในรุ่นปัจจุบัน ขั้นตอนสั่งซื้อ QR และการออกพาสเป็นการจำลองเพื่อทดสอบเท่านั้น ระบบยังไม่รับชำระเงินจริง กรุณาอย่าโอนเงินจาก QR ตัวอย่าง และอย่าถือว่าการกดปุ่มยืนยันในรุ่นสาธิตเป็นการซื้อบริการจริง</p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-slate-900">คูปอง ภารกิจ และแต้ม</h2>
          <p className="mt-2">สิทธิประโยชน์ขึ้นกับเงื่อนไขของร้านหรือกิจกรรมที่ระบุในแอป แต้มและสถานะภารกิจใช้ภายใน DayPass และไม่มีมูลค่าเป็นเงิน เว้นแต่มีการแจ้งเงื่อนไขใหม่อย่างชัดเจน</p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-slate-900">ความพร้อมใช้งานและการเปลี่ยนแปลง</h2>
          <p className="mt-2">เราพยายามดูแลข้อมูลและระบบให้พร้อมใช้งาน แต่อาจมีการหยุดปรับปรุงหรือแก้ไขข้อผิดพลาด ฟีเจอร์บางอย่างยังอยู่ระหว่างพัฒนา เราอาจปรับบริการและข้อกำหนดเมื่อจำเป็น โดยจะแสดงฉบับล่าสุดบนหน้านี้</p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-slate-900">การติดต่อ</h2>
          <p className="mt-2">หากมีคำถามเกี่ยวกับข้อกำหนดหรือบัญชี โปรดติดต่อผ่านอีเมลสนับสนุนที่แสดงในหน้าลงชื่อเข้าใช้ Google ของ DayPass</p>
        </section>
      </div>
    </>
  );
}

export default function PublicInfoPage({ page }) {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <header className="mb-10 flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/about" className="flex items-center gap-3 text-slate-900" aria-label="DayPass - เกี่ยวกับ">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-100 text-2xl" aria-hidden="true">✈️</span>
            <span>
              <span className="block text-xl font-extrabold">DayPass</span>
              <span className="block text-xs text-slate-500">เที่ยวครบย่าน วันเดียว</span>
            </span>
          </Link>
          <PageNavigation page={page} />
        </header>
        <main className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          {page === 'privacy' ? <PrivacyPage /> : page === 'terms' ? <TermsPage /> : <AboutPage />}
        </main>
        <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <span>© DayPass</span>
          <span>เว็บไซต์ข้อมูลสาธารณะของ DayPass</span>
        </footer>
      </div>
    </div>
  );
}
