import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { filter, pageOf, words } from '../assets/store.js';

// makeitours-website#40 (makeitours#199): the store preview.
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = name => readFileSync(join(root, name), 'utf8');
const page = read('store.html');
const sample = JSON.parse(read('content/store-sample.json'));

test('store.html is generated from the sample listings', () => {
  const result = spawnSync(process.execPath, [join(root, 'scripts/render-store.mjs'), '--check'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
});

test('every project shows its creator, its whole picture and each part with tags, a reference and Report misuse', () => {
  for (const project of sample.projects) {
    const start = page.indexOf(`id="${project.id}"`);
    assert.ok(start > 0, project.id);
    const card = page.slice(start, page.indexOf('</article>', start));
    assert.match(card, new RegExp(`By ${project.creator}`));
    assert.match(card, /<svg class="store-picture"[^>]*aria-label="Drawing of the whole/);
    for (const part of project.parts) {
      assert.ok(card.includes(`<strong>${part.name}</strong>`), part.name);
      assert.ok(card.includes(`data-reference="${part.reference}"`), part.reference);
      for (const tag of part.tags) assert.ok(card.includes(`<li>${tag}</li>`), tag);
    }
    assert.equal(card.split('Report misuse</button>').length - 1, project.parts.length);
  }
});

test('projects are listed first in, first out', () => {
  const order = [...page.matchAll(/<article class="card store-project" id="([^"]+)"/g)].map(m => m[1]);
  const expected = [...sample.projects].sort((a, b) => a.listed.localeCompare(b.listed)).map(p => p.id);
  assert.deepEqual(order, expected);
});

test('the page is labeled a preview, says who can add parts, and shows no prices, ratings or comments', () => {
  assert.match(page, /<span class="store-label">Preview<\/span>/);
  assert.match(page, /Adding a part needs Hosted/);
  assert.match(page, /Bring Your Own Infra projects can't add store parts/);
  assert.match(page, /Adding a part in the app <span class="store-label">Mockup<\/span>/);
  assert.doesNotMatch(page, /\$\d|rating|comment|★/i);
  // References follow the approved format: MIO-<12 hex>-<7 hex>.
  for (const p of sample.projects) for (const x of p.parts) assert.match(x.reference, /^MIO-[0-9a-f]{12}-[0-9a-f]{7}$/);
});

test('the home page links to the preview', () => {
  assert.match(read('index.html'), /href="store.html"/);
});

test('search keeps matching projects whole and narrows others to matching parts', () => {
  const projects = [
    { text: 'backyard play area swing', parts: ['swing set cedar', 'picnic table pine'] },
    { text: 'deck chair', parts: ['chair cedar', 'footrest cedar'] },
  ];
  assert.deepEqual(words('  Swing  SET '), ['swing', 'set']);
  assert.deepEqual(filter(projects, 'backyard').map(r => [r.shown, r.parts]), [[true, [true, true]], [false, [false, false]]]);
  assert.deepEqual(filter(projects, 'cedar').map(r => [r.shown, r.parts]), [[true, [true, false]], [true, [true, true]]]);
  assert.deepEqual(filter(projects, '').map(r => r.shown), [true, true]);
});

test('pages hold 50 projects', () => {
  assert.deepEqual(pageOf(120, 50, 3), { pages: 3, current: 3, start: 100, end: 150 });
  assert.deepEqual(pageOf(0, 50, 2), { pages: 1, current: 1, start: 0, end: 50 });
});
