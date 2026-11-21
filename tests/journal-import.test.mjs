import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const ctx={TextEncoder,structuredClone};vm.createContext(ctx);vm.runInContext(fs.readFileSync('DragonRoute/app.js','utf8').split('// BEGIN JOURNAL MODEL\n')[1].split('// END JOURNAL MODEL')[0],ctx);
const at='2026-11-18T10:00:00.000Z';
const entry=(p={})=>({id:'a',date:'2026-11-17',mode:'car',distanceMeters:100000,distanceSource:'declared',start:'Lyon',end:'Valence',note:'',revision:1,createdAt:at,updatedAt:at,calculation:null,emissions:ctx.unavailableCarbon(),...p});
const journal=(entries=[],enabled=false,version=2)=>({version,enabled,entries});
test('restore: legacy import is explicit, normalized, isolated and never enables the journal',()=>{
 const source=journal([entry({distanceMeters:null,distanceSource:'unknown',private:'discard'})],true,1),original=JSON.stringify(source),base=journal();const p=ctx.planJournalImport(base,source,'merge');assert.equal(p.next.enabled,false);assert.equal(p.next.version,3);assert.equal(p.next.entries[0].emissions.valueKg,null);assert.equal(p.next.entries[0].distanceMeters,null);assert.ok(!JSON.stringify(p.next).includes('discard'));assert.equal(JSON.stringify(source),original);assert.equal(base.entries.length,0);
});
test('restore: same id and same content are idempotent regardless of JSON key order',()=>{
 const e=entry();e.emissions=ctx.estimateCarbon(e,'voiture-compact-diesel',2,at);const source=structuredClone(e);source.emissions.factor=Object.fromEntries(Object.entries(source.emissions.factor).reverse());const p=ctx.planJournalImport(journal([e]),journal([source]),'merge');assert.equal(p.identical,1);assert.equal(p.added,0);assert.equal(p.changed,false);assert.equal(p.next.entries.length,1);
});
test('restore: conflicting versions require a decision and a copy retains every historical field',()=>{
 const old=entry(),incoming=entry({revision:2,note:'Revised'});incoming.distanceSource='route';incoming.calculation={version:'route-snapshot-v1',engine:'ign',start:incoming.start,end:incoming.end,resourceVersion:'source-test',calculatedAt:at,mode:'car',distanceMeters:incoming.distanceMeters,stop:'Station test'};incoming.emissions=ctx.estimateCarbon(incoming,'voiture-compact-diesel',2,at);incoming.emissionsHistory=[{archivedAt:at,reason:'Actualisation demandée',estimate:ctx.estimateCarbon(incoming,'voiture-compact-diesel',1,at)}];
 const base=journal([old]),source=journal([incoming]),raw=JSON.stringify([base,source]);let p=ctx.planJournalImport(base,source,'merge');assert.equal(p.rows[0].kind,'conflict');assert.equal(p.unresolved,1);assert.equal(p.next,null);
 p=ctx.planJournalImport(base,source,'merge',{0:'both'},()=> 'copy-fixed');assert.equal(p.copies,1);assert.equal(p.next.entries[0].note,'');assert.equal(p.next.entries[1].id,'copy-fixed');assert.equal(JSON.stringify({...p.next.entries[1],id:'a'}),JSON.stringify(ctx.validateJournal(source).entries[0]));assert.equal(JSON.stringify([base,source]),raw);
 assert.equal(ctx.planJournalImport(base,source,'merge',{0:'skip'}).changed,false);assert.throws(()=>ctx.planJournalImport(base,source,'merge',{0:'both'},()=> 'a'));
});
test('restore: duplicates against the journal and within the file never silently disappear or double',()=>{
 const a=entry(),b=entry({id:'b'}),c=entry({id:'c'}),source=journal([a,b,c]);let p=ctx.planJournalImport(journal(),source,'merge');assert.equal(p.added,1);assert.equal(p.unresolved,2);
 p=ctx.planJournalImport(journal(),source,'merge',{1:'skip',2:'add'});assert.equal(p.next.entries.length,2);assert.equal(p.skipped,1);assert.equal(p.next.entries[1].id,'c');
 p=ctx.planJournalImport(journal([a]),journal([b]),'merge');assert.equal(p.rows[0].kind,'duplicate');assert.equal(p.next,null);
});
test('restore: replacement preserves activation and supports explicitly restoring an empty file',()=>{
 const a=journal([entry()],true),empty=journal([],false);const p=ctx.planJournalImport(a,empty,'replace');assert.equal(p.next.enabled,true);assert.equal(p.next.entries.length,0);assert.equal(p.changed,true);
 const source=journal([entry({id:'b'})],false);assert.equal(ctx.planJournalImport(a,source,'replace').next.entries[0].id,'b');assert.equal(a.entries[0].id,'a');assert.throws(()=>ctx.planJournalImport(a,source,'invalid'));
});
test('restore: capacity, future formats and forged carbon block the entire import without mutation',()=>{
 const full=journal(Array.from({length:1000},(_,i)=>entry({id:'id-'+i,start:'Start '+i})));const p=ctx.planJournalImport(full,journal([entry({id:'new',start:'Other'})]),'merge');assert.equal(p.next,null);assert.match(p.error,/capacité/);assert.equal(full.entries.length,1000);
 const huge=n=>journal(Array.from({length:400},(_,i)=>entry({id:n+i,start:n+i+'x'.repeat(990),end:'x'.repeat(990),note:'x'.repeat(490)})));const size=ctx.planJournalImport(huge('a'),huge('b'),'merge');assert.equal(size.next,null);assert.match(size.error,/volumineux/);
 assert.throws(()=>ctx.planJournalImport(journal(),{version:999,enabled:true,entries:[]},'merge'));
 const e=entry();e.emissions=ctx.estimateCarbon(e,'voiture-compact-diesel',1,at);e.emissions.valueKg=0;assert.throws(()=>ctx.planJournalImport(journal(),journal([e]),'merge'));
});
