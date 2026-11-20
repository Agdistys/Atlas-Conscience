import {test,expect} from '@playwright/test';
for(const failure of ['absence','annulation'])test('retour : ancienne résolution retirée après nouvelle tentative '+failure,async({page})=>{
 const calls=await setup(page);await page.clock.install({time:new Date('2026-09-17T10:00:00Z')});await go(page);await page.clock.fastForward(300001);
 await page.route(geocodingPattern,r=>r.fulfill({json:failure==='absence'?placesResponse():placesResponse(addressFeature(4.7,45.9,'Nouveau A'),addressFeature(4.9,46,'Nouveau B'))}));
 await page.locator('#goBtn').click();
 if(failure==='annulation'){await expect(page.locator('#placeDialog')).toBeVisible();await page.locator('#cancelPlace').click()}else await expect(page.locator('#startTripError')).toBeVisible();
 const count=calls.length;await swap(page);expect(calls.length).toBe(count);await expect(page.locator('#endPlaceNote')).toBeHidden();await expect(page.locator('#startPlaceNote')).toBeVisible();
 await page.route(geocodingPattern,r=>r.fulfill({json:placesResponse(addressFeature(4.7,45.9,'Nouveau lieu confirmé'))}));await advance(page);await page.locator('#goBtn').click();
 if(failure==='annulation'){await expect(page.locator('#placeDialog')).toBeVisible();await page.locator('input[name=placeChoice]').first().check();await page.locator('#confirmPlace').click()}
 await expect(page.locator('#status')).toContainText('Trajet prêt');
 expect(points(routes(calls).at(-1))).toEqual([[4.8924,44.9334],[4.7,45.9]]);
});
test('retour : copie du lieu inversé vers un favori conserve sa provenance IGN',async({page})=>{
 const calls=await setup(page);await go(page);await swap(page);const n=calls.length;await page.locator('#profileBtn').click();await page.locator('#addressName').fill('Départ retour');await page.locator('#copyStartBtn').click();await expect(page.locator('#addressPlaceStatus')).toContainText('Valence');await page.getByRole('button',{name:'Enregistrer l’adresse',exact:true}).click();expect(calls.length).toBe(n);
 const profile=await page.evaluate(()=>JSON.parse(localStorage.getItem('dragonroute.profile.v3.public')));expect(profile.addresses[0].place).toMatchObject({source:'ign',lat:44.9334,lon:4.8924,label:'Valence, France'});expect(profile.addresses[0].place.resolvedAt).toBeTruthy();
 await page.reload();await page.locator('#profileBtn').click();await page.locator('[data-address-start]').click();await expect(page.locator('#startPlaceNote')).toContainText('Valence');
});
test('retour : paysage et texte agrandi gardent commande et champs accessibles',async({page},info)=>{
 const calls=await setup(page);await page.setViewportSize({width:844,height:390});await page.evaluate(()=>document.documentElement.style.fontSize='200%');await page.locator('#swapTripBtn').focus();await page.keyboard.press('Enter');await expect(page.locator('#start')).toHaveValue('Valence');await expect(page.locator('#swapTripBtn')).toBeFocused();await checkOverflow(page);await capture(page,info,'retour-paysage-200');await checkAccessibility(page,info,'retour-paysage-200');expect(calls).toHaveLength(0);
});
import {mockDragonRoute,geocodingPattern,addressFeature,placesResponse,confirmStationPreview} from '../helpers/dragonroute.mjs';
import {setup as gpsSetup,propose,reply,go,search} from '../helpers/gps-origin.mjs';
import {capture,checkAccessibility,checkOverflow} from '../helpers/inspection.mjs';
import {transferPlan,transitPlanPattern} from '../helpers/transit-transfers.mjs';
const osrm='https://router.project-osrm.org/route/v1/driving/**',ign='https://data.geopf.fr/navigation/itineraire?**';
const stored=page=>page.evaluate(()=>JSON.stringify({...localStorage}));
const points=url=>new URL(url).pathname.split('/').at(-1).split(';').map(s=>s.split(',').map(Number));
const routes=calls=>calls.filter(u=>u.includes('/route/v1/'));
async function advance(page){await page.clock.setFixedTime(new Date(await page.evaluate(()=>Date.now())+5000))}
async function swap(page){await page.evaluate(()=>{window.swapWrites=0;const proto=Storage.prototype;if(!window.swapStorageInstrumented){window.swapStorageInstrumented=true;for(const key of ['setItem','removeItem','clear']){const original=proto[key];proto[key]=function(...args){window.swapWrites++;return original.apply(this,args)}}}});await page.locator('#swapTripBtn').click();await expect(page.locator('#status')).toContainText('Lieux inversés');expect(await page.evaluate(()=>swapWrites)).toBe(0)}
async function setup(page,{hold=false}={}){
 await mockDragonRoute(page);
 if(hold)await page.addInitScript(()=>{const original=fetch;let count=0;window.held=[];window.fetch=async(input,init)=>{if(!String(input).includes('/route/v1/')||count++)return original(input,init);const response=await original(input,{...init,signal:undefined});await new Promise(r=>held.push(r));return response}});
 await page.route(osrm,r=>{const p=points(r.request().url()),back=p[0][1]<45.1;return r.fulfill({json:{code:'Ok',routes:[{distance:back?112000:104000,duration:back?4800:3900,geometry:{type:'LineString',coordinates:p}}]}})});
 await page.route(ign,r=>{const p=new URL(r.request().url()).searchParams,start=p.get('start'),end=p.get('end'),back=Number(start.split(',')[1])<45.1,distance=back?112000:104000,duration=back?4800:3900;return r.fulfill({json:{resource:'bdtopo-osrm',resourceVersion:'2026-11',profile:p.get('profile'),optimization:p.get('optimization'),crs:'EPSG:4326',distanceUnit:'meter',timeUnit:'second',distance,duration,constraints:p.has('constraints')?[{type:'banned',key:'waytype',operator:'=',value:'autoroute'}]:[],geometry:{type:'LineString',coordinates:[start.split(',').map(Number),end.split(',').map(Number)]},portions:[{start,end,distance,duration}]}})});
 const calls=[];page.on('request',r=>{if(/geocodage|\/plan\?|\/route\/v1|\/table\/v1|navigation\/itineraire|data.economie/.test(r.url()))calls.push(r.url())});
 await page.goto('/DragonRoute/');return calls;
}

test('retour : lieux partiels, clavier, erreurs liées aux champs et aucune requête',async({page},info)=>{
 const calls=await setup(page),before=await stored(page);await page.locator('#start').fill('  ');await page.locator('#end').fill('Valence');await page.locator('#goBtn').click();await expect(page.locator('#start')).toHaveAttribute('aria-invalid','true');
 await page.locator('#swapTripBtn').focus();await page.keyboard.press('Enter');await expect(page.locator('#start')).toHaveValue('Valence');await expect(page.locator('#end')).toHaveValue('  ');await expect(page.locator('#startTripError')).toHaveCount(0);await expect(page.locator('#end')).toHaveAttribute('aria-invalid','true');await expect(page.locator('#swapTripBtn')).toBeFocused();
 expect((await page.locator('#swapTripBtn').boundingBox()).height).toBeGreaterThanOrEqual(44);expect(calls).toHaveLength(0);expect(await stored(page)).toBe(before);
 await checkOverflow(page);await checkAccessibility(page,info,'retour-lieux-partiels');await capture(page,info,'retour-lieux-partiels');
 await swap(page);await expect(page.locator('#start')).toHaveValue('  ');await expect(page.locator('#end')).toHaveValue('Valence');
 await page.locator('#end').fill('');await swap(page);await expect(page.locator('#start')).toHaveValue('');await expect(page.locator('#end')).toHaveValue('  ');expect(calls).toHaveLength(0);
});
test('retour : nouveau sens asymétrique, lieux confirmés conservés et ancien tracé retiré',async({page},info)=>{
 const calls=await setup(page);await go(page);await expect(page.locator('#tripKm')).toHaveText('104,0 km');const n=calls.length,before=await stored(page);
 await swap(page);expect(calls.length).toBe(n);await expect(page.locator('#summary')).toBeHidden();await expect(page.locator('#routeLine')).toHaveAttribute('d','');await expect(page.locator('#resolvedPlaces')).toBeHidden();await expect(page.locator('#startPlaceNote')).toContainText('Valence');
 await advance(page);await go(page);await expect(page.locator('#tripKm')).toHaveText('112,0 km');await expect(page.locator('#tripTime')).toHaveText('80 min');expect(points(routes(calls).at(-1))).toEqual([[4.8924,44.9334],[4.8357,45.764]]);expect(calls.filter(u=>u.includes('/geocodage/'))).toHaveLength(2);expect(await stored(page)).toBe(before);
 await checkAccessibility(page,info,'retour-calcule');await capture(page,info,'retour-calcule');
});
test('retour : choix ambigu reste exact, aucun premier résultat substitué',async({page})=>{
 const calls=await setup(page);await page.route(geocodingPattern,r=>r.fulfill({json:placesResponse(addressFeature(4.8,45.7,'Lieu A'),addressFeature(4.9,45.8,'Lieu B'))}));
 await page.locator('#goBtn').click();await expect(page.locator('#placeDialog')).toBeVisible();await page.locator('input[name=placeChoice]').nth(1).check();await page.locator('#confirmPlace').click();await expect(page.locator('#placeDialog')).toBeVisible();await page.locator('input[name=placeChoice]').first().check();await page.locator('#confirmPlace').click();await expect(page.locator('#status')).toContainText('Trajet prêt');
 await swap(page);await advance(page);await go(page);expect(points(routes(calls).at(-1))).toEqual([[4.8,45.7],[4.9,45.8]]);await expect(page.locator('#placeDialog')).toBeHidden();
});
test('retour : modification silencieuse ne transporte pas les anciennes coordonnées',async({page})=>{
 const calls=await setup(page);await go(page);await page.locator('#end').evaluate(e=>e.value='Nouvelle adresse');await swap(page);await expect(page.locator('#startPlaceNote')).toBeHidden();await expect(page.locator('#endPlaceNote')).toBeVisible();await advance(page);await go(page);
 expect(calls.filter(u=>u.includes('/geocodage/')).map(u=>new URL(u).searchParams.get('q'))).toEqual(['Lyon','Valence','Nouvelle adresse']);
});
test('retour : favori confirmé transféré, profil inchangé et édition manuelle détache le point',async({page})=>{
 const calls=await setup(page);await go(page);await page.locator('#profileBtn').click();await page.locator('#addressName').fill('Destination');await page.locator('#copyEndBtn').click();await page.getByRole('button',{name:'Enregistrer l’adresse',exact:true}).click();await page.locator('[data-address-end]').click();
 const before=await stored(page),n=calls.length;await swap(page);expect(calls.length).toBe(n);await advance(page);await go(page);expect(calls.filter(u=>u.includes('/geocodage/'))).toHaveLength(2);expect(await stored(page)).toBe(before);
 await page.locator('#start').fill('Nouveau lieu');await expect(page.locator('#startPlaceNote')).toBeHidden();await advance(page);await go(page);expect(calls.some(u=>u.includes('q=Nouveau+lieu'))).toBe(true);
});
test('retour : préparation sauvegardée préservée, horaires et rappel à réexaminer',async({page})=>{
 const calls=await setup(page);await page.locator('#stationDeparture').fill('2026-09-18T10:00');await page.locator('#routeArriveBy').fill('2026-09-18T14:00');await page.locator('#routeOnlyBefore').check();await go(page);
 await page.locator('#savePreparationBtn').click();await page.locator('#preparedName').fill('Aller conservé');await page.locator('#preparedConfirm').check();await page.locator('#preparedSave').click();await expect(page.locator('#preparedMessage')).toContainText('Préparation enregistrée');await page.getByRole('button',{name:'Fermer les trajets préparés'}).click();
 await page.locator('#preparedBtn').click();await page.locator('[data-prepared-show]').first().click();page.once('dialog',d=>d.accept());await page.locator('#preparedResumeBtn').click();await expect(page.locator('#preparedResume')).toBeVisible();const before=await stored(page),n=calls.length;
 await swap(page);await expect(page.locator('#preparedResume')).toBeHidden();await expect(page.locator('#stationDeparture')).toHaveValue('');await expect(page.locator('#routeArriveBy')).toHaveValue('');await expect(page.locator('#routeOnlyBefore')).not.toBeChecked();expect(calls.length).toBe(n);expect(await stored(page)).toBe(before);
 await advance(page);await go(page);expect(calls.filter(u=>u.includes('/geocodage/'))).toHaveLength(2);expect(await stored(page)).toBe(before);
});
test('retour : point GPS adopté devient historique en arrivée et reste fixe après deux inversions',async({page},info)=>{
 const calls=await gpsSetup(page);await propose(page,{coords:{latitude:45.520987654,longitude:4.870123456}});await page.locator('#gpsConfirm').click();const n=calls.length,before=await stored(page);
 await swap(page);await expect(page.locator('#end')).toHaveValue(/Point GPS du/);await expect(page.locator('#endPlaceNote')).toContainText('Point historique fixe');await expect(page.locator('#endPlaceNote')).toContainText('25 m');await expect(page.locator('#gpsOriginNote')).toBeHidden();expect(calls.length).toBe(n);await go(page);expect(points(routes(calls).at(-1)).at(-1)).toEqual([4.870123456,45.520987654]);
 await page.clock.setFixedTime(new Date(await page.evaluate(()=>Date.now())+120000));await swap(page);await expect(page.locator('#start')).toHaveValue(/Point GPS du/);await expect(page.locator('#startPlaceNote')).toContainText('17/09/2026');await go(page);expect(points(routes(calls).at(-1))[0]).toEqual([4.870123456,45.520987654]);expect(await page.evaluate(()=>gpsCalls.length)).toBe(1);expect(calls.some(u=>/geocodage/.test(u)&&/GPS|position/.test(u))).toBe(false);expect(await stored(page)).toBe(before);await capture(page,info,'retour-point-gps-date');await checkAccessibility(page,info,'retour-point-gps-date');
});
test('retour : libellé GPS sans point ne devient pas une adresse géocodée',async({page})=>{
 const calls=await setup(page);await page.locator('#start').fill('Ma position');await swap(page);await page.locator('#goBtn').click();await expect(page.locator('#end')).toHaveAttribute('aria-invalid','true');await expect(page.locator('#endTripError')).toContainText('arrivée confirmée');expect(calls).toHaveLength(0);
 await page.locator('#end').fill('Valence');await go(page);
});
test('retour : proposition GPS non adoptée annulée et callback tardif ignoré',async({page})=>{
 const calls=await gpsSetup(page);await page.locator('#gpsBtn').click();await page.locator('#swapTripBtn').evaluate(e=>e.click());await expect(page.locator('#gpsDialog')).toBeHidden();await reply(page);await expect(page.locator('#start')).toHaveValue('Valence');await expect(page.locator('#end')).toHaveValue('Lyon');await expect(page.locator('#gpsOriginNote')).toBeHidden();expect(calls).toHaveLength(0);
});
test('retour : verrou pendant recherche puis annulation, ancienne réponse sans effet',async({page})=>{
 const calls=await setup(page,{hold:true});await page.locator('#goBtn').click();await expect.poll(()=>page.evaluate(()=>held.length)).toBe(1);await expect(page.locator('#swapTripBtn')).toBeDisabled();await page.locator('#swapTripBtn').evaluate(e=>e.dispatchEvent(new MouseEvent('click',{bubbles:true})));await expect(page.locator('#start')).toHaveValue('Lyon');
 await page.locator('#cancelTripBtn').click();await swap(page);await advance(page);await go(page);await expect(page.locator('#tripKm')).toHaveText('112,0 km');await page.evaluate(()=>held[0]());await expect(page.locator('#tripKm')).toHaveText('112,0 km');await expect(page.locator('#swapTripBtn')).toBeEnabled();expect(routes(calls)).toHaveLength(2);
});
test('retour : arrêt, autonomie, rencontres et hypothèses carbone retirés sans toucher aux données',async({page})=>{
 const calls=await gpsSetup(page);await go(page);await search(page);await page.locator('[data-select]').first().click();await confirmStationPreview(page);await expect(page.locator('#selectedStop')).toBeVisible();
 await page.locator('#routeCarbonEnabled').evaluate(e=>{for(let p=e.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true});await page.locator('#routeCarbonEnabled').check();await expect(page.locator('#routeCarbonEnabled')).toBeChecked();
 await page.locator('#rangeOptions').evaluate(e=>e.open=true);await page.locator('#rangeMode').selectOption('km');await page.locator('#rangeValue').fill('200');await page.locator('#meetingPickup').evaluate(e=>e.value='Rencontre aller');await page.locator('#meetingDropoff').evaluate(e=>e.value='Dépose aller');
 const n=calls.length,before=await stored(page);await swap(page);await expect(page.locator('#selectedStop')).toBeHidden();await expect(page.locator('.result-card')).toHaveCount(0);await expect(page.locator('#stops')).toBeHidden();await expect(page.locator('#rangeMode')).toHaveValue('none');await expect(page.locator('#rangeValue')).toHaveValue('');await expect(page.locator('#meetingPickup')).toHaveValue('');await expect(page.locator('#meetingDropoff')).toHaveValue('');await expect(page.locator('#routeCarbonEnabled')).not.toBeChecked();expect(calls.length).toBe(n);expect(await stored(page)).toBe(before);
});
test('retour : marche et exclusions conservent leur calculateur et leurs critères',async({page})=>{
 const calls=await setup(page);await page.locator('#avoidHighways').check();await go(page);await swap(page);await expect(page.locator('#avoidHighways')).toBeChecked();await advance(page);await go(page);
 let p=new URL(calls.filter(u=>u.includes('/navigation/')).at(-1)).searchParams;expect(p.get('start')).toBe('4.8924,44.9334');expect(p.get('constraints')).toContain('autoroute');expect(routes(calls)).toHaveLength(0);
 await page.locator('#travelMode').selectOption('walk');await page.locator('#maxWalkKm').fill('120');await page.locator('#walkRule').selectOption('strict');await swap(page);await expect(page.locator('#maxWalkKm')).toHaveValue('120');await advance(page);await go(page);p=new URL(calls.filter(u=>u.includes('/navigation/')).at(-1)).searchParams;expect(p.get('profile')).toBe('pedestrian');expect(p.get('start')).toBe('4.8357,45.764');expect(routes(calls)).toHaveLength(0);
});
test('retour : contexte collectif et comparaison retirés sans appel de remplacement',async({page})=>{
 const calls=await setup(page);await page.clock.setFixedTime(new Date('2026-11-18T12:00:00Z'));await page.route(geocodingPattern,r=>r.fulfill({json:placesResponse(new URL(r.request().url()).searchParams.get('q').includes('Innsbruck')?addressFeature(5.731,45.1572,'Avenue Innsbruck, Grenoble'):addressFeature(5.7152,45.1913,'Gare de Grenoble'))}));await page.route(transitPlanPattern,r=>r.fulfill({json:transferPlan()}));
 await page.locator('#start').fill('Gare Grenoble');await page.locator('#end').fill('Avenue Innsbruck Grenoble');await page.locator('#transitBtn').click();await page.locator('#transitWhen').fill('2026-11-19T10:00');await page.locator('#transitSearch').click();await expect(page.locator('[data-transit-option]').first()).toBeVisible();await expect(page.locator('#transitSearch')).toBeEnabled();await page.locator('#transitClose').click();
 const n=calls.length;await swap(page);await expect(page.locator('#transitResults')).toBeEmpty();await expect(page.locator('#transitMapWrap')).toBeHidden();expect(calls.length).toBe(n);
 await page.locator('#transitBtn').click();await expect(page.locator('#transitPlaces')).toContainText('Avenue Innsbruck');await expect(page.locator('#transitResults')).toBeEmpty();expect(calls.length).toBe(n);
});
