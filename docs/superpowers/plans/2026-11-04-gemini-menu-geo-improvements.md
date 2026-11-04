# Gemini Menu GEO Improvements Implementation Plan

> For agentic workers: use executing-plans and test-driven-development. The owner's 2026-11-04 request is the approved specification.

**Goal:** Implement the four requested review items without changing any menu item ID, name, description, price, or existing vegan/vegetarian classification.

**Architecture:** Keep the existing dependency-free Node.js static-site generator. Change menuGraph, multilingual menu copy, and the home compatibility-page generator; do not edit generated dist files or alter hosting/DNS.

**Tech Stack:** Node.js 24, node:test, existing HTML templates, GitHub Pages Actions.

**Spec:** Owner request in this conversation on 2026-11-04: localized Restaurant.hasMenu references and complete entity fields; HalalDiet on the specified ten meat/poultry items with visible multilingual wording; history-replacing JavaScript immediately before the /home/ meta refresh; source-locked transliteration.

## Constraints and decisions
- Baseline: main a9985f99a5b9d710f4bd6bad54f21fd20d5139de; clean working tree; 27 existing tests pass.
- Work in the existing clean checkout: owner explicitly requested commit/push to main. No unrelated branch, file, account, DNS, or workflow changes.
- data/menu.json remains byte-for-byte unchanged. Capture its baseline names/prices as a test fixture before modifying source.
- All three menu pages must reference their own existing #menu node and the shared /#restaurant ID.
- Populate region/cuisines from existing site data; acceptsReservations remains true.
- Halal allowlist: kebbeh, arays-lahmeh, lamb-soup, chicken-salad, chicken-tajine, lamb-tajine, kafta-mishwiyeh, shish-taouk, mix-grill, lahmeh-mishwiyeh. Classification follows the owner's explicit assurance; no independent certification is claimed.
- Preserve VeganDiet/VegetarianDiet and avoid inferring HalalDiet for unlisted items.
- Add menu note: DE 'Alle Fleisch- und Gefluegelgerichte sind halal.' with the proper umlaut in production; EN 'All meat and poultry dishes are halal.'; AR 'جميع أطباق اللحوم والدواجن حلال.'
- Add window.location.replace only for /home/; preserve noindex, canonical, meta refresh and the fallback link. Do not claim HTTP 301 or a guaranteed network latency.
- Source data says Ayays Zaatar (DE/EN), عرايس زعتر (AR), EUR 10.00. No separate printed-menu lock is present in the tracked source. Retain the exact spelling and document it.

## Review focus
- Each localized hasMenu resolves to a Menu actually present in the same graph.
- Halal schema never overrides vegan/vegetarian classifications.
- Schema text is backed by visible translated wording, not a hidden-only claim.
- Exact menu text and prices remain unchanged across all 105 language-item instances.
- Redirect script uses replace, appears before the fallback, and does not affect unrelated legacy routes.

## Tasks
- [x] Read current code, source inventory, menu data, workflow and baseline tests.
- [ ] Add tests/gemini-geo.test.mjs and tests/fixtures/menu-source-lock-20261104.json.
- [ ] Run new tests before implementation; record expected missing-field/note/redirect failures.
- [ ] Update src/schema.mjs with localized hasMenu, region, cuisines, reservation flag and the approved HalalDiet allowlist.
- [ ] Update src/i18n.mjs and src/templates.mjs with visible translated halal notes.
- [ ] Update renderRedirect plus scripts/build.mjs so only /home/ includes the exact history-replacing script before meta refresh.
- [ ] Build; run targeted tests, then the complete npm test suite; review git diff and verify menu-data SHA256 unchanged.
- [ ] Save implementation/review notes; commit the scoped changes; push main without force.
- [ ] Verify the Actions run for the new commit succeeds in both build/test and deploy jobs.
- [ ] Fetch the live menu pages and /home/; compare response bodies with dist; independently assert graph fields, exact ten HalalDiet items, visible notes, unchanged menu item text/prices, and redirect order.
- [ ] Save and print live head/JSON-LD evidence with retrieval time and hashes, clearly separating any missing proof.
