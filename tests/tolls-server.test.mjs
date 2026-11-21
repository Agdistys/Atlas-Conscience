import {test} from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {buildTollRequest,normalizeTolls,encodePolyline,createTollServer,createLedger} from '../server/tolls.mjs';
const input=()=>({requestId:'test-1',coordinates:[[4.8357,45.764],[4.8924,44.9334]],distance:104000,vehicle:{type:'car',height:1.6,weightKg:1900,axles:2},payment:'cash',departureTime:new Date().toISOString()});
const upstream=(r,amount=9.5)=>({status:'OK',summary:{countries:['FRA'],currency:'EUR',vehicleType:'2AxlesAuto'},route:{polyline:r.body.polyline,distance:{value:r.distance},hasTolls:true,costs:{cash:amount,licensePlate:11},tolls:[{id:1,name:'Péage exemple fictif',currency:'EUR',tax:{isTaxIncluded:true},cashCost:amount,licensePlateCost:11}]}});
const origin='https://agdistys.github.io',secret='fake-private-toll-test-key';
async function fixture(t,options={}){
 const calls=[],claims=[];
 const server=createTollServer({key:secret,origins:[origin],qualified:true,claim:d=>claims.push(d),fetchImpl:async(url,init)=>{calls.push({url,init});const r=buildTollRequest(input());r.body=JSON.parse(init.body);return Response.json(upstream(r))},...options});
 server.listen(0,'127.0.0.1');await once(server,'listening');
 t.after(async()=>{server.closeAllConnections();await new Promise(r=>server.close(r))});
 const url=`http://127.0.0.1:${server.address().port}`;
 const post=(data=input(),headers={})=>fetch(url+'/api/tolls',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...headers},body:JSON.stringify(data)});
 return {url,post,calls,claims};
}
test('tolls: full polyline encoding and exact request binding',()=>{
 assert.equal(encodePolyline([[-120.2,38.5],[-120.95,40.7],[-126.453,43.252]]),'_p~iF~ps|U_ulLnnqC_mqNvxq`@');
 const a=input(),r=buildTollRequest(a);assert.equal(r.body.mapProvider,'custom');assert.equal(r.body.vehicle.height.unit,'meter');assert.equal(r.body.vehicle.weight.value,1900);
 assert.notEqual(r.routeHash,buildTollRequest({...a,coordinates:[...a.coordinates,[5,44]]}).routeHash);
 assert.notEqual(r.routeHash,buildTollRequest({...a,payment:'licensePlate'}).routeHash);
 for(const bad of [{...a,url:'https://evil.test'},{...a,coordinates:[[4,null],[5,45]]},{...a,coordinates:[[-90,40],[5,45]]},{...a,vehicle:{...a.vehicle,type:'truck'}},{...a,vehicle:{...a.vehicle,height:2.1}},{...a,vehicle:{...a.vehicle,axles:3}},{...a,payment:'tag'}])assert.throws(()=>buildTollRequest(bad));
});
test('tolls: complete, confirmed zero, partial and unavailable are distinct',()=>{
 const r=buildTollRequest(input());let d=upstream(r);assert.equal(normalizeTolls(d,r).amountEur,9.5);
 d.route.hasTolls=false;d.route.tolls=[];d.route.costs={cash:null};assert.equal(normalizeTolls(d,r).status,'no_tolls');assert.equal(normalizeTolls(d,r).amountEur,0);
 d=upstream(r);d.route.costs.cash=false;d.route.tolls.push({id:2,name:'Inconnu',currency:'EUR',cashCost:null});
 const q=normalizeTolls(d,r);assert.equal(q.status,'partial');assert.equal(q.amountEur,null);assert.equal(q.knownSubtotalEur,9.5);
 d=upstream(r);d.route.tolls=[];assert.equal(normalizeTolls(d,r).status,'unavailable');
});
test('tolls: foreign coverage, vehicle mismatch, changed path and warnings refuse estimates',()=>{
 const r=buildTollRequest(input());
 for(const mutate of [d=>d.summary.countries.push('ESP'),d=>d.summary.currency='USD',d=>d.summary.vehicleType='3AxlesAuto',d=>d.route.polyline='',d=>d.route.distance.value=50000,d=>d.route.warnings=['unknown rates'],d=>d.summary.notices=['partial'],d=>d.route.vignettes=[{}]]){
  const d=upstream(r);mutate(d);const q=normalizeTolls(d,r);assert.equal(q.status,'unavailable');assert.equal(q.amountEur,null);
 }
});
test('tolls: false, absent VAT, duplicate payments and alternative tariffs never form a false total',()=>{
 const r=buildTollRequest(input());let d=upstream(r);d.route.tolls[0].cashCost=false;assert.equal(normalizeTolls(d,r).status,'partial');
 d=upstream(r);delete d.route.tolls[0].tax;assert.equal(normalizeTolls(d,r).knownSubtotalEur,0);
 d=upstream(r);d.route.tolls.push({...d.route.tolls[0]});assert.equal(normalizeTolls(d,r).status,'unavailable');
 d=upstream(r);d.route.tolls.push({...d.route.tolls[0],cashCost:1});assert.equal(normalizeTolls(d,r).status,'unavailable');
 d=upstream(r);d.route.tolls[0].warnings=['rate unconfirmed'];assert.equal(normalizeTolls(d,r).status,'partial');
 d=upstream(r);d.route.costs.cash=20;assert.equal(normalizeTolls(d,r).status,'partial');
 const plate=buildTollRequest({...input(),payment:'licensePlate'});assert.equal(normalizeTolls(upstream(plate),plate).amountEur,11);
});
test('tolls: fixed private upstream, request binding and no secret in response',async t=>{
 const {post,calls,claims}=await fixture(t);const response=await post();const q=await response.json();
 assert.equal(response.status,200);assert.equal(q.status,'estimated');assert.equal(q.requestId,'test-1');assert.equal(claims.length,1);
 assert.equal(calls[0].url,'https://apis.tollguru.com/toll/v2/complete-polyline-from-mapping-service');assert.equal(calls[0].init.headers['x-api-key'],secret);assert.equal(calls[0].init.redirect,'error');
 assert.equal(response.headers.get('cache-control'),'no-store');assert.equal(JSON.stringify(q).includes(secret),false);
});
test('tolls: unqualified, absent quota and refused origin make no upstream call',async t=>{
 for(const options of [{qualified:false},{claim:null},{key:''}]){const f=await fixture(t,options);assert.equal((await f.post()).status,503);assert.equal(f.calls.length,0)}
 const f=await fixture(t);assert.equal((await f.post(input(),{Origin:'https://unknown.test'})).status,403);assert.equal(f.calls.length,0);
 assert.equal((await f.post({...input(),vehicle:{type:'caravan'}})).status,400);assert.equal(f.claims.length,0);
});
test('tolls: quota persists through restart and is claimed before the remote call',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'oqq-tolls-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const file=path.join(dir,'ledger.json');
 fs.writeFileSync(file,JSON.stringify({day:'2026-11-17',count:0}));createLedger(file,1)('2026-11-17');assert.throws(()=>createLedger(file,1)('2026-11-17'),/DAILY_LIMIT/);createLedger(file,1)('2026-11-18');
 assert.throws(()=>createLedger(file,1)('2026-11-17'),/CLOCK_INVALID/);fs.writeFileSync(file,'invalid');assert.throws(()=>createLedger(file,1)('2026-11-18'),/LEDGER_UNAVAILABLE/);
 const f=await fixture(t,{claim:()=>{throw Object.assign(Error('quota'),{controlled:true,status:429,code:'DAILY_LIMIT'})}});assert.equal((await f.post()).status,429);assert.equal(f.calls.length,0);
});
test('tolls: no retry and no upstream error detail on 429 or timeout',async t=>{
 const f=await fixture(t,{fetchImpl:async()=>new Response(secret,{status:429})});const r=await f.post();assert.equal(r.status,429);assert.equal((await r.text()).includes(secret),false);assert.equal(f.claims.length,1);
 const slow=await fixture(t,{timeoutMs:20,fetchImpl:async(_,init)=>new Promise((resolve,reject)=>init.signal.addEventListener('abort',()=>reject(Error(secret))))});const s=await slow.post();assert.equal(s.status,504);assert.equal((await s.text()).includes(secret),false);assert.equal(slow.claims.length,1);
});
