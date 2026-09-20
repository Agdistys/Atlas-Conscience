import http from 'node:http';
import { pathToFileURL } from 'node:url';

const fail = (status, code) => Object.assign(new Error(code), { status, code, controlled: true });
const fields = ['length', 'width', 'height', 'weight', 'axleload'];
const limits = [40, 6, 6, 100, 30];
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const exact = (value, keys) => object(value) && Object.keys(value).every(key => keys.includes(key));

export function buildRequest(data) {
  if (!exact(data, ['coordinates', 'avoid', 'vehicle', 'alternatives'])) throw fail(400, 'INVALID_REQUEST');
  if (!Array.isArray(data.coordinates) || ![2, 3].includes(data.coordinates.length) ||
      !data.coordinates.every(p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite) && Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 90)) throw fail(400, 'INVALID_COORDINATES');
  if (!Array.isArray(data.avoid) || data.avoid.length > 3 || new Set(data.avoid).size !== data.avoid.length ||
      !data.avoid.every(x => ['tollways', 'highways', 'ferries'].includes(x))) throw fail(400, 'INVALID_AVOID');
  if (typeof data.alternatives !== 'boolean' || (data.alternatives && data.coordinates.length !== 2)) throw fail(400, 'INVALID_ALTERNATIVES');
  const vehicle = data.vehicle;
  if (!exact(vehicle, ['type', 'dimensions']) || !['car', 'truck'].includes(vehicle.type)) throw fail(400, 'INVALID_VEHICLE');
  const options = { avoid_features: data.avoid };
  if (vehicle.type === 'truck') {
    const d = vehicle.dimensions;
    if (!exact(d, fields) || fields.some((key, i) => !Number.isFinite(d[key]) || d[key] <= 0 || d[key] > limits[i]) || d.axleload > d.weight) throw fail(400, 'INVALID_DIMENSIONS');
    options.vehicle_type = 'hgv';
    options.profile_params = { restrictions: Object.fromEntries(fields.map(key => [key, d[key]])) };
  } else if (vehicle.dimensions !== undefined) throw fail(400, 'INVALID_DIMENSIONS');
  return {
    profile: vehicle.type === 'truck' ? 'driving-hgv' : 'driving-car',
    body: { coordinates: data.coordinates, preference: 'fastest', units: 'm', instructions: false,
      radiuses: data.coordinates.map(() => 200), options,
      ...(data.alternatives ? { alternative_routes: { target_count: 2 } } : {}) }
  };
}

// Return only geometry and numeric metrics, never upstream metadata or messages.
export function cleanRoutes(data, count) {
  if (!Array.isArray(data?.features) || !data.features.length || data.features.length > 3) throw fail(502, 'INVALID_UPSTREAM');
  return { type: 'FeatureCollection', features: data.features.map(f => {
    const p = f.properties, g = f.geometry;
    if (g?.type !== 'LineString' || !Array.isArray(g.coordinates) || g.coordinates.length < 2 || g.coordinates.length > 100000 ||
        !g.coordinates.every(c => Array.isArray(c) && c.length >= 2 && Number.isFinite(c[0]) && Number.isFinite(c[1]) && Math.abs(c[0]) <= 180 && Math.abs(c[1]) <= 90) ||
        !Array.isArray(p?.segments) || p.segments.length !== count - 1 || p.warnings?.length) throw fail(502, 'INVALID_UPSTREAM');
    const metrics = v => {
      if (![v?.distance, v?.duration].every(n => Number.isFinite(n) && n >= 0)) throw fail(502, 'INVALID_UPSTREAM');
      return { distance: v.distance, duration: v.duration };
    };
    const summary = metrics(p.summary), segments = p.segments.map(metrics);
    if (['distance', 'duration'].some(key => Math.abs(segments.reduce((sum, s) => sum + s[key], 0) - summary[key]) > 2)) throw fail(502, 'INVALID_UPSTREAM');
    return { type: 'Feature', geometry: { type: 'LineString', coordinates: g.coordinates.map(c => c.slice(0, 2)) }, properties: { summary, segments } };
  }) };
}

async function readLimited(stream, max) {
  const chunks = []; let bytes = 0;
  for await (const chunk of stream) {
    bytes += chunk.length;
    if (bytes > max) throw fail(413, 'BODY_TOO_LARGE');
    chunks.push(Buffer.from(chunk));
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw fail(400, 'INVALID_JSON'); }
}

export function createRoutingServer({ key = '', origins = [], dailyLimit = 0, perMinute = 30,
  fetchImpl = fetch, now = Date.now, timeoutMs = 20000 } = {}) {
  if (!Array.isArray(origins) || origins.some(origin => {
    try { const url = new URL(origin); return url.origin !== origin || !(url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))); }
    catch { return true; }
  })) throw new Error('Explicit HTTPS origins required (HTTP loopback allowed for development).');
  if (![dailyLimit, perMinute].every(n => Number.isSafeInteger(n) && n >= 0) || !Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error('Invalid server limits.');
  let day = '', daily = 0, calls = [], active = false;
  const configured = /^[!-~]{8,512}$/.test(key) && origins.length > 0 && dailyLimit > 0 && perMinute > 0;
  const server = http.createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer'); res.setHeader('Vary', 'Origin');
    const reply = (status, value) => { if (!res.destroyed) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(value)); } };
    if (req.url === '/health' && req.method === 'GET') return reply(configured ? 200 : 503, { configured });
    if (req.url !== '/api/route') return reply(404, { error: { code: 'NOT_FOUND' } });
    if (!origins.includes(req.headers.origin)) return reply(403, { error: { code: 'ORIGIN_REFUSED' } });
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'POST'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.writeHead(204); return res.end();
    }
    if (req.method !== 'POST') return reply(405, { error: { code: 'METHOD_REFUSED' } });
    if (!configured) return reply(503, { error: { code: 'NOT_CONFIGURED' } });
    const abort = new AbortController();
    const disconnect = () => { if (!res.writableEnded) abort.abort(); };
    res.on('close', disconnect);
    let timer, acquired = false;
    try {
      if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) throw fail(415, 'JSON_REQUIRED');
      if (req.headers['content-encoding']) throw fail(415, 'ENCODING_REFUSED');
      if (Number(req.headers['content-length']) > 8192) throw fail(413, 'BODY_TOO_LARGE');
      const input = await readLimited(req, 8192), upstream = buildRequest(input);
      if (abort.signal.aborted) return;
      const time = now(), today = new Date(time).toISOString().slice(0, 10);
      if (today !== day) { day = today; daily = 0; }
      calls = calls.filter(t => t > time - 60000);
      if (daily >= dailyLimit) throw fail(429, 'DAILY_LIMIT');
      if (active || calls.length >= perMinute) { res.setHeader('Retry-After', '60'); throw fail(429, 'BUSY'); }
      active = true; acquired = true; calls.push(time); daily++;
      timer = setTimeout(() => abort.abort(), timeoutMs);
      const response = await fetchImpl(`https://api.heigit.org/openrouteservice/v2/directions/${upstream.profile}/geojson`, {
        method: 'POST', headers: { Authorization: key, 'Content-Type': 'application/json', Accept: 'application/geo+json' },
        body: JSON.stringify(upstream.body), signal: abort.signal, redirect: 'error'
      });
      const data = await readLimited(response.body, 8 * 1024 * 1024).catch(() => { throw fail(502, 'INVALID_UPSTREAM'); });
      if (!response.ok || data?.error) {
        if ([2009, 2010].includes(data?.error?.code)) throw fail(422, 'NO_ROUTE');
        if (response.status === 429) throw fail(429, 'UPSTREAM_LIMIT');
        if ([401, 403].includes(response.status)) throw fail(503, 'UPSTREAM_ACCESS');
        throw fail(502, 'UPSTREAM_UNAVAILABLE');
      }
      reply(200, cleanRoutes(data, input.coordinates.length));
    } catch (error) {
      reply(error.controlled ? error.status : (abort.signal.aborted ? 504 : 502), { error: { code: error.controlled ? error.code : (abort.signal.aborted ? 'TIMEOUT' : 'UPSTREAM_UNAVAILABLE') } });
    } finally {
      clearTimeout(timer); res.removeListener('close', disconnect); if (acquired) active = false;
    }
  });
  server.requestTimeout = 10000; server.headersTimeout = 10000; server.maxConnections = 50;
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = createRoutingServer({ key: process.env.ORS_API_KEY,
    origins: (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean),
    dailyLimit: Number(process.env.ROUTING_DAILY_LIMIT || 0), perMinute: Number(process.env.ROUTING_PER_MINUTE || 30) });
  server.listen(Number(process.env.PORT || 8787), process.env.HOST || '127.0.0.1', () => console.log('Routing server started. No request logging.'));
}
