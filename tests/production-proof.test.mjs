import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const proof = JSON.parse(fs.readFileSync(path.join(root, 'docs', 'production-cutover-proof.json'), 'utf8'));

test('production cutover proof meets the final acceptance gate', () => {
  assert.equal(proof.status, 'PRODUCTION_DEPLOYED_AND_VERIFIED_EXTERNAL_RECRAWL_PENDING');
  assert.equal(proof.github_actions.build, 'success');
  assert.equal(proof.github_actions.deploy, 'success');
  assert.equal(proof.github_actions.enforce_https, true);
  assert.equal(proof.dns.all_critical_checks_pass, true);
  assert.equal(proof.website.live_crawl.passed, true);
  assert.equal(proof.website.live_crawl.errorCount, 0);
  assert.equal(proof.website.certificate.authorized, true);
  assert.equal(proof.website.schema_validator.passed, true);
  for (const mode of ['mobile', 'desktop']) {
    const score = proof.website.lighthouse[mode];
    assert.ok(score.performance >= 90, `${mode} performance`);
    assert.ok(score.accessibility >= 95, `${mode} accessibility`);
    assert.ok(score.best_practices >= 95, `${mode} best practices`);
    assert.ok(score.seo >= 95, `${mode} SEO`);
  }
  assert.equal(proof.safety.mx_unchanged, true);
  assert.equal(proof.safety.spf_unchanged, true);
  assert.equal(proof.safety.dkim_unchanged, true);
  assert.equal(proof.safety.dmarc_unchanged, true);
});
