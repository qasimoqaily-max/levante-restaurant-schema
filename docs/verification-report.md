# Levante root SEO/GEO rebuild verification report

## Current status
`PRODUCTION_TLS_AND_INDEXING_REPAIR_IN_PROGRESS`

The rebuilt multilingual website files are deployed, but production must not be called complete yet. Public TLS for `www.levante-radolfzell.de` is still awaiting issuance by GitHub Pages, so Google cannot currently fetch the HTTPS URL.

## Verified working
- GitHub Pages source: **GitHub Actions**.
- Custom domain: **www.levante-radolfzell.de**.
- Latest successful workflow after the CI repair: run **41726087801** for commit `380b994a3932ec53e3b94553e217818539eccccb`.
- Local acceptance gate: **27 passed, 0 failed**.
- Ten indexable pages are built in German, English and Arabic.
- Arabic pages use `lang=ar` and `dir=rtl`.
- Canonical, hreflang, metadata, sitemap, robots and JSON-LD are present in the generated site.
- Live content was checked for 32 internal references with no broken references.
- MX, SPF, DKIM and DMARC remain present at IONOS.
- The obsolete Search Console sitemap for `restaurant.` has been removed.
- `restaurant.levante-radolfzell.de` now redirects over HTTP to the canonical www site; HTTPS for the forwarding hostname is still pending.

## Blocking production issue
GitHub Pages reports:

- DNS check successful.
- Certificate not yet issued for `www.levante-radolfzell.de`.
- Enforce HTTPS unavailable until certificate issuance.

External SSL testing and Google Rich Results Test previously reported a certificate name mismatch (`*.github.io`) and Google page fetch failed with `Invalid server SSL certificate`.

## Search engine state
### Google
- Old `restaurant.` sitemap: removed.
- `www` sitemap: intentionally not submitted until public TLS is valid.
- Old HTTP noindex validation: not started yet; it will be started after HTTPS works.

### Bing
- No sitemap is currently registered.
- Seven legacy URLs are visible in URL Submission.
- Final canonical multilingual URLs and a new Site Scan are pending valid TLS.

## External platform state
- Google Business: opening and delivery hours are correct; removal of `Reservations required` remains under review.
- Bing Places: verified and synced with Google; publication remains pending with the displayed 7?12 day estimate.

## Next acceptance gate
Completion requires all of the following:
1. GitHub issues a certificate valid for `www.levante-radolfzell.de`.
2. Enforce HTTPS is enabled.
3. HTTP redirects to HTTPS for apex and www.
4. Google Rich Results Test can fetch the page.
5. The www sitemap and canonical URLs are submitted to Google and Bing.
6. Search Console Validate Fix starts for the old HTTP exclusion.
7. A fresh Bing Site Scan is started.
8. Production proof is updated only with observed results.
