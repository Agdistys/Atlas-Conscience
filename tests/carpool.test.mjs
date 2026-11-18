import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync('DragonRoute/app.js','utf8').split('// BEGIN CARPOOL MODEL\n')[1].split('// END CARPOOL MODEL')[0],ctx);
const costs=(fuelEuro=null,tollEuro=null,tollState='unknown')=>({fuelEuro,tollEuro,tollState});
test('covoiturage : unknown and incomplete costs never become a complete zero',()=>{
 let r=ctx.splitRideCosts(costs(),1,1);assert.equal(r.total,null);assert.equal(r.driver,null);assert.equal(r.complete,false);
 r=ctx.splitRideCosts(costs(12.896),1,1);assert.equal(r.total,1290);assert.equal(r.perPassenger,645);assert.equal(r.complete,false);
 r=ctx.splitRideCosts(costs(null,0,'complete'),1,1);assert.equal(r.total,0);assert.equal(r.fuel,null);assert.equal(r.complete,false);
 r=ctx.splitRideCosts(costs(0,0,'complete'),1,1);assert.equal(r.total,0);assert.equal(r.complete,true);
 r=ctx.splitRideCosts(costs(10,3.5,'partial'),2,2);assert.equal(r.total,1350);assert.equal(r.complete,false);
});
test('covoiturage : centime rounding preserves the total and the driver share',()=>{
 const r=ctx.splitRideCosts(costs(12.896,3.5,'complete'),2,3);assert.equal(r.total,1640);assert.equal(r.perPassenger,546);assert.equal(r.passengerTotal,1092);assert.equal(r.driver,548);assert.equal(r.complete,true);
 for(let cents=0;cents<500;cents++)for(let n=0;n<=8;n++){const s=ctx.splitRideCosts(costs(cents/100,0,'complete'),n,8);assert.equal(s.driver+s.passengerTotal,cents);assert.ok(s.driver>=s.perPassenger);assert.ok(s.passengerTotal<=cents);if(n===0)assert.equal(s.driver,cents)}
 assert.equal(ctx.rideCents(1.005),101);
});
test('covoiturage : invalid counts and inconsistent money states fail explicitly',()=>{
 for(const count of [-1,1.5,9,NaN,Infinity,'2'])assert.throws(()=>ctx.splitRideCosts(costs(),count,8));
 for(const seats of [0,9,1.2,null,'1'])assert.throws(()=>ctx.splitRideCosts(costs(),1,seats));assert.throws(()=>ctx.splitRideCosts(costs(),3,2));
 for(const amount of [-1,NaN,Infinity,'0',undefined,4000001])assert.throws(()=>ctx.splitRideCosts({...costs(),fuelEuro:amount},1,1));
 for(const cost of [costs(1,0,'unknown'),costs(1,null,'complete'),costs(1,null,'partial'),costs(1,2,'other')])assert.throws(()=>ctx.splitRideCosts(cost,1,1));
});
test('covoiturage : shared labels are explicit bounded single lines, not inferred addresses',()=>{
 assert.equal(ctx.ridePlain(' Gare publique ',160,true),'Gare publique');assert.equal(ctx.ridePlain('',300),'');assert.equal(ctx.ridePlain('<img src=x>',160,true),'<img src=x>');
 for(const value of ['', '   ', 'A\nPrix : gratuit', 'A\u2028B', 'A\u202eB','x'.repeat(161),null])assert.throws(()=>ctx.ridePlain(value,160,true));
});
