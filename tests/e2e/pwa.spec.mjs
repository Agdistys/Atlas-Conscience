import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import {pwaServer} from '../helpers/pwa-server.mjs';
import {mockDragonRoute} from '../helpers/dragonroute.mjs';
import {capture,checkAccessibility,checkOverflow} from '../helpers/inspection.mjs';
const prepared='dragonroute.prepared.v5.public',profile='dragonroute.profile.v3.public',journal='dragonroute.journal.v3.public';
const suite=test.extend({
 pwa:async({browser},use,info)=>{
  const server=await pwaServer();const context=await browser.newContext({serviceWorkers:'allow',viewport:info.project.use.viewport,locale:'fr-FR',timezoneId:'Europe/Paris',hasTouch:info.project.use.hasTouch||false});
  context.setDefaultTimeout(10000);await context.route(/^https:\/\//,r=>r.abort());
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{await use({...server,context,page,errors})}finally{await context.close();await server.close()}
 }
});
async function ready(page,origin,path='/DragonRoute/'){
 await page.goto(origin+path);await expect(page.locator('#hJS')).toContainText('✓');
 await page.waitForFunction(()=>navigator.serviceWorker.controller?.state==='activated');
 await expect(page.locator('#pwaStatus')).toContainText('Interface préparée');
}
const storage=page=>page.evaluate(()=>({...localStorage}));
async function checkUpdate(page){await page.locator('#appAvailability').evaluate(e=>e.open=true);await page.locator('#checkUpdateBtn').click()}
async function activeRelease(context,release){await expect.poll(async()=>{for(const w of context.serviceWorkers()){try{if(await w.evaluate(r=>RELEASE===r&&self.registration.active?.state==='activated','test-'+release))return true}catch{}}return false}).toBe(true)}

suite('PWA : réouverture hors ligne, instantané daté, profil et journal intacts',async({pwa},info)=>{
 const {page,origin,context}=pwa;await mockDragonRoute(page,{origin});await ready(page,origin);
 await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('Trajet prêt');
 await page.locator('#savePreparationBtn').click();await page.locator('#preparedName').fill('Lyon — Valence hors ligne');await page.locator('#preparedConfirm').check();await page.locator('#preparedSave').click();await page.getByRole('button',{name:'Fermer les trajets préparés'}).click();
 await page.locator('#journalRecordBtn').click();await page.locator('#journalEnable').check();await page.locator('#journalCopy').click();await page.locator('#journalConfirm').check();await page.locator('#journalSave').click();await page.getByRole('button',{name:'Fermer le journal'}).click();
 await page.locator('#profileBtn').click();await page.locator('#vehicleName').fill('Véhicule conservé');await page.locator('#vehicleForm').evaluate(f=>f.requestSubmit());await page.getByRole('button',{name:'Fermer le profil'}).click();
 const before=await storage(page);for(const key of [prepared,profile,journal])expect(before[key]).toBeTruthy();
 await context.setOffline(true);await page.close();const offline=await context.newPage();await offline.goto(origin+'/DragonRoute/?v=offline');await expect(offline.locator('#connectionNotice')).toBeVisible();await expect(offline.locator('#hJS')).toContainText('✓');
 await offline.locator('#preparedBtn').click();await offline.locator('[data-prepared-show]').click();await expect(offline.locator('#preparedDetails')).toContainText('Instantané');await expect(offline.locator('.prepared-schema')).toBeVisible();await checkAccessibility(offline,info,'pwa-instantane-hors-ligne');await checkOverflow(offline);await capture(offline,info,'pwa-instantane-hors-ligne');
 const download=offline.waitForEvent('download');await offline.locator('#preparedExport').click();expect(JSON.parse(await fs.readFile(await(await download).path(),'utf8'))).toEqual(JSON.parse(before[prepared]));await offline.getByRole('button',{name:'Fermer les trajets préparés'}).click();
 await offline.locator('#profileBtn').click();await expect(offline.locator('#vehicleName')).toHaveValue('Véhicule conservé');await offline.getByRole('button',{name:'Fermer le profil'}).click();
 await offline.locator('#journalBtn').click();await offline.locator('#journalMonth').fill(JSON.parse(before[journal]).entries[0].date.slice(0,7));await expect(offline.locator('#journalEntries')).toContainText('Lyon');await offline.getByRole('button',{name:'Fermer le journal'}).click();
 await offline.locator('#goBtn').click();await expect(offline.locator('#status')).toContainText('⚠️');await expect(offline.locator('#summary')).toBeHidden();expect(await storage(offline)).toEqual(before);
 const requests=pwa.state.requests.length;await context.setOffline(false);await expect(offline.locator('#connectionNotice')).toBeHidden();await expect(offline.locator('#status')).toContainText('⚠️');expect(pwa.state.requests.length).toBe(requests);expect(pwa.errors).toEqual([]);
});

suite('PWA : cache borné, données réseau absentes et aucun HTML de remplacement',async({pwa})=>{
 const {page,origin,context,state}=pwa;await ready(page,origin);
 const before=await page.evaluate(()=>caches.keys());expect(before).toHaveLength(1);
 const urls=['/DragonRoute/api?address=private','/Other/api?address=private','/DragonRoute/missing.js','/DragonRoute/app.js?token=private'];
 for(const path of urls)await page.evaluate(u=>fetch(u).then(r=>r.status),origin+path);
 expect(state.requests).toEqual(expect.arrayContaining(urls));
 const cached=await page.evaluate(async()=>{const c=await caches.open((await caches.keys())[0]);return (await c.keys()).map(r=>r.url)});expect(cached).toHaveLength(8);expect(cached.every(u=>u.startsWith(origin+'/DragonRoute/')&&!u.includes('?'))).toBe(true);
 await context.setOffline(true);
 for(const path of urls){expect(await page.evaluate(u=>fetch(u).then(()=>false,()=>true),origin+path)).toBe(true)}
 await page.evaluate(async()=>{const c=await caches.open((await caches.keys())[0]);await c.delete(new URL('app.js',location.href).href)});
 expect(await page.evaluate(()=>fetch('./app.js').then(()=>false,()=>true))).toBe(true);
});

suite('PWA : nouvelle version attend toutes les fenêtres et conserve les autres caches',async({pwa},info)=>{
 const {page,origin,context,state}=pwa;await ready(page,origin);await page.locator('#start').fill('Préparation non enregistrée');await page.evaluate(()=>{localStorage.setItem('pwa-sentinel','conserver');return caches.open('dragonroute-v3-shell-28')});
 const other=await context.newPage();await ready(other,origin,'/Other/');const sibling=await context.newPage();await ready(sibling,origin);await sibling.locator('#end').fill('Autre brouillon');await page.evaluate(()=>{localStorage.setItem('dragonroute.profile.v2.public',JSON.stringify({version:2,vehicle:{name:'Profil conservé',type:'car',fuel:'E10',cons:6.2,liters:40},addresses:[],stations:[]}));localStorage.setItem('dragonroute.prepared.v5.public',JSON.stringify({kind:'dragonroute-preparations',version:5,entries:[]}));localStorage.setItem('dragonroute.journal.v3.public',JSON.stringify({version:2,enabled:false,entries:[]}))});const saved=await storage(page);const initialKeys=await page.evaluate(()=>caches.keys());const foreign=initialKeys.find(k=>k.includes(encodeURIComponent(origin+'/Other/')));expect(foreign).toBeTruthy();
 state.release='B';await checkUpdate(page);await expect(page.locator('#pwaUpdateNotice')).toBeVisible();await expect(page.locator('#pwaUpdateNotice')).toContainText('fermer toutes les fenêtres');await expect(page.locator('body')).toHaveAttribute('data-test-release','A');await expect(page.locator('#start')).toHaveValue('Préparation non enregistrée');await expect(sibling.locator('#end')).toHaveValue('Autre brouillon');
 await page.locator('#pwaUpdateNotice').scrollIntoViewIfNeeded();await checkAccessibility(page,info,'pwa-mise-a-jour-attente');await capture(page,info,'pwa-mise-a-jour-attente');await checkOverflow(page);
 await page.close();await expect(sibling.locator('body')).toHaveAttribute('data-test-release','A');await expect.poll(()=>sibling.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();return {waiting:r.waiting?.state,controller:navigator.serviceWorker.controller?.state,installing:r.installing?.state}})).toMatchObject({waiting:'installed',controller:'activated'});await sibling.close();await activeRelease(context,'B');
 const next=await context.newPage();await ready(next,origin);await expect(next.locator('body')).toHaveAttribute('data-test-release','B');expect(await storage(next)).toEqual(saved);const keys=await next.evaluate(()=>caches.keys());expect(keys).toContain(foreign);expect(keys).toContain('dragonroute-v3-shell-28');expect(keys.some(k=>k.includes(encodeURIComponent(origin+'/DragonRoute/'))&&k.endsWith('test-A'))).toBe(false);await expect(other.locator('body')).toHaveAttribute('data-test-release','A');
});

suite('PWA : intégrité refusée, ancienne version conservée puis mise à jour réparée',async({pwa})=>{
 const {page,origin,context,state}=pwa;await ready(page,origin);const keys=await page.evaluate(()=>caches.keys());state.release='B';state.corrupt='./config.js';await checkUpdate(page);await expect(page.locator('#pwaStatus')).toContainText('interrompue');await expect(page.locator('#pwaUpdateNotice')).toBeHidden();expect(await page.evaluate(()=>caches.keys())).toEqual(keys);await page.reload();await expect(page.locator('body')).toHaveAttribute('data-test-release','A');await expect(page.locator('#hJS')).toContainText('✓');
 state.corrupt=null;state.release='C';await checkUpdate(page);await expect(page.locator('#pwaUpdateNotice')).toBeVisible();await page.close();await activeRelease(context,'C');const next=await context.newPage();await ready(next,origin);await expect(next.locator('body')).toHaveAttribute('data-test-release','C');
});

suite('PWA : aperçu exclu de l’installation, connexion indicative sans recalcul',async({pwa},info)=>{
 const {page,origin,context,state}=pwa;await page.goto(origin+'/preview/');await expect(page.locator('#hJS')).toContainText('✓');await page.locator('#appAvailability').evaluate(e=>e.open=true);await expect(page.locator('#pwaStatus')).toContainText('Version d’essai');await expect(page.locator('#checkUpdateBtn')).toBeHidden();expect(context.serviceWorkers()).toHaveLength(0);expect(await page.evaluate(()=>caches.keys())).toEqual([]);expect(state.requests.some(p=>p.includes('service-worker'))).toBe(false);
 await context.setOffline(true);await expect(page.locator('#connectionNotice')).toBeVisible();await expect(page.locator('#goBtn')).toBeEnabled();await page.locator('#connectionNotice').scrollIntoViewIfNeeded();await capture(page,info,'pwa-apercu-hors-ligne');await checkAccessibility(page,info,'pwa-apercu-hors-ligne');await checkOverflow(page);
 await context.setOffline(false);await expect(page.locator('#connectionNotice')).toBeHidden();await expect(page.locator('#networkStatus')).toContainText('reste à vérifier');expect(state.requests.some(p=>p.includes('/api')||p.includes('navigation'))).toBe(false);
});

suite('PWA : première installation refusée et invitation native simulée sans fausse confirmation',async({pwa})=>{
 const {page,origin,state}=pwa;state.corrupt='./config.js';await page.goto(origin+'/DragonRoute/');await expect(page.locator('#hJS')).toContainText('✓');await expect(page.locator('#pwaStatus')).toContainText('n’a pas pu être préparée');expect(await page.evaluate(()=>caches.keys())).toEqual([]);
 state.corrupt=null;state.release='B';await checkUpdate(page);await expect(page.locator('#pwaStatus')).toContainText('Interface préparée');
 await page.evaluate(()=>{const e=new Event('beforeinstallprompt',{cancelable:true});e.prompt=()=>Promise.resolve();e.userChoice=Promise.resolve({outcome:'dismissed'});dispatchEvent(e)});await expect(page.locator('#installBtn')).toBeVisible();await page.locator('#installBtn').click();await expect(page.locator('#installHelp')).toContainText('Installation non demandée');await expect(page.locator('#installBtn')).toBeHidden();
 await page.evaluate(()=>{const e=new Event('beforeinstallprompt',{cancelable:true});e.prompt=()=>Promise.resolve();e.userChoice=Promise.resolve({outcome:'accepted'});dispatchEvent(e)});await page.locator('#installBtn').click();await expect(page.locator('#installHelp')).toContainText('Installation demandée');await page.evaluate(()=>dispatchEvent(new Event('appinstalled')));await expect(page.locator('#installHelp')).toContainText('Installation signalée');expect(pwa.errors).toEqual([]);
});
