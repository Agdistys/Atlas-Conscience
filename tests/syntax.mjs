import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? files(file) : /\.(mjs|cjs|js)$/.test(file) ? [file] : [];
  });
}
let failed = false;
for (const file of [...files('DragonRoute'), ...files('tests'), 'playwright.config.mjs', 'playwright.preview.config.mjs']) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) failed = true;
}
process.exitCode = failed ? 1 : 0;
