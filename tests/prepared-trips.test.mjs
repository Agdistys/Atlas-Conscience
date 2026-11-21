import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const ctx={TextEncoder,Intl,Date};vm.createContext(ctx);const source=fs.readFileSync('DragonRoute/app.js','utf8');for(const name of ['STATION HOURS MODEL','TIMING MODEL','PREPARED TRIPS MODEL'])vm.runInContext(source.split('// BEGIN '+name+'\n')[1].split('// END '+name)[0],ctx);
export const preparedFixture=(p={})=>({id:'test-1',name:'Trajet test',savedAt:'2026-09-17T10:00:00.000Z',places:{start:{label:'Lyon',lat:45.764,lon:4.8357},end:{label:'Valence',lat:44.9334,lon:4.8924}},vehicle:{type:'car',fuel:'E10',cons:6.2,liters:40,dimensions:null},preferences:{stopMinutes:null,avoid:[],departure:'2026-09-18T10:00',stopMode:'around',stopKm:100,stopTolerance:20,nearKm:50,stationScope:'route',stationRadiusKm:12,stationSpacingKm:30,stationMaxPoints:24,rangeMode:'km',rangeValue:180,reserveKm:30,rangeOnly:true,maxDetourKm:10,maxDetourMin:15,services:['Toilettes publiques'],openingFilter:'compatible',listMode:'all'},snapshot:{calculatedAt:'2026-09-17T09:59:00.000Z',engine:'osrm',distanceMeters:104000,durationSeconds:3900,geometry:[[4.8357,45.764],[4.87,45.4],[4.8924,44.9334]],stop:{id:'A',address:'1 route test',city:'Valence',lat:45.4,lon:4.87}},...p});
const dataset=(entries=[preparedFixture()])=>({kind:'dragonroute-preparations',version:1,entries});
test('préparations : canonical round trip keeps geometry and unknowns, excludes foreign data',()=>{
 const d=dataset();d.apiKey='SECRET_MARKER';d.entries[0].snapshot.price=2.3;d.entries[0].snapshot.hours='SECRET_MARKER';d.entries[0].vehicle.apiKey='SECRET_MARKER';const before=JSON.stringify(d),clean=ctx.validatePreparedTrips(d),again=ctx.validatePreparedTrips(JSON.parse(JSON.stringify(clean)));
 assert.equal(JSON.stringify(clean),JSON.stringify(again));assert.equal(JSON.stringify(d),before);assert.ok(!JSON.stringify(clean).includes('SECRET_MARKER'));assert.equal(clean.entries[0].snapshot.price,undefined);assert.equal(JSON.stringify(clean.entries[0].snapshot.geometry),JSON.stringify(d.entries[0].snapshot.geometry));
 const e=preparedFixture();e.preferences.departure=null;e.preferences.maxDetourKm=0;e.snapshot.stop=null;const c=ctx.validatePreparedEntry(e);assert.equal(c.preferences.departure,null);assert.equal(c.preferences.maxDetourKm,0);assert.equal(c.snapshot.stop,null);
});
test('préparations : wrong kind, future versions, duplicates and capacities fail closed',()=>{
 for(const d of [{version:1,entries:[]},{...dataset(),version:99},{...dataset(),entries:[preparedFixture(),preparedFixture()]},dataset(Array.from({length:21},(_,i)=>preparedFixture({id:'x-'+i})))])assert.throws(()=>ctx.validatePreparedTrips(d));
 const e=preparedFixture();e.snapshot.geometry=Array(25001).fill([4,45]);assert.throws(()=>ctx.validatePreparedEntry(e));
 const big=Array.from({length:20},(_,i)=>{const e=preparedFixture({id:'x-'+i});e.snapshot.geometry=Array(5000).fill([4.1234567,45.1234567]);return e});assert.throws(()=>ctx.validatePreparedTrips(dataset(big)),/2 Mo/);
});
test('préparations : coordinates, metrics, chronology and Paris DST departure validated',()=>{
 for(const modify of [e=>e.places.start.lat=91,e=>e.snapshot.geometry[0]=[Infinity,45],e=>e.snapshot.geometry=[],e=>e.snapshot.durationSeconds=-1,e=>e.snapshot.engine='invented',e=>e.snapshot.calculatedAt='2026-10-01T00:00:00.000Z',e=>e.preferences.departure='2026-03-29T02:30',e=>e.preferences.departure='2026-10-25T02:30']){const e=preparedFixture();modify(e);assert.throws(()=>ctx.validatePreparedEntry(e))}
});
test('préparations : strict vehicle dimensions and options are never substituted',()=>{
 const e=preparedFixture();e.vehicle={...e.vehicle,type:'truck',dimensions:{height:3,width:2.5,length:12,weight:20,axleload:8}};assert.equal(ctx.validatePreparedEntry(e).vehicle.type,'truck');e.vehicle.dimensions.axleload=21;assert.throws(()=>ctx.validatePreparedEntry(e));
 for(const modify of [e=>e.vehicle.type='caravan',e=>e.preferences.avoid=['tollways','tollways'],e=>e.preferences.rangeOnly='true',e=>e.preferences.rangeValue=null,e=>e.preferences.openingFilter='open',e=>e.preferences.services=['a','a'],e=>e.preferences.maxDetourMin=-1]){const e=preparedFixture();modify(e);assert.throws(()=>ctx.validatePreparedEntry(e))}
});
test('préparations : duplicate warning by name or complete parameters, rename excludes self',()=>{
 const e=preparedFixture();assert.equal(ctx.preparedDuplicates(e,[e]).length,0);assert.equal(ctx.preparedDuplicates({...e,id:'other',name:'Autre nom'},[e]).length,1);
 const f=preparedFixture({id:'other',name:'TRAJET TEST'});f.places.end.lat=44;assert.equal(ctx.preparedDuplicates(f,[e]).length,1);f.name='Différent';assert.equal(ctx.preparedDuplicates(f,[e]).length,0);
});
test('préparations : critère explicite en format 4, migration historique sans invention',()=>{
 for(const version of [1,2,3]){
  const e=preparedFixture({optimization:'shortest',timing:{departure:'2026-09-18T10:00',arriveBy:null,onlyBefore:false}}),old={kind:'dragonroute-preparations',version,entries:[e]},before=JSON.stringify(old);
  const clean=ctx.validatePreparedTrips(old);assert.equal(clean.version,11);assert.equal(clean.entries[0].optimization,null);assert.equal(JSON.stringify(old),before);assert.equal(JSON.stringify(ctx.validatePreparedTrips(JSON.parse(JSON.stringify(clean)))),JSON.stringify(clean));
 }
 const data=ctx.validatePreparedTrips(dataset());
 for(const criterion of ['fastest','shortest',null]){data.entries[0].optimization=criterion;assert.equal(ctx.validatePreparedTrips(data).entries[0].optimization,criterion)}
 data.entries[0].optimization='cheapest';assert.throws(()=>ctx.validatePreparedTrips(data));delete data.entries[0].optimization;assert.throws(()=>ctx.validatePreparedTrips(data),/Critère/);
});
test('préparations : deux critères distinguent les paramètres malgré les mêmes lieux',()=>{
 const a=preparedFixture({optimization:'fastest'}),b=preparedFixture({id:'other',name:'Autre',optimization:'shortest'});
 assert.equal(ctx.preparedDuplicates(b,[a]).length,0);b.optimization='fastest';assert.equal(ctx.preparedDuplicates(b,[a]).length,1);b.optimization=null;assert.equal(ctx.preparedDuplicates(b,[a]).length,0);
});
test('préparations : format 5 garde les rencontres sans résultat obsolète ni migration inventée',()=>{
 const e=ctx.validatePreparedTrips(dataset()).entries[0];e.optimization='shortest';e.meetings={pickup:{label:'P',lat:45.5,lon:4.8},dropoff:{label:'D',lat:45.2,lon:4.9},limits:{km:30,minutes:45},stationPosition:'during',reference:{private:'exclude'}};
 const d={kind:'dragonroute-preparations',version:5,entries:[e]},clean=ctx.validatePreparedTrips(d);assert.equal(clean.entries[0].meetings.stationPosition,'during');assert.equal(clean.entries[0].meetings.reference,undefined);
 const old={...d,version:4},before=JSON.stringify(old),migrated=ctx.validatePreparedTrips(old);assert.equal(migrated.entries[0].meetings,null);assert.equal(migrated.entries[0].optimization,'shortest');assert.equal(JSON.stringify(old),before);
 delete e.meetings;assert.throws(()=>ctx.validatePreparedTrips(d),/rencontres/);e.meetings=null;assert.equal(ctx.validatePreparedTrips(d).entries[0].meetings,null);
});
