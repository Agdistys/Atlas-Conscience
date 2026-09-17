import { createRequire } from 'node:module';
import { expect } from '@playwright/test';

const require = createRequire(import.meta.url);

export async function capture(page, info, state) {
  const path = info.outputPath(`${state}.png`);
  await page.screenshot({ path, fullPage: true, animations: 'disabled' });
  await info.attach(state, { path, contentType: 'image/png' });
}

export async function checkAccessibility(page, info, state) {
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  const results = await page.evaluate(async () => window.axe.run(document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }
  }));
  await info.attach(`accessibilite-${state}`, {
    body: JSON.stringify(results, null, 2), contentType: 'application/json'
  });
  expect.soft(results.violations, 'Regles WCAG A/AA detectables automatiquement').toEqual([]);
}

export async function checkOverflow(page) {
  const problems = await page.evaluate(() => {
    const targets = [document.documentElement, document.querySelector('#sheet')];
    return targets.filter(e => e && e.scrollWidth > e.clientWidth + 1)
      .map(e => ({ element: e.id || e.tagName, width: e.clientWidth, content: e.scrollWidth }));
  });
  expect.soft(problems, 'Debordement horizontal du document ou du panneau').toEqual([]);
}
