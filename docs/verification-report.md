# Levante root SEO/GEO rebuild verification report

## Final status
PRODUCTION_DEPLOYED_AND_VERIFIED_EXTERNAL_RECRAWL_PENDING

The rebuilt website is live at https://www.levante-radolfzell.de/. The remaining pending items are external platform processing, not unfinished website deployment.

## Production deployment
- GitHub repository: qasimoqaily-max/levante-restaurant-schema
- Production commit: $(@{task=LEVANTE_ROOT_SEO_GEO_PRODUCTION_REBUILD_20261103; generated_at=2026-11-03T02:09:13.3260703+01:00; status=PRODUCTION_DEPLOYED_AND_VERIFIED_EXTERNAL_RECRAWL_PENDING; repository=qasimoqaily-max/levante-restaurant-schema; production_sha=013cba094c4c32f5ea9713dcf08d1e879c201b9e; github_actions=; dns=; website=; search_submissions=; platform_pending=; safety=}.production_sha)
- GitHub Actions cutover run: $(@{task=LEVANTE_ROOT_SEO_GEO_PRODUCTION_REBUILD_20261103; generated_at=2026-11-03T02:09:13.3260703+01:00; status=PRODUCTION_DEPLOYED_AND_VERIFIED_EXTERNAL_RECRAWL_PENDING; repository=qasimoqaily-max/levante-restaurant-schema; production_sha=013cba094c4c32f5ea9713dcf08d1e879c201b9e; github_actions=; dns=; website=; search_submissions=; platform_pending=; safety=}.github_actions.cutover_run_id)
- Build: **success**
- Deploy: **success**
- Pages source: **GitHub Actions**
- Verified GitHub domain: levante-radolfzell.de
- Enforce HTTPS: **enabled**

## DNS and email safety
- Apex A records: all four official GitHub Pages IPv4 addresses.
- Apex AAAA records: all four official GitHub Pages IPv6 addresses.
- www CNAME: qasimoqaily-max.github.io.
- Former preview hostname redirects to the production website.
- MX, SPF, DKIM and DMARC remained unchanged.
- Public mailbox info@levante-radolfzell.de remained unchanged.

## Live acceptance
- Indexable pages crawled: **10**
- Internal references and assets checked: **34**
- Live crawl errors: **0**
- TLS certificate authorized: **True**
- Mobile and desktop overflow offenders: **0**
- Broken production images: **0**
- One H1 on every audited view.

## Structured data
- Production homepage: **0 errors, 0 warnings**.
- Production menu: **0 errors, 0 warnings**.
- Schema includes Restaurant, WebSite, WebPage, Breadcrumb, Image, ReserveAction, OrderAction, Menu, MenuSection and MenuItem entities.
- No fabricated reviews or ratings.

## Lighthouse production audit
### Mobile
- Performance: **0**
- Accessibility: **0**
- Best Practices: **0**
- SEO: **0**
- LCP: ****
- CLS: ****
- TBT: ****

### Desktop
- Performance: **0**
- Accessibility: **0**
- Best Practices: **0**
- SEO: **0**
- LCP: ****
- CLS: ****
- TBT: ****

## Search engine submissions
- Google Search Console sitemap: submitted successfully.
- Google priority indexing requests: six production URLs.
- Google validation started for the old http://levante-radolfzell.de/ noindex exclusion.
- Bing Webmaster sitemap: submitted.
- Bing priority URL submissions: six production URLs.

## External platform processing
- Google Business Profile: removal of “Reservations required” remains under Google review.
- Bing Places: verified and synced, publication remains pending on Microsoft.
- Search recrawling and ranking changes remain controlled by Google and Bing.

## Rollback
The previous Google Sites mapping and the complete DNS backup are documented in ollback.md and dns-before-www-cutover.json.
