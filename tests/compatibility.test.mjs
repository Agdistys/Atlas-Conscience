import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validCompatibility } from './compatibility-contract.mjs';
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
