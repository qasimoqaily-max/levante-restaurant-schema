# Levante production SEO/GEO verification

Checked: 2026-11-04T00:01:30+01:00 (Europe/Berlin)

## Status
`PRODUCTION_TECHNICALLY_COMPLETE_EXTERNAL_CRAWL_AND_PROFILE_REVIEWS_PENDING`

The website, HTTPS, structured data, multilingual pages, sitemap and search-engine submissions are technically complete. Remaining items are external processing or quota-limited follow-up, not an unresolved production outage.

## Production and CI
- Production commit: `05fc40529e8f06f0e9d4012301ee509dfc19e27a`.
- GitHub Actions run: `41735271172` ? build **success**, acceptance tests **success**, deploy **success**.
- Pages source: GitHub Actions.
- Custom domain: `www.levante-radolfzell.de`.
- Enforce HTTPS: enabled.

## HTTPS and redirects
- Certificate covers `www.levante-radolfzell.de` and `levante-radolfzell.de`.
- SSL Labs grade: **B** on the GitHub Pages production endpoints.
- `restaurant.levante-radolfzell.de` redirects to the canonical www URL; its forwarding endpoint received SSL Labs grade **A**.
- HTTP www redirects to HTTPS www. Apex resolves to the canonical HTTPS site.

## Live crawl
- Indexable pages checked: **10**.
- Local references/assets checked: **39**.
- Errors: **0**.
- German and English pages use LTR; Arabic pages use `lang=ar` and RTL.
- Every indexable page has one H1, the expected canonical and parseable JSON-LD.
- Sitemap contains exactly the ten canonical pages; robots.txt points to it.

## Structured data
- Google Rich Results Test fetched the live production page successfully and reported **3 valid items**, including Breadcrumbs and Local business, with no errors or warnings.
- Schema.org Validator: homepage **0 errors / 0 warnings**; menu **0 errors / 0 warnings**.
- Live JSON-LD contains Restaurant, WebSite, WebPage, BreadcrumbList, ImageObject, GeoCoordinates, ReserveAction, OrderAction, Menu, MenuSection and MenuItem entities.

## Lighthouse production results
### Mobile
- Performance: **98**
- Accessibility: **100**
- Best Practices: **100**
- SEO: **100**
- FCP: **1.0 s**
- LCP: **1.7 s**
- CLS: **0**
- TBT: **20 ms**

### Desktop
- Performance: **100**
- Accessibility: **100**
- Best Practices: **100**
- SEO: **100**
- FCP/LCP: **0.3 s**
- CLS: **0**
- TBT: **0 ms**

Responsive AVIF/WebP hero assets reduced the mobile hero transfer from 379,618 bytes to 66,386 bytes and improved mobile LCP from 3.3 s to 1.7 s.

## Google Search Console
- Obsolete `restaurant.` sitemap removed.
- Canonical www sitemap submitted successfully; ten URLs discovered.
- Validate Fix started for the historical HTTP/noindex exclusion.
- Direct indexing requests accepted for root, German menu, English home/menu and Arabic home.
- Arabic menu direct request hit Google's daily quota; the URL is already in the accepted sitemap and remains queued for a later direct request.

## Bing Webmaster
- Canonical www sitemap submitted; status initially Processing with zero errors/warnings.
- Six final canonical language URLs submitted.
- New post-HTTPS Site Scan `LEVANTE_WWW_POST_HTTPS_20261103` started and queued.

## Business profiles
- Google Business opening and delivery hours are correct; removal of `Reservations required` remains under Google review.
- Bing Places is verified and synchronized with Google; Microsoft publication remains pending.

## Mail safety
MX, SPF, DKIM, DMARC and `info@levante-radolfzell.de` were preserved. No paid service was purchased.

## Remaining external follow-up
1. Retry the optional direct indexing request for `/ar/menu/` after Google resets the daily quota.
2. Read Bing Site Scan results when Microsoft completes the scan.
3. Confirm Google Business and Bing Places external reviews/publication.
