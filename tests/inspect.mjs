import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { writeReport } from './inspection-report.mjs';

fs.mkdirSync('quality', { recursive: true });
// A missing browser run must never reuse a successful report from a previous run.
fs.rmSync('quality/browser-results.json', { force: true });
const stages = {};
fs.writeFileSync('quality/stages.json', '{}');
function run(name, command, args, timeout = 600_000) {
  const result = spawnSync(command, args, { stdio: 'inherit', timeout });
  stages[name] = { exitCode: result.status ?? 1, error: result.error?.message || null };
  fs.writeFileSync('quality/stages.json', JSON.stringify(stages, null, 2));
}
run('contract', process.execPath, ['tests/repo-contract.mjs']);
run('syntax', process.execPath, ['tests/syntax.mjs']);
run('report-tests', 'npm', ['run', 'test:inspection']);
run('toolchain', process.execPath, ['tests/toolchain.mjs']);
// The 4,100-scenario run reached 95 minutes with 3,931 cases finished on a slow runner.
// CI uses up to four workers; reserve ten job minutes for setup, reports and artifacts.
// Per-case limits, retries and the complete-report requirement are unchanged.
run('browser', process.execPath, ['node_modules/@playwright/test/cli.js', 'test'], 6_600_000);
process.exitCode = writeReport(process.cwd(), { publishSummary: false }).state === 'inspection' ? 0 : 1;
