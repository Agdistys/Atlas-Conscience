import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const ctx={TextEncoder,Intl,Date};vm.createContext(ctx);const src=fs.readFileSync('DragonRoute/app.js','utf8');for(const name of ['STATION HOURS MODEL','TIMING MODEL','PREPARED TRIPS MODEL','MEETINGS MODEL','CARPOOL MODEL'])vm.runInContext(src.split('// BEGIN '+name+'\n')[1].split('// END '+name)[0],ctx);
const plan={pickup:{label:'Gare P',lat:45.5,lon:4.9},dropoff:{label:'Gare D',lat:45.1,lon:4.8},limits:{km:30,minutes:45},stationPosition:'before'},station={lat:45.4,lon:4.85};
const route=legs=>({distance:legs.reduce((n,l)=>n+l[0],0),duration:legs.reduce((n,l)=>n+l[1],0),legs:legs.map(([distance,duration])=>({distance,duration}))});
test('rencontres : ordre explicite du plein et cumul de la distance d’accès, portion commune exacte',()=>{
 for(const [position,kinds,shared,access] of [['before','start station pickup dropoff end',30,10],['during','start pickup station dropoff end',50,30],['after','start pickup dropoff station end',20,60]]){
  const nodes=ctx.meetingNodes([45.7,4.8],[44.9,4.9],{...plan,stationPosition:position},station),r=ctx.meetingLegs(route([[10,1],[20,2],[30,3],[40,4]]),nodes);
  assert.equal(nodes.map(n=>n.kind).join(' '),kinds);assert.equal(r.sharedDistance,shared);assert.equal(r.accessDistance,access);assert.equal(r.accessSeconds,access/10);
 }
 assert.equal(ctx.meetingNodes([1,2],[3,4],null,station).map(n=>n.kind).join(' '),'start station end');
});
test('rencontres : réponses sans étapes, sommes incohérentes ou valeurs négatives refusées',()=>{
 const nodes=ctx.meetingNodes([45.7,4.8],[44.9,4.9],plan),valid=route([[10,1],[20,2],[30,3]]);assert.equal(ctx.meetingLegs(valid,nodes).sharedDistance,20);
 for(const bad of [{...valid,legs:[]},{...valid,distance:1000},{...valid,duration:Infinity},{...valid,legs:[...valid.legs,{distance:1,duration:1}]},{...valid,legs:[{distance:-1,duration:1},...valid.legs.slice(1)]}])assert.throws(()=>ctx.meetingLegs(bad,nodes));
});
test('rencontres : écarts signés et limites cumulées station comprise, zéro est une limite',()=>{
 const ref={distance:100000,duration:6000};assert.equal(ctx.meetingDetour({distance:129000,duration:8600},ref,plan.limits).allowed,true);assert.equal(ctx.meetingDetour({distance:131000,duration:8600},ref,plan.limits).allowed,false);
 const less=ctx.meetingDetour({distance:99000,duration:5900},ref,{km:0,minutes:0});assert.equal(less.km,-1);assert.equal(less.allowed,true);assert.equal(ctx.meetingDetour({...ref,distance:100001},ref,{km:0,minutes:0}).allowed,false);
 for(const limits of [{km:null,minutes:1},{km:0,minutes:-1},{km:1001,minutes:1}])assert.throws(()=>ctx.meetingDetour(ref,ref,limits));
});
test('rencontres : seul carburant commun réparti, péages positifs non attribués, inconnus distincts de zéro',()=>{
 const cost={fuelEuro:20,tollEuro:10,tollState:'complete',shared:{km:60,fuelEuro:12}};
 let s=ctx.splitRideCosts(cost,2,3);assert.equal(s.perPassenger,400);assert.equal(s.driver,2200);assert.equal(s.passengerTotal+s.driver,3000);assert.equal(s.sharedComplete,false);
 s=ctx.splitRideCosts({...cost,tollEuro:0},2,3);assert.equal(s.sharedComplete,true);assert.equal(s.driver,1200);
 s=ctx.splitRideCosts({...cost,shared:{fuelEuro:null},fuelEuro:null},2,3);assert.equal(s.perPassenger,null);assert.equal(s.driver,null);assert.equal(s.total,1000);
 s=ctx.splitRideCosts({...cost,tollEuro:null,tollState:'unknown'},0,3);assert.equal(s.passengerTotal,0);assert.equal(s.driver,2000);assert.equal(s.sharedComplete,false);
 assert.throws(()=>ctx.splitRideCosts({...cost,shared:{fuelEuro:21}},1,1));
 for(let cents=0;cents<200;cents++)for(let n=0;n<8;n++){const r=ctx.splitRideCosts({...cost,shared:{fuelEuro:cents/100}},n,8);assert.equal(r.passengerTotal+r.driver,3000);assert.ok(r.driver>=3000-cents)}
});
test('rencontres : conservation limitée au contrat, limites et lieux invalides refusés',()=>{
 const p={...plan,secret:'PRIVATE',reference:{old:'PRIVATE'}};assert.equal(JSON.stringify(ctx.preparedMeetings(p)),JSON.stringify(plan));
 for(const p of [{...plan,limits:null},{...plan,limits:{km:-1,minutes:45}},{...plan,stationPosition:'guess'},{...plan,dropoff:plan.pickup},{...plan,pickup:{...plan.pickup,lat:91}}])assert.throws(()=>ctx.preparedMeetings(p));
 assert.equal(ctx.preparedMeetings(null),null);
});
