
/* MONSTER WORLD ONLINE V0.2 - rebuild of visual/game flow; original 100-species server data preserved. */
'use strict';
const cfg=window.AWC_CONFIG||{},SUPA=String(cfg.supabaseUrl||'').replace(/\/$/,''),PUB=cfg.supabasePublishableKey||'';
const API=SUPA+'/functions/v1/awc-pets';
const $=id=>document.getElementById(id);
const clean=x=>String(x===null||x===undefined?'':x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=n=>Number(n||0).toLocaleString('en-US');
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const fam=[
 ['เพลิงจิ้ง','ไฟ'],['หยดน้ำ','น้ำ'],['ใบเมียว','พฤกษา'],['สายฟ้าจิ๋ว','สายฟ้า'],
 ['หิมะปุย','น้ำแข็ง'],['เงาเหมียว','เงา'],['แสงกวาง','แสง'],['หินป้อม','หิน'],
 ['วายุปีก','ลม'],['คริสตัล','คริสตัล'],['ลาวาเต่า','ไฟ'],['บัวธาร','น้ำ'],
 ['หนามกระรอก','พฤกษา'],['เมฆสายฟ้า','สายฟ้า'],['น้ำแข็งโบ','น้ำแข็ง'],
 ['จันทร์หมาป่า','เงา'],['สุริยานก','แสง'],['ภูผากบ','หิน'],['พายุปลา','ลม'],
 ['แก้วมังกร','คริสตัล'],['ไฟสิงโต','ไฟ'],['ทะเลวาฬ','น้ำ'],
 ['พฤกษากวาง','พฤกษา'],['เวทดารา','เวท'],['ราชันแสง','แสง']];
const elements={
 'ไฟ':['#ffbd7d','#ef6151','🔥'],'น้ำ':['#93eaff','#328fd0','💧'],'พฤกษา':['#bce791','#44a27b','🌿'],
 'สายฟ้า':['#fff0a7','#e9a638','⚡'],'น้ำแข็ง':['#e0faff','#77b5e0','❄️'],'เงา':['#d9c0fa','#7756aa','🌙'],
 'แสง':['#fff6b6','#ddac62','🌟'],'หิน':['#dec7a8','#a27556','🪨'],'ลม':['#b5f7e6','#47aea2','🌪️'],
 'คริสตัล':['#e4c8ff','#9366d5','💎'],'เวท':['#fbc3ec','#bb6da4','🔮']};
const areas=[
 ['เมืองพฤกษา','01','Lv. 1+','🌸','สวนเริ่มต้นและสัตว์อ่อนโยน'],
 ['ป่าแสงดาว','02','Lv. 7+','🌲','สัตว์ใบไม้และแมลงแสง'],
 ['อ่าวไข่มุก','03','Lv. 13+','🌊','สัตว์น้ำแห่งอ่าว'],
 ['หุบเขาสายฟ้า','04','Lv. 19+','⚡','สัตว์สายฟ้ารวดเร็ว'],
 ['ทะเลทรายสีทอง','05','Lv. 25+','🏜️','สัตว์ไฟและพื้นดิน'],
 ['หุบเขาหิมะ','06','Lv. 31+','❄️','สัตว์น้ำแข็งและหมอก'],
 ['เมืองราตรี','07','Lv. 37+','🌙','สัตว์พลังเงา'],
 ['เกาะลอยฟ้า','08','Lv. 43+','☁️','สัตว์ลมและแสง'],
 ['เหมืองคริสตัล','09','Lv. 49+','💎','อัญมณีมีชีวิต'],
 ['ปราสาทดวงดาว','10','Lv. 55+','🏰','ดินแดนสัตว์ระดับตำนาน']];
const nav=[
 ['home','🏠','หน้าแรก'],['explore','🧭','สำรวจ'],['battle','⚔️','ต่อสู้ / จับ'],
 ['team','🐾','ทีมสัตว์'],['dex','📖','สมุดสัตว์'],['evolve','✨','วิวัฒนาการ'],
 ['map','🗺️','แผนที่'],['bag','🎒','กระเป๋า'],['shop','🛍️','ร้านค้า'],
 ['quests','📜','เควสต์'],['social','🏆','ผู้เล่น'],['profile','⚙️','บัญชี']];
const petsDB=Array.from({length:100},(_,k)=>{
 const f=Math.floor(k/4),stage=k%4,rare=f>=23?4:f>=18?3:f>=10?2:1;
 return {id:k+1,f,stage,name:fam[f][0]+['น้อย','ว่องไว','จ้าว','ตำนาน'][stage],type:fam[f][1],rarity:rare,
 hp:45+stage*26+(f%5)*6,atk:10+stage*9+(f%7)*2,def:8+stage*7+(f%6)*2,evo:[0,12,28,48][stage]};
});
const book=Object.fromEntries(petsDB.map(x=>[x.id,x]));
const get=id=>book[id]||book[1];
const rarity=['','ธรรมดา','หายาก','มหากาพย์','ตำนาน'];
const init=()=>({player:{name:'นักสำรวจ',coins:1600,gems:50,balls:15,potions:5,area:0,captures:0,wins:0,xp:0,dailyClaim:null},pets:[],wild:null,leaderboard:[],journal:[]});
let page='home',modal=null,state=init(),online=false,client=null,busy=false,filter='ทั้งหมด',q='',detailId=1,petId=null,lastAction='',lastMessage='';
try{const prev=JSON.parse(localStorage.getItem('monster-world-demo-v1')||'null');if(prev&&prev.player&&Array.isArray(prev.pets))state=prev;}catch(_){}
function store(){if(!online)try{localStorage.setItem('monster-world-demo-v1',JSON.stringify(state));}catch(_){}}
function maxLevel(){return Math.max(1,...state.pets.map(x=>Number(x.level)||1));}
function team(){return state.pets.filter(x=>x.slot!=null).sort((a,b)=>a.slot-b.slot);}
function leader(){return team().find(x=>x.hp>0)||null;}
function collected(){return new Set(state.pets.map(x=>Number(x.speciesId)));}
function art(id,size='normal',lock=false){
 const m=get(id),rgb=elements[m.type],k=m.id-1,col=(k%10)/9*100,row=Math.floor(k/10)/9*100;
 const style='--c1:'+rgb[0]+';--c2:'+rgb[1];
 return '<div class="creature-art '+(size==='normal'?'':size)+(lock?' locked':'')+'" style="'+style+'"><span class="creature-image" style="background-position:'+col.toFixed(5)+'% '+row.toFixed(5)+'%" aria-label="'+clean(m.name)+'"></span></div>';
}
function type(id){const m=get(id);return '<span class="badge">'+elements[m.type][2]+' '+m.type+'</span> <span class="badge '+(m.rarity>=3?'gold':'')+'">'+rarity[m.rarity]+'</span>';}
function button(label,action,value='',klass='blue',disabled=false){return '<button class="btn '+klass+'" data-action="'+action+'" data-value="'+clean(value)+'"'+(disabled?' disabled':'')+'>'+label+'</button>';}
function link(pageName,label,cls='ghost'){return button(label,'route',pageName,cls);}
function row(x,b='',c=''){return '<div class="list-row">'+x+'<div class="flex">'+b+'</div>'+c+'</div>';}
function progress(current,max,kind='hp'){return '<div class="progress '+kind+'"><i style="width:'+clamp(Math.round(100*current/Math.max(1,max)),0,100)+'%"></i></div>';}
function title(h,t='',extra=''){return '<div class="topline"><div><h1>'+h+'</h1>'+(t?'<p class="subtitle">'+t+'</p>':'')+'</div>'+extra+'</div>';}
function message(msg){lastMessage=String(msg||'');if(!msg)return;const x=document.createElement('div');x.className='toast';x.textContent=msg;$('toast').replaceChildren(x);setTimeout(()=>{if(x.isConnected)x.remove()},3000);}
function saveView(p){page=p;modal=null;render();window.scrollTo({top:0,behavior:'instant'});}
function navDraw(){
 $('menu').innerHTML=nav.map(n=>'<button data-route="'+n[0]+'" class="'+(page===n[0]?'active':'')+'"><span>'+n[1]+'</span>'+n[2]+'</button>').join('');
 $('mobile-menu').innerHTML=nav.filter(n=>['home','explore','battle','team','dex'].includes(n[0])).map(n=>'<button data-route="'+n[0]+'" class="'+(page===n[0]?'active':'')+'"><b>'+n[1]+'</b>'+n[2]+'</button>').join('')+'<button data-action="more" class="more"><b>☰</b>เพิ่มเติม</button>';
 $('mode').textContent=online?'● ONLINE':'● DEMO';
 $('mode').style.color=online?'#bfffe6':'#ffe3aa';
 $('trainer').textContent=state.player.name;
 $('team-level').textContent='เลเวลสูงสุด '+maxLevel();
 $('coins').textContent=num(state.player.coins);
 $('balls').textContent=num(state.player.balls);
}
function starter(){
 const choices=[1,5,9];
 return '<div class="panel"><h2>🌟 เลือกคู่หูตัวแรก</h2><p class="muted">เลือกได้เพียงหนึ่งตัวในหนึ่งบัญชี · ร่างของสัตว์จะเปลี่ยนเมื่อวิวัฒนาการ</p><div class="sheet">'+choices.map(id=>{
 const m=get(id);return '<button class="creature-card" data-action="starter" data-value="'+id+'">'+art(id)+'<div class="name">'+clean(m.name)+'</div><div class="sub">'+type(id)+'</div><div class="sub">แตะเพื่อเลือกคู่หู</div></button>';
 }).join('')+'</div></div>';
}
function regionStyle(i){i=clamp(i|0,0,9);return 'background-position:center,'+((i%5)/4*100)+'% '+Math.floor(i/5)*100+'%';}
function home(){
 const p=state.player,hero=leader(),area=areas[p.area||0],none=!state.pets.length;
 let h='<div class="page-width">'+title('MONSTER WORLD <span style="color:#78e3ff">ONLINE</span>','โลกแฟนตาซีสะสมสัตว์ต้นฉบับ 100 ชนิด · เลือกคู่หู จับสัตว์ ฝึกเลเวล และวิวัฒนาการ');
 h+='<section class="hero" style="'+regionStyle(p.area||0)+'"><div class="hero-content"><div class="hero-copy"><span class="badge gold">'+area[3]+' '+clean(area[0])+'</span><h1>การผจญภัย<br>เริ่มที่คู่หูของคุณ</h1><p>ออกเดินทาง พบสัตว์หายาก และสร้างทีมที่แข็งแกร่งที่สุด</p><div class="actions">'+(none?link('team','✨ เลือกคู่หูแรก',''):link('explore','🌿 ออกสำรวจ',''))+link('dex','📖 สมุดสัตว์')+'</div></div><div class="hero-art">'+art(hero?hero.speciesId:1,'large')+'</div></div></section>';
 if(none)h+='<div style="margin-top:12px">'+starter()+'</div>';
 h+='<div class="panel-grid three"><div class="stat-tile"><b>'+collected().size+'/100</b><span>ค้นพบและสะสม</span></div><div class="stat-tile"><b>'+num(p.captures)+'</b><span>จับสัตว์สำเร็จ</span></div><div class="stat-tile"><b>'+num(p.wins)+'</b><span>ชนะการต่อสู้</span></div></div>';
 h+='<div class="panel-grid"><div class="panel"><h2>🐾 ทีมปัจจุบัน</h2><div class="rows">'+(team().length?team().slice(0,4).map(x=>row(art(x.speciesId,'small'),'<strong>'+clean(get(x.speciesId).name)+'</strong><small>Lv.'+x.level+' · HP '+x.hp+'/'+x.maxHp+'</small>')).join(''):'<p class="muted">ยังไม่มีสัตว์ในทีม เริ่มจากเลือกสัตว์ตัวแรก</p>')+'</div><div class="actions">'+link('team','จัดทีม →')+'</div></div>';
 h+='<div class="panel"><h2>🎯 กิจกรรมสำหรับวันนี้</h2><p class="muted">ทุกวันรับบอลเพิ่มและออกสำรวจเพื่อตามหาสัตว์ใหม่</p><div class="rows"><div class="list-row"><span>🎁</span><div class="flex"><strong>รางวัลรายวัน</strong><small>600 เหรียญ · 7 บอล · 2 ยา</small></div>'+button('รับรางวัล','daily','','',false)+'</div><div class="list-row"><span>⚔️</span><div class="flex"><strong>ต่อสู้ฝึกคู่หู</strong><small>ชนะเพื่อเพิ่มเลเวลและเก็บเหรียญ</small></div>'+link('explore','เริ่ม','ghost')+'</div></div></div></div></div>';
 return h;
}
function encounter(){
 if(!state.pets.length)return '<div class="page-width">'+title('🧭 สำรวจโลก','เลือกคู่หูตัวแรกก่อน')+starter()+'</div>';
 const i=state.player.area||0,a=areas[i],w=state.wild;
 return '<div class="page-width">'+title('🧭 สำรวจ '+clean(a[0]),clean(a[4])+' · พื้นที่ '+(i+1)+'/10 · '+a[2],link('map','🗺️ เปลี่ยนแผนที่'))+
 '<section class="hero" style="'+regionStyle(i)+'"><div class="hero-content"><div class="hero-copy"><span class="badge">'+a[3]+' '+a[2]+'</span><h1>'+(w?'พบสัตว์ป่าแล้ว!':'คุณจะพบใคร<br>ในการผจญภัยครั้งนี้?')+'</h1><p>'+(w?'เลือกสู้ จับ หรือหนีในหน้า Battle':'สำรวจเพื่อสุ่มพบสัตว์ป่า · สัตว์ระดับสูงจะพบในพื้นที่ยาก')+'</p><div class="actions">'+(w?link('battle','⚔️ ไปยังการต่อสู้',''):button('🌾 ออกค้นหาสัตว์','explore'))+'</div></div><div class="hero-art">'+art(w?w.speciesId:(i*3)%100+1,'large')+'</div></div></section>'+
 '<div class="panel-grid"><div class="panel"><h2>📍 เป้าหมายการเดินทาง</h2><p class="muted">ปลดล็อกพื้นที่ถัดไปด้วยการฝึกสัตว์ให้ถึงเลเวล '+Math.min(55,(i+1)*6+1)+' และค้นพบชนิดใหม่</p>'+link('map','ดูโลกทั้ง 10 พื้นที่')+'</div><div class="panel"><h2>💡 เทคนิคจับสัตว์</h2><p class="muted">ลด HP ของสัตว์ป่าก่อนปาบอลเพื่อเพิ่มโอกาสจับ และพกยาฟื้นฟูให้พร้อม</p>'+link('bag','ดูไอเทมในกระเป๋า')+'</div></div></div>';
}
function battle(){
 if(!state.pets.length)return '<div class="page-width">'+title('⚔️ การต่อสู้','ต้องเลือกสัตว์เริ่มต้นก่อน')+starter()+'</div>';
 const w=state.wild,p=leader();
 let h='<div class="page-width">'+title('⚔️ สนามจับสัตว์','สัตว์ทุกตัวมีโอกาสจับต่างกันตามความหายากและ HP',link('explore','← กลับสำรวจ'));
 if(!w){return h+'<div class="panel" style="text-align:center;padding:35px"><div style="font-size:65px">🌿</div><h2>ยังไม่พบสัตว์ป่า</h2><p class="muted">เดินสำรวจก่อนเพื่อพบสัตว์ที่นำมาต่อสู้หรือจับเข้าทีม</p><div class="actions" style="justify-content:center">'+button('ค้นหาสัตว์ป่า','explore')+'</div></div></div>';}
 const m=get(w.speciesId),i=state.player.area||0;
 h+='<div class="battle-stage" style="'+regionStyle(i)+'"><div class="wild-area" id="wild-area"><div class="battle-label">✦ '+clean(m.name)+' · Lv.'+w.level+' · '+rarity[m.rarity]+'</div>'+art(m.id,'large')+
 '<div class="wild-hp">'+progress(w.hp,w.maxHp,'enemy')+'</div><span class="badge">HP '+w.hp+' / '+w.maxHp+' · '+m.type+'</span></div></div>';
 h+='<div class="battle-bottom"><div class="panel"><h2>🐾 คู่หูของคุณ</h2>'+(p?row(art(p.speciesId,'small'),'<strong>'+clean(get(p.speciesId).name)+' · Lv.'+p.level+'</strong><small>HP '+p.hp+' / '+p.maxHp+'</small>')+progress(p.hp,p.maxHp):'<p class="muted">สัตว์ในทีมหมดแรง ต้องรักษาทีมก่อน</p>'+button('🧪 รักษาทีม','heal'))+
 '<p class="tips">ทำให้ HP ฝ่ายตรงข้ามต่ำลง เพื่อเพิ่มโอกาสจับ · ถ้าสัตว์ของคุณหมดแรงให้ใช้ยาฟื้นฟู</p></div>';
 h+='<div class="panel"><h2>⚔️ เลือกคำสั่ง</h2><div class="battle-buttons">'+
 button('⚔️ จู่โจม','attack','0','blue',!p)+button('🌪️ ท่าธาตุ','attack','1','blue',!p)+
 button('💥 โจมตีหนัก','attack','2','blue',!p)+button('✨ ท่าพิเศษ','attack','3','blue',!p)+
 button('🔮 จับ ('+state.player.balls+')','capture','','',!p||!state.player.balls)+button('🏃 หนี','flee','','ghost')+
 '</div></div></div><div class="notice">การต่อสู้ออนไลน์คำนวณดาเมจ เลเวล รางวัล และผลการจับที่ Supabase เท่านั้น</div></div>';
 return h;
}
function dex(){
 let set=collected(),h='<div class="page-width">'+title('📖 สมุดสัตว์ 100 ชนิด','25 สายวิวัฒนาการ · 4 ร่างต่อสาย · ทุกชนิดมีธาตุ ความหายาก และค่าสถานะ', '<span class="badge gold">'+set.size+'/100 ที่เคยจับ</span>');
 h+='<div class="panel"><input class="input" id="search" placeholder="🔎 ค้นหาชื่อสัตว์หรือหมายเลข" value="'+clean(q)+'"><div class="filters">';
 const types=['ทั้งหมด',...Object.keys(elements)];for(const t of types)h+='<button data-type="'+clean(t)+'" class="'+(t===filter?'active':'')+'">'+(t==='ทั้งหมด'?'ทั้งหมด':elements[t][2]+' '+t)+'</button>';
 h+='</div><div class="sheet" id="dex-list">';
 h+=petsDB.filter(m=>(filter==='ทั้งหมด'||m.type===filter)&&(!q||m.name.includes(q)||String(m.id).includes(q))).map(m=>
 '<button class="creature-card '+(!set.has(m.id)?'locked':'')+'" data-detail="'+m.id+'">'+art(m.id,'normal',!set.has(m.id))+'<div class="number">#'+String(m.id).padStart(3,'0')+'</div><div class="name">'+clean(m.name)+'</div><div class="sub">'+elements[m.type][2]+' '+m.type+' · ★'+m.rarity+'</div></button>').join('');
 return h+'</div></div>';
}
function stages(f){
 let a='<div class="evolutions">';
 for(let i=0;i<4;i++){let m=petsDB[f*4+i];a+='<div class="evo-stage">'+art(m.id)+'<div style="font-size:11px;font-weight:800;margin-top:5px">'+clean(m.name)+'</div><span class="badge">Lv.'+([1,12,28,48][i])+'</span></div>';if(i<3)a+='<span class="arrow">➜</span>';}
 return a+'</div>';
}
function detail(){
 let m=get(detailId),copies=state.pets.filter(x=>x.speciesId===m.id);
 return '<div class="page-width">'+title('✦ #'+String(m.id).padStart(3,'0')+' '+clean(m.name),'รายละเอียดและสายวิวัฒนาการ',link('dex','← สมุดสัตว์'))+
 '<div class="panel-grid"><div class="panel" style="text-align:center">'+art(m.id,'large')+'<h2 style="margin-top:12px">'+clean(m.name)+'</h2>'+type(m.id)+
 '<hr class="divider"><div class="list-row"><span>❤️ HP</span><div class="flex"></div><b>'+m.hp+'</b></div><div class="list-row"><span>⚔️ ATK</span><div class="flex"></div><b>'+m.atk+'</b></div><div class="list-row"><span>🛡️ DEF</span><div class="flex"></div><b>'+m.def+'</b></div></div>'+
 '<div class="panel"><h2>✨ วิวัฒนาการทั้งสาย</h2>'+stages(m.f)+'<p class="muted">ต้องมีเลเวลถึง 12 / 28 / 48 จึงพัฒนาร่างถัดไปได้</p><h3>ที่มีในคลัง: '+copies.length+' ตัว</h3>'+copies.map(x=>row(art(x.speciesId,'small'),'<strong>Lv.'+x.level+'</strong><small>HP '+x.hp+'/'+x.maxHp+'</small>',button('จัดทีม','pet',x.id,'ghost'))).join('')+'</div></div></div>';
}
function teamView(){
 let own=state.pets.slice().sort((a,b)=>((a.slot||99)-(b.slot||99))||a.id-b.id);
 let h='<div class="page-width">'+title('🐾 ทีมสัตว์และคลัง','ทีมได้สูงสุด 6 ตัว · สัตว์อื่นอยู่ในคลังโดยไม่หายไป',button('🧪 ฟื้นฟูทีม','heal'));
 if(!own.length)return h+starter()+'</div>';
 h+='<div class="panel"><h2>⚔️ ทีมหลัก · '+team().length+'/6</h2><div class="team-grid">';
 for(let i=1;i<=6;i++){let p=team().find(x=>x.slot===i);h+=p?'<button class="team-slot" data-action="pet" data-value="'+p.id+'">'+art(p.speciesId)+'<strong>'+clean(get(p.speciesId).name)+'</strong><small>Lv.'+p.level+' · HP '+p.hp+'/'+p.maxHp+'</small></button>':'<div class="team-slot empty"><div>➕<br>ช่อง '+i+'</div></div>';}
 h+='</div></div><div class="panel" style="margin-top:12px"><h2>📦 คลังสัตว์ · '+own.length+'/300</h2><div class="rows">';
 h+=own.map(p=>row(art(p.speciesId,'small'),'<strong>'+clean(get(p.speciesId).name)+' · Lv.'+p.level+'</strong><small>HP '+p.hp+'/'+p.maxHp+' · '+(p.slot?'ช่อง '+p.slot:'คลังสำรอง')+'</small>',button('รายละเอียด','pet',p.id,'ghost'))).join('');
 return h+'</div></div></div>';
}
function petDetails(){
 let p=state.pets.find(x=>String(x.id)===String(petId));if(!p)return teamView();
 let m=get(p.speciesId),ready=m.stage<3&&p.level>=[0,12,28,48][m.stage+1];
 let h='<div class="page-width">'+title(clean(m.name)+' · Lv.'+p.level,'ดู HP ค่าพลัง พัฒนาร่าง และจัดทีม',link('team','← ทีมสัตว์'));
 h+='<div class="panel-grid"><div class="panel" style="text-align:center">'+art(m.id,'large')+'<h2 style="margin:12px 0">'+clean(m.name)+'</h2>'+type(m.id)+
 '<div class="list-row"><span>❤️ HP</span><div class="flex">'+progress(p.hp,p.maxHp)+'</div><b>'+p.hp+'/'+p.maxHp+'</b></div>'+
 '<div class="list-row"><span>⚔️ ATK</span><div class="flex"></div><b>'+p.atk+'</b></div><div class="list-row"><span>🛡️ DEF</span><div class="flex"></div><b>'+p.def+'</b></div><div class="list-row"><span>✨ EXP</span><div class="flex"></div><b>'+p.exp+'/'+(p.level*30)+'</b></div></div>';
 h+='<div class="panel"><h2>🧬 สายวิวัฒนาการ</h2>'+stages(m.f)+
 (m.stage<3?'<p class="muted">ร่างถัดไปปลดล็อกที่เลเวล '+[0,12,28,48][m.stage+1]+'</p>'+button('✨ วิวัฒนาการ','evolve',p.id,'',!ready):'<span class="badge gold">👑 ร่างสูงสุด</span>')+
 '<hr class="divider"><h2>จัดช่องทีม</h2><div class="actions">';
 for(let i=1;i<=6;i++)h+=button('ช่อง '+i,'team',p.id+':'+i,'ghost');
 h+=button('ย้ายเข้าคลัง','team',p.id+':0','red')+'</div></div></div></div>';return h;
}
function evolve(){
 if(!state.pets.length)return '<div class="page-width">'+title('✨ วิวัฒนาการ')+starter()+'</div>';
 return '<div class="page-width">'+title('✨ ห้องวิวัฒนาการ','เมื่อคู่หูถึงเลเวลตามกำหนด สามารถเปลี่ยนเป็นร่างใหม่ได้')+
 '<div class="panel"><div class="rows">'+state.pets.map(p=>{
 const m=get(p.speciesId),next=m.stage<3?[0,12,28,48][m.stage+1]:null;
 return row(art(m.id,'small'),'<strong>'+clean(m.name)+' · Lv.'+p.level+'</strong><small>'+(next?'ต้อง Lv.'+next+' จึงวิวัฒนาการ':'ถึงร่างสูงสุดแล้ว')+'</small>',button('ดูร่าง','pet',p.id,'ghost'));}).join('')+'</div></div></div>';
}
function map(){
 let h='<div class="page-width">'+title('🗺️ แผนที่โลก','10 พื้นที่ · ความยากเพิ่มตามเลเวล · ปลดล็อกเมื่อสัตว์ในคลังมีเลเวลถึงเกณฑ์')+
 '<div class="map-grid">';
 areas.forEach((a,i)=>{let available=maxLevel()>=i*6+1,active=state.player.area===i;
 h+='<button class="map-card '+(!available?'locked':'')+(active?' active':'')+'" data-action="area" data-value="'+i+'" '+(!available?'disabled':'')+'><div class="map-thumb" style="background-position:'+((i%5)/4*100)+'% '+Math.floor(i/5)*100+'%"></div><div class="map-caption"><b>'+a[3]+' '+a[0]+'</b><small>'+a[2]+' · '+(active?'📍 อยู่ที่นี่':available?'เข้าได้':'🔒 ยังไม่เปิด')+'</small></div></button>';
 });
 return h+'</div></div>';
}
function shop(){
 return '<div class="page-width">'+title('🛍️ ร้านค้าสำหรับนักสำรวจ','ใช้เหรียญในเกม ไม่ใช่การเติมเงินจริง')+'<div class="panel-grid">'+
 '<div class="panel" style="text-align:center"><div style="font-size:64px">🔮</div><h2>บอลจับสัตว์</h2><p class="muted">85 เหรียญ / ลูก · มี '+state.player.balls+' ลูก</p><div class="actions" style="justify-content:center">'+button('ซื้อ 1','shop','balls:1')+button('ซื้อ 5','shop','balls:5')+'</div></div>'+
 '<div class="panel" style="text-align:center"><div style="font-size:64px">🧪</div><h2>ยารักษาทีม</h2><p class="muted">120 เหรียญ / ขวด · มี '+state.player.potions+' ขวด</p><div class="actions" style="justify-content:center">'+button('ซื้อ 1','shop','potions:1')+button('ซื้อ 5','shop','potions:5')+'</div></div></div></div>';
}
function bag(){
 return '<div class="page-width">'+title('🎒 กระเป๋าไอเทม','สิ่งที่ได้รับจากการต่อสู้และการจับสัตว์')+
 '<div class="panel-grid three">'+[['🔮','บอลจับสัตว์',state.player.balls],['🧪','ยารักษา',state.player.potions],['🪙','เหรียญ',state.player.coins],['💎','คริสตัล',state.player.gems],['🐾','สัตว์ในคลัง',state.pets.length],['✨','ชนิดที่พบ',collected().size]].map(x=>'<div class="stat-tile" style="text-align:center"><div style="font-size:32px">'+x[0]+'</div><b>'+num(x[2])+'</b><span>'+x[1]+'</span></div>').join('')+'</div><div class="actions">'+link('shop','ไปที่ร้านค้า →')+button('🧪 ฟื้นฟูสัตว์ในทีม','heal')+'</div></div>';
}
function quests(){
 let p=state.player;
 return '<div class="page-width">'+title('📜 ภารกิจและรางวัล','เป้าหมายที่นับจากข้อมูลผู้เล่นจริง')+
 '<div class="panel-grid"><div class="panel"><h2>🎁 รางวัลรายวัน</h2><p class="muted">600 เหรียญ · 7 ลูกบอล · 2 ยาฟื้นฟู / วัน</p>'+button('รับรางวัลวันนี้','daily')+'</div>'+
 '<div class="panel"><h2>🐾 นักสะสมฝึกหัด</h2><p class="muted">จับสัตว์ให้ครบ 10 ครั้ง</p>'+progress(p.captures,10)+'<div class="badge">'+p.captures+'/10</div></div>'+
 '<div class="panel"><h2>⚔️ ผู้ฝึกมือใหม่</h2><p class="muted">ชนะ 25 ครั้ง</p>'+progress(p.wins,25)+'<div class="badge">'+p.wins+'/25</div></div>'+
 '<div class="panel"><h2>📖 นักสำรวจสายพันธุ์</h2><p class="muted">สะสมให้ได้ 20 ชนิด</p>'+progress(collected().size,20)+'<div class="badge">'+collected().size+'/20</div></div></div>'+
 '<div class="notice">ภารกิจนับความคืบหน้าได้แล้ว รางวัลอัตโนมัติจากเป้าหมายภารกิจยังไม่เปิดใช้งาน มีเฉพาะรางวัลรายวันที่กดรับได้</div></div>';
}
function social(){
 let list=state.leaderboard||[];
 return '<div class="page-width">'+title('🏆 อันดับผู้ฝึกออนไลน์','ผู้เล่นที่บันทึกผ่าน Supabase เท่านั้น · เรียงตามจำนวนจับและการชนะ',button('⟳ รีเฟรช','state'))+
 '<div class="panel"><h2>TOP TRAINERS</h2><div class="rows">'+(list.length?list.map((p,i)=>row('<span style="font-size:25px">'+(['🥇','🥈','🥉'][i]||'🏅')+'</span>','<strong>'+clean(p.name)+'</strong><small>จับ '+num(p.captures)+' · ชนะ '+num(p.wins)+'</small>','<span class="badge '+(p.online?'green':'')+'">'+(p.online?'ออนไลน์':'ออฟไลน์')+'</span>')).join(''):'<p class="muted">ยังไม่มีผู้เล่นในตารางอันดับ</p>')+'</div></div>'+
 '<div class="notice">สถานะออนไลน์เป็นการตรวจว่าผู้เล่นติดต่อเซิร์ฟเวอร์เมื่อไม่นานมานี้ ยังไม่ใช่ระบบเห็นตัวละครเดินพร้อมกันหรือ PvP เรียลไทม์</div></div>';
}
function profile(){
 return '<div class="page-width">'+title('⚙️ บัญชีและการบันทึก','แยกข้อมูลออนไลน์กับเดโมออฟไลน์อย่างชัดเจน')+
 '<div class="panel-grid"><div class="panel"><h2>👤 โปรไฟล์</h2><div class="stat-tile"><b>'+clean(state.player.name)+'</b><span>สัตว์ '+state.pets.length+' ตัว · ทีมเลเวล '+maxLevel()+'</span></div>'+
 '<label class="field-label">ชื่อใหม่ (2–20 ตัวอักษร)</label><input class="input" id="rename" maxlength="20" placeholder="ตั้งชื่อผู้ฝึก"><div class="actions">'+button('บันทึกชื่อ','rename')+'</div></div>'+
 '<div class="panel"><h2>🔐 บัญชีออนไลน์</h2><p class="muted">'+(online?'✅ กำลังใช้ข้อมูลจาก Supabase':'⚠️ โหมดเดโม: ข้อมูลอยู่ในเครื่อง ไม่เชื่อมกับบัญชีออนไลน์')+'</p>'+
 '<label class="field-label">อีเมล</label><input class="input" id="email" type="email" autocomplete="email" placeholder="you@example.com">'+
 '<label class="field-label">รหัสผ่าน อย่างน้อย 8 ตัว</label><input class="input" id="pass" type="password" autocomplete="current-password" placeholder="••••••••">'+
 '<div class="actions">'+button('เข้าสู่ระบบ','signin')+button('สมัครใหม่','signup','','ghost')+button('ออกจากระบบ','logout','','red')+'</div>'+
 '<p class="muted">บัญชีใหม่อาจต้องยืนยันอีเมลก่อน</p></div></div>'+
 '<div class="notice">เวอร์ชัน V0.2 เป็นการปรับระบบเกมและ UI ใหม่บนฐานข้อมูลเดิม ไม่ย้ายหรือลบสัตว์จากบัญชีเดิม · <a href="./legacy.html">กลับหน้ารุ่นก่อนหน้า</a></div></div>';
}
function more(){
 return '<div class="page-width">'+title('☰ เมนูทั้งหมด','เลือกระบบที่ต้องการใช้งาน')+
 '<div class="sheet">'+nav.map(n=>'<button class="creature-card" data-action="route" data-value="'+n[0]+'" style="min-height:95px;text-align:center"><div style="font-size:32px">'+n[1]+'</div><div class="name">'+n[2]+'</div></button>').join('')+'</div></div>';
}
function render(){
 navDraw();
 const views={home,explore,battle,team:teamView,dex,detail,evolve,map,shop,bag,quests,social,profile,pet:petDetails,more};
 $('view').innerHTML=(views[page]||home)();
}
async function apiClient(){if(!SUPA||!PUB)throw Error('ยังไม่ได้ตั้งค่า Supabase');if(!client){const m=await import('https://esm.sh/@supabase/supabase-js@2.57.0');client=m.createClient(SUPA,PUB,{auth:{persistSession:true,autoRefreshToken:true}});}return client;}
async function remote(action,data={}){
 const c=await apiClient(),s=await c.auth.getSession(),token=s.data.session?.access_token;
 if(!token)throw Error('กรุณาเข้าสู่ระบบก่อน');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
 let resp;
 try{resp=await fetch(API,{method:'POST',signal:controller.signal,headers:{'Content-Type':'application/json','apikey':PUB,'Authorization':'Bearer '+token},body:JSON.stringify({action,...data})});}
 finally{clearTimeout(timer);}
 let obj;
 try{obj=await resp.json()}catch(_){throw Error('เซิร์ฟเวอร์ไม่ส่งข้อมูลที่อ่านได้')}
 if(!resp.ok||!obj.ok)throw Error(obj.error||'Server rejected action');
 state=obj;online=true;return obj.message||'';
}
function demo(action,data={}){
 let p=state.player,own=state.pets,w=state.wild;let msg='';
 const owned=x=>own.find(o=>String(o.id)===String(x));
 const alive=()=>own.filter(x=>x.slot!=null&&x.hp>0).sort((a,b)=>a.slot-b.slot)[0];
 const log=(name,id)=>{state.journal.unshift({type:name,speciesId:id,time:new Date().toISOString()});state.journal=state.journal.slice(0,12);};
 if(action==='starter'){
  let id=Number(data.speciesId);if(own.length||![1,5,9].includes(id))throw Error('เลือกสัตว์เริ่มต้นได้ครั้งเดียว');
  let m=get(id);own.push({id:Date.now(),speciesId:id,level:5,exp:0,hp:m.hp+15,maxHp:m.hp+15,slot:1,atk:m.atk+10,def:m.def+5});
  msg='ได้คู่หูตัวแรก '+m.name;
 }else if(action==='explore'){
  if(!own.length)throw Error('กรุณาเลือกคู่หูก่อน');
  if(state.wild)throw Error('ต้องต่อสู้ จับ หรือหนีก่อน');
  let f=(p.area*3+Math.floor(Math.random()*5))%25,st=p.area>3&&Math.random()<.3?1:0,id=f*4+st+1;
  if(Math.random()<.07)id=(20+Math.floor(Math.random()*5))*4+1;
  let m=get(id),lv=p.area*6+Math.floor(Math.random()*7)+2;
  state.wild={speciesId:id,name:m.name,level:lv,hp:m.hp+lv*3,maxHp:m.hp+lv*3,turns:0,rarity:m.rarity};
  msg='พบ '+m.name+' Lv.'+lv;
 }else if(action==='flee'){state.wild=null;msg='หนีจากสัตว์ป่าแล้ว';}
 else if(action==='attack'){
  if(!w)throw Error('ยังไม่พบสัตว์ป่า');let a=alive();if(!a)throw Error('สัตว์ในทีมหมดแรง');
  let foe=get(w.speciesId),move=Number(data.move);
  if(!Number.isInteger(move)||move<0||move>3)throw Error('ท่าโจมตีไม่ถูกต้อง');
  const dmg=Math.max(1,Math.floor((get(a.speciesId).atk+a.level*2)*(.7+move*.19)*(.86+Math.random()*.30)-foe.def*.22));
  w.hp=Math.max(0,w.hp-dmg);msg='โจมตี '+dmg+' ดาเมจ';
  if(!w.hp){let xp=w.level*16+60,coin=w.level*9+30;a.exp+=xp;
   if(a.exp>=a.level*30&&a.level<80){a.level++;a.exp=0;a.maxHp+=4;a.hp=Math.min(a.maxHp,a.hp+4);a.atk=get(a.speciesId).atk+a.level*2;a.def=get(a.speciesId).def+a.level;}
   p.coins+=coin;p.wins++;p.xp+=xp;state.wild=null;msg+=' · ชนะ! +'+xp+' EXP +'+coin+' เหรียญ';
  }else{let back=Math.max(1,Math.floor((foe.atk+w.level*2)*(.16+Math.random()*.2)-3));a.hp=Math.max(0,a.hp-back);w.turns++;msg+=' · โดนสวนกลับ -'+back+' HP';}
 }else if(action==='capture'){
  if(!w)throw Error('ยังไม่พบสัตว์ป่า');if(p.balls<=0)throw Error('บอลหมด');
  if(own.length>=300)throw Error('คลังเต็ม');const a=alive();if(!a)throw Error('สัตว์ในทีมหมดแรง');
  p.balls--;let m=get(w.speciesId),base=m.rarity===4?.09:m.rarity===3?.19:m.rarity===2?.32:.58;
  const prob=Math.min(.92,base/(1+m.stage*.52)*(1.6-w.hp/w.maxHp)*(.9+Math.random()*.2));
  if(Math.random()<prob){const sl=[1,2,3,4,5,6].find(i=>!own.some(x=>x.slot===i))||null;
   own.push({id:Date.now()+Math.random(),speciesId:w.speciesId,level:w.level,exp:0,hp:m.hp+w.level*3,maxHp:m.hp+w.level*3,slot:sl,atk:m.atk+w.level*2,def:m.def+w.level});
   p.captures++;p.coins+=20;log('catch',w.speciesId);state.wild=null;msg='🎉 จับ '+m.name+' สำเร็จ!';
  }else{let back=Math.max(1,Math.floor((m.atk+w.level)*(.12+Math.random()*.2)));a.hp=Math.max(0,a.hp-back);w.turns++;msg='จับไม่สำเร็จ! โดนสวนกลับ -'+back+' HP';}
 }else if(action==='team'){
  let a=owned(data.petId),slot=Number(data.slot);if(!a||!Number.isInteger(slot)||slot<0||slot>6)throw Error('จัดทีมไม่สำเร็จ');
  for(let x of own)if(x.slot===slot)x.slot=null;a.slot=slot||null;msg='จัดทีมแล้ว';
 }else if(action==='evolve'){
  let a=owned(data.petId);if(!a)throw Error('ไม่มีสัตว์นี้');let m=get(a.speciesId);
  const target=[0,12,28,48][m.stage+1];if(m.stage===3||a.level<target)throw Error('ยังไม่ถึงเลเวลวิวัฒนาการ');
  a.speciesId++;m=get(a.speciesId);a.maxHp=m.hp+a.level*3;a.hp=a.maxHp;a.atk=m.atk+a.level*2;a.def=m.def+a.level;log('evolve',m.id);msg='วิวัฒนาการเป็น '+m.name+'!';
 }else if(action==='area'){
  let i=Number(data.area);if(!Number.isInteger(i)||i<0||i>9||maxLevel()<i*6+1)throw Error('ยังไม่ถึงเลเวลเข้าแผนที่');
  p.area=i;state.wild=null;msg='เดินทางถึง '+areas[i][0];
 }else if(action==='shop'){
  let item=data.item,n=Number(data.quantity),price=(item==='balls'?85:120)*n;
  if(!['balls','potions'].includes(item)||!Number.isInteger(n)||n<1||n>20||p.coins<price)throw Error('เงินไม่พอหรือข้อมูลผิด');
  p.coins-=price;p[item]+=n;msg='ซื้อไอเทมสำเร็จ';
 }else if(action==='heal'){
  if(p.potions<1)throw Error('ยาฟื้นฟูหมด');p.potions--;
  for(let x of own)if(x.slot!=null)x.hp=x.maxHp;msg='รักษาสัตว์ในทีมสำเร็จ';
 }else if(action==='daily'){
  const d=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Bangkok'});
  if(p.dailyClaim===d)throw Error('รับรางวัลวันนี้ไปแล้ว');
  p.dailyClaim=d;p.coins+=600;p.balls+=7;p.potions+=2;msg='รับรางวัลรายวันแล้ว';
 }else if(action==='rename'){
  let name=String(data.name||'').trim();if(name.length<2||name.length>20)throw Error('ชื่อยาว 2–20 ตัวอักษร');
  p.name=name;msg='เปลี่ยนชื่อผู้ฝึกแล้ว';
 }else if(!['state','login'].includes(action))throw Error('ไม่รองรับคำสั่ง');
 return msg;
}
async function action(act,data={}){
 if(busy)return;busy=true;lastAction=act;
 try{const txt=online?await remote(act,data):demo(act,data);store();if(txt)message(txt);
 if(act==='explore'&&state.wild)page='battle';
 if(act==='area'&&!state.wild)page='explore';
 if(act==='starter')page='team';
 if(act==='evolve')page='pet';
 render();
 }catch(e){message(e?.message||'เกิดข้อผิดพลาด');console.warn('Monster World action',act,String(e));}
 finally{busy=false;}
}
async function login(signup){
 if(busy)return;const email=$('email')?.value?.trim(),password=$('password')?.value||'';
 if(!email||!email.includes('@')||password.length<8){message('ระบุอีเมลและรหัสผ่านอย่างน้อย 8 ตัว');return;}
 busy=true;
 try{const c=await apiClient();const response=signup?await c.auth.signUp({email,password}):await c.auth.signInWithPassword({email,password});
 if(response.error)throw response.error;
 if(response.data.session?.access_token){await remote('login');page='home';render();message('✅ เข้าสู่ระบบออนไลน์สำเร็จ');}
 else message('สมัครเรียบร้อย ตรวจอีเมลเพื่อยืนยันก่อนเข้าสู่ระบบ');
 }catch(e){message(e.message||'เข้าสู่ระบบไม่สำเร็จ');}
 finally{busy=false;}
}
async function signout(){
 try{if(client)await client.auth.signOut();}catch(_){}
 online=false;state=init();
 try{let s=JSON.parse(localStorage.getItem('monster-world-demo-v1')||'null');if(s&&s.player)state=s;}catch(_){}
 page='home';render();message('ออกจากบัญชีแล้ว กลับสู่เดโม');
}
async function boot(){
 render();
 try{const c=await apiClient();const s=await c.auth.getSession();if(s.data.session?.access_token){await remote('login');render();message('โหลดสัตว์ของคุณจากเซิร์ฟเวอร์แล้ว');}}
 catch(e){console.info('Use local demo mode',String(e));}
}
document.addEventListener('click',async e=>{
 let node=e.target.closest('[data-route]');if(node){saveView(node.dataset.route);return;}
 node=e.target.closest('[data-detail]');if(node){detailId=Number(node.dataset.detail);saveView('detail');return;}
 node=e.target.closest('[data-type]');if(node){filter=node.dataset.type;render();return;}
 node=e.target.closest('[data-action]');if(!node)return;
 let name=node.dataset.action,val=node.dataset.value||'';
 if(name==='route'){saveView(val);return;}
 if(name==='more'){saveView('more');return;}
 if(name==='pet'){petId=val;saveView('pet');return;}
 if(name==='signin'||name==='signup'){await login(name==='signup');return;}
 if(name==='logout'){await signout();return;}
 if(name==='rename'){await action('rename',{name:$('rename')?.value||''});return;}
 if(name==='starter'){await action('starter',{speciesId:Number(val)});return;}
 if(name==='attack'){await action('attack',{move:Number(val)});return;}
 if(name==='evolve'){await action('evolve',{petId:val});return;}
 if(name==='team'){let[a,b]=val.split(':');await action('team',{petId:a,slot:Number(b)});return;}
 if(name==='area'){await action('area',{area:Number(val)});return;}
 if(name==='shop'){let[a,b]=val.split(':');await action('shop',{item:a,quantity:Number(b)});return;}
 await action(name);
});
document.addEventListener('input',e=>{
 if(e.target?.id==='search'){
  q=e.target.value;
  const list=$('dex-list');if(!list)return;
  const savedScroll=window.scrollY;
  const matches=petsDB.filter(m=>(filter==='ทั้งหมด'||m.type===filter)&&(!q||m.name.includes(q)||String(m.id).includes(q)));
  const owned=collected();
  list.innerHTML=matches.map(m=>'<button class="creature-card '+(!owned.has(m.id)?'locked':'')+'" data-detail="'+m.id+'">'+art(m.id,'normal',!owned.has(m.id))+'<div class="number">#'+String(m.id).padStart(3,'0')+'</div><div class="name">'+clean(m.name)+'</div><div class="sub">'+elements[m.type][2]+' '+m.type+' · ★'+m.rarity+'</div></button>').join('');
 }
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&online&&!busy)action('state')});
setInterval(()=>{if(online&&!document.hidden&&!busy&&page==='social')action('state')},30000);
boot();
