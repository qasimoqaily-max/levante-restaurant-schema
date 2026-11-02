import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const load = name => JSON.parse(fs.readFileSync(path.join(root, 'data', name), 'utf8'));

test('site data contains the verified business identity and hours', () => {
  const site = load('site.json');
  assert.equal(site.business.name, 'Levante Restaurant');
  assert.equal(site.business.owner, 'Qasim Aloqaily');
  assert.equal(site.business.email, 'info@levante-radolfzell.de');
  assert.equal(site.business.phoneE164, '+4977329589075');
  assert.deepEqual(site.business.geo, { latitude: 47.7381456, longitude: 8.9676054 });
  assert.deepEqual(site.hours.main, {
    monThu: ['16:00', '22:00'],
    friSat: ['11:00', '00:00'],
    sun: ['11:00', '22:00'],
  });
  assert.match(site.actions.order, /^https:\/\//);
  assert.match(site.actions.reserve, /^https:\/\//);
  assert.ok(site.social.instagram && site.social.facebook);
});

test('menu data is complete, priced, and translated', () => {
  const menu = load('menu.json');
  assert.ok(menu.sections.length >= 6);
  const ids = new Set();
  const items = menu.sections.flatMap(section => {
    for (const lang of ['de', 'en', 'ar']) assert.ok(section.name[lang], `section ${section.id} missing ${lang}`);
    return section.items;
  });
  assert.ok(items.length >= 30);
  for (const item of items) {
    assert.ok(!ids.has(item.id), `duplicate item id ${item.id}`);
    ids.add(item.id);
    assert.match(item.price, /^\d+\.\d{2}$/);
    for (const lang of ['de', 'en', 'ar']) {
      assert.ok(item.name[lang], `${item.id}: missing ${lang} name`);
      assert.ok(item.description[lang] !== undefined, `${item.id}: missing ${lang} description`);
    }
    assert.ok(['vegan', 'vegetarian', 'none'].includes(item.diet));
  }
});

test('page metadata defines unique canonical indexable routes', () => {
  const pages = load('pages.json');
  const routes = new Set();
  const titles = new Set();
  for (const page of pages.pages) {
    assert.ok(!routes.has(page.route), `duplicate route ${page.route}`);
    routes.add(page.route);
    assert.ok(!titles.has(page.title), `duplicate title ${page.title}`);
    titles.add(page.title);
    assert.ok(['de', 'en', 'ar'].includes(page.lang));
    assert.ok(page.description.length >= 90 && page.description.length <= 180);
  }
  for (const required of ['/', '/speisekarte/', '/galerie/', '/bewertungen/', '/impressum/', '/datenschutz/', '/en/', '/en/menu/', '/ar/', '/ar/menu/']) {
    assert.ok(routes.has(required), `missing route ${required}`);
  }
});
