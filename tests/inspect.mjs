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
// The 1,824-scenario suite exceeded 28 minutes on a hosted runner.
// Keep a 45-minute suite bound and reserve setup/report/upload time in the job.
// Individual test timeouts and the requirement for a complete report are unchanged.
run('browser', process.execPath, ['node_modules/@playwright/test/cli.js', 'test'], 2_700_000);
process.exitCode = writeReport(process.cwd(), { publishSummary: false }).state === 'inspection' ? 0 : 1;
