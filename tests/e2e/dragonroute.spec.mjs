import { test, expect } from '@playwright/test';
import { mockDragonRoute, orsPattern, orsResponse, testOrsKey, publicRouting } from '../helpers/dragonroute.mjs';
import { capture, checkAccessibility, checkOverflow } from '../helpers/inspection.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const fuelPattern = 'https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records?**';

test.beforeEach(async ({ page }) => {
  await mockDragonRoute(page);
});

async function configureOrs(page){
  await publicRouting(page);
  await page.goto('/DragonRoute/');
  await page.locator('#avoidTolls').check();
  await page.locator('#avoidHighways').check();
  await page.locator('#avoidFerries').check();
}

test('service public absent : controles indisponibles avant recherche', async ({ page }) => {
  const requests=[];page.on('request',r=>{if(/route\/v1|openrouteservice\/v2|nominatim/.test(r.url()))requests.push(r.url())});
  await page.goto('/DragonRoute/');
  for(const id of ['avoidTolls','avoidHighways','avoidFerries'])await expect(page.locator('#'+id)).toBeDisabled();
  for(const type of ['truck','caravan','van'])await expect(page.locator(`#routeVehicle option[value=${type}]`)).toBeDisabled();
  await expect(page.locator('#goBtn')).toBeEnabled();
  await expect(page.locator('#stops')).toBeHidden();
  await expect(page.locator('input[type=password]')).toHaveCount(0);
  await expect(page.locator('#routingAvailability')).toContainText('aucune clé');
  expect(requests).toEqual([]);
});

test('routage public exclusions appliquees aux stations sans secret client', async ({ page },info) => {
  const requests=[];let osrm=0;
  page.on('request',r=>{if(r.url().includes('router.project-osrm.org'))osrm++});
  await page.route(orsPattern,async r=>{
    const request=r.request(),body=request.postDataJSON();
    expect(request.method()).toBe('POST');expect(request.headers().authorization).toBeUndefined();
    expect(request.url()).not.toContain(testOrsKey);
    expect(body.avoid).toEqual(['tollways','highways','ferries']);
    expect(body.vehicle).toEqual({type:'car'});
    expect(body.coordinates[0]).toEqual([4.8357,45.764]);
    requests.push(body);
    await r.fulfill({json:orsResponse(body)});
  });
  await configureOrs(page);
  await page.locator('#goBtn').click();
  await expect(page.locator('#status')).toContainText('Trajet prêt');
  await expect(page.locator('#orsKey')).toHaveCount(0);
  await expect(page.locator('#appliedRouting')).toContainText('péages, autoroutes, ferries');
  await expect(page.locator('#routeAlternativesNote')).toContainText('100 km');
  await page.locator('#stationsBtn').click();
  await expect(page.locator('#fuelStatus')).toContainText('2 stations comparées',{timeout:20000});
  await expect(page.locator('.result-card').first()).toContainText('+10,0 km');
  expect(requests.map(x=>x.coordinates.length)).toEqual([2,3,3]);expect(osrm).toBe(0);
  page.once('dialog',dialog=>dialog.dismiss());
  await page.locator('[data-select]').first().click();
  await expect(page.locator('#selectedStop')).toBeHidden();
  page.once('dialog',async dialog=>{expect(dialog.message()).toContain('peut changer de routes');await dialog.accept()});
  await page.locator('[data-select]').first().click();
  await expect(page.locator('#selectedStop')).toContainText('130,0 km');
  expect(requests).toHaveLength(3);
  await page.locator('#routingOptions').scrollIntoViewIfNeeded();
  await capture(page,info,'options-routage');
  await checkOverflow(page);await checkAccessibility(page,info,'options-routage');
  const stored=await page.evaluate(()=>JSON.stringify({local:{...localStorage},session:{...sessionStorage}}));
  expect(stored).not.toContain(testOrsKey);expect(await page.content()).not.toContain(testOrsKey);
  await page.locator('#profileBtn').click();
  const download=page.waitForEvent('download');await page.locator('#exportProfileBtn').click();
  const stream=await (await download).createReadStream();let exported='';for await(const chunk of stream)exported+=chunk.toString();
  expect(exported).not.toContain(testOrsKey);
  await page.getByRole('button',{name:'Fermer le profil'}).click();
  await page.locator('#avoidHighways').uncheck();await expect(page.locator('#stops')).toBeHidden();
  await page.reload();await expect(page.locator('#orsKey')).toHaveCount(0);
});

test('ORS refus et geometrie invalide sans fuite de cle ni repli', async ({ page }) => {
  let status=403,invalid=false,osrm=0;
  page.on('request',r=>{if(r.url().includes('router.project-osrm.org'))osrm++});
  await page.route(orsPattern,r=>r.fulfill({status,json:invalid?orsResponse(r.request().postDataJSON(),{invalid:true}):{error:{message:testOrsKey}}}));
  await configureOrs(page);
  for(const [http,message] of [[403,'Accès au service public refusé'],[429,'Limite du service public'],[500,'indisponible']]){
    status=http;await page.locator('#goBtn').click();
    await expect(page.locator('#status')).toContainText(message);
    await expect(page.locator('#stops')).toBeHidden();expect(await page.content()).not.toContain(testOrsKey);
  }
  status=200;invalid=true;await page.locator('#goBtn').click();
  await expect(page.locator('#status')).toContainText('incomplète ou incohérente');expect(osrm).toBe(0);
});

test('ORS comparaison interrompue ou incoherente conserve le trajet', async ({ page }) => {
  let mode='shorter',calls=0;
  await page.route(orsPattern,async r=>{
    const body=r.request().postDataJSON();calls++;
    if(mode==='quota'&&body.coordinates.length===3&&body.coordinates[1][1]<45.3)return r.fulfill({status:429,json:{error:{message:'quota'}}});
    if(mode==='noRoute'&&body.coordinates.length===3&&body.coordinates[1][1]>45.3)return r.fulfill({status:422,json:{error:{code:'NO_ROUTE'}}});
    await r.fulfill({json:orsResponse(body,{shorter:mode==='shorter'})});
  });
  await configureOrs(page);await page.locator('#goBtn').click();
  await expect(page.locator('#status')).toContainText('Trajet prêt');
  await page.locator('#stationsBtn').click();
  await expect(page.locator('#fuelStatus')).toContainText('exclus du classement',{timeout:20000});
  await expect(page.locator('.result-card')).toHaveCount(0);await expect(page.locator('#summary')).toBeVisible();
  mode='noRoute';await page.locator('#stationsBtn').click();
  await expect(page.locator('#fuelStatus')).toContainText('1 station(s) sans accès calculable.',{timeout:20000});
  await expect(page.locator('.result-card')).toHaveCount(1);
  await page.locator('[data-details]').first().click();await page.locator('#favoriteBtn').click();
  await page.getByRole('button',{name:'Fermer la fiche station'}).click();
  mode='quota';await page.locator('#stationsBtn').click();
  await expect(page.locator('#fuelStatus')).toContainText('Limite du service public');
  await expect(page.locator('.result-card')).toHaveCount(0);
  await page.locator('#stationsBtn').click();await page.locator('#cancelStationsBtn').click();
  await expect(page.locator('#fuelStatus')).toContainText('Recherche interrompue');
  await expect(page.locator('#summary')).toBeVisible();await expect(page.locator('#stationsBtn')).toBeEnabled();
  await page.locator('#profileBtn').click();await page.locator('[data-favorite-open]').first().click();
  await expect(page.locator('#stationMessage')).toContainText('Fiche actualisée');
  expect(calls).toBeGreaterThan(2);
});

test('ORS alternatives courtes et indisponibilite explicite', async ({ page }) => {
  let failAlternatives=false;
  await page.route(orsPattern,r=>{
    const body=r.request().postDataJSON();
    return failAlternatives&&body.alternatives?r.fulfill({status:400,json:{error:{code:'UPSTREAM_UNAVAILABLE'}}}):r.fulfill({json:orsResponse(body,{distance:80000})});
  });
  await configureOrs(page);await page.locator('#goBtn').click();
  await expect(page.locator('#status')).toContainText('Trajet prêt');
  await expect(page.locator('#alternativeRoutes path')).toHaveCount(1);
  failAlternatives=true;await page.locator('#goBtn').click();
  await expect(page.locator('#status')).toContainText('Trajet prêt');
  await expect(page.locator('#alternativeRoutes path')).toHaveCount(0);
  await expect(page.locator('#routeAlternativesNote')).toContainText('Recherche d’alternatives indisponible');
  await expect(page.locator('#appliedRouting')).toContainText('péages, autoroutes, ferries');
});

test('poids lourd valide memorise et transmis aux arrets sans assimilation caravane', async ({ page }, info) => {
  const bodies=[];
  await page.route(orsPattern,r=>{const body=r.request().postDataJSON();bodies.push(body);return r.fulfill({json:orsResponse(body)})});
  await configureOrs(page);await page.locator('#routeVehicle').selectOption('truck');
  await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('cinq dimensions');
  expect(bodies).toHaveLength(0);
  for(const [id,value]of Object.entries({truckHeight:'3.8',truckWidth:'2.5',truckLength:'16',truckWeight:'32',truckAxleload:'10'}))await page.locator('#'+id).fill(value);
  await page.locator('#goBtn').click();await expect(page.locator('#status')).toContainText('Trajet prêt');
  await expect(page.locator('#appliedRouting')).toContainText('poids lourd');
  await page.locator('#stationsBtn').click();await expect(page.locator('#fuelStatus')).toContainText('2 stations comparées',{timeout:20000});
  expect(bodies).toHaveLength(3);
  for(const body of bodies)expect(body.vehicle).toEqual({type:'truck',dimensions:{height:3.8,width:2.5,length:16,weight:32,axleload:10}});
  await page.locator('#truckDimensions').scrollIntoViewIfNeeded();
  await capture(page,info,'poids-lourd');await checkOverflow(page);await checkAccessibility(page,info,'poids-lourd');
  await page.locator('#profileBtn').click();await page.locator('#vehicleType').selectOption('truck');
  await page.locator('#saveTruckDimensions').click();await expect(page.locator('#savedDimensionsNote')).toContainText('32,00 t');
  await page.locator('#vehicleCons').fill('35');await page.locator('#vehicleLiters').fill('400');
  await page.getByRole('button',{name:'Enregistrer le véhicule'}).click();
  await page.reload();await expect(page.locator('#routeVehicle')).toHaveValue('truck');
  await expect(page.locator('#truckHeight')).toHaveValue('3.8');await expect(page.locator('#cons')).toHaveValue('35');
  await expect(page.locator('#routeVehicle option[value=caravan]')).toBeDisabled();expect(bodies).toHaveLength(3);
});

test('alternatives selectionnables et suppression arret sans ancien classement', async ({ page }) => {
  await page.goto('/DragonRoute/');await page.locator('#goBtn').click();
  await expect(page.locator('#status')).toContainText('Trajet prêt');
  const initial=await page.locator('#routeLine').getAttribute('d');
  await page.locator('input[name=routeChoice][value="1"]').check();
  await expect(page.locator('#tripKm')).toHaveText('118,0 km');
  expect(await page.locator('#routeLine').getAttribute('d')).not.toBe(initial);
  await page.locator('#stationsBtn').click();
  await expect(page.locator('#fuelStatus')).toContainText('non comparable');
  await expect(page.locator('.result-card')).toHaveCount(0);
  await page.locator('input[name=routeChoice][value="0"]').check();
  await page.locator('#stationsBtn').click();await expect(page.locator('.result-card')).toHaveCount(2);
  page.once('dialog',d=>d.dismiss());await page.locator('input[name=routeChoice][value="1"]').click();
  await expect(page.locator('input[name=routeChoice][value="0"]')).toBeChecked();
  await page.locator('[data-select]').first().click();await expect(page.locator('#removeStopBtn')).toBeVisible();
  await page.locator('#removeStopBtn').click();await expect(page.locator('#selectedStop')).toBeHidden();
  await expect(page.locator('#routeLine')).toHaveAttribute('d',initial);
  await expect(page.locator('[data-select][aria-pressed=true]')).toHaveCount(0);
  page.once('dialog',d=>d.accept());await page.locator('input[name=routeChoice][value="1"]').click();
  await expect(page.locator('#tripKm')).toHaveText('118,0 km');await expect(page.locator('.result-card')).toHaveCount(0);
});

test('demarrage accessible sans Leaflet', async ({ page }, info) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/DragonRoute/');
  await expect(page.locator('#hJS')).toHaveText('JS ✓');
  await expect(page.locator('#status')).toContainText('Moteur chargé');
  await expect(page.locator('#hMap')).toContainText('fallback');
  await capture(page, info, 'demarrage');
  await checkOverflow(page);
  await checkAccessibility(page, info, 'demarrage');
  expect(errors).toEqual([]);
});

test('Lyon vers Valence : resultats et accessibilite', async ({ page }, info) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/DragonRoute/');
  await expect(page.locator('#hMap')).toContainText('fallback');
  await page.locator('#goBtn').click();
  await expect(page.locator('#status')).toContainText('Trajet prêt');
  await page.locator('#stationsBtn').click();
  await expect(page.locator('#fuelStatus')).toContainText('stations comparées', { timeout: 15_000 });
  await expect(page.locator('#hGeo')).toHaveText('géocodage ✓');
  await expect(page.locator('#hRoute')).toHaveText('routage ✓');
  await expect(page.locator('#hFuel')).toHaveText('carburants ✓');
  await expect(page.locator('.result-card')).toHaveCount(2);
  await expect(page.locator('.result-card').first()).toContainText('achat + carburant du détour');
  await expect(page.locator('.result-card').first()).toContainText('€/L');
  await expect(page.locator('.result-card').first()).toContainText('min');
  await expect(page.locator('#testedCount')).toHaveText('2');
  await expect(page.locator('#routeLine')).toHaveCSS('stroke','rgb(7, 88, 217)');
  await expect(page.locator('#routeLine')).toHaveCSS('stroke-width','7px');
  await expect(page.locator('#routeGlow')).toHaveCSS('stroke','rgb(255, 255, 255)');
  await expect(page.locator('#alternativeRoutes path')).toHaveCount(1);
  await expect(page.locator('#alternativeRoutes path')).toHaveCSS('stroke','rgb(130, 186, 255)');
  await expect(page.locator('#routeAlternativesNote')).toContainText('1 autre(s) trajet(s)');
  await page.locator('.cards').scrollIntoViewIfNeeded();
  await capture(page, info, 'resultats');
  await checkOverflow(page);
  await checkAccessibility(page, info, 'resultats');
  expect(errors).toEqual([]);
});

test('parcours clavier et mouvement reduit', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/DragonRoute/');
  for (const id of ['profileBtn', 'start', 'gpsBtn', 'end', 'routingOptionsToggle', 'routeVehicle', 'goBtn']) {
    await page.keyboard.press('Tab');
    await expect(page.locator('#' + id)).toBeFocused();
    const outline = await page.locator('#' + id).evaluate(el => getComputedStyle(el).outlineStyle);
    expect(outline, 'Focus visible sur ' + id).not.toBe('none');
  }
  await page.keyboard.press('Enter');
  await expect(page.locator('#statusDot')).toHaveClass(/busy/);
  await expect(page.locator('#statusDot')).toHaveCSS('animation-name', 'none');
  await expect(page.locator('#status')).toContainText('Trajet prêt');
  await page.locator('#stationsTab').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#ridesTab')).toBeFocused();
  await expect(page.locator('#ridesPanel')).toBeVisible();
});

test('erreur de geocodage explicite', async ({ page }) => {
  await page.route('https://nominatim.openstreetmap.org/search?**', route => route.fulfill({ status: 500, body: 'Service indisponible' }));
  await page.goto('/DragonRoute/');
  await page.locator('#goBtn').click();
  await expect(page.locator('#status')).toContainText('HTTP 500');
  await expect(page.locator('#status')).toHaveAttribute('role', 'status');
  await expect(page.locator('#goBtn')).toBeEnabled();
  await expect(page.locator('.price')).toHaveCount(0);
  await checkOverflow(page);
});

for (const [service, pattern] of [
  ['geocodage', 'https://nominatim.openstreetmap.org/search?**'],
  ['routage', 'https://router.project-osrm.org/route/v1/driving/**']
]) {
  test(`relance apres succes puis panne du ${service} et recuperation`, async ({ page }) => {
    await page.goto('/DragonRoute/');
    await page.locator('#goBtn').click();
    await expect(page.locator('#status')).toContainText('Trajet prêt');
    await page.locator('#stationsBtn').click();
    await expect(page.locator('#fuelStatus')).toContainText('stations comparées');
    await expect(page.locator('.price')).toHaveCount(2);
    const fail = route => route.fulfill({ status: 500, body: 'Service indisponible' });
    await page.route(pattern, fail);
    await page.locator('#end').fill('Grenoble');
    await page.locator('#goBtn').click();
    await expect(page.locator('.price')).toHaveCount(0);
    await expect(page.locator('#status')).toContainText('HTTP 500');
    await expect(page.locator('#summary')).toBeHidden();
    for (const id of ['tripKm', 'tripTime', 'stationCount', 'testedCount']) {
      await expect(page.locator('#' + id)).toHaveText('—');
    }
    await expect(page.locator('#routeLine')).toHaveAttribute('d', '');
    await expect(page.locator('#alternativeRoutes path')).toHaveCount(0);
    await expect(page.locator('#routeAlternativesNote')).toBeHidden();
    await expect(page.locator('#stationDots circle')).toHaveCount(0);
    await expect(page.locator('#goBtn')).toBeEnabled();
    await checkOverflow(page);
    await page.unroute(pattern, fail);
    await page.locator('#end').fill('Valence');
    await page.locator('#goBtn').click();
    await expect(page.locator('#status')).toContainText('Trajet prêt');
    await page.locator('#stationsBtn').click();
    await expect(page.locator('#fuelStatus')).toContainText('stations comparées');
    await expect(page.locator('.price')).toHaveCount(2);
    await expect(page.locator('#diagWrap')).not.toHaveAttribute('open', '');
  });
}

test('Entree pendant une recherche ne cree pas de requetes concurrentes', async ({ page }) => {
  let requests = 0;
  page.on('request', request => {
    if (request.url().startsWith('https://nominatim.openstreetmap.org/search?')) requests++;
  });
  await page.goto('/DragonRoute/');
  await page.locator('#goBtn').click();
  await expect(page.locator('#goBtn')).toBeDisabled();
  await page.locator('#start').dispatchEvent('keydown', { key: 'Enter' });
  await page.locator('#end').dispatchEvent('keydown', { key: 'Enter' });
  await expect(page.locator('#status')).toContainText('Trajet prêt');
  expect(requests).toBe(2);
  await expect(page.locator('#goBtn')).toBeEnabled();
});

test('trajet disponible avant toute recherche de station', async ({ page }) => {
  let fuelRequests = 0;
  page.on('request', r => { if (r.url().includes('data.economie.gouv.fr')) fuelRequests++; });
  await page.goto('/DragonRoute/');
  await expect(page.locator('#stops')).toBeHidden();
  await expect(page.locator('#timeValue')).toHaveCount(0);
  await page.getByRole('button', { name: 'Trouver mon trajet' }).click();
  await expect(page.locator('#status')).toContainText('Trajet prêt');
  expect(fuelRequests).toBe(0);
  await expect(page.locator('#routeLine')).not.toHaveAttribute('d', '');
  await expect(page.locator('#stationsBtn')).toBeVisible();
  await page.locator('#ridesTab').click();
  await expect(page.locator('#ridesPanel')).toContainText('Aucune offre');
  await page.locator('#start').fill('Grenoble');
  await expect(page.locator('#stops')).toBeHidden();
  await expect(page.locator('#routeLine')).toHaveAttribute('d', '');
});

test('une seule station cumule les trois badges sans doublon', async ({ page }) => {
  await page.route(fuelPattern, route => route.fulfill({ json: { results: [
    { id: 'A', adresse: 'Station unique', ville: 'Valence', geom: [45.40,4.87], e10_prix: 1.72, e10_maj: '2026-09-16T18:00:00+00:00' }
  ] } }));
  await page.goto('/DragonRoute/');
  await page.locator('#goBtn').click();
  await expect(page.locator('#status')).toContainText('Trajet prêt');
  await page.locator('#stationsBtn').click();
  await expect(page.locator('.result-card')).toHaveCount(1);
  await expect(page.locator('.result-badge')).toHaveText(['OPTIMAL','POMPE','RAPIDE']);
  await page.getByRole('button', { name: 'Choisir cette station' }).click();
  await expect(page.locator('#selectedStop')).toContainText('Station unique');
  await expect(page.locator('.choose-station')).toHaveAttribute('aria-pressed', 'true');
});

test('stations filtrees par distance et jamais elargies silencieusement', async ({ page }) => {
  await page.goto('/DragonRoute/');
  await page.locator('#goBtn').click();
  await expect(page.locator('#status')).toContainText('Trajet prêt');
  await page.locator('#stationsBtn').click();
  await expect(page.locator('.result-card').first()).toHaveAttribute('data-station', 'A');
  await page.locator('input[value=around]').check();
  await page.locator('#stopKm').focus();
  await page.keyboard.press('Home');
  for (let i = 0; i < 12; i++) await page.keyboard.press('ArrowRight');
  await expect(page.locator('#stopKmLabel')).toHaveText('60 km');
  await page.locator('#stationsBtn').click();
  await expect(page.locator('#testedCount')).toHaveText('2');
  for (let i = 0; i < 8; i++) await page.locator('#stopKm').press('ArrowRight');
  await expect(page.locator('#stopKmLabel')).toHaveText('100 km');
  await expect(page.locator('.result-card')).toHaveCount(0);
  await page.locator('#stationsBtn').click();
  await expect(page.locator('#fuelStatus')).toContainText('Aucune station');
  await expect(page.locator('.result-card')).toHaveCount(0);
  await expect(page.locator('#summary')).toBeVisible();
});

test('panne carburants ne supprime pas le trajet et peut etre relancee', async ({ page }) => {
  const fail = route => route.fulfill({ status: 500, body: 'Indisponible' });
  await page.route(fuelPattern, fail);
  await page.goto('/DragonRoute/');
  await page.locator('#goBtn').click();
  await expect(page.locator('#status')).toContainText('Trajet prêt');
  await page.locator('#stationsBtn').click();
  await expect(page.locator('#fuelStatus')).toContainText('Service carburants indisponible');
  await expect(page.locator('#routeLine')).not.toHaveAttribute('d', '');
  await expect(page.locator('#summary')).toBeVisible();
  await page.unroute(fuelPattern, fail);
  await page.locator('#stationsBtn').click();
  await expect(page.locator('#fuelStatus')).toContainText('stations comparées');
});

test('carte Leaflet interactive sans recouvrement des commandes', async ({ page }, info) => {
  await page.route('https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css', route => route.fulfill({ path: require.resolve('leaflet/dist/leaflet.css'), contentType: 'text/css' }));
  await page.route('https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js', route => route.fulfill({ path: require.resolve('leaflet/dist/leaflet.js'), contentType: 'application/javascript' }));
  await page.route('https://tile.openstreetmap.org/**', route => route.fulfill({ body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', 'base64'), contentType: 'image/png' }));
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/DragonRoute/');
  await expect(page.locator('#hMap')).toHaveText('carte ✓');
  await page.locator('#goBtn').click();
  await expect(page.locator('#status')).toContainText('Trajet prêt');
  await expect(page.locator('.leaflet-overlay-pane path')).not.toHaveCount(0);
  await expect(page.locator('.map-route-selected')).toHaveAttribute('stroke','#0758d9');
  await expect(page.locator('.map-route-selected')).toHaveAttribute('stroke-width','7');
  await expect(page.locator('.map-route-outline')).toHaveAttribute('stroke','#fff');
  await expect(page.locator('.map-route-alternative')).toHaveAttribute('stroke','#82baff');
  await page.locator('#stationsBtn').click();
  await expect(page.locator('.station-marker')).toHaveCount(2);
  await page.locator('.station-marker').first().click();
  await expect(page.locator('#stationDialog')).toBeVisible();
  await expect(page.locator('#stationDetails')).toContainText('Station de gonflage');
  await page.getByRole('button', { name: 'Fermer la fiche station' }).click();
  const map = await page.locator('#map').boundingBox();
  const sheet = await page.locator('#sheet').boundingBox();
  expect(map.width).toBeGreaterThan(250);
  expect(map.height).toBeGreaterThan(200);
  expect(sheet.x + sheet.width <= map.x + 1 || map.y + map.height <= sheet.y + 1).toBe(true);
  await page.locator('.leaflet-control-zoom-in').click();
  await capture(page, info, 'carte-leaflet');
  await page.locator('[data-select]').first().click();
  await expect(page.locator('#selectedStop')).toBeVisible();
  await expect(page.locator('.map-route-selected')).toHaveCount(1);
  await expect(page.locator('.map-route-alternative')).toHaveCount(0);
  await expect(page.locator('#routeAlternativesNote')).toBeHidden();
  await page.locator('#liters').fill('35');
  await expect(page.locator('.map-route-alternative')).toHaveCount(1);
  await expect(page.locator('#routeAlternativesNote')).toBeVisible();
  await checkOverflow(page);
  expect(errors).toEqual([]);
});

test('alternatives absentes ou invalides sans ancien trace', async ({ page }) => {
  const pattern='https://router.project-osrm.org/route/v1/driving/**';
  const main={distance:104000,duration:3900,geometry:{type:'LineString',coordinates:[[4.8357,45.7640],[4.8924,44.9334]]}};
  let routes=[main];
  await page.route(pattern, handler=>handler.fulfill({contentType:'application/json',body:JSON.stringify({code:'Ok',routes})}));
  await page.goto('/DragonRoute/');
  await page.locator('#goBtn').click();
  await expect(page.locator('#status')).toContainText('Trajet prêt');
  await expect(page.locator('#alternativeRoutes path')).toHaveCount(0);
  await expect(page.locator('#routeAlternativesNote')).toContainText('Aucun autre trajet proposé');
  routes=[main,{geometry:{type:'LineString'}},{geometry:{type:'LineString',coordinates:[[4,45],[null,44]]}}];
  await page.locator('#goBtn').click();
  await expect(page.locator('#status')).toContainText('Trajet prêt');
  await expect(page.locator('#alternativeRoutes path')).toHaveCount(0);
  routes=[{...main,geometry:null}];
  await page.locator('#goBtn').click();
  await expect(page.locator('#status')).toContainText('Tracé routier incomplet');
  await expect(page.locator('#routeLine')).toHaveAttribute('d','');
  await expect(page.locator('#routeAlternativesNote')).toBeHidden();
  await expect(page.locator('#stops')).toBeHidden();
});

test('fiche station et favoris actualises apres rechargement', async ({ page }, info) => {
  await page.goto('/DragonRoute/');
  await page.locator('#goBtn').click();
  await expect(page.locator('#status')).toContainText('Trajet prêt');
  await page.locator('#stationsBtn').click();
  await expect(page.locator('.svg-station')).toHaveCount(2);
  await page.locator('.svg-station').first().click();
  await expect(page.locator('#stationDetails')).toContainText('08:00 – 12:00, 14:00 – 18:00');
  await expect(page.locator('#stationDetails')).toContainText('Mardi : fermé');
  await expect(page.locator('#stationDetails')).toContainText('Mercredi : non renseigné');
  await expect(page.locator('#stationDetails')).toContainText('Automate 24 h/24 : Oui');
  await page.locator('#favoriteBtn').click();
  await expect(page.locator('#favoriteBtn')).toHaveAttribute('aria-pressed','true');
  await capture(page, info, 'fiche-station');
  await checkAccessibility(page, info, 'fiche-station');
  await page.reload();
  await page.locator('#profileBtn').click();
  await expect(page.locator('#savedStations .saved-row')).toHaveCount(1);
  await page.getByRole('button', {name:'Voir la station',exact:true}).click();
  await expect(page.locator('#stationMessage')).toContainText('Fiche actualisée');
  await expect(page.locator('#detailChooseBtn')).toBeHidden();
  await expect(page.locator('#stationDetails')).toContainText('Lavage automatique');
  await page.locator('#favoriteBtn').click();
  await expect(page.locator('#favoriteBtn')).toHaveAttribute('aria-pressed','false');
});

test('vehicule et adresses persistes modifiables et reutilisables', async ({ page }, info) => {
  await page.goto('/DragonRoute/');
  await page.locator('#profileBtn').click();
  await page.locator('#vehicleName').fill('Ma caravane');
  await page.locator('#vehicleType').selectOption('caravan');
  await page.locator('#vehicleFuel').selectOption('E85');
  await page.locator('#vehicleCons').fill('9');
  await page.locator('#vehicleLiters').fill('30');
  await page.getByRole('button',{name:'Enregistrer le véhicule'}).click();
  await page.locator('#addressName').fill('Maison');
  await page.locator('#addressValue').fill('1 rue de Paris, Lyon');
  await page.getByRole('button',{name:'Enregistrer l’adresse'}).click();
  await expect(page.getByRole('button',{name:'Fermer le profil'})).toBeInViewport({ratio:1});
  const wrapped = await page.locator('#savedAddresses button').evaluateAll(buttons => buttons.some(button => {const range=document.createRange();range.selectNodeContents(button);return range.getClientRects().length>1}));
  expect(wrapped).toBe(false);
  await capture(page, info, 'profil');
  await checkAccessibility(page, info, 'profil');
  await page.reload();
  await expect(page.locator('#fuel')).toHaveValue('E85');
  await expect(page.locator('#cons')).toHaveValue('9');
  await expect(page.locator('#routeVehicle')).toHaveValue('caravan');
  await expect(page.locator('#vehicleRoutingNote')).toContainText('n’est pas encore validé');
  await page.locator('#profileBtn').click();
  await page.getByRole('button',{name:'Modifier',exact:true}).click();
  await page.locator('#addressValue').fill('2 rue de Paris, Lyon');
  await page.getByRole('button',{name:'Enregistrer l’adresse'}).click();
  await expect(page.locator('#savedAddresses .saved-row')).toHaveCount(1);
  await page.getByRole('button',{name:'Départ',exact:true}).click();
  await expect(page.locator('#start')).toHaveValue('2 rue de Paris, Lyon');
  await expect(page.locator('#stops')).toBeHidden();
});

test('profil invalide ou stockage refuse sans fausse sauvegarde', async ({ page }) => {
  await page.addInitScript(()=>{
    localStorage.setItem('dragonroute.profile.v1.public','{"version":999}');
    Storage.prototype.setItem=()=>{throw new Error('Quota exceeded')};
  });
  await page.goto('/DragonRoute/');
  await expect(page.locator('#hJS')).toHaveText('JS ✓');
  await page.locator('#profileBtn').click();
  await expect(page.locator('#profileMessage')).toContainText('Profil non chargé');
  await page.locator('#vehicleName').fill('Non sauvegardé');
  await page.getByRole('button',{name:'Enregistrer le véhicule'}).click();
  await expect(page.locator('#profileMessage')).toContainText('Enregistrement impossible');
});

test('import export et suppression du profil sans toucher les autres donnees', async ({ page }) => {
  await page.goto('/DragonRoute/');
  await page.evaluate(()=>localStorage.setItem('autre-application','conserver'));
  await page.locator('#profileBtn').click();
  await page.locator('#importProfileFile').setInputFiles({name:'profil.json',mimeType:'application/json',buffer:Buffer.from('{"version":999}')});
  await expect(page.locator('#profileMessage')).toContainText('Import refusé');
  page.on('dialog',dialog=>dialog.accept());
  const profile={version:1,vehicle:{name:'Import test',type:'car',fuel:'E10',cons:7,liters:35},addresses:[{id:'maison',name:'Maison',value:'Lyon'}],stations:[]};
  await page.locator('#importProfileFile').setInputFiles({name:'profil.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(profile))});
  await expect(page.locator('#profileMessage')).toHaveText('Profil importé.');
  await expect(page.locator('#vehicleName')).toHaveValue('Import test');
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#exportProfileBtn').click();
  const download=await downloadPromise;
  expect(download.suggestedFilename()).toBe('DragonRoute-profil.json');
  expect(JSON.parse(require('node:fs').readFileSync(await download.path(),'utf8'))).toEqual(profile);
  await page.locator('#eraseProfileBtn').click();
  await expect(page.locator('#profileMessage')).toHaveText('Profil local effacé.');
  await expect(page.locator('#savedAddresses')).toContainText('Aucune adresse');
  expect(await page.evaluate(()=>localStorage.getItem('autre-application'))).toBe('conserver');
});
