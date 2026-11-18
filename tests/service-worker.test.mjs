import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {manifest} from './pwa-shell.mjs';
const source=fs.readFileSync(new URL('../DragonRoute/service-worker.js',import.meta.url),'utf8');
const scope='https://example.test/DragonRoute/';
function worker(caches){const listeners={};vm.runInNewContext(source,{URL,Request,Response,Map,self:{registration:{scope},addEventListener:(name,f)=>listeners[name]=f,clients:{claim:async()=>{}}},caches});return listeners}
test('shell manifest verifies exact distributed bytes and release identity',()=>{
 assert.ok(source.includes(manifest()));
 assert.doesNotMatch(source,/self\.skipWaiting\s*\(/);
});
test('activation only removes previous caches owned by this exact scope',async()=>{
 const prefix='dragonroute-shell:'+encodeURIComponent(scope)+':',removed=[];
 const current=prefix+source.match(/const RELEASE="([^"]+)"/)[1];
 const preserve=['dragonroute-v3-shell-28','agora-v1','dragonroute-shell:'+encodeURIComponent('https://example.test/Other/')+':old',current];
 const listeners=worker({keys:async()=>[...preserve,prefix+'old'],delete:async k=>removed.push(k)});let done;
 listeners.activate({waitUntil:p=>done=p});await done;assert.deepEqual(removed,[prefix+'old']);
});
test('personal queries, foreign scope, non-shell URLs and methods are not intercepted',()=>{
 const listeners=worker({});for(const [url,method] of [['api?address=private','GET'],['app.js?token=private','GET'],['missing.js','GET'],['../Other/app.js','GET'],['app.js','POST'],['https://foreign.test/DragonRoute/app.js','GET']]){
 let used=false;listeners.fetch({request:{url:new URL(url,scope).href,method,mode:'cors'},respondWith:()=>used=true});assert.equal(used,false,url);
 }
});
test('shell navigation aliases use a fixed key; missing assets do not fall back to HTML',async()=>{
 const keys=[],listeners=worker({open:async()=>({match:async key=>{keys.push(key);return key.endsWith('/app.js')?undefined:new Response('<html>shell</html>')}})});
 let result;listeners.fetch({request:{url:scope+'?v=123&address=private',method:'GET',mode:'navigate'},respondWith:p=>result=p});assert.equal(await(await result).text(),'<html>shell</html>');assert.deepEqual(keys,[scope]);
 listeners.fetch({request:{url:scope+'app.js',method:'GET',mode:'cors'},respondWith:p=>result=p});assert.equal((await result).type,'error');
});
