import { compatibilityCases, compatibilityMatrix } from '../compatibility-contract.mjs';
// Synthetic evidence only for testing the publication gate; never a browser qualification.
export function passingCompatibility(commit = process.env.INSPECTION_COMMIT || process.env.GITHUB_SHA || null) {
  return { schemaVersion: 1, commit, state: 'passed', runnerExitCode: 0, errors: [],
    playwright: 'test-fixture', platform: 'test-fixture',
    matrix: compatibilityMatrix.map(row => ({ ...row, version: 'test-fixture',
      cases: compatibilityCases.map(title => ({ title, passed: true, attempts: 1 })) })) };
}
