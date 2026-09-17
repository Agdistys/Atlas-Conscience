import { test, expect } from '@playwright/test';
import { mockDragonRoute } from '../helpers/dragonroute.mjs';
import { capture, checkAccessibility, checkOverflow } from '../helpers/inspection.mjs';

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
  await expect(page.locator('#status')).toContainText('stations comparées', { timeout: 15_000 });
  await expect(page.locator('#hGeo')).toHaveText('géocodage ✓');
  await expect(page.locator('#hRoute')).toHaveText('routage ✓');
  await expect(page.locator('#hFuel')).toHaveText('carburants ✓');
  await expect(page.locator('#optimal')).toContainText('coût comparé');
  await expect(page.locator('#cheap')).toContainText('€/L');
  await expect(page.locator('#fast')).toContainText('min');
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
  for (const id of ['start', 'gpsBtn', 'end', 'fuel', 'liters', 'cons', 'timeValue', 'goBtn']) {
    await page.keyboard.press('Tab');
    await expect(page.locator('#' + id)).toBeFocused();
    const outline = await page.locator('#' + id).evaluate(el => getComputedStyle(el).outlineStyle);
    expect(outline, 'Focus visible sur ' + id).not.toBe('none');
  }
  await page.keyboard.press('Enter');
  await expect(page.locator('#statusDot')).toHaveClass(/busy/);
  await expect(page.locator('#statusDot')).toHaveCSS('animation-name', 'none');
  await expect(page.locator('#status')).toContainText('stations comparées');
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
    await expect(page.locator('#status')).toContainText('stations comparées');
    await expect(page.locator('.price')).toHaveCount(3);
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
    await expect(page.locator('#status')).toContainText('stations comparées');
    await expect(page.locator('.price')).toHaveCount(3);
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
  await page.locator('#start').press('Enter');
  await page.locator('#end').press('Enter');
  await expect(page.locator('#status')).toContainText('stations comparées');
  expect(requests).toBe(2);
  await expect(page.locator('#goBtn')).toBeEnabled();
});
