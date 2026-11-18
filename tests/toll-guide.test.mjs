import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync('DragonRoute/config.js','utf8'),ctx);
const app=fs.readFileSync('DragonRoute/app.js','utf8');vm.runInContext(app.split('// BEGIN TOLL GUIDE GEOMETRY\n')[1].split('// END TOLL GUIDE GEOMETRY')[0],ctx);
const gates=ctx.window.DRAGONROUTE_TOLL_GATES;
const gate=(id,lat,lon,name=id)=>({id,name,positions:[[lat,lon,'I',2]]});
test('toll guide: frozen inventory reproduces all source positions without replacing tariffs',()=>{
 for(const path of ['tools/build-toll-gates.py','tools/build-toll-tables.py']){const r=spawnSync('python3',[path,'--check'],{encoding:'utf8'});assert.equal(r.status,0,r.stderr||r.stdout)}
 assert.equal(gates.gates.length,831);assert.equal(gates.recordCount,1266);assert.equal(gates.referenceDate,'2025-01-01');
 assert.equal(new Set(gates.gates.map(g=>g.id)).size,831);
 assert.equal(new Set(gates.gates.flatMap(g=>g.positions.map(p=>p[3]))).size,1266);
 const a=gates.gates.find(g=>g.name==='Aiguebelette');assert.equal(a.positions.length,2);assert.ok(a.positions.every(p=>p[0]>45.5&&p[0]<45.6&&p[1]>5.7&&p[1]<5.9));
});
test('toll guide: parallel roads remain candidates, radius and reverse order are geometric',()=>{
 const points=[gate('near',45.001,4.05),gate('far',45.01,4.05),gate('end',45,4.09)];
 const line=[[45,4],[45,4.1]];
 assert.deepEqual(Array.from(ctx.findTollGates(line,points,.1),g=>g.id),['end']);
 const result=ctx.findTollGates(line,points,.3);assert.deepEqual(Array.from(result,g=>g.id),['near','end']);
 assert.ok(Math.abs(result[0].distance-.110574)<.00001);assert.ok(result[0].progress>3.9&&result[0].progress<4);
 assert.deepEqual(Array.from(ctx.findTollGates([...line].reverse(),points,.3),g=>g.id),['end','near']);
 assert.equal(result[0].amount,undefined);assert.equal(result[0].traversed,undefined);
});
test('toll guide: repeated points, loops, empty result and malformed inputs',()=>{
 const line=[[45,4],[45,4],[45,4.1],[45,4]];assert.equal(ctx.findTollGates(line,[gate('a',45,4.05)],.3).length,1);
 assert.equal(ctx.findTollGates(line,[gate('b',47,7)],.3).length,0);
 assert.throws(()=>ctx.findTollGates([],[],.3));assert.throws(()=>ctx.findTollGates([[NaN,4],[45,4]],[],.3));assert.throws(()=>ctx.findTollGates(line,[],2));
 assert.equal(ctx.tollGateLabel({name:'Chamb\uFFFDry Nord'}),'Nom de gare incomplet dans la source');assert.equal(ctx.tollGateLabel({name:'Aiguebelette'}),'Aiguebelette');
 assert.equal(ctx.tollName(' Aïx  Nord '),'AIX NORD');assert.notEqual(ctx.tollName('Aix Sud'),ctx.tollName('Aix Nord'));
});
