import {test,expect} from '@playwright/test';import fs from 'node:fs';
import {mockDragonRoute,geocodingPattern,addressFeature,placesResponse} from '../helpers/dragonroute.mjs';
import {checkAccessibility,checkOverflow} from '../helpers/inspection.mjs';
import {transferPlan,transitPlanPattern} from '../helpers/transit-transfers.mjs';
const a=[5.7152,45.1913],b=[5.731,45.1572],ign='https://data.geopf.fr/navigation/itineraire?**',bike='https://routing.openstreetmap.de/routed-bike/route/v1/driving/**';
function road(url){const p=new URL(url).searchParams,start=p.get('start'),end=p.get('end');return {resource:'bdtopo-osrm',resourceVersion:'2026-11-18',profile:p.get('profile'),optimization:p.get('optimization'),crs:'EPSG:4326',distanceUnit:'meter',timeUnit:'second',distance:1000,duration:2400,constraints:[],geometry:{type:'LineString',coordinates:[start.split(',').map(Number),end.split(',').map(Number)]},portions:[{start,end,distance:1000,duration:2400}]}}
function completePlan(){// Simulated stop-to-stop alternatives, with no walking step, for the complete-group branch.
 const d=transferPlan();for(const r of d.plan.itineraries){const first=r.legs[0],last=r.legs.at(-1);r.legs=r.legs.filter(l=>l.mode!=='WALK');Object.assign(r.legs[0],{from:{...first.from,stopId:'SEM:SIMULATED-START'},startTime:r.startTime});Object.assign(r.legs.at(-1),{to:{...last.to,stopId:'SEM:SIMULATED-END'},endTime:r.endTime});for(const l of r.legs){l.duration=(l.endTime-l.startTime)/1000;l.legGeometry=null}}
 return d;
}
async function setup(page,{complete=false,fuel='Gazole',mutate=()=>{}}={}){
 await mockDragonRoute(page);await page.clock.setFixedTime(new Date('2026-11-18T12:00:00Z'));const calls=[];
 page.on('request',r=>{if(/geocodage|\/plan\?|\/route\/v1|navigation\/itineraire/.test(r.url()))calls.push(r.url())});
 await page.route(geocodingPattern,r=>r.fulfill({json:placesResponse(new URL(r.request().url()).searchParams.get('q').includes('Innsbruck')?addressFeature(...b,'Avenue Innsbruck, Grenoble'):addressFeature(...a,'Gare de Grenoble'))}));
 await page.route(ign,r=>r.fulfill({json:road(r.request().url())}));
 await page.route('https://router.project-osrm.org/route/v1/driving/**',r=>r.fulfill({json:{code:'Ok',routes:[{distance:6000,duration:900,geometry:{type:'LineString',coordinates:[a,b]}}]}}));
 await page.route(bike,r=>r.fulfill({json:JSON.parse(fs.readFileSync('tests/fixtures/cycling-comparison/grenoble-cycle.json'))}));
 await page.route(transitPlanPattern,r=>{const d=complete?completePlan():transferPlan();mutate(d,r.request().url());return r.fulfill({json:d})});
 await page.addInitScript(fuel=>localStorage.setItem('dragonroute.profile.v2.public',JSON.stringify({version:2,vehicle:{name:'Véhicule de test',type:'car',fuel,cons:6.2,liters:40},addresses:[],stations:[]})),fuel);
 await page.goto('/DragonRoute/');await page.locator('#start').fill('Gare Grenoble');await page.locator('#end').fill('Avenue Innsbruck Grenoble');return calls;
}
async function start(page,{cycle=true}={}){await page.locator('#transitBtn').click();await page.locator('#transitWhen').fill('2026-11-19T10:00');await page.locator('#transitCompare').check();if(cycle)await page.locator('#transitCycle').check();await page.locator('#transitSearch').click()}
async function ready(page,options){await start(page,options);await expect(page.locator('[data-modal-carbon-open]')).toBeEnabled();await expect(page.locator('#transitSearch')).toBeEnabled()}
async function open(page){await page.locator('[data-modal-carbon-open]').click();await expect(page.locator('#modalCarbonTitle')).toBeFocused()}
const row=(page,key)=>page.locator('[data-modal-row="'+key+'"]');
async function car(page,occupants='4'){await page.locator('#modalCarbonCar').selectOption('voiture-compact-diesel');await page.locator('#modalCarbonOccupants').fill(occupants)}
async function transit(page,index=null){const loc=index===null?page.locator('[data-modal-option]'):page.locator('[data-modal-option="'+index+'"]');for(const s of await loc.all()){await s.evaluate(e=>{for(let p=e.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true});await s.selectOption('tramway')}}
async function audit(page,info,name){
 await page.locator('#modalCarbonSort').scrollIntoViewIfNeeded();await checkOverflow(page);
 expect(await page.locator('#transitDialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 const region=page.locator('.modal-carbon-table').first();await region.scrollIntoViewIfNeeded();
 if(await region.evaluate(e=>e.scrollWidth>e.clientWidth+1)){await region.focus();for(let i=0;i<8;i++)await page.keyboard.press('ArrowRight');await expect.poll(()=>region.evaluate(e=>e.scrollLeft)).toBeGreaterThan(0)}
 const path=info.outputPath(name+'.png');await page.screenshot({path,animations:'disabled'});await info.attach(name,{path,contentType:'image/png'});await checkAccessibility(page,info,name);
}

test('empreinte modes : choix volontaires, calculs distincts, aucun appel ni stockage',async({page},info)=>{
 const calls=await setup(page);await ready(page);await expect(page.locator('#modalCarbon')).toBeHidden();const before=[...calls],storage=await page.evaluate(()=>({...localStorage})),map=await page.locator('#transitMapTitle').textContent();await open(page);
 await expect(page.locator('#modalCarbonCar')).toHaveValue('');await expect(page.locator('#modalCarbonOccupants')).toHaveValue('');await expect(row(page,'car')).toHaveAttribute('data-modal-state','unavailable');await expect(row(page,'walk')).toContainText('Non estimée');await expect(row(page,'cycle')).toContainText('Non estimée');
 await car(page);await expect(row(page,'car')).toContainText('0,213 kg CO₂e');await expect(row(page,'car')).toContainText('Véhicule entier : 0,854 kg CO₂e');await transit(page);await expect(row(page,'transit-0')).toHaveAttribute('data-modal-state','partial');await expect(row(page,'transit-0')).toContainText('empreinte totale indisponible');
 await page.locator('[data-modal-cycle]').check();await expect(row(page,'cycle')).toContainText('Construction seule');await expect(row(page,'cycle')).toHaveAttribute('data-modal-comparable','false');await expect(page.locator('#modalCarbonSort option[value=carbon]')).toBeDisabled();
 await row(page,'car').locator('summary').click();await expect(row(page,'car')).toContainText('kg CO₂e/véhicule-km ÷ 4');await row(page,'transit-0').locator('summary').click();await expect(row(page,'transit-0')).toContainText('kg CO₂e/personne-km');await expect(page.locator('#modalCarbonContext')).toContainText('une personne');await expect(page.locator('#modalCarbonSource')).toContainText('impactco2-2026-11-18-bece7af');
 expect(calls).toEqual(before);expect(await page.evaluate(()=>({...localStorage}))).toEqual(storage);expect(await page.locator('#transitMapTitle').textContent()).toBe(map);await audit(page,info,'empreinte-modes-partielle');
});
test('empreinte modes : groupe complet séparé, contraintes avant tri et réadmission locale',async({page},info)=>{
 const calls=await setup(page,{complete:true});await ready(page);await open(page);await car(page);await transit(page);await expect(row(page,'transit-0')).toHaveAttribute('data-modal-state','complete');await page.locator('[data-modal-cycle]').check();const before=[...calls];
 await page.locator('#modalCarbonSort').selectOption('carbon');await expect(page.locator('#modalCarbonTables table').first().locator('[data-modal-row]')).toHaveCount(3);await expect(page.locator('#modalCarbonTables table').last()).toContainText('Vélo classique');await expect(row(page,'walk')).toHaveAttribute('data-modal-comparable','false');
 await page.locator('#transitMaxTransfers').fill('0');await page.locator('#transitTransferRule').selectOption('strict');await expect(row(page,'transit-0')).toHaveAttribute('data-modal-admissible','excluded');await expect(page.locator('#modalCarbonTables table').first().locator('[data-modal-row]')).toHaveCount(2);await expect(row(page,'transit-0')).toContainText('Référence non admissible');
 await page.locator('#modalCarbonCar').selectOption('');await expect(page.locator('#modalCarbonSort')).toHaveValue('mode');await expect(page.locator('#modalCarbonSort option[value=carbon]')).toBeDisabled();await page.locator('#transitTransferRule').selectOption('soft');await expect(page.locator('#modalCarbonSort option[value=carbon]')).toBeEnabled();await page.locator('#modalCarbonSort').selectOption('carbon');await expect(page.locator('#modalCarbonTables table').first().locator('[data-modal-row]')).toHaveCount(2);expect(calls).toEqual(before);await audit(page,info,'empreinte-groupe-comparable');
});
test('empreinte modes : modèles et occupants invalides ne produisent pas un total nul',async({page})=>{
 await setup(page);await ready(page);await open(page);await car(page,'');await expect(row(page,'car')).toContainText('1 à 9 occupants');await page.locator('#modalCarbonOccupants').fill('0');await expect(row(page,'car')).toHaveAttribute('data-modal-state','unavailable');await car(page,'2');await expect(row(page,'car')).toContainText('0,427 kg CO₂e');
 await page.locator('#modalCarbonCar').evaluate(e=>{e.add(new Option('Incompatible','tramway'));e.value='tramway';e.dispatchEvent(new Event('change',{bubbles:true}))});await expect(row(page,'car')).toHaveAttribute('data-modal-state','unavailable');await expect(row(page,'car')).not.toContainText('Estimation : 0');
 await page.locator('[data-modal-option]').first().evaluate(e=>{e.add(new Option('Incompatible','tgv'));e.value='tgv';e.dispatchEvent(new Event('change',{bubbles:true}))});await expect(row(page,'transit-0')).toHaveAttribute('data-modal-state','unavailable');
});
test('empreinte modes : carburant sans modèle, panne routière et collectif partiel restent distincts',async({page})=>{
 await setup(page,{fuel:'E85'});await page.route(ign,r=>r.fulfill({status:503,body:'unavailable'}));await ready(page);await open(page);await expect(page.locator('#modalCarbonModels')).toContainText('Aucun modèle compatible');await expect(page.locator('#modalCarbonCar')).toBeDisabled();await expect(row(page,'car')).toHaveAttribute('data-modal-state','unavailable');await expect(row(page,'walk')).toHaveAttribute('data-modal-admissible','unavailable');await transit(page);await expect(row(page,'transit-1')).toHaveAttribute('data-modal-state','partial');await expect(page.locator('#modalCarbonSort option[value=carbon]')).toBeDisabled();
});
test('empreinte modes : retrait et réouverture effacent les hypothèses avec retour du focus',async({page})=>{
 const calls=await setup(page);await ready(page);await open(page);await car(page);await transit(page);const n=calls.length;await page.locator('#modalCarbonClose').click();await expect(page.locator('[data-modal-carbon-open]')).toBeFocused();await expect(page.locator('#modalCarbonTables')).toBeEmpty();await open(page);await expect(page.locator('#modalCarbonCar')).toHaveValue('');await expect(page.locator('#modalCarbonOccupants')).toHaveValue('');await expect(page.locator('[data-modal-option]').first()).toHaveValue('');await expect(page.locator('[data-modal-cycle]')).not.toBeChecked();expect(calls).toHaveLength(n);await page.keyboard.press('Escape');await expect(page.locator('#modalCarbon')).toBeHidden();await expect(page.locator('#transitBtn')).toBeFocused();
});
test('empreinte modes : critères modifiés et contexte silencieux ne conservent pas les estimations',async({page})=>{
 const calls=await setup(page);await ready(page);await open(page);await car(page);const n=calls.length;await page.locator('#transitWhen').evaluate(e=>e.value='2026-11-20T10:00');await page.locator('#modalCarbonSort').selectOption('time');await expect(page.locator('#modalCarbon')).toBeHidden();await expect(page.locator('#transitCompareResults')).toBeEmpty();await expect(page.locator('#transitStatus')).toContainText('Contexte modifié');expect(calls).toHaveLength(n);
});
test('empreinte modes : carburant changé silencieusement retire les choix et ne réemploie pas un modèle',async({page})=>{
 await setup(page);await ready(page);await open(page);await car(page);await page.locator('#fuel').evaluate(e=>e.value='E10');await page.locator('#modalCarbonSort').selectOption('distance');await expect(page.locator('#modalCarbon')).toBeHidden();await open(page);await expect(page.locator('#modalCarbonCar option[value=voiture-compact-diesel]')).toHaveCount(0);await expect(page.locator('#modalCarbonCar')).toHaveValue('');
});
test('empreinte modes : modèles individuels, carte et comparaison gardent leurs choix indépendants',async({page})=>{
 const calls=await setup(page);await ready(page);await open(page);await car(page);await transit(page,0);const expected=await row(page,'transit-0').textContent(),before=[...calls];await page.locator('[data-transit-map="1"]').click();await expect(row(page,'transit-0')).toHaveText(expected);await page.locator('[data-transit-carbon="1"]').click();await page.locator('[data-transit-factor]').first().selectOption('tramway');await expect(row(page,'transit-1')).toHaveAttribute('data-modal-state','unavailable');await expect(row(page,'transit-0')).toHaveText(expected);expect(calls).toEqual(before);
});
test('empreinte modes : sauvegarde sans hypothèses, estimation ne déclare aucun trajet effectué',async({page})=>{
 await setup(page);await ready(page);await open(page);await car(page);await transit(page);await page.locator('[data-transit-save="1"]').click();await expect(page.locator('#modalCarbon')).toBeHidden();await page.locator('#savedTransitConfirm').check();await page.locator('#savedTransitSave').click();const store=await page.evaluate(()=>({...localStorage})),text=store['dragonroute.transit-prepared.v3.public'];expect(text).toBeTruthy();expect(text).not.toContain('impactco2');expect(text).not.toContain('voiture-compact');expect(text).not.toContain('tramway');expect(Object.keys(store).filter(k=>k.includes('journal'))).toEqual([]);
});
test('empreinte modes : limites vélo réévaluées sans nouvel appel, valeurs hors critères identifiées',async({page})=>{
 const calls=await setup(page);await ready(page);await open(page);await page.locator('[data-modal-cycle]').check();const n=calls.length;await page.locator('#transitCycleLimit').fill('1');await page.locator('#transitCycleRule').selectOption('strict');await expect(row(page,'cycle')).toHaveAttribute('data-modal-admissible','excluded');await expect(row(page,'cycle')).toContainText('Construction seule');await page.locator('#transitCycleRule').selectOption('soft');await expect(row(page,'cycle')).toHaveAttribute('data-modal-admissible','ready');expect(calls).toHaveLength(n);
});
test('empreinte modes : texte externe inerte, tri altéré refusé, clavier et paysage agrandi',async({page},info)=>{
 const calls=await setup(page,{mutate:d=>{for(const r of d.plan.itineraries)for(const l of r.legs)if(l.mode==='TRAM')l.routeShortName='<img src=x onerror=alert(1)>'}});await ready(page);await page.locator('[data-modal-carbon-open]').focus();await page.keyboard.press('Enter');await expect(page.locator('#modalCarbonTitle')).toBeFocused();await transit(page);await expect(page.locator('#modalCarbonModels')).toContainText('<img');await expect(page.locator('#modalCarbon img,#modalCarbon script')).toHaveCount(0);const n=calls.length,errors=[];page.on('pageerror',e=>errors.push(e.message));await page.locator('#modalCarbonSort').evaluate(e=>{e.add(new Option('Score','score'));e.value='score';e.dispatchEvent(new Event('change'))});await expect(page.locator('#modalCarbonTables')).toBeEmpty();await expect(page.locator('#modalCarbonStatus')).toContainText('Choisir un tri proposé');await page.locator('#modalCarbonSort').selectOption('time');await page.setViewportSize({width:844,height:390});await page.evaluate(()=>document.documentElement.style.fontSize='200%');await audit(page,info,'empreinte-paysage-200');await page.locator('#modalCarbonClose').focus();await page.keyboard.press('Enter');await expect(page.locator('[data-modal-carbon-open]')).toBeFocused();expect(calls).toHaveLength(n);expect(errors).toEqual([]);
});
test('empreinte modes : recherche annulée avant comparaison et réponse tardive restent sans panneau',async({page})=>{
 await page.addInitScript(()=>{const f=fetch;window.fetch=(u,o)=>f(u,String(u).includes('/navigation/itineraire')?{...o,signal:undefined}:o)});await setup(page);let pending;await page.route(ign,r=>{pending=r});await start(page);await expect.poll(()=>Boolean(pending)).toBe(true);await expect(page.locator('[data-modal-carbon-open]')).toHaveCount(0);await page.locator('#transitCancel').click();await pending.fulfill({json:road(pending.request().url())});await expect(page.locator('#transitSearch')).toBeEnabled();await expect(page.locator('#modalCarbon')).toBeHidden();await expect(page.locator('[data-modal-carbon-open]')).toHaveCount(0);
});
test('empreinte modes : carburant propre au comparateur, modèle retiré et profil préservé',async({page})=>{
 const calls=await setup(page);await ready(page);await open(page);await car(page);const before=[...calls],store=await page.evaluate(()=>({...localStorage}));await page.locator('#modalCarbonFuel').selectOption('E10');await expect(page.locator('#modalCarbonCar')).toHaveValue('');await expect(row(page,'car')).toHaveAttribute('data-modal-state','unavailable');await page.locator('#modalCarbonCar').selectOption('voiture-compact-essence');await expect(row(page,'car')).toHaveAttribute('data-modal-state','complete');await expect(page.locator('#fuel')).toHaveValue('Gazole');await page.locator('#modalCarbonFuel').selectOption('E85');await expect(page.locator('#modalCarbonCar')).toBeDisabled();await expect(row(page,'car')).toHaveAttribute('data-modal-state','unavailable');await page.locator('#modalCarbonFuel').selectOption('Gazole');await expect(page.locator('#modalCarbonCar')).toBeEnabled();await expect(page.locator('#modalCarbonCar')).toHaveValue('');expect(await page.evaluate(()=>({...localStorage}))).toEqual(store);expect(calls).toEqual(before);
});

test('groupe modes : parts individuelles et communes sans mutation ni appel supplémentaire',async({page},info)=>{
 const calls=await setup(page);await ready(page);await open(page);await car(page);await transit(page);await page.locator('[data-modal-cycle]').check();
 const before=[...calls],storage=await page.evaluate(()=>({...localStorage})),map=await page.locator('#transitMapTitle').textContent();
 await expect(page.locator('#modalCarbonPeople')).toHaveValue('1');await page.locator('#modalCarbonPeople').fill('2');
 await expect(row(page,'car')).toContainText('Estimation : 0,213 kg CO₂e');await expect(row(page,'car')).toContainText('Part du groupe (2 personnes) : 0,427 kg CO₂e');await expect(row(page,'car')).toContainText('Véhicule entier : 0,854 kg CO₂e');
 await expect(row(page,'transit-0')).toHaveAttribute('data-modal-state','partial');await expect(row(page,'transit-0')).toContainText('Sous-total du groupe (2 personnes)');await expect(row(page,'cycle')).toContainText('Part du groupe (2 personnes)');await expect(row(page,'cycle')).toHaveAttribute('data-modal-comparable','false');
 await expect(page.locator('#modalCarbonContext')).toContainText('groupe de 2 personnes');await expect(page.locator('#modalCarbonModels')).toContainText('un vélo mécanique par personne');
 expect(calls).toEqual(before);expect(await page.evaluate(()=>({...localStorage}))).toEqual(storage);expect(await page.locator('#transitMapTitle').textContent()).toBe(map);
 await row(page,'car').locator('summary').click();await expect(row(page,'car')).toContainText('÷ 4 occupant(s)');await expect(row(page,'car')).toContainText('Groupe de 2');await audit(page,info,'groupe-valeurs');
});
test('groupe modes : voyageurs supérieurs aux occupants puis correction explicite',async({page})=>{
 const calls=await setup(page);await ready(page);await open(page);await car(page,'2');await transit(page);const before=[...calls];
 await page.locator('#modalCarbonPeople').fill('3');await expect(row(page,'car')).toHaveAttribute('data-modal-state','unavailable');await expect(row(page,'car')).toContainText('nombre total d’occupants');await expect(row(page,'car')).not.toContainText('Part du groupe');await expect(row(page,'transit-0')).toContainText('Sous-total du groupe (3 personnes)');
 await page.locator('#modalCarbonOccupants').fill('4');await expect(row(page,'car')).toContainText('Part du groupe (3 personnes) : 0,640 kg CO₂e');await expect(row(page,'car')).toContainText('Véhicule entier : 0,854 kg CO₂e');expect(calls).toEqual(before);
});
test('groupe modes : saisies invalides sans ancien total ni classement, borne neuf vérifiée',async({page},info)=>{
 const calls=await setup(page,{complete:true});await ready(page);await open(page);await car(page,'9');await transit(page);const before=[...calls];
 await page.locator('#modalCarbonSort').selectOption('carbon');
 for(const value of ['', '0', '10', '1.5', '-1']){
  await page.locator('#modalCarbonPeople').fill(value);await expect(page.locator('#modalCarbonPeople')).toHaveAttribute('aria-invalid','true');await expect(page.locator('#modalCarbonPeopleError')).toContainText('1 à 9 voyageurs');await expect(page.locator('#modalCarbonSort')).toHaveValue('mode');
  for(const sort of ['carbon','time','distance'])await expect(page.locator('#modalCarbonSort option[value='+sort+']')).toBeDisabled();
  await expect(page.locator('[data-modal-state=complete],[data-modal-state=partial]')).toHaveCount(0);await expect(page.locator('#modalCarbonTables')).not.toContainText('Part du groupe');
 }
 await checkAccessibility(page,info,'groupe-invalide');await page.locator('#modalCarbonPeople').fill('9');await expect(page.locator('#modalCarbonPeople')).toHaveAttribute('aria-invalid','false');await expect(page.locator('#modalCarbonPeopleError')).toBeEmpty();await expect(row(page,'car')).toContainText('Part du groupe (9 personnes) : 0,854 kg CO₂e');await expect(row(page,'car')).toContainText('Estimation : 0,095 kg CO₂e');await expect(page.locator('#modalCarbonSort option[value=carbon]')).toBeEnabled();expect(calls).toEqual(before);
});
test('groupe modes : périmètre comparable et contraintes préservés après changement des voyageurs',async({page})=>{
 const calls=await setup(page,{complete:true});await ready(page);await open(page);await car(page);await transit(page);await page.locator('[data-modal-cycle]').check();await page.locator('#modalCarbonPeople').fill('3');const n=calls.length;
 await page.locator('#modalCarbonSort').selectOption('carbon');await expect(page.locator('#modalCarbonTables table').first().locator('[data-modal-row]')).toHaveCount(3);await expect(page.locator('#modalCarbonStatus')).toContainText('même groupe de 3 personnes');
 await page.locator('#transitMaxTransfers').fill('0');await page.locator('#transitTransferRule').selectOption('strict');await expect(row(page,'transit-0')).toHaveAttribute('data-modal-admissible','excluded');await page.locator('#modalCarbonOccupants').fill('2');await expect(page.locator('#modalCarbonSort')).toHaveValue('mode');await expect(page.locator('#modalCarbonSort option[value=carbon]')).toBeDisabled();
 await page.locator('#modalCarbonPeople').fill('2');await expect(page.locator('#modalCarbonSort option[value=carbon]')).toBeEnabled();await expect(row(page,'car')).toContainText('Part du groupe (2 personnes) : 0,854 kg CO₂e');await expect(row(page,'transit-0')).toHaveAttribute('data-modal-comparable','false');expect(calls).toHaveLength(n);
});
test('groupe modes : changement silencieux contrôlé à l’action suivante',async({page})=>{
 const calls=await setup(page,{complete:true});await ready(page);await open(page);await car(page);await transit(page);const n=calls.length;
 await page.locator('#modalCarbonPeople').evaluate(e=>e.value='5');await page.locator('#modalCarbonSort').selectOption('distance');await expect(page.locator('#modalCarbonContext')).toContainText('groupe de 5 personnes');await expect(row(page,'car')).toHaveAttribute('data-modal-state','unavailable');
 await page.locator('#modalCarbonPeople').evaluate(e=>e.value='0');await page.locator('#modalCarbonSort').selectOption('time');await expect(page.locator('#modalCarbonSort')).toHaveValue('mode');await expect(page.locator('#modalCarbonPeople')).toHaveAttribute('aria-invalid','true');await expect(page.locator('#modalCarbonTables')).not.toContainText('Part du groupe');expect(calls).toHaveLength(n);
});
test('groupe modes : hypothèses indépendantes, fermeture et nouvelle recherche reviennent à une personne',async({page})=>{
 const calls=await setup(page,{mutate:(d,url)=>{
  // Keep this simulated timetable consistent with the explicit second search.
  if(new URL(url).searchParams.get('date')!=='2026-11-20')return;
  d.plan.date+=864e5;for(const route of d.plan.itineraries){route.startTime+=864e5;route.endTime+=864e5;for(const leg of route.legs){leg.startTime+=864e5;leg.endTime+=864e5;leg.serviceDate='20261120'}}
 }});await ready(page);await open(page);await car(page);await transit(page);await page.locator('#modalCarbonPeople').fill('3');const before=[...calls];
 await page.locator('[data-transit-carbon="1"]').click();await expect(page.locator('#transitCarbon')).toContainText('pour une personne');await expect(page.locator('#modalCarbonPeople')).toHaveValue('3');await page.locator('[data-transit-map="1"]').click();await expect(page.locator('#modalCarbonPeople')).toHaveValue('3');expect(calls).toEqual(before);
 await page.locator('#modalCarbonClose').click();await expect(page.locator('[data-modal-carbon-open]')).toBeFocused();await open(page);await expect(page.locator('#modalCarbonPeople')).toHaveValue('1');await expect(page.locator('#modalCarbonCar')).toHaveValue('');
 await page.locator('#modalCarbonPeople').fill('2');await page.locator('#transitWhen').fill('2026-11-20T10:00');await expect(page.locator('#modalCarbon')).toBeHidden();await page.clock.setFixedTime(new Date('2026-11-18T12:00:05Z'));await page.locator('#transitSearch').click();await expect(page.locator('[data-modal-carbon-open]')).toBeEnabled();await open(page);await expect(page.locator('#modalCarbonPeople')).toHaveValue('1');
});
test('groupe modes : sauvegarde et carburant ne transfèrent pas les voyageurs à d’autres parcours',async({page})=>{
 const calls=await setup(page);await ready(page);await open(page);await car(page);await transit(page);await page.locator('#modalCarbonPeople').fill('3');const n=calls.length;
 await page.locator('#modalCarbonFuel').selectOption('E10');await expect(page.locator('#modalCarbonPeople')).toHaveValue('3');await expect(page.locator('#modalCarbonCar')).toHaveValue('');await expect(page.locator('#fuel')).toHaveValue('Gazole');
 await page.locator('[data-transit-save="1"]').click();await expect(page.locator('#modalCarbon')).toBeHidden();await page.locator('#savedTransitConfirm').check();await page.locator('#savedTransitSave').click();
 const store=await page.evaluate(()=>({...localStorage})),text=store['dragonroute.transit-prepared.v3.public'];expect(text).toBeTruthy();expect(text).not.toContain('"persons"');expect(text).not.toContain('impactco2');expect(Object.keys(store).filter(k=>k.includes('journal'))).toEqual([]);expect(calls).toHaveLength(n);
});
test('groupe modes : clavier, modèle par étape et consultation du groupe en paysage agrandi',async({page},info)=>{
 const calls=await setup(page,{complete:true});await ready(page);await open(page);await car(page);await transit(page);await page.locator('#modalCarbonPeople').focus();await page.keyboard.press('ArrowUp');await expect(page.locator('#modalCarbonPeople')).toHaveValue('2');const n=calls.length;
 await page.locator('#modalCarbonSort').selectOption('carbon');await row(page,'transit-1').locator('summary').click();await expect(row(page,'transit-1')).toContainText('kg CO₂e/personne-km');await expect(row(page,'transit-1')).toContainText('Groupe de 2');await expect(row(page,'transit-1')).not.toContainText('÷ 2');
 await page.setViewportSize({width:844,height:390});await page.evaluate(()=>document.documentElement.style.fontSize='200%');await audit(page,info,'groupe-paysage-200');await page.locator('#modalCarbonClose').focus();await page.keyboard.press('Enter');await expect(page.locator('[data-modal-carbon-open]')).toBeFocused();expect(calls).toHaveLength(n);
});
