import test from 'node:test';
import assert from 'node:assert/strict';
import { distRoot } from './helpers.mjs';
import { createStaticServer } from '../scripts/serve.mjs';

let server;
let base;

test.before(async () => {
  const started = await createStaticServer({ root: distRoot, host: '127.0.0.1', port: 0 });
  server = started.server;
  base = started.url;
});

test.after(async () => {
  await new Promise(resolve => server.close(resolve));
});

test('canonical pages and compatibility routes respond over HTTP', async () => {
  const canonical = ['/', '/speisekarte/', '/galerie/', '/bewertungen/', '/impressum/', '/datenschutz/', '/en/', '/en/menu/', '/ar/', '/ar/menu/'];
  for (const route of canonical) {
    const response = await fetch(`${base}${route}`);
    assert.equal(response.status, 200, route);
    assert.match(response.headers.get('content-type') ?? '', /^text\/html/);
    const body = await response.text();
    assert.doesNotMatch(body, /name=["']robots["'][^>]*noindex/i, route);
  }
  for (const route of ['/home/', '/menu-in-english/', '/مينو-عربي/']) {
    const response = await fetch(`${base}${route}`);
    assert.equal(response.status, 200, route);
    assert.match(await response.text(), /noindex,follow/);
  }
});

test('extensionless directory paths normalize to trailing-slash URLs', async () => {
  const response = await fetch(`${base}/speisekarte`, { redirect: 'manual' });
  assert.equal(response.status, 308);
  assert.equal(response.headers.get('location'), '/speisekarte/');
});

test('crawl files and immutable assets use correct content types and caching', async () => {
  const expected = [
    ['/robots.txt', 'text/plain'],
    ['/sitemap.xml', 'application/xml'],
    ['/site.webmanifest', 'application/manifest+json'],
    ['/assets/css/site.css', 'text/css'],
    ['/assets/css/site.css?v=20261113-404', 'text/css'],
    ['/assets/js/site.js', 'text/javascript'],
    ['/assets/js/measurement.js?v=20261108-measurement', 'text/javascript'],
    ['/assets/img/hero-table.webp', 'image/webp'],
    ['/assets/img/levante-og.jpg', 'image/jpeg'],
  ];
  for (const [route, type] of expected) {
    const response = await fetch(`${base}${route}`);
    assert.equal(response.status, 200, route);
    assert.match(response.headers.get('content-type') ?? '', new RegExp(`^${type.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
    if (route.startsWith('/assets/')) assert.match(response.headers.get('cache-control') ?? '', /max-age=31536000/);
  }
});

test('unknown and traversal paths are safely rejected', async () => {
  const missing = await fetch(`${base}/this-page-does-not-exist`);
  assert.equal(missing.status, 404);
  assert.match(await missing.text(), /Seite nicht gefunden/);
  const traversal = await fetch(`${base}/..%2F..%2FWindows%2Fwin.ini`, { redirect: 'manual' });
  assert.ok([400, 404].includes(traversal.status));
});
