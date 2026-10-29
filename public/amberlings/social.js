/* Amberlings social/PvP/guild/gym CBT. Every action is validated by Supabase SQL. */
(function(){'use strict';
let ch='world';
const commands=new Set(['local_chat_channel','social_state','guild_create','guild_join','guild_leave','guild_transfer','guild_kick',
 'friend_request','friend_accept','friend_remove','chat_post','chat_report','pvp_challenge',
 'pvp_accept','pvp_cancel','pvp_attack','pvp_forfeit','gym_start','gym_attack','gym_cancel','quest_claim']);
function handles(x){return commands.has(x);}
function prepare(a,btn){
 const d=btn.dataset;
 if(a==='local_chat_channel'){ch=d.channel==='guild'?'guild':'world';return {__local:true};}
 if(a==='guild_create'){let name=prompt('ชื่อกิลด์ 3–24 ตัวอักษร (ใช้ 500 เหรียญ)');return name?{name:name.trim()}:null;}
 if(a==='chat_post'){const field=document.getElementById('ab-chat-input'),body=field?.value.trim();
   if(!body||body.length>240){alert('ข้อความต้องมี 1–240 ตัวอักษร');return null;}
   return {channel:ch,body};}
 if(a==='pvp_forfeit'||a==='guild_kick'||a==='guild_transfer'||a==='guild_leave'){
  if(!confirm('ยืนยันการทำรายการนี้หรือไม่?'))return null;
 }
 if(a==='pvp_challenge'||a==='friend_request'||a==='friend_accept'||a==='friend_remove'||
    a==='guild_kick'||a==='guild_transfer')return {targetId:d.target};
 if(a==='guild_join')return {guildId:d.guild};
 if(a==='pvp_accept'||a==='pvp_attack'||a==='pvp_cancel'||a==='pvp_forfeit')return {duelId:d.duel};
 if(a==='gym_start')return {stage:Number(d.stage)};
 if(a==='quest_claim')return {quest:d.quest};
 if(a==='chat_report')return {messageId:Number(d.message)};
 return {};
}
function render(view,model,btn,e,nf){
 const s=model?.social||{},p=model?.player||{};
 const player=s.players||[],members=s.members||[],my=s.guild,guilds=s.guilds||[],friends=s.friends||[];
 const button=(label,action,args,kind)=>btn(label,action,args,kind);
 const wrap=x=>'<section class="ab-section ab-social">'+x+'</section>';
 const name=x=>e(String(x||''));
 if(view==='guild'){
  let v='<h3>กิลด์ออนไลน์</h3><p>สมาชิกจริงจาก Supabase · สูงสุดกิลด์ละ 40 คน · สร้างกิลด์ 500 เหรียญ</p>';
  if(!my){v+=button('สร้างกิลด์ใหม่','guild_create',{},'primary')+'<h3>กิลด์ที่เปิดรับสมาชิก</h3>';
   v+=guilds.length?guilds.map(g=>'<div class="ab-row"><div><b>'+name(g.name)+'</b><small>หัวหน้า '+name(g.leader)+' · '+nf(g.members)+'/40 คน</small></div>'+
   button('เข้าร่วม','guild_join',{guild:g.id},'primary')+'</div>').join(''):'<p>ยังไม่มีกิลด์ — คุณสามารถสร้างกิลด์แรกได้</p>';
  }else{
   v+='<div class="ab-note"><b>'+name(my.name)+'</b> · '+(my.role==='leader'?'หัวหน้ากิลด์':'สมาชิกกิลด์')+'</div>';
   v+=members.map(x=>'<div class="ab-row"><div><b>'+name(x.name)+'</b><small>'+name(x.role)+'</small></div>'+
    (my.role==='leader'&&x.id!==my.leader?
      button('มอบหัวหน้า','guild_transfer',{target:x.id})+button('นำออก','guild_kick',{target:x.id}):'')+'</div>').join('');
   v+=button('ออกจากกิลด์','guild_leave',{},'danger');
  }
  return wrap(v);
 }
 if(view==='friends'){
  let v='<h3>เพื่อนออนไลน์</h3><p>คำขอเป็นเพื่อนส่งถึงผู้เล่นจริง ไม่มีบอทหรือเพื่อนจำลอง</p>';
  v+=(friends.length?friends.map(f=>'<div class="ab-row"><div><b>'+name(f.name)+'</b><small>'+
    (f.status==='accepted'?'เป็นเพื่อนกัน':f.direction==='in'?'ส่งคำขอถึงคุณ':'รอตอบรับ')+
    '</small></div><div class="ab-actions">'+
    (f.status==='pending'&&f.direction==='in'?button('รับเพื่อน','friend_accept',{target:f.player_id},'primary'):'')+
    button('นำออก','friend_remove',{target:f.player_id},'danger')+'</div></div>').join(''):'<p>ยังไม่มีเพื่อน</p>');
  const already=new Set(friends.map(f=>f.player_id));
  v+='<h3>ค้นหาจากผู้เล่นที่เข้ามาแล้ว</h3>';
  v+=(player.length?player.filter(x=>!already.has(x.id)).map(x=>'<div class="ab-row"><div>'+
    '<b>'+name(x.name)+'</b><small>'+ (x.online?'ออนไลน์':'ออฟไลน์')+'</small></div>'+
    button('เพิ่มเพื่อน','friend_request',{target:x.id})+'</div>').join(''):'<p>ยังไม่มีผู้เล่นคนอื่นในเซิร์ฟเวอร์</p>');
  return wrap(v);
 }
 if(view==='chat'){
  let v='<h3>แชทผู้เล่นจริง</h3><p>อัปเดตข้อความโดยดึงข้อมูลเซิร์ฟเวอร์ทุกประมาณ 12 วินาที · กดรายงานข้อความไม่เหมาะสมได้</p>';
  v+='<div class="ab-actions">'+button('โลก','local_chat_channel',{channel:'world'},ch==='world'?'primary':'')+
     button('กิลด์','local_chat_channel',{channel:'guild'},ch==='guild'?'primary':'')+'</div>';
  if(ch==='guild'&&!my)return wrap(v+'<p>ต้องเข้ากิลด์ก่อนใช้แชทกิลด์</p>');
  const msgs=(s.messages||[]).filter(x=>x.channel===ch);
  v+='<div class="ab-chatlog">'+(msgs.length?msgs.map(x=>'<div class="ab-chatline"><b>'+name(x.sender)+': </b>'+
    name(x.body)+' <small>'+new Date(x.created_at).toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})+'</small>'+
    (x.sender_id!==p.id?button('รายงาน','chat_report',{message:x.id}):'')+'</div>').join(''):'<p>ยังไม่มีข้อความ</p>')+'</div>';
  v+='<textarea id="ab-chat-input" maxlength="240" rows="2" placeholder="พิมพ์ข้อความถึงผู้เล่นจริง (ไม่เกิน 240 ตัวอักษร)"></textarea>'+
     button('ส่งข้อความ','chat_post',{},'primary');
  return wrap(v);
 }
 if(view==='pvp'){
  let v='<h3>PvP ดวลมอนสเตอร์</h3><p>ผู้เล่นสองคนต้องยอมรับการดวล · สลับเทิร์นโจมตี · ดาเมจและผู้ชนะคำนวณบนเซิร์ฟเวอร์ ไม่มีรางวัลเงินจากการดวล</p>';
  const ds=(s.duels||[]),current=ds.filter(x=>x.status==='active'||x.status==='pending');
  if(current.length)v+='<h3>คำท้า / คู่ต่อสู้</h3>'+current.map(d=>{
   const mine=d.challenger===p.id;
   const theirs=mine?d.opponent_name:d.challenger_name;
   return '<div class="ab-row"><div><b>'+name(theirs)+'</b><small>'+
    (d.status==='pending'?'รอรับคำท้า':('HP คุณ '+(mine?d.ch_hp:d.op_hp)+' · คู่ต่อสู้ '+(mine?d.op_hp:d.ch_hp)+
       (d.turn_user===p.id?' · ตาคุณ':' · รอฝ่ายตรงข้าม')))+
    '</small></div><div class="ab-actions">'+
    (d.status==='pending'&&!mine?button('รับคำท้า','pvp_accept',{duel:d.id},'primary'):'')+
    (d.status==='pending'?button('ยกเลิก','pvp_cancel',{duel:d.id}):'')+
    (d.status==='active'&&d.turn_user===p.id?button('โจมตี','pvp_attack',{duel:d.id},'primary'):'')+
    (d.status==='active'?button('ยอมแพ้','pvp_forfeit',{duel:d.id},'danger'):'')+
    '</div></div>';
  }).join('');
  v+='<h3>ท้าผู้เล่นอื่น</h3>';
  v+=player.length?player.map(x=>'<div class="ab-row"><div><b>'+name(x.name)+'</b><small>'+
   (x.online?'ออนไลน์':'ออฟไลน์')+' · คะแนน '+nf(x.rating)+'</small></div>'+
   button('ท้าดวล','pvp_challenge',{target:x.id},'primary')+'</div>').join(''):'<p>ยังไม่มีผู้เล่นคนอื่น — PvP ต้องมี 2 บัญชีจริง</p>';
  const completed=ds.filter(x=>x.status==='done');
  v+='<h3>ผลการดวลล่าสุด</h3>'+(completed.length?completed.slice(0,5).map(x=>'<div class="ab-row">'+
   name(x.challenger_name)+' พบ '+name(x.opponent_name)+' · '+(x.winner===p.id?'คุณชนะ':'จบการแข่งขัน')+'</div>').join(''):'<p>ยังไม่มีผลการดวล</p>');
  return wrap(v);
 }
 if(view==='gym'){
  let v='<h3>ยิมมอนสเตอร์ 3 ด่าน</h3><p>ใช้ทีมจริงของคุณสู้กับหัวหน้ายิมฝั่งเซิร์ฟเวอร์ รับรางวัลผ่านเซิร์ฟเวอร์ได้ด่านละครั้ง</p>';
  const gyms=[['ยิมป่า',5,100],['ยิมสายน้ำ',12,240],['ยิมยอดเขา',25,430]];
  if(s.gym){v+='<div class="ab-note"><b>กำลังสู้ยิม '+s.gym.stage+'</b> · บอส HP '+nf(s.gym.boss_hp)+
    ' · มอน HP '+nf(s.gym.mon_hp)+' · รอบ '+nf(s.gym.rounds)+'</div>'+
    button('โจมตีบอสยิม','gym_attack',{},'primary')+button('ออกจากยิม','gym_cancel');}
  v+='<div class="ab-gridactions">'+gyms.map((x,i)=>'<div class="ab-gym"><b>'+name(x[0])+'</b><small>ต้องมีมอน Lv.'+x[1]+
   ' · '+(s.gymWins||[]).includes(i+1)?'ผ่านแล้ว':'ยังไม่ผ่าน'+'</small>'+
   button('เข้ายิม '+(i+1),'gym_start',{stage:i+1},'primary')+'</div>').join('')+'</div>';
  const q=[['capture1','จับมอนแรก',p.captures>=1],['wins5','ชนะมอนป่า 5 ครั้ง',p.wins>=5],
   ['gym1','ผ่านยิมแรก',(s.gymWins||[]).includes(1)],['guild1','เข้าร่วมกิลด์',!!my],
   ['pvp1','ดวล PvP ครบ 1 ครั้ง',(s.duels||[]).some(d=>d.status==='done')]];
  v+='<h3>เควสต์รับรางวัลครั้งเดียว</h3>'+q.map(x=>'<div class="ab-row"><div><b>'+name(x[1])+'</b><small>'+
   ((s.questClaims||[]).includes(x[0])?'รับรางวัลแล้ว':x[2]?'พร้อมรับรางวัล':'ยังไม่สำเร็จ')+'</small></div>'+
   (!(s.questClaims||[]).includes(x[0])?button('รับรางวัล','quest_claim',{quest:x[0]},x[2]?'primary':''):'')+'</div>').join('');
  return wrap(v);
 }
 return wrap('<p>ไม่พบเมนู</p>');
}
window.AmberSocial={handles,prepare,render};
})();