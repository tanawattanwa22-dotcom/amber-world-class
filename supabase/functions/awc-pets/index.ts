import {createClient} from 'npm:@supabase/supabase-js@2.57.0';
const envUrl=Deno.env.get('SUPABASE_URL')||'';
const envKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
if(!envUrl||!envKey)throw new Error('Server secret not configured');
const admin=createClient(envUrl,envKey,{auth:{persistSession:false,autoRefreshToken:false}});
const allow=new Set(['https://tanawattanwa22-dotcom.github.io','http://localhost:3000','http://127.0.0.1:3000','http://localhost:8080']);
function cors(origin:string){return {'Access-Control-Allow-Origin':allow.has(origin)?origin:'https://tanawattanwa22-dotcom.github.io','Vary':'Origin',
 'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS','Cache-Control':'no-store'};}
function respond(body:unknown,status:number,origin:string){return new Response(JSON.stringify(body),{status,headers:{...cors(origin),'Content-Type':'application/json;charset=utf-8'}});}
Deno.serve(async(request:Request)=>{
 const origin=request.headers.get('origin')||'';
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors(origin)});
 if(request.method!=='POST')return respond({ok:false,error:'Method not allowed'},405,origin);
 if(origin&&!allow.has(origin))return respond({ok:false,error:'Origin not allowed'},403,origin);
 const auth=request.headers.get('authorization')||'';
 if(!auth.startsWith('Bearer ')||auth.length>8192)return respond({ok:false,error:'Sign in required'},401,origin);
 if(Number(request.headers.get('content-length')||0)>4096)return respond({ok:false,error:'Request too large'},413,origin);
 try{
   const {data:{user},error:authError}=await admin.auth.getUser(auth.slice(7));
   if(authError||!user||!user.id)return respond({ok:false,error:'Session expired'},401,origin);
   const data=await request.json();
   if(!data||typeof data!=='object'||Array.isArray(data))return respond({ok:false,error:'Invalid request'},400,origin);
   const action=data.action;
   if(typeof action!=='string'||!['login','state','starter','explore','flee','attack','capture','evolve','team','area','shop','heal','daily','rename'].includes(action))return respond({ok:false,error:'Invalid action'},400,origin);
   const accepted:Record<string,unknown>={};
   for(const key of ['speciesId','petId','slot','area','item','quantity','name','move'])if(Object.prototype.hasOwnProperty.call(data,key))accepted[key]=data[key];
   const {data:response,error}=await admin.rpc('awc_pet_action',{p_uid:user.id,p_action:action,p_payload:accepted});
   if(error){console.error('awc-pet-action',error.code,error.message);return respond({ok:false,error:'Server rejected request'},500,origin);}
   return respond(response||{ok:false,error:'Empty server state'},200,origin);
 }catch(error){console.error('awc-pet-input',String(error));return respond({ok:false,error:'Invalid request'},400,origin);}
});