# Levante website deployment runbook

## Deployment target
The repository `qasimoqaily-max/levante-restaurant-schema` stores the source. GitHub Actions builds the verified static output into `dist/` and deploys only that directory to GitHub Pages.

## Preview gate
1. Run `node scripts/build.mjs`.
2. Run `node --test tests/*.test.mjs`; every test must pass.
3. Confirm the visual smoke report at mobile width 390 and desktop width 1440 has no horizontal overflow.
4. Push to `main` and confirm both GitHub Actions jobs succeed.
5. Verify `restaurant.levante-radolfzell.de` returns a valid HTTPS certificate for the custom domain.
6. Verify homepage, German/English/Arabic menus, gallery, legal pages, legacy routes, `robots.txt`, and `sitemap.xml`.
7. Re-run structured-data validation on the HTTPS URL.

## Production cutover gate
Do not modify `www.levante-radolfzell.de` until the preview gate is complete. At cutover:
1. Record the current IONOS DNS export and screenshots.
2. Change only the web record for `www`; preserve MX, SPF, DKIM, DMARC, autodiscover and mail services.
3. Change the Pages custom domain/CNAME output from `restaurant.levante-radolfzell.de` to `www.levante-radolfzell.de` in one controlled release.
4. Verify HTTPS, canonical URLs, all routes, order/reservation links and email immediately.
5. Submit the production sitemap to Google Search Console and Bing Webmaster Tools.

## Acceptance
- 20+ automated tests pass.
- No external trackers or fonts.
- No fabricated ratings.
- Every indexable page has one H1, unique title/description, canonical, language, Open Graph and valid JSON-LD.
- All local images are under 400 KB and use dimensions, alt text and appropriate loading priority.
- Rollback is ready before DNS cutover.
