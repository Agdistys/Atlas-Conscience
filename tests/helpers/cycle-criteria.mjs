import fs from 'node:fs';import vm from 'node:vm';
const app=fs.readFileSync('DragonRoute/app.js','utf8');export const model={Date,Intl,URLSearchParams,TextEncoder};vm.createContext(model);
for(const n of ['PREPARED TRIPS MODEL','CYCLING MODEL','CYCLE COMPARISON MODEL','SAVED CYCLE MODEL','STATION HOURS MODEL','TRANSIT MODEL'])vm.runInContext(app.split('// BEGIN '+n+'\n')[1].split('// END '+n)[0],model);
export const clone=x=>JSON.parse(JSON.stringify(x));
export function cycleFixture({legacy=false}={}){const d=JSON.parse(fs.readFileSync('tests/fixtures/cycling/saved-preparation.json'));if(!legacy){d.version=2;d.entries.forEach(e=>e.criteria.strict=false)}return d}
