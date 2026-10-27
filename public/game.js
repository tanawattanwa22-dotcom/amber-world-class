/* AMBER WORLD CLASS v0.5 — original playable client. Offline mode is a sandbox.
   In online mode all authoritative stats, movements, kills, rewards and damage come from server.
   No pre-existing 55 AMBERLANDS resources or database IDs are used. */
const $ = id => document.getElementById(id);
const WORLD=1152, FRAME=48, TAU=Math.PI*2;
const MAPS=[
 ['หมู่บ้านอำพัน',1,10,'ราชาสไลม์','Amber Village'],
 ['ป่ามรกต',5,15,'จอมไม้โบราณ','Emerald Forest'],
 ['ทุ่งสายลม',10,25,'ราชาอินทรีสายฟ้า','Wind Meadow'],
 ['นครหินผา',20,35,'ผู้พิทักษ์หินผา','Stonehold'],
 ['ทะเลทรายเพลิง',30,45,'ฟาโรห์ทราย','Searing Desert'],
 ['ภูเขาหิมะ',40,60,'มังกรน้ำแข็ง','Snowhaven'],
 ['หุบเขามังกร',55,80,'มังกรเพลิงอัคคี','Dragon Rift'],
 ['นครรัตติกาล',70,100,'ราชินีรัตติกาล','Nocturne'],
 ['ดินแดนสวรรค์',80,100,'เทพธิดาแห่งแสง','Sky Sanctum'],
 ['ป้อมจอมมาร',100,100,'จอมมารอมตะ','Demon Citadel']
];
const MOBNAMES=['สไลม์มรกต','สไลม์แดง','ภูตคริสตัล','หมาป่าทะเลทราย','ภูตน้ำแข็ง','นักรบหิน','ภูตเพลิง','แม่มดรัตติกาล','นักรบสวรรค์','ปีศาจเงา'];
const CLASSES=['Sword','Archer','Mage','Fighter'];
const classDesc=['นักดาบระยะประชิด ป้องกันสูง','นักธนูโจมตีระยะไกล','จอมเวทสายพลังเวท','นักสู้หมัดคอมโบ'];
const expMax=lvl=>120+lvl*45;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const asset=(s)=>`./assets/${s}?v=05`;
const loadImage=(path)=>new Promise((resolve)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>resolve(null);im.src=path;});
const cfg=window.AWC_CONFIG||{};
const edgeMode=Boolean(cfg.edgeFunctionUrl);
const onlineConfigured=Boolean(cfg.supabaseUrl&&cfg.supabasePublishableKey&&(cfg.gameServerWebSocketUrl||cfg.edgeFunctionUrl));
let authClient=null, socket=null, online=false, currentUid=null;
let loggedIn=false, ready=false, mapImgs=[], heroImgs=[],mobImgs=[],bossImgs=[],wingImgs=[];
const sprites={};
const spawnPoints=[[336,610],[760,490],[300,830],[842,760],[540,330],[936,400],[250,390],[800,900]];
const defaultHero=()=>({id:'local',name:'Hero',level:1,exp:0,mapId:0,x:570,y:656,classId:-1,statPoints:0,STR:0,DEX:0,INT:0,POW:0,VIT:0,atk:24,def:7,hp:110,maxHp:110,mp:70,maxMp:70,gold:250,gems:10,potions:10,mobKills:0,questKills:0,cardCount:0});
let player=defaultHero();
try{const v=JSON.parse(localStorage.getItem('awc-demo-hero-v1')||'null');if(v&&typeof v.level==='number')player={...player,...v,id:'local'};}catch{}
let mobs=[], otherPlayers=[], effects=[],combatAnimations=[],skillImgs=[],input={jx:0,jy:0,keys:new Set(),target:null},auto=false,modal=null,modalCb=null,collapsed=false;
let frameTime=0,last=0,animTick=0,shake=0,regenTimer=0, attackTimer=0,skillTimer=0,netInputTimer=0;
const canvas=$('world'),ctx=canvas.getContext('2d',{alpha:false});
let screenW=400,screenH=700,dpr=1;
function resize(){const rect=canvas.getBoundingClientRect();screenW=rect.width;screenH=rect.height;dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(screenW*dpr);canvas.height=Math.round(screenH*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingEnabled=false;}
function text(msg){$('game-log').textContent='✦ '+msg;}
function toast(msg){const t=document.createElement('div');t.className='toast';t.textContent=msg;$('toasts').appendChild(t);setTimeout(()=>t.remove(),2250);}
function showModal(title,html){modal=title;$('modal-title').textContent=title;$('modal-body').innerHTML=html;$('overlay').classList.remove('hidden');}
function closeModal(){modal=null;$('overlay').classList.add('hidden');}
$('modal-close').addEventListener('click',closeModal);
$('overlay').addEventListener('click',(e)=>{if(e.target===$('overlay'))closeModal();});
function saveOffline(){if(!online)try{localStorage.setItem('awc-demo-hero-v1',JSON.stringify(player));}catch{}}
function makeMobs(mapId){const level=MAPS[mapId][1];return spawnPoints.map(([x,y],i)=>({id:`m${mapId}-${i}`,type:(mapId+i%3)%10,level:level+i%3,x,y,homeX:x,homeY:y,hp:90+mapId*62+i*13,maxHp:90+mapId*62+i*13,alive:true,boss:false,respawn:0,phase:i*3.2})).concat([{id:`boss${mapId}`,type:(mapId+7)%10,level:MAPS[mapId][2],x:945,y:855,homeX:945,homeY:855,hp:850+mapId*400,maxHp:850+mapId*400,alive:true,boss:true,respawn:0,phase:0}]);}
function setMap(id,fromServer=false){if(!Number.isInteger(id)||id<0||id>=MAPS.length)return;if(online&&!fromServer){if(edgeMode)edgeAction({type:'travel',mapId:id});else socket?.send(JSON.stringify({type:'travel',mapId:id}));return;}player.mapId=id;player.x=560;player.y=640;input.target=null;mobs=makeMobs(id);$('zone-name').textContent=MAPS[id][0];$('zone-lv').textContent=`Lv.${MAPS[id][1]}–${MAPS[id][2]}`;$('quest-title').textContent=`กำจัดมอนสเตอร์ ${Math.min(5,player.questKills)}/5`;closeModal();text('เข้าสู่พื้นที่ '+MAPS[id][0]);if(!online)saveOffline();}
function updateHUD(){const hp=clamp(player.hp/player.maxHp,0,1)*100;const mp=clamp(player.mp/player.maxMp,0,1)*100;const xp=clamp(player.exp/expMax(player.level),0,1)*100;
 $('hp-bar').style.width=hp+'%';$('hp-text').textContent=`${Math.ceil(player.hp)} / ${player.maxHp}`;
 $('mp-bar').style.width=mp+'%';$('mp-text').textContent=`${Math.ceil(player.mp)} / ${player.maxMp}`;
 $('exp-bar').style.width=xp+'%';$('exp-text').textContent=`${player.exp} / ${expMax(player.level)} EXP`;
 $('player-name').textContent=player.name;$('player-level').textContent=`Lv.${player.level}`;$('coins').textContent=Number(player.gold).toLocaleString();$('gems').textContent=player.gems;$('potions-count').textContent=player.potions;
 const portrait=$('portrait'),portraitClass=Math.max(0,Math.min(3,player.classId||0));
 portrait.textContent='';portrait.classList.add('pixel-portrait');
 portrait.style.backgroundImage=`url("./assets/sprites/hero-${portraitClass}.png?v=04")`;$('skill-cd').textContent=skillTimer>0?Math.ceil(skillTimer/1000):'';
 $('mode-state').textContent=online?'● ONLINE · SERVER':'● DEMO OFFLINE';$('mode-state').style.color=online?'#9fffa5':'#f1d38e';
 $('quest-title').textContent=`กำจัดมอนสเตอร์ ${Math.min(5,player.questKills)}/5`;
}
function targetMonster(){return mobs.filter(m=>m.alive&&m.hp>0).sort((a,b)=>distance(a,player)-distance(b,player))[0]||null;}
function nearestInRange(range){return mobs.filter(m=>m.alive&&m.hp>0&&distance(m,player)<range).sort((a,b)=>distance(a,player)-distance(b,player))[0]||null;}
function fx(x,y,label,color='#fff2bd'){effects.push({x,y,label,color,t:1000});}
function spawnSkillSprite(x,y,job,small=false){
 combatAnimations.push({x,y,job:Math.max(0,Math.min(3,Number(job)||0)),started:animTick,small});
 if(combatAnimations.length>25)combatAnimations.shift();
}
function offlineHit(skill=false){const range=skill?190:player.classId===1||player.classId===2?155:100;const enemy=nearestInRange(range);
 if(!enemy){text('ไม่มีมอนสเตอร์ในระยะโจมตี');return;}
 const cost=skill?15:0;if(player.mp<cost){toast('MP ไม่เพียงพอ');return;}
 if(skill)player.mp-=cost;
 const atk=player.atk+(player.level*2)+(player.classId<0?0:player.classId*4);
 const damage=Math.max(1,Math.floor(atk*(skill?2.35:1)*(0.86+Math.random()*.28)-enemy.level*.48));
 enemy.hp=Math.max(0,enemy.hp-damage);fx(enemy.x,enemy.y-35,damage.toLocaleString(),skill?'#cf9cff':'#ffe9a0');spawnSkillSprite(enemy.x,enemy.y,player.classId, !skill);shake=skill?4:1.6;
 if(enemy.hp===0){enemy.alive=false;enemy.respawn=enemy.boss?26000:9000;const exp=enemy.boss?550+enemy.level*9:55+enemy.level*8;const gold=enemy.boss?600:16+enemy.level*3;player.exp+=exp;player.gold+=gold;player.mobKills++;player.questKills++;
   text(`กำจัด ${enemy.boss?MAPS[player.mapId][3]:MOBNAMES[enemy.type]} • +${exp} EXP • +${gold} Gold`);
   if(player.questKills===5){player.exp+=250;player.gold+=100;toast('ภารกิจสำเร็จ! EXP +250 · Gold +100');}
   if(Math.random()<.12){player.potions++;toast('ได้รับ ยาฟื้นฟู HP x1');}
   while(player.level<100&&player.exp>=expMax(player.level)){player.exp-=expMax(player.level);player.level++;player.statPoints+=5;player.maxHp+=30;player.maxMp+=10;player.hp=player.maxHp;player.mp=player.maxMp;player.atk+=3;player.def+=1;toast('LEVEL UP! LV.'+player.level);text('เลเวล '+player.level+' · ได้รับ 5 แต้มสถานะ');if(player.level===10&&player.classId===-1)setTimeout(showClasses,650);}
   if(player.level===100)player.exp=0;
 }
 saveOffline();}
function attack(skill=false){if(online){if(edgeMode){if(skill&&skillTimer>0||!skill&&attackTimer>0)return;if(skill)skillTimer=3500;else attackTimer=480;edgeAction({type:skill?'skill':'attack',targetId:targetMonster()?.id||null});}else socket?.send(JSON.stringify({type:skill?'skill':'attack',targetId:targetMonster()?.id||null}));return;}
 if(skill){if(skillTimer>0)return;skillTimer=3500;offlineHit(true);}else{if(attackTimer>0)return;attackTimer=480;offlineHit(false);}}
function potion(){if(online){if(edgeMode)edgeAction({type:'potion'});else socket?.send(JSON.stringify({type:'potion'}));return;}if(player.potions<=0){toast('ยาหมดแล้ว');return;}if(player.hp>=player.maxHp){toast('HP เต็มแล้ว');return;}player.potions--;player.hp=Math.min(player.maxHp,player.hp+80+player.level*6);toast('ใช้ยาฟื้นฟู HP');saveOffline();}
$('do-attack').onclick=()=>attack(false);$('do-skill').onclick=()=>attack(true);$('use-potion').onclick=potion;
$('toggle-auto').onclick=()=>{auto=!auto;$('toggle-auto').classList.toggle('active',auto);$('toggle-auto').textContent=auto?'⚔ AUTO : ON':'⚔ AUTO : OFF';toast(auto?'เริ่มโจมตีอัตโนมัติ':'หยุด AUTO');};
function allocateStat(code){
 if(!['STR','DEX','INT','POW','VIT'].includes(code)||player.statPoints<=0)return;
 if(online){edgeAction({type:'allocateStat',stat:code});return;}
 player.statPoints--;
 player[code]=(player[code]||0)+1;
 if(code==='STR')player.atk+=2;
 else if(code==='DEX')player.atk+=1;
 else if(code==='POW')player.atk+=3;
 else if(code==='VIT'){player.def+=2;player.maxHp+=12;player.hp+=12;}
 else if(code==='INT'){player.maxMp+=8;player.mp+=8;}
 saveOffline();openPanel('character');
}
function showClasses(){if(online){toast('เลือกอาชีพจะบันทึกที่เซิร์ฟเวอร์');}showModal('เลือกอาชีพหลัก · Level 10',`<p>เลือกหนึ่งใน 4 อาชีพ เมื่อเลือกแล้วจะเข้าสู่สายพัฒนา POW / DEX / INT ในอนาคต</p><div class="class-grid">${CLASSES.map((name,k)=>`<button class="class-choice" data-class="${k}"><span class="job-sprite-icon" style="background-image:url('./assets/sprites/hero-${k}.png?v=04')"></span><b>${name}</b><small>${classDesc[k]}</small></button>`).join('')}</div>`);
 document.querySelectorAll('[data-class]').forEach(b=>b.onclick=()=>{const kind=Number(b.dataset.class);if(online){if(edgeMode)edgeAction({type:'chooseClass',classId:kind});else socket?.send(JSON.stringify({type:'chooseClass',classId:kind}));closeModal();return;}player.classId=kind;player.atk+=8;toast('เปลี่ยนอาชีพเป็น '+CLASSES[kind]);saveOffline();closeModal();});}
function showMaps(){showModal('แผนที่โลก · World Map',`<p>ภาพแผนที่ 10 ฉากที่วาดใหม่ แผนที่ทั้งหมดเปิดให้สำรวจได้ในโหมดเดโม</p><div class="map-grid">${MAPS.map((m,i)=>`<button class="map-option" data-map="${i}"><img src="${asset(`maps/map-${String(i+1).padStart(2,'0')}.png`)}" alt="${m[0]}"><span>${i+1}. ${m[0]}<small>Lv.${m[1]}–${m[2]} · ${m[3]}</small></span></button>`).join('')}</div>`);document.querySelectorAll('[data-map]').forEach(el=>el.onclick=()=>setMap(Number(el.dataset.map)));}
$('open-maps').onclick=showMaps;
$('open-menu').onclick=()=>openPanel('menu');
$('quest-collapse').onclick=()=>{collapsed=!collapsed;$('quest-content').style.display=collapsed?'none':'block';$('quest-collapse').textContent=collapsed?'+':'−';};
function openPanel(id){if(id==='maps')return showMaps();const s=(v)=>`<div class="stat-line"><b>${v[0]}</b><span>${v[1]}</span></div>`;switch(id){
 case 'character': showModal('ตัวละครและค่าสเตตัส',`<h3>🧑 ${player.name} · Lv.${player.level} ${CLASSES[player.classId]||'Novice'}</h3>${[['HP',`${player.hp}/${player.maxHp}`],['MP',`${player.mp}/${player.maxMp}`],['ATK',player.atk],['DEF',player.def],['แต้มสถานะ',player.statPoints],['มอนสเตอร์ที่กำจัด',player.mobKills]].map(s).join('')}<h3>เพิ่มค่าสเตตัส (มี ${player.statPoints} แต้ม)</h3>${['STR','DEX','INT','POW','VIT'].map(code=>`<div class="stat-line"><b>${code} · ${Number(player[code]||0)}</b><button class="secondary" data-stat="${code}" ${player.statPoints<=0?'disabled':''}>+ 1</button></div>`).join('')}<p>เลเวล 10 สามารถเลือกอาชีพได้ เมื่อถึงเลเวล 100 จะเป็นเลเวลสูงสุด</p>${player.level>=10&&player.classId<0?'<button class="primary" id="choose-job">เลือกอาชีพ</button>':''}<hr><p>เฉพาะเดโมออฟไลน์: ใช้ปุ่มด้านล่างทดสอบระบบเลเวล 10</p><button class="secondary" id="demo-lv10" ${online?'disabled':''}>ทดสอบ Level 10</button>`);document.querySelectorAll('[data-stat]').forEach(b=>b.onclick=()=>allocateStat(b.dataset.stat));$('choose-job')?.addEventListener('click',showClasses);$('demo-lv10').onclick=()=>{if(online)return;player.level=10;player.exp=0;player.maxHp=380;player.maxMp=160;player.hp=380;player.mp=160;player.statPoints+=45;player.atk+=25;saveOffline();showClasses();};break;
 case 'skills':showModal('ทักษะ · Skills',`<h3>✨ ${CLASSES[player.classId]||'Novice'}</h3><div class="item-card"><div><b>โจมตีปกติ</b><br><small>ดาเมจคำนวณจาก ATK / เลเวล</small></div><span>⚔️</span></div><div class="item-card"><div><b>Arc Burst</b><br><small>สร้างดาเมจ 235% · ใช้ MP 15 · CD 3.5 วินาที</small></div><span>✦</span></div><p>โครงสร้างสกิล 120 ท่าจะเพิ่มเป็น Sprite Sheet แบบเฟรมจริงใน Phase 4</p>`);break;
 case 'inventory':showModal('กระเป๋า · Inventory',`<div class="item-card"><div><b>🧪 ยาฟื้นฟู HP</b><br><small>ใช้ฟื้นฟู HP ระหว่างต่อสู้</small></div><b>x ${player.potions}</b></div><div class="item-card"><div><b>🪙 Gold</b><br><small>ได้จากการกำจัดมอนสเตอร์</small></div><b>${player.gold}</b></div><div class="item-card"><div><b>💎 Gems</b><br><small>สกุลเงินทดสอบ</small></div><b>${player.gems}</b></div><p>ช่องอุปกรณ์ การ์ด หินตีบวก และของบอสจะเพิ่มในเฟสถัดไป</p>`);break;
 case 'party':showModal('ปาร์ตี้ · Party',`<h3>🛡️ ระบบปาร์ตี้</h3><p>พัฒนาต่อใน Phase 5: เชิญเพื่อน สถานะออนไลน์ และแชร์ EXP โดยเซิร์ฟเวอร์</p><p>โหมดเดโมเป็นการเล่นคนเดียว จึงยังไม่สามารถสร้างปาร์ตี้ออนไลน์ได้</p>`);break;
 case 'ranking':showModal('อันดับผู้เล่น · Ranking',`<h3>🏆 AMBER WORLD TOP 3</h3><p>อันดับตามจำนวนมอนสเตอร์ที่กำจัด บันทึกจากเซิร์ฟเวอร์เท่านั้น</p>${topThreeHtml()}`);break;
 case 'menu':showModal('เมนู · System',`<div class="item-card"><div><b>🗺️ เลือกแผนที่</b><small> · 10 ฉาก</small></div><button class="secondary" id="btn-map">เปิด</button></div><div class="item-card"><div><b>🎮 โหมดเล่น</b><br><small id="mode-detail">${online?'ออนไลน์ เซิร์ฟเวอร์ควบคุม':'ออฟไลน์ ข้อมูลอยู่ในเครื่อง (แก้ไขได้)'}</small></div></div><div class="item-card"><div><b>🔐 Google Login</b><br><small>${onlineConfigured?'พร้อมตั้งค่าเชื่อมต่อ':'ต้องตั้งค่า Supabase + Game Server ใหม่ก่อน'}</small></div><button class="primary" id="btn-login" ${onlineConfigured?'':'disabled'}>${online?'ออนไลน์':'เข้าสู่ระบบ'}</button></div><div class="item-card"><div style="width:100%"><b>✉️ เข้าสู่ระบบด้วยอีเมล</b><input id="awc-email" class="awc-auth-input" placeholder="อีเมล" autocomplete="email" type="email"><input id="awc-password" class="awc-auth-input" placeholder="รหัสผ่าน 8 ตัวขึ้นไป" autocomplete="current-password" type="password"><div style="display:flex;gap:8px;margin-top:8px"><button class="primary" id="btn-email-login">เข้าสู่ระบบ</button><button class="secondary" id="btn-email-register">สมัครบัญชี</button><button class="secondary" id="btn-logout">ออกระบบ</button></div></div></div><div class="item-card"><div><b>🖼️ ASSET LAB V0.5</b><br><small>ดูแผนที่ 10 ฉาก บอส 10 ตัว ปีก 4 ชุด และเอฟเฟกต์ 16 เฟรมจริง</small></div><button class="secondary" id="btn-asset-lab">เปิด</button></div><div class="item-card"><div><b>📦 Version</b><br><small>Amber World Class V0.5 · Sprite & World Art Upgrade</small></div></div><p>GitHub และ Supabase ของ 55 AMBERLANDS เดิมไม่ได้ถูกเชื่อมกับโปรเจกต์นี้</p>`);$('btn-map').onclick=showMaps;$('btn-asset-lab').onclick=()=>location.assign('./asset-gallery.html?v=05');$('btn-login').onclick=loginOnline;$('btn-email-login').onclick=()=>passwordAuth(false);$('btn-email-register').onclick=()=>passwordAuth(true);$('btn-logout').onclick=logoutOnline;break;
 }}
document.querySelectorAll('[data-panel]').forEach(el=>el.addEventListener('click',()=>openPanel(el.dataset.panel)));
// Tap-to-move / joystick / keyboard
const joy=$('joy-area'),knob=$('joy-knob');let joyPointer=null;
function joyMove(e){const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let x=(e.clientX-cx)/41,y=(e.clientY-cy)/41;const l=Math.hypot(x,y);if(l>1){x/=l;y/=l;}input.jx=x;input.jy=y;knob.style.transform=`translate(${x*28}px,${y*28}px)`;}
joy.addEventListener('pointerdown',e=>{joyPointer=e.pointerId;joy.setPointerCapture(e.pointerId);input.target=null;joyMove(e);});
joy.addEventListener('pointermove',e=>{if(e.pointerId===joyPointer)joyMove(e);});
function stopJoy(e){if(e.pointerId!==joyPointer)return;joyPointer=null;input.jx=input.jy=0;knob.style.transform='translate(0,0)';}
joy.addEventListener('pointerup',stopJoy);joy.addEventListener('pointercancel',stopJoy);
const dirs={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]};
window.addEventListener('keydown',e=>{if(dirs[e.key]){e.preventDefault();input.keys.add(e.key)}if(e.key===' '){e.preventDefault();attack(false)}if(e.key==='Escape')closeModal();});
window.addEventListener('keyup',e=>input.keys.delete(e.key));window.addEventListener('blur',()=>{input.keys.clear();input.jx=input.jy=0;});
canvas.addEventListener('pointerup',e=>{if(modal)return;const rect=canvas.getBoundingClientRect();const cx=clamp(player.x-screenW/2,0,WORLD-screenW),cy=clamp(player.y-screenH/2,0,WORLD-screenH);const x=e.clientX-rect.left+cx,y=e.clientY-rect.top+cy;if(y>180)input.target={x:clamp(x,24,WORLD-24),y:clamp(y,24,WORLD-24)};});
function controls(){let x=input.jx,y=input.jy;for(const key of input.keys){if(dirs[key]){x+=dirs[key][0];y+=dirs[key][1];}}if(!x&&!y&&input.target){const dx=input.target.x-player.x,dy=input.target.y-player.y,l=Math.hypot(dx,dy);if(l<8)input.target=null;else{x=dx/l;y=dy/l;}}const n=Math.hypot(x,y);if(n>1){x/=n;y/=n;}return{x,y};}
function heading(dx,dy){if(!dx&&!dy)return null;const a=Math.atan2(dy,dx);return ((Math.round((a-Math.PI/2)/(Math.PI/4))%8)+8)%8;}
let facing=0,moving=false;
function update(dt){const ms=dt,sec=ms/1000;animTick+=ms;attackTimer=Math.max(0,attackTimer-ms);skillTimer=Math.max(0,skillTimer-ms);shake=Math.max(0,shake-ms/80);regenTimer+=ms;const v=controls();moving=(Math.abs(v.x)+Math.abs(v.y))>.05;
 if(moving){const d=heading(v.x,v.y);if(d!==null)facing=d;
 if(!online){const speed=168;player.x=clamp(player.x+v.x*speed*sec,22,WORLD-22);player.y=clamp(player.y+v.y*speed*sec,24,WORLD-20);}
 }
 if(online){netInputTimer+=ms;if(edgeMode){if(auto&&!moving&&attackTimer<=0){const e=targetMonster();if(e){const range=player.classId===1||player.classId===2?150:92;if(distance(e,player)>range)input.target={x:e.x,y:e.y};else attack(false);}}if(netInputTimer>=170){netInputTimer=0;if(moving)edgeAction({type:'move',dx:v.x,dy:v.y},true);}}else if(netInputTimer>=80&&socket?.readyState===WebSocket.OPEN){netInputTimer=0;socket.send(JSON.stringify({type:'input',dx:v.x,dy:v.y}));}}
 else {
  for(const m of mobs){if(!m.alive){m.respawn-=ms;if(m.respawn<=0){m.hp=m.maxHp;m.alive=true;m.x=m.homeX;m.y=m.homeY;}continue;}m.phase+=sec;
   const delta=distance(player,m);if(delta<85&&regenTimer>900&&player.hp>0){const damage=Math.max(1,Math.floor((m.level+7)*.25-player.def*.12));player.hp=Math.max(0,player.hp-damage);if(player.hp===0){player.hp=player.maxHp;player.x=560;player.y=640;toast('พ่ายแพ้! กลับจุดเกิด');saveOffline();}}
  }
  if(auto&&attackTimer<=0){const e=targetMonster();if(e){const d=distance(e,player);if(d>85){const ux=(e.x-player.x)/d,uy=(e.y-player.y)/d;player.x=clamp(player.x+ux*115*sec,20,WORLD-20);player.y=clamp(player.y+uy*115*sec,20,WORLD-20);const head=heading(ux,uy);if(head!==null)facing=head;moving=true;}else attack(false);}}
  if(regenTimer>=1100){regenTimer=0;if(player.mp<player.maxMp)player.mp=Math.min(player.maxMp,player.mp+1);saveOffline();}
 }
 effects=effects.filter(e=>(e.t-=ms)>0);combatAnimations=combatAnimations.filter(e=>animTick-e.started<720);updateHUD();}
function drawSprite(sheet,x,y,dir,frame,width=48,height=48){if(!sheet)return;ctx.drawImage(sheet,frame*FRAME,dir*FRAME,FRAME,FRAME,Math.round(x-width/2),Math.round(y-height*.82),width,height);}
function draw(){ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,screenW,screenH);ctx.fillStyle='#183a3c';ctx.fillRect(0,0,screenW,screenH);
 const img=mapImgs[player.mapId],camX=clamp(player.x-screenW/2,0,Math.max(0,WORLD-screenW)),camY=clamp(player.y-screenH/2,0,Math.max(0,WORLD-screenH));
 ctx.save();if(shake){ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);}
 if(img)ctx.drawImage(img,-camX,-camY,WORLD,WORLD);
 const entities=mobs.filter(m=>m.alive).map(m=>({...m,isPlayer:false}));entities.push({...player,isPlayer:true});for(const peer of otherPlayers)entities.push({...peer,isPlayer:true,isPeer:true});entities.sort((a,b)=>a.y-b.y);
 for(const ent of entities){let ex=Math.round(ent.x-camX),ey=Math.round(ent.y-camY);if(ex< -80||ey< -80||ex>screenW+80||ey>screenH+80)continue;
   if(ent.isPlayer){const w=59,h=59;const role=clamp(Number(ent.classId)||0,0,3);const im=heroImgs[role];const frame=!ent.isPeer&&moving?Math.floor(animTick/130)%4:0;const facingNow=ent.isPeer?(ent.facing||0):facing;drawSprite(wingImgs[role],ex,ey,facingNow,frame,w,h);drawSprite(im,ex,ey,facingNow,frame,w,h);
     ctx.fillStyle='#ffeab2';ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.shadowColor='#000';ctx.shadowBlur=4;ctx.fillText(ent.name,ex,ey-51);ctx.shadowBlur=0;
   }else {let boss=ent.boss;const scale=boss?2:1;const sheet=(boss?bossImgs[player.mapId]:null)||mobImgs[ent.type];const walkFrame=Math.floor((animTick+ent.phase*100)/320)%4;drawSprite(sheet,ex,ey,boss?0:0,walkFrame,52*scale,52*scale);
       if(ent.hp<ent.maxHp||boss){const bw=boss?96:44;ctx.fillStyle='#111726';ctx.fillRect(ex-bw/2,ey-(boss?91:45),bw,6);ctx.fillStyle=boss?'#ef7b43':'#cf4954';ctx.fillRect(ex-bw/2,ey-(boss?91:45),bw*clamp(ent.hp/ent.maxHp,0,1),6);ctx.strokeStyle='#f2cb77';ctx.lineWidth=1;ctx.strokeRect(ex-bw/2,ey-(boss?91:45),bw,6);}
       if(boss){ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.fillStyle='#ffd68e';ctx.strokeStyle='#181016';ctx.lineWidth=3;ctx.strokeText('★ '+MAPS[player.mapId][3],ex,ey-97);ctx.fillText('★ '+MAPS[player.mapId][3],ex,ey-97);}
   }
 }
 for(const e of combatAnimations){
  const sheet=skillImgs[e.job];if(!sheet)continue;
  const frame=Math.min(15,Math.max(0,Math.floor((animTick-e.started)/45)));
  const size=e.small?77:124;
  ctx.drawImage(sheet,(frame%4)*96,Math.floor(frame/4)*96,96,96,
   Math.round(e.x-camX-size/2),Math.round(e.y-camY-size*.82),size,size);
 }
 ctx.font='bold 17px system-ui';ctx.textAlign='center';for(const e of effects){ctx.globalAlpha=clamp(e.t/500,0,1);ctx.strokeStyle='#1b1525';ctx.lineWidth=3;ctx.strokeText(e.label,e.x-camX,e.y-camY-(1000-e.t)*.05);ctx.fillStyle=e.color;ctx.fillText(e.label,e.x-camX,e.y-camY-(1000-e.t)*.05);}ctx.globalAlpha=1;
 ctx.restore();}
function loop(now){const dt=clamp(now-last,0,45);last=now;if(ready){update(dt);draw();}requestAnimationFrame(loop);}

let edgePending=false,edgePoll=null,lastEdgeError=0,edgeReady=false,edgeQueue=[],leaders=[];
const rankingPeek=document.createElement('div');
rankingPeek.id='awc-ranking-peek';rankingPeek.className='awc-ranking-peek';rankingPeek.setAttribute('aria-label','อันดับผู้เล่น 1 ถึง 3');
document.body.appendChild(rankingPeek);
const htmlSafe=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function topThreeHtml(){
 if(!leaders.length)return '<small>ยังไม่มีอันดับออนไลน์</small>';
 return leaders.slice(0,3).map((p,i)=>{
  const job=Math.max(0,Math.min(3,Number(p.classId)||0));
  const name=htmlSafe(p.name);const lv=Math.max(1,Math.min(100,Number(p.level)||1));
  return '<div class="awc-rank-entry"><span>'+['🥇','🥈','🥉'][i]+'</span><span class="awc-rank-avatar" style="background-image:url(./assets/sprites/hero-'+job+'.png?v=05)"></span><span class="awc-rank-person"><b>'+name+'</b><small>Lv.'+lv+' · '+Number(p.kills||0)+' kills</small></span></div>';
 }).join('');
}
function renderLeaderPeek(){
 rankingPeek.style.display=(online&&leaders.length)?'block':'none';
 rankingPeek.innerHTML='<div class="awc-rank-heading">🏆 TOP 3</div>'+topThreeHtml();
}

function applyEdgeState(packet){
 if(!packet?.ok)return;
 const oldMap=player.mapId,oldLevel=player.level;
 player={...player,...packet.character};
 mobs=packet.mobs||mobs;otherPlayers=packet.players||[];leaders=packet.leaders||leaders;renderLeaderPeek();
 if(oldMap!==player.mapId){
  input.target=null;
  $('zone-name').textContent=MAPS[player.mapId]?.[0]||'';
  $('zone-lv').textContent='Lv.'+MAPS[player.mapId]?.[1]+'–'+MAPS[player.mapId]?.[2];
  closeModal();
 }
 if(packet.notice){text(packet.notice);if(packet.notice.startsWith('เพิ่มค่าสเตตัส')&&modal==='ตัวละครและค่าสเตตัส')openPanel('character');}
 if(packet.levelUp){toast('LEVEL UP! LV.'+player.level);if(player.level>=10&&player.classId<0)showClasses();}
 updateHUD();
}
async function edgeAction(action,quiet=false){
 if(!onlineConfigured||!authClient)return;
 if(edgePending){if(!quiet&&edgeQueue.length<5)edgeQueue.push(action);return;}
 edgePending=true;
 try{
  const {data:{session},error:sessionError}=await authClient.auth.getSession();
  if(sessionError||!session?.access_token)throw new Error('ต้องเข้าสู่ระบบใหม่');
  const controller=new AbortController(),limit=setTimeout(()=>controller.abort(),9500);
  let response;
  try{response=await fetch(cfg.edgeFunctionUrl,{method:'POST',mode:'cors',signal:controller.signal,headers:{
   'Content-Type':'application/json','apikey':cfg.supabasePublishableKey,'Authorization':'Bearer '+session.access_token
  },body:JSON.stringify(action)});}finally{clearTimeout(limit);}
  const data=await response.json();
  if(!response.ok||!data?.ok)throw new Error(data?.error||'Server rejected request');
  if(!online){online=true;edgeReady=true;toast('เชื่อมต่อ Supabase Game Server แล้ว');}
  applyEdgeState(data);
  if(['skill','attack'].includes(action.type) && typeof action.targetId==='string'){
   const target=data.mobs?.find(m=>m.id===action.targetId);
   if(target)spawnSkillSprite(target.x,target.y,player.classId,action.type==='attack');
  }
 }catch(e){
  if(!quiet&&Date.now()-lastEdgeError>1600){toast(String(e.message||e));lastEdgeError=Date.now();}
 }finally{edgePending=false;const next=edgeQueue.shift();if(next)edgeAction(next);}
}
function connectEdge(jwt){
 if(!jwt)return;
 edgeAction({type:'login'});
 if(!edgePoll)edgePoll=setInterval(()=>{
  if(online&&document.visibilityState==='visible')edgeAction({type:'state'},true);
 },900);
}


async function ensureAuth(){
 if(!authClient){
  const mod=await import('https://esm.sh/@supabase/supabase-js@2.57.0');
  authClient=mod.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
 }
 return authClient;
}
async function passwordAuth(signup){
 const email=document.getElementById('awc-email')?.value?.trim();
 const password=document.getElementById('awc-password')?.value||'';
 if(!email||!email.includes('@')||password.length<8){toast('ระบุอีเมลและรหัสผ่านอย่างน้อย 8 ตัว');return;}
 try{
  const client=await ensureAuth();
  const {data,error}=signup?await client.auth.signUp({email,password}):
   await client.auth.signInWithPassword({email,password});
  if(error)throw error;
  if(data?.session?.access_token){closeModal();connectEdge(data.session.access_token);}
  else toast('สร้างบัญชีแล้ว ตรวจอีเมลเพื่อยืนยันก่อนเข้าสู่ระบบ');
 }catch(e){toast(e?.message||'เข้าสู่ระบบไม่สำเร็จ');}
}
async function logoutOnline(){
 try{if(authClient)await authClient.auth.signOut();}catch(e){console.warn('Sign-out',e);}
 online=false;edgeReady=false;edgeQueue=[];otherPlayers=[];leaders=[];renderLeaderPeek();auto=false;
 if(edgePoll){clearInterval(edgePoll);edgePoll=null;}if(socket){socket.close();socket=null;}
 player=defaultHero();setMap(0,true);toast('ออกจากระบบแล้ว');
}

async function loginOnline(){if(!onlineConfigured){toast('ยังไม่ได้ตั้งค่าเซิร์ฟเวอร์ใหม่');return;}
 try{await ensureAuth();
 const {data:{session}}=await authClient.auth.getSession();if(!session){await authClient.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname}});return;}if(edgeMode)connectEdge(session.access_token);else connectServer(session.access_token);
 }catch(e){toast('เข้าสู่ระบบไม่สำเร็จ');text('Login: '+e.message);}}
function connectServer(jwt){if(socket&&socket.readyState===WebSocket.OPEN)return;const ws=new WebSocket(cfg.gameServerWebSocketUrl);socket=ws;ws.onopen=()=>{ws.send(JSON.stringify({type:'auth',accessToken:jwt}));};
 ws.onmessage=(evt)=>{try{const msg=JSON.parse(evt.data);if(msg.type==='hello'){online=true;currentUid=msg.userId;player={...defaultHero(),...msg.character};mobs=msg.mobs||[];setMap(player.mapId,true);mobs=msg.mobs||[];closeModal();toast('เชื่อมต่อเกมออนไลน์แล้ว');}
 else if(msg.type==='state'){if(!online)return;player={...player,...msg.character};mobs=msg.mobs||mobs;otherPlayers=msg.players||[];if(MAPS[player.mapId]&&$('zone-name').textContent!==MAPS[player.mapId][0]){$('zone-name').textContent=MAPS[player.mapId][0];$('zone-lv').textContent=`Lv.${MAPS[player.mapId][1]}–${MAPS[player.mapId][2]}`;}}
 else if(msg.type==='event'){if(msg.text)text(msg.text);if(msg.toast)toast(msg.toast);if(msg.hit)fx(msg.hit.x,msg.hit.y-30,String(msg.hit.damage),'#f5e9a4');if(msg.levelUp&&player.level===10&&player.classId<0)showClasses();}
 else if(msg.type==='error'){toast(msg.message||'คำสั่งไม่สำเร็จ');}}
 catch(e){console.warn('Invalid WS message',e);}};
 ws.onclose=()=>{if(online){online=false;auto=false;$('toggle-auto').classList.remove('active');toast('การเชื่อมต่อเซิร์ฟเวอร์สิ้นสุด');}socket=null;};ws.onerror=()=>toast('ไม่สามารถเชื่อมต่อ Game Server');}
async function init(){resize();window.addEventListener('resize',resize);const promises=[];
 for(let i=1;i<=10;i++)promises.push(loadImage(asset(`maps/map-${String(i).padStart(2,'0')}.png`)));
 for(let i=0;i<4;i++)promises.push(loadImage(asset(`sprites/hero-${i}.png`)));
 for(let i=0;i<10;i++)promises.push(loadImage(asset(`sprites/mob-${i}.png`)));
 for(let i=0;i<4;i++)promises.push(loadImage(asset(`effects/skill-${i}.png`)));for(let i=0;i<10;i++)promises.push(loadImage(asset(`sprites/boss-${String(i).padStart(2,'0')}.png`)));for(let i=0;i<4;i++)promises.push(loadImage(asset(`sprites/wing-${i}.png`)));
 const images=await Promise.all(promises);mapImgs=images.slice(0,10);heroImgs=images.slice(10,14);mobImgs=images.slice(14,24);skillImgs=images.slice(24,28);bossImgs=images.slice(28,38);wingImgs=images.slice(38,42);ready=true;setMap(player.mapId);if(player.level===10&&player.classId<0)toast('เลเวล 10 แล้ว! ไปที่เมนูตัวละครเพื่อเลือกอาชีพ');
 if(!images.every(Boolean))toast('มี Asset บางไฟล์โหลดไม่สำเร็จ');requestAnimationFrame(loop);
 if(onlineConfigured){const q=new URLSearchParams(location.search);if(q.has('code')){try{await loginOnline()}catch{}}}
}
init();
