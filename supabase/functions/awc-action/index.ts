import { createClient } from 'npm:@supabase/supabase-js@2.57.0';
const url=Deno.env.get('SUPABASE_URL')??'';
const secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')??'';
if(!url||!secret)throw new Error('Supabase server secrets missing');
const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
const allowed=new Set(['https://tanawattanwa22-dotcom.github.io','http://localhost:3000','http://127.0.0.1:3000','http://localhost:8080','http://127.0.0.1:8080']);
const cors=(origin:string)=>({
 'Access-Control-Allow-Origin':allowed.has(origin)?origin:'https://tanawattanwa22-dotcom.github.io',
 'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info',
 'Access-Control-Allow-Methods':'POST, OPTIONS',
 'Vary':'Origin',
 'Cache-Control':'no-store'
});
function json(data:unknown,status:number,origin:string){return new Response(JSON.stringify(data),{status,headers:{...cors(origin),'Content-Type':'application/json;charset=utf-8'}});}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('origin')??'';
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors(origin)});
 if(req.method!=='POST')return json({ok:false,error:'Method not allowed'},405,origin);
 if(origin&&!allowed.has(origin))return json({ok:false,error:'Origin not allowed'},403,origin);
 const auth=req.headers.get('authorization')??'';
 if(!auth.startsWith('Bearer ')||auth.length>8192)return json({ok:false,error:'Sign in required'},401,origin);
 try{
  const jwt=auth.slice(7);
  const {data:{user},error:e}=await admin.auth.getUser(jwt);
  if(e||!user||!user.id)return json({ok:false,error:'Invalid session'},401,origin);
  if(Number(req.headers.get('content-length')||0)>4096)return json({ok:false,error:'Request too large'},413,origin);
  const payload=await req.json();
  if(!payload||typeof payload!=='object'||Array.isArray(payload))return json({ok:false,error:'Invalid request'},400,origin);
  const action=payload.type;
  if(typeof action!=='string'||!['login','state','move','attack','skill','travel','potion','chooseClass','allocateStat'].includes(action))return json({ok:false,error:'Unsupported action'},400,origin);
  const params:Record<string,unknown>={};
  for(const key of ['dx','dy','targetId','classId','mapId','stat']){
    if(Object.prototype.hasOwnProperty.call(payload,key))params[key]=payload[key];
  }
  const {data,error}=await admin.rpc('awc_server_action',{p_user:user.id,p_action:action,p_payload:params});
  if(error){console.error('awc_action_error',error.code,error.message);return json({ok:false,error:'Server action failed'},500,origin);}
  return json(data??{ok:false,error:'No state'},200,origin);
 }catch(e){console.error('awc_edge_error',String(e));return json({ok:false,error:'Invalid input'},400,origin);}
});