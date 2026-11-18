import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
const context={window:{}};
vm.runInNewContext(fs.readFileSync(new URL('../DragonRoute/config.js',import.meta.url),'utf8'),context);
const data=context.window.DRAGONROUTE_TARIFFS;
test('tariff tables reproduce the attributed and corrected CSV sources',()=>{
 const r=spawnSync('python3',['tools/build-toll-tables.py','--check'],{encoding:'utf8'});
 assert.equal(r.status,0,r.stderr||r.stdout);
});
test('all tariff pairs are directional, unique and expressed in integer cents',()=>{
 for(const name of ['APRR','AREA']){const n=data.networks[name];
  assert.equal(n.rows.length,name==='APRR'?21505:955);const seen=new Set();
  for(const r of n.rows){
   assert.equal(r.length,7);assert.ok(n.gates[r[0]]&&n.gates[r[1]]);assert.notEqual(r[0],r[1]);
   assert.ok(r.every(v=>Number.isSafeInteger(v)&&v>=0));assert.ok(!seen.has(`${r[0]}:${r[1]}`));seen.add(`${r[0]}:${r[1]}`);
  }
 }
});
test('official AREA example and corrected long APRR gate names are preserved',()=>{
 const a=data.networks.AREA;const row=a.rows.find(r=>a.gates[r[0]]==='AIGUEBELETTE'&&a.gates[r[1]]==='AIX NORD');
 assert.deepEqual(Array.from(row.slice(2)),[350,550,760,1020,160]);
 assert.ok(data.networks.APRR.gates.includes('AMBOISE CH.RENAULT'));
 assert.ok(!data.networks.APRR.gates.includes('CH.RENAULT AMBERIEU'));
 assert.ok(a.gates.includes('CRUSEILLES A 410'));assert.ok(a.gates.includes('Système Ouvert'));
 assert.equal(data.effectiveFrom,'2026-02-01');assert.equal(data.consultationUntil,'2026-12-31');
});

test('BPNL: public decision amounts, independent period, no invented station pairs',()=>{
 const n=data.networks.BPNL;
 assert.equal(data.schemaVersion,2);assert.equal(n.kind,'passage');
 assert.deepEqual(Array.from(n.amountsCents),[260,390,460,1030,130]);
 assert.equal(n.effectiveFrom,'2026-01-01');assert.equal(n.consultationUntil,'2026-12-31');
 assert.equal(n.rows,undefined);assert.equal(n.gates,undefined);
 assert.equal(n.sourcePage,59);assert.match(n.sourceTitle,/2025-3243/);
 assert.equal(data.networks.AREA.effectiveFrom,'2026-02-01');
 assert.equal(data.networks.APRR.lastReviewed,'2026-11-17');
});
