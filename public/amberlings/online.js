/* AMBERLINGS ONLINE BETA — genuine Google OAuth and server-authoritative actions.
 * This operates separately from the 3D story/demo. Never serializes local game state
 * as a trusted server save. All resources are returned by amberlings-action.
 */
(function(){
'use strict';
const CFG=window.AWC_CONFIG||{};
const BASE=String(CFG.supabaseUrl||'').replace(/\/$/,'');
const API=BASE+'/functions/v1/amberlings-action';
const KEY=CFG.supabasePublishableKey||'';
const MAPS=['amberton','route1','mossgate','route2','tidehaven','route3','cave','mountain'];
const MAP_NAMES=['เมืองอัมเบอร์ตัน','ทางหลวง 1','เมืองมอสเกต','ชายฝั่ง','เมืองไทด์เฮเวน','ทางหลวง 3','ถ้ำวิญญาณ','ภูเขาอำพัน'];
const STARTERS=['embit','aquip','sproutle'];
const VIEWS=[['home','หน้าแรก'],['dex','สมุดมอน'],['team','ทีม / วิวัฒนาการ'],
 ['explore','สำรวจ'],['battle','ต่อสู้ / จับ'],['shop','ร้านค้า'],
 ['market','ตลาดผู้เล่น'],['account','บัญชี']];
const e=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nf=v=>Number(v||0).toLocaleString('en-US');
let hub=null,view='home',busy=false,notice='',client=null,model=null;
function button(label,action,params,kind){
 const args=params||{},attrs=Object.keys(args).map(k=>' data-'+k+'="'+e(args[k])+'"').join('');
 return '<button class="ab-btn '+(kind||'')+'" data-action="'+action+'"'+attrs+(busy?' disabled':'')+'>'+label+'</button>';
}
function icon(id){
 try {
  if(typeof monIcon==='function'&&SP&&SP[id]){
   return '<img class="ab-icon" src="'+e(monIcon(id,64))+'" alt="'+e(SP[id][0])+'">';
  }
 }catch(_){}
 return '<div class="ab-icon-fallback" role="img" aria-label="มอนสเตอร์">✦</div>';
}
function monCard(m,extra){
 const base=SP&&SP[m.speciesId],name=base?base[0]:m.speciesId;
 return '<div class="ab-mon">'+icon(m.speciesId)+'<div class="ab-grow"><b>'+e(name)+'</b>'+
 '<small>Lv.'+m.level+' · HP '+m.hp+'/'+m.maxHp+(m.shiny?' ★ SHINY':'')+'</small>'+
 '<small>ช่องทีม: '+(m.slot||'คลัง')+'</small></div>'+(extra||'')+'</div>';
}
async function sdk(){
 if(client)return client;
 if(!BASE||!KEY)throw Error('ยังไม่ตั้งค่า Supabase URL หรือ Publishable Key');
 let factory=window.supabase;
 if(!factory?.createClient) factory=await import('https://esm.sh/@supabase/supabase-js@2.57.0');
 client=factory.createClient(BASE,KEY,{auth:{persistSession:true,autoRefreshToken:true,
 detectSessionInUrl:true,flowType:'pkce'}});
 return client;
}
async function google(){
 const c=await sdk();
 const {error}=await c.auth.signInWithOAuth({
  provider:'google',options:{redirectTo:location.origin+location.pathname}
 });
 if(error)throw error;
}
async function api(action,payload){
 const c=await sdk();
 const {data:{session},error:sessionError}=await c.auth.getSession();
 if(sessionError||!session?.access_token)throw Error('กรุณาล็อกอิน Google ใหม่');
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),12000);
 let response;
 try{
  response=await fetch(API,{method:'POST',signal:ctl.signal,
   headers:{'Content-Type':'application/json','apikey':KEY,'Authorization':'Bearer '+session.access_token},
   body:JSON.stringify(Object.assign({action},payload||{}))});
 }finally{clearTimeout(timer)}
 let d;try{d=await response.json()}catch(_){throw Error('อ่านข้อมูลเซิร์ฟเวอร์ไม่ได้')}
 if(!response.ok||!d?.ok)throw Error(d?.error||'เซิร์ฟเวอร์ไม่สามารถทำรายการได้');
 model=d;
 return d;
}
async function restore(){
 if(new URLSearchParams(location.search).get('demo')==='1')return false;
 try{
  const c=await sdk(),{data:{session}}=await c.auth.getSession();
  if(!session||!session.user)return false;
  const u=session.user;
  Auth.set({mode:'google',id:u.id,name:String(u.user_metadata?.full_name||u.email||'ผู้เล่น').slice(0,16)});
  await api('bootstrap');
  return true;
 }catch(err){console.warn('Amberlings session restore failed',err);return false;}
}
function mount(){
 if(!hub){
  hub=document.createElement('div');hub.id='amberlings-online-hub';
  document.querySelector('#wrap').appendChild(hub);
  hub.addEventListener('click',async ev=>{
   const btn=ev.target.closest('[data-action]');if(!btn||busy)return;
   const a=btn.dataset.action;
   if(a==='view'){view=btn.dataset.view;draw();return;}
   if(a==='demo'){location.href=location.pathname+'?demo=1';return;}
   if(a==='google_logout'){await logout();return;}
   const payload={};
   if(a==='profile'){
    const name=prompt('ชื่อตัวละคร (2–20 ตัว)',model?.player?.name||'');
    if(name===null)return;
    Object.assign(payload,{name,gender:model?.player?.gender||'m',
      uniform:model?.player?.uniform||0,hair:model?.player?.hair||0,skin:model?.player?.skin||0});
   }
   if(a==='market_list'){
    const kind=btn.dataset.kind||'item',item=btn.dataset.item||null,monsterId=btn.dataset.monster||null;
    const price=Number(prompt('ราคาขายต่อชิ้น (1–100,000,000 เหรียญ)',String(kind==='monster'?1000:150)));
    if(!Number.isInteger(price)||price<1||price>100000000)return;
    Object.assign(payload,{kind,price,currency:'coins',qty:1});
    if(kind==='item')payload.item=item;else payload.monsterId=monsterId;
   }
   if(a==='party'){
    const slot=Number(prompt('ช่องทีม 1–6 หรือ 0 เพื่อเข้าคลัง','1'));
    if(!Number.isInteger(slot)||slot<0||slot>6)return;
    payload.monsterId=btn.dataset.monster;payload.slot=slot;
   }
   const actions={
    starter:()=>({speciesId:btn.dataset.species}),
    attack:()=>({move:Number(btn.dataset.move||0)}),
    capture:()=>({orb:btn.dataset.orb||'orb'}),
    shop_buy:()=>({item:btn.dataset.item,qty:Number(btn.dataset.qty||1)}),
    use_item:()=>({item:btn.dataset.item,monsterId:btn.dataset.monster}),
    evolve:()=>({monsterId:btn.dataset.monster}),
    travel:()=>({mapId:btn.dataset.map}),
    market_buy:()=>({listingId:btn.dataset.listing}),
    market_cancel:()=>({listingId:btn.dataset.listing}),
    profile:()=>payload,market_list:()=>payload,party:()=>payload
   };
   if(actions[a])Object.assign(payload,actions[a]());
   await doAction(a,payload);
  });
 }
 draw();
}
async function doAction(action,payload){
 busy=true;notice='กำลังตรวจสอบรายการบนเซิร์ฟเวอร์…';draw();
 try{
  const data=await api(action,payload);
  notice=data.message||'อัปเดตข้อมูลแล้ว';
  if(action==='explore'&&data.encounter)view='battle';
  if(action==='starter')view='team';
 }catch(err){
  notice='⚠ '+(err?.message||'การเชื่อมต่อขัดข้อง');
  console.warn('Amberlings online action rejected:',action,String(err));
 }finally{busy=false;draw();}
}
async function logout(){
 try{const c=await sdk();await c.auth.signOut()}catch(_){}
 try{localStorage.removeItem('amberlings_auth')}catch(_){}
 location.href=location.pathname;
}
function home(){
 const p=model?.player||{},mons=model?.monsters||[];
 let h='<div class="ab-hero"><h2>AMBERLINGS ONLINE</h2><p>โลกมอนสเตอร์ 3D ต้นฉบับ · Google Auth · ข้อมูลสำคัญอยู่บน Supabase</p>'+
 '<div class="ab-statrow"><span>🪙 '+nf(p.coins)+' เหรียญ</span><span>💎 '+nf(p.gems)+' เจม</span><span>🐾 '+mons.length+' มอน</span></div></div>';
 h+='<div class="ab-section"><h3>สถานะผู้เล่น</h3><p>'+e(p.name||'เทรนเนอร์')+
 ' · เมือง '+e(MAP_NAMES[MAPS.indexOf(p.mapId)]||p.mapId||'amberton')+
 ' · ชนะ '+nf(p.wins)+' · จับ '+nf(p.captures)+'</p>';
 if(!mons.length)h+='<h3>เลือกคู่หูตัวแรก</h3><div class="ab-starters">'+STARTERS.map(id=>'<div>'+icon(id)+'<b>'+e(SP[id][0])+'</b>'+button('เลือกตัวนี้','starter',{species:id},'primary')+'</div>').join('')+'</div>';
 else h+='<div class="ab-gridactions">'+button('ออกสำรวจ','view',{view:'explore'},'primary')+
 button('ดูทีมมอน','view',{view:'team'})+button('ตลาดซื้อขาย','view',{view:'market'})+
 button('🎁 รับรายวัน','daily',{},'primary')+'</div>';
 h+='</div><div class="ab-note">ออนไลน์ที่เปิดใช้ตอนนี้คือระบบบัญชี มอนสเตอร์ ต่อสู้ จับ ซื้อขาย และไอเทมซึ่งเซิร์ฟเวอร์ตรวจสอบทั้งหมด ส่วนเนื้อเรื่อง 3D ยิม กาชา และ PvP จากไฟล์ต้นฉบับยังอยู่ในโหมดทดลองออฟไลน์ ไม่ส่งค่าจากเครื่องเข้าเซิร์ฟเวอร์</div>';
 return h;
}
function dex(){
 const mons=model?.monsters||[],obtained=new Set(mons.map(m=>m.speciesId));
 return '<div class="ab-section"><h3>สมุดมอนสเตอร์ — 25 ชนิด</h3><div class="ab-grid">'+Object.keys(SP||{}).map(id=>
 '<div class="ab-dexcard '+(obtained.has(id)?'caught':'')+'">'+icon(id)+
 '<b>'+e(SP[id][0])+'</b><small>'+e(SP[id][1])+' · '+(obtained.has(id)?'จับแล้ว':'ยังไม่จับ')+'</small></div>').join('')+'</div></div>';
}
function team(){
 const mons=model?.monsters||[],items=model?.inventory||[];
 if(!mons.length)return '<div class="ab-section"><h3>ยังไม่มีมอนสเตอร์</h3>ไปเลือกคู่หูในหน้าแรกก่อน</div>';
 const potion=items.find(i=>i.item==='potion')?.qty||0;
 return '<div class="ab-section"><h3>ทีม / คลัง ('+mons.length+'/250)</h3><p>ช่องทีม 1–6 · ข้อมูลเลเวล/HP/ไอเทมอยู่บนเซิร์ฟเวอร์</p>'+
 mons.map(m=>monCard(m,
 '<div class="ab-actions">'+button('ช่องทีม','party',{monster:m.id})+
 (m.evolveTo?button('วิวัฒนาการ Lv.'+m.evolveLevel,'evolve',{monster:m.id},'primary'):'')+
 (m.hp<m.maxHp&&potion?button('ใช้ยา','use_item',{monster:m.id,item:'potion'}):'')+
 button('ฝากตลาด','market_list',{kind:'monster',monster:m.id})+'</div>'
 )).join('')+'</div>';
}
function explore(){
 const p=model?.player||{};
 return '<div class="ab-section"><h3>🌿 สำรวจโลกแอมเบอร์เรีย</h3>'+
 '<p>พื้นที่ที่เลือก: '+e(MAP_NAMES[MAPS.indexOf(p.mapId)]||p.mapId||'amberton')+
 ' · มอนป่า เลเวล และโอกาสพบ ถูกเลือกจากเซิร์ฟเวอร์</p>'+
 button('ค้นหามอนป่า','explore',{},'primary')+
 '<h3>แผนที่เดินทาง</h3><div class="ab-gridactions">'+MAPS.map((m,i)=>button(MAP_NAMES[i],'travel',{map:m})).join('')+
 '</div><small>พื้นที่ไกลต้องมีมอนอย่างน้อยเลเวล 12 ขึ้นไป</small></div>';
}
function battle(){
 const w=model?.encounter,mons=model?.monsters||[];
 if(!w)return '<div class="ab-section"><h3>ไม่มีคู่ต่อสู้</h3>'+button('ออกสำรวจ','view',{view:'explore'},'primary')+'</div>';
 const lead=mons.filter(m=>m.slot&&m.hp>0).sort((a,b)=>a.slot-b.slot)[0];
 return '<div class="ab-section"><h3>ต่อสู้กับมอนป่า</h3><div class="ab-enemy">'+icon(w.speciesId)+
 '<b>'+e(w.name)+' Lv.'+w.level+'</b><div class="ab-hp"><i style="width:'+
 Math.max(0,Math.min(100,Math.round(w.hp*100/w.maxHp)))+'%"></i></div> HP '+w.hp+'/'+w.maxHp+'</div>'+
 '<p>คู่หู: '+(lead?e(SP[lead.speciesId][0])+' · HP '+lead.hp+'/'+lead.maxHp:'ทุกตัวหมดแรง — ต้องรักษาก่อน')+'</p>'+
 '<div class="ab-gridactions">'+[0,1,2,3].map(i=>button(['จู่โจม','ท่าธาตุ','โจมตีหนัก','ท่าพิเศษ'][i],'attack',{move:i},'primary')).join('')+
 (model.inventory||[]).filter(x=>['orb','silver','gold'].includes(x.item)).map(x=>button('จับด้วย '+e(x.item)+' ('+x.qty+')','capture',{orb:x.item})).join('')+
 button('หนี','flee')+'</div></div>';
}
function shop(){
 const items=[['orb','ออร์บอำพัน',100],['silver','ออร์บเงิน',250],['gold','ออร์บทอง',600],
 ['potion','ยาฟื้นฟู',80],['super','ยาพิเศษ',200],['hyper','ยาสูงสุด',500],
 ['revive','ชุบชีวิต',800]];
 return '<div class="ab-section"><h3>ร้านค้าเซิร์ฟเวอร์</h3><p>ราคาคงที่ฝั่ง Supabase · ไม่รับราคาและจำนวนไอเทมจาก Chrome</p>'+
 items.map(x=>'<div class="ab-row"><span>'+e(x[1])+' · '+x[2]+' เหรียญ</span>'+
 button('ซื้อ 1','shop_buy',{item:x[0],qty:1},'primary')+
 button('ซื้อ 5','shop_buy',{item:x[0],qty:5})+'</div>').join('')+'</div>';
}
function market(){
 const listings=model?.listings||[],items=model?.inventory||[];
 let h='<div class="ab-section"><h3>ตลาดแลกเปลี่ยนจริง</h3><p>ส่งมอนและไอเทมเข้าระบบค้ำประกัน (Escrow) ก่อนขาย · หักค่าธรรมเนียม 5% · ห้ามซื้อของตัวเองหรือซื้อซ้ำ</p>'+
 '<h3>ฝากขายไอเทม</h3><div class="ab-gridactions">'+items.filter(i=>i.qty>0).map(i=>button('ฝาก '+e(i.name)+' ×1','market_list',{kind:'item',item:i.item})).join('')+'</div>'+
 '<h3>ประกาศขาย '+listings.length+' รายการ</h3>';
 if(!listings.length)h+='<p>ยังไม่มีผู้เล่นฝากขาย</p>';
 h+=listings.map(l=>'<div class="ab-row"><div><b>'+e(l.who)+'</b><small>'+
 (l.kind==='monster'?e(SP[l.monster?.speciesId]?.[0]||'มอนสเตอร์')+' Lv.'+(l.monster?.level||'?'):
 e(l.item)+' ×'+l.qty)+'</small><small>ราคา '+nf(l.price*l.qty)+' '+e(l.currency)+'</small></div>'+
 (l.mine?button('ถอนประกาศ','market_cancel',{listing:l.id}):
 button('ซื้อ','market_buy',{listing:l.id},'primary'))+'</div>').join('');
 return h+'</div>';
}
function account(){
 const p=model?.player||{};
 return '<div class="ab-section"><h3>บัญชี Google / โปรไฟล์</h3>'+
 '<p>'+e(p.name||'')+' · ชนะ '+nf(p.wins)+' · จับ '+nf(p.captures)+
 ' · เรตติ้ง '+nf(p.rating)+'</p>'+button('แก้ชื่อตัวละคร','profile')+
 button('รีเฟรชข้อมูล','state')+
 button('ออกจาก Google','google_logout',{},'danger')+
 '<h3>ผู้เล่นออนไลน์ / อันดับ</h3>'+
 (model?.leaderboard||[]).map((x,i)=>'<div class="ab-row"><b>#'+(i+1)+' '+e(x.name)+'</b><span>'+
 nf(x.wins)+' ชนะ · '+(x.online?'ออนไลน์':'ออฟไลน์')+'</span></div>').join('')+
 '<div class="ab-note">ระบบเพื่อน กิลด์ ดวล PvP และเนื้อเรื่อง 3D ยังไม่ใช่เซิร์ฟเวอร์-authoritative ในเวอร์ชันทดสอบนี้</div></div>';
}
const V={home,dex,team,explore,battle,shop,market,account};
function draw(){
 if(!hub)return;
 const name=e(model?.player?.name||'เทรนเนอร์');
 hub.innerHTML='<header class="ab-top"><div class="ab-brand">✦ AMBERLINGS <small>ONLINE BETA</small></div>'+
 '<div class="ab-account">'+name+'<span class="ab-online">● SERVER</span></div></header>'+
 '<nav class="ab-nav">'+VIEWS.map(v=>button(v[1],'view',{view:v[0]},view===v[0]?'active':'')).join('')+'</nav>'+
 '<div class="ab-content">'+(V[view]||home)()+
 (notice?'<div class="ab-notice">'+e(notice)+'</div>':'')+
 (busy?'<div class="ab-loading">กำลังบันทึกบนเซิร์ฟเวอร์…</div>':'')+
 '</div><footer class="ab-footer">'+button('🔄 รีเฟรช','state')+
 button('ทดลองเกม 3D ออฟไลน์','demo')+'</footer>';
}
window.AmberOnline={sdk,google,api,restore,mount,draw,
 get data(){return model},get authenticated(){return !!model},close(){if(hub){hub.remove();hub=null;}}};
})();
