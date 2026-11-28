import {preparationControl} from '../helpers/preparation-controls.mjs';
import {setStationPause} from '../helpers/dragonroute.mjs';
import {test,expect} from '@playwright/test';
import {createRequire} from 'node:module';
import {mockDragonRoute,confirmStationPreview} from '../helpers/dragonroute.mjs';
import {capture,checkAccessibility,checkOverflow} from '../helpers/inspection.mjs';
const require=createRequire(import.meta.url),osrm='https://router.project-osrm.org/route/v1/driving/**';
const points=[[4.8357,45.764],[4.87,45.4],[4.8924,44.9334]];
const via=(overrides={})=>({distance:106000,duration:4200,geometry:{type:'LineString',coordinates:points},...overrides});
async function setup(page,leaflet=false){
 await mockDragonRoute(page);const requests=[];page.on('request',r=>{if(/\/route\/|\/table\/|data.economie/.test(r.url()))requests.push(r.url())});
 if(leaflet)for(const [file,contentType] of [['leaflet.js','application/javascript'],['leaflet.css','text/css']])await page.route('https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/'+file,r=>r.fulfill({path:require.resolve('leaflet/dist/'+file),contentType}));
 await page.goto('/DragonRoute/');await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('Trajet prêt');await page.locator('#stationsBtn').click();await expect(page.locator('#fuelStatus')).toContainText('stations comparées');await page.locator('#stationListMode').selectOption('all');return requests;
}
async function open(page,id='A'){await page.locator(`[data-select=${id}]`).click();await expect(page.locator('#stationPreviewBody')).toBeVisible()}
const stored=page=>page.evaluate(()=>JSON.stringify({...localStorage}));
async function mapMarkup(page){
 await expect.poll(()=>page.locator('#map [data-station-point]').evaluateAll(points=>points.every(p=>Number(p.dataset.nearbyCount)>0))).toBe(true);
 return page.locator('#map').innerHTML();
}
test('aperçu station : tracés, écarts et étapes avant confirmation, clavier et annulation',async({page},info)=>{
 const calls=await setup(page),before=await stored(page),map=await mapMarkup(page);await open(page);
 await expect(page.locator('#tripKm')).toHaveText('104,0 km');await expect(page.locator('#selectedStop')).toBeHidden();await expect(page.locator('#stationPreviewDifference')).toContainText('+2,0 km');await expect(page.locator('#stationPreviewMetrics')).toContainText('pause inconnue');await expect(page.locator('#stationPreviewCosts')).toContainText('budget total incomplet');
 await expect(page.locator('#stationPreviewSvg polyline')).toHaveCount(3);await page.locator('#stationPreviewReference').uncheck();await expect(page.locator('#stationPreviewSvg polyline')).toHaveCount(2);await page.locator('#stationPreviewReference').press('Space');await expect(page.locator('#stationPreviewSvg polyline')).toHaveCount(3);
 await page.locator('#stationPreviewBody summary').click();await expect(page.locator('#stationPreviewSteps li')).toHaveText(['Lyon, France','Station : 1 route test, 26000, Valence','Valence, France']);const n=calls.length;
 await page.locator('#stationPreviewDialog').evaluate(e=>e.scrollTop=0);await capture(page,info,'apercu-station');await checkOverflow(page);await checkAccessibility(page,info,'apercu-station');await page.keyboard.press('Escape');await expect(page.locator('#stationPreviewDialog')).toBeHidden();await expect(page.locator('#tripKm')).toHaveText('104,0 km');expect(await stored(page)).toBe(before);expect(calls.length).toBe(n);await expect.poll(()=>mapMarkup(page)).toBe(map);
});
test('aperçu station : adoption explicite synchronise budget, carte, navigation et retrait',async({page})=>{
 const calls=await setup(page),before=await stored(page);await page.locator('#budgetPrice').fill('2');await open(page);const n=calls.length;await confirmStationPreview(page);expect(calls.length).toBe(n);await expect(page.locator('#tripKm')).toHaveText('106,0 km');await expect(page.locator('#budgetFuel')).toHaveText('6,57 L · 13,14 €');await expect(page.locator('[data-select=A]')).toHaveAttribute('aria-pressed','true');expect(await stored(page)).toBe(before);
 await page.locator('#navigationBtn').click();const wait=page.waitForEvent('download');await page.locator('#exportGpxBtn').click();const stream=await(await wait).createReadStream();let gpx='';for await(const c of stream)gpx+=c;expect(gpx).toContain('1 route test');await page.getByRole('button',{name:'Fermer la navigation'}).click();await page.locator('#removeStopBtn').click();await expect(page.locator('#tripKm')).toHaveText('104,0 km');
});
test('aperçu station : refus du remplacement conserve prix, arrêt, carte et sauvegardes',async({page})=>{
 await setup(page);await open(page);await confirmStationPreview(page);await page.locator('#useStationPrice').click();const before=await stored(page),summary=await page.locator('#summary').innerText(),price=await page.locator('#budgetPrice').inputValue(),stop=await page.locator('#selectedStop').innerText(),map=await mapMarkup(page);await open(page,'B');await expect(page.locator('#stationPreviewDifference')).toContainText('station actuelle sera remplacée');await expect(page.locator('#stationPreviewCosts')).toContainText('Prix du budget non repris');await page.locator('#stationPreviewCancel').click();expect(await page.locator('#summary').innerText()).toBe(summary);expect(await page.locator('#selectedStop').innerText()).toBe(stop);expect(await page.locator('#budgetPrice').inputValue()).toBe(price);await expect.poll(()=>mapMarkup(page)).toBe(map);expect(await stored(page)).toBe(before);
 await open(page,'B');await confirmStationPreview(page);await expect(page.locator('#selectedStop')).toContainText('2 route test');await expect(page.locator('#budgetPrice')).toHaveValue('');
});
test('aperçu station : pause zéro et pause déclarée, conduite et arrivée distinctes',async({page})=>{
 await setup(page);await (await preparationControl(page,'stationDeparture')).fill('2026-09-17T10:00');await page.locator('#budgetPrice').fill('2');await page.route(osrm,r=>r.fulfill({json:{code:'Ok',routes:[via()]}}));
 for(const pause of ['0','15']){await setStationPause(page,pause);await open(page);const p=page.locator('#stationPreviewMetrics section').last();await expect(p).toContainText('70,0 min de conduite');await expect(p).toContainText('pause prévue : '+pause+',0 min');await expect(p).toContainText(pause==='0'?'11:10':'11:25');await expect(p).toContainText('13,14 €');await page.locator('#stationPreviewCancel').click()}
});
test('aperçu station : prix expiré après affichage exige une reconnaissance explicite',async({page})=>{
 await setup(page);await open(page);await expect(page.locator('#stationPreviewOldPrice')).toBeHidden();await page.clock.setFixedTime(new Date('2026-10-01T10:00:00Z'));await page.locator('#stationPreviewConfirm').click();await expect(page.locator('#selectedStop')).toBeHidden();await expect(page.locator('#stationPreviewOldPrice')).toBeVisible();await expect(page.locator('#stationPreviewConfirm')).toBeDisabled();await confirmStationPreview(page,{oldPrice:true});await expect(page.locator('#useStationPrice')).toBeDisabled();
});
test('aperçu station : accès recalculé hors portée exige confirmation même si la comparaison était accessible',async({page})=>{
 await setup(page);await page.locator('#rangeOptions').evaluate(e=>e.open=true);await page.locator('#rangeMode').selectOption('km');await page.locator('#rangeValue').fill('80');await page.locator('#reserveKm').fill('0');await page.route(osrm,r=>r.fulfill({json:{code:'Ok',routes:[via({legs:[{distance:90000,duration:3600},{distance:16000,duration:600}]})]}}));await open(page);await expect(page.locator('#stationPreviewAccess')).toContainText('90,0 km');await expect(page.locator('#stationPreviewFar')).toBeVisible();await expect(page.locator('#stationPreviewConfirm')).toBeDisabled();await expect(page.locator('#stationPreviewAccess')).toContainText('13:00');await confirmStationPreview(page,{outOfRange:true});await expect(page.locator('#selectedStop')).toBeVisible();await expect(page.locator('[data-station=A] .station-opening')).toContainText('13:00');
});
test('aperçu station : annulation pendant calcul et réponse tardive ne remplacent pas le nouvel aperçu',async({page})=>{
 await setup(page);let release,seen;const gate=new Promise(r=>release=r),started=new Promise(r=>seen=r);let n=0;
 await page.route(osrm,async r=>{const first=++n===1;if(first){seen();await gate}return r.fulfill({json:{code:'Ok',routes:[via({distance:first?150000:106000})]}}).catch(()=>{})});
 await page.locator('[data-select=A]').click();await started;await expect(page.locator('#stationPreviewConfirm')).toBeDisabled();await page.locator('#stationPreviewCancel').click();await expect(page.locator('#stationsBtn')).toBeEnabled();await open(page,'B');release();await expect(page.locator('#stationPreviewMetrics')).not.toContainText('150,0');await confirmStationPreview(page);await expect(page.locator('#selectedStop')).toContainText('2 route test');await expect(page.locator('#tripKm')).toHaveText('106,0 km');
});
test('aperçu station : contexte modifié sans événement rend la confirmation inutilisable',async({page})=>{
 await setup(page);await open(page);await page.evaluate(()=>document.getElementById('stopMinutes').value='12');await page.locator('#stationPreviewConfirm').click();await expect(page.locator('#stationPreviewDialog')).toBeHidden();await expect(page.locator('#fuelStatus')).toContainText('contexte a changé');await expect(page.locator('#tripKm')).toHaveText('104,0 km');await expect(page.locator('#selectedStop')).toBeHidden();
});
test('aperçu station : erreur de service, géométrie incohérente et métriques invalides ne changent rien',async({page})=>{
 await setup(page);for(const bad of [null,via({duration:-1}),via({geometry:{type:'LineString',coordinates:[[0,0],points.at(-1)]}})]){
 await page.route(osrm,r=>bad?r.fulfill({json:{code:'Ok',routes:[bad]}}):r.fulfill({status:503,json:{}}));await page.locator('[data-select=A]').click();await expect(page.locator('#stationPreviewStatus')).toContainText('Arrêt non confirmé');await expect(page.locator('#stationPreviewConfirm')).toBeDisabled();await expect(page.locator('#tripKm')).toHaveText('104,0 km');await page.locator('#stationPreviewCancel').click();}
});
test('aperçu station : fiche, carte Leaflet indépendante et lecture mobile',async({page},info)=>{
 await setup(page,true);await page.locator('[data-details=A]').first().click();await page.locator('#detailChooseBtn').click();await expect(page.locator('#stationPreviewMap')).toBeVisible();await expect(page.locator('#stationPreviewSvg')).toBeHidden();await expect(page.locator('#stationDialog')).toBeHidden();await expect(page.locator('#stationPreviewMap .leaflet-marker-icon')).toHaveCount(3);await expect(page.locator('#stationPreviewMap path.leaflet-interactive')).toHaveCount(0);await page.locator('#stationPreviewMap .leaflet-control-zoom-in').click();await expect(page.locator('#selectedStop')).toBeHidden();await page.locator('#stationPreviewDialog').evaluate(e=>e.scrollTop=0);await capture(page,info,'apercu-carte');await checkOverflow(page);await checkAccessibility(page,info,'apercu-carte');await confirmStationPreview(page);await expect(page.locator('#stationPreviewMap .leaflet-container')).toHaveCount(0);await expect(page.locator('#selectedStop')).toBeVisible();
});
