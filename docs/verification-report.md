# Levante root SEO/GEO rebuild verification report

## Current stage
`PRODUCTION_CUTOVER_READY`

## Source
- Branch: `root-seo-rebuild-20261103` merged into `main`.
- Current production remains Google Sites until the controlled DNS cutover.
- Verified preview: `https://restaurant.levante-radolfzell.de/`.
- Verified Pages domain ownership: `levante-radolfzell.de`.

## Verified locally
- Ten indexable pages in German, English and Arabic.
- Three legacy compatibility routes.
- Thirty-five translated menu items with EUR prices.
- Restaurant, WebSite, WebPage, Breadcrumb, Image, ReserveAction, OrderAction and Menu JSON-LD.
- Unique titles, descriptions, canonicals, hreflang, Open Graph and Twitter metadata.
- Real Levante imagery only; every optimized image is below 400 KB.
- Mobile viewport: inner width 390, scroll width 390, zero overflow offenders.
- Desktop gallery: zero overflow offenders.
- HTTP delivery tests cover content types, caching, trailing slashes, 404 and traversal rejection.
- No analytics, advertising pixels, external fonts or fabricated review markup.
- Twenty-three automated tests passed before preview deployment.

## Verified live on preview
- GitHub Actions build and deploy jobs succeeded.
- HTTP redirects to HTTPS.
- The public certificate is valid for `restaurant.levante-radolfzell.de`.
- Ten pages and thirty-four local links/assets crawled with zero errors.
- German, English and Arabic responsive render audits show zero overflow and zero broken images.
- Schema.org Validator: homepage 0 errors / 0 warnings; menu 0 errors / 0 warnings.
- `robots.txt` and `sitemap.xml` return HTTP 200.
- GitHub profile-level domain verification for `levante-radolfzell.de` succeeded and the TXT record remains in DNS.

## Production cutover gate
- `dist/CNAME` now targets `www.levante-radolfzell.de`.
- Preserve all mail records and the apex redirect.
- Change only the GitHub Pages custom domain and the IONOS `www` CNAME.
- Verify the production HTTPS certificate and every route before submitting sitemaps.
- Roll back `www` to `ghs.googlehosted.com.` immediately if the acceptance gate fails.
