import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
const ctx={TextEncoder,structuredClone};vm.createContext(ctx);vm.runInContext(fs.readFileSync('DragonRoute/app.js','utf8').split('// BEGIN JOURNAL MODEL\n')[1].split('// END JOURNAL MODEL')[0],ctx);
const at='2026-11-18T10:00:00.000Z',entry=(p={})=>({id:'test',date:'2026-11-17',mode:'car',distanceMeters:100000,distanceSource:'declared',start:'Lyon',end:'Valence',note:'',revision:1,createdAt:at,updatedAt:at,calculation:null,emissions:ctx.unavailableCarbon(),emissionsHistory:[],...p});
const dataset=JSON.parse(fs.readFileSync('data/carbon/impactco2-2026-11-18.json','utf8'));
test('carbon: frozen source, exact extraction, units and bundled dataset agree',()=>{
 const raw=fs.readFileSync('data/carbon/deplacement.source.ts','utf8');assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),dataset.sourceSha256);
 const upstream=vm.runInNewContext(raw.replace(/import[^\n]+\n/,'').replace('export const deplacements =','').replace(' satisfies Equivalent[]',''));
 assert.equal(JSON.stringify(vm.runInContext('CARBON_DATA',ctx)),JSON.stringify(dataset));assert.equal(dataset.factors.length,31);
 for(const f of dataset.factors){const original=upstream.find(d=>d.slug===f.id);assert.equal(f.construction,original.ecv.find(x=>x.id===5)?.value??0);assert.equal(f.energy,original.ecv.find(x=>x.id===6)?.value??0);assert.equal(f.unit,f.mode==='car'?'kgCO2e/vehicle-km':'kgCO2e/person-km')}
 assert.match(fs.readFileSync('data/carbon/impactco2-MIT.txt','utf8'),/Copyright.*Datagir/);
});
test('carbon: km conversion and equal car allocation include the driver, never duplicate totals',()=>{
 const single=ctx.estimateCarbon(entry(),'voiture-compact-diesel',1,at),shared=ctx.estimateCarbon(entry(),'voiture-compact-diesel',4,at);
 assert.ok(Math.abs(single.valueKg-14.225341222954335)<1e-12);assert.equal(shared.valueKg,single.valueKg/4);assert.equal(shared.vehicleKg,single.vehicleKg);
 for(const n of [0,10,1.5,NaN,'2',null])assert.throws(()=>ctx.estimateCarbon(entry(),'voiture-compact-diesel',n,at));
});
test('carbon: passenger factors are not divided again and bike construction is not zero',()=>{
 const train=ctx.estimateCarbon(entry({mode:'train'}),'tgv',5,at);assert.ok(Math.abs(train.valueKg-.293)<1e-12);assert.equal(train.occupants,null);assert.equal(train.vehicleKg,null);
 assert.ok(Math.abs(ctx.estimateCarbon(entry({mode:'bike',distanceMeters:10000}),'velo',null,at).valueKg-.0017)<1e-12);
 assert.equal(ctx.estimateCarbon(entry({mode:'bike',distanceMeters:0}),'velo',null,at).valueKg,0);
});
test('carbon: unavailable distance, incompatible modes and tampered snapshots fail closed',()=>{
 for(const p of [{distanceMeters:null},{mode:'walk'},{mode:'truck'},{distanceMeters:-1}])assert.throws(()=>ctx.estimateCarbon(entry(p),'tgv',1,at));
 const c=ctx.estimateCarbon(entry(),'voiture-compact-diesel',1,at);assert.equal(ctx.validateCarbon(c).valueKg,c.valueKg);
 for(const p of [{valueKg:0},{vehicleKg:null},{dataset:'future'},{occupants:2},{factor:{...c.factor,source:'javascript:alert(1)'}}])assert.throws(()=>ctx.validateCarbon({...c,...p}));
 assert.throws(()=>ctx.validateJournal({version:2,enabled:true,entries:[entry({distanceMeters:50000,emissions:c})]}));
});
test('carbon: explicit update archives the exact calculation, corrections invalidate without recalculation',()=>{
 const old=entry();old.emissions=ctx.estimateCarbon(old,'voiture-compact-diesel',1,at);const original=JSON.stringify(old);
 const changed=ctx.reviseCarbon({...old,distanceMeters:50000},old,null,at);assert.equal(changed.emissions.valueKg,null);assert.equal(changed.emissionsHistory[0].estimate.valueKg,old.emissions.valueKg);assert.equal(JSON.stringify(old),original);
 const updated=ctx.reviseCarbon({...old},old,{factorId:'voiture-compact-diesel',occupants:2},at);assert.equal(updated.emissions.valueKg,old.emissions.valueKg/2);assert.equal(updated.emissionsHistory.length,1);
 const note=ctx.reviseCarbon({...old,note:'correction'},old,null,at);assert.equal(note.emissions.valueKg,old.emissions.valueKg);assert.equal(note.emissionsHistory.length,0);
 assert.throws(()=>ctx.reviseCarbon(old,{...old,emissionsHistory:Array(50).fill(updated.emissionsHistory[0])},{factorId:'voiture-compact-diesel',occupants:1},at));
});
test('carbon: monthly totals expose missing data and keep different scopes separate',()=>{
 const a=entry(),b=entry({id:'b',mode:'bike'}),c=entry({id:'c',mode:'walk'});a.emissions=ctx.estimateCarbon(a,'voiture-compact-diesel',2,at);b.emissions=ctx.estimateCarbon(b,'velo',null,at);
 const m=ctx.journalMonthly([a,b,c],'2026-11');assert.equal(m.carbonUnknown,1);assert.equal(m.modes.walk.carbonUnknown,1);assert.equal(m.modes.car.carbonGroups['construction-energy'].valueKg,a.emissions.valueKg);assert.equal(m.carbonGroups['construction-energy'].valueKg,a.emissions.valueKg);assert.equal(m.carbonGroups.construction.valueKg,b.emissions.valueKg);assert.equal(Object.keys(m.carbonGroups).length,2);
 const old={version:1,enabled:true,entries:[entry()]},raw=JSON.stringify(old);const migrated=ctx.validateJournal(old);assert.equal(migrated.version,2);assert.equal(migrated.entries[0].emissions.valueKg,null);assert.equal(JSON.stringify(old),raw);
});
