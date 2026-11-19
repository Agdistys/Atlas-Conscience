import fs from 'node:fs';import vm from 'node:vm';
const ctx={TextEncoder,structuredClone};vm.createContext(ctx);vm.runInContext(fs.readFileSync('DragonRoute/app.js','utf8').split('// BEGIN JOURNAL MODEL\n')[1].split('// END JOURNAL MODEL')[0],ctx);
export const model=ctx,clone=x=>JSON.parse(JSON.stringify(x)),preparation=()=>JSON.parse(fs.readFileSync('tests/fixtures/shared-bike-saved/preparation.json'));
export const at='2026-11-19T06:00:00.000Z',date='2026-11-18';
export const draft=()=>clone(ctx.sharedJournalDraft(preparation().entries[0],at,'shared-journey'));
export const entry=()=>({...draft(),date}),envelope=e=>({version:3,enabled:true,entries:[e]}),clean=e=>clone(ctx.validateJournal(envelope(e))).entries[0];
