# Levante Root SEO/GEO Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and validate a complete multilingual static replacement for the Levante Google Site, deploy it safely to the existing preview domain, and prepare a reversible production cutover.

**Architecture:** A dependency-free Node generator consumes verified JSON data and produces plain HTML/CSS/JS and machine-readable SEO files. Real assets recovered from the current site are optimized locally. Node built-in tests gate metadata, links, schema, languages, accessibility, redirects, and asset budgets.

**Tech Stack:** Node.js 24, HTML5, CSS3, minimal vanilla JavaScript, JSON-LD, FFmpeg for image optimization, Git/GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-11-03-levante-root-seo-rebuild-design.md`

## Global Constraints
- Preserve Google Sites production until preview validation is complete.
- Never change MX/SPF/DKIM/DMARC or `info@levante-radolfzell.de`.
- Use only real recovered Levante images.
- Do not publish review ratings or claims not supported by current sources.
- No paid services, external analytics, trackers, fonts, or runtime dependencies.
- All public URLs must use `https://www.levante-radolfzell.de` in canonical/sitemap output; preview tests may override the base URL.

## Review Focus
- Broken legacy routes must resolve without duplicate-indexable content.
- German, English, and Arabic pages must use correct language/direction and mutual hreflang.
- JSON-LD must parse and reference visible factual content only.
- Every internal link and local image must resolve; all content images need descriptive alt text and dimensions.
- Preview deployment must not modify mail DNS or the production `www` record.

---

### Task 1: Baseline test harness and source inventory
**Files:**
- Create: `tests/site.test.mjs`
- Create: `tests/helpers.mjs`
- Create: `docs/source-inventory.md`

- [ ] Write tests that require the target routes, metadata, hreflang, JSON-LD, internal links, sitemap, robots, redirects, and asset budgets.
- [ ] Run `node --test tests/site.test.mjs`; verify failure because generated pages/data do not exist.
- [ ] Record the verified business data and recovered asset inventory.
- [ ] Commit `test: define Levante site acceptance gates`.

### Task 2: Data model and static generator
**Files:**
- Create: `data/site.json`, `data/menu.json`, `data/pages.json`
- Create: `scripts/build.mjs`
- Create: `src/templates.mjs`, `src/schema.mjs`, `src/i18n.mjs`

- [ ] Add failing data-validation tests for required languages, unique routes, menu prices, hours, and verified contact fields.
- [ ] Run tests and verify expected data failures.
- [ ] Implement the minimum generator/data model to emit the route tree into `dist/`.
- [ ] Run the targeted tests, then the full suite.
- [ ] Commit `feat: add data-driven multilingual site generator`.

### Task 3: Visual system and real image assets
**Files:**
- Create: `assets/css/site.css`, `assets/js/site.js`
- Create/optimize: `assets/img/*`
- Modify generator templates to emit responsive picture elements and accessible navigation.

- [ ] Add failing tests for local-only assets, alt text, width/height, hero priority, lazy loading, and file-size budgets.
- [ ] Optimize selected recovered images to WebP/JPEG derivatives and implement the visual system.
- [ ] Run tests and visual smoke checks at mobile and desktop widths.
- [ ] Commit `feat: add Levante visual system and optimized real assets`.

### Task 4: Structured data, language signals, and legal pages
**Files:**
- Modify: `src/schema.mjs`, `src/templates.mjs`, `data/pages.json`
- Generate: home/menu JSON-LD, `/impressum/`, `/datenschutz/`, language alternates.

- [ ] Add failing schema and language tests.
- [ ] Implement WebSite/Restaurant/WebPage/Breadcrumb/Image/Action graph and Menu entities.
- [ ] Add German legal pages without trackers or cookie banner.
- [ ] Run JSON parse/schema assertions and full suite.
- [ ] Commit `feat: add structured data and multilingual legal metadata`.

### Task 5: Redirects, sitemap, robots, and compatibility
**Files:**
- Generate: `sitemap.xml`, `robots.txt`, `404.html`, legacy route redirect pages.

- [ ] Add failing tests for `/home`, old English/Arabic paths, sitemap route coverage, and noindex redirects.
- [ ] Implement compatibility pages and crawl files.
- [ ] Run full suite and a local HTTP link crawl.
- [ ] Commit `feat: preserve legacy routes and crawl controls`.

### Task 6: Preview deployment and verification
**Files:**
- Create: `docs/deployment-runbook.md`, `docs/rollback.md`, `docs/verification-report.md`

- [ ] Build production output and verify a clean git diff.
- [ ] Run local server, tests, link crawl, image budget check, and JSON-LD validation.
- [ ] Push the isolated branch and deploy tested output to the existing preview repository/domain only.
- [ ] Verify HTTP status, HTTPS certificate, rendered pages, links, sitemap, robots, schema, and responsive screenshots.
- [ ] Record blockers without changing production `www` or mail DNS.
- [ ] Commit `docs: add deployment and rollback evidence`.

### Task 7: Production cutover gate
**Files:**
- Update: `docs/verification-report.md`, `docs/rollback.md`

- [ ] Confirm preview HTTPS and all acceptance tests.
- [ ] Back up current DNS and Google Sites URLs.
- [ ] Change only web records needed for `www`; preserve all mail records.
- [ ] Verify production pages, redirects, Search Console property, sitemap submission, Bing submission, and rollback readiness.
- [ ] Commit `chore: complete verified Levante web cutover`.
