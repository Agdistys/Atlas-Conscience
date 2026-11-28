import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const ctx={TextEncoder,structuredClone};vm.createContext(ctx);vm.runInContext(fs.readFileSync('DragonRoute/app.js','utf8').split('// BEGIN JOURNAL MODEL\n')[1].split('// END JOURNAL MODEL')[0],ctx);
const entry=(patch={})=>({id:'test-a',date:'2026-10-12',start:'Lyon',end:'Valence',mode:'car',distanceMeters:100000,distanceSource:'declared',note:'',createdAt:'2026-10-12T12:00:00.000Z',updatedAt:'2026-10-12T12:00:00.000Z',revision:1,calculation:null,emissions:{version:'unavailable-v1',status:'unavailable',valueKg:null,factor:null},...patch});
const journal=entries=>({version:1,enabled:true,entries});
test('journal: strict dates, unknown values and future formats preserve an honest data contract',()=>{
 for(const d of ['2026-02-29','2026-02-30','2026-13-01','2026-1-02','1899-12-31',''])assert.throws(()=>ctx.journalDate(d));assert.equal(ctx.journalDate('2024-02-29'),'2024-02-29');
 for(const patch of [{mode:'plane'},{distanceMeters:-1},{distanceMeters:NaN},{distanceMeters:'0'},{distanceMeters:null},{distanceSource:'route'},{revision:0},{createdAt:'2026-02-30T12:00:00.000Z'},{emissions:{version:'future',valueKg:0}},{calculation:undefined}])assert.throws(()=>ctx.validateJournal(journal([entry(patch)])));
 assert.throws(()=>ctx.validateJournal({...journal([]),version:999}));assert.throws(()=>ctx.validateJournal(journal([entry(),entry()])));assert.throws(()=>ctx.validateJournal(journal(Array.from({length:1001},(_,i)=>entry({id:'a-'+i})))));
 const unknown=ctx.validateJournal(journal([entry({distanceMeters:null,distanceSource:'unknown'})]));assert.equal(unknown.entries[0].distanceMeters,null);assert.equal(unknown.entries[0].emissions.valueKg,null);
});
test('journal: monthly totals distinguish unknown distance, declared zero and missing carbon',()=>{
 const e=[entry({id:'a',distanceMeters:12500}),entry({id:'b',mode:'bike',distanceMeters:0}),entry({id:'c',mode:'bike',distanceMeters:null,distanceSource:'unknown'}),entry({id:'d',date:'2026-09-01'})];const m=ctx.journalMonthly(e,'2026-10');assert.equal(m.count,3);assert.equal(m.meters,12500);assert.equal(m.unknown,1);assert.equal(m.carbonUnknown,3);assert.equal(m.modes.bike.count,2);assert.equal(m.modes.bike.unknown,1);assert.equal(ctx.journalMonthly(e.filter(x=>x.id!=='a'),'2026-10').meters,0);
});
test('journal: historical route survives corrections and extra properties are never exported',()=>{
 const calculation={version:'route-snapshot-v1',engine:'ign',start:'Lyon',end:'Valence',resourceVersion:'source-test',calculatedAt:'2026-10-12T10:00:00.000Z',mode:'car',distanceMeters:100000,stop:'Station test'};
 const e=entry({calculation,apiKey:'secret-marker',distanceSource:'route'});e.calculation.secret='secret-marker';const before=JSON.stringify(e),clean=ctx.validateJournal(journal([e]));assert.equal(JSON.stringify(e),before);assert.ok(!JSON.stringify(clean).includes('secret-marker'));
 const corrected=ctx.validateJournal(journal([{...clean.entries[0],distanceMeters:12000,distanceSource:'declared',mode:'bike',revision:2}]));assert.equal(corrected.entries[0].calculation.distanceMeters,100000);assert.equal(corrected.entries[0].calculation.resourceVersion,'source-test');assert.equal(corrected.entries[0].emissions.valueKg,null);
});
test('journal: duplicate identity is stable after reload and separates distinct trips',()=>{
 const a=entry();assert.equal(ctx.journalIdentity(a),ctx.journalIdentity({...a,id:'b',createdAt:'later',start:' LYON ',end:' Valence '}));for(const p of [{date:'2026-10-13'},{mode:'bike'},{distanceMeters:0},{end:'Grenoble'}])assert.notEqual(ctx.journalIdentity(a),ctx.journalIdentity({...a,...p}));
});
