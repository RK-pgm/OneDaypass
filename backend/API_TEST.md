# ทดสอบ API ฝั่ง Backend B

## เริ่มเซิร์ฟเวอร์

เปิด PowerShell ที่โฟลเดอร์ `backend` แล้วรัน:

```powershell
Copy-Item .env.example .env
npm install
npm run seed
npm run dev
```

`seed/shops.json` มีข้อมูลร้านตัวอย่างสำหรับทดสอบการสร้างแผน

## Health และร้าน

```powershell
curl.exe http://localhost:5000/api/health
curl.exe "http://localhost:5000/api/shops"
curl.exe "http://localhost:5000/api/shops?lat=13.7313&lng=100.5105&radiusKm=3"
```

## สมัครบัญชีและเข้าสู่ระบบข้ามอุปกรณ์

สมัครบัญชีด้วยเบอร์โทรศัพท์หรืออีเมลและรหัสผ่าน (อย่างน้อย 8 ตัวอักษร) พร้อมส่ง `previousDeviceId` เพื่อย้ายประวัติพาสและแต้มจากอุปกรณ์เดิมไปยังบัญชี:

```powershell
curl.exe -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d '{"nickname":"นักเดินทาง","phoneOrEmail":"traveler@example.test","password":"change-this-password","province":"bangkok","amphoe":"samphanthawong","tambon":"ตลาดน้อย","previousDeviceId":"dev-old-device"}'
curl.exe -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"phoneOrEmail":"traveler@example.test","password":"change-this-password"}'
```

ค่าบัญชี `accountId` ที่ได้จากการสมัครหรือเข้าสู่ระบบเป็นรหัสอ้างอิงข้อมูลถาวร ใช้แทน `deviceId` สำหรับแต้ม ประวัติพาส และกิจกรรมจากทุกอุปกรณ์ โปรไฟล์ที่แก้ไขในหน้าโปรไฟล์จะถูกบันทึกกลับบัญชีด้วย

รุ่นทดลองนี้ยังไม่มี OTP, การยืนยันอีเมล หรือการกู้คืนรหัสผ่าน ผู้ใช้จึงควรเก็บรหัสผ่านให้ปลอดภัย และไม่ใช้รหัสผ่านที่ใช้กับบริการอื่น

## สร้างออเดอร์และออกพาส

ส่งแผนที่ได้จาก `POST /api/plans/generate` ให้ตรง contract ระบบนี้เป็น prototype: ออเดอร์และพาสทั้งหมดเป็นข้อมูลตัวอย่าง ไม่สร้าง QR และไม่มีการรับหรือเรียกเก็บเงินจริง ไม่ต้องตั้งค่า `PROMPTPAY_ID`:

```powershell
curl.exe -X POST http://localhost:5000/api/orders -H "Content-Type: application/json" -d '{"deviceId":"demo-device-1","people":1,"usePoints":0,"plan":{"title":"วันชิลตลาดน้อย","style":"chill","totalCostPerPerson":199,"items":[{"order":1,"time":"10:00","shopId":"s01","shopName":"ร้านตัวอย่าง","category":"cafe","lat":13.7313,"lng":100.5105,"activity":"ลองเมนูแนะนำ","estCost":199,"durationMin":60,"distanceFromPrevKm":0,"coupon":{"id":"c-s01","title":"แถมน้ำ 1 แก้ว"},"mission":null}]}}'
```

ใช้ `orderId` จากผลลัพธ์เพื่อสร้างพาสตัวอย่าง:

```powershell
curl.exe -X POST http://localhost:5000/api/orders/ORDER_ID/confirm -H "Content-Type: application/json" -d '{}'
curl.exe http://localhost:5000/api/passes/PASS_ID
curl.exe "http://localhost:5000/api/passes?deviceId=demo-device-1"
```

ดูแต้มและรับโบนัสจากกิจกรรมที่ระบบรองรับ:

```powershell
curl.exe "http://localhost:5000/api/points?deviceId=demo-device-1"
curl.exe -X POST http://localhost:5000/api/points/add -H "Content-Type: application/json" -d '{"deviceId":"demo-device-1","delta":20,"type":"quiz_complete"}'
```

โบนัสต้อนรับและโบนัสทำควิซรับได้ครั้งเดียวต่ออุปกรณ์ ส่วนโบนัสรายวันรับได้วันละครั้ง
การเพิ่มโบนัสจาก client เปิดเฉพาะเมื่อ `DEMO_MODE=true`; ระบบ production ต้องเชื่อมกับการยืนยันบัญชีก่อน เพื่อป้องกันการปลอม deviceId รับแต้ม

## ใช้คูปองและเช็กอิน

```powershell
curl.exe -X POST http://localhost:5000/api/coupons/COUPON_ID/redeem -H "Content-Type: application/json" -d '{"passId":"PASS_ID"}'
curl.exe -X POST http://localhost:5000/api/checkin -H "Content-Type: application/json" -d '{"passId":"PASS_ID","shopId":"s01","lat":13.7313,"lng":100.5105,"simulate":true}'
```

การเช็กอินจำลองใช้ได้เมื่อ `DEMO_MODE=true`; ทดสอบระยะจริงให้ส่งพิกัด GPS และ `simulate:false` ระบบกำหนดระยะผ่านไม่เกิน 150 เมตร

เริ่ม backend ด้วย `npm run dev`; ค่าเริ่มต้นใช้พอร์ต `5000` การสร้างออเดอร์และพาสเป็นการจำลองเสมอ ไม่ต้องตั้งค่า PromptPay
