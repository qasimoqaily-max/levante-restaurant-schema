import fs from 'node:fs';
import path from 'node:path';
import tls from 'node:tls';

const base = process.argv[2] ?? 'https://restaurant.levante-radolfzell.de';
const routes = ['/', '/speisekarte/', '/galerie/', '/bewertungen/', '/impressum/', '/datenschutz/', '/en/', '/en/menu/', '/ar/', '/ar/menu/'];
const redirects = ['/home/', '/menu-in-english/', '/مينو-عربي/'];
const results = { base, checkedAt: new Date().toISOString(), pages: [], redirects: [], assets: [], errors: [] };

function extract(html, re) { return html.match(re)?.[1] ?? ''; }
function localRefs(html) {
  const refs = new Set();
  for (const match of html.matchAll(/(?:href|src)=["']([^"']+)["']/gi)) {
    const value = match[1];
    if (value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/#')) refs.add(value.split('#')[0].split('?')[0]);
  }
  return [...refs];
}

for (const route of routes) {
  try {
    const response = await fetch(`${base}${route}`, { redirect: 'follow' });
    const html = await response.text();
    const blocks = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    let parsed = 0;
    for (const block of blocks) { JSON.parse(block[1]); parsed++; }
    const item = {
      route,
      status: response.status,
      finalUrl: response.url,
      bytes: Buffer.byteLength(html),
      title: extract(html, /<title>([^<]+)<\/title>/i),
      lang: extract(html, /<html\b[^>]*lang=["']([^"']+)["']/i),
      dir: extract(html, /<html\b[^>]*dir=["']([^"']+)["']/i),
      canonical: extract(html, /<link\b(?=[^>]*rel=["']canonical["'])(?=[^>]*href=["']([^"']+)["'])[^>]*>/i),
      h1Count: [...html.matchAll(/<h1\b/gi)].length,
      jsonLdBlocks: parsed,
      noindex: /<meta\b(?=[^>]*name=["']robots["'])(?=[^>]*content=["'][^"']*noindex)/i.test(html),
      refs: localRefs(html),
    };
    results.pages.push(item);
    if (response.status !== 200 || item.h1Count !== 1 || item.jsonLdBlocks < 1 || item.noindex) results.errors.push({ route, issue: 'page gate', item });
  } catch (error) { results.errors.push({ route, issue: error.message }); }
}

for (const route of redirects) {
  try {
    const response = await fetch(`${base}${route}`);
    const html = await response.text();
    const item = { route, status: response.status, noindex: /noindex,follow/i.test(html), canonical: extract(html, /<link\b(?=[^>]*rel=["']canonical["'])(?=[^>]*href=["']([^"']+)["'])[^>]*>/i) };
    results.redirects.push(item);
    if (response.status !== 200 || !item.noindex) results.errors.push({ route, issue: 'redirect gate', item });
  } catch (error) { results.errors.push({ route, issue: error.message }); }
}

const refs = new Set(results.pages.flatMap(page => page.refs));
for (const ref of refs) {
  try {
    const response = await fetch(`${base}${ref}`, { redirect: 'follow' });
    const item = { ref, status: response.status, finalUrl: response.url, type: response.headers.get('content-type') ?? '' };
    results.assets.push(item);
    if (response.status >= 400) results.errors.push({ ref, issue: 'broken reference', item });
  } catch (error) { results.errors.push({ ref, issue: error.message }); }
}

for (const ref of ['/robots.txt', '/sitemap.xml']) {
  if (!refs.has(ref)) {
    try {
      const response = await fetch(`${base}${ref}`);
      results.assets.push({ ref, status: response.status, finalUrl: response.url, type: response.headers.get('content-type') ?? '' });
      if (response.status !== 200) results.errors.push({ ref, issue: 'crawl file status' });
    } catch (error) { results.errors.push({ ref, issue: error.message }); }
  }
}

const httpResponse = await fetch(base.replace(/^https:/, 'http:'), { redirect: 'manual' });
results.httpRedirect = { status: httpResponse.status, location: httpResponse.headers.get('location') };
if (![301, 302, 307, 308].includes(httpResponse.status) || !String(results.httpRedirect.location).startsWith('https://')) results.errors.push({ issue: 'http redirect', value: results.httpRedirect });

results.certificate = await new Promise((resolve, reject) => {
  const host = new URL(base).hostname;
  const socket = tls.connect({ host, port: 443, servername: host, rejectUnauthorized: true }, () => {
    const cert = socket.getPeerCertificate();
    resolve({ authorized: socket.authorized, subject: cert.subject, issuer: cert.issuer, validFrom: cert.valid_from, validTo: cert.valid_to, subjectaltname: cert.subjectaltname });
    socket.end();
  });
  socket.once('error', reject);
});

results.summary = { pageCount: results.pages.length, referenceCount: results.assets.length, errorCount: results.errors.length, passed: results.errors.length === 0 };
const output = path.resolve('docs/live-preview-verification.json');
fs.writeFileSync(output, JSON.stringify(results, null, 2) + '\n', 'utf8');
console.log(JSON.stringify(results.summary));
if (results.errors.length) { console.error(JSON.stringify(results.errors, null, 2)); process.exit(1); }
