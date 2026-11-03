# Levante production HTTPS and SEO/GEO verification
Checked: 2026-11-03T23:48:01+01:00 (Europe/Berlin). TLS is valid. Search engine indexing follow-up is partially pending.

## GitHub Pages and TLS
- GitHub Pages REST GET: source GitHub Actions (build_type=workflow), custom domain www.levante-radolfzell.de, https_enforced=true, build status built.
- Pages certificate: approved, both www.levante-radolfzell.de and levante-radolfzell.de covered, expires 2027-02-01.
- Independent Qualys SSL Labs assessment: Let's Encrypt YR1 certificate, trusted chain with SNI, SSL Labs grade B, certificate SHA256 2024b1b7f71fbda06a023d933eb84ee34a686e0568c9ce4128d629569a376de3.
- HTTPS root and Speisekarte returned 200. HTTP apex returned 301 to HTTP www then 301 to HTTPS www; HTTP www directly returned 301 to HTTPS www. HTTPS restaurant subdomain returned 302 to canonical HTTPS www, not 404.

## Structured data
- Live Google Rich Results Test: successful crawl; 3 valid items (Breadcrumbs, Local businesses, Organisation), no reported errors/warnings. https://agent.tinyfish.ai/runs/e3baf55d-7a2b-472d-a658-73885c3f8abe
- Live Schema.org Validator: homepage 3 objects (ImageObject, WebSite, Menu), zero errors/warnings; menu page 1 Menu object, zero errors/warnings. https://agent.tinyfish.ai/runs/3dc6fe68-a620-4821-b827-7a74647b5b76
- These tools apply different detection rules and are reported separately.

## Search Console: sc-domain:levante-radolfzell.de
- Canonical www sitemap already submitted, Success, 10 URLs discovered; obsolete restaurant sitemap absent.
- Root is indexed; a repeat indexing request was blocked by Google daily quota.
- Local owner indexing-requests.log shows successes for /speisekarte/, /en/, /en/menu/, /ar/. /ar/menu/ is still pending because daily quota was exceeded.
- Historical noindex exclusion affects 1 page; validation started on 2026-11-03. Its exact association to old HTTP root and final validation outcome are not confirmed.
- GSC source: https://agent.tinyfish.ai/runs/d109bbe6-f46c-4c60-bcd3-cb75a04a68aa

## Bing Webmaster
- The www sitemap was submitted; screenshot status Processing, 0 discovered at that moment.
- The six final canonical URLs were submitted on 2026-11-03 at 23:39 (owner screenshot).
- New Site Scan LEVANTE_WWW_POST_HTTPS_20261103 was started and queued; no final scan results yet.

## External business profiles, from previous report only
- Google Business: removal of Reservations required pending Google's review; not newly reverified.
- Bing Places: verified/synced but publication still pending; not newly reverified.

## Limitations and safety
- Google daily quota prevents confirming a fresh request for every URL today. Google indexing is not instantaneous.
- No Lighthouse test score is claimed. No email DNS (MX, SPF, DKIM, DMARC), public email, Norton, purchases, or unrelated sessions were changed.

## Verified workflow evidence
- GitHub Actions run 41734396660 was verified completed/success for commit 7a1746f6b4e3dd621178eeb677df91f080954946 (2026-11-03 22:51:36 UTC), before this subsequent documentary update: https://github.com/qasimoqaily-max/levante-restaurant-schema/actions/runs/41734396660
