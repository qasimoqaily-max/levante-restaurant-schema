import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPage, renderRedirect, render404 } from '../src/templates.mjs';

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
  write(routeFile(redirect.route), renderRedirect(site, redirect.target, redirect.lang));
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
  const links = alternates[page.route]
    ? Object.entries(alternates[page.route]).map(([lang, route]) => `    <xhtml:link rel="alternate" hreflang="${lang}" href="${site.baseUrl}${route}"/>`).join('\n')
    : '';
  return `  <url>\n    <loc>${site.baseUrl}${page.route}</loc>\n    <lastmod>2026-11-03</lastmod>${links ? `\n${links}` : ''}\n  </url>`;
}).join('\n');
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urlEntries}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${site.baseUrl}/sitemap.xml\n`);
write('site.webmanifest', JSON.stringify({
  name: 'Levante Restaurant Radolfzell',
  short_name: 'Levante',
  start_url: '/',
  display: 'standalone',
  background_color: '#f6efe3',
  theme_color: '#0c7773',
  icons: [
    { src: '/assets/img/favicon.png', sizes: '32x32', type: 'image/png' },
    { src: '/assets/img/levante-logo.webp', sizes: '800x800', type: 'image/webp' },
  ],
}, null, 2));
write('.nojekyll', '');
write('CNAME', 'www.levante-radolfzell.de\n');
copyDirectory(path.join(root, 'assets'), path.join(dist, 'assets'));

console.log(`Built ${pages.length} indexable pages and 3 compatibility redirects in ${dist}`);
