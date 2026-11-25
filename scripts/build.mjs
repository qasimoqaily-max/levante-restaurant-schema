import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPage, renderRedirect, render404 } from '../src/templates.mjs';
import { copy } from '../src/i18n.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const readJson = file => JSON.parse(fs.readFileSync(path.join(root, 'data', file), 'utf8'));
const site = readJson('site.json');
const menu = readJson('menu.json');
const { pages } = readJson('pages.json');

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

function write(relativePath, content) {
  const file = path.join(dist, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
}

function routeFile(route) {
  if (route === '/') return 'index.html';
  return path.join(route.replace(/^\//, '').replace(/\/$/, ''), 'index.html');
}

function copyDirectory(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name);
    const target = path.join(to, entry.name);
    if (entry.isDirectory()) copyDirectory(source, target);
    else fs.copyFileSync(source, target);
  }
}

for (const page of pages) {
  write(routeFile(page.route), renderPage(site, page, menu));
}

for (const redirect of [
  { route: '/home/', target: '/', lang: 'de' },
  { route: '/menu-in-english/', target: '/en/menu/', lang: 'en' },
  { route: '/مينو-عربي/', target: '/ar/menu/', lang: 'ar' },
]) {
  write(routeFile(redirect.route), renderRedirect(site, redirect.target, redirect.lang, redirect.route === '/home/'));
}

write('404.html', render404(site));

const homeAlt = {
  '/': { de: '/', en: '/en/', ar: '/ar/', 'x-default': '/' },
  '/en/': { de: '/', en: '/en/', ar: '/ar/', 'x-default': '/' },
  '/ar/': { de: '/', en: '/en/', ar: '/ar/', 'x-default': '/' },
};
const menuAlt = {
  '/speisekarte/': { de: '/speisekarte/', en: '/en/menu/', ar: '/ar/menu/', 'x-default': '/speisekarte/' },
  '/en/menu/': { de: '/speisekarte/', en: '/en/menu/', ar: '/ar/menu/', 'x-default': '/speisekarte/' },
  '/ar/menu/': { de: '/speisekarte/', en: '/en/menu/', ar: '/ar/menu/', 'x-default': '/speisekarte/' },
};
const alternates = { ...homeAlt, ...menuAlt };
const urlEntries = pages.map(page => {
  // Content revision dates: home and menu pages changed with the 2026-11-12 redesign.
  const lastmod = page.kind === 'home' || page.kind === 'menu' ? '2026-11-12' : '2026-11-04';
  const links = alternates[page.route]
    ? Object.entries(alternates[page.route]).map(([lang, route]) => `    <xhtml:link rel="alternate" hreflang="${lang}" href="${site.baseUrl}${route}"/>`).join('\n')
    : '';
  return `  <url>\n    <loc>${site.baseUrl}${page.route}</loc>\n    <lastmod>${lastmod}</lastmod>${links ? `\n${links}` : ''}\n  </url>`;
}).join('\n');
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urlEntries}\n</urlset>\n`);
// llms.txt: a plain-text summary for AI assistants and AI search (llmstxt.org).
// Built from the same site data and German FAQ as the pages, so it cannot drift from them.
const b = site.business;
const hours = site.hours.main;
const span = ([open, close]) => `${open}–${close === '00:00' ? '24:00' : close}`;
write('llms.txt', [
  `# ${b.name} Radolfzell`,
  '',
  `> Restaurant mit levantinischer und arabischer Küche in ${b.locality}: Mezze, Falafel, Kebbeh, Tajine und Grillgerichte, viele vegane und vegetarische Gerichte. Verzehr im Restaurant und im Garten, Abholung, Lieferung und Catering.`,
  '',
  `- Adresse: ${b.street}, ${b.postalCode} ${b.locality}, Deutschland`,
  `- Telefon: ${b.phoneDisplay}`,
  `- E-Mail: ${b.email}`,
  `- Öffnungszeiten: Mo–Do ${span(hours.monThu)}, Fr–Sa ${span(hours.friSat)}, So ${span(hours.sun)} Uhr`,
  `- Küche: ${b.cuisines.join(', ')}`,
  `- Preisniveau: ${b.priceRange}`,
  '',
  '## Seiten',
  '',
  `- [Startseite](${site.baseUrl}/): Überblick, Öffnungszeiten, Anfahrt und häufige Fragen`,
  `- [Speisekarte](${site.baseUrl}/speisekarte/): aktuelle Speisekarte mit Preisen und veganen/vegetarischen Kennzeichnungen`,
  `- [Menu in English](${site.baseUrl}/en/menu/): current menu in English`,
  `- [المنيو بالعربية](${site.baseUrl}/ar/menu/): قائمة الطعام بالعربية`,
  `- [Galerie](${site.baseUrl}/galerie/): Fotos aus Restaurant, Garten und Küche`,
  `- [Bewertungen](${site.baseUrl}/bewertungen/): Links zu Google- und TripAdvisor-Bewertungen`,
  '',
  '## Reservieren und bestellen',
  '',
  `- [Tisch reservieren](${site.actions.reserve})`,
  `- [Online bestellen](${site.actions.order})`,
  '',
  '## Häufige Fragen',
  '',
  ...copy.de.faq.map(([question, answer]) => `- ${question} ${answer}`),
  '',
].join('\n'));
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${site.baseUrl}/sitemap.xml\n`);
write('site.webmanifest', JSON.stringify({
  name: 'Levante Restaurant Radolfzell',
  short_name: 'Levante',
  start_url: '/',
  display: 'standalone',
  background_color: '#ffffff',
  theme_color: '#0a3a40',
  icons: [
    { src: '/assets/img/favicon.png', sizes: '32x32', type: 'image/png' },
    { src: '/assets/img/levante-logo.webp', sizes: '800x800', type: 'image/webp' },
  ],
}, null, 2));
write('.nojekyll', '');
write('CNAME', 'www.levante-radolfzell.de\n');
// IndexNow ownership key (Bing, Yandex, Seznam, Naver): lets the site notify search engines of changed URLs.
const indexNowKey = 'cc66eba34041e0a3479e52589f5c7bcb';
write(`${indexNowKey}.txt`, `${indexNowKey}\n`);
copyDirectory(path.join(root, 'assets'), path.join(dist, 'assets'));

console.log(`Built ${pages.length} indexable pages and 3 compatibility redirects in ${dist}`);
