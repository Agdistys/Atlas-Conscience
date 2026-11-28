import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {selectedTariffNetworks,declaredSectionTariff,currentDeclaredTariff} from '../server/selected-tolls/tariffs.mjs';
import {createSelectedTollSession} from '../server/selected-tolls/session.mjs';
import {network,time} from './helpers/selected-tolls.mjs';
const ctx={window:{}};vm.runInNewContext(fs.readFileSync('DragonRoute/config.js','utf8'),ctx);const catalogue=ctx.window.DRAGONROUTE_TARIFFS;
const asf=selectedTariffNetworks(catalogue).ASF,choice={network:'ASF',entry:asf.gates.indexOf('A7 · VIENNE'),exit:asf.gates.indexOf('A7 · VALENCE-N'),confirmed:true},context={vehicleClass:'1',date:'2026-11-28'},key='exact-paid-section';
test('ASF source reconstruction preserves literal directions and missing cells',()=>{
 execFileSync('python3',['tools/build-selected-tariffs.py','--check']);assert.equal(asf.rows.length,2055);assert.equal(asf.rows.flatMap(r=>r.slice(2)).filter(v=>v===null).length,5);assert.equal(asf.rows.find(r=>r[0]===choice.exit&&r[1]===choice.entry),undefined);
});
test('official Vienne to Valence-N reference is 900/1440 cents for classes 1/2, not route-verified',()=>{
 for(const [vehicleClass,cents]of [['1',900],['2',1440]]){const r=declaredSectionTariff(catalogue,choice,{...context,vehicleClass},key,time);assert.equal(r.cents,cents);assert.equal(r.coverage,'DECLARED_NOT_ROUTE_VERIFIED');assert.equal(r.effectiveFrom,'2026-06-01');assert.equal(r.kind,'declared-gates-reference');assert.match(r.source,/Tarifs_ASF\.txt$/);assert.equal(r.price,undefined)}
});
test('existing AREA official table is reused without changing its entries',()=>{
 const n=catalogue.networks.AREA;const c={network:'AREA',entry:n.gates.indexOf('AIGUEBELETTE'),exit:n.gates.indexOf('AIX NORD'),confirmed:true};assert.equal(declaredSectionTariff(catalogue,c,context,key,time).cents,350);assert.equal(catalogue.networks.ASF,undefined);
});
test('missing Puymorens prices never become zero',()=>{
 const row=asf.rows.find(r=>r.slice(2).every(v=>v===null));assert.throws(()=>declaredSectionTariff(catalogue,{network:'ASF',entry:row[0],exit:row[1],confirmed:true},context,key,time),/inconnu/);
});
test('an explicit zero remains a declared reference, not a free-route certification',()=>{
 const row=asf.rows.find(r=>r[0]!==r[1]&&r[2]===0);const r=declaredSectionTariff(catalogue,{network:'ASF',entry:row[0],exit:row[1],confirmed:true},context,key,time);assert.equal(r.cents,0);assert.equal(r.coverage,'DECLARED_NOT_ROUTE_VERIFIED');
});
test('confirmation, actual pair and explicit direction are necessary',()=>{
 for(const c of [{...choice,confirmed:false},{...choice,confirmed:'true'},{...choice,entry:choice.exit,exit:choice.entry},{...choice,exit:choice.entry},{...choice,entry:''},{...choice,network:'missing'}])assert.throws(()=>declaredSectionTariff(catalogue,c,context,key,time));
});
test('date, current consultation period and supported declared class are bounded',()=>{
 for(const c of [{...context,vehicleClass:'3'},{...context,vehicleClass:1},{...context,date:'2026-02-30'},{...context,date:'2026-05-31'},{...context,date:'2027-01-01'}])assert.throws(()=>declaredSectionTariff(catalogue,choice,c,key,time));
 assert.throws(()=>declaredSectionTariff(catalogue,choice,context,key,Date.parse('2027-01-01T00:00:00Z')));assert.throws(()=>declaredSectionTariff(catalogue,choice,context,key,Date.parse('2026-11-27T10:00:00Z')));
});
test('changed source, amount, date, class or portion invalidates a carried reference',()=>{
 const r=declaredSectionTariff(catalogue,choice,context,key,time);assert.deepEqual(currentDeclaredTariff(catalogue,r,context,key,time),r);
 for(const delta of [{cents:1},{source:'https://example.org/'},{entryLabel:'Other'},{coverage:'VERIFIED'},{currency:'USD'},{date:'2026-11-29'},{vehicleClass:'2'}])assert.equal(currentDeclaredTariff(catalogue,{...r,...delta},context,key,time),null);
 assert.equal(currentDeclaredTariff(catalogue,r,context,'other-section',time),null);assert.equal(currentDeclaredTariff(catalogue,r,{...context,vehicleClass:'2'},key,time),null);assert.equal(currentDeclaredTariff(catalogue,r,context,key,Date.parse('2027-01-01T00:00:00Z')),null);
});
test('unknown catalogue and ambiguous source pair do not produce a reference',()=>{
 assert.deepEqual(selectedTariffNetworks(null),{});assert.throws(()=>declaredSectionTariff(null,choice,context,key,time));
 const c=structuredClone(catalogue),row=c.networks.AREA.rows[0];c.networks.AREA.rows.push(row);assert.throws(()=>declaredSectionTariff(c,{network:'AREA',entry:row[0],exit:row[1],confirmed:true},context,key,time),/ambigu/);
});
const setup=()=>{const n=network();return {...n,s:createSelectedTollSession({...n,tariffs:catalogue})}};
test('a declared tariff stays distinct from a verified price through confirmation',async()=>{
 const {s}=setup(),state=await s.compare();assert.ok(state.sections[0].key);const p=await s.choose(state.sections[0].id,{tariffChoice:choice});assert.equal(p.proposal.price,null);assert.equal(p.proposal.estimate.cents,900);p.proposal.estimate.cents=1;
 const adopted=s.confirm();assert.equal(adopted.selection.price,null);assert.equal(adopted.selection.estimate.cents,900);assert.equal(adopted.selection.estimate.sectionKey,adopted.selection.sectionKey);assert.throws(()=>s.confirm());
});
test('a declared reference cannot satisfy any strict price cap and makes no route calls',async()=>{
 const {s,calls}=setup(),state=await s.compare(),before=calls.length;await assert.rejects(s.choose(state.sections[0].id,{tariffChoice:choice,maxCents:100000}),e=>e.code==='PRICE_LIMIT');assert.equal(calls.length,before);assert.throws(()=>s.confirm());
});
test('invalid or unconfirmed gates reject before another routing request',async()=>{
 const {s,calls}=setup(),state=await s.compare(),before=calls.length;await assert.rejects(s.choose(state.sections[0].id,{tariffChoice:{...choice,confirmed:false}}),/Confirmer/);assert.equal(calls.length,before);assert.throws(()=>s.confirm());
});
test('changing class or cancelling cannot adopt an old declared amount',async()=>{
 const {s,state:n}=setup(),state=await s.compare();await s.choose(state.sections[0].id,{tariffChoice:choice});n.context.vehicleClass='2';assert.throws(()=>s.confirm(),/changé/);s.cancel();assert.throws(()=>s.confirm());
});
test('consultation expiry before confirmation rejects a formerly valid reference',async()=>{
 const {s,state:n}=setup();n.now=Date.parse('2026-12-31T22:59:59Z');n.context.date='2026-12-31';const state=await s.compare();await s.choose(state.sections[0].id,{tariffChoice:choice});n.now+=2000;assert.throws(()=>s.confirm(),/Tarif ancien/);
});
test('a new proposal without declared gates does not inherit the preceding amount',async()=>{
 const {s}=setup(),state=await s.compare();await s.choose(state.sections[0].id,{tariffChoice:choice});s.cancel();const next=await s.choose(state.sections[0].id);assert.equal(next.proposal.estimate,null);assert.equal(s.confirm().selection.estimate,undefined);
});
