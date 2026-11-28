import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {dependencyErrors,inspectDependencies,validToolchain} from './dependency-contract.mjs';
import {passingToolchain} from './helpers/toolchain-proof.mjs';
const manifest=JSON.parse(fs.readFileSync('package.json')),lock=JSON.parse(fs.readFileSync('package-lock.json')),workflow=fs.readFileSync('.github/workflows/apps-ci.yml','utf8'),installed=inspectDependencies().dependencies;
const fixture=()=>structuredClone({manifest,lock,workflow,installed});
test('dependencies: installed packages, lock and image agree',()=>assert.deepEqual(inspectDependencies().errors,[]));
for(const [name,alter] of [
 ['floating pin',d=>d.manifest.devDependencies['@playwright/test']='^'+d.manifest.devDependencies['@playwright/test']],
 ['stale lock',d=>d.lock.packages['node_modules/axe-core'].version='0.0.1'],
 ['stale installation',d=>d.installed['playwright-core']='0.0.1'],
 ['wrong browser image',d=>d.workflow=d.workflow.replace(/playwright:v[\d.]+-noble/,'playwright:v0.0.1-noble')],
 ['missing integrity',d=>delete d.lock.packages['node_modules/playwright'].integrity],
 ['unreviewed package source',d=>d.lock.packages['node_modules/leaflet'].resolved='https://registry.npmjs.org.example.org/leaflet.tgz'],
 ['missing locked package',d=>delete d.lock.packages['node_modules/leaflet']]
])test(`dependencies reject ${name}`,()=>{const d=fixture();alter(d);assert.ok(dependencyErrors(d.manifest,d.lock,d.workflow,d.installed).length)});
test('runtime evidence must be complete, successful and bound to the inspected commit',()=>{
 const p=passingToolchain('sha');assert.equal(validToolchain(p,'sha'),true);
 for(const bad of [null,{...p,commit:'old'},{...p,state:'blocked'},{...p,errors:['launch failed']},{...p,browser:null},{...p,lockSha256:''},{...p,browser:{...p.browser,version:''}},{...p,dependencies:{...p.dependencies,playwright:'1.0.0'}}]) assert.equal(validToolchain(bad,'sha'),false);
});
