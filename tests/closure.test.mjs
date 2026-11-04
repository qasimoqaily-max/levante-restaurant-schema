import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { copy } from '../src/i18n.mjs';
import { renderPage } from '../src/templates.mjs';
import { repoRoot, read, jsonLdBlocks, routeToFile, meta, linkHref } from './helpers.mjs';

const load = file => JSON.parse(fs.readFileSync(path.join(repoRoot, file), 'utf8'));
const site = load('data/site.json');
const sourceMenu = load('data/menu.json');
const { pages } = load('data/pages.json');
const lock = load('tests/fixtures/menu-source-lock-20261104.json');
const base = 'https://www.levante-radolfzell.de';
const schema = 'https://schema.org';
const halalIds = [
  'kebbeh', 'arays-lahmeh', 'lamb-soup', 'chicken-salad', 'chicken-tajine',
  'lamb-tajine', 'kafta-mishwiyeh', 'shish-taouk', 'mix-grill', 'lahmeh-mishwiyeh',
];
const menus = { de: '/speisekarte/', en: '/en/menu/', ar: '/ar/menu/' };
const labels = {
  de: { vegan: 'vegan', vegetarian: 'vegetarisch', halal: 'HALAL', reserve: 'Tisch reservieren' },
  en: { vegan: 'vegan', vegetarian: 'vegetarian', halal: 'HALAL', reserve: 'Reserve a table' },
  ar: { vegan: 'نباتي صرف', vegetarian: 'نباتي', halal: 'حلال', reserve: 'حجز طاولة' },
};
const halalNotes = {
  de: 'Alle Fleisch- und Geflügelgerichte sind halal.',
  en: 'All meat and poultry dishes are halal.',
  ar: 'جميع أطباق اللحوم والدواجن حلال.',
};
const decode = text => text.replaceAll('&lt;', '<').replaceAll('&gt;', '>')
  .replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&amp;', '&');
const graphFor = html => jsonLdBlocks(html).flatMap(block => block['@graph'] ?? [block]);
const bodyFor = html => html.split('<body>')[1].split('</body>')[0];
const cardsFor = html => [...bodyFor(html).matchAll(/<article class="menu-item">([\s\S]*?)<\/article>/g)].map(match => match[1]);
const itemsFor = html => graphFor(html).find(node => node['@type'] === 'Menu').hasMenuSection.flatMap(section => section.hasMenuItem);

function expectedDiet(item) {
  if (item.diet === 'vegan') return ['vegan', `${schema}/VeganDiet`];
  if (item.diet === 'vegetarian') return ['vegetarian', `${schema}/VegetarianDiet`];
  if (item.diet === 'none' && halalIds.includes(item.id)) return ['halal', `${schema}/HalalDiet`];
  return [];
}

function numericPrice(text) {
  return Number(text.replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[^\d.,٫]/g, '').replace(/[،,٫]/g, '.'));
}

// These assertions inspect real rendered output, independently of production diet decisions.
function assertItem(card, item, locked, page) {
  const heading = card.match(/<h3>([\s\S]*?)<\/h3>/)?.[1];
  assert.notEqual(heading, undefined, `${locked.id}: h3 title`);
  const badges = [...heading.matchAll(/<span\b([^>]*)>([^<]*)<\/span>/g)];
  const [dietKey, dietUri] = expectedDiet(locked);
  assert.equal(badges.length, dietKey ? 1 : 0, `${locked.id}: visible badge count`);
  assert.equal((card.match(/<span\b/g) ?? []).length, badges.length, `${locked.id}: no extra badges outside title`);
  assert.doesNotMatch(card, /\bhidden\b|aria-hidden|sr-only|style\s*=/i, `${locked.id}: badge/title must be visible`);
  if (dietKey) {
    assert.equal(badges[0][1], ' class="diet"', `${locked.id}: ordinary visible diet badge`);
    assert.equal(decode(badges[0][2]), labels[page.lang][dietKey], `${locked.id}: badge label`);
  }
  assert.equal(decode(heading.replace(/ <span\b[^>]*>[^<]*<\/span>/g, '')), locked.name[page.lang], `${locked.id}: exact title`);
  assert.equal(decode(card.match(/<p>([^<]*)<\/p>/)?.[1] ?? ''), locked.description[page.lang], `${locked.id}: exact description`);
  const price = decode(card.match(/<strong>([^<]*)<\/strong>/)?.[1] ?? '');
  const locale = { de: 'de-DE', en: 'en-DE', ar: 'ar-DE' }[page.lang];
  assert.equal(price, new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(Number(locked.price)), `${locked.id}: formatted price`);
  assert.equal(numericPrice(price), Number(locked.price), `${locked.id}: numeric price`);
  assert.equal(item['@id'], `${base}${page.route}#${locked.id}`);
  assert.equal(item.name, locked.name[page.lang]);
  assert.equal(item.description ?? '', locked.description[page.lang]);
  assert.equal(item.offers.price, locked.price);
  assert.equal(Number(item.offers.price), numericPrice(price), `${locked.id}: price parity`);
  assert.equal(item.offers.priceCurrency, 'EUR');
  assert.equal(item.suitableForDiet, dietUri, `${locked.id}: exact diet URI`);
}

function assertFaq(html, page, expectedPairs) {
  const nodes = graphFor(html).filter(node => node['@type'] === 'FAQPage');
  assert.equal(nodes.length, 1, `${page.route}: one FAQPage`);
  const faq = nodes[0];
  assert.equal(faq['@id'], `${base}${page.route}#faq`);
  assert.equal(faq.inLanguage, page.lang);
  assert.deepEqual(faq.isPartOf, { '@id': `${base}${page.route}#webpage` });
  const section = bodyFor(html).match(/<section id="faq"[^>]*>([\s\S]*?)<\/section>/)?.[1];
  assert.ok(section, `${page.route}: FAQ anchor exists in visible body`);
  assert.doesNotMatch(section, /\bhidden\b|aria-hidden|sr-only|style\s*=/i);
  const visible = [...section.matchAll(/<details><summary>([^<]*)<\/summary><p>([^<]*)<\/p><\/details>/g)]
    .map(([, question, answer]) => [decode(question), decode(answer)]);
  assert.deepEqual(visible, expectedPairs, `${page.route}: visible source pairs`);
  assert.equal((bodyFor(html).match(/<details\b/g) ?? []).length, visible.length, 'no additional FAQ details');
  for (const question of faq.mainEntity) {
    assert.equal(question['@type'], 'Question');
    assert.equal(question.acceptedAnswer['@type'], 'Answer');
  }
  assert.deepEqual(faq.mainEntity.map(question => [question.name, question.acceptedAnswer.text]), visible, `${page.route}: exact FAQ parity`);
}

function assertRestaurant(html, page) {
  const graph = graphFor(html);
  const restaurants = graph.filter(node => node['@type'] === 'Restaurant');
  assert.equal(restaurants.length, 1, `${page.route}: one complete Restaurant`);
  const canonical = `${base}${page.route}`;
  const menuUrl = `${base}${menus[page.lang]}`;
  const entry = url => ({ '@type': 'EntryPoint', urlTemplate: url, actionPlatform: [`${schema}/DesktopWebPlatform`, `${schema}/MobileWebPlatform`] });
  assert.deepEqual(restaurants[0], {
    '@type': 'Restaurant', '@id': `${base}/#restaurant`, name: 'Levante Restaurant', url: `${base}/`,
    mainEntityOfPage: { '@id': `${canonical}#webpage` },
    image: [`${base}/assets/img/levante-og.jpg`, `${base}/assets/img/hero-table.webp`, `${base}/assets/img/garden-wide.webp`],
    logo: {
      '@type': 'ImageObject', '@id': `${base}/#logo`, url: `${base}/assets/img/levante-logo.webp`,
      contentUrl: `${base}/assets/img/levante-logo.webp`, width: 800, height: 800, caption: 'Levante Restaurant logo',
    },
    telephone: '+49 7732 9589075', email: 'info@levante-radolfzell.de', priceRange: '€€', currenciesAccepted: 'EUR',
    paymentAccepted: 'Cash, Debit Card, Credit Card, NFC mobile payment',
    servesCuisine: ['Levantine', 'Middle Eastern', 'Arabic', 'Mediterranean'],
    address: { '@type': 'PostalAddress', streetAddress: 'Löwengasse 30', postalCode: '78315', addressLocality: 'Radolfzell am Bodensee', addressRegion: 'Baden-Württemberg', addressCountry: 'DE' },
    geo: { '@type': 'GeoCoordinates', latitude: 47.7381456, longitude: 8.9676054 },
    hasMap: 'https://www.google.com/maps/search/?api=1&query=47.7381456%2C8.9676054',
    openingHoursSpecification: [
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'].map(day => `${schema}/${day}`), opens: '16:00', closes: '22:00' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Friday', 'Saturday'].map(day => `${schema}/${day}`), opens: '11:00', closes: '00:00' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: `${schema}/Sunday`, opens: '11:00', closes: '22:00' },
    ],
    menu: menuUrl, hasMenu: { '@id': `${menuUrl}#menu` }, acceptsReservations: true,
    sameAs: [
      'https://www.instagram.com/levante.restaurant/', 'https://www.facebook.com/LevanteRadolfzell',
      'https://www.tripadvisor.com/Restaurant_Review-g983814-d17780373-Reviews-Levante_Restaurant-Radolfzell_am_Bodensee_Baden_Wurttemberg.html',
    ],
    areaServed: { '@type': 'City', name: 'Radolfzell am Bodensee' },
    potentialAction: [
      { '@type': 'ReserveAction', target: entry('https://tablego.uk/levante-restaurant--0xmr3q'), result: { '@type': 'FoodEstablishmentReservation', name: labels[page.lang].reserve } },
      { '@type': 'OrderAction', target: entry('https://www.levanterestaurant-radolfzellambodensee.de/') },
    ],
  });
  const webPage = graph.find(node => node['@id'] === restaurants[0].mainEntityOfPage['@id']);
  assert.equal(webPage?.['@type'], 'WebPage', 'mainEntityOfPage resolves to this WebPage');
  assert.equal(webPage.url, canonical);
  assert.deepEqual(webPage.about, { '@id': `${base}/#restaurant` });
  assert.deepEqual(graph.find(node => node['@type'] === 'WebSite').publisher, { '@id': `${base}/#restaurant` });
  const menuGraph = graphFor(read(routeToFile(menus[page.lang])));
  assert.equal(menuGraph.filter(node => node['@id'] === restaurants[0].hasMenu['@id'] && node['@type'] === 'Menu').length, 1, 'linked localized Menu exists');
  if (page.kind === 'menu') assert.equal(graph.filter(node => node['@id'] === restaurants[0].hasMenu['@id']).length, 1, 'Menu is present in the same graph');
  assert.doesNotMatch(JSON.stringify(graph), /aggregateRating|"review"|"Review"|ratingValue|reviewRating/i);
}

function changeGraph(html, change) {
  return html.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/, (_, open, json, close) => {
    const data = JSON.parse(json);
    change(data['@graph']);
    return open + JSON.stringify(data) + close;
  });
}

test(`all ${lock.items.length} source dishes and the entire menu file remain locked`, () => {
  const sourceItems = sourceMenu.sections.flatMap(section => section.items);
  assert.equal(lock.items.length, 35);
  assert.deepEqual(sourceItems, lock.items);
  const bytes = fs.readFileSync(path.join(repoRoot, 'data/menu.json'));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), lock.sourceSha256);
});

for (const page of pages.filter(page => page.kind === 'menu')) {
  const html = read(routeToFile(page.route));
  const cards = cardsFor(html);
  const items = itemsFor(html);
  for (const [index, locked] of lock.items.entries()) {
    test(`${page.lang}: ${locked.id} retains locked text, numeric price, diet and visible badge`, () => {
      assert.equal(cards.length, lock.items.length);
      assert.equal(items.length, lock.items.length);
      assertItem(cards[index], items[index], locked, page);
    });
  }
  test(`${page.lang}: exactly ten halal title badges and one existing halal assurance`, () => {
    const found = [];
    cards.forEach((card, index) => {
      const heading = card.match(/<h3>([\s\S]*?)<\/h3>/)[1];
      if (heading.includes(`<span class="diet">${labels[page.lang].halal}</span>`)) found.push(items[index]['@id'].split('#')[1]);
    });
    assert.deepEqual(found.sort(), [...halalIds].sort());
    const body = bodyFor(html);
    const notes = [...body.matchAll(/<p class="halal-note">([^<]*)<\/p>/g)];
    assert.equal(notes.length, 1);
    assert.equal(decode(notes[0][1]), halalNotes[page.lang]);
    assert.equal(body.split(halalNotes[page.lang]).length - 1, 1);
    assert.ok(body.indexOf(notes[0][0]) < body.indexOf('<article class="menu-item">'));
  });

  test(`${page.lang}: both diet consumers preserve vegan precedence and reject unapproved or invalid claims`, () => {
    const alteredMenu = structuredClone(sourceMenu);
    const alteredItems = alteredMenu.sections.flatMap(section => section.items);
    const cases = [
      { index: 0, id: 'unapproved-meat', diet: 'none', key: undefined, uri: undefined },
      { index: 1, id: 'unapproved-halal', diet: 'halal', key: undefined, uri: undefined },
      { index: 2, id: 'kebbeh-variant', diet: 'none', key: undefined, uri: undefined },
      { index: 3, id: 'kebbeh', diet: 'vegan', key: 'vegan', uri: `${schema}/VeganDiet` },
      { index: 4, id: 'arays-lahmeh', diet: 'vegetarian', key: 'vegetarian', uri: `${schema}/VegetarianDiet` },
      { index: 5, id: 'lamb-soup', diet: 'unknown', key: undefined, uri: undefined },
    ];
    for (const value of cases) Object.assign(alteredItems[value.index], { id: value.id, diet: value.diet });
    const rendered = renderPage(site, page, alteredMenu);
    const alteredCards = cardsFor(rendered);
    const schemaItems = itemsFor(rendered);
    for (const value of cases) {
      const badges = [...alteredCards[value.index].matchAll(/<span class="diet">([^<]*)<\/span>/g)].map(match => decode(match[1]));
      assert.deepEqual(badges, value.key ? [labels[page.lang][value.key]] : [], `${value.id}/${value.diet}: badge`);
      assert.equal(schemaItems[value.index].suitableForDiet, value.uri, `${value.id}/${value.diet}: schema`);
    }
  });
}

for (const page of pages) {
  test(`${page.route}: JSON parses and exactly one complete verified Restaurant resolves to its localized Menu`, () => {
    const html = read(routeToFile(page.route));
    assert.equal(jsonLdBlocks(html).length, 1);
    assertRestaurant(html, page);
  });
  if (page.kind === 'home') {
    test(`${page.lang}: every FAQ question and answer exactly matches visible localized content`, () => {
      assertFaq(read(routeToFile(page.route)), page, copy[page.lang].faq);
    });
    test(`${page.lang}: changing the shared FAQ source updates both consumers with exact escaped text`, () => {
      const original = copy[page.lang].faq;
      const changed = [['Test & <question> "one"?', "Test answer's & <details>."]];
      try {
        copy[page.lang].faq = changed;
        assertFaq(renderPage(site, page, sourceMenu), page, changed);
      } finally {
        copy[page.lang].faq = original;
      }
    });
  } else {
    test(`${page.route}: pages without visible FAQs contain no FAQPage`, () => {
      const html = read(routeToFile(page.route));
      assert.equal(graphFor(html).filter(node => node['@type'] === 'FAQPage').length, 0);
      assert.doesNotMatch(bodyFor(html), /id="faq"|class="faq-list"/);
    });
  }
}

test('FAQ parity rejects a changed question, answer, missing pair or extra hidden pair', () => {
  const page = pages.find(page => page.route === '/');
  const html = read('index.html');
  assertFaq(html, page, copy.de.faq);
  const mutations = [
    faq => { faq.mainEntity[0].name = 'Unshown question?'; },
    faq => { faq.mainEntity[0].acceptedAnswer.text = 'Unshown answer.'; },
    faq => { faq.mainEntity.pop(); },
    faq => { faq.mainEntity.push({ '@type': 'Question', name: 'Hidden?', acceptedAnswer: { '@type': 'Answer', text: 'Hidden.' } }); },
  ];
  for (const mutate of mutations) {
    const wrong = changeGraph(html, graph => mutate(graph.find(node => node['@type'] === 'FAQPage')));
    assert.throws(() => assertFaq(wrong, page, copy.de.faq), { code: 'ERR_ASSERTION' });
  }
});

test('item parity rejects missing, hidden, fake and incorrectly labeled badges', () => {
  const page = pages.find(page => page.route === '/speisekarte/');
  const html = read('speisekarte/index.html');
  const index = lock.items.findIndex(item => item.id === 'kebbeh');
  const card = cardsFor(html)[index];
  const item = itemsFor(html)[index];
  const badge = '<span class="diet">HALAL</span>';
  assertItem(card, item, lock.items[index], page);
  for (const replacement of ['', '<span class="diet" hidden>HALAL</span>', '<span class="diet" aria-hidden="true">HALAL</span>', '<span class="sr-only">HALAL</span>', '<span class="diet">vegan</span>']) {
    assert.throws(() => assertItem(card.replace(badge, replacement), item, lock.items[index], page), { code: 'ERR_ASSERTION' });
  }
  const fake = cardsFor(html)[0].replace('</h3>', ` ${badge}</h3>`);
  assert.throws(() => assertItem(fake, itemsFor(html)[0], lock.items[0], page), { code: 'ERR_ASSERTION' });
});

test('Restaurant checks reject noncanonical, duplicate, partial and altered identities', () => {
  const page = pages.find(page => page.route === '/');
  const html = read('index.html');
  assertRestaurant(html, page);
  const mutations = [
    (restaurant) => { restaurant['@id'] = `${base}/en/#restaurant`; },
    (restaurant) => { delete restaurant.email; },
    (restaurant) => { restaurant.telephone = '+49 0000 0000000'; },
    (restaurant, graph) => { graph.push(structuredClone(restaurant)); },
    (restaurant) => { restaurant.hasMenu['@id'] = `${base}/en/menu/#menu`; },
  ];
  for (const mutate of mutations) {
    const wrong = changeGraph(html, graph => mutate(graph.find(node => node['@type'] === 'Restaurant'), graph));
    assert.throws(() => assertRestaurant(wrong, page), { code: 'ERR_ASSERTION' });
  }
});

test('item parity rejects changed names, descriptions, price values and diet URIs', () => {
  const page = pages.find(page => page.route === '/speisekarte/');
  const html = read('speisekarte/index.html');
  const original = itemsFor(html)[0];
  const card = cardsFor(html)[0];
  assertItem(card, original, lock.items[0], page);
  const mutations = [
    item => { item.name = 'Changed dish'; },
    item => { item.description = 'Changed description'; },
    item => { item.offers.price = '99.00'; },
    item => { item.suitableForDiet = `${schema}/HalalDiet`; },
    item => { item.suitableForDiet = `${schema}/UnknownDiet`; },
  ];
  for (const mutate of mutations) {
    const wrong = structuredClone(original);
    mutate(wrong);
    assert.throws(() => assertItem(card, wrong, lock.items[0], page), { code: 'ERR_ASSERTION' });
  }
});

test('all ten sitemap URLs use the explicit closure date', () => {
  const entries = [...read('sitemap.xml').matchAll(/<url>([\s\S]*?)<\/url>/g)].map(match => match[1]);
  assert.equal(entries.length, 10);
  assert.deepEqual(entries.map(entry => entry.match(/<loc>([^<]+)<\/loc>/)[1]), pages.map(page => `${base}${page.route}`));
  for (const entry of entries) assert.equal(entry.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1], '2026-11-04');
});

test('compatibility and 404 fallback pages remain noindex and outside entity/FAQ graphs', () => {
  for (const [file, target] of [['home/index.html', '/'], ['menu-in-english/index.html', '/en/menu/'], ['مينو-عربي/index.html', '/ar/menu/']]) {
    const html = read(file);
    assert.equal(meta(html, 'robots'), 'noindex,follow');
    assert.equal(linkHref(html, 'canonical'), `${base}${target}`);
    assert.ok(html.includes(`<meta http-equiv="refresh" content="0; url=${target}">`));
    assert.ok(html.includes(`<a href="${target}">Weiter</a>`), 'works with JavaScript disabled');
    assert.deepEqual(jsonLdBlocks(html), []);
  }
  const fallback = read('404.html');
  assert.equal(meta(fallback, 'robots'), 'noindex,follow');
  assert.ok(fallback.includes('href="/"'));
  assert.ok(fallback.includes('href="/speisekarte/"'));
  assert.deepEqual(jsonLdBlocks(fallback), []);
});
