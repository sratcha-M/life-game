# เชื่อมฐานข้อมูล + login (Firebase แผน Spark ฟรี ไม่ต้องใช้บัตร)

1. ไปที่ https://console.firebase.google.com → **Add project** (ปิด Google Analytics ได้)
2. **Build › Authentication › Get started › Sign-in method** → เปิด **Email/Password**
3. **Build › Firestore Database › Create database** → เลือก production mode, ภูมิภาค `asia-southeast1` (สิงคโปร์)
4. แท็บ **Rules** → วางเนื้อหาไฟล์ `firestore.rules` แล้วกด **Publish**
5. **Project settings (⚙️) › General › Your apps › Web (</>)** → ตั้งชื่อแอป → คัดลอกค่า `apiKey`, `authDomain`, `projectId`, `appId`
6. คัดลอก `.env.example` เป็น `.env.local` แล้วใส่ 4 ค่านี้ (เป็นค่าสาธารณะของเว็บแอป ไม่ใช่รหัสลับ)

## ขึ้นเว็บ (ฟรี) — login ใช้ได้เฉพาะบนเว็บที่มีโดเมน (ไม่ใช่ไฟล์ในเครื่อง)
- **Firebase Hosting**: `npm i -g firebase-tools` → `firebase login` → `firebase use --add` (เลือกโปรเจกต์) → `npm run deploy`
  ได้เว็บ `https://<project-id>.web.app` (โดเมนนี้อนุญาตให้ login อัตโนมัติ)
- **Netlify Drop**: `npm run build` → ลากโฟลเดอร์ `dist` ไปที่ https://app.netlify.com/drop
  แล้วเพิ่มโดเมนที่ได้ใน **Authentication › Settings › Authorized domains**

## ข้อมูลที่เก็บ
`users/{uid}` (อีเมล ชื่อ เวลาเข้าเล่นล่าสุด) และ `users/{uid}/kv/{คีย์}` = เซฟเกม อัลบั้มชีวิต ฉากจบ ถ้วย ความลับ ฯลฯ
แต่ละคนอ่าน/เขียนได้เฉพาะของตัวเอง (กฎใน `firestore.rules`) · ไม่ login ก็เล่นได้ ข้อมูลอยู่ในเครื่องเหมือนเดิม และจะถูกรวมขึ้นคลาวด์ตอน login ครั้งแรก

## 📊 สถิติการเล่น + ความเห็นผู้เล่น (src/lib/telemetry.ts)
ส่งแบบไม่ระบุตัวตน (ไม่มีชื่อ/อีเมล มีแค่รหัสสุ่มประจำเครื่อง) · เว็บเขียนได้อย่างเดียว อ่านไม่ได้ · ตอน `npm run dev` ไม่ส่ง (ตั้ง `VITE_TELEMETRY_DEV=1` ถ้าอยากทดสอบ)
- `plays` — `type: start` (เริ่ม/เล่นต่อ), `end` (ฉากจบ อายุ ความฝันสำเร็จไหม ไพ่ อาชีพ เงิน จำนวนครั้งหมดตัว เวลาเล่น), `quit` (เลิกกลางคันที่ฉากไหน อายุเท่าไร — `how: menu` กดกลับหน้าแรก / `closed` ปิดเว็บ)
- `feedback` — `fun` 1–5, `fair` (fair/confused/unfair), `again`, `text`
- ทุกเอกสารมี `v` = เวอร์ชันสมดุลเกม (`BALANCE` ใน telemetry.ts) → **เปลี่ยนค่านี้ทุกครั้งที่ปรับสมดุล** จะได้แยกข้อมูลก่อน/หลังได้
- ดูข้อมูล: Firebase Console › Firestore Database › `plays` / `feedback`
- ต้อง deploy กฎใหม่ก่อน ไม่งั้นส่งไม่ผ่าน: `npm run deploy` (หรือ `firebase deploy --only firestore:rules`)
