import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validCompatibility, compatibilityRoadCases, compatibilityModeCases, compatibilityJourneyCases } from './compatibility-contract.mjs';
import { passingCompatibility } from './helpers/compatibility-proof.mjs';
test('compatibility needs exactly one passing attempt per case and project, same commit and identified engines', () => {
  const sha = 'a'.repeat(40);
  assert.equal(validCompatibility(passingCompatibility(sha), sha), true);
  assert.equal(validCompatibility(null, sha), false);
  for (const mutate of [
    p => p.commit = 'b'.repeat(40), p => p.matrix.pop(), p => p.matrix.push(p.matrix[0]),
    p => p.matrix[0].cases.pop(), p => p.matrix[0].cases[0].title = 'replacement',
    p => p.matrix[0].cases.push(p.matrix[0].cases[0]), p => p.matrix[0].cases[0].passed = false,
    p => p.matrix[0].cases[0].attempts = 2, p => p.matrix[0].version = '',
    p => p.matrix[0].engine = 'chromium', p => p.matrix[0].viewport.width = 1,
    p => p.runnerExitCode = 1, p => p.errors.push('crash')
  ]) { const proof = structuredClone(passingCompatibility(sha)); mutate(proof); assert.equal(validCompatibility(proof, sha), false); }
});

test('compatibility requires autonomous modes in every engine and format; the old road-only proof is insufficient', () => {
  const sha='a'.repeat(40), proof=passingCompatibility(sha);
  assert.equal(compatibilityRoadCases.length,24);
  assert.equal(compatibilityModeCases.length,22);
  for(const row of proof.matrix)row.cases=row.cases.filter(c=>compatibilityRoadCases.includes(c.title));
  assert.equal(validCompatibility(proof,sha),false);
  for(const title of compatibilityModeCases){
    const incomplete=passingCompatibility(sha);
    incomplete.matrix.at(-1).cases=incomplete.matrix.at(-1).cases.filter(c=>c.title!==title);
    assert.equal(validCompatibility(incomplete,sha),false,title);
  }
});


test('compatibility retains every complete reference journey; the previous 40-case proof is insufficient', () => {
  const sha='a'.repeat(40), proof=passingCompatibility(sha);
  assert.equal(compatibilityJourneyCases.length,41);
  for(const row of proof.matrix)row.cases=row.cases.filter(c=>!compatibilityJourneyCases.includes(c.title));
  assert.equal(validCompatibility(proof,sha),false);
  for(const title of compatibilityJourneyCases){
    const incomplete=passingCompatibility(sha);
    incomplete.matrix.at(-1).cases=incomplete.matrix.at(-1).cases.filter(c=>c.title!==title);
    assert.equal(validCompatibility(incomplete,sha),false,title);
  }
});
