import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('cache upgrade preserves other applications and the current shell', async () => {
  const listeners = {};
  const removed = [];
  let claimed = false;
  const source = fs.readFileSync(new URL('../DragonRoute/service-worker.js', import.meta.url), 'utf8');
  vm.runInNewContext(source, {
    self: { addEventListener: (name, callback) => { listeners[name] = callback; },
      clients: { claim: async () => { claimed = true; } } },
    caches: {
      keys: async () => ['dragonroute-v3-shell-1', 'dragonroute-v3-shell-2', 'agora-v1', 'autre-cache'],
      delete: async name => { removed.push(name); return true; }
    }
  });
  let activation;
  listeners.activate({ waitUntil: promise => { activation = promise; } });
  await activation;
  assert.deepEqual(removed, ['dragonroute-v3-shell-1']);
  assert.equal(claimed, true);
});
