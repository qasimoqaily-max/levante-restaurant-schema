import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  distRoot, read, exists, title, meta, linkHref, h1Count, htmlLang, htmlDir,
  jsonLdBlocks, internalHrefs, imageTags, routeToFile,
} from './helpers.mjs';

const base = 'https://www.levante-radolfzell.de';
const pages = [
  ['index.html', 'de', '/'],
  ['speisekarte/index.html', 'de', '/speisekarte/'],
  ['galerie/index.html', 'de', '/galerie/'],
  ['bewertungen/index.html', 'de', '/bewertungen/'],
  ['impressum/index.html', 'de', '/impressum/'],
  ['datenschutz/index.html', 'de', '/datenschutz/'],
  ['en/index.html', 'en', '/en/'],
  ['en/menu/index.html', 'en', '/en/menu/'],
  ['ar/index.html', 'ar', '/ar/'],
  ['ar/menu/index.html', 'ar', '/ar/menu/'],
];
const redirects = [
  ['home/index.html', '/'],
  ['menu-in-english/index.html', '/en/menu/'],
  ['مينو-عربي/index.html', '/ar/menu/'],
];

function assertPageMetadata(file, lang, route) {
  const html = read(file);
  assert.equal(htmlLang(html), lang, `${file}: lang`);
  assert.equal(htmlDir(html), lang === 'ar' ? 'rtl' : 'ltr', `${file}: dir`);
  assert.ok(title(html).length >= 25 && title(html).length <= 65, `${file}: title length`);
  assert.ok(meta(html, 'description').length >= 90 && meta(html, 'description').length <= 180, `${file}: description length`);
  assert.equal(linkHref(html, 'canonical'), `${base}${route}`, `${file}: canonical`);
  assert.equal(h1Count(html), 1, `${file}: exactly one h1`);
  assert.ok(meta(html, 'robots').includes('index'), `${file}: indexable`);
  assert.match(html, /<main\b/i, `${file}: main landmark`);
  assert.match(html, /<nav\b/i, `${file}: navigation landmark`);
}

test('all target routes and crawl files exist', () => {
  for (const [file] of pages) assert.ok(exists(file), `missing ${file}`);
  for (const [file] of redirects) assert.ok(exists(file), `missing ${file}`);
  for (const file of ['404.html', 'robots.txt', 'sitemap.xml', 'site.webmanifest']) {
    assert.ok(exists(file), `missing ${file}`);
  }
});

test('every indexable page has strong unique metadata', () => {
  const titles = new Set();
  const descriptions = new Set();
  for (const [file, lang, route] of pages) {
    assertPageMetadata(file, lang, route);
    const html = read(file);
    assert.ok(!titles.has(title(html)), `duplicate title ${title(html)}`);
    assert.ok(!descriptions.has(meta(html, 'description')), `duplicate description ${file}`);
    titles.add(title(html));
    descriptions.add(meta(html, 'description'));
  }
});

test('language alternates are mutual and complete', () => {
  for (const [file] of [['index.html'], ['en/index.html'], ['ar/index.html']]) {
    const html = read(file);
    assert.equal(linkHref(html, 'alternate', 'de'), `${base}/`);
    assert.equal(linkHref(html, 'alternate', 'en'), `${base}/en/`);
    assert.equal(linkHref(html, 'alternate', 'ar'), `${base}/ar/`);
    assert.equal(linkHref(html, 'alternate', 'x-default'), `${base}/`);
  }
  for (const [file] of [['speisekarte/index.html'], ['en/menu/index.html'], ['ar/menu/index.html']]) {
    const html = read(file);
    assert.equal(linkHref(html, 'alternate', 'de'), `${base}/speisekarte/`);
    assert.equal(linkHref(html, 'alternate', 'en'), `${base}/en/menu/`);
    assert.equal(linkHref(html, 'alternate', 'ar'), `${base}/ar/menu/`);
    assert.equal(linkHref(html, 'alternate', 'x-default'), `${base}/speisekarte/`);
  }
});

test('homepage JSON-LD graph contains verified restaurant and actions', () => {
  const blocks = jsonLdBlocks(read('index.html'));
  assert.ok(blocks.length >= 1);
  const graph = blocks.flatMap(b => b['@graph'] ?? [b]);
  const restaurant = graph.find(n => n['@type'] === 'Restaurant');
  assert.ok(restaurant, 'Restaurant node missing');
  assert.equal(restaurant.name, 'Levante Restaurant');
  assert.equal(restaurant.telephone, '+49 7732 9589075');
  assert.equal(restaurant.email, 'info@levante-radolfzell.de');
  assert.equal(restaurant.address.streetAddress, 'Löwengasse 30');
  assert.deepEqual(restaurant.geo, { '@type': 'GeoCoordinates', latitude: 47.7381456, longitude: 8.9676054 });
  assert.equal(restaurant.acceptsReservations, true);
  assert.ok(Array.isArray(restaurant.sameAs) && restaurant.sameAs.length >= 2);
  assert.ok(Array.isArray(restaurant.potentialAction) && restaurant.potentialAction.some(a => a['@type'] === 'ReserveAction'));
  assert.ok(restaurant.potentialAction.some(a => a['@type'] === 'OrderAction'));
});

test('menu pages expose Menu and MenuItem JSON-LD matching visible prices', () => {
  for (const file of ['speisekarte/index.html', 'en/menu/index.html', 'ar/menu/index.html']) {
    const html = read(file);
    const graph = jsonLdBlocks(html).flatMap(b => b['@graph'] ?? [b]);
    const menu = graph.find(n => n['@type'] === 'Menu');
    assert.ok(menu, `${file}: Menu missing`);
    const items = (menu.hasMenuSection ?? []).flatMap(s => s.hasMenuItem ?? []);
    assert.ok(items.length >= 30, `${file}: menu item count`);
    for (const item of items) {
      assert.equal(item.offers.priceCurrency, 'EUR');
      assert.match(html, new RegExp(item.offers.price.replace('.', '[,.]')));
    }
  }
});

test('internal links and local images resolve', () => {
  for (const [file] of pages) {
    const html = read(file);
    for (const href of internalHrefs(html)) {
      if (href.startsWith('/assets/')) {
        assert.ok(exists(href.slice(1)), `${file}: missing asset ${href}`);
      } else {
        assert.ok(exists(routeToFile(href)), `${file}: missing route ${href}`);
      }
    }
    for (const tag of imageTags(html)) {
      const src = tag.match(/\bsrc=["']([^"']+)["']/i)?.[1] ?? '';
      assert.ok(src.startsWith('/assets/img/'), `${file}: nonlocal image ${src}`);
      assert.ok(/\balt=["'][^"']+["']/i.test(tag), `${file}: missing alt`);
      assert.ok(/\bwidth=["']\d+["']/i.test(tag), `${file}: missing width`);
      assert.ok(/\bheight=["']\d+["']/i.test(tag), `${file}: missing height`);
      assert.ok(exists(src.slice(1)), `${file}: missing image file ${src}`);
    }
  }
});

test('real Levante imagery is responsive, descriptive, and performance-safe', () => {
  const required = [
    'assets/img/levante-logo.webp',
    'assets/img/favicon.png',
    'assets/img/levante-og.jpg',
    'assets/img/hero-table.webp',
    'assets/img/garden-wide.webp',
  ];
  for (const file of required) assert.ok(exists(file), `missing required image ${file}`);

  const homeImages = imageTags(read('index.html'));
  assert.ok(homeImages.length >= 4, 'homepage needs at least four real images');
  const priority = homeImages.find(tag => /fetchpriority=["']high["']/i.test(tag));
  assert.ok(priority, 'homepage hero image must be high priority');
  assert.match(priority, /loading=["']eager["']/i);

  const galleryImages = imageTags(read('galerie/index.html'));
  assert.ok(galleryImages.length >= 12, 'gallery needs at least twelve real images');
  const alts = new Set();
  for (const tag of galleryImages) {
    assert.match(tag, /loading=["']lazy["']/i, 'gallery images must lazy-load');
    const alt = tag.match(/\balt=["']([^"']+)["']/i)?.[1] ?? '';
    assert.ok(alt.length >= 12, `weak gallery alt: ${alt}`);
    assert.ok(!alts.has(alt), `duplicate gallery alt: ${alt}`);
    alts.add(alt);
  }
});
test('legacy routes redirect without becoming duplicate index pages', () => {
  for (const [file, target] of redirects) {
    const html = read(file);
    assert.match(meta(html, 'robots'), /noindex/i, `${file}: noindex`);
    assert.equal(linkHref(html, 'canonical'), `${base}${target}`);
    assert.match(html, new RegExp(`url=${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'));
  }
});

test('sitemap and robots cover canonical indexable routes', () => {
  const sitemap = read('sitemap.xml');
  const reEscape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const [, , route] of pages) assert.match(sitemap, new RegExp('<loc>' + reEscape(base + route) + '</loc>'));
  for (const [file] of redirects) {
    const legacyRoute = '/' + file.replace(/\\/g, '/').replace(/index\.html$/, '');
    assert.doesNotMatch(sitemap, new RegExp('<loc>' + reEscape(base + legacyRoute) + '</loc>'));
  }
  assert.equal((sitemap.match(/<loc>/g) ?? []).length, pages.length);
  assert.match(read('robots.txt'), new RegExp('Sitemap: ' + reEscape(base) + '/sitemap.xml'));
});
test('asset budgets prevent slow regressions', () => {
  const imageDir = path.join(distRoot, 'assets', 'img');
  for (const entry of fs.readdirSync(imageDir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const stat = fs.statSync(path.join(imageDir, entry.name));
    assert.ok(stat.size <= 400_000, `${entry.name} exceeds 400 KB`);
  }
  const css = fs.statSync(path.join(distRoot, 'assets', 'css', 'site.css')).size;
  const js = fs.statSync(path.join(distRoot, 'assets', 'js', 'site.js')).size;
  assert.ok(css <= 80_000, 'CSS budget');
  assert.ok(js <= 20_000, 'JS budget');
});

