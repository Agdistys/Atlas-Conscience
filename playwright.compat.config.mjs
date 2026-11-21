import { defineConfig } from '@playwright/test';
import { compatibilityCases, compatibilityMatrix } from './tests/compatibility-contract.mjs';
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /(?:route-validation|dragonroute|route-variants|map-stations|prepared-trips|reading-layout|mode-access|walking|cycling|cycling-saved|transit-direct|transit-saved|transit-freshness|shared-bike-trip|shared-bike-saved|road-choices|station-window|transit-comparison|carpool|journal|station-no-path|preparation-readability|station-pages|map-list|priorities|prepared-priorities|modal-priorities|comparison-records|service-quotas|routing-quotas)\.spec\.mjs$/,
  grep: new RegExp(`(?:${compatibilityCases.map(escape).join('|')})$`),
  timeout: 60_000, expect: { timeout: 8_000 }, globalTimeout: 720_000,
  retries: 0, workers: 2, fullyParallel: false,
  outputDir: 'quality/compatibility-results',
  reporter: [['list'], ['json', { outputFile: 'quality/compatibility-results.json' }],
    ['html', { outputFolder: 'quality/compatibility-report', open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:4173', serviceWorkers: 'block', locale: 'fr-FR',
    timezoneId: 'Europe/Paris', trace: 'retain-on-failure', screenshot: 'only-on-failure', video: 'off' },
  webServer: { command: 'node tests/helpers/compatibility-server.mjs', url: 'http://127.0.0.1:4173/DragonRoute/', reuseExistingServer: false, timeout: 20_000 },
  projects: compatibilityMatrix.map(row => ({ name: row.name, metadata: { readingViewport: row.readingViewport },
    // Firefox has no isMobile emulation. Both engines use the same CSS viewport;
    // touch in WebKit is an additional input check, never an iPhone claim.
    use: { browserName: row.engine, viewport: row.viewport, deviceScaleFactor: 1,
      hasTouch: row.engine === 'webkit' && row.viewport.width === 390 } }))
});
