# AMBER WORLD CLASS V0.2 — สถานะและขั้นตอนทำออนไลน์จริง

## ทำเสร็จแล้ว
- สร้าง Supabase Project ใหม่ ID: `uykldiwsjgctgvtuocxn` (Singapore) แยกจาก 55 AMBERLANDS
- Apply migration `awc_initial_server_authoritative_tables` ผ่าน Supabase connector แล้ว
- ตารางที่สร้าง: `awc_profiles`, `awc_characters`, `awc_inventory`, `awc_combat_audit`
- เปิด RLS ทุกตาราง และกำหนด SELECT เฉพาะข้อมูลของตัวเอง (รวมตารางลูก)
- `anon` และ `authenticated` ไม่มีสิทธิ์ INSERT/UPDATE/DELETE ของตารางเหล่านี้
- ผ่าน Security Advisor ไม่มีคำเตือนที่รายงาน ณ วันสร้าง
- `public/config.js` ชี้ Supabase URL + publishable key ของเกมใหม่แล้ว

## ยังไม่ได้ทำ — จำเป็นก่อนออนไลน์จริง
1. **สร้าง GitHub repository ใหม่** ชื่อ `amber-world-class` (แยกจาก `55amberlands.github.io` โดยเด็ดขาด) แล้วเพิ่มไฟล์จากชุด WEB ZIP ลง repo ใหม่ เปิด GitHub Pages
2. **ตั้ง Supabase Auth → Providers → Google** ใช้ OAuth Client ID/Secret ใน Dashboard (ห้ามใส่ใน GitHub). ตั้ง callback ตามที่ Supabase แสดง และตั้ง URL Configuration ให้เป็นเว็บใหม่
3. **Deploy dedicated Node server** จากโฟลเดอร์ `server/` ไปยังบริการที่รองรับ Node.js WebSocket ระยะยาว Google Cloud VM หรือบริการคล้ายกันได้; GitHub Pages ไม่สามารถรัน server นี้ได้
4. ตั้ง environment บนเซิร์ฟเวอร์ `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ALLOWED_ORIGINS`, `PORT`. นำ secret role key ใหม่จาก Dashboard ใส่ใน environment ของเซิร์ฟเวอร์เท่านั้น **ห้ามส่งผ่านแชท**
5. เมื่อ server มี URL `wss://...` แล้วใส่ลง `public/config.js` ค่า `gameServerWebSocketUrl` จากนั้น deploy หน้าเว็บใหม่
6. ทดสอบ Google Login → Online → movement → combat → persist/reconnect → RLS tamper → rate limit → session conflict → DB consistency ก่อนเปิดให้คนอื่นเล่น

## สำคัญ
- V0.2 ยังเป็นเดโมออฟไลน์ถ้ายังไม่ได้ตั้งค่าเซิร์ฟเวอร์เกม; การมี URL Supabase เพียงอย่างเดียวไม่ได้ทำให้ผู้เล่นออนไลน์
- **ห้ามเปิด public production** จาก prototype นี้จนกว่าจะทำธุรกรรมรางวัลแบบ atomic, ทดสอบ server reconnection และป้องกันบั๊กไอเทมซ้ำ
- ข้อมูล `localStorage` ในโหมดออฟไลน์แก้ไขได้ จึงไม่ควรเชื่อมต่อกับฐานข้อมูลโปรเกรสออนไลน์
- ไม่แตะไฟล์/Repository/Supabase ของ 55 AMBERLANDS