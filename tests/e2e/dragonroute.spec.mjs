import { test, expect } from '@playwright/test';
import { mockDragonRoute } from '../helpers/dragonroute.mjs';
import { capture, checkAccessibility, checkOverflow } from '../helpers/inspection.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const fuelPattern = 'https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records?**';

test.beforeEach(async ({ page }) => {
  await mockDragonRoute(page);
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
  await expect(page.locator('.result-card').first()).toContainText('plein + détour');
  await expect(page.locator('.result-card').first()).toContainText('€/L');
  await expect(page.locator('.result-card').first()).toContainText('min');
  await expect(page.locator('#testedCount')).toHaveText('2');
  await page.locator('.cards').scrollIntoViewIfNeeded();
  await capture(page, info, 'resultats');
  await checkOverflow(page);
  await checkAccessibility(page, info, 'resultats');
  expect(errors).toEqual([]);
});

test('parcours clavier et mouvement reduit', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/DragonRoute/');
  for (const id of ['start', 'gpsBtn', 'end', 'goBtn']) {
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
  await page.locator('#stopKm').fill('60');
  await page.locator('#stationsBtn').click();
  await expect(page.locator('#testedCount')).toHaveText('2');
  await page.locator('#stopKm').fill('100');
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
  const map = await page.locator('#map').boundingBox();
  const sheet = await page.locator('#sheet').boundingBox();
  expect(map.width).toBeGreaterThan(250);
  expect(map.height).toBeGreaterThan(200);
  expect(sheet.x + sheet.width <= map.x + 1 || map.y + map.height <= sheet.y + 1).toBe(true);
  await page.locator('.leaflet-control-zoom-in').click();
  await capture(page, info, 'carte-leaflet');
  await checkOverflow(page);
  expect(errors).toEqual([]);
});
