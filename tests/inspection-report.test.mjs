import { test } from 'node:test';
import assert from 'node:assert/strict';
import { projects, summarize, writeReport } from './inspection-report.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const stages = Object.fromEntries(['contract', 'syntax', 'report-tests', 'browser'].map(name => [name, { exitCode: 0 }]));
function passing() {
  return { suites: [{ specs: Array.from({ length: 4 }, (_, i) => ({ title: `Test ${i}`, tests: projects.map(projectName => ({
    projectName, status: 'expected', results: [{ status: 'passed' }]
  })) })) }], errors: [] };
}
test('complete success is eligible for inspection', () => assert.equal(summarize(passing(), stages).ready, true));
test('missing, skipped, flaky and crashed runs cannot be green', () => {
  assert.equal(summarize(null, stages).ready, false);
  assert.equal(summarize(passing(), {}).ready, false);
  for (const status of ['skipped', 'failed', 'timedOut', 'interrupted']) {
    const report = passing();
    report.suites[0].specs[0].tests[0].results[0].status = status;
    assert.equal(summarize(report, stages).ready, false);
  }
  const report = passing();
  report.suites[0].specs[0].tests[0].status = 'flaky';
  assert.equal(summarize(report, stages).ready, false);
  const crash = passing();
  crash.errors.push({ message: 'Browser crashed' });
  assert.equal(summarize(crash, stages).ready, false);
});
test('a failed prerequisite blocks otherwise passing browser tests', () => {
  assert.equal(summarize(passing(), { ...stages, contract: { exitCode: 1 } }).ready, false);
});
test('passing tests without evidence still generate a blocked HTML report', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'inspectrice-test-'));
  const saved = process.env.GITHUB_STEP_SUMMARY;
  delete process.env.GITHUB_STEP_SUMMARY;
  try {
    fs.mkdirSync(path.join(root, 'quality'));
    fs.writeFileSync(path.join(root, 'quality/browser-results.json'), JSON.stringify(passing()));
    fs.writeFileSync(path.join(root, 'quality/stages.json'), JSON.stringify(stages));
    assert.equal(writeReport(root).state, 'blocked');
    assert.match(fs.readFileSync(path.join(root, 'quality/inspection.html'), 'utf8'), /CONTROLES INCOMPLETS/);
  } finally {
    if (saved !== undefined) process.env.GITHUB_STEP_SUMMARY = saved;
    fs.rmSync(root, { recursive: true, force: true });
  }
});
