import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const exact = value => typeof value === 'string' && /^\d+\.\d+\.\d+$/.test(value);
export function dependencyErrors(manifest, lock, workflow, installed) {
 const errors=[]; const deps=manifest?.devDependencies||{};
 if(lock?.lockfileVersion!==3) errors.push('Verrou npm version 3 requis');
 const locked=lock?.packages||{},root=locked['']?.devDependencies||{};
 if(JSON.stringify(Object.entries(deps).sort())!==JSON.stringify(Object.entries(root).sort())) errors.push('Manifeste et verrou différents');
 for(const [name,version] of Object.entries(deps)) {
  if(!exact(version)) errors.push(`${name}: version exacte requise`);
  if(locked[`node_modules/${name}`]?.version!==version || installed[name]!==version) errors.push(`${name}: installation ou verrou différent`);
 }
 for(const [name,item] of Object.entries(locked)) if(name) {
  let url; try {url=new URL(item.resolved)} catch {}
  if(!exact(item.version)||!/^sha512-[A-Za-z0-9+/]+={0,2}$/.test(item.integrity||'')||!url||url.protocol!=='https:'||url.host!=='registry.npmjs.org'||url.username||url.password) errors.push(`${name}: source ou empreinte non verrouillée`);
 }
 const pw=deps['@playwright/test'];
 for(const name of ['playwright','playwright-core']) if(locked[`node_modules/${name}`]?.version!==pw||installed[name]!==pw) errors.push(`${name}: version Playwright incohérente`);
 const images=[...String(workflow).matchAll(/mcr\.microsoft\.com\/playwright:v([\d.]+)-noble/g)].map(m=>m[1]);
 if(images.length!==1||images[0]!==pw) errors.push('Image de recette et paquet Playwright différents');
 return errors;
}
export function inspectDependencies(root=process.cwd()) {
 const json=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
 const manifest=json('package.json'),bytes=fs.readFileSync(path.join(root,'package-lock.json'));
 const names=[...Object.keys(manifest.devDependencies),'playwright','playwright-core'];
 const dependencies=Object.fromEntries(names.map(name=>[name,json(`node_modules/${name}/package.json`).version]));
 const errors=dependencyErrors(manifest,JSON.parse(bytes),fs.readFileSync(path.join(root,'.github/workflows/apps-ci.yml'),'utf8'),dependencies);
 return {dependencies,lockSha256:createHash('sha256').update(bytes).digest('hex'),errors};
}
export function validToolchain(proof,commit) {
 return !!(proof&&proof.schemaVersion===1&&proof.state==='passed'&&proof.commit===commit&&proof.errors?.length===0&&
  /^\d+\.\d+\.\d+$/.test(proof.node||'')&&typeof proof.platform==='string'&&proof.platform.length&&/^[a-f0-9]{64}$/.test(proof.lockSha256||'')&&
  ['@playwright/test','playwright','playwright-core','axe-core','leaflet'].every(name=>exact(proof.dependencies?.[name]))&&
  proof.dependencies.playwright===proof.dependencies['@playwright/test']&&proof.dependencies['playwright-core']===proof.dependencies.playwright&&
  proof.browser?.engine==='chromium'&&['bundled','chrome'].includes(proof.browser.channel)&&/^\d+(\.\d+)+$/.test(proof.browser.version||''));
}
