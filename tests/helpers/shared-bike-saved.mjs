import fs from 'node:fs';import vm from 'node:vm';
const app=fs.readFileSync('DragonRoute/app.js','utf8');
const blocks=['CYCLING MODEL','SAVED CYCLE MODEL','SHARED BIKES MODEL','SHARED BIKE TRIP MODEL','SAVED SHARED BIKE MODEL','PREPARED TRIPS MODEL'].map(name=>{const a=app.indexOf('// BEGIN '+name),b=app.indexOf('// END '+name,a);if(a<0||b<0)throw Error(name);return app.slice(a,b)}).join('\n');
export const sharedModel=vm.runInNewContext(blocks+';({validateSavedSharedEntry,validateSavedShared,parseSavedSharedText,savedSharedDuplicates,savedSharedTotals,sharedStationChanges,emptyBikeTripLimits,validateBikeTripLimits,bikeTripLimitReview,bikeSnapshot,cycleResponse,cycleRequest})',{TextEncoder,Date,URLSearchParams});
export const clone=x=>JSON.parse(JSON.stringify(x));
export function sharedFixture({legacy=false}={}){const d=JSON.parse(fs.readFileSync('tests/fixtures/shared-bike-saved/preparation.json','utf8'));return legacy?d:clone(sharedModel.validateSavedShared(d))}
