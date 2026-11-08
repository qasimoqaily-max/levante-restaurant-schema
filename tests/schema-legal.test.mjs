import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderPage } from '../src/templates.mjs';
import { read, jsonLdBlocks } from './helpers.mjs';

const site = JSON.parse(fs.readFileSync(new URL('../data/site.json', import.meta.url), 'utf8'));
const menu = JSON.parse(fs.readFileSync(new URL('../data/menu.json', import.meta.url), 'utf8'));
const { pages } = JSON.parse(fs.readFileSync(new URL('../data/pages.json', import.meta.url), 'utf8'));

function rendered(page, settings = site) {
  return renderPage(settings, page, menu);
}

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(match => [match[1], match[2]]));
}

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

test('legal pages explain optional analytics without loading external scripts by default', () => {
  const imprint = read('impressum/index.html');
  const privacy = read('datenschutz/index.html');
  assert.match(imprint, /§ 5 DDG/);
  assert.match(imprint, /Qasim Aloqaily/);
  assert.match(imprint, /Verbraucherstreitbeilegung/);
  assert.match(privacy, /GitHub Pages/);
  assert.match(privacy, /Google Analytics 4/);
  assert.match(privacy, /ausschließlich nach Ihrer ausdrücklichen Zustimmung/);
  assert.match(privacy, /jederzeit ändern oder Ihre Zustimmung widerrufen/);
  assert.match(privacy, /Ihre Rechte/);
  for (const html of [imprint, privacy]) {
    assert.doesNotMatch(html, /fonts\.googleapis|facebook\.net\/tr|hotjar/i);
    const externalScripts = [...html.matchAll(/<script\b[^>]*src=["']([^"']+)["']/gi)].map(m => m[1]).filter(src => /^https?:/i.test(src));
    assert.deepEqual(externalScripts, []);
  }
});

test('each language offers equally styled optional analytics choices and permanent settings', () => {
  const cases = [
    ['de', '/', 'Optionale Nutzungsstatistik', 'Analyse erlauben', 'Ablehnen'],
    ['en', '/en/', 'Optional usage statistics', 'Allow analytics', 'Reject'],
    ['ar', '/ar/', 'إحصاءات استخدام اختيارية', 'السماح بالتحليل', 'رفض'],
  ];
  for (const [lang, route, title, allow, reject] of cases) {
    const html = rendered(pages.find(page => page.route === route));
    assert.match(html, new RegExp(`<html lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">`));
    const panel = html.match(/<section\b(?=[^>]*\bid="measurement-consent")[^>]*>[\s\S]*?<\/section>/)?.[0];
    assert.ok(panel, `${lang}: optional analytics section missing`);
    assert.match(panel, /\bhidden(?:\s|>)/, `${lang}: panel must be initially hidden without script`);
    assert.match(panel, /role="region"/);
    assert.match(panel, /aria-labelledby="measurement-consent-title"/);
    assert.ok(panel.includes(`>${title}</h2>`));
    assert.doesNotMatch(panel, /aria-modal|role="dialog"/);
    const buttons = [...panel.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)].map(match => match[0]);
    const acceptButton = buttons.find(button => /data-consent-choice="granted"/.test(button));
    const rejectButton = buttons.find(button => /data-consent-choice="denied"/.test(button));
    assert.ok(acceptButton?.includes(`>${allow}</button>`), `${lang}: allow choice missing`);
    assert.ok(rejectButton?.includes(`>${reject}</button>`), `${lang}: reject choice missing`);
    assert.equal(attributes(acceptButton).class, attributes(rejectButton).class, `${lang}: choices must share presentation`);
    assert.match(html, /<button\b(?=[^>]*\bdata-consent-settings)(?=[^>]*aria-controls="measurement-consent")[^>]*>/);
    assert.match(panel, /href="\/datenschutz\/"/);
  }
});

test('measurement config is inert local JSON and cannot close its script element', () => {
  const page = pages.find(page => page.route === '/ar/menu/');
  const html = rendered(page, { ...site, measurement: { measurementId: '</script><script>alert(1)</script>' } });
  const configText = html.match(/<script\b(?=[^>]*\bid="measurement-config")(?=[^>]*\btype="application\/json")[^>]*>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(configText, 'inert measurement config missing');
  assert.deepEqual(JSON.parse(configText), {
    measurementId: '</script><script>alert(1)</script>',
    pagePath: '/ar/menu/',
    pageLanguage: 'ar',
  });
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
  assert.match(html, /<script\b(?=[^>]*type="module")(?=[^>]*src="\/assets\/js\/measurement\.js\?v=20261108-measurement")[^>]*><\/script>/);
  assert.deepEqual(JSON.parse(rendered(page, { ...site, measurement: undefined }).match(/<script\b(?=[^>]*id="measurement-config")[^>]*>([\s\S]*?)<\/script>/)[1]).measurementId, '');
  assert.deepEqual([...html.matchAll(/<script\b[^>]*src="(https?:[^\"]+)"/g)], []);
});

test('intent hooks preserve immediate call, reservation and order links without marking unrelated links', () => {
  for (const page of pages) {
    const html = rendered(page);
    const anchors = [...html.matchAll(/<a\b[^>]*>/g)].map(match => attributes(match[0]));
    const expected = {
      click_to_call: `tel:${site.business.phoneE164}`,
      booking_intent: site.actions.reserve,
      order_intent: site.actions.order,
    };
    for (const anchor of anchors) {
      if (anchor.href === expected.click_to_call) assert.equal(anchor['data-measure-action'], 'click_to_call');
      if (anchor.href === expected.booking_intent) assert.equal(anchor['data-measure-action'], 'booking_intent');
      if (anchor.href === expected.order_intent) assert.equal(anchor['data-measure-action'], 'order_intent');
      if (anchor['data-measure-action']) {
        assert.equal(anchor.href, expected[anchor['data-measure-action']], `${page.route}: unrelated link was marked as an intent`);
        assert.equal(anchor.onclick, undefined, 'intent links must keep native navigation');
      }
    }
  }
});
