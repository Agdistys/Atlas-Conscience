import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/preview-e2e',
  outputDir: 'preview-test-results',
  reporter: [['list']],
  timeout: 30_000,
  retries: 0,
  use: { baseURL: 'http://127.0.0.1:4173', serviceWorkers: 'block' },
  webServer: { command: 'python3 -m http.server 4173 --bind 127.0.0.1', url: 'http://127.0.0.1:4173/preview-site/', reuseExistingServer: false },
  projects: [
    { name: 'preview-mobile', use: { viewport: { width: 390, height: 844 } } },
    { name: 'preview-desktop', use: { viewport: { width: 1440, height: 900 } } }
  ]
});
