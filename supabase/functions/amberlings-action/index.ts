// AMBERLINGS server gateway. Never trust client-supplied state, currency or monster objects.
// All economy actions are computed by Postgres in one locked transaction.
import {createClient} from 'npm:@supabase/supabase-js@2.57.0';
const URL=Deno.env.get('SUPABASE_URL')??'';
const KEY=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')??'';
if(!URL||!KEY)throw new Error('Missing server environment configuration');
const admin=createClient(URL,KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const allowed=new Set(['https://tanawattanwa22-dotcom.github.io','http://localhost:3000','http://127.0.0.1:3000']);
function headers(origin:string){return {
  'Access-Control-Allow-Origin':allowed.has(origin)?origin:'https://tanawattanwa22-dotcom.github.io',
  'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info',
  'Access-Control-Allow-Methods':'POST,OPTIONS','Cache-Control':'no-store','Vary':'Origin'
};}
function json(body:unknown,status:number,origin:string){return new Response(JSON.stringify(body),{
 status,headers:{...headers(origin),'Content-Type':'application/json; charset=utf-8'}});}
const actions=new Set(['bootstrap','state','profile','starter','explore','attack','capture','flee',
 'use_item','shop_buy','party','evolve','daily','travel','market_list','market_buy','market_cancel','cosmetic_buy','cosmetic_equip','cosmetic_skin',
 'social_state','guild_create','guild_join','guild_leave','guild_transfer','guild_kick','friend_request','friend_accept','friend_remove','chat_post','chat_report','pvp_challenge','pvp_accept','pvp_cancel','pvp_attack','pvp_forfeit','gym_start','gym_attack','gym_cancel','quest_claim']);
const fields=new Set(['name','gender','uniform','hair','skin','speciesId','move','orb',
 'monsterId','item','qty','slot','mapId','kind','price','currency','listingId',
 'targetId','guildId','duelId','stage','body','channel','messageId']);
Deno.serve(async req=>{
 const origin=req.headers.get('origin')??'';
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:headers(origin)});
 if(req.method!=='POST')return json({ok:false,error:'Method not allowed'},405,origin);
 if(origin&&!allowed.has(origin))return json({ok:false,error:'Forbidden origin'},403,origin);
 if(Number(req.headers.get('content-length')||0)>4096)return json({ok:false,error:'Too large'},413,origin);
 const auth=req.headers.get('authorization')??'';
 if(!auth.startsWith('Bearer ')||auth.length>8192)return json({ok:false,error:'Sign in required'},401,origin);
 try{
  const {data:{user},error}=await admin.auth.getUser(auth.slice(7));
  if(error||!user)return json({ok:false,error:'Invalid or expired Google session'},401,origin);
  const payload=await req.json();
  if(!payload||typeof payload!=='object'||Array.isArray(payload)||typeof payload.action!=='string'
     ||!actions.has(payload.action))return json({ok:false,error:'Invalid action'},400,origin);
  const args:Record<string,unknown>={};
  for(const [k,v] of Object.entries(payload)){
    if(k==='action'||!fields.has(k))continue;
    if(typeof v!=='string'&&typeof v!=='number')return json({ok:false,error:'Invalid field'},400,origin);
    if(typeof v==='string'&&v.length>128)return json({ok:false,error:'Field too long'},400,origin);
    if(typeof v==='number'&&!Number.isFinite(v))return json({ok:false,error:'Invalid number'},400,origin);
    args[k]=v;
  }
  const cosmetic=['cosmetic_buy','cosmetic_equip','cosmetic_skin'].includes(payload.action);
  const social=new Set(["social_state","guild_create","guild_join","guild_leave","guild_transfer","guild_kick","friend_request","friend_accept","friend_remove","chat_post","chat_report","pvp_challenge","pvp_accept","pvp_cancel","pvp_attack","pvp_forfeit","gym_start","gym_attack","gym_cancel","quest_claim"]);
  const rpc=cosmetic?'amberlings_cosmetic_action':
    social.has(payload.action)?'amberlings_social_action':'amberlings_action';
  const {data:result,error:rpcError}=await admin.rpc(rpc,{
    p_uid:user.id,p_action:payload.action,p_args:args
  });
  if(rpcError){console.error('amberlings_action',rpcError.code,rpcError.message);
    return json({ok:false,error:'Server could not complete the action'},500,origin);}
  return json(result??{ok:false,error:'No result'},200,origin);
 }catch(error){console.error('Amberlings input error',String(error));
   return json({ok:false,error:'Unable to process request'},400,origin);}
});