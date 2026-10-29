/* Purely visual 3D rendering of verified Supabase monster state; no game simulation. */
(function(){'use strict';let world,camera,rend,trees=[],hero,enemy,stamp='',map='',started=false;
window.SP={};
const palette={fire:0xea8050,water:0x4aa9f6,leaf:0x49c481,bolt:0xebd458,earth:0xb59674,spirit:0x9c7cd5,normal:0xf0bd9c};
function hash(v){let z=0;for(let i=0;i<String(v).length;i++)z=(Math.imul(z,31)+String(v).charCodeAt(i))|0;return Math.abs(z);}
function icon(id){const el=window.SP?.[id]?.[1]||'normal',num=palette[el]||0x82b8e1,col='#'+num.toString(16).padStart(6,'0'),h=hash(id);
const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="31" fill="#17334e"/>'+
 (h%2?'<path d="M16 24L10 8L28 17M37 17L54 8L48 24" fill="'+col+'"/>':'<circle cx="19" cy="21" r="10" fill="'+col+'"/><circle cx="45" cy="21" r="10" fill="'+col+'"/>')+
 '<ellipse cx="32" cy="37" rx="22" ry="23" fill="'+col+'"/><circle cx="24" cy="34" r="3.5" fill="#11192c"/><circle cx="40" cy="34" r="3.5" fill="#11192c"/>'+
 '<path d="M27 45Q32 51 37 45" fill="none" stroke="#6c3445" stroke-width="2"/></svg>';
return 'data:image/svg+xml,'+encodeURIComponent(svg);}
window.monIcon=icon;
function mat(color){return new THREE.MeshLambertMaterial({color});}
function sphere(root,r,x,y,z,c){const o=new THREE.Mesh(new THREE.SphereGeometry(r,12,10),mat(c));o.position.set(x,y,z);root.add(o);return o;}
function creature(id,el){let g=new THREE.Group(),seed=hash(id),c=palette[el]||0x94baca;
const b=sphere(g,.68,0,.85,0,c);b.scale.y=1.15;sphere(g,.54,0,1.6,0,c);
if(seed%2){sphere(g,.27,-.4,2.03,0,c);sphere(g,.27,.4,2.03,0,c);}
else{for(const x of [-.4,.4]){const ear=new THREE.Mesh(new THREE.ConeGeometry(.26,.7,7),mat(c));ear.position.set(x,2.16,0);g.add(ear);}}
for(const x of [-.25,.25]){sphere(g,.12,x,1.62,.44,0x152139);sphere(g,.19,x*1.6,.32,.2,0xe8d6b6);}
sphere(g,.1,0,1.42,.52,0xeb9aa4);return g;}
function makeWorld(place){if(!world)return;for(const t of trees)world.remove(t);trees=[];
const colors={amberton:0x7ea97c,route1:0x70b67b,mossgate:0x4e9574,route2:0x9ca75a,tidehaven:0x5ca8a2,cave:0x756989,mountain:0xa5a8b1};
const ground=new THREE.Mesh(new THREE.PlaneGeometry(100,100),mat(colors[place]||0x78a276));ground.rotation.x=-Math.PI/2;ground.position.y=-.06;world.add(ground);trees.push(ground);
for(let i=0;i<13;i++){const a=i*2.399,dist=5+(i%4)*1.2,x=Math.sin(a)*dist,z=Math.cos(a)*dist;
const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.12,.22,1.15,7),mat(0x6b4b37));trunk.position.set(x,.56,z);world.add(trunk);trees.push(trunk);
const crown=new THREE.Mesh(new THREE.ConeGeometry(.86,1.8,7),mat(place==='cave'?0x8c86aa:0x3f8069));crown.position.set(x,1.7,z);world.add(crown);trees.push(crown);}}
function sync(d){if(!d?.ok)return;
window.SP=Object.fromEntries((d.species||[]).map(s=>[s.id,[s.name,s.element,s.evolveTo,s.evolveLevel]]));
const place=d.player?.mapId||'amberton';if(place!==map){map=place;makeWorld(place);}
const lead=(d.monsters||[]).filter(m=>m.slot&&m.hp>0).sort((a,b)=>a.slot-b.slot)[0];
const wild=d.encounter,now=(lead?.speciesId||'')+'|'+(wild?.speciesId||'');
if(now!==stamp){if(hero)world?.remove(hero);if(enemy)world?.remove(enemy);
hero=lead?creature(lead.speciesId,window.SP[lead.speciesId]?.[1]):null;
enemy=wild?creature(wild.speciesId,window.SP[wild.speciesId]?.[1]):null;
if(hero){hero.position.set(enemy?-2.2:0,0,0);world?.add(hero);}
if(enemy){enemy.position.set(2.2,0,0);world?.add(enemy);}stamp=now;}
const el=document.getElementById('scene-status');
if(el)el.textContent=wild?'พบ '+(window.SP[wild.speciesId]?.[0]||wild.name)+' Lv.'+wild.level:lead?'คู่หู '+(window.SP[lead.speciesId]?.[0]||lead.speciesId):'เลือกคู่หูเริ่มต้น';}
function init(){if(started)return;started=true;const host=document.getElementById('scene');
if(!window.THREE){host.classList.add('no-webgl');return;}
try{world=new THREE.Scene();world.background=new THREE.Color(0x204864);
camera=new THREE.PerspectiveCamera(44,1,.1,100);camera.position.set(0,5,11);camera.lookAt(0,1,0);
world.add(new THREE.HemisphereLight(0xe9f2ff,0x394b36,2));
const sun=new THREE.DirectionalLight(0xffdeaf,1.2);sun.position.set(-5,12,4);world.add(sun);
rend=new THREE.WebGLRenderer({antialias:true,powerPreference:'low-power'});
rend.setPixelRatio(Math.min(devicePixelRatio||1,1.5));host.appendChild(rend.domElement);
const resize=()=>{let w=host.clientWidth||360,ht=host.clientHeight||260;rend.setSize(w,ht);camera.aspect=w/ht;camera.updateProjectionMatrix();};
window.addEventListener('resize',resize);resize();makeWorld('amberton');
let last=0;function tick(t){requestAnimationFrame(tick);if(document.hidden||t-last<33)return;last=t;
if(hero)hero.rotation.y=Math.sin(t*.0004)*.2;if(enemy){enemy.rotation.y=Math.sin(t*.00035)*.2;enemy.position.y=Math.sin(t*.002)*.045;}
rend.render(world,camera);}requestAnimationFrame(tick);
}catch(e){console.warn('3D unavailable',e);host.classList.add('no-webgl');}}
window.AmberScene={init,sync,icon};})();