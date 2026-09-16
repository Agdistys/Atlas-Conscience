import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const ROOT=process.cwd();
const registryPath=path.join(ROOT,'tests','apps.registry.json');
assert.ok(fs.existsSync(registryPath),'registre des applications absent');
const apps=JSON.parse(fs.readFileSync(registryPath,'utf8'));
assert.ok(Array.isArray(apps)&&apps.length>0,'registre des applications vide');

for(const app of apps){
  const dir=path.resolve(ROOT,app.dir||'.');
  const entry=path.join(dir,app.entry);
  assert.ok(fs.existsSync(entry),`${app.name}: ${app.entry} absent`);
  const html=fs.readFileSync(entry,'utf8');

  const localRefs=[...html.matchAll(/(?:src|href)=["']\.\/([^"'#?]+)["']/g)].map(m=>m[1]);
  for(const ref of localRefs){
    const full=path.join(dir,ref);
    assert.ok(fs.existsSync(full),`${app.name}: référence locale manquante ./${ref}`);
  }

  assert.match(html,/name=["']viewport["']/i,`${app.name}: viewport absent`);
  if(app.pwa){
    assert.match(html,/manifest\.webmanifest/i,`${app.name}: manifest PWA absent`);
  }
}

console.log(`✓ contrat dépôt : ${apps.length} application(s) vérifiée(s)`);
