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
// The 2,796-scenario suite took 54.7 minutes on the hosted runner.
// Allow 65 minutes, with five minutes left for setup/report/upload in the job.
// Individual test timeouts and the requirement for a complete report are unchanged.
run('browser', process.execPath, ['node_modules/@playwright/test/cli.js', 'test'], 3_900_000);
process.exitCode = writeReport(process.cwd(), { publishSummary: false }).state === 'inspection' ? 0 : 1;
