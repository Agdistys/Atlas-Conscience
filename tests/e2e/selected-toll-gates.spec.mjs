import {test,expect} from '@playwright/test';
import {setupSelectedTollApp as setup} from '../helpers/selected-toll-app.mjs';
import {checkAccessibility,checkOverflow,capture} from '../helpers/inspection.mjs';
const inventory={schemaVersion:1,source:'https://www.data.gouv.fr/datasets/gares-de-peage-du-reseau-routier-national-concede',referenceDate:'2025-01-01',gates:[
 {id:'mte2025-1014',name:'Vienne',road:'A0007',positions:[[45,5.0025,'D',1014]]},
 {id:'mte2025-228',name:'Valence Nord',road:'26A900710CD',positions:[[45,5.0055,'D',228]]}
]};
async function open(page){await page.locator('#selectedTollOpen').click();const d=page.getByRole('dialog',{name:'Choisir une portion payante'});await d.getByLabel('Classe de péage',{exact:true}).selectOption('1');await d.getByRole('button',{name:'Comparer les parcours'}).click();await d.getByRole('radio',{name:/Portion 1/}).check();await d.getByText('💰 Estimer le péage',{exact:true}).click();return d;}
const locate=d=>d.getByRole('button',{name:'📍 Repérer les gares'}).click();
const suggest=d=>d.getByRole('button',{name:'Proposer Vienne → Valence Nord'}).click();
test('selected toll gates: nearby candidates populate a declared pair only after an explicit action',async({page},info)=>{
 const {errors,requests,before}=await setup(page,{inventory,leaflet:true});const d=await open(page),count=requests.length;await locate(d);
 await expect(d.locator('.selected-gate-list')).toContainText('P1 · Vienne');await expect(d.locator('.selected-gate-list')).toContainText('P2 · Valence Nord');await expect(d.getByLabel('Réseau tarifaire de la portion')).toHaveValue('');expect(requests.length).toBe(count);
 await expect(d.locator('.selected-toll-map')).toContainText('P1');await suggest(d);await expect(d.getByLabel('Réseau tarifaire de la portion')).toHaveValue('ASF');await expect(d.getByRole('checkbox',{name:'Ces gares correspondent à toute la portion choisie'})).not.toBeChecked();
 await d.getByRole('button',{name:'Calculer cette portion'}).click();await expect(d.getByRole('status')).toContainText('Confirmer');expect(requests.length).toBe(count);expect(await page.evaluate(()=>tollTest.snapshot().trip)).toEqual(before.trip);
 await d.getByRole('checkbox',{name:'Ces gares correspondent à toute la portion choisie'}).check();await d.getByRole('button',{name:'Calculer cette portion'}).click();await expect(d.locator('.selected-toll-metrics')).toContainText('9,00');await checkAccessibility(page,info,'gate-candidates');await checkOverflow(page);await capture(page,info,'gate-candidates');await page.screenshot({path:info.outputPath('gate-viewport.png')});
 await d.getByRole('button',{name:'Choisir ce trajet',exact:true}).click();await expect(page.locator('#selectedTollSummary')).toContainText('9,00 € · gares déclarées');expect((await page.evaluate(()=>tollTest.snapshot())).trip.selectedToll.selection.price).toBeNull();expect(errors).toEqual([]);
});
test('selected toll gates: no candidates keeps manual pricing available and absence is not zero',async({page})=>{
 const {errors}=await setup(page,{inventory:{...inventory,gates:[]}});const d=await open(page);await locate(d);await expect(d.locator('.selected-toll-tariff')).toContainText('Aucune gare repérée');await expect(d.getByRole('button',{name:/^Proposer/})).toBeHidden();await d.getByLabel('Réseau tarifaire de la portion').selectOption('ASF');await d.getByLabel('Gare d’entrée déclarée').selectOption({label:'A7 · VIENNE'});await d.getByLabel('Gare de sortie déclarée').selectOption({label:'A7 · VALENCE-N'});await expect(d.locator('.selected-toll-tariff')).toContainText('9,00');expect(errors).toEqual([]);
});
test('selected toll gates: three candidates do not silently select a pair',async({page})=>{
 const source={...inventory,gates:[...inventory.gates,{id:'extra',name:'Unknown',positions:[[45,5.004,'I',99]]}]};const {errors}=await setup(page,{inventory:source});const d=await open(page);await locate(d);await expect(d.locator('.selected-gate-list li')).toHaveCount(3);await expect(d.getByRole('button',{name:/^Proposer/})).toBeHidden();await expect(d.getByLabel('Réseau tarifaire de la portion')).toHaveValue('');expect(errors).toEqual([]);
});
test('selected toll gates: a new comparison clears map candidates and cannot retain a gate confirmation',async({page})=>{
 const {errors}=await setup(page,{inventory});const d=await open(page);await locate(d);await suggest(d);await d.getByRole('checkbox',{name:'Ces gares correspondent à toute la portion choisie'}).check();await d.getByRole('button',{name:'Calculer cette portion'}).click();await expect(d.getByRole('button',{name:'Choisir ce trajet',exact:true})).toBeVisible();await suggest(d);await expect(d.getByRole('button',{name:'Choisir ce trajet',exact:true})).toBeHidden();await expect(d.getByRole('checkbox',{name:'Ces gares correspondent à toute la portion choisie'})).not.toBeChecked();
 await d.getByRole('button',{name:'Comparer les parcours'}).click();await d.getByRole('radio',{name:/Portion 1/}).check();await expect(d.locator('.selected-gate-list li')).toHaveCount(0);await expect(d.getByRole('button',{name:/^Proposer/})).toBeHidden();await page.keyboard.press('Escape');await page.locator('#selectedTollOpen').click();await expect(d.getByRole('button',{name:/^Proposer/})).toBeHidden();expect(errors).toEqual([]);
});
test('selected toll gates: unavailable inventory shows a recoverable message',async({page})=>{
 const {errors}=await setup(page,{inventory:{schemaVersion:0}});const d=await open(page);await locate(d);await expect(d.locator('.selected-toll-tariff')).toContainText('Inventaire des gares indisponible');await expect(d.getByLabel('Réseau tarifaire de la portion')).toBeEnabled();await page.keyboard.press('Escape');expect(errors).toEqual([]);
});
