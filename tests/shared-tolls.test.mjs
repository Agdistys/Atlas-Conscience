import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync('DragonRoute/app.js','utf8').split('// BEGIN CARPOOL MODEL\n')[1].split('// END CARPOOL MODEL')[0],ctx);
const items=[{amount:260,placement:'before'},{amount:350,placement:'shared'},{amount:120,placement:'after'},{amount:80,placement:'unassigned'}];
const cost=(items,confirmed=true,covered=true,fuel=20)=>({fuelEuro:fuel,tollEuro:items.reduce((n,s)=>n+s.amount,0)/100,tollState:covered?'complete':'partial',shared:{fuelEuro:fuel===null?null:12,tolls:ctx.sharedTollBreakdown(items,confirmed,covered)}});
test('péages partagés : aucun choix implicite, confirmation et couverture distinctes',()=>{
 let a=ctx.sharedTollBreakdown(items,false,true);assert.equal(a.confirmed,false);assert.equal(a.complete,false);assert.equal(a.shared,350);assert.equal(a.unassigned,80);
 a=ctx.sharedTollBreakdown(items,true,true);assert.equal(a.complete,false);assert.equal(a.unassignedCount,1);
 a=ctx.sharedTollBreakdown(items.slice(0,3),true,false);assert.equal(a.complete,false);assert.equal(a.confirmed,true);
 a=ctx.sharedTollBreakdown(items.slice(0,3),true,true);assert.equal(a.complete,true);assert.equal(a.total,730);
 for(const data of [[],[{amount:0,placement:'unassigned'}]])assert.equal(ctx.sharedTollBreakdown(data,true,true).complete,false);
});
test('péages partagés : seuls montants communs ajoutés, conservation des centimes du trajet',()=>{
 const s=ctx.splitRideCosts(cost(items.slice(0,3)),2,3);assert.equal(s.sharedTotal,1550);assert.equal(s.perPassenger,516);assert.equal(s.passengerTotal,1032);assert.equal(s.driver,1698);assert.equal(s.driver+s.passengerTotal,2730);assert.equal(s.sharedComplete,true);
 for(let amount=0;amount<150;amount++)for(let n=0;n<=8;n++){const r=ctx.splitRideCosts(cost([{amount,placement:'shared'},{amount:100,placement:'before'}]),n,8);assert.equal(r.passengerTotal+r.driver,2100+amount);assert.ok(r.driver>=800+100);if(!n)assert.equal(r.passengerTotal,0)}
});
test('péages partagés : inconnu, non attribué et partiel restent incomplets',()=>{
 for(const [input,expected] of [[cost(items),1550],[cost(items.slice(0,3),true,false),1550],[cost(items,false),1200]]){const s=ctx.splitRideCosts(input,1,1);assert.equal(s.sharedTotal,expected);assert.equal(s.sharedComplete,false)}
 const s=ctx.splitRideCosts(cost(items.slice(0,3),true,true,null),1,1);assert.equal(s.sharedTotal,350);assert.equal(s.perPassenger,175);assert.equal(s.driver,555);assert.equal(s.sharedComplete,false);
});
test('péages partagés : zéro attribué ou confirmé distinct de zéro absent',()=>{
 let s=ctx.splitRideCosts(cost([{amount:260,placement:'before'}]),1,1);assert.equal(s.sharedTolls,0);assert.equal(s.sharedComplete,true);
 s=ctx.splitRideCosts(cost([{amount:260,placement:'before'}],true,false),1,1);assert.equal(s.sharedTolls,0);assert.equal(s.sharedComplete,false);
 s=ctx.splitRideCosts(cost([{amount:0,placement:'unassigned'}],false,false),1,1);assert.equal(s.sharedTolls,null);assert.equal(s.sharedComplete,false);
 s=ctx.splitRideCosts({fuelEuro:20,tollEuro:0,tollState:'complete',shared:{fuelEuro:12}},1,1);assert.equal(s.sharedTolls,0);assert.equal(s.sharedComplete,true);
});
test('péages partagés : affectations invalides et montants incohérents refusés',()=>{
 for(const bad of [[{amount:-1,placement:'shared'}],[{amount:1.2,placement:'shared'}],[{amount:'1',placement:'shared'}],[{amount:1,placement:'anywhere'}],Array(11).fill(items[0])])assert.throws(()=>ctx.sharedTollBreakdown(bad,true,true));
 const c=cost(items);for(const bad of [{...c.shared.tolls,total:1},{...c.shared.tolls,shared:351},{...c.shared.tolls,before:-1},{...c.shared.tolls,complete:true},{...c.shared.tolls,confirmed:'yes'}])assert.throws(()=>ctx.splitRideCosts({...c,shared:{...c.shared,tolls:bad}},1,1));
});
