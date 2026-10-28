/* Regression smoke test for Monster World UI bootstrap and navigation.
   Runs in Node without network, database, credentials, or browser dependencies.
   Fails CI when a reference error would leave users on the blue screen. */
'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const sourceCode=fs.readFileSync('public/monster-world/game.js','utf8');
const elements=new Map();
const listeners=new Map();
const document={
  getElementById(id){
    if(!elements.has(id))elements.set(id,{
      innerHTML:'',textContent:'',value:'',style:{},replaceChildren(){},
      addEventListener(){},querySelectorAll(){return []}
    });
    return elements.get(id);
  },
  addEventListener(event,handler){listeners.set(event,handler)},
  createElement(tag){return {tagName:tag,textContent:'',className:'',isConnected:false,remove(){}}},
  hidden:false
};
const window={AWC_CONFIG:{},scrollTo(){}};
const localStorage={getItem(){return null},setItem(){}};
const context=vm.createContext({window,document,localStorage,console,setInterval(){return 1},setTimeout(){return 1}});
vm.runInContext(sourceCode,context,{filename:'monster-world/game.js',timeout:2000});
function run(code){return vm.runInContext(code,context,{timeout:2000});}
function checkRoute(route){
  run('page='+JSON.stringify(route)+';render()');
  const html=elements.get('view')?.innerHTML;
  assert.ok(typeof html==='string'&&html.length>120,'Blank screen for '+route);
  assert.ok(elements.get('menu')?.innerHTML?.includes('data-route='),'Navigation missing on '+route);
  return html.length;
}
const routes=['home','explore','battle','team','dex','detail','evolve','map','shop','bag','quests','social','profile','pet','more'];
for(const route of routes)console.log('[UI]',route,checkRoute(route),'chars');
assert.ok(listeners.has('click'),'No button event handlers');
assert.ok(listeners.has('input'),'No search event handlers');
run("demo('starter',{speciesId:1})");
assert.equal(run('state.pets.length'),1,'Starter not saved in demo');
checkRoute('team');
run("demo('explore',{})");
assert.ok(run('state.wild'),'Explore did not create an encounter');
checkRoute('battle');
run("demo('attack',{move:0})");
assert.ok(run('state.pets.length')>=1,'Battle deleted starter');
run("demo('shop',{item:'balls',quantity:1})");
checkRoute('shop');
checkRoute('home');
console.log('PASS Monster World startup, all '+routes.length+' pages and basic starter/explore/battle/shop interactions');
