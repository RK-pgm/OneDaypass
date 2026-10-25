# 🎫 DayPass (เดย์พาส) - ตลาดน้อย กรุงเทพฯ
> **"พาสเที่ยว 1 ย่าน ใน 1 วัน"** | แผนเที่ยวเรียงเวลาจริง + คูปองอาหารร้านเด็ด + เช็กอินด้วยตำแหน่งปัจจุบัน + มิชชั่นสะสมแต้ม
> *โปรเจกต์เดโม่สำหรับการแข่งขัน Make Me Money Hackathon (สายการท่องเที่ยวและเศรษฐกิจชุมชน)*

---

## 🌟 จุดเด่นของ DayPass
1. **ไม่ใช่แอปดูฟรี แต่คือสินค้าที่สร้างรายได้ (Make Me Money)**: ขายตั๋ว DayPass ราคา 199–399 บาท ที่มัดรวมสิทธิประโยชน์คุ้มค่าเกินราคา
2. **AI-Driven Dynamic Itinerary**: เลือกระยะทาง งบประมาณ และสไตล์ (ชิล ☕ / ลุย 🏃) ระบบสร้างแผนเที่ยวเรียงเวลาจริงโดยคำนึงถึงเวลาเปิด-ปิดและระยะเดิน
3. **PromptPay QR Code ในตัว**: ออก QR พร้อมเพย์จริง คำนวณส่วนลดแต้มสะสม และยืนยันการโอนเงินเพื่อออกพาสทันที
4. **Voucher & Check-in Gamification**: เช็กอินด้วย GPS รัศมี 150 เมตรเพื่อปลดล็อกมิชชั่นถ่ายรูปอาหาร รับแต้มแลกส่วนลดพาสย่านต่อไป
5. **Stage Presentation Mode**: มีสวิตช์เปิด/ปิด "โหมดจำลองพิกัดบนเวที" ช่วยให้นำเสนอเดโม่ต่อหน้าคณะกรรมการได้อย่างราบรื่น

---

## 🏗️ โครงสร้างโฟลเดอร์ (Project Structure)
```
daypass/
├── backend/                  # Node.js + Express; SQLite locally, PostgreSQL on Vercel
│   ├── src/
│   │   ├── server.js         # จุดเริ่มต้นเซิร์ฟเวอร์ & Mount API routes
│   │   ├── db.js             # จัดการฐานข้อมูลและ migration
│   │   ├── lib/
│   │   │   └── haversine.js  # สูตรคำนวณระยะทาง GPS (กม. / ม.)
│   │   └── routes/           # Router แยกตามโมดูล API Contract
│   │       ├── shops.js      # GET /api/shops
│   │       ├── plans.js      # POST /api/plans/generate
│   │       ├── orders.js     # POST /api/orders & confirm
│   │       ├── passes.js     # GET /api/passes and /api/passes/:id
│   │       ├── coupons.js    # POST /api/coupons/:id/redeem
│   │       ├── checkin.js    # POST /api/checkin
│   │       ├── missions.js   # POST /api/missions/:id/submit
│   │       └── points.js     # GET /api/points and POST /api/points/add
│   ├── uploads/              # โฟลเดอร์เก็บรูปภาพภารกิจ
│   └── package.json
│
├── frontend/                 # React + Vite + Tailwind CSS + Leaflet (Mobile-First)
│   ├── src/
│   │   ├── components/       # Navbar, BottomNav, LeafletMap, Modals
│   │   ├── pages/            # Home, PlanPreview, Checkout, PassDetail, MapView, MyPasses
│   │   ├── utils/            # deviceId & pass persistence helpers
│   │   ├── api.js            # Central API client
│   │   ├── App.jsx           # Routing & global state
│   │   └── index.css         # Glassmorphism & typography design system
│   └── vite.config.js        # Vite + Tailwind v4 + API Proxy
│
├── seed/
│   └── shops.json            # ข้อมูลร้านจริง 16 ร้านในตลาดน้อย พร้อมพิกัด เมนูเด็ด และคูปอง
│
└── docs/                     # เอกสารประกอบการแข่งขัน
    ├── API_DOCUMENTATION.md  # รายละเอียด API Contract ครบทั้ง 9 endpoints
    ├── PITCH_DECK.md         # สคริปต์พรีเซนต์ 3 นาที & โมเดลธุรกิจ Make Me Money
    ├── DEMO_GUIDE.md         # ขั้นตอนการสาธิตเดโม่บนเวทีแบบไม่สะดุด
    └── GIT_TEAM_GUIDE.md     # คู่มือการทำงานเป็นทีมด้วย Git สำหรับ 3 คน
```

---

## 🚀 วิธีติดตั้งและรันระบบ (Quick Start)

### 1. รันฝั่ง Backend
```powershell
cd backend
npm install
npm run dev
```
เซิร์ฟเวอร์จะเปิดที่ `http://localhost:5000` (ทดสอบ Health Check ได้ที่ `http://localhost:5000/api/health`)

### 2. รันฝั่ง Frontend
```powershell
cd frontend
npm install
npm run dev
```
เปิดเบราว์เซอร์ไปที่ `http://localhost:5173/`

### ฐานข้อมูล Production บน Vercel

SQLite ใช้สำหรับพัฒนาในเครื่องเท่านั้น ข้อมูลใน filesystem ของ Vercel เป็นพื้นที่ชั่วคราว จึงไม่เหมาะกับบัญชี คำสั่งซื้อ หรือพาสที่ต้องอยู่ข้ามการเริ่มระบบใหม่

1. สร้าง Supabase project แล้วคัดลอก connection string แบบ **Transaction pooler** จาก Project Settings → Database
2. เพิ่มค่า `DATABASE_URL` ใน Vercel Project Settings → Environment Variables สำหรับ Production และ Preview โดยไม่ใส่ connection string ลงใน Git หรือส่งผ่านแชต
3. Redeploy แอป Backend; ระบบจะสร้างตารางและเติมข้อมูลร้านตัวอย่างให้อัตโนมัติเมื่อฐานข้อมูลยังว่าง

ข้อมูลที่เคยอยู่ใน SQLite ชั่วคราวบน Vercel ไม่สามารถย้ายหรือกู้คืนจากการ deploy ได้โดยอัตโนมัติ ผู้ใช้ต้องลงทะเบียนใหม่หากบัญชีเดิมไม่อยู่แล้ว

---

## 🏠 ข้อมูลที่อยู่ประเทศไทย

ตัวเลือกจังหวัด-อำเภอ/เขต-ตำบล/แขวงใช้ข้อมูลแบบออฟไลน์ที่ bundle มากับเว็บ จาก `thai-address-database` v0.0.33 ซึ่ง upstream ระบุว่าฐานข้อมูลต้นทางมาจากไฟล์ของไปรษณีย์ไทย ข้อมูลเป็น snapshot ที่แนบมากับแอป ไม่ใช่การเชื่อมต่อข้อมูลสด และแสดงแหล่งที่มา/เงื่อนไขการใช้งานไว้ใน `frontend/src/data/THAI_ADDRESS_DATA_LICENSE.txt`

---

## 📊 ข้อมูลร้านตัวอย่าง (16 ร้านจริงในย่านตลาดน้อย)
- **คาเฟ่ & วินเทจ**: Hong Sieng Kong, Mother Roaster, Patina Bangkok, Vanich House, Citizens Tea Canteen, Timo & Tintin
- **สตรีตฟู้ด & ของคาว**: เฟิงจู เกี๊ยวซ่าหน้าเปิด, เป็ดพะโล้นายหนับ, ก๋วยเตี๋ยวรู ตลาดน้อย (เจ๊บ๊วย), บ้านริมน้ำ ตลาดน้อย
- **ของหวาน & เบเกอรี่**: กะหรี่ปั๊บคุณปุ๊, ขนมเปี๊ยะแต้เล่าจิ้นเส็ง
- **จุดถ่ายรูป & วัฒนธรรม**: ศาลเจ้าโจวซือกง (200 ปี), ตรอกเซียงกง & ซากรถเต่าคลาสสิก, โบสถ์กาลหว่าร์, River City Bangkok

---

## 🎓 ทีมผู้พัฒนา
- **นักเรียนทีม 3 คน**: แบ่งงาน Front-end, Back-end Core, และ Business Logic/Algorithms
- ที่ปรึกษา: อาจารย์ AI Assistant (Google DeepMind)
