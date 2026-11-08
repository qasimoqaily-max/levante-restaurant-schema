// Optional analytics only. The Google library is never loaded for an undecided
// or rejecting visitor. Intent events are not completed bookings or purchases.
export const CONSENT_KEY = 'levante-measurement-consent-v1';
const SESSION_DENIAL_KEY = `${CONSENT_KEY}-session-denial`;
const CONSENT_AGE_MS = 180 * 86400000;
const INTENTS = new Set(['click_to_call', 'booking_intent', 'order_intent']);
const DENIED = { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };

function originOnly(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.origin : '';
  } catch { return ''; }
}

export function buildMeasurementOptions(config, context) {
  const origin = originOnly(context.origin);
  if (!origin) return null;
  let path = '/';
  try {
    const url = new URL(config.pagePath || '/', origin);
    if (url.origin === origin) path = url.pathname;
  } catch { /* Keep the non-identifying homepage fallback. */ }
  const options = {
    send_page_view: false,
    page_location: origin + path,
    page_referrer: originOnly(context.referrer),
    page_title: 'Levante Restaurant',
    language: ['de', 'en', 'ar'].includes(config.pageLanguage) ? config.pageLanguage : 'de',
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    cookie_domain: 'none',
    cookie_path: '/',
    cookie_expires: 2592000,
    cookie_update: false,
  };
  // Read only the owner-approved campaign triple. No URL or campaign data is
  // persisted locally; arbitrary UTM values and advertising click IDs are ignored.
  const params = new URLSearchParams(context.search || '');
  const approved = { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'smart_radolfzell' };
  if (Object.entries(approved).every(([key, value]) => params.getAll(key).length === 1 && params.get(key) === value)) {
    Object.assign(options, { campaign_source: 'google', campaign_medium: 'cpc', campaign_name: 'smart_radolfzell' });
  }
  return options;
}

function storedChoice(raw, now) {
  try {
    const value = JSON.parse(raw);
    if (value?.version === 1 && ['granted', 'denied'].includes(value.choice)
      && Number.isFinite(value.timestamp) && value.timestamp <= now
      && now - value.timestamp < CONSENT_AGE_MS) return value;
  } catch { /* Missing, inaccessible and malformed storage all mean no consent. */ }
  return null;
}

export function createMeasurementController(config, effects) {
  const validId = typeof config.measurementId === 'string' && /^G-[A-Z0-9]+$/.test(config.measurementId);
  const options = buildMeasurementOptions(config, effects.context);
  function readRecord() {
    try {
      const raw = effects.readConsent();
      const saved = storedChoice(raw, effects.now());
      if (raw !== null && !saved) { try { effects.clearConsent?.(); } catch { /* Storage may refuse deletion. */ } }
      return saved;
    } catch { return null; }
  }
  let record = readRecord();
  let running = false;

  function start() {
    if (record?.choice === 'granted' && validId && options && !running) {
      try { running = effects.startGoogle(config.measurementId, options) !== false; } catch { running = false; }
    }
  }

  function stop() {
    if (running) effects.stopGoogle();
    effects.purgeCookies();
    if (running) {
      running = false;
      // Removing a loaded script alone cannot remove Google's registered event
      // handlers. Reload with the saved denial so the next document loads none.
      effects.reload();
    }
  }

  if (record?.choice === 'granted') start();
  else effects.purgeCookies();

  return {
    get choice() { return record?.choice ?? null; },
    get available() { return Boolean(validId && options); },
    choose(choice) {
      if (!['granted', 'denied'].includes(choice)) return;
      record = { version: 1, choice, timestamp: effects.now() };
      try { effects.writeConsent(JSON.stringify(record)); } catch { /* Consent still applies to this document. */ }
      if (choice === 'granted') start();
      else stop();
    },
    refresh() {
      record = readRecord();
      if (record?.choice === 'granted') start();
      else stop();
    },
    track(action) {
      if (record && !storedChoice(JSON.stringify(record), effects.now())) { record = null; stop(); }
      if (record?.choice !== 'granted' || !running || !INTENTS.has(action)) return;
      effects.sendEvent(config.measurementId, action, {
        send_to: config.measurementId,
        page_location: options.page_location,
        page_referrer: options.page_referrer,
        language: options.language,
        transport_type: 'beacon',
      });
    },
  };
}

export function purgeAnalyticsCookies(doc, hostname) {
  let cookies;
  try { cookies = doc.cookie; } catch { return; }
  const names = cookies.split(';').map(value => value.split('=')[0].trim())
    .filter(name => /^(_ga(?:_[A-Z0-9_]+)?|_gid|_gat(?:_[A-Z0-9_]+)?|_gcl_[A-Z0-9_]+)$/i.test(name));
  const domains = [''];
  if (/^[a-z0-9.-]+$/i.test(hostname) && !/^\d+(?:\.\d+){3}$/.test(hostname)) {
    const labels = hostname.split('.');
    for (let i = 0; i < labels.length - 1; i++) domains.push(labels.slice(i).join('.'));
  }
  for (const name of names) for (const domain of domains) {
    try { doc.cookie = `${name}=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/${domain ? `; Domain=${domain}` : ''}`; } catch { /* Cookie storage may be blocked. */ }
  }
}

export function createBrowserEffects(win, doc) {
  let loadedId = '';
  let loader;
  return {
    get context() { return { origin: win.location.origin, search: win.location.search, referrer: doc.referrer }; },
    now: () => Date.now(),
    readConsent() {
      // A session denial prevents a failed durable write from restoring an old
      // grant on reload. It contains the same preference-only record, no URL/IDs.
      try {
        const session = win.sessionStorage.getItem(SESSION_DENIAL_KEY);
        if (storedChoice(session, Date.now())?.choice === 'denied') return session;
        if (session !== null) win.sessionStorage.removeItem(SESSION_DENIAL_KEY);
      } catch { /* Session storage can be unavailable. */ }
      const raw = win.localStorage.getItem(CONSENT_KEY);
      if (storedChoice(raw, Date.now())?.choice === 'granted') {
        // Do not restore a saved grant from a read-only store: a later rejection
        // could not be saved there. This probe preserves its original timestamp.
        try {
          win.localStorage.setItem(CONSENT_KEY, raw);
          if (win.localStorage.getItem(CONSENT_KEY) !== raw) throw new Error('Consent not saved');
        } catch {
          try { win.localStorage.removeItem(CONSENT_KEY); } catch { /* Fail closed. */ }
          return null;
        }
      }
      return raw;
    },
    writeConsent(value) {
      const choice = JSON.parse(value).choice;
      if (choice === 'denied') {
        try { win.sessionStorage.setItem(SESSION_DENIAL_KEY, value); } catch { /* Durable storage may still work. */ }
      }
      try {
        win.localStorage.setItem(CONSENT_KEY, value);
        if (win.localStorage.getItem(CONSENT_KEY) !== value) throw new Error('Consent not saved');
      } catch (error) {
        try { win.localStorage.removeItem(CONSENT_KEY); } catch { /* Future restores will fail the write probe. */ }
        throw error;
      }
      if (choice === 'granted') { try { win.sessionStorage.removeItem(SESSION_DENIAL_KEY); } catch { /* Re-prompt safely if the session denial cannot be removed. */ } }
    },
    clearConsent: () => win.localStorage.removeItem(CONSENT_KEY),
    purgeCookies: () => purgeAnalyticsCookies(doc, win.location.hostname),
    startGoogle(id, options) {
      // Google's library must not see an original advertising click ID or an
      // arbitrary query/hash. Preserve attribution only through approved fields.
      if (win.location.search || win.location.hash) {
        try { win.history.replaceState(null, '', options.page_location); } catch { return false; }
        if (win.location.search || win.location.hash) return false;
      }
      loadedId = id;
      win[`ga-disable-${id}`] = false;
      win.dataLayer = [];
      win.gtag = function () { win.dataLayer.push(arguments); };
      win.gtag('consent', 'default', { ...DENIED });
      win.gtag('consent', 'update', { ...DENIED, analytics_storage: 'granted' });
      win.gtag('set', { ads_data_redaction: true, url_passthrough: false });
      win.gtag('js', new Date());
      win.gtag('config', id, options);
      win.gtag('event', 'page_view', {
        send_to: id,
        page_location: options.page_location,
        page_referrer: options.page_referrer,
        page_title: options.page_title,
        language: options.language,
        transport_type: 'beacon',
      });
      loader = doc.createElement('script');
      loader.async = true;
      loader.referrerPolicy = 'origin';
      loader.dataset.levanteGoogleTag = '';
      loader.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
      doc.head.append(loader);
      return true;
    },
    sendEvent: (id, action, params) => { if (!win[`ga-disable-${id}`]) win.gtag('event', action, params); },
    stopGoogle() {
      if (loadedId) win[`ga-disable-${loadedId}`] = true;
      loader?.remove();
      if (Array.isArray(win.dataLayer)) win.dataLayer.length = 0;
    },
    reload: () => win.location.reload(),
  };
}

export function initMeasurement(win, doc) {
  const configElement = doc.querySelector('#measurement-config');
  const panel = doc.querySelector('#measurement-consent');
  if (!configElement || !panel) return;
  let config;
  try { config = JSON.parse(configElement.textContent); } catch { return; }
  const controller = createMeasurementController(config, createBrowserEffects(win, doc));
  let opener;
  panel.hidden = !controller.available || controller.choice !== null;
  doc.querySelectorAll('[data-consent-choice]').forEach(button => button.addEventListener('click', () => {
    controller.choose(button.dataset.consentChoice);
    panel.hidden = true;
    opener?.focus();
    opener = null;
  }));
  doc.querySelectorAll('[data-consent-settings]').forEach(button => button.addEventListener('click', () => {
    opener = button;
    panel.hidden = false;
    panel.focus({ preventScroll: true });
  }));
  doc.addEventListener('click', event => {
    if (event.defaultPrevented || (event.button !== undefined && event.button !== 0)) return;
    const anchor = event.target instanceof win.Element ? event.target.closest('a[data-measure-action]') : null;
    if (anchor) controller.track(anchor.dataset.measureAction);
    // Never prevent or delay the link's normal navigation to call/reserve/order.
  });
  win.addEventListener('storage', event => {
    if (event.key === CONSENT_KEY || event.key === null) {
      controller.refresh();
      panel.hidden = !controller.available || controller.choice !== null;
    }
  });
  return controller;
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') initMeasurement(window, document);
