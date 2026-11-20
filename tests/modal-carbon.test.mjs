import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const c={TextEncoder,structuredClone,Date,Intl,URLSearchParams};vm.createContext(c);const source=fs.readFileSync('DragonRoute/app.js','utf8');
for(const name of ['JOURNAL MODEL','PROSPECTIVE CARBON MODEL','TRANSIT MODEL','TRANSIT CARBON MODEL','MODAL CARBON MODEL'])vm.runInContext(source.split('// BEGIN '+name+'\n')[1].split('// END '+name)[0],c);
const q={now:0,instant:1000000,maxTransfers:null,transferStrict:false},leg=(mode,distance)=>({mode,distance});
const route=(legs=[leg('TRAM',10000)],extra={})=>({start:1010000,end:1100000,duration:90,walk:0,transfers:0,legs,...extra});
const road=(distance=100000,extra={})=>({status:'ready',distance,start:1000000,end:1100000,duration:100,elapsed:100,...extra});
const choices=(p={})=>({persons:1,vehicle:'car',fuel:'Gazole',car:{factorId:'voiture-compact-diesel',occupants:'4'},cycle:true,transit:[['tramway']],...p});
const rows=(r=[route()],roads={car:road(),walk:road(1000),cycle:road(5000)},raw=choices(),query=q)=>c.modalCarbonRows(r,roads,query,raw),by=(rs,key)=>rs.find(r=>r.key===key),close=(a,b)=>assert.ok(Math.abs(a-b)<1e-12,a+' != '+b);
test('modal carbon: one person, vehicle allocation and passenger units without double division',()=>{const r=rows(),car=by(r,'car').emission,tc=by(r,'transit-0').emission;close(car.vehicleKg,14.225341222954335);close(car.totalKg,car.vehicleKg/4);close(tc.totalKg,.0428);assert.equal(tc.persons,1);assert.equal(car.details[0].factor.unit,'kgCO2e/vehicle-km');assert.equal(tc.details[0].factor.unit,'kgCO2e/person-km');assert.equal(c.modalCarbonOrder(r,'carbon').eligible,2)});
test('modal carbon: unknown walking never becomes zero, partial subtotal cannot join comparable group',()=>{const r=rows([route([leg('WALK',0),leg('TRAM',10000)])],{car:road(),walk:road(0)},choices({transit:[['','tramway']]})),tc=by(r,'transit-0').emission;assert.equal(tc.status,'partial');assert.equal(tc.totalKg,null);close(tc.subtotalKg,.0428);assert.equal(tc.missingSteps,1);assert.equal(tc.missingMeters,0);assert.equal(by(r,'walk').emission.subtotalKg,null);assert.equal(c.modalCarbonOrder(r,'carbon').canSortCarbon,false)});
test('modal carbon: mechanical bicycle construction remains separate, never electric substitution',()=>{const r=rows(),bike=by(r,'cycle');assert.equal(bike.emission.scope,'construction');close(bike.emission.totalKg,5*.00017);assert.equal(bike.comparable,false);assert.equal(c.modalCarbonOrder(r,'carbon').other.some(r=>r.key==='cycle'),true);assert.equal(by(rows(undefined,undefined,choices({cycle:false})),'cycle').emission.totalKg,null)});
test('modal carbon: fuel, vehicle, model and occupants require explicit compatible hypotheses',()=>{for(const raw of [choices({vehicle:'caravan'}),choices({fuel:'E85'}),choices({car:{factorId:'tramway',occupants:2}}),choices({car:{factorId:'voiture-compact-diesel',occupants:''}}),choices({car:{factorId:'',occupants:2}})])assert.equal(by(rows(undefined,undefined,raw),'car').emission.status,'unavailable');assert.equal(by(rows(undefined,undefined,choices({transit:[['busthermique']]})),'transit-0').emission.status,'unavailable')});
test('modal carbon: strict constraints exclude an otherwise complete estimate before sorting',()=>{const r=rows([route(undefined,{transfers:1})],{car:road(),cycle:road(5000,{status:'excluded',reason:'Limite dépassée'})},choices(),{...q,maxTransfers:0,transferStrict:true});const tc=by(r,'transit-0');assert.equal(tc.emission.status,'complete');assert.equal(tc.status,'excluded');assert.equal(tc.comparable,false);const o=c.modalCarbonOrder(r,'carbon');assert.equal(o.eligible,1);assert.equal(o.canSortCarbon,false);assert.deepEqual(Array.from(o.other,r=>r.key),['transit-0','walk','cycle'])});
test('modal carbon: same scope group is separate from missing or different scope rows',()=>{const r=rows([route(),route([leg('WALK',100)])],undefined,choices({transit:[['tramway'],['']]})),o=c.modalCarbonOrder(r,'carbon');assert.deepEqual(Array.from(o.group,r=>r.key),['transit-0','car']);assert.ok(o.other.some(r=>r.key==='transit-1'));assert.ok(o.other.some(r=>r.key==='cycle'));assert.ok(o.other.some(r=>r.key==='walk'));assert.ok(o.other.every(r=>!r.tied))});
test('modal carbon: stable original option identities, no mutation of routes or hypotheses',()=>{const data=[route(undefined,{end:1200000}),route(undefined,{end:1100000})],raw=choices({transit:[['tramway'],['tramway']]}),before=JSON.stringify([data,raw]);const rs=rows(data,{},raw),a=by(rs,'transit-0'),b=by(rs,'transit-1');assert.equal(a.index,0);assert.equal(b.index,1);for(const sort of ['mode','time','distance','carbon'])c.modalCarbonOrder(rs,sort);assert.equal(JSON.stringify([data,raw]),before);a.emission.details[0].factor.energy=999;close(by(rows(),'transit-0').emission.totalKg,.0428)});
test('modal carbon: ties at displayed precision, tiny positive is distinct from explicit zero',()=>{const rs=rows([route([leg('TRAM',0)]),route([leg('TRAM',.1)]),route([leg('TRAM',.2)]),route([leg('TRAM',1000)]),route([leg('TRAM',1001)])],{},choices({transit:Array.from({length:5},()=>['tramway'])})),o=c.modalCarbonOrder(rs,'carbon');assert.deepEqual(Array.from(o.group,r=>r.key),['transit-0','transit-1','transit-2','transit-3','transit-4']);assert.equal(o.group[0].tied,false);assert.ok(o.group.slice(1).every(r=>r.tied));assert.equal(o.group[0].emission.totalKg,0);assert.ok(o.group[1].emission.totalKg>0)});
test('modal carbon: invalid distances and choices stay unknown, partial distances not invented',()=>{for(const d of [null,undefined,'1000',-1,Infinity,NaN,150001]){const rs=rows([route([leg('TRAM',d)])],{car:road(1,{distance:d}),cycle:road(1,{distance:d})});for(const k of ['transit-0','car','cycle'])assert.equal(by(rs,k).emission.totalKg,null)}for(const invalid of [[],{},['tramway','tramway']])assert.equal(by(rows(undefined,undefined,choices({transit:[invalid]})),'transit-0').emission.status,'unavailable')});
test('modal carbon: empty collective reply and road outage produce no fictitious total',()=>{const rs=rows([],{car:{status:'unavailable',reason:'Service indisponible'}},choices());assert.equal(rs.length,3);assert.ok(rs.every(r=>r.emission.totalKg===null));assert.equal(c.modalCarbonOrder(rs,'carbon').eligible,0);assert.equal(c.modalCarbonOrder(rs,'carbon').group.length,0)});
test('modal carbon: raw time and distance sorts preserve ties and strict references',()=>{const rs=rows([route()],{car:road(10000),walk:road(5000,{elapsed:130}),cycle:road(100,{status:'excluded'})}),d=c.modalCarbonOrder(rs,'distance');assert.equal(d.group[0].key,'walk');assert.ok(d.group.slice(1).every(r=>r.tied));assert.equal(d.other[0].key,'cycle');assert.throws(()=>c.modalCarbonOrder(rs,'score'));assert.throws(()=>c.modalCarbonOrder(rs,null))});
test('modal carbon: half-decimal ties use the same rounding as displayed values',()=>{const rs=rows([route(),route()],{},choices({transit:[['tramway'],['tramway']]}));rs[0].emission.totalKg=rs[0].emission.groupTotalKg=.5005;rs[1].emission.totalKg=rs[1].emission.groupTotalKg=.5014;assert.equal((.5005).toLocaleString('fr-FR',{minimumFractionDigits:3,maximumFractionDigits:3}),'0,501');assert.ok(c.modalCarbonOrder(rs,'carbon').group.every(r=>r.tied));rs[0].distanceMeters=500.5;rs[1].distanceMeters=501.4;assert.ok(c.modalCarbonOrder(rs,'distance').group.every(r=>r.tied))});

test('modal group: two travelers in four occupants, individual and vehicle totals stay distinct',()=>{
 const baseline=rows(),rs=rows(undefined,undefined,choices({persons:2})),car=by(rs,'car').emission,tc=by(rs,'transit-0').emission,bike=by(rs,'cycle').emission;
 close(car.vehicleKg,14.225341222954335);close(car.totalKg,car.vehicleKg/4);close(car.groupTotalKg,car.vehicleKg/2);
 close(tc.totalKg,.0428);close(tc.groupTotalKg,.0856);close(bike.groupTotalKg,.0017);assert.equal(bike.scope,'construction');assert.equal(by(rs,'cycle').comparable,false);
 for(const row of rs){assert.equal(row.emission.persons,2);assert.equal(row.distanceMeters,by(baseline,row.key).distanceMeters);assert.equal(row.elapsed,by(baseline,row.key).elapsed)}
});
test('modal group: nine travelers allocate the entire nine-occupant car without adding shares',()=>{
 const raw=choices({persons:'9',car:{factorId:'voiture-compact-diesel',occupants:'9'}}),rs=rows(undefined,undefined,raw),car=by(rs,'car').emission,tc=by(rs,'transit-0').emission;
 close(car.groupTotalKg,car.vehicleKg);close(car.totalKg*9,car.vehicleKg);close(tc.groupTotalKg,.0428*9);assert.equal(tc.details[0].factor.unit,'kgCO2e/person-km');
 assert.equal(tc.persons,9);assert.ok(car.groupTotalKg<car.vehicleKg+car.totalKg);
});
test('modal group: absent, fractional or out-of-range travelers remove every carbon value and ranking',()=>{
 for(const persons of ['',null,undefined,0,-1,10,1.5,NaN,Infinity,false,[],{},'bad']){
  const rs=rows(undefined,undefined,choices({persons}));assert.ok(rs.every(r=>r.emission.status==='unavailable'&&r.emission.totalKg===null&&r.emission.groupTotalKg===null&&r.emission.groupSubtotalKg===null));
  for(const sort of ['time','distance','carbon']){const order=c.modalCarbonOrder(rs,sort);assert.equal(order.peopleValid,false);assert.equal(order.canSortCarbon,false);assert.deepEqual(Array.from(order.group,r=>r.index),[0,1,2,3])}
 }
});
test('modal group: group exceeding occupants invalidates only car, compatible hypotheses can be re-evaluated',()=>{
 const raw=choices({persons:5}),before=JSON.stringify(raw),rs=rows(undefined,undefined,raw);
 assert.equal(by(rs,'car').emission.status,'unavailable');assert.equal(by(rs,'car').emission.groupTotalKg,null);close(by(rs,'transit-0').emission.groupTotalKg,.214);
 assert.equal(JSON.stringify(raw),before);assert.equal(by(rows(undefined,undefined,{...raw,persons:3}),'car').emission.status,'complete');
});
test('modal group: missing walking remains partial and never gains a complete group total',()=>{
 const rs=rows([route([leg('WALK',0),leg('TRAM',10000),leg('WALK',100)])],{},choices({persons:3,transit:[['','tramway','']]})),tc=by(rs,'transit-0').emission;
 assert.equal(tc.status,'partial');assert.equal(tc.totalKg,null);assert.equal(tc.groupTotalKg,null);close(tc.subtotalKg,.0428);close(tc.groupSubtotalKg,.1284);assert.equal(tc.missingSteps,2);assert.equal(tc.missingMeters,100);assert.equal(c.modalCarbonOrder(rs,'carbon').eligible,0);
});
test('modal group: ties use the group precision while positive amounts remain distinct from zero',()=>{
 const rs=rows([route([leg('TRAM',0)]),route([leg('TRAM',.1)]),route([leg('TRAM',.2)]),route([leg('TRAM',1000)]),route([leg('TRAM',1001)])],{},choices({persons:3,transit:Array.from({length:5},()=>['tramway'])})),o=c.modalCarbonOrder(rs,'carbon');
 assert.equal(o.group[0].emission.groupTotalKg,0);assert.equal(o.group[0].tied,false);assert.ok(o.group.slice(1).every(r=>r.tied));
 rs[3].emission.groupTotalKg=.5005;rs[4].emission.groupTotalKg=.5014;assert.ok(c.modalCarbonOrder(rs,'carbon').group.slice(-2).every(r=>r.tied));
});
test('modal group: incompatible populations cannot be ranked together',()=>{
 const rs=rows(),different=rows(undefined,undefined,choices({persons:2}));rs[0]=different.find(r=>r.key===rs[0].key);
 for(const sort of ['carbon','time','distance']){const o=c.modalCarbonOrder(rs,sort);assert.equal(o.eligible,0);assert.equal(o.peopleValid,false);assert.ok(o.group.every(r=>!r.tied))}
});
test('modal group: strict constraints and original route/model data survive group recalculation',()=>{
 const routes=[route(undefined,{transfers:1})],raw=choices({persons:3}),before=JSON.stringify([routes,raw]),rs=rows(routes,{car:road()},raw,{...q,maxTransfers:0,transferStrict:true}),tc=by(rs,'transit-0');
 close(tc.emission.groupTotalKg,.1284);assert.equal(tc.status,'excluded');assert.equal(tc.comparable,false);assert.equal(c.modalCarbonOrder(rs,'carbon').eligible,1);assert.equal(JSON.stringify([routes,raw]),before);
 const one=c.estimateTransitCarbon(routes[0],['tramway']);assert.equal(one.persons,1);close(one.totalKg,.0428);
});
