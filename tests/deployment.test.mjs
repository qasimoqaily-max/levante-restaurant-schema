import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

test('GitHub Pages workflow builds, tests and deploys only dist', () => {
  const file = path.join(root, '.github', 'workflows', 'pages.yml');
  assert.ok(fs.existsSync(file), 'pages workflow missing');
  const yaml = fs.readFileSync(file, 'utf8');
  assert.match(yaml, /branches:\s*\[main\]/);
  assert.match(yaml, /pages:\s*write/);
  assert.match(yaml, /id-token:\s*write/);
  assert.match(yaml, /node scripts\/build\.mjs/);
  assert.match(yaml, /node --test tests\/\*\.test\.mjs/);
  assert.match(yaml, /actions\/checkout@v6/);
  assert.match(yaml, /actions\/setup-node@v7/);
  assert.match(yaml, /actions\/configure-pages@v5/);
  assert.match(yaml, /actions\/upload-pages-artifact@v4/);
  assert.match(yaml, /path:\s*dist/);
  assert.match(yaml, /actions\/deploy-pages@v4/);
});

test('deployment and rollback documentation is present', () => {
  for (const file of ['deployment-runbook.md', 'rollback.md', 'verification-report.md']) {
    assert.ok(fs.existsSync(path.join(root, 'docs', file)), `missing docs/${file}`);
  }
});
test('production build declares the canonical www custom domain', () => {
  const cname = path.join(root, 'dist', 'CNAME');
  assert.ok(fs.existsSync(cname), 'dist/CNAME missing; run build before deployment tests');
  assert.equal(fs.readFileSync(cname, 'utf8').trim(), 'www.levante-radolfzell.de');
});

