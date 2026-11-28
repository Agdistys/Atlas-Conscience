// Public routing relay: credentials stay server-side, no request logging or paid fallback.
import {normalizeOrs} from '../selected-tolls/planner.mjs';
const UPSTREAM='https://api.heigit.org/openrouteservice/v2/directions/driving-car/geojson';
const fail=(status,code)=>Object.assign(new Error(code),{status,code,controlled:true});
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const point=p=>Array.isArray(p)&&p.length===2&&p.every(finite)&&Math.abs(p[0])<=180&&Math.abs(p[1])<=90;
const exact=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).every(k=>keys.includes(k));
const bounded=(value,maximum)=>{const n=Number(value);return Number.isSafeInteger(n)&&n>=1&&n<=maximum?n:0;};
export function settings(env){
 let origins=[];try{origins=JSON.parse(env.ALLOWED_ORIGINS||'[]')}catch{}
 if(!Array.isArray(origins)||origins.length>5||origins.some(x=>{try{const u=new URL(x);return u.protocol!=='https:'||u.origin!==x}catch{return true}}))origins=[];
 const daily=bounded(env.DAILY_LIMIT,100),minute=bounded(env.MINUTE_LIMIT,10);
 return {origins,daily,minute,ready:env.SERVICE_ENABLED==='true'&&env.FREE_PLAN_CONFIRMED==='true'&&/^[!-~]{8,4096}$/.test(env.ORS_API_KEY||'')&&origins.length>0&&daily>0&&minute>0&&!!env.ROUTE_BUDGET};
}
export function routeRequest(input){
 if(!exact(input,['coordinates','avoid','vehicle','alternatives']))throw fail(400,'INVALID_REQUEST');
 if(!Array.isArray(input.coordinates)||input.coordinates.length!==2||!input.coordinates.every(point)||input.coordinates[0].every((n,i)=>n===input.coordinates[1][i]))throw fail(400,'INVALID_COORDINATES');
 if(!Array.isArray(input.avoid)||input.avoid.length>3||new Set(input.avoid).size!==input.avoid.length||input.avoid.some(x=>!['tollways','highways','ferries'].includes(x)))throw fail(400,'INVALID_AVOID');
 if(!exact(input.vehicle,['type'])||input.vehicle.type!=='car')throw fail(400,'VEHICLE_NOT_QUALIFIED');
 if(input.alternatives!==false)throw fail(400,'ALTERNATIVES_NOT_QUALIFIED');
 return {coordinates:input.coordinates,preference:'fastest',units:'m',geometry:true,instructions:true,language:'fr',radiuses:[20,20],extra_info:['tollways','waycategory'],options:{avoid_features:input.avoid}};
}
export async function jsonLimited(stream,max,status=413){
 if(!stream)throw fail(status===502?502:400,status===502?'INVALID_UPSTREAM':'EMPTY_BODY');const reader=stream.getReader();let bytes=0;const chunks=[];
 try{while(true){const {value,done}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>max){await reader.cancel();throw fail(status,status===413?'BODY_TOO_LARGE':'INVALID_UPSTREAM')}chunks.push(value)}}finally{reader.releaseLock()}
 const all=new Uint8Array(bytes);let offset=0;for(const c of chunks){all.set(c,offset);offset+=c.length}
 try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(all))}catch{throw fail(status===413?400:status,status===413?'INVALID_JSON':'INVALID_UPSTREAM')}
}
export function sanitize(data,observedAt,avoid){
 // Validate complete toll/category coverage before returning any route to the browser.
 if(data?.features?.[0]?.properties?.warnings?.some(w=>w.code===1))throw fail(422,'ROAD_ACCESS_RESTRICTED');
 const normalized=normalizeOrs(data,observedAt),n=normalized.coordinates.length-1;
 if(avoid.includes('tollways')&&(normalized.tolls.some(Boolean)||normalized.categories.some(v=>v&2)))throw fail(502,'EXCLUSION_NOT_RESPECTED');
 for(const [name,flag]of [['highways',1],['ferries',8]])if(avoid.includes(name)&&normalized.categories.some(v=>v&flag))throw fail(502,'EXCLUSION_NOT_RESPECTED');
 const p=data.features[0].properties,raw=p.segments[0].steps;if(!Array.isArray(raw)||raw.length<1||raw.length>10000)throw fail(502,'INSTRUCTIONS_MISSING');
 let cursor=0;const steps=raw.map(s=>{const indexes=s.way_points;if(!Array.isArray(indexes)||indexes.length!==2||indexes.some(i=>!Number.isSafeInteger(i))||indexes[0]!==cursor||indexes[1]<cursor||indexes[1]>n||!finite(s.distance)||s.distance<0||!finite(s.duration)||s.duration<0||!Number.isSafeInteger(s.type)||s.type<0||s.type>13||typeof s.instruction!=='string'||s.instruction.length>1000||typeof s.name!=='string'||s.name.length>500)throw fail(502,'INVALID_INSTRUCTIONS');cursor=indexes[1];return {distance:s.distance,duration:s.duration,type:s.type,instruction:s.instruction,name:s.name,way_points:[...indexes]}});
 if(cursor!==n||Math.abs(steps.reduce((a,s)=>a+s.distance,0)-normalized.distance)>Math.max(2,steps.length*.11)||Math.abs(steps.reduce((a,s)=>a+s.duration,0)-normalized.duration)>Math.max(2,steps.length*.11))throw fail(502,'INVALID_INSTRUCTIONS');
 const summary={distance:normalized.distance,duration:normalized.duration};
 return {type:'FeatureCollection',features:[{type:'Feature',geometry:{type:'LineString',coordinates:normalized.coordinates},properties:{summary,segments:[{...summary,steps}],extras:{tollways:{values:data.features[0].properties.extras.tollways.values},waycategory:{values:data.features[0].properties.extras.waycategory.values}}}}],metadata:{query:{profile:'driving-car'},engine:{graph_date:normalized.graphDate}},observedAt,provider:'openrouteservice',qualification:'LIVE_QUALIFICATION_PENDING'};
}
export function quotaNext(current,{now,daily,minute}){
 if(!finite(now)||!bounded(daily,100)||!bounded(minute,10))throw fail(503,'INVALID_LIMITS');
 const day=new Date(now).toISOString().slice(0,10);
 if(current&&(!Number.isSafeInteger(current.used)||current.used<0||!Array.isArray(current.calls)||current.calls.some(t=>!finite(t))||!finite(current.last)||now<current.last))throw fail(503,'INVALID_COUNTER');
 const used=current?.day===day?current.used:0,calls=(current?.calls||[]).filter(t=>t>now-60000);
 if(used>=daily)throw fail(429,'DAILY_LIMIT');if(calls.length>=minute)throw fail(429,'MINUTE_LIMIT');
 return {day,used:used+1,calls:[...calls,now],last:now};
}
// A single SQLite-backed Durable Object serializes all reservations across Worker instances.
// Only counters and timestamps are persisted, never coordinates, keys or IP addresses.
export class RouteBudget{
 constructor(state){this.storage=state.storage}
 async fetch(request){
  if(request.method!=='POST'||new URL(request.url).pathname!=='/consume')return Response.json({error:{code:'NOT_FOUND'}},{status:404});
  try{const {daily,minute}=await jsonLimited(request.body,256);await this.storage.transaction(async tx=>{const previous=await tx.get('counter');await tx.put('counter',quotaNext(previous,{now:Date.now(),daily,minute}))});return Response.json({ok:true})}
  catch(e){return Response.json({error:{code:e.controlled?e.code:'COUNTER_UNAVAILABLE'}},{status:e.controlled?e.status:503})}
 }
}
export function createWorker({fetchImpl=fetch,now=Date.now,timeoutMs=20000}={}){return {async fetch(request,env){
 const config=settings(env),url=new URL(request.url),origin=request.headers.get('Origin');
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Vary':'Origin'};
 const reply=(status,value)=>new Response(JSON.stringify(value),{status,headers});
 if(config.origins.includes(origin))headers['Access-Control-Allow-Origin']=origin;
 if(url.pathname==='/health'&&request.method==='GET')return reply(config.ready?200:503,{configured:config.ready,provider:'openrouteservice',routingQualified:false,selectedSectionsQualified:false});
 if(url.pathname!=='/api/route'||url.search)return reply(404,{error:{code:'NOT_FOUND'}});
 if(!config.origins.includes(origin))return reply(403,{error:{code:'ORIGIN_REFUSED'}});
 headers['Access-Control-Allow-Origin']=origin;
 if(request.method==='OPTIONS'){return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'POST','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600'}})}
 if(request.method!=='POST')return reply(405,{error:{code:'METHOD_REFUSED'}});
 if(!config.ready)return reply(503,{error:{code:'NOT_CONFIGURED'}});
 const abort=new AbortController();let timer,stage="input",upstreamStatus;
 const cancel=()=>abort.abort();request.signal.addEventListener('abort',cancel,{once:true});
 try{
  if(request.signal.aborted)throw fail(499,'CANCELLED');
  if(!/^application\/json(?:;|$)/i.test(request.headers.get('content-type')||'')||request.headers.has('content-encoding'))throw fail(415,'JSON_REQUIRED');
  if(Number(request.headers.get('content-length'))>8192)throw fail(413,'BODY_TOO_LARGE');
  const input=await jsonLimited(request.body,8192),body=routeRequest(input);
  stage='quota';const budget=config.ready?env.ROUTE_BUDGET.get(env.ROUTE_BUDGET.idFromName('global-free-v1')):null;
  const reserved=await budget.fetch(new Request('https://budget/consume',{method:'POST',body:JSON.stringify({daily:config.daily,minute:config.minute})}));
  if(!reserved.ok){if(reserved.status===429){headers['Retry-After']='60';throw fail(429,'ROUTING_LIMIT')}throw fail(503,'COUNTER_UNAVAILABLE')}
  if(request.signal.aborted)throw fail(499,'CANCELLED');
  timer=setTimeout(()=>abort.abort(),timeoutMs);
  stage='provider';const response=await fetchImpl(UPSTREAM,{method:'POST',headers:{Authorization:env.ORS_API_KEY,'Content-Type':'application/json',Accept:'application/geo+json'},body:JSON.stringify(body),signal:abort.signal,redirect:'manual'});
  upstreamStatus=response.status;
  if(!response.ok){await response.body?.cancel();if(response.status>=300&&response.status<400)throw fail(502,'UPSTREAM_REDIRECT_REFUSED');if(response.status===429)throw fail(429,'UPSTREAM_LIMIT');if([401,403].includes(response.status))throw fail(503,'UPSTREAM_ACCESS');throw fail(502,'UPSTREAM_UNAVAILABLE')}
  const data=await jsonLimited(response.body,4*1024*1024,502);
  if(data?.error)throw fail(502,'UPSTREAM_UNAVAILABLE');
  let clean;try{clean=sanitize(data,new Date(now()).toISOString(),input.avoid)}catch(e){if(e.controlled)throw e;throw fail(502,'INVALID_UPSTREAM')}
  return reply(200,clean);
 }catch(e){return reply(e.controlled?e.status:abort.signal.aborted?504:502,{error:{code:e.controlled?e.code:abort.signal.aborted?'TIMEOUT':'UPSTREAM_UNAVAILABLE',stage,...(upstreamStatus?{upstreamStatus}:{})}})}
 finally{clearTimeout(timer);request.signal.removeEventListener('abort',cancel)}
}}}
export default createWorker();
