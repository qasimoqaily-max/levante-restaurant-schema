import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const proofPath = path.join(root, 'docs', 'production-cutover-proof.json');
const raw = fs.readFileSync(proofPath, 'utf8');
const proof = JSON.parse(raw);

test('production proof is portable UTF-8 JSON without a byte-order mark', () => {
  assert.notEqual(raw.charCodeAt(0), 0xfeff, 'production proof must not start with UTF-8 BOM');
});

test('production proof records build identity and safety invariants', () => {
  assert.equal(proof.task, 'LEVANTE_ROOT_SEO_GEO_PRODUCTION_REBUILD_20261103');
  assert.equal(proof.repository, 'qasimoqaily-max/levante-restaurant-schema');
  assert.match(proof.status, /^PRODUCTION_/);
  assert.equal(proof.github_actions.pages_source, 'GitHub Actions');
  assert.equal(proof.github_actions.custom_domain, 'www.levante-radolfzell.de');
  assert.equal(proof.dns.all_critical_checks_pass, true);
  assert.equal(proof.website.live_crawl.passed, true);
  assert.equal(proof.website.live_crawl.errorCount, 0);
  assert.equal(proof.website.schema_validator.passed, true);
  assert.equal(proof.safety.mx_unchanged, true);
  assert.equal(proof.safety.spf_unchanged, true);
  assert.equal(proof.safety.dkim_unchanged, true);
  assert.equal(proof.safety.dmarc_unchanged, true);
});

test('post-deployment observations are explicit rather than used as a circular deploy gate', () => {
  assert.equal(typeof proof.website.certificate.authorized, 'boolean');
  assert.ok(proof.search_submissions.google_sitemap);
  assert.ok(proof.search_submissions.bing_sitemap);
  assert.ok(proof.platform_pending.google_business);
  assert.ok(proof.platform_pending.bing_places);
});
