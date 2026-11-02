import test from 'node:test';
import assert from 'node:assert/strict';
import { read, jsonLdBlocks } from './helpers.mjs';

function property(html, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tag = [...html.matchAll(/<meta\b[^>]*>/gi)].map(m => m[0]).find(value => new RegExp(`\\bproperty=["']${escaped}["']`, 'i').test(value));
  return tag?.match(/\bcontent=["']([^"']+)["']/i)?.[1] ?? '';
}

function namedMeta(html, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tag = [...html.matchAll(/<meta\b[^>]*>/gi)].map(m => m[0]).find(value => new RegExp(`\\bname=["']${escaped}["']`, 'i').test(value));
  return tag?.match(/\bcontent=["']([^"']+)["']/i)?.[1] ?? '';
}

test('social preview metadata is complete for all languages', () => {
  const cases = [
    ['index.html', 'de_DE', ['en_GB', 'ar_AR']],
    ['en/index.html', 'en_GB', ['de_DE', 'ar_AR']],
    ['ar/index.html', 'ar_AR', ['de_DE', 'en_GB']],
  ];
  for (const [file, locale, alternates] of cases) {
    const html = read(file);
    assert.equal(property(html, 'og:locale'), locale, `${file}: og:locale`);
    const altValues = [...html.matchAll(/<meta\b(?=[^>]*property=["']og:locale:alternate["'])(?=[^>]*content=["']([^"']+)["'])[^>]*>/gi)].map(m => m[1]);
    assert.deepEqual(altValues.sort(), alternates.sort(), `${file}: alternate locales`);
    assert.equal(property(html, 'og:image:width'), '1200');
    assert.equal(property(html, 'og:image:height'), '630');
    assert.ok(namedMeta(html, 'twitter:title'));
    assert.ok(namedMeta(html, 'twitter:description'));
    assert.match(namedMeta(html, 'twitter:image'), /^https:\/\/www\.levante-radolfzell\.de\/assets\/img\/levante-og\.jpg$/);
  }
});

test('restaurant structured data is factual, visible and non-self-serving', () => {
  const html = read('index.html');
  const graph = jsonLdBlocks(html).flatMap(block => block['@graph'] ?? [block]);
  const restaurant = graph.find(node => node['@type'] === 'Restaurant');
  assert.ok(restaurant);
  for (const visible of [
    'Löwengasse 30', '78315', '07732 9589075', 'info@levante-radolfzell.de',
    '16:00', '22:00', '11:00', 'Halal', 'vegan', 'Catering',
  ]) assert.match(html, new RegExp(visible, 'i'), `visible fact missing: ${visible}`);
  assert.ok(restaurant.image.every(url => /^https:\/\/www\.levante-radolfzell\.de\/assets\/img\//.test(url)));
  const serialized = JSON.stringify(graph);
  assert.doesNotMatch(serialized, /AggregateRating|"Review"|reviewRating|ratingValue/);
  assert.equal(restaurant.hasMenu['@id'], 'https://www.levante-radolfzell.de/speisekarte/#menu');
});

test('legal pages are complete and tracker-free', () => {
  const imprint = read('impressum/index.html');
  const privacy = read('datenschutz/index.html');
  assert.match(imprint, /§ 5 DDG/);
  assert.match(imprint, /Qasim Aloqaily/);
  assert.match(imprint, /Verbraucherstreitbeilegung/);
  assert.match(privacy, /GitHub Pages/);
  assert.match(privacy, /keine eigenen Analyse-, Marketing- oder Profiling-Cookies/);
  assert.match(privacy, /Ihre Rechte/);
  for (const html of [imprint, privacy]) {
    assert.doesNotMatch(html, /googletagmanager|google-analytics|fonts\.googleapis|facebook\.net\/tr|hotjar/i);
    const externalScripts = [...html.matchAll(/<script\b[^>]*src=["']([^"']+)["']/gi)].map(m => m[1]).filter(src => /^https?:/i.test(src));
    assert.deepEqual(externalScripts, []);
  }
});
