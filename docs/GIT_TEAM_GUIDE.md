# 🐙 คู่มือ Git สำหรับทีม 3 คน (ฉบับเข้าใจง่าย ใช้ได้จริง)

เพื่อให้ทีมทำงานพร้อมกันได้โดยโค้ดไม่ทับกัน และไม่เกิด Git Conflict ให้ทำตามขั้นตอนดังนี้:

---

## 1. การแบ่ง Branch ประจำตัวของแต่ละคน

| สมาชิก | หน้าที่ | ชื่อ Branch แนะนำ |
|---|---|---|
| **คน A** | Frontend UI & Components | `feature/frontend` |
| **คน B** | Backend Core, Database & Orders | `feature/backend-core` |
| **คน C** | Algorithms, Haversine, Missions & Points | `feature/logic-missions` |

---

## 2. ขั้นตอนเริ่มงานในแต่ละวัน (สำคัญมาก: ดึงโค้ดล่าสุดก่อนเสมอ)

ก่อนจะเริ่มพิมพ์โค้ดใหม่ ให้ดึงโค้ดล่าสุดจาก `master` เสมอ:
```bash
# 1. สลับไปกิ่งหลัก
git checkout master

# 2. ดึงโค้ดล่าสุดจากเพื่อน
git pull origin master

# 3. สลับกลับมากิ่งของตัวเอง แล้วรวมโค้ดใหม่เข้ามา
git checkout feature/frontend
git merge master
```

---

## 3. ขั้นตอนบันทึกงานและส่งขึ้น GitHub (Commit & Push)

เมื่อทำฟีเจอร์เสร็จ 1 ชิ้นเล็กๆ ให้บันทึกทันที:
```bash
# 1. ดูว่ามีไฟล์ไหนถูกแก้ไขบ้าง
git status

# 2. เพิ่มไฟล์ทั้งหมดเข้าคิวบันทึก
git add .

# 3. บันทึกพร้อมข้อความอธิบายสั้นๆ
git commit -m "feat: add checkin simulation button and confetti"

# 4. ส่งขึ้น GitHub
git push origin feature/frontend
```

---

## 4. รวมโค้ดเข้ากิ่งกลาง (Pull Request / Merge)

เมื่อฟีเจอร์ของตนเองทดสอบแล้วว่าผ่าน 100%:
1. เปิด GitHub และสร้าง **Pull Request (PR)** จาก `feature/frontend` เข้าสู่ `master`
2. ให้เพื่อนอีก 1 คนในทีมช่วยกด Review / Approve
3. กด **Merge Pull Request**

---

## 5. วิธีแก้ปัญหาเมื่อเกิด Git Conflict (โค้ดชนกัน)

หาก Git แจ้งเตือนว่า `CONFLICT (content): Merge conflict in ...`:
1. เปิดไฟล์ที่มีปัญหาใน VS Code / IDE
2. คุณจะเห็นเครื่องหมาย:
   ```text
   <<<<<<< HEAD (โค้ดปัจจุบันของคุณ)
   const price = 199;
   =======
   const price = 250;
   >>>>>>> master (โค้ดที่เพื่อนแก้มา)
   ```
3. ปรึกษากับเพื่อนว่าต้องใช้ค่าไหน ลบเครื่องหมาย `<<<<<<<`, `=======`, `>>>>>>>` ออกให้เหลือเฉพาะโค้ดที่ถูกต้อง
4. บันทึกไฟล์ แล้วรัน:
   ```bash
   git add .
   git commit -m "fix: resolve merge conflict in prices"
   git push origin <your-branch>
   ```
