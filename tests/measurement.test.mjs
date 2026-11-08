import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const moduleUrl = new URL('../assets/js/measurement.js', import.meta.url);
async function implementation() {
  assert.ok(fs.existsSync(moduleUrl), 'consent-controlled measurement has not been implemented');
  return import(moduleUrl.href);
}

const measurementId = 'G-CR68Q9RVE5';
const config = { measurementId, pagePath: '/ar/', pageLanguage: 'ar' };
const now = 1_794_176_000_000;

function fixture({ stored = null, search = '', storageFails = false } = {}) {
  let consent = stored;
  let clock = now;
  const trace = [];
  const effects = {
    context: { origin: 'https://www.levante-radolfzell.de', search, referrer: 'https://search.example/path?email=private@example.com#secret' },
    now: () => clock,
    readConsent: () => { if (storageFails) throw new Error('storage unavailable'); return consent; },
    writeConsent: value => { if (storageFails) throw new Error('storage unavailable'); consent = value; trace.push(['persist', JSON.parse(value)]); },
    clearConsent: () => { consent = null; trace.push(['clear']); },
    startGoogle: (id, options) => { trace.push(['start', id, options]); return true; },
    sendEvent: (id, name, params) => trace.push(['event', id, name, params]),
    stopGoogle: () => trace.push(['stop']),
    purgeCookies: () => trace.push(['purge']),
    reload: () => trace.push(['reload']),
  };
  return { effects, trace, stored: () => consent, advance: ms => { clock += ms; } };
}

test('new and rejecting visitors trigger no Google load or event', async () => {
  const { createMeasurementController } = await implementation();
  const f = fixture();
  const controller = createMeasurementController(config, f.effects);
  assert.equal(controller.choice, null);
  controller.track('booking_intent');
  controller.choose('denied');
  controller.track('order_intent');
  assert.equal(controller.choice, 'denied');
  assert.equal(f.trace.filter(x => ['start', 'event'].includes(x[0])).length, 0);
  assert.deepEqual(Object.keys(JSON.parse(f.stored())).sort(), ['choice', 'timestamp', 'version']);
});

test('one explicit grant loads one analytics stream and only the three intent events', async () => {
  const { createMeasurementController } = await implementation();
  const f = fixture();
  const controller = createMeasurementController(config, f.effects);
  controller.choose('granted');
  controller.choose('granted');
  for (const action of ['click_to_call', 'booking_intent', 'order_intent', 'purchase', 'booking_completed', 'anything_else']) controller.track(action);
  assert.equal(f.trace.filter(x => x[0] === 'start').length, 1);
  const events = f.trace.filter(x => x[0] === 'event');
  assert.deepEqual(events.map(x => x[2]), ['click_to_call', 'booking_intent', 'order_intent']);
  assert.ok(events.every(x => x[1] === measurementId && x[3].send_to === measurementId));
  assert.doesNotMatch(JSON.stringify(events), /value|currency|email|phone|gclid|\?|#/i);
});

test('withdrawal disables measurement, purges cookies, and reloads before further events', async () => {
  const { createMeasurementController } = await implementation();
  const f = fixture();
  const controller = createMeasurementController(config, f.effects);
  controller.choose('granted');
  controller.track('order_intent');
  controller.choose('denied');
  controller.track('order_intent');
  assert.equal(f.trace.filter(x => x[0] === 'event').length, 1);
  assert.equal(controller.choice, 'denied');
  assert.deepEqual(f.trace.slice(-4).map(x => x[0]), ['persist', 'stop', 'purge', 'reload']);
});

test('valid saved consent is reused, whereas expired, future and malformed records fail closed', async () => {
  const { createMeasurementController } = await implementation();
  for (const stored of [null, '{bad', JSON.stringify({version: 1, choice: 'granted', timestamp: now + 1}), JSON.stringify({version: 1, choice: 'granted', timestamp: now - 180 * 86400000}), JSON.stringify({version: 2, choice: 'granted', timestamp: now})]) {
    const f = fixture({ stored });
    const c = createMeasurementController(config, f.effects);
    assert.equal(c.choice, null);
    assert.equal(f.trace.filter(x => x[0] === 'start').length, 0);
    assert.equal(f.stored(), null, 'expired or invalid entries must be deleted when storage permits');
  }
  const f = fixture({ stored: JSON.stringify({version: 1, choice: 'granted', timestamp: now - 1000}) });
  assert.equal(createMeasurementController(config, f.effects).choice, 'granted');
  assert.equal(f.trace.filter(x => x[0] === 'start').length, 1);
});

test('storage failures preserve the current choice without enabling Google implicitly', async () => {
  const { createMeasurementController } = await implementation();
  const f = fixture({ storageFails: true });
  const c = createMeasurementController(config, f.effects);
  assert.equal(c.choice, null);
  c.choose('denied');
  c.track('click_to_call');
  assert.equal(f.trace.filter(x => x[0] === 'start').length, 0);
  c.choose('granted');
  assert.equal(f.trace.filter(x => x[0] === 'start').length, 1);
  c.choose('denied');
  assert.ok(f.trace.some(x => x[0] === 'reload'));
});

test('blank or malformed stream IDs never load Google even after a grant', async () => {
  const { createMeasurementController } = await implementation();
  for (const id of ['', 'AW-12345', 'G-X?email=private', null]) {
    const f = fixture();
    const c = createMeasurementController({...config, measurementId: id}, f.effects);
    c.choose('granted');
    c.track('click_to_call');
    assert.equal(f.trace.filter(x => ['start', 'event'].includes(x[0])).length, 0);
  }
});

test('page metadata omits query strings, fragments and detailed referrers', async () => {
  const { buildMeasurementOptions } = await implementation();
  const options = buildMeasurementOptions(config, fixture({search: '?email=private@example.com&gclid=secret#fragment'}).effects.context);
  assert.equal(options.page_location, 'https://www.levante-radolfzell.de/ar/');
  assert.equal(options.page_referrer, 'https://search.example');
  assert.equal(options.language, 'ar');
  assert.equal(options.send_page_view, false);
  assert.equal(options.allow_google_signals, false);
  assert.equal(options.allow_ad_personalization_signals, false);
  assert.equal(options.cookie_domain, 'none');
  assert.equal(options.cookie_expires, 2592000);
  assert.equal(options.cookie_update, false);
  assert.doesNotMatch(JSON.stringify(options), /private|gclid|secret|\?|#/i);
});

test('attribution accepts only the literal approved UTM triple and never stores it', async () => {
  const { buildMeasurementOptions, createMeasurementController } = await implementation();
  const query = '?utm_source=google&utm_medium=cpc&utm_campaign=smart_radolfzell&email=private@example.com&gclid=secret';
  const f = fixture({ search: query });
  const options = buildMeasurementOptions(config, f.effects.context);
  assert.equal(options.campaign_source, 'google');
  assert.equal(options.campaign_medium, 'cpc');
  assert.equal(options.campaign_name, 'smart_radolfzell');
  for (const bad of ['?utm_source=private@example.com&utm_medium=cpc&utm_campaign=smart_radolfzell', '?utm_source=google&utm_medium=cpc', '?utm_source=google&utm_source=google&utm_medium=cpc&utm_campaign=smart_radolfzell']) {
    const other = buildMeasurementOptions(config, {...f.effects.context, search: bad});
    assert.equal(other.campaign_source, undefined);
    assert.equal(other.campaign_medium, undefined);
    assert.equal(other.campaign_name, undefined);
  }
  createMeasurementController(config, f.effects).choose('granted');
  assert.doesNotMatch(f.stored(), /utm_|campaign|google|gclid|private|https:/i);
});

test('revocation in another tab stops an already running stream', async () => {
  const { createMeasurementController } = await implementation();
  const f = fixture();
  const c = createMeasurementController(config, f.effects);
  c.choose('granted');
  f.effects.readConsent = () => JSON.stringify({version: 1, choice: 'denied', timestamp: now});
  c.refresh();
  c.track('booking_intent');
  assert.equal(c.choice, 'denied');
  assert.equal(f.trace.filter(x => x[0] === 'event').length, 0);
  assert.deepEqual(f.trace.slice(-3).map(x => x[0]), ['stop', 'purge', 'reload']);
});

test('cookie removal targets analytics names and preserves unrelated cookies', async () => {
  const { purgeAnalyticsCookies } = await implementation();
  const writes = [];
  const document = { get cookie() { return '_ga=123; _ga_CR68Q9RVE5=456; session=keep; levante_pref=keep'; }, set cookie(value) { writes.push(value); } };
  purgeAnalyticsCookies(document, 'www.levante-radolfzell.de');
  assert.ok(writes.some(x => x.startsWith('_ga=') && x.includes('Max-Age=0')));
  assert.ok(writes.some(x => x.startsWith('_ga_CR68Q9RVE5=') && x.includes('Max-Age=0')));
  assert.ok(writes.some(x => x.includes('Domain=levante-radolfzell.de')));
  assert.ok(writes.every(x => !x.startsWith('session=') && !x.startsWith('levante_pref=')));
});

function browserFixture({ historyFails = false } = {}) {
  let currentUrl = new URL('https://www.levante-radolfzell.de/ar/?utm_source=google&utm_medium=cpc&utm_campaign=smart_radolfzell&gclid=secret&email=private@example.com#private');
  const trace = [];
  const storage = new Map();
  const session = new Map();
  const cookieWrites = [];
  const document = {
    referrer: 'https://search.example/path?private@example.com',
    get cookie() { return '_ga=123; _ga_CR68Q9RVE5=456; session=keep'; },
    set cookie(value) { cookieWrites.push(value); },
    createElement(tag) { assert.equal(tag, 'script'); return { dataset: {}, remove() { trace.push(['remove']); } }; },
    head: { append(element) { trace.push(['request', element.src, element.referrerPolicy]); } },
  };
  const window = {
    location: {
      get origin() { return currentUrl.origin; }, get hostname() { return currentUrl.hostname; },
      get search() { return currentUrl.search; }, get hash() { return currentUrl.hash; },
      reload() { trace.push(['reload']); },
    },
    history: { replaceState(state, title, url) { if (historyFails) throw new Error('history unavailable'); currentUrl = new URL(url); trace.push(['replace', url]); } },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    sessionStorage: { getItem: key => session.get(key) ?? null, setItem: (key, value) => session.set(key, value), removeItem: key => session.delete(key) },
  };
  return { window, document, trace, storage, cookieWrites };
}

test('browser adapter commands stay gated, sanitize the URL before loading, and keep all advertising denied', async () => {
  const { createBrowserEffects, createMeasurementController } = await implementation();
  const f = browserFixture();
  const c = createMeasurementController(config, createBrowserEffects(f.window, f.document));
  assert.equal(f.trace.length, 0);
  c.choose('denied');
  assert.equal(f.trace.length, 0);
  c.choose('granted');
  assert.deepEqual(f.trace, [
    ['replace', 'https://www.levante-radolfzell.de/ar/'],
    ['request', 'https://www.googletagmanager.com/gtag/js?id=G-CR68Q9RVE5', 'origin'],
  ]);
  const commands = f.window.dataLayer.map(args => Array.from(args));
  const states = commands.filter(args => args[0] === 'consent');
  assert.deepEqual(states.map(x => [x[1], x[2].analytics_storage]), [['default', 'denied'], ['update', 'granted']]);
  assert.ok(states.every(x => x[2].ad_storage === 'denied' && x[2].ad_user_data === 'denied' && x[2].ad_personalization === 'denied'));
  const configured = commands.find(x => x[0] === 'config');
  assert.equal(configured[1], measurementId);
  assert.equal(configured[2].send_page_view, false);
  const pageviews = commands.filter(x => x[0] === 'event' && x[1] === 'page_view');
  assert.equal(pageviews.length, 1, 'one sanitized page view is sent per analytics start');
  assert.equal(pageviews[0][2].page_location, 'https://www.levante-radolfzell.de/ar/');
  assert.equal(pageviews[0][2].page_referrer, 'https://search.example');
  assert.equal(pageviews[0][2].language, 'ar');
  c.choose('granted');
  assert.equal(f.window.dataLayer.map(x => Array.from(x)).filter(x => x[0] === 'event' && x[1] === 'page_view').length, 1);
  assert.doesNotMatch(JSON.stringify(commands), /private@example|gclid|\?|#/i);
  c.track('booking_intent');
  assert.equal(Array.from(f.window.dataLayer.at(-1))[1], 'booking_intent');
  c.choose('denied');
  assert.equal(f.window[`ga-disable-${measurementId}`], true);
  assert.equal(f.window.dataLayer.length, 0);
  assert.deepEqual(f.trace.slice(-2), [['remove'], ['reload']]);
  c.track('order_intent');
  assert.equal(f.window.dataLayer.length, 0);
  assert.ok(f.cookieWrites.some(x => x.startsWith('_ga=')));
});

test('history sanitization failure never exposes the original query to Google', async () => {
  const { createBrowserEffects, createMeasurementController } = await implementation();
  const f = browserFixture({ historyFails: true });
  const c = createMeasurementController(config, createBrowserEffects(f.window, f.document));
  c.choose('granted');
  c.track('order_intent');
  assert.equal(f.trace.length, 0);
  assert.equal(f.window.dataLayer, undefined);
});

test('blocked cookie access does not break consent choices or native site links', async () => {
  const { purgeAnalyticsCookies } = await implementation();
  const document = { get cookie() { throw new Error('cookies blocked'); } };
  assert.doesNotThrow(() => purgeAnalyticsCookies(document, 'www.levante-radolfzell.de'));
});

test('withdrawal cannot restore an old grant when localStorage is readable but no longer writable', async () => {
  const { CONSENT_KEY, createBrowserEffects, createMeasurementController } = await implementation();
  const f = browserFixture();
  f.storage.set(CONSENT_KEY, JSON.stringify({version: 1, choice: 'granted', timestamp: Date.now()}));
  const c = createMeasurementController(config, createBrowserEffects(f.window, f.document));
  assert.equal(f.trace.filter(x => x[0] === 'request').length, 1);
  f.window.localStorage.setItem = () => { throw new Error('quota or read-only storage'); };
  f.window.localStorage.removeItem = () => { throw new Error('read-only storage'); };
  c.choose('denied');
  f.trace.length = 0;
  const nextDocument = createMeasurementController(config, createBrowserEffects(f.window, f.document));
  assert.notEqual(nextDocument.choice, 'granted');
  nextDocument.track('booking_intent');
  assert.equal(f.trace.filter(x => x[0] === 'request').length, 0);
});

test('stored grants fail closed when both browser stores refuse writes', async () => {
  const { CONSENT_KEY, createBrowserEffects, createMeasurementController } = await implementation();
  const f = browserFixture();
  f.storage.set(CONSENT_KEY, JSON.stringify({version: 1, choice: 'granted', timestamp: Date.now()}));
  for (const store of [f.window.localStorage, f.window.sessionStorage]) {
    store.setItem = () => { throw new Error('read-only'); };
    store.removeItem = () => { throw new Error('read-only'); };
  }
  const c = createMeasurementController(config, createBrowserEffects(f.window, f.document));
  assert.equal(c.choice, null);
  assert.equal(f.trace.length, 0);
});
