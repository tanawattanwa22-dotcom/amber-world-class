# AMBERLINGS ONLINE — เว็บไซต์ฟรีจาก Google Firebase Hosting

ใช้ **Google Cloud/Firebase Hosting + Supabase + GitHub** เท่านั้น ไม่ใช้ Cloudflare
และไม่แตะโปรเจกต์ 55 AMBERLANDS

## โครงสร้างเดิม
- GitHub: https://github.com/tanawattanwa22-dotcom/amber-world-class
- โฟลเดอร์เกมที่ปล่อยขึ้นเว็บ: `public/`
- หน้าเกม: `public/amberlings/index.html`
- เกมออนไลน์/ล็อกอิน/Supabase: ใช้โปรเจกต์เดิม `uykldiwsjgctgvtuocxn` ไม่ย้ายข้อมูล
- เว็บ GitHub Pages เก่ายังคงใช้ได้ระหว่างเปลี่ยน URL

## สร้างชื่อเว็บไซต์เกมบน Google (ทำบนมือถือได้)
1. เปิด https://console.firebase.google.com/ โดยใช้บัญชี Google ที่ต้องการ
2. Create project / เพิ่มโปรเจกต์ ตั้ง Display name = `AMBERLINGS ONLINE`
3. เลือก Project ID = `amberlings-online` **ถ้ายังว่าง** (ชื่ออาจมีคนใช้ไปแล้ว);
   Firebase จะสร้าง URL `https://PROJECT_ID.web.app` และ `https://PROJECT_ID.firebaseapp.com`
4. ไม่จำเป็นต้องเปิด Firebase Authentication หรือ Firebase Firestore เพราะเกมใช้
   **Supabase Auth + Supabase Database** อยู่แล้ว
5. หลังสร้างโปรเจกต์ ไปที่ Build > Hosting และเปิดใช้งาน Hosting

## Deploy จาก Repository เดิม ด้วย Codespaces (Chrome Android)
- เปิด Codespaces ของ `amber-world-class`, เปิด Terminal
- ติดตั้ง/เข้าสู่ระบบ Firebase CLI (ใส่โค้ดอนุญาตด้วยบัญชี Google ที่เป็นเจ้าของ Firebase Project):

```bash
npm install -g firebase-tools
firebase login --no-localhost
```

- Deploy **เฉพาะ Hosting** โดยแทน `PROJECT_ID` ด้วยรหัสโปรเจกต์จาก Firebase Console:

```bash
firebase deploy --only hosting --project PROJECT_ID
```

- ถ้าต้องการให้ GitHub Push แล้ว Deploy ไป Firebase อัตโนมัติ ให้รัน
  `firebase init hosting:github` หลัง Deploy ครั้งแรก และทำตามหน้าจอ
  เพื่ออนุญาต GitHub และสร้าง Deploy Service Account/Secret โดยระบบ ไม่ควรนำ
  Service Account Key ใส่ GitHub โค้ดสาธารณะ

ไฟล์ `firebase.json` ตั้ง `public` เป็น Hosting root และเปลี่ยนจาก
`/` ไป `/amberlings/` เมื่อเปิดโดเมนหลัก; ไม่สร้างข้อมูล Guest หรือเซิร์ฟเวอร์ใหม่

## ทำ Google Login หลังมีชื่อโดเมนจริง
1. Supabase Auth > URL Configuration: Site URL/Redirect URLs
   `https://PROJECT_ID.web.app/amberlings/`
2. Google Cloud OAuth Client (Web):
   Authorized JavaScript origins = `https://PROJECT_ID.web.app`
   Authorized redirect URIs = `https://uykldiwsjgctgvtuocxn.supabase.co/auth/v1/callback`
3. Supabase Auth > Google provider: ใส่ Client ID และ Client Secret (เก็บ Secret
   เฉพาะใน Supabase; อย่านำขึ้น GitHub/ส่งแชท)
4. Supabase Edge Function `amberlings-action`: เพิ่ม `https://PROJECT_ID.web.app`
   เป็น allowed Origin เพื่อให้เล่นผ่านชื่อโดเมนใหม่ได้
5. ทดสอบล็อกอินด้วยบัญชีจริงและ PvP สองผู้เล่น ก่อนประกาศเปิดเกม

เอกสาร Google: https://firebase.google.com/docs/hosting/quickstart
และ https://firebase.google.com/docs/hosting/github-integration
