/* MONSTER WORLD ONLINE - separate creature game from Amber World Class V0.9.
   All online rewards, level changes, catches and encounters computed by Supabase RPC. */
'use strict';
const CONFIG=window.AWC_CONFIG||{};
const BASE=(CONFIG.supabaseUrl||'').replace(/\/$/,'');
const KEY=CONFIG.supabasePublishableKey||'';
const URL=BASE+'/functions/v1/awc-pets';
const FAMILIES=[
 ['เพลิงจิ้ง','🦊','fire'],['หยดน้ำ','🐟','water'],['ใบเมียว','🐈','grass'],
 ['สายฟ้าจิ๋ว','🐿️','electric'],['หิมะปุย','🐧','ice'],['เงาเหมียว','🐈‍⬛','dark'],
 ['แสงกวาง','🦌','light'],['หินป้อม','🐢','earth'],['วายุปีก','🦅','wind'],
 ['คริสตัล','🦎','crystal'],['ลาวาเต่า','🐲','fire'],['บัวธาร','🦭','water'],
 ['หนามกระรอก','🐰','grass'],['เมฆสายฟ้า','🦇','electric'],['น้ำแข็งโบ','🐺','ice'],
 ['จันทร์หมาป่า','🐾','dark'],['สุริยานก','🦢','light'],['ภูผากบ','🐸','earth'],
 ['พายุปลา','🦋','wind'],['แก้วมังกร','🐉','crystal'],['ไฟสิงโต','🦁','fire'],
 ['ทะเลวาฬ','🐳','water'],['พฤกษากวาง','🦒','grass'],['เวทดารา','🦄','arcane'],
 ['ราชันแสง','🐯','light']
];
const TYPE={
 fire:['ไฟ','#ff8049','#de3052','🔥'],water:['น้ำ','#66e5f8','#2689d7','💧'],
 grass:['พฤกษา','#9ee36e','#3f9f73','🌿'],electric:['สายฟ้า','#ffe685','#ec912d','⚡'],
 ice:['น้ำแข็ง','#d1faff','#64aee9','❄️'],dark:['ความมืด','#c4a4ff','#654599','🌙'],
 light:['แสง','#fff5a5','#d9a65d','☀️'],earth:['ผืนดิน','#d8b28c','#98613d','🪨'],
 wind:['ลม','#c3f8df','#60bdb5','🌪️'],crystal:['คริสตัล','#d4b8ff','#875ddd','💎'],
 arcane:['เวทมนตร์','#f6c3f5','#a455b8','✨']
};
const RARITY=['','ธรรมดา','หายาก','มหากาพย์','ตำนาน'];
const SUFFIX=['น้อย','ว่องไว','จ้าว','ตำนาน'];
const EVOLVL=[0,12,28,48];
const AREA=[
 ['หมู่บ้านรุ่งอรุณ','🌸',1,'สวนดอกไม้และสัตว์เริ่มต้น'],
 ['ป่าประกายดาว','🌲',7,'สัตว์พฤกษาและแมลงเรืองแสง'],
 ['ชายฝั่งไข่มุก','🏝️',13,'สัตว์น้ำและเกาะเปลือกหอย'],
 ['หุบเขาสายฟ้า','⚡',19,'อสูรพายุและไฟฟ้า'],
 ['ทะเลทรายบุษราคัม','🏜️',25,'สัตว์ดินและเพลิง'],
 ['ภูเขาหิมะเรืองแสง','🏔️',31,'สัตว์น้ำแข็งหายาก'],
 ['ป้อมวิญญาณ','🌙',37,'สัตว์เงาและพลังเวท'],
 ['ทะเลเมฆ','☁️',43,'สัตว์สายลมและแสง'],
 ['ถ้ำคริสตัล','💎',49,'สัตว์มหากาพย์'],
 ['ปราสาทดวงดาว','🏰',55,'สัตว์ระดับตำนาน']
];
const MENU=[
 ['home','🏡','หน้าแรก'],['dex','📖','สมุดสัตว์ 100'],['team','🐾','ทีมสัตว์'],
 ['explore','🌎','สำรวจ'],['battle','⚔️','ต่อสู้ / จับ'],['evolve','✨','วิวัฒนาการ'],
 ['map','🗺️','แผนที่'],['bag','🎒','กระเป๋า'],['shop','🛒','ร้านค้า'],
 ['quests','📜','ภารกิจ'],['social','🏆','ออนไลน์'],['profile','⚙️','บัญชี']
];
function sceneStyle(i){
 const a=Math.max(0,Math.min(9,Number(i)||0));
 return ' style="background-image:url(./areas-10.svg?v=1);background-size:500% 200%;background-position:'+((a%5)/4*100)+'% '+(Math.floor(a/5)*100)+'%"';
}
const species=Array.from({length:100},(_,i)=>{
 const f=Math.floor(i/4),stage=i%4,a=FAMILIES[f],rarity=f>=23?4:f>=18?3:f>=10?2:1;
 return {id:i+1,family:f,stage,name:a[0]+SUFFIX[stage],emoji:a[1],type:a[2],rarity,
 hp:45+stage*26+(f%5)*6,atk:10+stage*9+(f%7)*2,def:8+stage*7+(f%6)*2,
 evo:EVOLVL[stage]};
});
let view='home',selectedId=1,selectedPet=null,typeFilter='all',searchText='',mode='demo',client=null,busy=false;
function initial(){return {player:{name:'นักสำรวจ',coins:1600,gems:50,balls:15,potions:5,area:0,captures:0,wins:0,xp:0,dailyClaim:null},
 pets:[],wild:null,leaderboard:[],journal:[]};}
let state=initial();
try{const v=JSON.parse(localStorage.getItem('monster-world-demo-v1')||'null');if(v&&v.player&&Array.isArray(v.pets))state=v;}catch(_){}
const $=id=>document.getElementById(id);
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const fmt=n=>Number(n||0).toLocaleString('en-US');
const info=id=>species[(Number(id)||1)-1]||species[0];
const levelMax=()=>Math.max(1,...(state.pets||[]).map(p=>p.level||1));
const lead=()=>((state.pets||[]).filter(p=>p.slot!=null&&p.hp>0).sort((a,b)=>a.slot-b.slot)[0])||null;
const seen=()=>new Set((state.pets||[]).map(p=>p.speciesId));
function vis(id,sz='normal',locked=false){
 const m=info(id),c=TYPE[m.type],k=Math.max(0,Math.min(99,m.id-1));
 const x=((k%10)/9*100).toFixed(4),y=(Math.floor(k/10)/9*100).toFixed(4);
 const mark=['✧','✦','⚡','👑'][m.stage];
 return '<div class="pet-visual '+(sz==='normal'?'':sz)+(locked?' locked':'')+'" data-mark="'+mark+'" style="--c1:'+c[1]+';--c2:'+c[2]+'"><span class="creature-sprite" role="img" aria-label="'+safe(m.name)+'" style="background-position:'+x+'% '+y+'%"></span></div>';
}
function tag(id){const m=info(id),t=TYPE[m.type];return '<span class="badge">'+t[3]+' '+t[0]+'</span> <span class="badge '+(m.rarity>=3?'gold':'')+'">'+RARITY[m.rarity]+'</span>';}
function btn(t,a,arg='',cls='blue'){return '<button class="btn '+cls+'" data-act="'+a+'"'+(arg!==''?' data-val="'+safe(arg)+'"':'')+'>'+t+'</button>';}
function toast(message){const el=document.createElement('div');el.className='toast';el.textContent=message;$('toast').replaceChildren(el);setTimeout(()=>{if(el.isConnected)el.remove()},2800);}
function persist(){if(mode==='demo')try{localStorage.setItem('monster-world-demo-v1',JSON.stringify(state))}catch(_){}}
function nav(){let a='';for(const [id,icon,label] of MENU){a+='<button data-view="'+id+'" class="'+(id===view?'active':'')+'">'+icon+' '+label+'</button>'}
 $('sidebar').innerHTML=a;let b='';
 for(const id of ['home','dex','team','explore','battle','profile']){const x=MENU.find(m=>m[0]===id);b+='<button data-view="'+id+'" class="'+(view===id?'active':'')+'"><span>'+x[1]+'</span>'+x[2]+'</button>'}
 $('bottom').innerHTML=b;
}
function updateTop(){
 const p=state.player||{};
 $('trainer').innerHTML=safe(p.name)+'<small style="display:block;color:#9ebedf">เลเวลทีม · '+levelMax()+'</small>';
 $('coins').textContent=fmt(p.coins);$('balls').textContent=fmt(p.balls);
 $('net-status').textContent=mode==='online'?'● ONLINE · SERVER':'● DEMO OFFLINE';
 $('net-status').style.color=mode==='online'?'#75ffa8':'#ffdf90';
}
function starterPanel(){
 return '<div class="panel"><h2>🌟 เลือกเพื่อนตัวแรก</h2><p class="subtitle">เลือกสัตว์เริ่มต้น 1 ใน 3 ตัว เมื่อเล่นออนไลน์เซิร์ฟเวอร์จะบันทึกถาวร และเลือกใหม่ไม่ได้</p><div class="cards">'+[1,5,9].map(id=>{
  const m=info(id);return '<button class="pet-card" data-act="starter" data-val="'+id+'">'+vis(id)+'<div class="name">'+safe(m.name)+'</div><div class="stats">'+tag(id)+'</div></button>';
 }).join('')+'</div></div>';
}
function home(){
 const p=state.player,m=lead(),a=AREA[p.area||0];let h='<h1>🌈 MONSTER WORLD ONLINE</h1><p class="subtitle">100 สัตว์แฟนตาซี · 25 สายวิวัฒนาการ · 10 ดินแดน · จับสัตว์ ต่อสู้ เก็บสะสม และจัดทีมออนไลน์</p>';
 h+='<section class="scene has-area-art"'+sceneStyle(p.area||0)+'><div class="scene-content"><div class="scene-copy"><div class="badge gold">🌤 '+safe(a[0])+' · '+safe(a[1])+'</div><div class="scene-title">การผจญภัย<br>เริ่มที่นี่!</div><p>ตามหาสัตว์หายาก ฝึกทีมให้เก่ง และวิวัฒนาการเป็นร่างตำนาน</p>'+btn('🌿 ออกสำรวจ','explore','', 'blue')+'</div><div class="pet-stage">'+vis(m?m.speciesId:1,'big')+'</div></div></section>';
 if(!(state.pets||[]).length)h+=starterPanel();
 h+='<div class="panels"><div class="panel"><h2>🎯 ภารกิจวันนี้</h2><div class="info-row"><span>จับสัตว์ที่พบ</span><b>'+fmt(p.captures)+'/100</b></div><div class="meter"><i style="width:'+Math.min(100,p.captures)+'%"></i></div><div class="info-row"><span>ชนะการต่อสู้</span><b>'+fmt(p.wins)+' ครั้ง</b></div><div class="actions">'+btn('🎁 รับของรายวัน','daily')+btn('📜 เควสต์','goto','quests','ghost')+'</div></div>';
 h+='<div class="panel"><h2>🐾 ทีมของฉัน</h2>'+(state.pets||[]).filter(x=>x.slot!=null).sort((a,b)=>a.slot-b.slot).map(x=>'<div class="list-row">'+vis(x.speciesId,'tiny')+'<div class="grow"><strong>'+safe(info(x.speciesId).name)+'</strong><small>Lv.'+x.level+' · HP '+x.hp+'/'+x.maxHp+'</small></div></div>').join('')+'<div class="actions">'+btn('ดูทีม','goto','team','ghost')+'</div></div></div>';
 return h;
}
function dex(){
 const owned=seen();let h='<div class="menu-heading"><div><h1>📖 สมุดมอนสเตอร์ 100 ชนิด</h1><p class="subtitle">ทั้งหมด 25 ครอบครัว × 4 ร่าง · รู้จักสัตว์ตามธาตุและระดับความหายาก</p></div><span class="badge gold">'+owned.size+'/100</span></div>';
 h+='<div class="panel"><input id="dex-search" class="auth-input" placeholder="🔎 ค้นหาชื่อหรือหมายเลข" value="'+safe(searchText)+'"><div class="filters">';
 for(const [id,label] of [['all','ทั้งหมด'],...Object.entries(TYPE).map(([k,v])=>[k,v[3]+' '+v[0]])])h+='<button data-type="'+id+'" class="'+(typeFilter===id?'active':'')+'">'+label+'</button>';
 h+='</div><div class="grid100">';
 for(const m of species){if(typeFilter!=='all'&&m.type!==typeFilter)continue;if(searchText&&!m.name.includes(searchText)&&!String(m.id).includes(searchText))continue;
 h+='<button class="pet-card" data-select="'+m.id+'">'+vis(m.id,'normal',!owned.has(m.id))+'<div class="name">#'+String(m.id).padStart(3,'0')+' '+safe(m.name)+'</div><div class="stats">'+TYPE[m.type][3]+' '+RARITY[m.rarity]+' · ร่าง '+(m.stage+1)+'</div></button>';
 }h+='</div></div>';return h;
}
function petDetail(){
 const m=info(selectedId),have=(state.pets||[]).filter(x=>x.speciesId===m.id);
 let h='<div class="menu-heading"><h1>✨ #'+String(m.id).padStart(3,'0')+' '+safe(m.name)+'</h1>'+btn('← กลับสมุด','goto','dex','ghost')+'</div><div class="panels"><div class="panel">'+vis(m.id,'big')+'<div class="info-row">'+tag(m.id)+'</div><h2>ค่าพลังพื้นฐาน</h2>';
 for(const [name,num] of [['HP',m.hp],['ATK',m.atk],['DEF',m.def],['Speed',12+m.stage*7+(m.family%4)*3]])h+='<div class="info-row"><span>'+name+'</span><b>'+num+'</b></div>';
 h+='</div><div class="panel"><h2>สายวิวัฒนาการ</h2>'+evoChain(m.family)+'<p class="subtitle">ร่างที่ 2 / 3 / 4 ต้องเลเวล 12 / 28 / 48 ตามลำดับ</p><h3>มีในคลัง: '+have.length+' ตัว</h3>';
 h+=have.map(x=>'<div class="list-row">'+vis(x.speciesId,'tiny')+'<div class="grow"><strong>Lv.'+x.level+'</strong><small>HP '+x.hp+'/'+x.maxHp+'</small></div>'+btn('จัดทีม','pick',x.id,'ghost')+'</div>').join('');
 return h+'</div></div>';
}
function evoChain(f){
 return '<div class="evo-chain">'+[0,1,2,3].map(st=>'<div class="stage">'+vis(f*4+st+1)+'<small>'+safe(info(f*4+st+1).name)+'</small><div class="badge">Lv.'+EVOLVL[st]+'</div></div>'+ (st<3?'<span class="arrow">➜</span>':'')).join('')+'</div>';
}
function team(){
 const arr=(state.pets||[]),team=arr.filter(p=>p.slot!=null).sort((a,b)=>a.slot-b.slot);
 let h='<h1>🐾 ทีมสัตว์ของฉัน (6 ช่อง)</h1><p class="subtitle">สัตว์ในทีมใช้ต่อสู้ได้ตามลำดับช่อง · เก็บได้สูงสุด 300 ตัวในคลัง</p>';
 if(!arr.length)return h+starterPanel();
 h+='<div class="panel"><h2>ทีมหลัก · '+team.length+'/6</h2><div class="cards">';
 for(let sl=1;sl<=6;sl++){const x=team.find(p=>p.slot===sl);h+=x?'<button class="pet-card" data-pet="'+x.id+'">'+vis(x.speciesId)+'<div class="name">'+sl+'. '+safe(info(x.speciesId).name)+'</div><div class="stats">Lv.'+x.level+' · HP '+x.hp+'/'+x.maxHp+'</div></button>':
 '<div class="pet-card" style="display:grid;place-items:center;min-height:155px"><span>➕<br>ช่อง '+sl+'</span></div>';}
 h+='</div><div class="actions">'+btn('🧪 ฟื้นฟูทีม (ใช้ยา 1)','heal')+'</div></div>';
 h+='<div class="panel" style="margin-top:12px"><h2>คลังสัตว์ · '+arr.length+'/300</h2>';
 h+=arr.map(x=>'<div class="list-row">'+vis(x.speciesId,'tiny')+'<div class="grow"><strong>'+safe(info(x.speciesId).name)+' · Lv.'+x.level+'</strong><small>HP '+x.hp+'/'+x.maxHp+' · '+(x.slot?'ช่อง '+x.slot:'เก็บในคลัง')+'</small></div>'+btn('รายละเอียด','pick',x.id,'ghost')+'</div>').join('');
 return h+'</div>';
}
function petPage(){
 const x=(state.pets||[]).find(p=>String(p.id)===String(selectedPet));
 if(!x)return team();
 const m=info(x.speciesId);
 let h='<div class="menu-heading"><h1>🐾 '+safe(m.name)+' · Lv.'+x.level+'</h1>'+btn('กลับทีม','goto','team','ghost')+'</div>';
 h+='<div class="panels"><div class="panel">'+vis(m.id,'big')+'<p>'+tag(m.id)+'</p><div class="info-row"><b>HP</b>'+x.hp+'/'+x.maxHp+'</div><div class="meter"><i style="width:'+(100*x.hp/x.maxHp)+'%"></i></div><div class="info-row"><span>ATK</span><b>'+x.atk+'</b></div><div class="info-row"><span>DEF</span><b>'+x.def+'</b></div><div class="info-row"><span>EXP</span><b>'+x.exp+'/'+(x.level*30)+'</b></div></div>';
 h+='<div class="panel"><h2>🧬 พัฒนาร่าง</h2>'+evoChain(m.family);
 if(m.stage<3)h+='<p class="subtitle">ต้องมี Lv.'+EVOLVL[m.stage+1]+' ขึ้นไปเพื่อเปลี่ยนเป็น '+safe(info(m.id+1).name)+'</p>'+btn('✨ วิวัฒนาการตอนนี้','evolve',x.id,x.level>=EVOLVL[m.stage+1]?'':'ghost');
 else h+='<p class="subtitle">วิวัฒนาการถึงร่างสูงสุดแล้ว</p>';
 h+='<h3 style="margin-top:20px">จัดทีม</h3><div class="actions">';
 for(let i=1;i<=6;i++)h+=btn('ช่อง '+i,'team',x.id+':'+i,'ghost');
 h+=btn('เก็บเข้าคลัง','team',x.id+':0','red')+'</div></div></div>';return h;
}
function explore(){
 const a=AREA[state.player.area],wild=state.wild;
 let h='<h1>🌎 สำรวจ '+safe(a[0])+'</h1><p class="subtitle">'+safe(a[3])+' · ความยาก Lv.'+a[2]+'–'+(a[2]+9)+'</p>';
 h+='<div class="scene has-area-art"'+sceneStyle(p.area||0)+'><div class="scene-content"><div class="scene-copy"><div class="scene-title">'+a[1]+' '+safe(a[0])+'</div><p>เลือกสำรวจเพื่อค้นหาสัตว์ป่า ความหายากขึ้นอยู่กับพื้นที่และโอกาสของเซิร์ฟเวอร์</p>';
 h+=wild?btn('⚔️ เข้าสู่การต่อสู้','goto','battle'):btn('🔍 ค้นหาสัตว์ป่า','explore');
 h+='</div><div class="pet-stage">'+vis(wild?wild.speciesId:9,'big')+'</div></div></div>';
 h+='<div class="panels"><div class="panel"><h2>🎯 ตัวเลือกสำรวจ</h2><div class="actions">'+btn('🔍 เดินสำรวจ','explore')+btn('🗺️ เปลี่ยนพื้นที่','goto','map','ghost')+btn('⚔️ สู้ / จับ','goto','battle','ghost')+'</div></div><div class="panel"><h2>📊 ระดับความหายาก</h2><div class="info-row">ธรรมดา <span>★</span></div><div class="info-row">หายาก <span>★★</span></div><div class="info-row">มหากาพย์ <span>★★★</span></div><div class="info-row">ตำนาน <span>★★★★</span></div></div></div>';return h;
}
function battle(){
 const wild=state.wild,hero=lead();
 let h='<h1>⚔️ ต่อสู้และจับสัตว์</h1><p class="subtitle">ดาเมจ โอกาสจับ และค่าประสบการณ์ถูกคำนวณโดยเซิร์ฟเวอร์เมื่อเข้าสู่ระบบออนไลน์</p>';
 if(!state.pets.length)return h+starterPanel();
 if(!wild)return h+'<div class="panel"><h2>🌿 ยังไม่พบสัตว์ป่า</h2><p class="subtitle">ออกสำรวจก่อนเพื่อพบคู่ต่อสู้ตัวใหม่</p>'+btn('🔍 ออกสำรวจตอนนี้','explore')+'</div>';
 const m=info(wild.speciesId);
 h+='<div class="battle"><div class="foe-name">'+safe(m.name)+' · Lv.'+wild.level+' · '+RARITY[m.rarity]+'</div><div class="foe">'+vis(wild.speciesId,'big')+'</div><div class="meter"><i style="width:'+(wild.hp/wild.maxHp*100)+'%;background:#ee6275"></i></div><div style="text-align:center;font-size:12px">HP '+wild.hp+' / '+wild.maxHp+'</div></div>';
 if(hero)h+='<div class="list-row">'+vis(hero.speciesId,'tiny')+'<div class="grow"><strong>'+safe(info(hero.speciesId).name)+' Lv.'+hero.level+'</strong><small>HP '+hero.hp+'/'+hero.maxHp+'</small></div></div>';
 else h+='<div class="panel"><b>สัตว์ทุกตัวหมดแรง</b><p>ใช้ยาเพื่อรักษาทีม</p>'+btn('🧪 ฟื้นฟูทีม','heal')+'</div>';
 h+='<div class="battle-buttons">';
 for(let i=0;i<4;i++)h+=btn(['⚔️ โจมตีเร็ว','🔥 ท่าธาตุ','💥 ท่าหนัก','🌠 ท่าพิเศษ'][i],'attack',i,i===3?'red':'blue');
 h+=btn('🔮 จับสัตว์ ('+state.player.balls+' บอล)','capture','','red')+btn('🏃 หนี','flee','','ghost')+'</div>';
 return h;
}
function evolve(){
 let h='<h1>✨ วิวัฒนาการ</h1><p class="subtitle">25 สายพันธุ์ × 4 ร่าง รวม 100 ชนิด · กดสัตว์เพื่อดูเงื่อนไขวิวัฒนาการ</p>';
 if(!state.pets.length)return h+starterPanel();
 for(const x of state.pets){const m=info(x.speciesId);h+='<div class="list-row">'+vis(x.speciesId,'tiny')+'<div class="grow"><strong>'+safe(m.name)+' · Lv.'+x.level+'</strong><small>'+ (m.stage<3?'ร่างถัดไป Lv.'+EVOLVL[m.stage+1]:'ร่างสูงสุดแล้ว')+'</small></div>'+btn('ดูวิวัฒนาการ','pick',x.id,'ghost')+'</div>';}
 return h;
}
function mapPage(){
 let h='<h1>🗺️ แผนที่โลก 10 พื้นที่</h1><p class="subtitle">พื้นที่ใหม่ปลดล็อกด้วยเลเวลสัตว์สูงสุดของทีม</p><div class="cards">';
 AREA.forEach((a,i)=>{
 const unlock=levelMax()>=a[2];
 h+='<button class="pet-card" data-act="area" data-val="'+i+'" style="min-height:145px;'+(!unlock?'opacity:.56':'')+'"><div class="area-thumb" style="background-position:'+((i%5)/4*100)+'% '+(Math.floor(i/5)*100)+'%"></div><div class="name">'+(i+1)+'. '+safe(a[0])+'</div><div class="stats">Lv.'+a[2]+'+ · '+(unlock?'✅ เปิดแล้ว':'🔒 ยังไม่ปลดล็อก')+'</div></button>';
 });
 return h+'</div>';
}
function shop(){return '<h1>🛒 ร้านค้าของนักสำรวจ</h1><p class="subtitle">ไอเทมในเกม ใช้เหรียญที่หาได้จากการต่อสู้ ไม่มีการชำระเงินจริง</p><div class="panels"><div class="panel" style="text-align:center"><div style="font-size:80px">🔮</div><h2>ลูกบอลจับสัตว์</h2><p>1 ลูก / 85 เหรียญ</p><p>มีอยู่ '+state.player.balls+' ลูก</p><div class="actions">'+btn('ซื้อ 1 ลูก','shop','balls:1')+btn('ซื้อ 5 ลูก','shop','balls:5')+'</div></div><div class="panel" style="text-align:center"><div style="font-size:80px">🧪</div><h2>ยาฟื้นฟูทีม</h2><p>1 ขวด / 120 เหรียญ</p><p>มีอยู่ '+state.player.potions+' ขวด</p><div class="actions">'+btn('ซื้อ 1 ขวด','shop','potions:1')+btn('ซื้อ 5 ขวด','shop','potions:5')+'</div></div></div>';}
function quests(){const p=state.player;return '<h1>📜 เควสต์และรางวัล</h1><div class="panel"><h2>🎁 รางวัลรายวัน</h2><p class="subtitle">รับ +600 เหรียญ +7 บอล +2 ยา วันละหนึ่งครั้งเท่านั้น</p>'+btn('รับของรายวัน','daily')+'</div><div class="panels"><div class="panel"><h2>🥇 นักสะสม</h2><p>จับสัตว์ 10 ตัว</p><div class="meter"><i style="width:'+Math.min(100,p.captures/10*100)+'%"></i></div><p>'+p.captures+'/10</p></div><div class="panel"><h2>⚔️ นักสู้</h2><p>ชนะการต่อสู้ 25 ครั้ง</p><div class="meter"><i style="width:'+Math.min(100,p.wins/25*100)+'%"></i></div><p>'+p.wins+'/25</p></div></div><p class="subtitle">เป้าหมายเควสต์ข้างบนเป็นตัวนับความสำเร็จ รางวัลที่กดรับได้จริงตอนนี้คือรางวัลรายวัน</p>';}
function social(){
 let h='<h1>🏆 ออนไลน์และอันดับนักสะสม</h1><p class="subtitle">โหมดออนไลน์บันทึกข้อมูลบน Supabase · อันดับวัดจากจำนวนสัตว์ที่จับและการต่อสู้ที่ชนะ</p><div class="panel"><h2>🏆 TOP TRAINERS</h2>';
 const list=state.leaderboard||[];
 h+=(list.length?list.map((p,i)=>'<div class="list-row"><b>'+['🥇','🥈','🥉'][i%3]+'</b><div class="grow"><strong>'+safe(p.name)+'</strong><small>'+fmt(p.captures)+' จับ · '+fmt(p.wins)+' ชนะ</small></div><span class="badge">'+(p.online?'🟢 ออนไลน์':'⚪ ออฟไลน์')+'</span></div>').join(''):'<p class="subtitle">ยังไม่มีผู้เล่นออนไลน์ในอันดับ</p>');
 h+='</div><div class="panel" style="margin-top:12px"><h2>🌐 ระบบผู้เล่นหลายคน</h2><p class="subtitle">บัญชีและความคืบหน้าซิงก์ข้ามเครื่องได้ · อันดับออนไลน์มาจากเซิร์ฟเวอร์<br>ระบบ PvP แบบเรียลไทม์ กิลด์ และตลาดแลกสัตว์ยังไม่เปิดในเวอร์ชันนี้</p>'+btn('🔄 อัปเดตข้อมูล','state')+'</div>';return h;
}
function bag(){const p=state.player;return '<h1>🎒 กระเป๋า</h1><div class="cards">'+[['🔮','บอลจับสัตว์',p.balls],['🧪','ยาฟื้นฟู',p.potions],['🪙','เหรียญ',p.coins],['💎','คริสตัล',p.gems],['🐾','สัตว์ในคลัง',state.pets.length],['📖','ชนิดที่เคยจับ',seen().size]].map(x=>'<div class="panel" style="text-align:center"><div style="font-size:55px">'+x[0]+'</div><h3>'+x[1]+'</h3><strong>'+fmt(x[2])+'</strong></div>').join('')+'</div>'+btn('🛒 ไปที่ร้านค้า','goto','shop');}
function profile(){
 return '<h1>⚙️ บัญชีผู้เล่น</h1><div class="panel"><h2>'+safe(state.player.name)+'</h2><p class="subtitle">โหมดปัจจุบัน: '+(mode==='online'?'✅ ออนไลน์และบันทึกบนเซิร์ฟเวอร์':'🔸 ออฟไลน์ทดลอง บันทึกเฉพาะเครื่อง')+'</p><div class="info-row"><span>สัตว์ทั้งหมด</span><b>'+state.pets.length+'</b></div><div class="info-row"><span>ชนะ</span><b>'+state.player.wins+'</b></div><div class="info-row"><span>จับสำเร็จ</span><b>'+state.player.captures+'</b></div><input id="new-name" class="auth-input" maxlength="20" placeholder="ชื่อเทรนเนอร์ใหม่">'+btn('เปลี่ยนชื่อ','rename')+'</div><div class="panel" style="margin-top:12px"><h2>🔐 เข้าสู่ระบบ</h2><p class="subtitle">ใช้บัญชี Supabase เพื่อให้ความคืบหน้าเดินทางไปยังมือถือเครื่องอื่นได้</p>'+authForm()+'</div><div class="panel" style="margin-top:12px"><h2>🧪 การทดสอบ</h2><p class="subtitle">เวอร์ชันนี้แยกออกจาก AMBER WORLD CLASS เดิม และไม่โหลดภาพ/มอนสเตอร์ชุดเก่า</p>'+btn('ออกจากระบบออนไลน์','logout','','ghost')+'</div>';
}
function authForm(){
 return '<div class="actions">'+(mode==='online'?'<span class="badge">✅ Connected to Supabase</span>':'<span class="badge">DEMO / OFFLINE</span>')+'</div><input id="auth-email" class="auth-input" type="email" placeholder="อีเมล"><input id="auth-pass" class="auth-input" type="password" placeholder="รหัสผ่าน 8 ตัวขึ้นไป"><div class="actions">'+btn('เข้าสู่ระบบ','signin')+btn('สมัครบัญชีใหม่','signup','','ghost')+'</div><p class="subtitle">สมัครใหม่อาจต้องกดยืนยันอีเมลตามการตั้งค่าของ Supabase</p>';
}
function render(){
 nav();updateTop();
 const component={home,dex,detail:petDetail,team,pet:petPage,explore,battle,evolve,map:mapPage,bag,shop,quests,social,profile};
 $('content').innerHTML=(component[view]||home)();
}
async function ensureClient(){
 if(!BASE||!KEY)throw Error('ยังไม่มีค่าการเชื่อมต่อ Supabase');
 if(!client){const mod=await import('https://esm.sh/@supabase/supabase-js@2.57.0');client=mod.createClient(BASE,KEY,{auth:{persistSession:true,autoRefreshToken:true}});}
 return client;
}
async function serverAction(action,arg={}){
 const sup=await ensureClient(),sess=await sup.auth.getSession(),token=sess.data.session?.access_token;
 if(!token)throw Error('เข้าสู่ระบบก่อน');
 const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),9000);
 let response;try{response=await fetch(URL,{method:'POST',signal:ctl.signal,headers:{'Content-Type':'application/json','apikey':KEY,'Authorization':'Bearer '+token},body:JSON.stringify({action,...arg})});}finally{clearTimeout(t)}
 const data=await response.json();if(!response.ok||!data.ok)throw Error(data.error||'Server error');
 state=data;mode='online';return data.message||'บันทึกบนเซิร์ฟเวอร์แล้ว';
}
function demoAction(action,arg={}){
 const s=state,p=s.player,pets=s.pets;let msg='';
 const findLead=()=>pets.filter(x=>x.slot!=null&&x.hp>0).sort((a,b)=>a.slot-b.slot)[0];
 const log=(event,id)=>{s.journal.unshift({type:event,speciesId:id,time:new Date().toISOString()});s.journal=s.journal.slice(0,8);};
 if(action==='starter'){
  if(pets.length||![1,5,9].includes(Number(arg.speciesId)))throw Error('เลือกสัตว์เริ่มต้นไม่ถูกต้อง');
  const m=info(arg.speciesId);pets.push({id:Date.now(),speciesId:m.id,level:5,hp:m.hp+15,maxHp:m.hp+15,slot:1,exp:0,atk:m.atk+10,def:m.def+5});msg='เลือก '+m.name+' สำเร็จ!';
 }else if(action==='explore'){
  if(s.wild)throw Error('ยังมีสัตว์ป่ารออยู่');
  if(!pets.length)throw Error('เลือกสัตว์เริ่มต้นก่อน');
  const family=((p.area*3)+Math.floor(Math.random()*5))%25;
  const st=p.area>=4&&Math.random()<.25?1:0;const m=info(family*4+st+1);
  const lv=p.area*6+Math.floor(Math.random()*7)+2;
  s.wild={speciesId:m.id,level:lv,hp:m.hp+lv*3,maxHp:m.hp+lv*3,name:m.name,element:m.type,rarity:m.rarity,turns:0};
  msg='พบ '+m.name+' Lv.'+lv;
 }else if(action==='flee'){s.wild=null;msg='หนีสำเร็จ';}
 else if(action==='attack'){
  if(!s.wild)throw Error('ยังไม่มีสัตว์ป่า');const hero=findLead();if(!hero)throw Error('สัตว์หมดแรง');
  const foe=info(s.wild.speciesId),d=Math.max(1,Math.floor((hero.atk+hero.level*2)*(.7+Number(arg.move||0)*.19)*(0.88+Math.random()*.22)-foe.def*.22));
  s.wild.hp=Math.max(0,s.wild.hp-d);msg='ทำดาเมจ '+d;
  if(!s.wild.hp){const xp=s.wild.level*16+60,coins=s.wild.level*9+30;hero.exp+=xp;if(hero.exp>=hero.level*30&&hero.level<80){hero.exp=0;hero.level++;hero.maxHp+=4;hero.hp+=4;}p.coins+=coins;p.wins++;p.xp+=xp;msg+=' ชนะ +'+coins+' เหรียญ';s.wild=null;}else{const hit=Math.max(1,Math.floor((foe.atk+s.wild.level)*(.12+Math.random()*.2)));hero.hp=Math.max(0,hero.hp-hit);}
 }else if(action==='capture'){
  if(!s.wild)throw Error('ยังไม่มีสัตว์ป่า');if(p.balls<=0)throw Error('บอลหมด');if(pets.length>=300)throw Error('คลังเต็ม');
  p.balls--;const m=info(s.wild.speciesId),rate=Math.min(.92,(m.rarity===4?.09:m.rarity===3?.19:m.rarity===2?.32:.58)/(1+m.stage*.52)*(1.6-s.wild.hp/s.wild.maxHp));
  if(Math.random()<rate){const lv=s.wild.level,slot=[1,2,3,4,5,6].find(n=>!pets.some(p=>p.slot===n))||null;pets.push({id:Date.now()+Math.random(),speciesId:m.id,level:lv,hp:m.hp+lv*3,maxHp:m.hp+lv*3,slot,exp:0,atk:m.atk+lv*2,def:m.def+lv});s.wild=null;p.captures++;p.coins+=20;log('catch',m.id);msg='🎉 จับ '+m.name+' สำเร็จ!';}else msg='สัตว์ดิ้นหลุดจากบอล!';
 }else if(action==='evolve'){
  const x=pets.find(z=>String(z.id)===String(arg.petId));if(!x)throw Error('ไม่พบสัตว์');const m=info(x.speciesId);
  if(m.stage>=3||x.level<EVOLVL[m.stage+1])throw Error('เลเวลไม่ถึงเกณฑ์วิวัฒนาการ');
  x.speciesId++;const next=info(x.speciesId);x.maxHp=next.hp+x.level*3;x.hp=x.maxHp;x.atk=next.atk+x.level*2;x.def=next.def+x.level;log('evolve',next.id);msg='วิวัฒนาการเป็น '+next.name+' สำเร็จ!';
 }else if(action==='team'){
  const x=pets.find(z=>String(z.id)===String(arg.petId));if(!x)throw Error('ไม่พบสัตว์');
  pets.forEach(y=>{if(y.slot===arg.slot)y.slot=null});x.slot=arg.slot||null;msg='เปลี่ยนทีมแล้ว';
 }else if(action==='area'){
  const a=Number(arg.area);if(a<0||a>9||levelMax()<AREA[a][2])throw Error('ยังปลดล็อกพื้นที่นี้ไม่ได้');p.area=a;s.wild=null;msg='เข้าพื้นที่ '+AREA[a][0];
 }else if(action==='shop'){
  const qty=Number(arg.quantity),item=arg.item,price=(item==='balls'?85:120)*qty;if(!['balls','potions'].includes(item)||qty<1||qty>20||p.coins<price)throw Error('ซื้อไม่ได้: เงินไม่พอหรือข้อมูลผิด');p.coins-=price;p[item]+=qty;msg='ซื้อสำเร็จ';
 }else if(action==='heal'){
  if(!p.potions)throw Error('ยาฟื้นฟูหมด');p.potions--;pets.filter(x=>x.slot).forEach(x=>x.hp=x.maxHp);msg='รักษาสัตว์ในทีมแล้ว';
 }else if(action==='daily'){
  const today=new Date().toISOString().slice(0,10);if(p.dailyClaim===today)throw Error('รับของรายวันแล้ว');p.dailyClaim=today;p.coins+=600;p.balls+=7;p.potions+=2;msg='รับรางวัลรายวันสำเร็จ!';
 }else if(action==='rename'){
  const name=String(arg.name||'').trim();if(name.length<2||name.length>20)throw Error('ชื่อต้องมี 2–20 ตัวอักษร');p.name=name;msg='เปลี่ยนชื่อแล้ว';
 }else if(!['state','login'].includes(action))throw Error('คำสั่งไม่รองรับ');
 return msg;
}
async function act(action,arg={}){
 if(busy)return;
 busy=true;
 try{
  const message=mode==='online'?await serverAction(action,arg):demoAction(action,arg);
  persist();render();if(message)toast(message);
  if(action==='explore'&&state.wild){view='battle';render();}
 }catch(error){toast(error?.message||'ดำเนินการไม่สำเร็จ');}
 finally{busy=false;}
}
async function authentication(signup=false){
 if(busy)return;const email=$('auth-email')?.value?.trim(),password=$('auth-pass')?.value||'';
 if(!email||!email.includes('@')||password.length<8){toast('กรอกอีเมลและรหัสผ่านอย่างน้อย 8 ตัว');return;}
 busy=true;
 try{
  const sup=await ensureClient();
  const result=signup?await sup.auth.signUp({email,password}):await sup.auth.signInWithPassword({email,password});
  if(result.error)throw result.error;
  if(result.data.session){mode='online';await serverAction('login');view='home';render();toast('เชื่อมต่อออนไลน์สำเร็จ');}
  else toast('สมัครสำเร็จ! โปรดตรวจอีเมลเพื่อยืนยันก่อนเข้าสู่ระบบ');
 }catch(e){toast(e.message||'เข้าสู่ระบบไม่สำเร็จ');}finally{busy=false;}
}
async function logout(){
 try{if(client)await client.auth.signOut();}catch(_){}
 mode='demo';state=initial();try{const d=JSON.parse(localStorage.getItem('monster-world-demo-v1')||'null');if(d&&d.player)state=d;}catch(_){}
 view='home';render();toast('กลับโหมดทดลองออฟไลน์');
}
async function autoLogin(){
 try{const sup=await ensureClient();const {data}=await sup.auth.getSession();
 if(data.session?.access_token){mode='online';await serverAction('login');render();toast('โหลดข้อมูลสัตว์จากเซิร์ฟเวอร์แล้ว');}
 }catch(e){console.warn('Server session check:',String(e));}
}
document.addEventListener('click',async e=>{
 const v=e.target.closest('[data-view]');if(v){view=v.dataset.view;render();return;}
 const pick=e.target.closest('[data-select]');if(pick){selectedId=Number(pick.dataset.select);view='detail';render();return;}
 const own=e.target.closest('[data-pet]');if(own){selectedPet=own.dataset.pet;view='pet';render();return;}
 const typ=e.target.closest('[data-type]');if(typ){typeFilter=typ.dataset.type;render();return;}
 const b=e.target.closest('[data-act]');if(!b)return;const action=b.dataset.act,val=b.dataset.val||'';
 if(action==='goto'){view=val;render();return}
 if(action==='pick'){selectedPet=val;view='pet';render();return}
 if(action==='signup'||action==='signin'){await authentication(action==='signup');return}
 if(action==='logout'){await logout();return}
 if(action==='rename'){await act('rename',{name:$('new-name')?.value||''});return}
 if(action==='starter'){await act('starter',{speciesId:Number(val)});return}
 if(action==='attack'){await act('attack',{move:Number(val)});return}
 if(action==='evolve'){await act('evolve',{petId:val});return}
 if(action==='team'){const [petId,slot]=val.split(':');await act('team',{petId,slot:Number(slot)});return}
 if(action==='area'){await act('area',{area:Number(val)});return}
 if(action==='shop'){const [item,quantity]=val.split(':');await act('shop',{item,quantity:Number(quantity)});return}
 await act(action);
});
document.addEventListener('input',e=>{
 if(e.target?.id==='dex-search'){searchText=e.target.value;const caret=e.target.selectionStart;render();const n=$('dex-search');if(n){n.focus();n.setSelectionRange(caret,caret);}}
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&mode==='online')act('state')});
render();autoLogin();
