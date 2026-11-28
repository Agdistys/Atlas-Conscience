import { test } from 'node:test';
import assert from 'node:assert/strict';
import { projects, requiredScenarios, summarize, writeReport } from './inspection-report.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { passingCompatibility } from './helpers/compatibility-proof.mjs';
import { passingToolchain } from './helpers/toolchain-proof.mjs';

const stages = Object.fromEntries(['contract', 'syntax', 'report-tests', 'toolchain', 'browser'].map(name => [name, { exitCode: 0 }]));
function passing() {
  return { suites: [{ specs: requiredScenarios.map(title => ({ title, tests: projects.map(projectName => ({
    projectName, status: 'expected', results: [{ status: 'passed' }]
  })) })) }], errors: [] };
}
test('complete success is eligible for inspection', () => assert.equal(summarize(passing(), stages).ready, true));
test('extra scenarios are allowed but cannot replace or duplicate required ones', () => {
  const report = passing();
  const extra = structuredClone(report.suites[0].specs[0]);
  extra.title = 'Additional coverage';
  report.suites[0].specs.push(extra);
  assert.equal(summarize(report, stages).ready, true);
  report.suites[0].specs[0].tests.pop();
  assert.equal(summarize(report, stages).ready, false);
  const duplicate = passing();
  duplicate.suites[0].specs.push(structuredClone(duplicate.suites[0].specs[0]));
  assert.equal(summarize(duplicate, stages).ready, false);
  const renamed = passing();
  renamed.suites[0].specs[0].title = 'Replacement';
  assert.equal(summarize(renamed, stages).ready, false);
});
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

test('complete evidence is required and audit violations block publication readiness', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'inspectrice-evidence-'));
  try {
    const report = passing();
    for (const [i, state] of ['demarrage', 'resultats'].entries()) {
      for (const item of report.suites[0].specs[i].tests) {
        item.results[0].attachments = [
          { name: state, contentType: 'image/png', body: Buffer.from('fixture-only').toString('base64') },
          { name: `accessibilite-${state}`, contentType: 'application/json',
            body: Buffer.from(JSON.stringify({ violations: [], incomplete: [], passes: [{}] })).toString('base64') }
        ];
      }
    }
    fs.mkdirSync(path.join(root, 'quality'));
    fs.writeFileSync(path.join(root, 'quality/stages.json'), JSON.stringify(stages));
    fs.writeFileSync(path.join(root, 'quality/compatibility-status.json'), JSON.stringify(passingCompatibility()));
    const runtimeFile=path.join(root,'quality/toolchain-status.json');
    fs.writeFileSync(runtimeFile,JSON.stringify(passingToolchain()));
    const save = () => fs.writeFileSync(path.join(root, 'quality/browser-results.json'), JSON.stringify(report));
    save();
    assert.equal(writeReport(root, { publishSummary: false }).state, 'inspection');
    // File attachments retain audit detail and remain mandatory evidence.
    const attachment=report.suites[0].specs[0].tests[0].results[0].attachments[1];
    const body=attachment.body;
    const auditPath=path.join(root,'quality/audit-file.json');
    const audit={violations:[],incomplete:[{id:'manual-check',nodes:[{html:'<button>Choisir</button>'}]}],passes:[{id:'label'},{id:'contrast'}]};
    fs.writeFileSync(auditPath,JSON.stringify(audit));
    delete attachment.body;attachment.path=auditPath;save();
    const fileProof=writeReport(root,{publishSummary:false});
    assert.equal(fileProof.state,'inspection');
    assert.deepEqual(fileProof.accessibility[0].incomplete,audit.incomplete);
    assert.equal(fileProof.accessibility[0].rulesPassed,2);
    fs.rmSync(auditPath);
    assert.equal(writeReport(root,{publishSummary:false}).state,'blocked');
    fs.writeFileSync(auditPath,'{invalid');
    assert.equal(writeReport(root,{publishSummary:false}).state,'blocked');
    fs.writeFileSync(auditPath,JSON.stringify({...audit,violations:[{id:'label'}]}));
    assert.equal(writeReport(root,{publishSummary:false}).state,'blocked');
    attachment.body=body;delete attachment.path;save();
    assert.equal(writeReport(root,{publishSummary:false}).state,'inspection');
    for(const bad of [null,passingToolchain('old-commit'),{...passingToolchain(),browser:null},{...passingToolchain(),dependencies:{...passingToolchain().dependencies,'@playwright/test':'1.0.0'}}]) {
      fs.writeFileSync(runtimeFile,JSON.stringify(bad));
      assert.equal(writeReport(root,{publishSummary:false}).state,'blocked');
    }
    fs.writeFileSync(runtimeFile,JSON.stringify(passingToolchain()));
    const compatFile = path.join(root, 'quality/compatibility-status.json');
    fs.rmSync(compatFile);
    assert.equal(writeReport(root, { publishSummary: false }).state, 'blocked');
    fs.writeFileSync(compatFile, JSON.stringify(passingCompatibility('other-commit')));
    assert.equal(writeReport(root, { publishSummary: false }).state, 'blocked');
    fs.writeFileSync(compatFile, JSON.stringify(passingCompatibility()));
    report.suites[0].specs[0].tests[0].results[0].attachments[1].body =
      Buffer.from(JSON.stringify({ violations: [{ id: 'label' }], incomplete: [], passes: [] })).toString('base64');
    save();
    assert.equal(writeReport(root, { publishSummary: false }).state, 'blocked');
    report.suites[0].specs[0].tests[0].results[0].attachments = [];
    save();
    assert.equal(writeReport(root, { publishSummary: false }).state, 'blocked');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
