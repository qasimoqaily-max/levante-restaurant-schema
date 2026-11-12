import { t, routeByLang } from './i18n.mjs';
import { restaurantGraph, menuGraph, pageGraph } from './schema.mjs';
import { itemDiet } from './diet.mjs';

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
      <span class="brand-word">Levante</span><span class="brand-sub">Restaurant Radolfzell</span>
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
    <div><a href="tel:${site.business.phoneE164}" data-measure-action="click_to_call">${escapeHtml(site.business.phoneDisplay)}</a><br><a href="mailto:${site.business.email}">${escapeHtml(site.business.email)}</a></div>
    <div><a href="/impressum/">${escapeHtml(c.footer.imprint)}</a><br><a href="/datenschutz/">${escapeHtml(c.footer.privacy)}</a><br><button class="consent-settings" type="button" data-consent-settings aria-controls="measurement-consent">${escapeHtml(c.consent.settings)}</button></div>
  </div>
  <div class="shell footer-bottom"><span>© 2026 Levante Restaurant</span><span>Radolfzell am Bodensee</span></div>
</footer>`;
}

function measurementConsent(page) {
  const c = t(page.lang).consent;
  return `<section id="measurement-consent" class="consent-panel" role="region" aria-labelledby="measurement-consent-title" tabindex="-1" hidden>
  <div class="consent-content"><h2 id="measurement-consent-title">${escapeHtml(c.title)}</h2><p>${escapeHtml(c.text)}</p><p>${escapeHtml(c.choice)} <a href="/datenschutz/">${escapeHtml(c.privacy)}</a></p></div>
  <div class="consent-actions"><button class="consent-choice" type="button" data-consent-choice="granted">${escapeHtml(c.allow)}</button><button class="consent-choice" type="button" data-consent-choice="denied">${escapeHtml(c.reject)}</button></div>
</section>`;
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
    <a class="button button-primary" href="${site.actions.reserve}" rel="noopener" data-measure-action="booking_intent">${escapeHtml(c.actions.reserve)}</a>
    <a class="button button-light" href="${site.actions.order}" rel="noopener" data-measure-action="order_intent">${escapeHtml(c.actions.order)}</a>
    <a class="button button-ghost" href="tel:${site.business.phoneE164}" data-measure-action="click_to_call">${escapeHtml(c.actions.call)}</a>
  </div>`;
}

const featuredDishIds = ['levante-mix', 'hummus', 'falafel', 'kebbeh', 'vegetable-tajine', 'mix-grill'];

function renderDish(item, lang) {
  const c = t(lang);
  const diet = itemDiet(item);
  return `<li class="dish"><h3>${escapeHtml(item.name[lang])}${diet ? ` <span class="diet">${escapeHtml(c.diet[diet.key])}</span>` : ''}</h3><strong>${formatPrice(item.price, lang)}</strong>${item.description[lang] ? `<p>${escapeHtml(item.description[lang])}</p>` : ''}</li>`;
}

function infoStrip(site, lang) {
  const rows = lang === 'ar'
    ? [['الاثنين – الخميس', '16:00 – 22:00'], ['الجمعة – السبت', '11:00 – 00:00'], ['الأحد', '11:00 – 22:00']]
    : lang === 'en'
      ? [['Monday – Thursday', '16:00 – 22:00'], ['Friday – Saturday', '11:00 – 00:00'], ['Sunday', '11:00 – 22:00']]
      : [['Montag – Donnerstag', '16:00 – 22:00'], ['Freitag – Samstag', '11:00 – 00:00'], ['Sonntag', '11:00 – 22:00']];
  return `<div class="shell"><div class="info-strip"><div class="tile-band" aria-hidden="true"></div><dl class="info-grid">${rows.map(([day, time]) => `<div><dt>${day}</dt><dd dir="ltr">${time}</dd></div>`).join('')}<div><dt>${escapeHtml(site.business.street)}, ${escapeHtml(site.business.postalCode)} Radolfzell</dt><dd dir="ltr"><a href="tel:${site.business.phoneE164}" data-measure-action="click_to_call">${escapeHtml(site.business.phoneDisplay)}</a></dd></div></dl></div></div>`;
}

function renderHome(site, page, menu) {
  const c = t(page.lang);
  const alt = page.lang === 'ar'
    ? {
        hero: 'مائدة شامية متنوعة في مطعم ليفانتي رادولفتسل',
        garden: 'حديقة مطعم ليفانتي الخارجية في رادولفتسل',
        falafel: 'طبق فلافل مع الخضار وصلصة الطحينة',
        tea: 'إبريق زجاجي من الشاي بالنعناع الطازج مع كؤوس الشاي',
        interior: 'صالة مطعم ليفانتي بديكورها الشرقي',
        coffee: 'قهوة عربية تُسكب في فنجان مزخرف',
        gardenTable: 'طاولة مجهزة في حديقة مطعم ليفانتي الخضراء',
        mezze: 'حمص وسلطات ومقبلات ساخنة على طاولة المطعم',
      }
    : page.lang === 'en'
      ? {
          hero: 'A colourful Levantine table at Levante Restaurant Radolfzell',
          garden: 'The outdoor garden at Levante Restaurant Radolfzell',
          falafel: 'Falafel plate with vegetables and tahini sauce',
          tea: 'Glass pot of fresh mint tea with tea glasses',
          interior: 'The oriental-style dining room at Levante Restaurant',
          coffee: 'Arabic coffee being poured into a decorated cup',
          gardenTable: 'A laid table in the green garden of Levante Restaurant',
          mezze: 'Hummus, salads and warm mezze on the restaurant table',
        }
      : {
          hero: 'Levantinische Tafel im Levante Restaurant Radolfzell',
          garden: 'Garten des Levante Restaurants in Radolfzell',
          falafel: 'Falafelteller mit Gemüse und Tahinasauce',
          tea: 'Glaskanne mit frischem Minztee und Teegläsern',
          interior: 'Orientalisch eingerichteter Innenraum des Levante Restaurants',
          coffee: 'Arabischer Kaffee wird in eine verzierte Tasse eingeschenkt',
          gardenTable: 'Gedeckter Tisch im grünen Garten des Levante Restaurants',
          mezze: 'Hummus, Salate und warme Mezze auf dem Restauranttisch',
        };
  const allItems = menu.sections.flatMap(section => section.items);
  const dishes = featuredDishIds.map(id => allItems.find(item => item.id === id)).filter(Boolean);
  const photo = (file, text) => `<figure class="home-photo"><img src="/assets/img/${file}" width="1200" height="800" loading="lazy" decoding="async" alt="${escapeHtml(text)}"></figure>`;
  return `<main id="main">
  <section class="hero">
    <figure class="hero-media">
      <picture>
        <source type="image/avif" srcset="/assets/img/hero-table-768.avif 768w, /assets/img/hero-table-1200.avif 1200w" sizes="100vw">
        <img src="/assets/img/hero-table-1200.webp" srcset="/assets/img/hero-table-768.webp 768w, /assets/img/hero-table-1200.webp 1200w, /assets/img/hero-table.webp 1500w" sizes="100vw" width="1500" height="810" loading="eager" fetchpriority="high" decoding="sync" alt="${escapeHtml(alt.hero)}">
      </picture>
      <figcaption>Levante Restaurant · Radolfzell am Bodensee</figcaption>
    </figure>
    <div class="shell">
      <div class="hero-copy">
        <p class="eyebrow">${escapeHtml(c.hero.eyebrow)}</p>
        <h1>${escapeHtml(c.hero.title)}</h1>
        <p class="lead">${escapeHtml(c.hero.text)}</p>
        ${actionButtons(site, page.lang)}
      </div>
    </div>
  </section>
  ${infoStrip(site, page.lang)}
  <section class="section">
    <div class="shell dishes">
      <div class="dish-photos" data-tilt>
        <div class="dish-photos-inner">
          <img class="dish-photo-main" src="/assets/img/falafel-plate.webp" width="1200" height="800" loading="lazy" decoding="async" alt="${escapeHtml(alt.falafel)}">
          <img class="dish-photo-small" src="/assets/img/mint-tea.webp" width="1200" height="800" loading="lazy" decoding="async" alt="${escapeHtml(alt.tea)}">
        </div>
      </div>
      <div class="dishes-copy">
        <h2>${escapeHtml(c.menuIntro.title)}</h2>
        <p>${escapeHtml(c.menuIntro.text)}</p>
        <ul class="dish-list">${dishes.map(item => renderDish(item, page.lang)).join('')}</ul>
        <a class="button button-dark" href="${routeByLang[page.lang].menu}">${escapeHtml(c.actions.menu)}</a>
      </div>
    </div>
  </section>
  <section class="garden">
    <figure class="garden-media"><img src="/assets/img/garden-wide.webp" width="1600" height="1068" loading="lazy" decoding="async" alt="${escapeHtml(alt.garden)}"></figure>
    <div class="shell garden-inner">
      <div class="garden-panel">
        <h2>${escapeHtml(c.garden.title)}</h2>
        <p>${escapeHtml(c.garden.text)}</p>
        <div class="actions"><a class="button button-primary" href="${site.actions.reserve}" rel="noopener" data-measure-action="booking_intent">${escapeHtml(c.actions.reserve)}</a></div>
      </div>
    </div>
  </section>
  <section class="section section-tint">
    <div class="shell"><div class="section-heading"><h2>${escapeHtml(c.highlights.title)}</h2></div>
      <div class="feature-grid">${c.highlights.items.map(([title, text]) => `<article class="card"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></article>`).join('')}</div>
    </div>
  </section>
  <section class="section">
    <div class="shell">
      <div class="section-heading section-heading-row"><div><h2>${escapeHtml(c.galleryTitle)}</h2><p>${escapeHtml(c.galleryText)}</p></div><a class="text-link" href="/galerie/">${escapeHtml(c.nav.gallery)}</a></div>
      <div class="home-photo-grid" aria-label="Levante Restaurant">${photo('restaurant-interior.webp', alt.interior)}${photo('arabic-coffee.webp', alt.coffee)}${photo('garden-table.webp', alt.gardenTable)}${photo('mezze-table.webp', alt.mezze)}</div>
    </div>
  </section>
  <section id="faq" class="section section-tint">
    <div class="shell faq-layout"><div class="section-heading"><h2>${escapeHtml(c.faqTitle)}</h2></div><div class="faq-list">${c.faq.map(([q, a]) => `<details><summary>${escapeHtml(q)}</summary><p>${escapeHtml(a)}</p></details>`).join('')}</div></div>
  </section>
  <div class="tile-band" aria-hidden="true"></div>
  <section id="contact" class="section contact-section">
    <div class="shell contact-grid">
      <article><h2>${escapeHtml(c.contactTitle)}</h2><address>${escapeHtml(site.business.street)}<br>${escapeHtml(site.business.postalCode)} ${escapeHtml(site.business.locality)}</address><p><a href="tel:${site.business.phoneE164}" data-measure-action="click_to_call">${escapeHtml(site.business.phoneDisplay)}</a><br><a href="mailto:${site.business.email}">${escapeHtml(site.business.email)}</a></p><a class="text-link" href="${site.actions.maps}" rel="noopener">${escapeHtml(c.actions.directions)}</a></article>
      <article><h2>${escapeHtml(c.hoursTitle)}</h2>${hours(site, page.lang)}</article>
    </div>
  </section>
</main>`;
}

function formatPrice(value, lang) {
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-DE' : lang === 'en' ? 'en-DE' : 'de-DE', { style: 'currency', currency: 'EUR' }).format(Number(value));
}

function renderMenuItem(item, lang) {
  const c = t(lang);
  const diet = itemDiet(item);
  return `<article class="menu-item"><div><h3>${escapeHtml(item.name[lang])}${diet ? ` <span class="diet">${escapeHtml(c.diet[diet.key])}</span>` : ''}</h3>${item.description[lang] ? `<p>${escapeHtml(item.description[lang])}</p>` : ''}</div><strong>${formatPrice(item.price, lang)}</strong></article>`;
}

function renderMenu(site, page, menu) {
  const c = t(page.lang);
  return `<main id="main" class="page-main">
  <section class="page-hero"><div class="shell"><p class="eyebrow">Levante Restaurant · Radolfzell</p><h1>${escapeHtml(c.menuTitle)}</h1><p class="lead">${escapeHtml(c.menuLead)}</p>${actionButtons(site, page.lang)}</div></section>
  <section class="section"><div class="shell menu-layout">
    <nav aria-label="${escapeHtml(c.nav.menu)}"><ul class="menu-jump">${menu.sections.map(section => `<li><a href="#${section.id}">${escapeHtml(section.name[page.lang])}</a></li>`).join('')}</ul></nav>
    ${menu.sections.map(section => `<section class="menu-section" id="${section.id}"><header><h2>${escapeHtml(section.name[page.lang])}</h2>${section.note[page.lang] ? `<p>${escapeHtml(section.note[page.lang])}</p>` : ''}</header><div class="menu-items">${section.items.map(item => renderMenuItem(item, page.lang)).join('')}</div></section>`).join('')}
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
  return `<main id="main" class="page-main"><section class="page-hero"><div class="shell"><p class="eyebrow">Levante Restaurant · Radolfzell</p><h1>${escapeHtml(c.reviewsTitle)}</h1><p class="lead">${escapeHtml(c.reviewsText)}</p></div></section><section class="section"><div class="shell review-grid"><a class="review-card" href="${site.actions.reviews}" rel="noopener"><strong>${escapeHtml(c.reviewLinks.google)}</strong><span>${escapeHtml(c.actions.reviews)}</span></a><a class="review-card" href="${site.social.tripadvisor}" rel="noopener"><strong>${escapeHtml(c.reviewLinks.tripadvisor)}</strong><span>${escapeHtml(c.actions.reviews)}</span></a><a class="review-card" href="${site.actions.reviews}" rel="noopener"><strong>${escapeHtml(c.reviewLinks.leave)}</strong><span>${escapeHtml(c.actions.reviews)}</span></a></div></section></main>`;
}

function renderImprint(site) {
  return `<main id="main" class="page-main"><section class="page-hero"><div class="shell prose"><h1>Impressum</h1><h2>Angaben gemäß § 5 DDG</h2><p><strong>${escapeHtml(site.business.name)}</strong><br>Inhaber: ${escapeHtml(site.business.owner)}<br>${escapeHtml(site.business.street)}<br>${escapeHtml(site.business.postalCode)} ${escapeHtml(site.business.locality)}<br>Deutschland</p><h2>Kontakt</h2><p>Telefon: <a href="tel:${site.business.phoneE164}" data-measure-action="click_to_call">${escapeHtml(site.business.phoneDisplay)}</a><br>E-Mail: <a href="mailto:${site.business.email}">${escapeHtml(site.business.email)}</a></p><h2>Verbraucherstreitbeilegung</h2><p>Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p></div></section></main>`;
}

function renderPrivacy(site) {
  return `<main id="main" class="page-main"><section class="page-hero"><div class="shell prose"><h1>Datenschutzerklärung</h1><p>Stand: 8. November 2026</p>
<h2>1. Verantwortlicher</h2><p>${escapeHtml(site.business.name)}, Inhaber ${escapeHtml(site.business.owner)}, ${escapeHtml(site.business.street)}, ${escapeHtml(site.business.postalCode)} ${escapeHtml(site.business.locality)}. E-Mail: <a href="mailto:${site.business.email}">${escapeHtml(site.business.email)}</a>.</p>
<h2>2. Bereitstellung der Website</h2><p>Diese Website wird technisch über GitHub Pages bereitgestellt. Beim Aufruf können technisch erforderliche Serverprotokolle verarbeitet werden, insbesondere IP-Adresse, Zeitpunkt, angeforderte Datei, übertragene Datenmenge sowie Browser- und Betriebssystemangaben. Die Verarbeitung dient der sicheren und stabilen Bereitstellung der Website.</p>
<h2>3. Optionale Nutzungsstatistik und Ihre Auswahl</h2><p>Google Analytics 4 wird ausschließlich nach Ihrer ausdrücklichen Zustimmung geladen. Ohne Zustimmung werden weder das Google-Analyse-Skript geladen noch Analyse-Anfragen an Google gesendet. Ablehnen und Erlauben stehen gleichwertig zur Auswahl. Die Website sowie Telefon-, Reservierungs- und Bestelllinks funktionieren unabhängig von Ihrer Entscheidung.</p><p>Ihre Auswahl wird mit Zeitangabe und Versionsnummer lokal in Ihrem Browser gespeichert und gilt höchstens 180 Tage. Abgelaufene Einträge werden beim nächsten Aufruf entfernt, soweit der Browser den Speicherzugriff erlaubt. Eine Ablehnung kann zusätzlich für die laufende Browsersitzung gespeichert werden, damit sie auch bei einem fehlgeschlagenen dauerhaften Speichervorgang erhalten bleibt. Es werden dabei keine Werbekennungen oder Seitenadressen gespeichert. Über „Datenschutzeinstellungen“ im Seitenfuß können Sie die Auswahl jederzeit ändern oder Ihre Zustimmung widerrufen. Beim Widerruf wird die Messung gestoppt, unsere zugänglichen Google-Analyse-Cookies werden entfernt und die Seite bei Bedarf neu geladen. Die bis zum Widerruf erfolgte Verarbeitung bleibt davon unberührt.</p><p>Wenn Ihr Browser Änderungen am lokalen Speicher verhindert, kann Ihre Auswahl nicht zuverlässig gespeichert werden. Löschen Sie in diesem Fall die gespeicherten Websitedaten in Ihren Browsereinstellungen, sobald dies möglich ist.</p>
<h2>4. Umfang der Analyse</h2><p>Die freiwillige Statistik hilft uns, die Website und die Wirkung unserer Anzeigen zu beurteilen. Erfasst werden nach Zustimmung Klicks zum Anrufen, Reservieren und Bestellen sowie die Sprache und der Pfad der Seite. Diese Ereignisse beschreiben nur eine Kontakt-, Buchungs- oder Bestellabsicht; sie bestätigen keinen Anruf, keine abgeschlossene Reservierung und keinen Kauf. Wir melden dafür keine Preise oder erfundenen Umsätze.</p><p>Wir übergeben keine Namen, E-Mail-Adressen, Telefonnummern oder freien Formulareingaben in den Ereignisdaten. Seitenadressen werden ohne Abfrageparameter oder Fragment übermittelt. Es gibt kein domainübergreifendes Tracking zu externen Reservierungs- oder Bestellanbietern. Remarketing, Google Signals, personalisierte Anzeigen und erweiterte Conversions werden nicht aktiviert; die Werbespeicherung und die Freigaben für Werbenutzerdaten und Anzeigenpersonalisierung bleiben verweigert.</p><p>Nach Zustimmung kann Google Analytics pseudonyme Kennungen in eigenen Cookies dieser Website speichern. Deren Laufzeit ist auf 30 Tage begrenzt und wird nicht durch weitere Seitenaufrufe verlängert. Beim Laden und Senden entsteht eine Verbindung zu Google; dabei werden auch technisch notwendige Verbindungsdaten wie die IP-Adresse übertragen. Die Statistik ist deshalb nicht als vollständig anonym zu verstehen. Weitere Informationen enthält die <a href="https://www.google.com/policies/privacy/" rel="noopener">Datenschutzerklärung von Google</a>.</p>
<h2>5. Kontaktaufnahme</h2><p>Wenn Sie uns per Telefon oder E-Mail kontaktieren, verarbeiten wir Ihre Angaben zur Bearbeitung Ihrer Anfrage. Die Daten werden gelöscht, sobald sie für den Zweck nicht mehr erforderlich sind und keine gesetzlichen Aufbewahrungspflichten entgegenstehen.</p>
<h2>6. Externe Links</h2><p>Links zu Reservierung, Bestellung, Karten, sozialen Netzwerken und Bewertungsplattformen öffnen externe Anbieter. Erst beim Anklicken gelten deren Datenschutzbestimmungen. Unsere Klickmessung weist keine dort abgeschlossene Bestellung oder Reservierung nach.</p>
<h2>7. Ihre Rechte</h2><p>Sie haben im Rahmen der gesetzlichen Voraussetzungen Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch sowie ein Beschwerderecht bei einer Datenschutzaufsichtsbehörde.</p></div></section></main>`;
}

function renderContent(site, page, menu) {
  if (page.kind === 'home') return renderHome(site, page, menu);
  if (page.kind === 'menu') return renderMenu(site, page, menu);
  if (page.kind === 'gallery') return renderGallery(site, page);
  if (page.kind === 'reviews') return renderReviews(site, page);
  if (page.kind === 'imprint') return renderImprint(site);
  if (page.kind === 'privacy') return renderPrivacy(site);
  throw new Error(`Unknown page kind: ${page.kind}`);
}

function graphFor(site, page, menu) {
  const c = t(page.lang);
  if (page.kind === 'home') return restaurantGraph(site, page, { home: c.nav.home });
  if (page.kind === 'menu') return menuGraph(site, page, menu, { menu: c.nav.menu });
  return pageGraph(site, page, page.title.split('|')[0].trim());
}

export function renderPage(site, page, menu) {
  const canonical = absolute(site, page.route);
  const c = t(page.lang);
  const alternates = languageAlternates(site, page);
  const ogImage = absolute(site, site.assets.og);
  const ogLocale = page.lang === 'de' ? 'de_DE' : page.lang === 'en' ? 'en_GB' : 'ar_AR';
  const ogAlternates = ['de_DE', 'en_GB', 'ar_AR'].filter(locale => locale !== ogLocale);
  const graph = graphFor(site, page, menu);
  const measurementConfig = JSON.stringify({
    measurementId: site.measurement?.measurementId ?? '',
    pagePath: page.route,
    pageLanguage: page.lang,
  }).replaceAll('<', '\\u003c');
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
  <meta property="og:locale" content="${ogLocale}">
  ${ogAlternates.map(locale => `<meta property="og:locale:alternate" content="${locale}">`).join('\n  ')}
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Levante Restaurant Radolfzell">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(page.title)}">
  <meta name="twitter:description" content="${escapeHtml(page.description)}">
  <meta name="twitter:image" content="${ogImage}">
  <meta name="theme-color" content="#0a3a40">
  <link rel="icon" href="/assets/img/favicon.png" sizes="32x32">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="preload" href="/assets/fonts/alexandria-${page.lang === 'ar' ? 'arabic' : 'latin'}.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/assets/css/site.css?v=20261113-404">
  <script type="application/ld+json">${JSON.stringify(graph)}</script>
  <script src="/assets/js/site.js" defer></script>
  <script id="measurement-config" type="application/json">${measurementConfig}</script>
  <script type="module" src="/assets/js/measurement.js?v=20261108-measurement"></script>
</head>
<body>
  <a class="skip-link" href="#main">${escapeHtml(c.skip)}</a>
  ${nav(site, page)}
  ${renderContent(site, page, menu)}
  ${footer(site, page)}
  ${measurementConsent(page)}
</body>
</html>`;
}

export function renderRedirect(site, target, lang = 'de', replaceHistory = false) {
  const canonical = absolute(site, target);
  const historyScript = replaceHistory ? `<script>window.location.replace(${JSON.stringify(canonical)});</script>` : '';
  return `<!doctype html><html lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Weiterleitung | Levante Restaurant</title><meta name="robots" content="noindex,follow"><link rel="canonical" href="${canonical}">${historyScript}<meta http-equiv="refresh" content="0; url=${target}"></head><body><main><p><a href="${target}">Weiter</a></p></main></body></html>`;
}

export function render404(site) {
  return `<!doctype html><html lang="de" dir="ltr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Seite nicht gefunden | Levante Restaurant</title><meta name="description" content="Die angeforderte Seite wurde nicht gefunden. Zurück zum Levante Restaurant in Radolfzell oder direkt zur aktuellen Speisekarte."><meta name="robots" content="noindex,follow"><meta name="theme-color" content="#0a3a40"><link rel="icon" href="/assets/img/favicon.png" sizes="32x32"><link rel="preload" href="/assets/fonts/alexandria-latin.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/assets/css/site.css?v=20261113-404"></head><body><main id="main" class="error-page"><div><p class="eyebrow">404</p><h1>Seite nicht gefunden</h1><p>Die gesuchte Seite ist nicht verfügbar.</p><div class="actions"><a class="button button-primary" href="/">Zur Startseite</a><a class="button button-light" href="/speisekarte/">Zur Speisekarte</a></div><p class="error-alt" lang="en">Page not found. <a href="/en/">English homepage</a> · <a href="/menu-in-english/">Menu</a></p><p class="error-alt" lang="ar" dir="rtl">الصفحة غير موجودة. <a href="/ar/">الصفحة الرئيسية بالعربية</a> · <a href="/مينو-عربي/">المنيو</a></p></div></main></body></html>`;
}
