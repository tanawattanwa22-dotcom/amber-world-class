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
assert.ok(css.includes('#amberlings-online-hub')&&css.includes('.ab-auth'));
console.log('PASS online-only V3: real Supabase Auth, no Guest/Offline game, server-sourced gameplay, 3D scene');
