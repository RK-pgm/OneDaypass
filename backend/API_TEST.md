# ทดสอบ API ฝั่ง Backend B

## เริ่มเซิร์ฟเวอร์

เปิด PowerShell ที่โฟลเดอร์ `backend` แล้วรัน:

```powershell
Copy-Item .env.example .env
# ใส่ PromptPay ID สำหรับเดโมใน .env ก่อนสร้างออเดอร์
npm install
npm run seed
npm run dev
```

`seed/shops.json` ยังว่างอยู่จนกว่าจะใส่ชื่อร้านและพิกัดที่ตรวจแล้ว

## Health และร้าน

```powershell
curl.exe http://localhost:3000/api/health
curl.exe "http://localhost:3000/api/shops"
curl.exe "http://localhost:3000/api/shops?lat=13.7313&lng=100.5105&radiusKm=3"
```

## สร้างออเดอร์และออกพาส

ส่งแผนที่ได้จาก `POST /api/plans/generate` ให้ตรง contract:

```powershell
curl.exe -X POST http://localhost:3000/api/orders -H "Content-Type: application/json" -d '{"deviceId":"demo-device-1","people":1,"usePoints":0,"plan":{"title":"วันชิลตลาดน้อย","style":"chill","totalCostPerPerson":199,"items":[{"order":1,"time":"10:00","shopId":"s01","shopName":"ร้านตัวอย่าง","category":"cafe","lat":13.7313,"lng":100.5105,"activity":"ลองเมนูแนะนำ","estCost":199,"durationMin":60,"distanceFromPrevKm":0,"coupon":{"id":"c-s01","title":"แถมน้ำ 1 แก้ว"},"mission":null}]}}'
```

ใช้ `orderId` จากผลลัพธ์ไปยืนยันเดโม:

```powershell
curl.exe -X POST http://localhost:3000/api/orders/ORDER_ID/confirm -H "Content-Type: application/json" -d '{}'
curl.exe http://localhost:3000/api/passes/PASS_ID
```

## ใช้คูปองและเช็กอิน

```powershell
curl.exe -X POST http://localhost:3000/api/coupons/COUPON_ID/redeem -H "Content-Type: application/json" -d '{"passId":"PASS_ID"}'
curl.exe -X POST http://localhost:3000/api/checkin -H "Content-Type: application/json" -d '{"passId":"PASS_ID","shopId":"s01","lat":13.7313,"lng":100.5105,"simulate":true}'
```

การเช็กอินจำลองใช้ได้เมื่อ `DEMO_MODE=true`; ทดสอบระยะจริงให้ส่งพิกัด GPS และ `simulate:false` ระบบกำหนดระยะผ่านไม่เกิน 150 เมตร

`POST /api/plans/generate`, `/api/missions/*` และ `/api/points` เป็น stub 501 จนกว่าเพื่อนที่รับผิดชอบส่วน C จะเพิ่ม router
