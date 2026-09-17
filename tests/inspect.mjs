import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { writeReport } from './inspection-report.mjs';

fs.mkdirSync('quality', { recursive: true });
// A missing browser run must never reuse a successful report from a previous run.
fs.rmSync('quality/browser-results.json', { force: true });
const stages = {};
fs.writeFileSync('quality/stages.json', '{}');
function run(name, command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', timeout: 600_000 });
  stages[name] = { exitCode: result.status ?? 1, error: result.error?.message || null };
  fs.writeFileSync('quality/stages.json', JSON.stringify(stages, null, 2));
}
run('contract', process.execPath, ['tests/repo-contract.mjs']);
run('syntax', process.execPath, ['tests/syntax.mjs']);
run('report-tests', process.execPath, ['--test', 'tests/inspection-report.test.mjs', 'tests/service-worker.test.mjs']);
run('browser', process.execPath, ['node_modules/@playwright/test/cli.js', 'test']);
process.exitCode = writeReport(process.cwd(), { publishSummary: false }).state === 'inspection' ? 0 : 1;
