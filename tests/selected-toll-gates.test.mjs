import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import vm from 'node:vm';
import {locateSectionGates,gateTariffCandidates} from '../server/selected-tolls/gates.mjs';
import {declaredSectionTariff} from '../server/selected-tolls/tariffs.mjs';
const c={window:{}};vm.runInNewContext(fs.readFileSync('DragonRoute/config.js','utf8'),c);const catalogue=c.window.DRAGONROUTE_TARIFFS,inventory=c.window.DRAGONROUTE_TOLL_GATES;
const section=JSON.parse(fs.readFileSync('tests/fixtures/selected-tolls/public-gate-geometry.json')).section;
const line={key:'synthetic',coordinates:[[5,45],[5.01,45],[5.02,45]]},gate=(id,name,lon,lat=45)=>({id,name,road:'test',positions:[[lat,lon,'I',2]]}),data=gates=>({schemaVersion:1,gates});
test('public archived paid geometry has two close candidates with explicit directed ASF suggestion',()=>{
 const r=locateSectionGates(section,inventory,catalogue);assert.equal(r.total,2);assert.deepEqual(r.rows.map(g=>g.name),['Vienne','Valence Nord']);assert.equal(r.coverage,'GEOGRAPHIC_CANDIDATES_ONLY');assert.ok(r.rows[0].progress>9000);assert.ok(r.rows.every(g=>g.distance<3&&!g.ambiguous));assert.equal(r.pair.network,'ASF');assert.equal(r.pair.exitLabel,'A7 · VALENCE-N');
 assert.throws(()=>declaredSectionTariff(catalogue,r.pair,{vehicleClass:'1',date:'2026-11-28'},section.key,Date.parse('2026-11-28T12:00:00Z')),/Confirmer/);
 const quote=declaredSectionTariff(catalogue,{...r.pair,confirmed:true},{vehicleClass:'1',date:'2026-11-28'},section.key,Date.parse('2026-11-28T12:00:00Z'));assert.equal(quote.cents,900);assert.equal(quote.coverage,'DECLARED_NOT_ROUTE_VERIFIED');
});
test('reversing the geometry reverses candidates without inventing an unpublished tariff direction',()=>{
 const r=locateSectionGates({...section,coordinates:[...section.coordinates].reverse()},inventory,catalogue);assert.deepEqual(r.rows.map(g=>g.name),['Valence Nord','Vienne']);assert.equal(r.pair,null);
});
test('nearby access ramps are not promoted to actual passages',()=>{
 const r=locateSectionGates(section,inventory,catalogue);assert.ok(!r.rows.some(g=>g.name==='Auberives'||g.name==='Condrieu E'));assert.ok(r.rows.every(g=>g.traversed===undefined&&g.direction===undefined&&g.amount===undefined));
});
test('parallel road inside the corridor remains only a candidate; outside is not included',()=>{
 const r=locateSectionGates(line,data([gate('near','Vienne',5.01,45.0002),gate('far','Vienne',5.01,45.001)]),catalogue);assert.equal(r.total,1);assert.equal(r.rows[0].id,'near');assert.ok(r.rows[0].distance>20);assert.equal(r.pair,null);
});
test('a loop with separated visits has ambiguous progress and no pair suggestion',()=>{
 const r=locateSectionGates({...line,coordinates:[...line.coordinates,...line.coordinates.slice(0,-1).reverse()]},data([gate('a','Vienne',5.005),gate('b','Tain',5.015)]),catalogue);assert.ok(r.rows.every(g=>g.ambiguous));assert.equal(r.pair,null);
});
test('adjacent segments and repeated vertices do not duplicate one gate',()=>{
 const r=locateSectionGates({...line,coordinates:[[5,45],[5.01,45],[5.01,45],[5.02,45]]},data([gate('a','Vienne',5.01)]),catalogue);assert.equal(r.total,1);assert.equal(r.rows[0].ambiguous,false);
});
test('label alias is bounded to its source group, name and road; no generic cardinal expansion',()=>{
 const g=inventory.gates.find(g=>g.id==='mte2025-228');assert.equal(gateTariffCandidates(g,catalogue).length,1);
 for(const change of [{id:'other'},{road:'other'},{name:'Valence Sud'}])assert.equal(gateTariffCandidates({...g,...change},catalogue).filter(m=>m.label==='A7 · VALENCE-N').length,0);
 assert.equal(gateTariffCandidates(gate('x','Valence Nord',5),catalogue).length,0);assert.equal(gateTariffCandidates(gate('x','Vienne\uFFFD',5),catalogue).length,0);
});
test('multiple matching networks or more than two nearby gates never silently choose a pair',()=>{
 const catalog=structuredClone(catalogue);catalog.networks.AREA.gates.push('VIENNE');const r=locateSectionGates(section,inventory,catalog);assert.ok(r.rows[0].matches.length>1);assert.equal(r.pair,null);
 const added=structuredClone(inventory);added.gates.push(gate('extra','Unknown',section.coordinates[10][0],section.coordinates[10][1]));assert.equal(locateSectionGates(section,added,catalogue).pair,null);
});
test('no inventory, repeated identifiers, degenerate or nonfinite routes reject safely',()=>{
 assert.throws(()=>locateSectionGates(line,null,catalogue),/Inventaire/);assert.throws(()=>locateSectionGates(line,data([gate('a','x',5),gate('a','x',5.01)]),catalogue),/ambigu/);
 for(const coordinates of [[],[[5,45],[5,45]],[[NaN,45],[5,45]],[[5,90.1],[5,45]]])assert.throws(()=>locateSectionGates({...line,coordinates},inventory,catalogue));
});
test('empty, incomplete and numerous candidate inventories do not fabricate tariffs',()=>{
 assert.equal(locateSectionGates(line,data([]),catalogue).pair,null);assert.equal(locateSectionGates(line,data([{id:'bad',name:'Bad',positions:[[NaN,5]]}]),catalogue).total,0);
 const r=locateSectionGates(line,data(Array.from({length:45},(_,i)=>gate('p'+i,'No match',5.001+i*.0003))),catalogue);assert.equal(r.total,45);assert.equal(r.rows.length,40);assert.equal(r.pair,null);
});
test('inputs remain untouched and independent results cannot mutate the source',()=>{
 const original=JSON.stringify([section,inventory,catalogue]),r=locateSectionGates(section,inventory,catalogue);r.rows[0].point[0]=99;r.pair.entry=999;assert.equal(JSON.stringify([section,inventory,catalogue]),original);assert.notEqual(locateSectionGates(section,inventory,catalogue).pair.entry,999);
});
