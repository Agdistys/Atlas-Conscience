import fs from 'node:fs';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { firefox, webkit } from '@playwright/test';
import { compatibilityMatrix, compatibilityLimits, validCompatibility } from './compatibility-contract.mjs';

fs.mkdirSync('quality', { recursive: true });
for (const name of ['compatibility-status.json', 'compatibility-results.json']) fs.rmSync(`quality/${name}`, { force: true });
const versions = {}, errors = [];
for (const [name, type] of Object.entries({ firefox, webkit })) {
  let browser;
  try { browser = await type.launch(); versions[name] = browser.version(); }
  catch (error) { errors.push(`${name}: ${error.message}`); }
  finally { await browser?.close(); }
}
const result = errors.length ? { status: 1 } : spawnSync(process.execPath,
  // Let Playwright finish and write its report before the outer process is stopped.
  ['node_modules/@playwright/test/cli.js', 'test', '--config=playwright.compat.config.mjs'], { stdio: 'inherit', timeout: 1_140_000 });
let report;
try { report = JSON.parse(fs.readFileSync('quality/compatibility-results.json', 'utf8')); }
catch (error) { errors.push(error.message); }
const tests = [];
function visit(suite) {
  for (const spec of suite.specs || []) for (const test of spec.tests || []) tests.push({ title: spec.title,
    project: test.projectName, attempts: test.results?.length || 0,
    passed: test.status === 'expected' && test.results?.length === 1 && test.results[0].status === 'passed' });
  for (const child of suite.suites || []) visit(child);
}
if (report) visit(report);
const proof = { schemaVersion: 1, generatedAt: new Date().toISOString(),
  commit: process.env.INSPECTION_COMMIT || spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim(),
  playwright: JSON.parse(fs.readFileSync('node_modules/@playwright/test/package.json')).version,
  platform: `${os.platform()} ${os.release()} ${os.arch()}`, runnerExitCode: result.status ?? 1,
  errors: [...errors, ...(report?.errors || []), ...(result.error ? [result.error.message] : [])],
  matrix: compatibilityMatrix.map(row => ({ ...row, version: versions[row.engine] || '',
    cases: tests.filter(test => test.project === row.name) })), limits: compatibilityLimits, state: 'passed' };
if (!validCompatibility(proof, proof.commit)) proof.state = 'blocked';
fs.writeFileSync('quality/compatibility-status.json', JSON.stringify(proof, null, 2));
if (proof.errors.length) console.error(JSON.stringify(proof.errors, null, 2));
console.log(`Compatibilité : ${proof.state}, ${tests.filter(t => t.passed).length}/${tests.length}`);
process.exitCode = proof.state === 'passed' ? 0 : 1;
