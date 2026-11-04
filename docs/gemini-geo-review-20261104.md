# Gemini GEO/SEO review implementation — 2026-11-04

## Scope and source
The owner explicitly requested the four improvements in the 2026-11-04 review. Baseline commit: a9985f99a5b9d710f4bd6bad54f21fd20d5139de. No hosting, DNS, email, workflow, prices, or item names are changed by this patch.

## Changes
1. On /speisekarte/, /en/menu/, and /ar/menu/, the shared Restaurant entity now references the page-local Menu entity via hasMenu. Its PostalAddress includes Baden-Württemberg; servesCuisine uses the existing four cuisine values; acceptsReservations is true.
2. Exactly the ten owner-specified meat/poultry item IDs receive https://schema.org/HalalDiet. Existing VeganDiet and VegetarianDiet values take precedence and remain unchanged. The menu header now contains a visible German, English, or Arabic statement that all meat and poultry dishes are halal. This reflects the owner's assurance and existing site claim, not an independently verified third-party certification.
3. Only /home/index.html gains window.location.replace("https://www.levante-radolfzell.de/") immediately before the existing zero-delay meta refresh. The noindex directive, canonical URL, refresh, and fallback link are preserved. This is a client-side history-replacing redirect, not a server-side HTTP 301 or a guaranteed zero-millisecond network navigation.
4. Ayays Zaatar is intentionally unchanged. The repository's source data uses that spelling in German and English and عرايس زعتر in Arabic, priced at EUR 10.00. The tracked repository/source inventory contains no separate printed-menu lock establishing an approved Arayes/Arays correction. The spelling is not corrected by inference.

## Price/item parity
- data/menu.json remains byte-for-byte unchanged.
- SHA256: 957483b42b862798e619b505656a46703aedd9bb53b47e88f62573dbd292af09
- tests/fixtures/menu-source-lock-20261104.json captures all 35 original items from the baseline, including names, descriptions, prices and existing diets.
- New tests compare every visible item name and exact formatted price with both this source lock and its JSON-LD MenuItem in each language: 105 language-item instances.
- Intentional future menu changes must update the source lock after approval, not silently bypass it.

## Test-first verification
- Baseline full suite: 27 passed, 0 failed.
- Added suite before implementation: 15 tests; 10 expected missing-feature failures and 5 parity/compatibility passes.
- Added suite after implementation: 15 passed, 0 failed.
- Complete suite after implementation: 42 passed, 0 failed.
- Commands: npm run build; node --test tests/gemini-geo.test.mjs; npm test; git diff --check.
- Reviewed the complete scoped diff for entity IDs, whitelist coverage, diet precedence, visible translations, source-data preservation, and redirect order.

## Deployment evidence
A local passing build is not proof of publication. The new commit must be pushed without force, its GitHub Actions build/test and deploy jobs must succeed, and the live response bodies must be checked against dist. Post-deployment raw head/JSON-LD evidence is saved separately so this pre-deployment review does not claim success in advance.
