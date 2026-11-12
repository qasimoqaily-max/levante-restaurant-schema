import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { repoRoot, read, jsonLdBlocks, meta, linkHref } from './helpers.mjs';

const base = 'https://www.levante-radolfzell.de';
// Owner decision 2026-11-12: no halal wording, badges or HalalDiet markup.
const halalIds = [];
const menuPages = [
  { file: 'speisekarte/index.html', route: '/speisekarte/', lang: 'de' },
  { file: 'en/menu/index.html', route: '/en/menu/', lang: 'en' },
  { file: 'ar/menu/index.html', route: '/ar/menu/', lang: 'ar' },
];
const sourceLock = JSON.parse(fs.readFileSync(path.join(repoRoot, 'tests/fixtures/menu-source-lock-20261104.json'), 'utf8'));
const sourceMenu = JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/menu.json'), 'utf8'));
const sourceItems = sourceMenu.sections.flatMap(section => section.items);
const graphFor = html => jsonLdBlocks(html).flatMap(block => block['@graph'] ?? [block]);
const menuItems = graph => graph.find(node => node['@type'] === 'Menu').hasMenuSection.flatMap(section => section.hasMenuItem);
const decodeHtml = text => text.replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replaceAll('&#39;', "'");

for (const page of menuPages) {
  test(`${page.lang}: Restaurant links to the in-page Menu and retains the complete requested entity fields`, () => {
    const graph = graphFor(read(page.file));
    const restaurants = graph.filter(node => node['@type'] === 'Restaurant');
    assert.equal(restaurants.length, 1);
    const restaurant = restaurants[0];
    const menu = graph.find(node => node['@type'] === 'Menu');
    assert.equal(restaurant['@id'], `${base}/#restaurant`);
    assert.equal(menu['@id'], `${base}${page.route}#menu`);
    assert.deepEqual(restaurant.hasMenu, { '@id': menu['@id'] });
    assert.equal(restaurant.menu, `${base}${page.route}`);
    assert.equal(restaurant.address.addressRegion, 'Baden-Württemberg');
    assert.deepEqual(restaurant.servesCuisine, ['Levantine', 'Middle Eastern', 'Arabic', 'Mediterranean']);
    assert.equal(restaurant.acceptsReservations, true);
  });

  test(`${page.lang}: no menu item carries HalalDiet and plant-based diets stay exact`, () => {
    const items = menuItems(graphFor(read(page.file)));
    const halal = items.filter(item => item.suitableForDiet === 'https://schema.org/HalalDiet');
    assert.deepEqual(halal.map(item => item['@id'].split('#')[1]).sort(), [...halalIds].sort());
    for (const item of items) {
      const source = sourceItems.find(candidate => candidate.id === item['@id'].split('#')[1]);
      assert.ok(source);
      if (source.diet === 'vegan') assert.equal(item.suitableForDiet, 'https://schema.org/VeganDiet');
      if (source.diet === 'vegetarian') assert.equal(item.suitableForDiet, 'https://schema.org/VegetarianDiet');
      if (source.diet === 'none' && !halalIds.includes(source.id)) assert.equal(item.suitableForDiet, undefined);
    }
  });

  test(`${page.lang}: the menu page carries no halal assurance or wording`, () => {
    const html = read(page.file);
    assert.doesNotMatch(html, /class="halal-note"/);
    assert.doesNotMatch(html, /halal|حلال/i);
  });

  test(`${page.lang}: every visible item name and price exactly matches the source lock and JSON-LD`, () => {
    const html = read(page.file);
    const body = html.split('<body>')[1].split('</body>')[0];
    const visible = [...body.matchAll(/<article class="menu-item">([\s\S]*?)<\/article>/g)];
    const schemaItems = menuItems(graphFor(html));
    assert.equal(visible.length, sourceLock.items.length);
    assert.equal(schemaItems.length, sourceLock.items.length);
    const format = new Intl.NumberFormat(page.lang === 'ar' ? 'ar-DE' : page.lang === 'en' ? 'en-DE' : 'de-DE', { style: 'currency', currency: 'EUR' });
    for (let index = 0; index < sourceLock.items.length; index++) {
      const locked = sourceLock.items[index];
      const block = visible[index][1];
      const heading = block.match(/<h3>([\s\S]*?)<\/h3>/)[1].replace(/ <span class="diet">[^<]*<\/span>/, '');
      const price = block.match(/<strong>([^<]+)<\/strong>/)[1];
      assert.equal(decodeHtml(heading), locked.name[page.lang], `${locked.id}: visible name`);
      assert.equal(price, format.format(Number(locked.price)), `${locked.id}: visible price`);
      assert.equal(schemaItems[index]['@id'], `${base}${page.route}#${locked.id}`);
      assert.equal(schemaItems[index].name, locked.name[page.lang]);
      assert.equal(schemaItems[index].offers.price, locked.price);
      assert.equal(schemaItems[index].offers.priceCurrency, 'EUR');
    }
  });
}

test('source menu items and transliterations remain exactly source-locked', () => {
  assert.deepEqual(sourceItems, sourceLock.items);
  const zaatar = sourceItems.find(item => item.id === 'ayays-zaatar');
  assert.equal(zaatar.name.de, 'Ayays Zaatar');
  assert.equal(zaatar.name.en, 'Ayays Zaatar');
  assert.equal(zaatar.name.ar, 'عرايس زعتر');
  assert.equal(zaatar.price, '10.00');
});

test('/home/ executes history replacement immediately before its unchanged meta-refresh fallback', () => {
  const html = read('home/index.html');
  const script = `<script>window.location.replace("${base}/");</script>`;
  const refresh = '<meta http-equiv="refresh" content="0; url=/">';
  assert.ok(html.includes(script + refresh), 'Exact replace script must immediately precede the refresh');
  assert.equal(meta(html, 'robots'), 'noindex,follow');
  assert.equal(linkHref(html, 'canonical'), `${base}/`);
  assert.ok(html.includes('<a href="/">Weiter</a>'));
  const destinations = [];
  const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(code, { window: { location: { replace: value => destinations.push(value) } } }, { timeout: 1000 });
  assert.deepEqual(destinations, [`${base}/`]);
});

test('the requested home-only redirect change does not modify other compatibility redirects', () => {
  for (const file of ['menu-in-english/index.html', 'مينو-عربي/index.html']) {
    assert.doesNotMatch(read(file), /window\.location\.replace/);
    assert.equal(meta(read(file), 'robots'), 'noindex,follow');
  }
});
