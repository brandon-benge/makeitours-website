import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;

// 2026-11-01 (private-case-study-worker): the private case study is served by a
// separate authenticated Worker; this public site only links to it.
test('the homepage links to the private case study with a relative URL', () => {
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  assert.match(html, /<a href="case-study\/" rel="nofollow">Private case study<\/a>/);
});

test('no private case-study content is part of this public site', () => {
  assert.ok(!existsSync(join(root, 'case-study')));
  const walk = dir => readdirSync(dir).flatMap(name => {
    if (['node_modules', '.git', 'test'].includes(name)) return [];
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
  for (const file of walk(root).filter(path => /\.(html|js|css|json)$/.test(path))) {
    const text = readFileSync(file, 'utf8');
    assert.doesNotMatch(text, /mio_private_content|mio_case_study_share|CASE_STUDY_LINK_SIGNING_SECRET|\?token=/, file);
  }
});
