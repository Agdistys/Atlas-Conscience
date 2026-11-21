import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import {mockDragonRoute} from '../helpers/dragonroute.mjs';
import {capture,checkAccessibility,checkOverflow} from '../helpers/inspection.mjs';
const key='dragonroute.journal.v3.public',legacy='dragonroute.journal.v1.public';
const oldEntry={id:'original',date:'2026-11-17',mode:'car',distanceMeters:100000,distanceSource:'declared',start:'Lyon',end:'Valence',note:'',revision:1,createdAt:'2026-11-17T10:00:00.000Z',updatedAt:'2026-11-17T10:00:00.000Z',calculation:null,emissions:{version:'unavailable-v1',status:'unavailable',valueKg:null,factor:null}};
async function read(page){return page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key)}
async function manual(page,mode='car',distance='100'){
 await page.locator('#journalNew').click();await page.locator('#journalMode').selectOption(mode);await page.locator('#journalStart').fill('Lyon');await page.locator('#journalEnd').fill('Valence');await page.locator('#journalDistance').fill(distance);await page.locator('#journalConfirm').check();
}
async function estimate(page,factor='voiture-compact-diesel',occupants='2'){
 await page.locator('#carbonCalculate').check();await page.locator('#carbonFactor').selectOption(factor);if(await page.locator('#carbonOccupants').isVisible())await page.locator('#carbonOccupants').fill(occupants);
}
async function save(page){await page.locator('#journalSave').click();await expect(page.locator('#journalEditor')).toBeHidden()}
test.beforeEach(async({page})=>{await mockDragonRoute(page);await page.clock.setFixedTime(new Date('2026-11-18T10:00:00Z'))});
async function open(page){await page.goto('/DragonRoute/');await page.locator('#journalBtn').click();await page.locator('#journalEnable').check()}

test('carbone : choix explicite, part individuelle et détail vérifiable sur mobile',async({page},info)=>{
 await open(page);await manual(page);await expect(page.locator('#carbonCalculate')).not.toBeChecked();await estimate(page);await expect(page.locator('#carbonPreview')).toContainText('7,113 kg CO₂e');await expect(page.locator('#carbonPreview')).toContainText('14,225 kg CO₂e');await checkAccessibility(page,info,'carbone-formulaire');await checkOverflow(page);await capture(page,info,'carbone-formulaire');
 await save(page);const e=(await read(page)).entries[0];expect(e.emissions.occupants).toBe(2);expect(e.emissions.valueKg).toBeCloseTo(7.112670611477,9);await expect(page.locator('#journalCarbonSummary')).toContainText('7,113 kg CO₂e');await expect(page.locator('#journalModes')).toContainText('7,113 kg CO₂e');await page.getByText('Empreinte et méthode',{exact:true}).click();await expect(page.locator('#journalEntries')).toContainText('2026-11-18');await expect(page.locator('#journalEntries a').first()).toHaveAttribute('href','https://impactco2.fr/outils/transport/voiture-compact-diesel');
 await checkAccessibility(page,info,'carbone-bilan');await checkOverflow(page);await capture(page,info,'carbone-bilan');await page.reload();await page.locator('#journalBtn').click();expect((await read(page)).entries[0]).toEqual(e);
});
test('carbone : actualisation volontaire conserve les résultats antérieurs et correction invalide',async({page})=>{
 await open(page);await manual(page);await estimate(page);await save(page);const first=(await read(page)).entries[0].emissions;
 await page.locator('[data-journal-edit]').click();await page.locator('#journalNote').fill('Simple note');await page.locator('#journalConfirm').check();await save(page);expect((await read(page)).entries[0].emissions).toEqual(first);
 await page.locator('[data-journal-edit]').click();await estimate(page,'voiture-compact-diesel','4');await page.locator('#journalConfirm').check();await save(page);let e=(await read(page)).entries[0];expect(e.emissions.valueKg).toBe(first.valueKg/2);expect(e.emissionsHistory[0].estimate).toEqual(first);
 await page.locator('[data-journal-edit]').click();await page.locator('#journalDistance').fill('50');await expect(page.locator('#carbonPreview')).toContainText('retirera sa valeur');await page.locator('#journalConfirm').check();await save(page);e=(await read(page)).entries[0];expect(e.emissions.valueKg).toBeNull();expect(e.emissionsHistory).toHaveLength(2);await expect(page.locator('#journalSummary')).toContainText('CO₂e non estimé');await expect(page.locator('#journalCarbonSummary')).toContainText('1 trajet(s) sans estimation');
 const pending=page.waitForEvent('download');await page.locator('#journalExport').click();const out=JSON.parse(fs.readFileSync(await (await pending).path(),'utf8'));expect(out.entries[0].emissionsHistory).toEqual(e.emissionsHistory);
});
test('carbone : train sans double division, vélo non nul, marche et distance inconnue',async({page})=>{
 await open(page);await manual(page,'train');await estimate(page,'tgv');await expect(page.locator('#carbonOccupants')).toBeHidden();await save(page);expect((await read(page)).entries[0].emissions.valueKg).toBeCloseTo(.293,10);
 await manual(page,'bike','10');await estimate(page,'velo');await save(page);expect((await read(page)).entries[1].emissions.valueKg).toBeCloseTo(.0017,10);await expect(page.locator('#journalCarbonSummary')).toContainText('Construction seule');
 await manual(page,'walk','0');await expect(page.locator('#carbonCalculate')).toBeDisabled();await save(page);expect((await read(page)).entries[2].emissions.valueKg).toBeNull();
 await manual(page,'train','');await estimate(page,'ter');await page.locator('#journalSave').click();await expect(page.locator('#journalMessage')).toContainText('Renseigner la distance');expect((await read(page)).entries).toHaveLength(3);await page.locator('#carbonCalculate').uncheck();await save(page);await expect(page.locator('#journalSummary')).toContainText('2/4');
});
test('carbone : migration sans écriture ni recalcul et export de la copie originale',async({page})=>{
 const original=JSON.stringify({version:1,enabled:true,entries:[oldEntry]});await page.addInitScript(([k,v])=>localStorage.setItem(k,v),[legacy,original]);await page.goto('/DragonRoute/');expect(await read(page)).toBeNull();await page.locator('#journalBtn').click();await expect(page.locator('#journalMessage')).toContainText('copie d’origine');await page.locator('#journalMonth').fill('2026-11');await expect(page.locator('#journalSummary')).toContainText('CO₂e non estimé');
 await page.locator('[data-journal-edit]').click();await estimate(page);await page.locator('#journalConfirm').check();await save(page);expect((await read(page)).version).toBe(3);expect(await page.evaluate(k=>localStorage.getItem(k),legacy)).toBe(original);
 const pending=page.waitForEvent('download');await page.locator('#journalExportLegacy').click();expect(JSON.parse(fs.readFileSync(await (await pending).path(),'utf8'))).toEqual(JSON.parse(original));page.once('dialog',d=>d.accept());await page.locator('#journalErase').click();expect(await read(page)).toBeNull();expect(await page.evaluate(k=>localStorage.getItem(k),legacy)).toBeNull();
});
test('carbone : erreur de stockage et modification concurrente ne perdent pas l’estimation',async({page})=>{
 await open(page);await manual(page);await estimate(page);await save(page);const original=await read(page);await page.locator('[data-journal-edit]').click();await estimate(page,'voiture-compact-diesel','3');await page.locator('#journalConfirm').check();
 await page.evaluate(()=>{window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error('quota')}});await page.locator('#journalSave').click();await expect(page.locator('#journalMessage')).toContainText('Enregistrement impossible');expect(await read(page)).toEqual(original);await expect(page.locator('#carbonOccupants')).toHaveValue('3');await page.evaluate(()=>Storage.prototype.setItem=window.originalSet);
 await page.evaluate(k=>localStorage.setItem(k,'{"version":999}'),legacy);await page.locator('#journalSave').click();await expect(page.locator('#journalMessage')).toContainText('autre onglet');expect(await read(page)).toEqual(original);
});
test('carbone : révision incompatible protégée, choix remis à zéro et aucun envoi des données',async({page})=>{
 const requests=[];page.on('request',r=>requests.push(r.url()));await open(page);await manual(page);await estimate(page);await page.locator('#journalMode').selectOption('train');await expect(page.locator('#carbonFactor')).toHaveValue('');await expect(page.locator('#journalDistance')).toHaveValue('');await page.locator('#journalDistance').fill('100');await estimate(page,'tgv');await save(page);expect(requests.filter(u=>/impactco2|geocodage|route\/v1|api\/v1/.test(u))).toEqual([]);
 const data=await read(page);data.entries[0].emissions.valueKg=0;await page.evaluate(([k,v])=>localStorage.setItem(k,JSON.stringify(v)),[key,data]);await page.reload();await page.locator('#journalBtn').click();await expect(page.locator('#journalMessage')).toContainText('Journal non chargé');expect(await read(page)).toEqual(data);
});
