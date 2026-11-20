import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('DragonRoute/app.js','utf8'),c={Intl,Date};
vm.createContext(c);
for(const name of ['STATION HOURS MODEL','TIMING MODEL','COMPARISON MODEL','ROAD CHOICES MODEL'])vm.runInContext(source.split('// BEGIN '+name+'\n')[1].split('// END '+name)[0],c);
for(const [a,b] of [['function hasRouteGeometry','async function orsRoutes'],['function hav(','function distSeg']])vm.runInContext(source.slice(source.indexOf(a),source.indexOf(b)),c);
const raw=(extra={})=>({departure:'2026-11-20T10:00',arriveBy:'',onlyBefore:false,cons:'6',price:'2',...extra});
const coords=[[4.8357,45.764],[4.87,45.4],[4.8924,44.9334]];
const entry=(criterion,distance=100000,duration=6000,geometry=coords)=>({criterion,status:'ready',route:{distance,duration,geometry:{type:'LineString',coordinates:geometry}}});
const plain=x=>JSON.parse(JSON.stringify(x));

test('choix routiers : bornes et inconnus conservés, aucun prix zéro implicite',()=>{
 assert.equal(c.roadChoiceHypotheses(raw({price:''})).price,null);
 for(const x of [{cons:''},{cons:'0'},{cons:'101'},{price:'0'},{price:'10.1'},{price:Infinity},{onlyBefore:'false'}])assert.throws(()=>c.roadChoiceHypotheses(raw(x)));
 const h=c.roadChoiceHypotheses(raw({price:''}));
 assert.equal(c.comparisonCost('car',100000,h).fuel,null);assert.equal(c.comparisonCost('car',100000,h).total,null);
});
test('choix routiers : dates Paris ambiguës et filtre incomplet refusés',()=>{
 for(const x of [{departure:'2026-10-25T02:30'},{departure:'2026-03-29T02:30'},{arriveBy:'2026-11-20T09:00'},{onlyBefore:true}])assert.throws(()=>c.roadChoiceHypotheses(raw(x)));
 assert.equal(c.roadChoiceHypotheses(raw({departure:''})).departure,null);
});
test('choix routiers : géométrie identique groupée avec ses deux métriques distinctes',()=>{
 const es=[entry('shortest',100000,6100),entry('fastest')],before=JSON.stringify(es),g=c.roadChoiceGroups(es);
 assert.equal(g.length,1);assert.equal(g[0].entries.length,2);assert.equal(g[0].entries[1].route.duration,6100);assert.equal(JSON.stringify(es),before);
});
test('choix routiers : mêmes extrémités ne suffisent pas à fusionner deux routes',()=>{
 const es=[entry('fastest'),entry('shortest',90000,7200,[[...coords[0]],[5.1,45.4],[...coords[2]]])];
 assert.equal(c.roadChoiceGroups(es).length,2);
 assert.equal(c.roadChoiceGroups(es,'distance')[0].entries[0].criterion,'shortest');
 assert.throws(()=>c.roadChoiceGroups(es,'cost'));
});
test('choix routiers : égalité à la précision affichée, ordre stable sans altérer les résultats',()=>{
 const es=[entry('shortest',100010,6002),entry('fastest',100000,6001)];
 for(const sort of ['distance','duration']){const g=c.roadChoiceGroups(es,sort);assert.deepEqual(plain(g[0].entries.map(x=>x.criterion)),['fastest','shortest']);assert.ok(g[0].entries.every(x=>x.tied))}
});
test('choix routiers : résultat absent distinct, non classé devant une valeur nulle connue',()=>{
 const g=c.roadChoiceGroups([{criterion:'shortest',status:'unavailable'},entry('fastest',0,0)]);
 assert.equal(g.length,2);assert.equal(g[0].entries[0].criterion,'fastest');assert.equal(c.roadChoiceValue(g[0].entries[0],'distance'),0);
 assert.equal(c.roadChoiceDifference(g.flatMap(x=>x.entries),c.roadChoiceHypotheses(raw())),null);
});
test('choix routiers : écarts signés des valeurs affichées et carburant seulement',()=>{
 const es=[entry('fastest',104000,3900),entry('shortest',100000,9600)],h=c.roadChoiceHypotheses(raw());
 assert.deepEqual(plain(c.roadChoiceDifference(es,h)),{km:-4,minutes:95,fuel:-.48});
 assert.equal(c.roadChoiceDifference(es,{...h,price:null}).fuel,null);
 const ties=[entry('fastest',100000,6001),entry('shortest',100010,6002)];
 assert.deepEqual(plain(c.roadChoiceDifference(ties,h)),{km:0,minutes:0,fuel:0});
});
test('choix routiers : heure limite exacte et heure inconnue restent distinctes',()=>{
 const h=c.roadChoiceHypotheses(raw({arriveBy:'2026-11-20T11:40',onlyBefore:true}));
 assert.equal(c.timingEstimate(6000,h).admissible,true);assert.equal(c.timingEstimate(6001,h).admissible,false);
 assert.equal(c.timingEstimate(6000,{...h,departure:null}).state,'unknown');
});
test('choix routiers : métriques, tracé et accès validés avant adoption',()=>{
 const r=entry('fastest').route,points=[[45.764,4.8357],[44.9334,4.8924]];
 assert.equal(c.validateRoadChoice(r,points),r);
 for(const bad of [{...r,distance:null},{...r,duration:-1},{...r,duration:31536001},{...r,geometry:null},{...r,geometry:{type:'LineString',coordinates:[[0,0],[4.8924,44.9334]]}},{...r,geometry:{type:'LineString',coordinates:[[4.8357,91],[4.8924,44.9334]]}}])assert.throws(()=>c.validateRoadChoice(bad,points));
});
