// AMBERLINGS V3: online-only smoke test; never accept guest/fake save functionality.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const dir='public/amberlings/';
const html=fs.readFileSync(dir+'index.html','utf8'),ui=fs.readFileSync(dir+'online.js','utf8'),
 scene=fs.readFileSync(dir+'scene.js','utf8'),auth=fs.readFileSync(dir+'auth.js','utf8'),css=fs.readFileSync(dir+'online.css','utf8');
for(const [f,s] of [['online.js',ui],['scene.js',scene],['auth.js',auth]])new vm.Script(s,{filename:f});
assert.ok(html.includes('src="./auth.js?v=003"')&&html.includes('src="./scene.js?v=003"'));
assert.ok(html.includes('id="login-form"')&&html.includes('id="sign-google"'));
assert.ok(!html.includes('guest')&&!html.includes('localStorage')&&!html.includes('legacy'));
assert.ok(auth.includes('signInWithPassword')&&auth.includes('signUp')&&auth.includes('signInWithOAuth'));
assert.ok(!ui.includes('?demo=1')&&!ui.includes("mode:'guest'")&&!ui.includes('ทดลองเกม 3D ออฟไลน์'));
assert.ok(ui.includes('await api(\'bootstrap\')')&&ui.includes('window.AmberScene?.sync(d)'));
assert.ok(ui.includes('model?.shop')&&ui.includes('model?.species'));
const social=fs.readFileSync(dir+'social.js','utf8');new vm.Script(social,{filename:'social.js'});
assert.ok(html.includes('src="./social.js?v=004"'),'Online social client missing');
assert.ok(ui.includes('window.AmberSocial.render')&&social.includes('pvp_challenge')&&social.includes('guild_create')&&social.includes('chat_post')&&social.includes('gym_attack'));
assert.ok(!ui.includes('ระบบยิม PvP กิลด์และแชทที่ยังไม่มีเซิร์ฟเวอร์ถูกปิด'));
assert.ok(css.includes('#amberlings-online-hub')&&css.includes('.ab-auth'));
console.log('PASS online-only V3: real Supabase Auth, no Guest/Offline game, server-sourced gameplay, 3D scene');
