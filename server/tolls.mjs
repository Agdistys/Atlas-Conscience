import http from 'node:http';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const fail=(status,code)=>Object.assign(new Error(code),{status,code,controlled:true});
const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
const exact=(x,keys)=>object(x)&&Object.keys(x).every(k=>keys.includes(k));
const money=x=>typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=10000;
export function encodePolyline(points){
 let lastLat=0,lastLon=0,out='';
 const part=delta=>{let n=delta<0?~(delta<<1):delta<<1,s='';while(n>=32){s+=String.fromCharCode((32|(n&31))+63);n>>>=5}return s+String.fromCharCode(n+63)};
 for(const [lon,lat] of points){const a=Math.round(lat*1e5),b=Math.round(lon*1e5);out+=part(a-lastLat)+part(b-lastLon);lastLat=a;lastLon=b}return out;
}
export function buildTollRequest(data){
 if(!exact(data,['requestId','coordinates','distance','vehicle','payment','departureTime'])||typeof data.requestId!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(data.requestId))throw fail(400,'INVALID_REQUEST');
 const c=data.coordinates,v=data.vehicle;
 if(!Array.isArray(c)||c.length<2||c.length>100000||!c.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&p[0]>=-5.6&&p[0]<=10&&p[1]>=41&&p[1]<=51.5)||!Number.isFinite(data.distance)||data.distance<=0||data.distance>4000000)throw fail(400,'INVALID_GEOMETRY');
 if(!exact(v,['type','height','weightKg','axles'])||v.type!=='car'||v.axles!==2||!Number.isFinite(v.height)||v.height<0.5||v.height>2||!Number.isFinite(v.weightKg)||v.weightKg<500||v.weightKg>3500)throw fail(400,'UNSUPPORTED_VEHICLE');
 if(!['cash','licensePlate'].includes(data.payment)||typeof data.departureTime!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(data.departureTime)||!Number.isFinite(Date.parse(data.departureTime))||new Date(data.departureTime).toISOString().replace('.000Z','Z')!==data.departureTime.replace('.000Z','Z'))throw fail(400,'INVALID_PARAMETERS');
 const polyline=encodePolyline(c);
 return {requestId:data.requestId,distance:data.distance,vehicle:{...v},payment:data.payment,departureTime:data.departureTime,
  routeHash:createHash('sha256').update(JSON.stringify({c,v,p:data.payment,d:data.departureTime})).digest('hex'),
  body:{mapProvider:'custom',polyline,departureTime:data.departureTime,vehicle:{type:'2AxlesAuto',axles:2,height:{value:v.height,unit:'meter'},weight:{value:v.weightKg,unit:'kg'}},units:{currency:'EUR'}}};
}
export function normalizeTolls(data,request,now=Date.now()){
 const q={requestId:request.requestId,routeHash:request.routeHash,status:'unavailable',amountEur:null,knownSubtotalEur:null,provider:'TollGuru',fetchedAt:new Date(now).toISOString(),tariffValidAt:null,currency:'EUR',vehicle:request.vehicle,payment:request.payment,departureTime:request.departureTime,items:[],warnings:[]};
 const unavailable=why=>({...q,warnings:[why]});
 const r=data?.route,s=data?.summary;
 if(!['ok','OK'].includes(data?.status)||!object(r)||!object(s))return unavailable('Réponse tarifaire inexploitable.');
 if(!Array.isArray(s.countries)||s.countries.length!==1||s.countries[0]!=='FRA'||s.currency!=='EUR'||(s.units?.currencyUnit!==undefined&&s.units.currencyUnit!=='EUR')||s.vehicleType!=='2AxlesAuto')return unavailable('Couverture France ou véhicule non confirmé.');
 if(r.polyline!==request.body.polyline||!Number.isFinite(r.distance?.value)||Math.abs(r.distance.value-request.distance)>Math.max(100,request.distance*0.005))return unavailable('Concordance du tracé non confirmée.');
 if(!Array.isArray(r.tolls)||r.tolls.length>500||typeof r.hasTolls!=='boolean')return unavailable('Liste des péages non confirmée.');
 const hasReserve=o=>['warnings','notices','errors','error'].some(k=>o[k]!==undefined&&o[k]!==null&&o[k]!==false&&o[k]!==''&&(!Array.isArray(o[k])||o[k].length>0));
 const reserves=[data,s,r].some(hasReserve);
 if(reserves)return unavailable('Le fournisseur signale une réserve : tarif à vérifier.');
 if(r.vignettes?.length||r.hasTolls===false&&r.tolls.length)return unavailable('Frais ou péages incohérents.');
 if(!r.hasTolls){
  if(Object.entries(r.costs||{}).some(([k,v])=>k!=='fuel'&&money(v)&&v>0))return unavailable('Montants incompatibles avec l’absence de péage.');
  return {...q,status:'no_tolls',amountEur:0};
 }
 if(!r.tolls.length)return unavailable('Péages détectés sans tarifs détaillés.');
 const seen=new Set();let subtotal=0,complete=true;
 for(const t of r.tolls){
  if(!object(t))return unavailable('Détail de péage invalide.');
  const key=JSON.stringify([t.type??null,t.id??null,t.start?.id??null,t.end?.id??null,t.arrival?.distance??null,t.start?.arrival?.distance??null,t.end?.arrival?.distance??null]);if(seen.has(key))return unavailable('Paiement dupliqué dans la réponse.');seen.add(key);
  const amount=t[request.payment==='cash'?'cashCost':'licensePlateCost'];
  const known=!hasReserve(t)&&money(amount)&&t.currency==='EUR'&&t.tax?.isTaxIncluded===true;
  const label=[t.name,t.start?.name,t.end?.name].filter(x=>typeof x==='string'&&x.trim()).join(' → ').slice(0,240)||'Péage '+(q.items.length+1);
  q.items.push({label,amountEur:known?amount:null,payment:request.payment});
  if(known)subtotal+=amount;else complete=false;
 }
 const aggregate=r.costs?.[request.payment];
 if(complete&&money(aggregate)&&Math.abs(subtotal-aggregate)<0.011)return {...q,status:'estimated',amountEur:aggregate};
 return {...q,status:'partial',knownSubtotalEur:subtotal,warnings:[complete?'Total du fournisseur non concordant : somme connue uniquement.':'Certains paiements ou taxes ne sont pas renseignés pour le moyen choisi.']};
}
export function createLedger(file,limit){
 let active=false;
 return day=>{
  if(active)throw fail(429,'BUSY');active=true;
  try{
   let record;
   try{record=JSON.parse(fs.readFileSync(file,'utf8'))}catch{throw fail(503,'LEDGER_UNAVAILABLE')}
   if(!exact(record,['day','count'])||!/^\d{4}-\d\d-\d\d$/.test(record.day)||!Number.isSafeInteger(record.count)||record.count<0)throw fail(503,'LEDGER_UNAVAILABLE');
   if(record.day>day)throw fail(503,'CLOCK_INVALID');
   if(record.day!==day)record={day,count:0};
   if(record.count>=limit)throw fail(429,'DAILY_LIMIT');
   record.count++;
   const tmp=file+'.tmp';const fd=fs.openSync(tmp,'w',0o600);
   try{fs.writeFileSync(fd,JSON.stringify(record));fs.fsyncSync(fd)}finally{fs.closeSync(fd)}
   fs.renameSync(tmp,file);
  }finally{active=false}
 };
}
async function readJSON(stream,max){
 let size=0;const parts=[];
 for await(const part of stream){size+=part.length;if(size>max)throw fail(413,'BODY_TOO_LARGE');parts.push(Buffer.from(part))}
 try{return JSON.parse(Buffer.concat(parts).toString('utf8'))}catch{throw fail(400,'INVALID_JSON')}
}
export function createTollServer({key='',origins=[],qualified=false,claim=null,perMinute=6,fetchImpl=fetch,now=Date.now,timeoutMs=20000}={}){
 if(!Array.isArray(origins)||origins.some(o=>{try{const u=new URL(o);return u.origin!==o||!(u.protocol==='https:'||u.protocol==='http:'&&['127.0.0.1','localhost'].includes(u.hostname))}catch{return true}})||!Number.isSafeInteger(perMinute)||perMinute<1||!Number.isFinite(timeoutMs)||timeoutMs<=0)throw Error('Invalid toll server configuration');
 const configured=qualified===true&&/^[!-~]{8,512}$/.test(key)&&origins.length>0&&typeof claim==='function';
 let active=false,calls=[];
 const server=http.createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('Vary','Origin');res.setHeader('X-Content-Type-Options','nosniff');
  const reply=(status,value)=>{if(!res.destroyed){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value))}};
  if(req.url==='/health'&&req.method==='GET')return reply(configured?200:503,{configured});
  if(req.url!=='/api/tolls')return reply(404,{error:{code:'NOT_FOUND'}});
  if(!origins.includes(req.headers.origin))return reply(403,{error:{code:'ORIGIN_REFUSED'}});
  res.setHeader('Access-Control-Allow-Origin',req.headers.origin);
  if(req.method==='OPTIONS'){res.setHeader('Access-Control-Allow-Methods','POST');res.setHeader('Access-Control-Allow-Headers','Content-Type');res.writeHead(204);return res.end()}
  if(req.method!=='POST')return reply(405,{error:{code:'METHOD_REFUSED'}});
  if(!configured)return reply(503,{error:{code:'NOT_CONFIGURED'}});
  const abort=new AbortController();const disconnect=()=>{if(!res.writableEnded)abort.abort()};res.on('close',disconnect);
  let acquired=false,timer;
  try{
   if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||'')||req.headers['content-encoding'])throw fail(415,'JSON_REQUIRED');
   const input=await readJSON(req,6*1024*1024),request=buildTollRequest(input);
   if(abort.signal.aborted)return;
   const time=now();if(Math.abs(Date.parse(input.departureTime)-time)>366*86400000)throw fail(400,'INVALID_DATE');
   calls=calls.filter(t=>t>time-60000);if(active||calls.length>=perMinute)throw fail(429,'BUSY');
   active=true;acquired=true;claim(new Date(time).toISOString().slice(0,10));calls.push(time);
   timer=setTimeout(()=>abort.abort(),timeoutMs);
   const response=await fetchImpl('https://apis.tollguru.com/toll/v2/complete-polyline-from-mapping-service',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':key},body:JSON.stringify(request.body),signal:abort.signal,redirect:'error'});
   if(!response.ok){if(response.body)await response.body.cancel();throw fail(response.status===429?429:502,response.status===429?'UPSTREAM_LIMIT':'UPSTREAM_UNAVAILABLE')}
   const data=await readJSON(response.body,8*1024*1024).catch(()=>{throw fail(502,'INVALID_UPSTREAM')});
   reply(200,normalizeTolls(data,request,now()));
  }catch(e){reply(e.controlled?e.status:abort.signal.aborted?504:502,{error:{code:e.controlled?e.code:abort.signal.aborted?'TIMEOUT':'UPSTREAM_UNAVAILABLE'}})}
  finally{clearTimeout(timer);res.removeListener('close',disconnect);if(acquired)active=false}
 });
 server.requestTimeout=10000;server.headersTimeout=10000;server.maxConnections=30;return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const limit=Number(process.env.TOLLS_DAILY_LIMIT||0),file=process.env.TOLLS_LEDGER_FILE;
 const claim=file&&Number.isSafeInteger(limit)&&limit>0?createLedger(file,limit):null;
 createTollServer({key:process.env.TOLLGURU_API_KEY,origins:(process.env.ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean),qualified:process.env.TOLLS_FRANCE_QUALIFIED==='1',claim})
 .listen(Number(process.env.PORT||8788),process.env.HOST||'127.0.0.1',()=>console.log('Toll service started. No request logging.'));
}
