import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('DragonRoute/app.js','utf8'),ctx={TextEncoder,fuelField:{E10:'e10',E85:'e85',Gazole:'gazole',SP98:'sp98',SP95:'sp95',GPLc:'gplc'}};vm.createContext(ctx);
vm.runInContext(source.slice(source.indexOf('function validateDimensions(d){'),source.indexOf('function routeDimensions()')),ctx);
vm.runInContext(source.split('// BEGIN PROFILE VALIDATION\n')[1].split('// END PROFILE VALIDATION')[0],ctx);
const profile=()=>({version:1,vehicle:{name:'Véhicule',type:'car',fuel:'E10',cons:6.2,liters:40},addresses:[{id:'a',name:'École',value:'Lyon'}],stations:[]});
const place=()=>({lat:45.76,lon:4.83,label:'Lyon · 69000',source:'ign',resolvedAt:'2026-09-17T10:00:00.000Z'});
test('profile: migration keeps known data without mutating the source or exporting extra fields',()=>{
 const input=profile();input.apiKey='unexported';input.vehicle.token='unexported';input.addresses[0].apiKey='unexported';const before=JSON.stringify(input);
 const clean=ctx.validateProfile(input);assert.equal(clean.version,4);assert.equal(clean.addresses[0].name,'École');assert.equal(JSON.stringify(input),before);assert.ok(!JSON.stringify(clean).includes('unexported'));
 clean.addresses[0].place=place();clean.addresses[0].place.secret='unexported';assert.ok(!JSON.stringify(ctx.validateProfile(clean)).includes('unexported'));
 assert.equal(JSON.stringify(ctx.validateProfile(ctx.validateProfile(clean))),JSON.stringify(ctx.validateProfile(clean)));
});
test('profile: invalid coordinates, timestamps, versions and oversized exports are refused',()=>{
 const p=profile();p.version=2;p.addresses[0].place=place();
 for(const patch of [{lat:91},{lon:'4'},{lat:null},{resolvedAt:'2026-02-30T10:00:00.000Z'},{resolvedAt:'demain'},{source:'autre'},{label:''}]){const q=structuredClone(p);Object.assign(q.addresses[0].place,patch);assert.throws(()=>ctx.validateProfile(q))}
 for(const value of [' Ma   position ','__CURRENT__']){const q=structuredClone(p);q.addresses[0].value=value;assert.throws(()=>ctx.validateProfile(q));}
 for(const version of [0,5,999])assert.throws(()=>ctx.validateProfile({...p,version}));
 assert.throws(()=>ctx.validateProfile({...p,addresses:[p.addresses[0],p.addresses[0]]}));
 const big=profile();big.version=2;big.addresses=Array.from({length:50},(_,i)=>({id:String(i),name:'N'.repeat(80),value:'A'.repeat(250),place:{...place(),label:'é'.repeat(1000)}}));assert.throws(()=>ctx.validateProfile(big),/volumineux/);
});
test('profile: duplicates respect identity, accents and distinct resolved homonyms',()=>{
 const a={id:'a',name:'École',value:'Valence',place:place()},b={...a,id:'b',name:' Ecole '};assert.equal(ctx.duplicateAddresses(b,[a]).length,1);assert.equal(ctx.duplicateAddresses(a,[a]).length,0);
 assert.equal(ctx.duplicateAddresses({...b,name:'Autre',place:{...place(),lat:44}},[a]).length,0);
 assert.equal(ctx.duplicateAddresses({...b,name:'Autre',place:undefined},[a]).length,1);
 assert.equal(ctx.duplicateAddressCount([a,b]),1);
});
test('vehicles: stable migration of both originals and selective reversible export',()=>{
 for(const version of [1,2]){const old={...profile(),version};if(version===2)old.addresses[0].place=place();old.secret='not-exported';old.vehicle.secret='not-exported';const before=JSON.stringify(old),p=ctx.validateProfile(old);assert.equal(p.vehicles.length,1);assert.equal(p.activeVehicleId,p.vehicles[0].id);assert.equal(p.vehicles[0].id,'legacy-vehicle');assert.equal(JSON.stringify(old),before);const back=ctx.legacyProfileExport(old);assert.equal(back.version,version);assert.equal(back.vehicle.name,old.vehicle.name);assert.ok(!JSON.stringify(back).includes('not-exported'));assert.equal(JSON.stringify(ctx.validateProfile(back)),JSON.stringify(p))}
});
test('vehicles: identities, active selection, optional complete dimensions and bounded fleet',()=>{
 const p=ctx.validateProfile(profile()),v=p.vehicles[0];
 for(const patch of [{activeVehicleId:'missing'},{activeVehicleId:undefined},{vehicles:[v,v]},{vehicles:[{...v,id:''}]},{vehicles:Array.from({length:11},(_,i)=>({...v,id:String(i)}))},{vehicles:[{...v,dimensions:{height:2}}]}])assert.throws(()=>ctx.validateProfile({...p,...patch}));
 assert.equal(ctx.validateProfile({...p,activeVehicleId:null}).activeVehicleId,null);
 const d={height:3,width:2.5,length:8,weight:4,axleload:2};const two={...p,vehicles:[v,{...v,id:'b',name:'Second',dimensions:d}],activeVehicleId:'b'};assert.equal(ctx.validateProfile(two).vehicles[1].dimensions.length,8);assert.equal(ctx.validateProfile(two).vehicles[0].dimensions,undefined);
 assert.throws(()=>ctx.validateProfile({...two,vehicles:[{...v,dimensions:{...d,axleload:5}}]}));
 assert.equal(ctx.validateProfile({...p,vehicles:[],activeVehicleId:null}).vehicles.length,0);
 assert.equal(ctx.duplicateVehicles({...v,id:'b',name:' VEHICULE '},[v]).length,1);assert.equal(ctx.duplicateVehicles(v,[v]).length,0);
});
test('profile v4: v3 migration keeps original, folders and preferences round trip without secret fields',()=>{
 const old={version:3,vehicles:[{id:'a',...profile().vehicle}],activeVehicleId:'a',addresses:profile().addresses,stations:[]},raw=JSON.stringify(old),p=ctx.validateProfile(old);
 assert.equal(p.version,4);assert.equal(p.preferences.defaultMode,'car');assert.equal(p.preferences.lastMode,null);assert.equal(JSON.stringify(old),raw);assert.equal(ctx.legacyProfileExport(old).version,3);
 p.folders=[{id:'family',name:'Famille',secret:'do not export'}];p.addresses[0].folderId='family';p.preferences={defaultMode:'walk',lastMode:'cycle',theme:'night',secret:'do not export'};
 const out=ctx.validateProfile(p);assert.equal(out.addresses[0].folderId,'family');assert.equal(out.preferences.lastMode,'cycle');assert.ok(!JSON.stringify(out).includes('do not export'));assert.equal(JSON.stringify(ctx.validateProfile(out)),JSON.stringify(out));
});
test('profile v4: dangling folders, duplicate names, unsupported preferences and malformed toll dimensions fail closed',()=>{
 const p=ctx.validateProfile(profile());p.folders=[{id:'one',name:'Amis'}];p.addresses[0].folderId='one';
 for(const patch of [{folders:[]},{folders:[{id:'one',name:'Amis'},{id:'two',name:' AMIS '}]},{folders:Array.from({length:21},(_,i)=>({id:String(i),name:String(i)}))},{preferences:{defaultMode:'truck',lastMode:null,theme:'day'}},{preferences:{defaultMode:'car',lastMode:'unknown',theme:'night'}}])assert.throws(()=>ctx.validateProfile({...p,...patch}));
 for(const toll of [{vehicleClass:'6',height:2,ptac:3},{vehicleClass:'1',height:0,ptac:3},{vehicleClass:'1',height:2,ptac:'3'},{vehicleClass:'1',height:2,ptac:Infinity}])assert.throws(()=>ctx.validateProfile({...p,vehicles:[{...p.vehicles[0],toll}]}));
 const out=ctx.validateProfile({...p,vehicles:[{...p.vehicles[0],toll:{vehicleClass:'2',height:2.4,ptac:3.2}}]});assert.equal(out.vehicles[0].toll.ptac,3.2);assert.equal(out.vehicles[0].dimensions,undefined);
});
test('profile v4: station provenance stays distinct from IGN, coordinates stay validated',()=>{
 const p=ctx.validateProfile(profile());p.addresses[0]={...p.addresses[0],stationId:'123',place:{...place(),source:'dgccrf'}};const out=ctx.validateProfile(p);assert.equal(out.addresses[0].place.source,'dgccrf');assert.equal(out.addresses[0].stationId,'123');assert.throws(()=>ctx.validateProfile({...p,addresses:[{...p.addresses[0],place:{...p.addresses[0].place,lon:181}}]}));
});
