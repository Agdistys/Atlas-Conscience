import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { buildPreview, assembleSite, previewFiles } from './preview.mjs';

const { planPages } = createRequire(import.meta.url)('./plan.cjs');
const sha = 'a'.repeat(40);
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ami-preview-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const file of previewFiles.filter(p => p !== 'preview.json')) {
    const target = path.join(root, file.startsWith('rapport/') ? 'quality/' + file.slice(8) : 'DragonRoute/' + file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, file === 'index.html' ? '<head></head><body><footer></footer></body>' : 'fixture');
  }
  fs.writeFileSync(path.join(root, 'quality/status.json'), JSON.stringify({ state: 'inspection', commit: sha }));
  return root;
}

test('preview contains only the app and evidence, with a visible identity and no PWA manifest', t => {
  const root = fixture(t), target = path.join(root, 'out');
  fs.writeFileSync(path.join(root, 'DragonRoute/unrelated.txt'), 'not part of preview');
  buildPreview(root, target, { commit: sha, pr: 3 });
  const html = fs.readFileSync(path.join(target, 'index.html'), 'utf8');
  assert.match(html, /data-preview="true"/);
  assert.match(html, /Version d'essai · PR 3/);
  assert.match(html, /noindex,nofollow/);
  assert.equal(fs.existsSync(path.join(target, 'unrelated.txt')), false);
  assert.equal(fs.existsSync(path.join(target, 'service-worker.js')), false);
  assert.equal(fs.existsSync(path.join(target, 'manifest.webmanifest')), false);
});

test('uninspected or mismatched content is refused', t => {
  const root = fixture(t);
  assert.throws(() => buildPreview(root, path.join(root, 'out'), { commit: 'b'.repeat(40), pr: 3 }), /meme commit/);
  fs.writeFileSync(path.join(root, 'quality/status.json'), JSON.stringify({ state: 'blocked', commit: sha }));
  assert.throws(() => buildPreview(root, path.join(root, 'out'), { commit: sha, pr: 3 }), /meme commit/);
});

test('assembly preserves public files, retains open previews and removes closed previews', t => {
  const root = fixture(t), incoming = path.join(root, 'incoming'), site = path.join(root, 'site'), cache = path.join(root, 'cache');
  buildPreview(root, incoming, { commit: sha, pr: 3 });
  fs.mkdirSync(site); fs.mkdirSync(cache);
  fs.writeFileSync(path.join(site, 'public.html'), 'public unchanged');
  fs.cpSync(incoming, path.join(cache, 'previews/pr-4'), { recursive: true });
  fs.cpSync(incoming, path.join(cache, 'previews/pr-2'), { recursive: true });
  fs.writeFileSync(path.join(incoming, 'extra.html'), 'not published');
  assembleSite(site, cache, incoming, { pr: 3, commit: sha, openPRs: [3, 4] });
  assert.equal(fs.readFileSync(path.join(site, 'public.html'), 'utf8'), 'public unchanged');
  assert.ok(fs.existsSync(path.join(site, 'previews/pr-3/index.html')));
  assert.ok(fs.existsSync(path.join(site, 'previews/pr-4/index.html')));
  assert.equal(fs.existsSync(path.join(site, 'previews/pr-2')), false);
  assert.equal(fs.existsSync(path.join(site, 'previews/pr-3/extra.html')), false);
});

test('assembly rejects stale evidence and symlinks', t => {
  const root = fixture(t), incoming = path.join(root, 'incoming'), site = path.join(root, 'site');
  buildPreview(root, incoming, { commit: sha, pr: 3 });
  fs.mkdirSync(site);
  assert.throws(() => assembleSite(site, root, incoming, { pr: 3, commit: 'b'.repeat(40), openPRs: [] }), /commit inspecte/);
  fs.unlinkSync(path.join(incoming, 'app.js'));
  fs.symlinkSync(path.join(root, 'DragonRoute/app.js'), path.join(incoming, 'app.js'));
  assert.throws(() => assembleSite(site, root, incoming, { pr: 3, commit: sha, openPRs: [] }), /ordinaire/);
});

function api({ green = true, source = 'Agdistys/Atlas-Conscience', state = 'open', commit = sha } = {}) {
  return { rest: {
    repos: { getBranch: async () => ({ data: { commit: { sha } } }) },
    actions: { listWorkflowRuns: async () => ({ data: { workflow_runs: [{ head_sha: sha, conclusion: green ? 'success' : 'failure' }] } }) },
    pulls: { list: () => {}, get: async () => ({ data: { state, base: { ref: 'main' }, head: { sha: commit, repo: { full_name: source } } } }) },
    git: { getRef: async () => { const error = new Error('Not found'); error.status = 404; throw error; } }
  }, paginate: async () => [{ number: 3 }] };
}
const context = { repo: { owner: 'Agdistys', repo: 'Atlas-Conscience' }, eventName: 'workflow_run', payload: {
  workflow_run: { event: 'pull_request', conclusion: 'success', head_sha: sha, head_repository: { full_name: 'Agdistys/Atlas-Conscience' }, pull_requests: [{ number: 3 }], id: 42 }
} };

test('publisher accepts only the current successful internal PR and validated main', async () => {
  const good = await planPages({ github: api(), context });
  assert.equal(good.publish, true); assert.equal(good.pr, 3); assert.equal(good.runId, 42);
  for (const options of [{ green: false }, { source: 'external/fork' }, { state: 'closed' }, { commit: 'b'.repeat(40) }]) {
    assert.equal((await planPages({ github: api(options), context })).publish, false);
  }
  assert.equal((await planPages({ github: api(), context: { ...context, eventName: 'pull_request_target' } })).publish, false);
});
