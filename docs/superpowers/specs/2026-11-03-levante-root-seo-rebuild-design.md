# Levante Root SEO/GEO Rebuild Design

## Intent
Replace the current Google Sites limitations with a fast, accessible, multilingual static website that Levante controls end-to-end, while preserving the public identity, existing URLs, email routing, Google Business data, and the current ordering/reservation services.

## Goals
- Make `www.levante-radolfzell.de` the canonical site with controllable HTML metadata, headings, structured data, sitemap, language signals, and redirects.
- Preserve the verified contact data, opening hours, menu, ordering, reservation, social, and legal information.
- Use only real Levante assets recovered from the current site; no generated restaurant or food photos.
- Provide German, English, and Arabic navigation/content with correct `lang`, `dir`, canonical, and hreflang signals.
- Make the site functional without analytics, trackers, third-party fonts, or cookies.
- Ship a maintainable data-driven static generator with automated SEO, link, schema, accessibility, and asset checks.

## Non-goals
- Do not alter MX, SPF, DKIM, DMARC, or mailbox settings.
- Do not change Google Business hours, menu, or categories in this rebuild.
- Do not publish fabricated review scores or AggregateRating markup.
- Do not purchase hosting, SSL, plugins, or advertising.
- Do not remove Google Sites until the replacement has passed local and preview validation.

## Constraints
- Current production remains Google Sites during staging.
- Preview uses the existing public GitHub Pages repository and `restaurant.levante-radolfzell.de` until final cutover.
- GitHub Pages custom-domain TLS must be valid before the preview link is promoted.
- Keep existing paths available: `/bewertungen`, `/galerie`, `/speisekarte`, `/menu-in-english`, `/مينو-عربي`, `/impressum`.
- Address: Löwengasse 30, 78315 Radolfzell am Bodensee.
- Phone: +49 7732 9589075. Email: info@levante-radolfzell.de.
- Main hours: Mon–Thu 16:00–22:00; Fri–Sat 11:00–00:00; Sun 11:00–22:00.
- Coordinates: 47.7381456, 8.9676054.

## Approaches considered
1. Continue patching Google Sites. Rejected because it cannot supply reliable parent-document JSON-LD, canonical metadata, language markup, redirects, or a real sitemap.
2. Build on IONOS Webspace. Technically suitable, but the current contract exposes no usable webspace without adding a product.
3. Build a dependency-free static site on GitHub Pages, validate it on the existing restaurant subdomain, then cut over DNS after TLS and acceptance. Chosen because it is reversible, costs nothing additional, and gives complete HTML control.

## Architecture
A Node.js build script reads verified business/menu/content JSON and emits plain HTML pages, CSS, JavaScript, JSON-LD, sitemap, robots, redirects, and manifest files. The repository stores optimized local images recovered from the existing Google Site. Node's built-in test runner validates every generated page and asset without third-party packages.

## Content model
- `data/site.json`: contact, hours, social links, actions, coordinates, legal identity.
- `data/menu.json`: menu sections/items with German, English, Arabic names/descriptions, price, dietary flags.
- `data/pages.json`: route metadata, titles, descriptions, language, canonical relationships.
- `assets/img/`: real Levante logo, food, garden, and interior photographs.

## Pages
- German: `/`, `/speisekarte/`, `/galerie/`, `/bewertungen/`, `/impressum/`, `/datenschutz/`.
- English: `/en/`, `/en/menu/`.
- Arabic: `/ar/`, `/ar/menu/` with RTL.
- Compatibility redirects: `/home/`, `/menu-in-english/`, `/مينو-عربي/`.

## SEO/GEO
- Unique title, meta description, canonical, H1, Open Graph, language, hreflang, and breadcrumbs.
- JSON-LD graph on the homepage: WebSite, Restaurant, WebPage, BreadcrumbList, ImageObject, ReserveAction, OrderAction.
- Menu JSON-LD on menu pages with MenuSection and MenuItem entities.
- `robots.txt`, `sitemap.xml`, and clean internal links.
- Visible factual answers for hours, halal positioning, vegan/vegetarian choices, reservations, delivery, takeaway, catering, accessibility, and location.

## Safety and cutover
The build is first deployed to the existing preview subdomain. The main `www` DNS is changed only after preview HTTPS, crawlability, schema, links, visual review, and rollback package are verified. Email DNS is never modified.
