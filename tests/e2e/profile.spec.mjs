import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import {mockDragonRoute,geocodingPattern,addressFeature,placesResponse} from '../helpers/dragonroute.mjs';
import {capture,checkAccessibility,checkOverflow} from '../helpers/inspection.mjs';
const key='dragonroute.profile.v2.public',oldKey='dragonroute.profile.v1.public';
const sample=(version=2)=>({version,vehicle:{name:'Voiture de test',type:'car',fuel:'E10',cons:7,liters:35},addresses:[{id:'a',name:'École',value:'Valence'}],stations:[]});
const place={lat:44.922579,lon:4.921827,label:'Valence · 26000 · Drôme',source:'ign',resolvedAt:'2026-09-17T10:00:00.000Z'};
const file=data=>({name:'profil.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
async function open(page){await page.goto('/DragonRoute/');await page.locator('#profileBtn').click()}
async function seed(page,entries){await page.addInitScript(values=>{if(!sessionStorage.getItem('profile-seeded')){for(const [k,v] of Object.entries(values))localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v));sessionStorage.setItem('profile-seeded','1')}},entries)}
async function stored(page,k=key){return page.evaluate(k=>localStorage.getItem(k),k)}
async function exported(page,selector='#exportProfileBtn'){const pending=page.waitForEvent('download');await page.locator(selector).click();const download=await pending;return JSON.parse(fs.readFileSync(await download.path(),'utf8'))}
test.beforeEach(async({page})=>mockDragonRoute(page));

test('profil : favori résolu conservé après rechargement, sans reprendre un homonyme',async({page},info)=>{
 const routes=[],queries=[];let wrong=false;
 await page.route(geocodingPattern,r=>{const q=new URL(r.request().url()).searchParams.get('q');queries.push(q);return r.fulfill({json:q.includes('Valence')?placesResponse(addressFeature(...(wrong?[.9,44.1]:[4.921827,44.922579]),wrong?'Autre Valence':'Valence Drôme'),addressFeature(.904,44.108,'Valence Tarn')):placesResponse(addressFeature(4.8357,45.764,'Lyon'))})});
 page.on('request',r=>{if(r.url().includes('/route/v1/'))routes.push(decodeURIComponent(r.url()))});
 await page.goto('/DragonRoute/');await page.locator('#goBtn').click();await page.getByRole('radio',{name:'Valence Drôme'}).check();await page.locator('#confirmPlace').click();await expect(page.locator('#status')).toContainText('Trajet prêt');
 await page.locator('#profileBtn').click();await page.locator('#addressName').fill('Destination choisie');await page.locator('#copyEndBtn').click();await expect(page.locator('#addressPlaceStatus')).toContainText('Valence Drôme');await page.getByRole('button',{name:'Enregistrer l’adresse',exact:true}).click();
 expect(JSON.parse(await stored(page)).addresses[0].place).toMatchObject({lat:44.922579,lon:4.921827,source:'ign'});
 wrong=true;await page.reload();await page.locator('#profileBtn').click();await page.locator('[data-address-end]').click();await expect(page.locator('#endPlaceNote')).toContainText('Valence Drôme');
 const before=queries.length;await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('Trajet prêt');expect(queries.slice(before)).toEqual(['Lyon']);expect(routes.at(-1)).toContain('4.921827,44.922579');
 await page.locator('#end').fill('Valence modifiée');await expect(page.locator('#endPlaceNote')).toBeHidden();await page.locator('#goBtn').click();await expect(page.locator('#placeDialog')).toBeVisible();await page.locator('#cancelPlace').click();await expect(page.locator('#summary')).toBeHidden();
 await page.locator('#profileBtn').click();await checkAccessibility(page,info,'profil-lieu');await checkOverflow(page);await capture(page,info,'profil-lieu');
});

test('profil : vérifier un lieu, renommer sans perte et confirmer les doublons',async({page},info)=>{
 await open(page);await page.locator('#addressName').fill('École');await page.locator('#addressValue').fill('Lyon');await page.locator('#resolveAddressBtn').click();await expect(page.locator('#addressPlaceStatus')).toContainText('Lieu mémorisé');await page.getByRole('button',{name:'Enregistrer l’adresse',exact:true}).click();
 await page.locator('[data-address-edit]').click();await page.locator('#addressName').fill('École renommée');await page.getByRole('button',{name:'Enregistrer l’adresse',exact:true}).click();expect(JSON.parse(await stored(page)).addresses[0].place).toBeTruthy();
 await page.locator('#addressName').fill('Autre nom');await page.locator('#addressValue').fill(' Lyon ');await page.getByRole('button',{name:'Enregistrer l’adresse',exact:true}).click();await expect(page.locator('#addressDuplicates')).toBeVisible();await expect(page.locator('#allowAddressDuplicate')).toHaveAccessibleDescription(/École renommée/);await expect(page.locator('#savedAddresses .saved-row')).toHaveCount(1);
 await checkAccessibility(page,info,'profil-doublon');await capture(page,info,'profil-doublon');await page.locator('#allowAddressDuplicate').check();await page.getByRole('button',{name:'Enregistrer l’adresse',exact:true}).click();await expect(page.locator('#savedAddresses .saved-row')).toHaveCount(2);
 await page.locator('[data-address-edit]').first().click();await page.locator('#addressValue').fill('Grenoble');await expect(page.locator('#addressPlaceStatus')).toContainText('non mémorisé');await page.getByRole('button',{name:'Enregistrer l’adresse',exact:true}).click();expect(JSON.parse(await stored(page)).addresses[0].place).toBeUndefined();
});

test('profil : aperçu import, annulation au clavier, export propre et confirmation',async({page},info)=>{
 await seed(page,{[key]:sample()});await open(page);const previous=await stored(page);
 const incoming=sample();incoming.vehicle.name='Véhicule importé';incoming.addresses[0].place={...place,token:'secret-marker-profile'};incoming.apiKey='secret-marker-profile';incoming.addresses.push({id:'b',name:'<img src=x onerror=alert(1)>',value:'Autre adresse'});
 await page.locator('#importProfileFile').setInputFiles(file(incoming));await expect(page.locator('#profileImportSummary')).toContainText('2 adresse(s), dont 1');await expect(page.locator('#profileImportSummary')).toContainText('Véhicule importé');await expect(page.locator('#profileImportDialog')).toHaveAccessibleDescription(/2 adresse.*profil actuel/s);expect(await stored(page)).toBe(previous);
 await page.locator('#profileImportDialog').press('Escape');await expect(page.locator('#profileImportDialog')).toBeHidden();await expect(page.locator('#importProfileBtn')).toBeFocused();expect(await stored(page)).toBe(previous);
 await page.locator('#importProfileFile').setInputFiles(file(incoming));await page.locator('#profileImportDialog details').evaluate(e=>e.open=true);await expect(page.locator('#profileImportNames img')).toHaveCount(0);await expect(page.locator('#profileImportNames')).toContainText('<img src=x');expect(await exported(page,'#exportBeforeImport')).toEqual(sample());
 await checkAccessibility(page,info,'profil-import');await checkOverflow(page);await capture(page,info,'profil-import');await page.locator('#confirmProfileImport').click();await expect(page.locator('#profileMessage')).toHaveText('Profil importé.');
 const out=await exported(page);expect(out.addresses).toHaveLength(2);expect(JSON.stringify(out)).not.toContain('secret-marker-profile');expect(await page.locator('body').innerText()).not.toContain('secret-marker-profile');
});

test('profil : migration réversible, copie d’origine et version future préservée',async({page})=>{
 const original=sample(1);original.extraKey='secret-marker-profile';await seed(page,{[oldKey]:original});await open(page);const raw=await stored(page,oldKey);expect(await stored(page)).toBeNull();await expect(page.locator('#profileMessage')).toContainText('Ancien profil repris');
 const backup=await exported(page,'#exportLegacyProfileBtn');expect(backup).toEqual(sample(1));
 await page.locator('#vehicleName').fill('V2');await page.getByRole('button',{name:'Enregistrer le véhicule',exact:true}).click();expect(await stored(page,oldKey)).toBe(raw);expect(JSON.parse(await stored(page)).version).toBe(2);
 const future='{"version":999,"privateData":"preserve"}';await page.evaluate(([k,v])=>localStorage.setItem(k,v),[key,future]);await page.reload();await page.locator('#profileBtn').click();await expect(page.locator('#profileMessage')).toContainText('Profil non chargé');await expect(page.locator('#exportProfileBtn')).toBeDisabled();
 await page.locator('#vehicleName').fill('Ne pas remplacer');await page.getByRole('button',{name:'Enregistrer le véhicule',exact:true}).click();await expect(page.locator('#profileMessage')).toContainText('Enregistrement impossible');expect(await stored(page)).toBe(future);expect(await stored(page,oldKey)).toBe(raw);
 await page.locator('#importProfileFile').setInputFiles(file(sample()));await expect(page.locator('#profileMessage')).toContainText('Import refusé');expect(await stored(page)).toBe(future);
});

test('profil : quota, formulaire et import conservés, conflit entre onglets détecté',async({page})=>{
 await seed(page,{[key]:sample()});await open(page);const previous=await stored(page);
 await page.evaluate(()=>{window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw new Error('Quota')}});
 await page.locator('#addressName').fill('Travail');await page.locator('#addressValue').fill('Grenoble');await page.getByRole('button',{name:'Enregistrer l’adresse',exact:true}).click();await expect(page.locator('#profileMessage')).toContainText('Enregistrement impossible');await expect(page.locator('#addressValue')).toHaveValue('Grenoble');expect(await stored(page)).toBe(previous);
 await page.locator('#importProfileFile').setInputFiles(file({...sample(),addresses:[]}));await page.locator('#confirmProfileImport').click();await expect(page.locator('#profileImportMessage')).toContainText('Enregistrement impossible');await expect(page.locator('#profileImportDialog')).toBeVisible();expect(await stored(page)).toBe(previous);
 await page.evaluate(()=>Storage.prototype.setItem=window.originalSet);await page.locator('#confirmProfileImport').click();await expect(page.locator('#profileMessage')).toHaveText('Profil importé.');
 const other={...sample(),vehicle:{...sample().vehicle,name:'Autre onglet'}};await page.evaluate(([k,v])=>localStorage.setItem(k,JSON.stringify(v)),[key,other]);await page.locator('#vehicleName').fill('Modification locale');await page.getByRole('button',{name:'Enregistrer le véhicule',exact:true}).click();await expect(page.locator('#profileMessage')).toContainText('autre onglet');expect(JSON.parse(await stored(page))).toEqual(other);await expect(page.locator('#vehicleName')).toHaveValue('Modification locale');
});

test('profil : aperçu séparé et effacement limité aux deux versions du même environnement',async({page})=>{
 const previewOld='dragonroute.profile.v1.preview:/DragonRoute/',previewKey='dragonroute.profile.v2.preview:/DragonRoute/';
 await seed(page,{[oldKey]:sample(1),[key]:sample(),[previewOld]:{...sample(1),vehicle:{...sample().vehicle,name:'Aperçu'}},'autre-app':'conserver','dragonroute.profile.v2.preview:/autre/':sample()});
 await page.route('**/DragonRoute/',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace('<body>','<body data-preview="true">')})});
 await open(page);await expect(page.locator('#vehicleName')).toHaveValue('Aperçu');await page.getByRole('button',{name:'Enregistrer le véhicule',exact:true}).click();expect(await stored(page,previewKey)).not.toBeNull();
 page.on('dialog',d=>d.accept());
 await page.evaluate(k=>{window.originalRemove=Storage.prototype.removeItem;Storage.prototype.removeItem=function(key){if(key===k)throw new Error('Suppression refusée');return window.originalRemove.call(this,key)}},previewKey);
 await page.locator('#eraseProfileBtn').click();await expect(page.locator('#profileMessage')).toContainText('Suppression non terminée');expect(await stored(page,previewKey)).not.toBeNull();
 await page.evaluate(()=>Storage.prototype.removeItem=window.originalRemove);await page.locator('#eraseProfileBtn').click();await expect(page.locator('#profileMessage')).toHaveText('Profil local effacé.');expect(await stored(page,previewKey)).toBeNull();expect(await stored(page,previewOld)).toBeNull();expect(JSON.parse(await stored(page))).toEqual(sample());expect(JSON.parse(await stored(page,oldKey))).toEqual(sample(1));expect(await stored(page,'autre-app')).toBe('conserver');expect(await stored(page,'dragonroute.profile.v2.preview:/autre/')).not.toBeNull();
});

test('profil : réponse tardive annulée et position GPS jamais mémorisée comme adresse fixe',async({page})=>{
 let release;const waiting=new Promise(r=>release=r);let started=false;
 await page.route(geocodingPattern,async r=>{started=true;await waiting;await r.fulfill({json:placesResponse(addressFeature(4,45,'Ancien lieu 1'),addressFeature(5,46,'Ancien lieu 2'))})});
 await open(page);await page.locator('#addressValue').fill('Ancienne adresse');await page.locator('#resolveAddressBtn').click();await expect.poll(()=>started).toBe(true);await page.locator('#addressValue').fill('Nouvelle adresse');release();await page.waitForTimeout(200);await expect(page.locator('#placeDialog')).toBeHidden();await expect(page.locator('#addressPlaceStatus')).toContainText('non mémorisé');
 await page.locator('#addressName').fill('GPS');await page.locator('#addressValue').fill(' Ma   position ');await page.getByRole('button',{name:'Enregistrer l’adresse',exact:true}).click();await expect(page.locator('#profileMessage')).toContainText('libellé GPS');expect(await stored(page)).toBeNull();
 await page.getByRole('button',{name:'Fermer le profil'}).click();await page.locator('#start').fill('Ma position');await page.locator('#profileBtn').click();await page.locator('#copyStartBtn').click();await expect(page.locator('#profileMessage')).toContainText('adresse fixe');
});

test('profil : imports invalides, trop volumineux ou futurs ne changent aucune donnée',async({page})=>{
 await seed(page,{[key]:sample()});await open(page);const previous=await stored(page);
 const located=sample();located.addresses[0].place={...place,lat:91};
 for(const data of [{version:999},located,{...sample(),addresses:[sample().addresses[0],sample().addresses[0]]}]){await page.locator('#importProfileFile').setInputFiles(file(data));await expect(page.locator('#profileMessage')).toContainText('Import refusé');expect(await stored(page)).toBe(previous);await expect(page.locator('#profileImportDialog')).toBeHidden()}
 await page.locator('#importProfileFile').setInputFiles({name:'grand.json',mimeType:'application/json',buffer:Buffer.alloc(100001,32)});await expect(page.locator('#profileMessage')).toContainText('volumineux');expect(await stored(page)).toBe(previous);
});
