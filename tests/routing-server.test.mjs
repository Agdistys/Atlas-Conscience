import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createRoutingServer, buildRequest, cleanRoutes } from '../server/routing.mjs';
import { orsResponse } from './helpers/dragonroute.mjs';

const origin = 'https://agdistys.github.io', secret = 'fake-server-only-not-a-real-key';
const input = () => ({ coordinates: [[4.8, 45.7], [4.9, 44.9]], avoid: ['tollways'], vehicle: { type: 'car' }, alternatives: false });
async function fixture(t, options = {}) {
  const calls = [];
  const server = createRoutingServer({ key: secret, origins: [origin], dailyLimit: 100, perMinute: 30,
    fetchImpl: async (url, init) => { calls.push({ url, init }); return Response.json(orsResponse(JSON.parse(init.body))); }, ...options });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });
  const url = `http://127.0.0.1:${server.address().port}`;
  const post = (data = input(), headers = {}, path = '/api/route') => fetch(url + path, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(data) });
  return { post, url, calls };
}

test('public routing keeps authorization only on the fixed upstream and strips metadata', async t => {
  const { post, calls } = await fixture(t);
  const res = await post(); assert.equal(res.status, 200);
  assert.equal(res.headers.get('cache-control'), 'no-store'); assert.equal(res.headers.get('access-control-allow-origin'), origin);
  assert.equal(calls[0].url, 'https://api.heigit.org/openrouteservice/v2/directions/driving-car/geojson');
  assert.equal(calls[0].init.headers.Authorization, secret); assert.equal(calls[0].init.redirect, 'error');
  assert.deepEqual(JSON.parse(calls[0].init.body).options.avoid_features, ['tollways']);
  assert.ok(!(await res.text()).includes(secret));
  const data = orsResponse(input()); data.metadata = { secret }; data.features[0].properties.extra = secret;
  assert.ok(!JSON.stringify(cleanRoutes(data, 2)).includes(secret));
});

test('hgv dimensions apply to direct, via and alternative requests', () => {
  const dimensions = { length: 16, width: 2.5, height: 3.8, weight: 32, axleload: 10 };
  for (const data of [input(), { ...input(), alternatives: true }, { ...input(), coordinates: [[4.8, 45.7], [4.85, 45], [4.9, 44.9]] }]) {
    data.vehicle = { type: 'truck', dimensions }; const request = buildRequest(data);
    assert.equal(request.profile, 'driving-hgv'); assert.equal(request.body.options.vehicle_type, 'hgv');
    assert.deepEqual(request.body.options.profile_params.restrictions, dimensions);
  }
});

test('request schema rejects arbitrary endpoints, profiles, malformed bounds and unknown options', () => {
  const invalid = [{ ...input(), url: 'https://evil.test' }, { ...input(), coordinates: [[200, 0], [4, 4]] },
    { ...input(), coordinates: [[4, 4], [4, 4], [4, 4], [4, 4]] }, { ...input(), avoid: ['unpaved'] },
    { ...input(), avoid: ['tollways', 'tollways'] }, { ...input(), alternatives: 'true' },
    ...['caravan', 'van', 'foot-walking'].map(type => ({ ...input(), vehicle: { type } })),
    { ...input(), vehicle: { type: 'truck' } }, { ...input(), vehicle: { type: 'car', dimensions: {} } }];
  for (const data of invalid) assert.throws(() => buildRequest(data));
  const dimensions = { length: 16, width: 2.5, height: 3.8, weight: 32, axleload: 10 };
  for (const key of Object.keys(dimensions)) for (const value of [null, 0, -1, '2', Infinity, 999]) {
    assert.throws(() => buildRequest({ ...input(), vehicle: { type: 'truck', dimensions: { ...dimensions, [key]: value } } }));
  }
  assert.throws(() => buildRequest({ ...input(), vehicle: { type: 'truck', dimensions: { ...dimensions, weight: 5 } } }));
});

test('unconfigured server fails closed with no upstream request', async t => {
  const { post, calls, url } = await fixture(t, { key: '' });
  assert.equal((await post()).status, 503); assert.equal((await fetch(url + '/health')).status, 503); assert.equal(calls.length, 0);
});

test('origin, method, path, encoding and body limits are enforced', async t => {
  const { post, calls, url } = await fixture(t);
  assert.equal((await post(input(), { Origin: 'https://evil.test' })).status, 403);
  assert.equal((await post(input(), {}, '/api/route?key=x')).status, 404);
  assert.equal((await post(input(), { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await post(input(), { 'Content-Encoding': 'gzip' })).status, 415);
  assert.equal((await post({ padding: 'x'.repeat(9000) })).status, 413);
  assert.equal((await fetch(url + '/api/route', { headers: { Origin: origin } })).status, 405);
  const preflight = await fetch(url + '/api/route', { method: 'OPTIONS', headers: { Origin: origin } });
  assert.equal(preflight.status, 204); assert.equal(preflight.headers.get('access-control-allow-headers'), 'Content-Type');
  assert.equal(calls.length, 0);
});

test('daily budget bounds upstream calls even when origin can be spoofed', async t => {
  const { post, calls } = await fixture(t, { dailyLimit: 1 });
  assert.equal((await post()).status, 200);
  assert.equal((await post()).status, 429); assert.equal(calls.length, 1);
});

test('minute limit expires without bypassing the daily budget', async t => {
  let now = Date.parse('2026-09-18T10:00:00Z');
  const { post, calls } = await fixture(t, { perMinute: 1, dailyLimit: 2, now: () => now });
  assert.equal((await post()).status, 200); assert.equal((await post()).status, 429);
  now += 61000; assert.equal((await post()).status, 200);
  now += 61000; assert.equal((await post()).status, 429); assert.equal(calls.length, 2);
  now += 86400000; assert.equal((await post()).status, 200);
});

test('upstream errors never expose credentials or provider prose', async t => {
  let status = 403, code;
  const { post } = await fixture(t, { fetchImpl: async () => Response.json({ error: { code, message: secret } }, { status }) });
  for (const [http, expected, error] of [[403, 503, 'UPSTREAM_ACCESS'], [429, 429, 'UPSTREAM_LIMIT'], [500, 502, 'UPSTREAM_UNAVAILABLE'], [404, 422, 'NO_ROUTE']]) {
    status = http; code = http === 404 ? 2009 : undefined;
    const res = await post(); assert.equal(res.status, expected); assert.deepEqual(await res.json(), { error: { code: error } });
  }
});

test('invalid geometry, metrics, warnings and leg totals are rejected', () => {
  for (const corrupt of [d => { d.features[0].geometry = null; }, d => { d.features[0].properties.summary.distance = NaN; },
    d => { d.features[0].properties.segments = []; }, d => { d.features[0].properties.warnings = [{ message: secret }]; },
    d => { d.features[0].properties.segments[0].distance += 10; }]) {
    const data = orsResponse(input()); corrupt(data); assert.throws(() => cleanRoutes(data, 2));
  }
});

test('timeout aborts the upstream and releases concurrency slot', async t => {
  let fail = true;
  const { post } = await fixture(t, { timeoutMs: 20, fetchImpl: async (_, init) => {
    if (!fail) return Response.json(orsResponse(JSON.parse(init.body)));
    await new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(new Error('private error')), { once: true }));
  } });
  assert.equal((await post()).status, 504); fail = false; assert.equal((await post()).status, 200);
});

test('concurrent requests cannot exceed the upstream concurrency cap', async t => {
  let release, entered;
  const ready = new Promise(resolve => { entered = resolve; });
  const { post } = await fixture(t, { fetchImpl: async (_, init) => {
    entered(); await new Promise(resolve => { release = resolve; }); return Response.json(orsResponse(JSON.parse(init.body)));
  } });
  const first = post(); await ready; assert.equal((await post()).status, 429); release(); assert.equal((await first).status, 200);
});
