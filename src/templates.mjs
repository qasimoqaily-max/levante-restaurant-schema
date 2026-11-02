import { t, routeByLang } from './i18n.mjs';
import { restaurantGraph, menuGraph, pageGraph } from './schema.mjs';

export function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function absolute(site, route) {
  return new URL(route, `${site.baseUrl}/`).href;
}

function languageAlternates(site, page) {
  let routes = null;
  if (page.kind === 'home') routes = { de: '/', en: '/en/', ar: '/ar/', 'x-default': '/' };
  if (page.kind === 'menu') routes = { de: '/speisekarte/', en: '/en/menu/', ar: '/ar/menu/', 'x-default': '/speisekarte/' };
  if (!routes) return '';
  return Object.entries(routes)
    .map(([lang, route]) => `  <link rel="alternate" hreflang="${lang}" href="${absolute(site, route)}">`)
    .join('\n');
}

function nav(site, page) {
  const c = t(page.lang);
  const home = routeByLang[page.lang].home;
  const menu = routeByLang[page.lang].menu;
  const contact = page.kind === 'home' ? '#contact' : `${home}#contact`;
  const deRoute = page.kind === 'menu' ? '/speisekarte/' : '/';
  const enRoute = page.kind === 'menu' ? '/en/menu/' : '/en/';
  const arRoute = page.kind === 'menu' ? '/ar/menu/' : '/ar/';
  return `<header class="site-header">
  <div class="shell header-inner">
    <a class="brand" href="${home}" aria-label="${escapeHtml(c.siteName)}">
      <span class="brand-word">LEVANTE</span><span class="brand-sub">Restaurant · Radolfzell</span>
    </a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav"><span></span><span></span><span></span><span class="sr-only">Menu</span></button>
    <nav id="site-nav" class="site-nav" aria-label="Primary navigation">
      <a href="${home}">${escapeHtml(c.nav.home)}</a>
      <a href="${menu}">${escapeHtml(c.nav.menu)}</a>
      <a href="/galerie/">${escapeHtml(c.nav.gallery)}</a>
      <a href="/bewertungen/">${escapeHtml(c.nav.reviews)}</a>
      <a href="${contact}">${escapeHtml(c.nav.contact)}</a>
      <div class="mobile-languages" aria-label="Language">
        <a lang="de" href="${deRoute}"${page.lang === 'de' ? ' aria-current="page"' : ''}>Deutsch</a>
        <a lang="en" href="${enRoute}"${page.lang === 'en' ? ' aria-current="page"' : ''}>English</a>
        <a lang="ar" dir="rtl" href="${arRoute}"${page.lang === 'ar' ? ' aria-current="page"' : ''}>العربية</a>
      </div>
    </nav>
    <div class="lang-switch" aria-label="Language">
      <a lang="de" href="${deRoute}"${page.lang === 'de' ? ' aria-current="page"' : ''}>DE</a>
      <a lang="en" href="${enRoute}"${page.lang === 'en' ? ' aria-current="page"' : ''}>EN</a>
      <a lang="ar" dir="rtl" href="${arRoute}"${page.lang === 'ar' ? ' aria-current="page"' : ''}>AR</a>
    </div>
  </div>
</header>`;
}

function footer(site, page) {
  const c = t(page.lang);
  return `<footer class="site-footer">
  <div class="shell footer-grid">
    <div><strong>${escapeHtml(c.siteName)}</strong><p>${escapeHtml(site.business.street)}, ${escapeHtml(site.business.postalCode)} ${escapeHtml(site.business.locality)}</p></div>
    <div><a href="tel:${site.business.phoneE164}">${escapeHtml(site.business.phoneDisplay)}</a><br><a href="mailto:${site.business.email}">${escapeHtml(site.business.email)}</a></div>
    <div><a href="/impressum/">${escapeHtml(c.footer.imprint)}</a><br><a href="/datenschutz/">${escapeHtml(c.footer.privacy)}</a></div>
  </div>
  <div class="shell footer-bottom"><span>© 2026 Levante Restaurant</span><span>Radolfzell am Bodensee</span></div>
</footer>`;
}

function hours(site, lang) {
  const rows = lang === 'ar'
    ? [['الاثنين – الخميس', '16:00 – 22:00'], ['الجمعة – السبت', '11:00 – 00:00'], ['الأحد', '11:00 – 22:00']]
    : lang === 'en'
      ? [['Monday – Thursday', '16:00 – 22:00'], ['Friday – Saturday', '11:00 – 00:00'], ['Sunday', '11:00 – 22:00']]
      : [['Montag – Donnerstag', '16:00 – 22:00'], ['Freitag – Samstag', '11:00 – 00:00'], ['Sonntag', '11:00 – 22:00']];
  return `<dl class="hours-list">${rows.map(([day, time]) => `<div><dt>${day}</dt><dd>${time}</dd></div>`).join('')}</dl>`;
}

function actionButtons(site, lang) {
  const c = t(lang);
  return `<div class="actions">
    <a class="button button-primary" href="${site.actions.reserve}" rel="noopener">${escapeHtml(c.actions.reserve)}</a>
    <a class="button button-light" href="${site.actions.order}" rel="noopener">${escapeHtml(c.actions.order)}</a>
    <a class="button button-ghost" href="tel:${site.business.phoneE164}">${escapeHtml(c.actions.call)}</a>
  </div>`;
}

function renderHome(site, page) {
  const c = t(page.lang);
  const alt = page.lang === 'ar'
    ? {
        hero: 'مائدة شامية متنوعة في مطعم ليفانتي رادولفتسل',
        logo: 'شعار مطعم ليفانتي رادولفتسل',
        garden: 'حديقة مطعم ليفانتي الخارجية في رادولفتسل',
        falafel: 'طبق فلافل مع الخضار وصلصة الطحينة',
      }
    : page.lang === 'en'
      ? {
          hero: 'A colourful Levantine table at Levante Restaurant Radolfzell',
          logo: 'Levante Restaurant Radolfzell logo',
          garden: 'The outdoor garden at Levante Restaurant Radolfzell',
          falafel: 'Falafel plate with vegetables and tahini sauce',
        }
      : {
          hero: 'Levantinische Tafel im Levante Restaurant Radolfzell',
          logo: 'Logo des Levante Restaurants in Radolfzell',
          garden: 'Garten des Levante Restaurants in Radolfzell',
          falafel: 'Falafelteller mit Gemüse und Tahinasauce',
        };
  return `<main id="main">
  <section class="hero">
    <div class="shell hero-grid">
      <div class="hero-copy">
        <p class="eyebrow">${escapeHtml(c.hero.eyebrow)}</p>
        <h1>${escapeHtml(c.hero.title)}</h1>
        <p class="lead">${escapeHtml(c.hero.text)}</p>
        ${actionButtons(site, page.lang)}
      </div>
      <figure class="hero-media">
        <img src="/assets/img/hero-table.webp" width="1500" height="810" loading="eager" fetchpriority="high" decoding="async" alt="${escapeHtml(alt.hero)}">
        <figcaption>Levante Restaurant · Radolfzell am Bodensee</figcaption>
      </figure>
    </div>
  </section>
  <section class="section">
    <div class="shell"><div class="section-heading"><p class="eyebrow">Radolfzell am Bodensee</p><h2>${escapeHtml(c.highlights.title)}</h2></div>
      <div class="feature-grid">${c.highlights.items.map(([title, text]) => `<article class="card"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></article>`).join('')}</div>
      <div class="home-photo-grid" aria-label="Levante Restaurant">
        <figure class="home-photo home-photo-logo"><img src="/assets/img/levante-logo.webp" width="800" height="800" loading="lazy" decoding="async" alt="${escapeHtml(alt.logo)}"></figure>
        <figure class="home-photo home-photo-wide"><img src="/assets/img/garden-wide.webp" width="1600" height="1068" loading="lazy" decoding="async" alt="${escapeHtml(alt.garden)}"></figure>
        <figure class="home-photo"><img src="/assets/img/falafel-plate.webp" width="1200" height="800" loading="lazy" decoding="async" alt="${escapeHtml(alt.falafel)}"></figure>
      </div>
    </div>
  </section>
  <section class="section section-tint">
    <div class="shell split">
      <div><p class="eyebrow">Mezze · Tajine · Grill</p><h2>${escapeHtml(c.menuIntro.title)}</h2><p>${escapeHtml(c.menuIntro.text)}</p><a class="text-link" href="${routeByLang[page.lang].menu}">${escapeHtml(c.actions.menu)} →</a></div>
      <div class="menu-teaser"><span>Hummus</span><span>Falafel</span><span>Kebbeh</span><span>Tajine</span><span>Mix Grill</span></div>
    </div>
  </section>
  <section class="section">
    <div class="shell"><div class="section-heading"><h2>${escapeHtml(c.faqTitle)}</h2></div><div class="faq-list">${c.faq.map(([q, a]) => `<details><summary>${escapeHtml(q)}</summary><p>${escapeHtml(a)}</p></details>`).join('')}</div></div>
  </section>
  <section id="contact" class="section contact-section">
    <div class="shell contact-grid">
      <article><p class="eyebrow">${escapeHtml(c.hoursTitle)}</p><h2>${escapeHtml(c.hoursTitle)}</h2>${hours(site, page.lang)}</article>
      <article><p class="eyebrow">${escapeHtml(c.contactTitle)}</p><h2>${escapeHtml(c.contactTitle)}</h2><address>${escapeHtml(site.business.street)}<br>${escapeHtml(site.business.postalCode)} ${escapeHtml(site.business.locality)}</address><p><a href="tel:${site.business.phoneE164}">${escapeHtml(site.business.phoneDisplay)}</a><br><a href="mailto:${site.business.email}">${escapeHtml(site.business.email)}</a></p><a class="text-link" href="${site.actions.maps}" rel="noopener">${escapeHtml(c.actions.directions)} →</a></article>
    </div>
  </section>
</main>`;
}

function formatPrice(value, lang) {
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-DE' : lang === 'en' ? 'en-DE' : 'de-DE', { style: 'currency', currency: 'EUR' }).format(Number(value));
}

function renderMenu(site, page, menu) {
  const c = t(page.lang);
  return `<main id="main" class="page-main">
  <section class="page-hero"><div class="shell"><p class="eyebrow">Levante Restaurant · Radolfzell</p><h1>${escapeHtml(c.menuTitle)}</h1><p class="lead">${escapeHtml(c.menuLead)}</p>${actionButtons(site, page.lang)}</div></section>
  <section class="section"><div class="shell menu-layout">
    ${menu.sections.map(section => `<section class="menu-section" id="${section.id}"><header><h2>${escapeHtml(section.name[page.lang])}</h2>${section.note[page.lang] ? `<p>${escapeHtml(section.note[page.lang])}</p>` : ''}</header><div class="menu-items">${section.items.map(item => `<article class="menu-item"><div><h3>${escapeHtml(item.name[page.lang])}${item.diet !== 'none' ? ` <span class="diet">${escapeHtml(c.diet[item.diet])}</span>` : ''}</h3>${item.description[page.lang] ? `<p>${escapeHtml(item.description[page.lang])}</p>` : ''}</div><strong>${formatPrice(item.price, page.lang)}</strong></article>`).join('')}</div></section>`).join('')}
    <aside class="menu-note"><p>${escapeHtml(menu.note[page.lang])}</p></aside>
  </div></section>
</main>`;
}

function renderGallery(site, page) {
  const c = t(page.lang);
  const images = [
    ['facade.webp', 1200, 800, 'Fassade des Levante Restaurants in der Löwengasse in Radolfzell'],
    ['camel-entrance.webp', 800, 1200, 'Dekorativer Kamelaufsteller vor dem Levante Restaurant'],
    ['restaurant-interior.webp', 1200, 800, 'Orientalisch eingerichteter Innenraum des Levante Restaurants'],
    ['interior-counter.webp', 1200, 800, 'Theke und orientalische Dekoration im Levante Restaurant'],
    ['mezze-spread.webp', 1200, 800, 'Levantinische Mezze und Hauptgerichte auf einer gedeckten Tafel'],
    ['falafel-plate.webp', 1200, 800, 'Falafel mit frischem Gemüse und Tahinasauce'],
    ['food-and-drinks.webp', 1200, 800, 'Levantinische Gerichte mit hausgemachten Getränken'],
    ['arabic-coffee.webp', 1200, 800, 'Arabischer Kaffee wird in eine verzierte Tasse eingeschenkt'],
    ['mint-tea.webp', 1200, 800, 'Glaskanne mit frischem Minztee und Teegläsern'],
    ['garden-table.webp', 1200, 800, 'Gedeckter Tisch im grünen Garten des Levante Restaurants'],
    ['garden-tea.webp', 800, 1200, 'Teeservice auf einem Gartentisch im Levante Restaurant'],
    ['oriental-decor.webp', 1200, 800, 'Orientalisches Räuchergefäß als Detail der Restauranteinrichtung'],
    ['fresh-ingredients.webp', 1200, 800, 'Frische Zutaten und Gewürze für levantinische Gerichte'],
    ['mezze-table.webp', 1200, 800, 'Hummus, Salate und warme Mezze auf dem Restauranttisch'],
    ['oriental-lamps.webp', 800, 1200, 'Bunte orientalische Lampen im Innenraum des Restaurants'],
  ];
  return `<main id="main" class="page-main">
    <section class="page-hero"><div class="shell"><p class="eyebrow">Levante Restaurant · Radolfzell</p><h1>${escapeHtml(c.galleryTitle)}</h1><p class="lead">${escapeHtml(c.galleryLead)}</p></div></section>
    <section class="section"><div class="shell"><p class="gallery-intro">${escapeHtml(c.galleryText)}</p><div class="gallery-grid">${images.map(([file, width, height, alt], index) => `<figure class="gallery-item${height > width ? ' gallery-item-portrait' : ''}${index === 4 ? ' gallery-item-featured' : ''}"><img class="gallery-image" src="/assets/img/${file}" width="${width}" height="${height}" loading="lazy" decoding="async" alt="${escapeHtml(alt)}"><figcaption>${escapeHtml(alt)}</figcaption></figure>`).join('')}</div></div></section>
  </main>`;
}

function renderReviews(site, page) {
  const c = t(page.lang);
  return `<main id="main" class="page-main"><section class="page-hero"><div class="shell"><p class="eyebrow">Levante Restaurant · Radolfzell</p><h1>${escapeHtml(c.reviewsTitle)}</h1><p class="lead">${escapeHtml(c.reviewsText)}</p></div></section><section class="section"><div class="shell review-grid"><a class="review-card" href="${site.actions.reviews}" rel="noopener"><strong>${escapeHtml(c.reviewLinks.google)}</strong><span>${escapeHtml(c.actions.reviews)} →</span></a><a class="review-card" href="${site.social.tripadvisor}" rel="noopener"><strong>${escapeHtml(c.reviewLinks.tripadvisor)}</strong><span>${escapeHtml(c.actions.reviews)} →</span></a><a class="review-card" href="${site.actions.reviews}" rel="noopener"><strong>${escapeHtml(c.reviewLinks.leave)}</strong><span>${escapeHtml(c.actions.reviews)} →</span></a></div></section></main>`;
}

function renderImprint(site) {
  return `<main id="main" class="page-main"><section class="page-hero"><div class="shell prose"><h1>Impressum</h1><h2>Angaben gemäß § 5 DDG</h2><p><strong>${escapeHtml(site.business.name)}</strong><br>Inhaber: ${escapeHtml(site.business.owner)}<br>${escapeHtml(site.business.street)}<br>${escapeHtml(site.business.postalCode)} ${escapeHtml(site.business.locality)}<br>Deutschland</p><h2>Kontakt</h2><p>Telefon: <a href="tel:${site.business.phoneE164}">${escapeHtml(site.business.phoneDisplay)}</a><br>E-Mail: <a href="mailto:${site.business.email}">${escapeHtml(site.business.email)}</a></p><h2>Verbraucherstreitbeilegung</h2><p>Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p></div></section></main>`;
}

function renderPrivacy(site) {
  return `<main id="main" class="page-main"><section class="page-hero"><div class="shell prose"><h1>Datenschutzerklärung</h1><p>Stand: 3. November 2026</p><h2>1. Verantwortlicher</h2><p>${escapeHtml(site.business.name)}, Inhaber ${escapeHtml(site.business.owner)}, ${escapeHtml(site.business.street)}, ${escapeHtml(site.business.postalCode)} ${escapeHtml(site.business.locality)}. E-Mail: <a href="mailto:${site.business.email}">${escapeHtml(site.business.email)}</a>.</p><h2>2. Bereitstellung der Website</h2><p>Diese Website wird technisch über GitHub Pages bereitgestellt. Beim Aufruf können technisch erforderliche Serverprotokolle verarbeitet werden, insbesondere IP-Adresse, Zeitpunkt, angeforderte Datei, übertragene Datenmenge sowie Browser- und Betriebssystemangaben. Die Verarbeitung dient der sicheren und stabilen Bereitstellung der Website.</p><h2>3. Cookies und Analyse</h2><p>Diese Website setzt keine eigenen Analyse-, Marketing- oder Profiling-Cookies ein und verwendet keine externen Schriftarten oder Tracking-Skripte.</p><h2>4. Kontaktaufnahme</h2><p>Wenn Sie uns per Telefon oder E-Mail kontaktieren, verarbeiten wir Ihre Angaben zur Bearbeitung Ihrer Anfrage. Die Daten werden gelöscht, sobald sie für den Zweck nicht mehr erforderlich sind und keine gesetzlichen Aufbewahrungspflichten entgegenstehen.</p><h2>5. Externe Links</h2><p>Links zu Reservierung, Bestellung, Karten, sozialen Netzwerken und Bewertungsplattformen öffnen externe Anbieter. Erst beim Anklicken gelten deren Datenschutzbestimmungen.</p><h2>6. Ihre Rechte</h2><p>Sie haben im Rahmen der gesetzlichen Voraussetzungen Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch sowie ein Beschwerderecht bei einer Datenschutzaufsichtsbehörde.</p></div></section></main>`;
}

function renderContent(site, page, menu) {
  if (page.kind === 'home') return renderHome(site, page);
  if (page.kind === 'menu') return renderMenu(site, page, menu);
  if (page.kind === 'gallery') return renderGallery(site, page);
  if (page.kind === 'reviews') return renderReviews(site, page);
  if (page.kind === 'imprint') return renderImprint(site);
  if (page.kind === 'privacy') return renderPrivacy(site);
  throw new Error(`Unknown page kind: ${page.kind}`);
}

function graphFor(site, page, menu) {
  const c = t(page.lang);
  if (page.kind === 'home') return restaurantGraph(site, page, { reserve: c.actions.reserve, home: c.nav.home });
  if (page.kind === 'menu') return menuGraph(site, page, menu, { menu: c.nav.menu });
  return pageGraph(site, page, page.title.split('|')[0].trim());
}

export function renderPage(site, page, menu) {
  const canonical = absolute(site, page.route);
  const c = t(page.lang);
  const alternates = languageAlternates(site, page);
  const ogImage = absolute(site, site.assets.og);
  const graph = graphFor(site, page, menu);
  return `<!doctype html>
<html lang="${page.lang}" dir="${page.lang === 'ar' ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(page.title)}</title>
  <meta name="description" content="${escapeHtml(page.description)}">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="canonical" href="${canonical}">
${alternates}
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Levante Restaurant">
  <meta property="og:title" content="${escapeHtml(page.title)}">
  <meta property="og:description" content="${escapeHtml(page.description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${ogImage}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="theme-color" content="#0c7773">
  <link rel="icon" href="/assets/img/favicon.png" sizes="32x32">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="stylesheet" href="/assets/css/site.css">
  <script type="application/ld+json">${JSON.stringify(graph)}</script>
  <script src="/assets/js/site.js" defer></script>
</head>
<body>
  <a class="skip-link" href="#main">${escapeHtml(c.skip)}</a>
  ${nav(site, page)}
  ${renderContent(site, page, menu)}
  ${footer(site, page)}
</body>
</html>`;
}

export function renderRedirect(site, target, lang = 'de') {
  const canonical = absolute(site, target);
  return `<!doctype html><html lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Weiterleitung | Levante Restaurant</title><meta name="robots" content="noindex,follow"><link rel="canonical" href="${canonical}"><meta http-equiv="refresh" content="0; url=${target}"></head><body><main><p><a href="${target}">Weiter</a></p></main></body></html>`;
}

export function render404(site) {
  return `<!doctype html><html lang="de" dir="ltr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Seite nicht gefunden | Levante Restaurant</title><meta name="description" content="Die angeforderte Seite wurde nicht gefunden. Zurück zum Levante Restaurant in Radolfzell oder direkt zur aktuellen Speisekarte."><meta name="robots" content="noindex,follow"><link rel="stylesheet" href="/assets/css/site.css"></head><body><main id="main" class="error-page"><div><p class="eyebrow">404</p><h1>Seite nicht gefunden</h1><p>Die gesuchte Seite ist nicht verfügbar.</p><div class="actions"><a class="button button-primary" href="/">Zur Startseite</a><a class="button button-light" href="/speisekarte/">Zur Speisekarte</a></div></div></main></body></html>`;
}
