/* AMBERLINGS ONLINE: real account-only gate. Supabase OAuth and email/password. */
(()=>{'use strict';const box=document.getElementById('login'),f=document.getElementById('login-form');
const email=document.getElementById('email'),pass=document.getElementById('password'),tip=document.getElementById('auth-feedback');
let api=null,entering=false;const message=t=>tip.textContent=String(t||'').slice(0,350);
const lock=x=>box.querySelectorAll('button').forEach(b=>b.disabled=x);
const fail=e=>/email not confirmed/i.test(e?.message)?'ต้องยืนยันอีเมลจากจดหมายก่อน':
/invalid login credentials/i.test(e?.message)?'อีเมลหรือรหัสผ่านไม่ถูกต้อง':
/provider is not enabled/i.test(e?.message)?'Google ยังไม่เปิดใช้งานใน Supabase':String(e?.message||e);
const show=t=>{box.hidden=false;message(t||'เข้าสู่ระบบเพื่อเล่นออนไลน์');};
async function enter(){if(entering)return;entering=true;lock(true);message('กำลังตรวจสอบบัญชีและโหลดตัวละคร…');
try{if(!await AmberOnline.restore())throw Error('ไม่พบเซสชันที่ใช้งานได้ หรือโหลดเซิร์ฟเวอร์ไม่สำเร็จ');
box.hidden=true;AmberOnline.mount();}
catch(e){show('เข้าสู่เกมไม่ได้: '+fail(e));}finally{entering=false;lock(false);}}
f.addEventListener('submit',async ev=>{ev.preventDefault();lock(true);message('กำลังเข้าสู่ระบบ…');
try{const {data,error}=await api.auth.signInWithPassword({email:email.value.trim(),password:pass.value});
if(error)throw error;if(!data.session)throw Error('ไม่พบเซสชันจาก Supabase');await enter();}
catch(e){message('ล็อกอินไม่สำเร็จ: '+fail(e));}finally{lock(false);}});
document.getElementById('sign-up').onclick=async()=>{if(!email.value.trim()||pass.value.length<6){message('ใส่อีเมลและรหัสผ่านอย่างน้อย 6 ตัวอักษร');return;}
lock(true);message('กำลังสร้างบัญชีจริง…');
try{const {data,error}=await api.auth.signUp({email:email.value.trim(),password:pass.value,options:{emailRedirectTo:location.origin+location.pathname}});
if(error)throw error;if(data.session){await enter();return;}
message('สมัครแล้ว โปรดตรวจอีเมลเพื่อยืนยันบัญชี (รวมกล่อง Spam) แล้วกลับมาล็อกอิน');}
catch(e){message('สมัครไม่ได้: '+fail(e));}finally{lock(false);}};
document.getElementById('sign-google').onclick=async()=>{lock(true);message('กำลังเข้าสู่ Google OAuth…');
try{const {error}=await api.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname}});
if(error)throw error;}catch(e){message('Google Login: '+fail(e));lock(false);}};
document.getElementById('reset-password').onclick=async()=>{if(!email.value.trim()){message('กรอกอีเมลเพื่อรับลิงก์กู้รหัสผ่าน');return;}
lock(true);try{const {error}=await api.auth.resetPasswordForEmail(email.value.trim(),{redirectTo:location.origin+location.pathname});
if(error)throw error;message('ระบบส่งลิงก์กู้รหัสผ่านแล้ว หากอีเมลมีบัญชีอยู่');}
catch(e){message('ส่งลิงก์ไม่ได้: '+fail(e));}finally{lock(false);}};
async function boot(){AmberScene.init();
const url=new URLSearchParams(location.search),authErr=url.get('error_description');
try{api=await AmberOnline.sdk();
api.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT')show('ออกจากระบบแล้ว');
if(event==='PASSWORD_RECOVERY'&&session){Promise.resolve().then(async()=>{
const password=prompt('รหัสผ่านใหม่อย่างน้อย 6 ตัวอักษร');
if(!password||password.length<6)return;const {error}=await api.auth.updateUser({password});
if(error)message('เปลี่ยนรหัสผ่านไม่ได้: '+fail(error));else{message('เปลี่ยนรหัสผ่านสำเร็จ');await enter();}
});}});
const {data:{session},error}=await api.auth.getSession();if(error)throw error;
if(session?.access_token)await enter();else show(authErr||'เข้าสู่ระบบด้วยบัญชีจริงเพื่อเริ่มเล่น');}
catch(e){show('เชื่อมต่อ Supabase ไม่ได้: '+fail(e));}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();