# 📘 DayPass API Specification

Base URL: `http://localhost:5000/api` (หรือผ่าน Vite Proxy ที่ `http://localhost:5173/api`)

ทุก Response เป็น JSON และใช้ HTTP Status Codes ตามมาตรฐาน:
- `200 OK`: สำเร็จ
- `201 Created`: สร้างข้อมูลใหม่สำเร็จ
- `400 Bad Request`: พารามิเตอร์ไม่ถูกต้อง
- `403 Forbidden`: ยังไม่ได้ทำเงื่อนไขที่กำหนด (เช่น ยังไม่เช็กอินร้าน)
- `404 Not Found`: ไม่พบข้อมูล
- `409 Conflict`: ใช้งานซ้ำหรือส่งซ้ำ
- `500 Internal Server Error`: ข้อผิดพลาดภายในเซิร์ฟเวอร์

---

## 1. ดึงข้อมูลร้านค้าทั้งหมด หรือกรองตามระยะทาง
- **Endpoint**: `GET /api/shops?lat=&lng=&radiusKm=`
- **คำอธิบาย**: ดึงรายชื่อร้านค้าในย่าน หากส่งพิกัดและรัศมีมา จะคำนวณระยะทางจริงด้วยสูตร Haversine และเรียงจากใกล้ไปไกล

### Request Parameters (Query)
| Field | Type | Required | Description |
|---|---|---|---|
| `lat` | Number | No | ละติจูดปัจจุบัน (เช่น `13.7335`) |
| `lng` | Number | No | ลองจิจูดปัจจุบัน (เช่น `100.5126`) |
| `radiusKm` | Number | No | รัศมีค้นหาในหน่วยกิโลเมตร (เช่น `2`) |

### Example Response (`200 OK`)
```json
{
  "shops": [
    {
      "id": "s01",
      "name": "Hong Sieng Kong (ฮงเซียงกง)",
      "district": "ตลาดน้อย",
      "category": "cafe",
      "lat": 13.7335,
      "lng": 100.5126,
      "avgPrice": 180,
      "tags": ["chill"],
      "recommendedMenu": "Orange Dirty Coffee & เค้กมะพร้าวอ่อน",
      "coupon": {
        "title": "รับฟรี ซอฟต์คุกกี้โฮมเมด 1 ชิ้น เมื่อสั่งเครื่องดื่ม",
        "valueText": "แถมขนมมูลค่า 45 บาท"
      },
      "openFrom": "10:00",
      "openTo": "20:00",
      "durationMin": 60,
      "mission": {
        "title": "ถ่ายรูปแก้วเครื่องดื่มคู่กับวิวแม่น้ำเจ้าพระยา",
        "points": 5
      },
      "distanceKm": 0.05
    }
  ]
}
```

---

## 2. สร้างแผนท่องเที่ยวอัตโนมัติ (AI Itinerary Planner)
- **Endpoint**: `POST /api/plans/generate`
- **คำอธิบาย**: จัดตารางเวลาเที่ยว 1 วัน (4-5 จุด) คำนวณเวลาเปิด-ปิด ระยะเดินระหว่างจุด และคุมงบประมาณ

### Request Body
```json
{
  "budget": 500,
  "style": "chill",
  "radiusKm": 2.5,
  "startLat": 13.7335,
  "startLng": 100.5126,
  "people": 2,
  "startTime": "10:00"
}
```

### Example Response (`200 OK`)
```json
{
  "plan": {
    "title": "DayPass ตลาดน้อย วันเดียวเที่ยวเพลินฉบับสโลว์ไลฟ์ (5 จุดเช็กอิน)",
    "style": "chill",
    "totalCostPerPerson": 480,
    "items": [
      {
        "order": 1,
        "time": "10:00",
        "shopId": "s01",
        "shopName": "Hong Sieng Kong (ฮงเซียงกง)",
        "category": "cafe",
        "lat": 13.7335,
        "lng": 100.5126,
        "activity": "นั่งพักผ่อนชิลๆ ลอง Orange Dirty Coffee & เค้กมะพร้าวอ่อน",
        "estCost": 180,
        "durationMin": 60,
        "distanceFromPrevKm": 0.0,
        "coupon": {
          "id": "c-s01",
          "title": "รับฟรี ซอฟต์คุกกี้โฮมเมด 1 ชิ้น เมื่อสั่งเครื่องดื่ม",
          "valueText": "แถมขนมมูลค่า 45 บาท"
        },
        "mission": {
          "id": "m-s01",
          "title": "ถ่ายรูปแก้วเครื่องดื่มคู่กับวิวแม่น้ำเจ้าพระยา",
          "points": 5
        }
      }
    ]
  }
}
```

---

## 3. สร้างคำสั่งซื้อพาส & PromptPay QR
- **Endpoint**: `POST /api/orders`
- **คำอธิบาย**: คำนวณราคาพาส (199 ฿/คน) หักส่วนลดแต้ม (1 แต้ม = 2 บาท ไม่เกิน 30%) และสร้าง PromptPay Payload + QR Data URL

### Request Body
```json
{
  "deviceId": "dev_user_123",
  "plan": { /* plan object from endpoint 2 */ },
  "people": 2,
  "usePoints": 10
}
```

### Example Response (`201 Created`)
```json
{
  "orderId": "o_1792733247672_s0rhz",
  "amount": 378,
  "discount": 20,
  "status": "pending",
  "promptpayPayload": "00020101021129370016A000000677010111011300668123456785802TH53037645406378.006304...",
  "qrDataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA..."
}
```

---

## 4. ยืนยันการชำระเงิน (ปุ่ม "ฉันโอนแล้ว")
- **Endpoint**: `POST /api/orders/:orderId/confirm`
- **คำอธิบาย**: ยืนยันการชำระเงิน ตัดแต้มที่ใช้ และออกบัตร DayPass รหัส `DP-XXXXX` พร้อมคูปองร้านค้า

### Request Body
```json
{
  "slipImageName": "mock_slip.jpg"
}
```

### Example Response (`200 OK`)
```json
{
  "passId": "p_1792733247680_6l5du",
  "status": "paid"
}
```

---

## 5. ดึงข้อมูล DayPass ที่ซื้อไว้
- **Endpoint**: `GET /api/passes/:passId`
- **คำอธิบาย**: โหลดสถานะพาส คูปองที่ใช้ได้ ประวัติเช็กอิน และมิชชั่นที่ปลดล็อกแล้ว

### Example Response (`200 OK`)
```json
{
  "id": "p_1792733247680_6l5du",
  "code": "DP-62LJR",
  "status": "active",
  "validDate": "2026-10-23",
  "people": 2,
  "plan": { /* plan object */ },
  "coupons": [
    {
      "id": "c_p_1792733247680_6l5du_s01",
      "shopId": "s01",
      "title": "รับฟรี ซอฟต์คุกกี้โฮมเมด 1 ชิ้น เมื่อสั่งเครื่องดื่ม",
      "valueText": "แถมขนมมูลค่า 45 บาท",
      "used": false,
      "redeemedAt": null
    }
  ],
  "checkins": [
    { "shopId": "s01", "at": "2026-10-23T05:27:26.541Z", "distanceM": 25 }
  ],
  "unlockedMissionIds": ["m-s01"]
}
```

---

## 6. ใช้สิทธิ์คูปองอาหาร (Redeem Coupon)
- **Endpoint**: `POST /api/coupons/:couponId/redeem`
- **คำอธิบาย**: ใช้สิทธิ์คูปองที่ร้าน หากใช้ซ้ำจะตอบ `409 Conflict`

### Request Body
```json
{
  "passId": "p_1792733247680_6l5du"
}
```

### Example Response (`200 OK`)
```json
{
  "ok": true,
  "redeemedAt": "2026-10-23T05:27:26.512Z"
}
```

---

## 7. เช็กอินสถานที่ท่องเที่ยว
- **Endpoint**: `POST /api/checkin`
- **คำอธิบาย**: ตรวจสอบว่าอยู่ใกล้ร้านไม่เกิน 150 เมตร หรือใช้ `simulate: true` สำหรับการพรีเซนต์บนเวที เมื่อเช็กอินสำเร็จจะปลดล็อกมิชชั่น

### Request Body
```json
{
  "passId": "p_1792733247680_6l5du",
  "shopId": "s01",
  "lat": 13.7335,
  "lng": 100.5126,
  "simulate": true
}
```

### Example Response (`200 OK`)
```json
{
  "ok": true,
  "distanceM": 25,
  "unlockedMissionIds": ["m-s01"]
}
```

---

## 8. ส่งภาพถ่ายทำมิชชั่นรับแต้ม
- **Endpoint**: `POST /api/missions/:missionId/submit`
- **Content-Type**: `multipart/form-data`
- **คำอธิบาย**: ส่งรูปถ่ายเพื่อรับ +5 แต้ม (ต้องเช็กอินร้านนั้นก่อน ไม่เช่นนั้นตอบ `403`, ส่งซ้ำตอบ `409`)

### Form Fields
- `passId`: รหัสพาส
- `deviceId`: รหัสเครื่องผู้ใช้
- `image`: ไฟล์รูปภาพ (Optional ในโหมดจำลอง)

### Example Response (`200 OK`)
```json
{
  "ok": true,
  "pointsAwarded": 5,
  "totalPoints": 15
}
```

---

## 9. ตรวจสอบแต้มสะสม
- **Endpoint**: `GET /api/points?deviceId=...`
- **คำอธิบาย**: ดูยอดแต้มสะสมทั้งหมดและอัตราแลกเป็นเงินบาท

### Example Response (`200 OK`)
```json
{
  "totalPoints": 15,
  "pointValueBaht": 2
}
```
