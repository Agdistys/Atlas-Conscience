import { test, expect } from '@playwright/test';
import { mockDragonRoute } from '../helpers/dragonroute.mjs';

test('version testable, identifiee et sans installation PWA', async ({ page }) => {
  await mockDragonRoute(page);
  await page.addInitScript(() => {
    window.registrationAttempts = 0;
    if (navigator.serviceWorker) navigator.serviceWorker.register = async () => { window.registrationAttempts++; throw new Error('Installation interdite dans un apercu'); };
  });
  await page.goto('/preview-site/');
  await expect(page.locator('#hJS')).toHaveText('JS ✓');
  await expect(page.locator('body')).toHaveAttribute('data-preview', 'true');
  await expect(page.locator('footer')).toContainText("Version d'essai");
  await expect(page.locator('link[rel=manifest]')).toHaveCount(0);
  await page.locator('#goBtn').click();
  await expect(page.locator('#status')).toContainText('Trajet prêt');
  await page.locator('#stationsBtn').click();
  await expect(page.locator('#fuelStatus')).toContainText('stations comparées');
  expect(await page.evaluate(() => window.registrationAttempts)).toBe(0);
  await page.getByRole('link', { name: "Rapport d'inspection" }).click();
  await expect(page.locator('h1')).toHaveText('Inspectrice v2');
});
