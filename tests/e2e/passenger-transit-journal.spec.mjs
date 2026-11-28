import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import {fixture,prepare,calculate} from '../helpers/passenger-transit.mjs';
import {common} from '../helpers/passenger-access.mjs';
import {referenceState} from '../helpers/multi-adopt.mjs';
import {checkAccessibility} from '../helpers/inspection.mjs';
import {readingOverflow,enlargeText,reachable} from '../helpers/reading-layout.mjs';

const key='dragonroute.journal.v3.public',legacy='dragonroute.journal.v2.public';
const action=(p,i=0,scope='passengerTransitResults')=>p.locator('#'+scope+' [data-passenger-journal="'+i+'"]');
const read=p=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
async function ready(p){const ctx=await fixture(p);await prepare(p);await calculate(p);return ctx;}
async function enable(p){if(!await p.locator('#journalEnable').isChecked()){await p.locator('#journalEnable').check();await p.locator('#journalCollectivePending').click();}await expect(p.locator('#journalCollectiveEditor')).toBeVisible();}
async function save(p,date='2026-11-22'){await p.locator('#journalDate').fill(date);await p.locator('#journalConfirm').check();await p.locator('#journalSave').click();await expect(p.locator('#journalEditor')).toBeHidden();}
async function close(p){await p.getByRole('button',{name:'Fermer le journal',exact:true}).click();await expect(p.locator('#journalDialog')).toBeHidden();}

test('journal passagers : activation volontaire, une personne et conducteur conservé',async({page},info)=>{
 const ctx=await ready(page),calls=[...ctx.calls],transit=[...ctx.transitCalls];expect(await read(page)).toBeNull();await action(page,1).click();
 await expect(page.locator('#journalPassengerScope')).toContainText('pour une personne');await expect(page.locator('#journalEnable')).not.toBeChecked();expect(await read(page)).toBeNull();await enable(page);
 await expect(page.locator('#journalDate')).toHaveValue('');await expect(page.locator('#journalStart')).toHaveValue('Origine publique Grenoble · 38000');await expect(page.locator('#journalEnd')).toHaveValue('Destination publique Grenoble · 38000');
 await expect(page.locator('[data-jc="calculate"]:checked')).toHaveCount(0);await page.locator('#journalDate').fill('2026-11-22');await page.locator('#journalSave').click();expect((await read(page)).entries).toHaveLength(0);
 await save(page);const d=await read(page),entry=d.entries[0];expect(d.entries).toHaveLength(1);expect(entry.collective.steps.length).toBeGreaterThan(1);expect(entry.distanceMeters).toBe(entry.collective.steps.reduce((n,l)=>n+l.distanceMeters,0));expect(entry.emissions.valueKg).toBeNull();expect(entry.collective.origin.start).toBe('Origine publique Grenoble · 38000');expect(entry.collective.origin.steps.map(l=>l.line)).toEqual(entry.collective.steps.map(l=>l.line));expect(JSON.stringify(d)).not.toMatch(/persons|travelers|geometry|network|alerts/);
 await checkAccessibility(page,info,'journal-personnel-passagers');await close(page);await expect(action(page,1)).toBeFocused();await expect(page.locator('#comparisonTravelers')).toHaveValue('2');await page.locator('#multiModesClose').click();expect(await referenceState(page)).toEqual(ctx.reference);expect(ctx.calls).toEqual(calls);expect(ctx.transitCalls).toEqual(transit);expect(ctx.errors).toEqual([]);
});

test('journal passagers : identité après tri commun et modèle carbone non transféré',async({page})=>{
 const ctx=await ready(page);await common(page);await page.locator('#modalCarbonSort').selectOption('time');
 const choice=page.locator('[data-modal-option="1"]').first();if(await choice.count()){await choice.evaluate(e=>e.closest('details').open=true);const value=await choice.locator('option').nth(1).getAttribute('value');await choice.selectOption(value);}
 const original=await page.locator('#modalCarbonTables').textContent();await action(page,1,'modalCarbonTables').click();await enable(page);await expect(page.locator('[data-jc="calculate"]:checked')).toHaveCount(0);
 await save(page);const one=(await read(page)).entries[0];await close(page);await expect(action(page,1,'modalCarbonTables')).toBeFocused();expect(await page.locator('#modalCarbonTables').textContent()).toBe(original);
 await action(page,0,'modalCarbonTables').click();await save(page,'2026-11-21');const two=(await read(page)).entries[1];expect(two.collective.origin).not.toEqual(one.collective.origin);expect(two.collective.origin.start).toBe(one.collective.origin.start);expect(ctx.transitCalls).toHaveLength(1);expect(ctx.errors).toEqual([]);
});

test('journal passagers : carte changée et consultation tardive sans contamination du brouillon',async({page})=>{
 const ctx=await ready(page);let pending;const calls=[];await page.route('https://data.mobilites-m.fr/api/routers/default/index/routes',r=>{calls.push(r.request().url());pending=r;});
 await page.locator('[data-passenger-map="0"]').click();await page.locator('#passengerViewOption').selectOption('1');await page.locator('#passengerViewConsult').click();await expect.poll(()=>!!pending).toBe(true);
 await action(page,1,'passengerViewDetails').click();await expect(page.locator('#passengerViewDialog')).toBeHidden();await enable(page);await pending.fulfill({json:[{id:'SEM:A',shortName:'DONNEE_RESEAU_A_EXCLURE'}]}).catch(()=>{});
 await save(page);expect(JSON.stringify(await read(page))).not.toContain('DONNEE_RESEAU');expect(calls).toHaveLength(1);await close(page);await expect(page.locator('[data-passenger-map="0"]')).toBeFocused();expect(ctx.errors).toEqual([]);
});

test('journal passagers : corrections, inconnus et export avec anciennes données conservées',async({page})=>{
 const old={version:2,enabled:true,entries:[]};await page.addInitScript(([k,v])=>{localStorage.setItem(k,JSON.stringify(v))},[legacy,old]);await ready(page);await action(page,1).click();
 await expect(page.locator('#journalCollectiveEditor')).toBeVisible();expect(await read(page)).toBeNull();await page.locator('#journalConfirm').check();await page.locator('[data-jc-row="0"] [data-jc="distanceMeters"]').fill('');await expect(page.locator('#journalConfirm')).not.toBeChecked();await save(page);
 const entry=(await read(page)).entries[0];expect(entry.distanceMeters).toBeNull();expect(entry.collective.steps[0].distanceMeters).toBeNull();expect(entry.collective.origin.steps[0].distanceMeters).not.toBeNull();expect(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),legacy)).toEqual(old);
 const download=page.waitForEvent('download');await page.locator('#journalExport').click();const doc=JSON.parse(await fs.readFile(await(await download).path(),'utf8'));expect(doc).toEqual(await read(page));
 await page.locator('#journalImportFile').setInputFiles({name:'journal-personnel.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(doc))});await expect(page.locator('#journalImportMessage')).toContainText('Aucun changement');await page.locator('#journalImportCancel').click();expect(await read(page)).toEqual(doc);
});

test('journal passagers : refus de stockage conserve le brouillon et les données',async({page})=>{
 await ready(page);await action(page).click();await enable(page);const before=await read(page);await page.evaluate(()=>{const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.startsWith('dragonroute.journal.v3'))throw new DOMException('full','QuotaExceededError');return set.call(this,k,v)}});
 await page.locator('#journalDate').fill('2026-11-22');await page.locator('#journalConfirm').check();await page.locator('#journalSave').click();await expect(page.locator('#journalMessage')).toContainText('Enregistrement impossible');await expect(page.locator('#journalCollectiveEditor')).toBeVisible();expect(await read(page)).toEqual(before);
});

test('journal passagers : doublon, date future et annulation sans voyage supplémentaire',async({page})=>{
 await ready(page);await action(page).click();await enable(page);await save(page);await close(page);await action(page).click();await page.locator('#journalDate').fill('2026-11-24');await page.locator('#journalConfirm').check();await page.locator('#journalSave').click();expect((await read(page)).entries).toHaveLength(1);
 await page.locator('#journalDate').fill('2026-11-22');await page.locator('#journalConfirm').check();await page.locator('#journalSave').click();await expect(page.locator('#journalDuplicate')).toBeVisible();expect((await read(page)).entries).toHaveLength(1);await page.locator('#journalCancel').click();await close(page);await expect(action(page)).toBeFocused();
});

test('journal passagers : clavier et texte agrandi rendent le parcours intact',async({page},info)=>{
 const ctx=await ready(page);await page.setViewportSize({width:360,height:640});await enlargeText(page);await action(page).focus();await page.keyboard.press('Enter');await enable(page);await expect(page.locator('#journalDate')).toBeFocused();await readingOverflow(page);await checkAccessibility(page,info,'journal-passagers-agrandi');await reachable(page.getByRole('button',{name:'Fermer le journal',exact:true}));await page.screenshot({path:info.outputPath('journal-passagers-agrandi.png')});await page.keyboard.press('Escape');await expect(action(page)).toBeFocused();expect((await read(page)).entries).toHaveLength(0);await page.locator('#multiModesClose').click();expect(await referenceState(page)).toEqual(ctx.reference);expect(ctx.errors).toEqual([]);
});

test('journal passagers : contexte modifié sans événement refuse une ancienne option',async({page})=>{
 await ready(page);await page.locator('#passengerAccessStart').evaluate(e=>e.value='Autre départ');await action(page).click();await expect(page.locator('#journalDialog')).toBeHidden();expect(await read(page)).toBeNull();
});
