import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const ctx={Intl,Date};vm.createContext(ctx);vm.runInContext(fs.readFileSync('DragonRoute/app.js','utf8').split('// BEGIN STATION HOURS MODEL\n')[1].split('// END STATION HOURS MODEL')[0],ctx);
const day=(id,slots=[['08.00','12.00'],['14.00','18.00']],closed='')=>({'@id':String(id),'@ferme':closed,horaire:slots.map(([a,b])=>({'@ouverture':a,'@fermeture':b}))});
const week=(overrides={})=>({'@automate-24-24':'',jour:Array.from({length:7},(_,i)=>overrides[i+1]||day(i+1))});
const station=(hours=week(),extra={})=>({hours:JSON.stringify(hours),automate:'Non',fuel:'E10',postalCode:'26000',lat:45,lon:5,accessSeconds:1800,...extra});
const opening=(value,s=station())=>ctx.arrivalOpening(s,ctx.departureInstant(value).instant);
test('horaires: explicit Paris time independent of device, DST gaps and doubles rejected',()=>{
 assert.equal(new Date(ctx.departureInstant('2026-09-17T12:00').instant).toISOString(),'2026-09-17T10:00:00.000Z');
 assert.equal(new Date(ctx.departureInstant('2026-11-18T12:00').instant).toISOString(),'2026-11-18T11:00:00.000Z');
 for(const date of ['2026-03-29T02:30','2026-10-25T02:30','2026-02-30T12:00','','2026-11-18T24:00','2100-01-01T10:00','2026-11-18T12:00Z'])assert.ok(ctx.departureInstant(date).error,date);
});
test('horaires: arrival uses access duration, start inclusive/end exclusive and split shifts',()=>{
 assert.equal(opening('2026-09-17T07:30').state,'compatible');assert.equal(opening('2026-09-17T11:30').state,'outside');assert.equal(opening('2026-09-17T13:30').state,'compatible');assert.equal(opening('2026-09-17T17:30').state,'outside');
 assert.equal(opening('2026-09-17T07:29').state,'outside');assert.equal(opening('2026-09-17T11:29').state,'compatible');
});
test('horaires: overnight, Sunday to Monday and closed-day contradiction',()=>{
 const w=week({7:day(7,[['22.00','02.00']])});assert.equal(opening('2026-09-20T23:45',station(w)).state,'compatible');assert.equal(opening('2026-09-21T01:30',station(w)).state,'outside');
 assert.equal(opening('2026-09-20T23:45',station(week({7:day(7,[['22.00','02.00']]),1:day(1,[],'1')}))).state,'unknown');
});
test('horaires: missing days, malformed JSON, duplicate or invalid slots never imply closed',()=>{
 for(const w of [null,{}, {jour:[day(4)]},week({4:day(4,[['00.00','00.00']])}),week({4:day(4,[['08.00','99.00']])}),week({4:day(4,[['24.00','02.00']])})])assert.equal(opening('2026-09-17T11:30',station(w)).state,'unknown');
 const w=week();w.jour.push(day(4));assert.equal(opening('2026-09-17T09:00',station(w)).state,'unknown');
 assert.equal(opening('2026-09-17T09:00',station(week(),{hours:'broken'})).state,'unknown');
 assert.equal(opening('2026-09-17T09:00',station(week({4:day(4,[['01.00','01.00']],'1')}))).state,'outside');
});
test('horaires: midnight 24.00, DST elapsed travel and missing previous-day uncertainty',()=>{
 assert.equal(opening('2026-09-17T23:00',station(week({4:day(4,[['00.00','24.00']])}))).state,'compatible');
 assert.equal(ctx.parisLocal(opening('2026-03-29T01:30',station(week(),{accessSeconds:3600})).arrival),'2026-03-29T03:30');
 assert.equal(ctx.parisLocal(opening('2026-10-25T01:30',station(week(),{accessSeconds:7200})).arrival),'2026-10-25T02:30');
 assert.equal(opening('2026-09-17T09:00',station({jour:[day(4)]})).state,'compatible');
});
test('horaires: automate distinct from guichet, conflicts and GPL not qualified by automate',()=>{
 const h=week();h['@automate-24-24']='1';const s=station(h,{automate:'Oui'});
 assert.equal(opening('2026-09-17T23:00',s).kind,'automate');assert.equal(opening('2026-09-17T23:00',s).counter,'outside');
 assert.equal(opening('2026-09-17T23:00',{...s,fuel:'GPLc'}).state,'unknown');assert.equal(opening('2026-09-17T09:00',{...s,fuel:'GPLc'}).kind,'counter');
 assert.equal(opening('2026-09-17T09:00',{...s,automate:'Non'}).state,'unknown');
 assert.equal(opening('2026-09-17T23:00',station({}, {automate:'Oui'})).kind,'automate');
});
test('horaires: missing access, postcode, overseas and invalid departure stay unknown',()=>{
 for(const p of [{accessSeconds:null},{accessSeconds:-1},{postalCode:'97100'},{postalCode:null},{lat:NaN},{lon:55}])assert.equal(opening('2026-09-17T09:00',station(week(),p)).state,'unknown');
 assert.equal(opening('',station()).state,'unknown');assert.equal(opening('2026-09-17T09:00',station(week(),{accessSeconds:0,postalCode:'20000',lat:42,lon:9})).state,'compatible');
});
test('horaires: actual source snapshot fields qualified, records stay immutable',()=>{
 const data=JSON.parse(fs.readFileSync('data/station-hours/qualification-2026-11-18.json'));assert.equal(data.records.length,100);assert.ok(data.schema.some(s=>s.name==='horaires'));assert.ok(!data.schema.some(s=>s.name==='fermeture'));const before=JSON.stringify(data);
 for(const r of data.records){const out=opening('2026-11-18T12:00',station(null,{hours:r.horaires,automate:r.horaires_automate_24_24,postalCode:r.cp,lat:r.geom.lat,lon:r.geom.lon}));assert.ok(['compatible','outside','unknown'].includes(out.state));assert.notEqual(out.state,'open')}
 assert.equal(JSON.stringify(data),before);
});
