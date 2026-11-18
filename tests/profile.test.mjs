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
 const clean=ctx.validateProfile(input);assert.equal(clean.version,2);assert.equal(clean.addresses[0].name,'École');assert.equal(JSON.stringify(input),before);assert.ok(!JSON.stringify(clean).includes('unexported'));
 clean.addresses[0].place=place();clean.addresses[0].place.secret='unexported';assert.ok(!JSON.stringify(ctx.validateProfile(clean)).includes('unexported'));
 assert.equal(JSON.stringify(ctx.validateProfile(ctx.validateProfile(clean))),JSON.stringify(ctx.validateProfile(clean)));
});
test('profile: invalid coordinates, timestamps, versions and oversized exports are refused',()=>{
 const p=profile();p.version=2;p.addresses[0].place=place();
 for(const patch of [{lat:91},{lon:'4'},{lat:null},{resolvedAt:'2026-02-30T10:00:00.000Z'},{resolvedAt:'demain'},{source:'autre'},{label:''}]){const q=structuredClone(p);Object.assign(q.addresses[0].place,patch);assert.throws(()=>ctx.validateProfile(q))}
 for(const value of [' Ma   position ','__CURRENT__']){const q=structuredClone(p);q.addresses[0].value=value;assert.throws(()=>ctx.validateProfile(q));}
 for(const version of [0,3,999])assert.throws(()=>ctx.validateProfile({...p,version}));
 assert.throws(()=>ctx.validateProfile({...p,addresses:[p.addresses[0],p.addresses[0]]}));
 const big=profile();big.version=2;big.addresses=Array.from({length:50},(_,i)=>({id:String(i),name:'N'.repeat(80),value:'A'.repeat(250),place:{...place(),label:'é'.repeat(1000)}}));assert.throws(()=>ctx.validateProfile(big),/volumineux/);
});
test('profile: duplicates respect identity, accents and distinct resolved homonyms',()=>{
 const a={id:'a',name:'École',value:'Valence',place:place()},b={...a,id:'b',name:' Ecole '};assert.equal(ctx.duplicateAddresses(b,[a]).length,1);assert.equal(ctx.duplicateAddresses(a,[a]).length,0);
 assert.equal(ctx.duplicateAddresses({...b,name:'Autre',place:{...place(),lat:44}},[a]).length,0);
 assert.equal(ctx.duplicateAddresses({...b,name:'Autre',place:undefined},[a]).length,1);
 assert.equal(ctx.duplicateAddressCount([a,b]),1);
});
