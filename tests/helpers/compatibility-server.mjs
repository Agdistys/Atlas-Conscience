import http from 'node:http';
import fs from 'node:fs/promises';
// Only the app's static files, on loopback. No Python or extra package in CI.
const files = new Map([
  ['index.html', 'text/html; charset=utf-8'], ['app.js', 'text/javascript'],
  ['config.js', 'text/javascript'], ['style.css', 'text/css'],
  ['manifest.webmanifest', 'application/manifest+json'],
  ['icons/icon-192.png', 'image/png'], ['icons/icon-512.png', 'image/png']
]);
http.createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
    const name = pathname === '/DragonRoute/' ? 'index.html' : pathname.slice('/DragonRoute/'.length);
    if (!['GET', 'HEAD'].includes(req.method) || !pathname.startsWith('/DragonRoute/') || !files.has(name)) {
      res.writeHead(404); res.end(); return;
    }
    const body = await fs.readFile(new URL('../../DragonRoute/' + name, import.meta.url));
    res.writeHead(200, { 'Content-Type': files.get(name), 'Cache-Control': 'no-store' });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch { res.writeHead(500); res.end(); }
}).listen(4173, '127.0.0.1');
