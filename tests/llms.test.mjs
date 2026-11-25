import test from 'node:test';
import assert from 'node:assert/strict';
import { read, exists } from './helpers.mjs';
import { copy } from '../src/i18n.mjs';

test('llms.txt is published with business facts and every German FAQ', () => {
  assert.ok(exists('llms.txt'));
  const text = read('llms.txt');
  assert.match(text, /^# Levante Restaurant Radolfzell\n/);
  assert.match(text, /Löwengasse 30, 78315 Radolfzell am Bodensee/);
  assert.match(text, /Mo–Do 16:00–22:00, Fr–Sa 11:00–24:00, So 11:00–22:00 Uhr/);
  for (const [question, answer] of copy.de.faq) assert.ok(text.includes(`- ${question} ${answer}`), question);
  assert.doesNotMatch(text, /halal|حلال/i);
});
