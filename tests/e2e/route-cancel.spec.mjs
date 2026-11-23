import {test,expect} from '@playwright/test';
import {mockDragonRoute,geocodingPattern,addressFeature,placesResponse,publicRouting,orsPattern,orsResponse} from '../helpers/dragonroute.mjs';
import {capture,checkAccessibility,checkOverflow} from '../helpers/inspection.mjs';
const osrm='https://router.project-osrm.org/route/v1/driving/**',ign='https://data.geopf.fr/navigation/itineraire?**';
const routeData=(distance=104000)=>({code:'Ok',routes:[{distance,duration:3900,geometry:{type:'LineString',coordinates:[[4.8357,45.764],[5.08,45.55],[4.8924,44.9334]]}}]});
function ignData(url){const p=new URL(url).searchParams,a=p.get('start'),b=p.get('end'),distance=104000,duration=3900;return {resource:'bdtopo-osrm',resourceVersion:'2026-11',profile:p.get('profile'),optimization:p.get('optimization'),crs:'EPSG:4326',distanceUnit:'meter',timeUnit:'second',distance,duration,constraints:p.has('constraints')?[{type:'banned',key:'waytype',operator:'=',value:'autoroute'}]:[],geometry:{type:'LineString',coordinates:[a.split(',').map(Number),b.split(',').map(Number)]},portions:[{start:a,end:b,distance,duration}]}}
async function setup(page,{hold,body=false,count=1,ors=false}={}){
 await mockDragonRoute(page);if(ors)await publicRouting(page);
 if(hold)await page.addInitScript(({hold,body,count})=>{const original=window.fetch;let n=0;window.held=[];window.fetch=async(input,init)=>{const match=String(input).includes(hold)&&n++<count;if(!match)return original(input,init);const response=await original(input,{...init,signal:undefined});if(body){const json=response.json.bind(response);response.json=async()=>{const data=await json();await new Promise(r=>held.push(r));return data}}else await new Promise(r=>held.push(r));return response}},{hold,body,count});
 const calls=[];page.on('request',r=>{if(/geocodage|routing.example.test|\/route\/|navigation\/itineraire|data.economie/.test(r.url()))calls.push(r.url())});
 await page.route(ign,r=>r.fulfill({json:ignData(r.request().url())}));
 if(ors)await page.route(orsPattern,r=>r.fulfill({json:orsResponse(r.request().postDataJSON(),{distance:90000})}));
 await page.goto('/DragonRoute/');return calls;
}
const stored=page=>page.evaluate(()=>JSON.stringify({...localStorage}));
async function held(page,n=1){await expect.poll(()=>page.evaluate(()=>window.held?.length||0)).toBe(n)}
async function release(page,index=0){await page.evaluate(i=>window.held[i](),index)}
async function cancelled(page){await expect(page.locator('#cancelTripBtn')).toBeHidden();await expect(page.locator('#goBtn')).toBeEnabled();await expect(page.locator('#start')).toBeEnabled();await expect(page.locator('#summary')).toBeHidden();await expect(page.locator('#stops')).toBeHidden();await expect(page.locator('#routeChoices')).toBeHidden()}
async function go(page){await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('Trajet prêt')}

test('annulation trajet : départ en attente, clavier, saisies et stockage conservés',async({page},info)=>{
 const calls=await setup(page,{hold:'/geocodage/'}),before=await stored(page);await page.locator('#goBtn').click();await held(page);await expect(page.locator('#start')).toBeDisabled();await expect(page.locator('#cancelTripBtn')).toBeEnabled();expect((await page.locator('#cancelTripBtn').boundingBox()).height).toBeGreaterThanOrEqual(44);await checkAccessibility(page,info,'trajet-annulable');await checkOverflow(page);await capture(page,info,'trajet-annulable');await page.locator('#cancelTripBtn').focus();await page.keyboard.press('Enter');await cancelled(page);await expect(page.locator('#goBtn')).toBeFocused();await expect(page.locator('#status')).toContainText('Recherche du trajet annulée');await expect(page.locator('#diagWrap')).not.toHaveAttribute('open','');await release(page);await expect(page.locator('#status')).toContainText('Recherche du trajet annulée');expect(calls).toHaveLength(1);expect(await stored(page)).toBe(before);await expect(page.locator('#start')).toHaveValue('Lyon');await expect(page.locator('#end')).toHaveValue('Valence');await go(page);
});

test('annulation trajet : arrivée en attente conserve les exclusions sans lancer de route',async({page})=>{
 const calls=await setup(page,{hold:'q=Valence'});await page.locator('#avoidHighways').check();await page.locator('#goBtn').click();await held(page);await expect(page.locator('#status')).toContainText('Recherche de l’arrivée');await page.locator('#cancelTripBtn').click();await release(page);await cancelled(page);await expect(page.locator('#avoidHighways')).toBeChecked();expect(calls.filter(u=>u.includes('/navigation/'))).toHaveLength(0);await go(page);expect(calls.filter(u=>u.includes('/navigation/'))).toHaveLength(1);
});

for(const field of ['départ','arrivée'])test(`annulation trajet : fermer le choix du ${field} annule tout le calcul`,async({page})=>{
 const calls=await setup(page);await page.route(geocodingPattern,r=>{const end=new URL(r.request().url()).searchParams.get('q')==='Valence',many=(field==='arrivée')===end;return r.fulfill({json:placesResponse(addressFeature(end?4.8924:4.8357,end?44.9334:45.764,end?'Valence':'Lyon'),...(many?[addressFeature(4.9,45.5,'Autre lieu public')]:[]))})});await page.locator('#goBtn').click();await expect(page.locator('#placeDialog')).toBeVisible();if(field==='départ')await page.keyboard.press('Escape');else await page.locator('#cancelPlace').click();await cancelled(page);await expect(page.locator('#status')).toContainText('Choix du lieu annulé');await expect(page.locator('#statusDot')).not.toHaveClass(/err/);expect(calls.filter(u=>u.includes('/route/'))).toHaveLength(0);await page.locator('#goBtn').click();await expect(page.locator('#placeDialog')).toBeVisible();await page.locator('#placeChoices input').first().check();await page.locator('#confirmPlace').click();await expect(page.locator('#status')).toContainText('Trajet prêt');
});

test('annulation trajet : ancienne réponse ne remplace ni ne déverrouille une nouvelle recherche',async({page})=>{
 const calls=await setup(page,{hold:'/route/v1/',count:2});let n=0;await page.route(osrm,r=>r.fulfill({json:routeData(++n===1?104000:90000)}));await page.locator('#goBtn').click();await held(page);await page.locator('#goBtn').dispatchEvent('click');expect(n).toBe(1);await page.locator('#cancelTripBtn').click();await page.locator('#end').fill('Valence centre');await page.locator('#goBtn').click();await held(page,2);await release(page);await expect(page.locator('#goBtn')).toBeDisabled();await expect(page.locator('#cancelTripBtn')).toBeVisible();await expect(page.locator('#summary')).toBeHidden();await expect(page.locator('#status')).toContainText('Calcul du trajet');await release(page,1);await expect(page.locator('#tripKm')).toHaveText('90,0 km');await expect(page.locator('#end')).toHaveValue('Valence centre');expect(calls.filter(u=>u.includes('/route/'))).toHaveLength(2);
});

test('annulation trajet : annuler pendant le décodage de la réponse ne restaure rien',async({page})=>{
 await setup(page,{hold:'/route/v1/',body:true});await page.locator('#goBtn').click();await held(page);await page.locator('#cancelTripBtn').click();await release(page);await cancelled(page);await expect(page.locator('#routeLine')).toHaveAttribute('d','');await go(page);
});

test('annulation trajet : modification silencieuse de la destination invalide la révision',async({page})=>{
 await setup(page,{hold:'/route/v1/'});await page.locator('#goBtn').click();await held(page);await page.evaluate(()=>document.getElementById('end').value='Valence gare');await release(page);await cancelled(page);await expect(page.locator('#status')).toContainText('Paramètres modifiés');await expect(page.locator('#end')).toHaveValue('Valence gare');await go(page);
});

test('annulation trajet : événement de saisie annule immédiatement sans attendre le réseau',async({page})=>{
 await setup(page,{hold:'/route/v1/'});await page.locator('#goBtn').click();await held(page);await page.evaluate(()=>{const e=document.getElementById('end');e.value='Valence gare';e.dispatchEvent(new Event('input',{bubbles:true}))});await cancelled(page);await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('Trajet prêt');const status=await page.locator('#status').innerText();await release(page);await expect(page.locator('#status')).toHaveText(status);
});

for(const mode of ['walk','car'])test(`annulation trajet : IGN ${mode} arrêté sans repli et relance possible`,async({page})=>{
 const calls=await setup(page,{hold:'/navigation/itineraire'});if(mode==='walk'){await page.locator('#walkMode').click();await page.locator('#maxWalkKm').fill('150')}else await page.locator('#avoidHighways').check();await page.locator('#goBtn').click();await held(page);await page.locator('#cancelTripBtn').click();await release(page);await cancelled(page);await expect(page.locator('#travelMode')).toHaveValue(mode);if(mode==='walk')await expect(page.locator('#maxWalkKm')).toHaveValue('150');else await expect(page.locator('#avoidHighways')).toBeChecked();expect(calls.some(u=>u.includes('router.project'))).toBe(false);await go(page);
});

test('annulation trajet : relais simulé arrêté avant sa demande facultative d’alternatives',async({page})=>{
 const calls=await setup(page,{ors:true,hold:'routing.example.test'});await page.locator('#goBtn').click();await held(page);await page.locator('#cancelTripBtn').click();await release(page);await cancelled(page);expect(calls.filter(u=>u.includes('routing.example.test'))).toHaveLength(1);await go(page);expect(calls.filter(u=>u.includes('routing.example.test'))).toHaveLength(3);
});

for(const provider of ['osrm','ign','ors'])test(`annulation trajet : quota ${provider} respecte Retry-After et demande une relance`,async({page})=>{
 const calls=await setup(page,{ors:provider==='ors'});let limited=true,n=0;const pattern={osrm,ign,ors:orsPattern}[provider];const retryAfter=provider==='osrm'?await page.evaluate(()=>new Date(Date.now()+60000).toUTCString()):'60';await page.route(pattern,r=>{n++;return limited?r.fulfill({status:429,headers:{'Retry-After':retryAfter,'Access-Control-Expose-Headers':'Retry-After'},json:{error:'quota'}}):r.fulfill({json:provider==='ign'?ignData(r.request().url()):provider==='ors'?orsResponse(r.request().postDataJSON()):routeData()})});if(provider==='ign')await page.locator('#avoidHighways').check();await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('Réessayer dans 60 s');await expect(page.locator('#cancelTripBtn')).toBeHidden();await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('Limite du service');expect(n).toBe(1);limited=false;await page.evaluate(()=>{const now=performance.now.bind(performance);performance.now=()=>now()+61000});await go(page);expect(n).toBe(2);expect(calls.filter(u=>u.includes('data.economie'))).toHaveLength(0);
});

test('annulation trajet : délai dépassé, absence de route et panne restent distincts',async({page})=>{
 await page.clock.install({time:new Date('2026-09-17T10:00:00Z')});const calls=await setup(page);
 let mode='timeout',releaseTimeout;
 await page.route(osrm,async r=>{
  if(mode==='timeout'){await new Promise(resolve=>releaseTimeout=resolve);return r.fulfill({json:routeData()}).catch(()=>{})}
  if(mode==='none')return r.fulfill({json:{code:'NoRoute',routes:[]}});
  if(mode==='down')return r.fulfill({status:503,json:{}});
  // A healthy response need not arrive within the old test's artificial 80 ms deadline.
  await new Promise(resolve=>setTimeout(resolve,150));return r.fulfill({json:routeData()});
 });
 await page.locator('#goBtn').click();await expect.poll(()=>typeof releaseTimeout==='function').toBe(true);
 await expect(page.locator('#status')).toContainText('Calcul du trajet');
 // Advance only the deliberately held request past the real 20 s deadline.
 await page.clock.fastForward(20001);await expect(page.locator('#status')).toContainText('délai dépassé');await cancelled(page);releaseTimeout();
 for(const [next,message] of [['none','Aucun itinéraire'],['down','HTTP 503']]){mode=next;await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText(message);await cancelled(page)}
 mode='ok';await go(page);expect(calls.filter(u=>u.includes('/route/'))).toHaveLength(4);
});
