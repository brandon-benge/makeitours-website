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

// makeitours-website#41: the live store.
import { esc, partsHtml, projectHtml, reportText, startLive, storeUrl, unavailableText, REPORT_REASONS } from '../assets/store.js';

const liveProject = {
  id: 'f'.repeat(32), creator_id: 'c'.repeat(32), name: 'Back <Yard>', creator: 'A MakeItOurs maker', listed_at: '2026-11-17T10:00:00.000Z',
  part_count: 1, summary: null, size: '3600 x 1800 x 2400 mm', tags: ['Post', 'Cedar'],
};
const livePart = { id: 'a'.repeat(64), name: 'Swing', summary: 'A cedar swing.', size: null, tags: ['Post'], listed_at: '2026-11-17T10:00:00.000Z',
  reference: { code: 'MIO-aaaaaaaaaaaa-1234567', link: 'makeitours://store/x@y' } };

test('live addresses, messages and report reasons follow the store service', () => {
  assert.equal(storeUrl('https://api.test/', 'projects', { q: 'swing set', cursor: '' }), 'https://api.test/v1/store/projects?q=swing+set');
  assert.equal(storeUrl('https://api.test', 'parts/abc/reports'), 'https://api.test/v1/store/parts/abc/reports');
  assert.match(unavailableText(429), /busy/);
  assert.match(unavailableText(503), /unavailable/);
  assert.match(reportText(202), /Thanks/);
  assert.match(reportText(404), /no longer/);
  assert.deepEqual(REPORT_REASONS.map(([value]) => value), ['offensive', 'spam', 'unsafe', 'stolen', 'other']);
  assert.equal(esc(`<a href="x">'`), '&lt;a href=&quot;x&quot;&gt;&#39;');
});

test('a live project card escapes its names and shows no per-part image, price or rating', () => {
  const card = projectHtml(liveProject);
  assert.match(card, /Back &lt;Yard&gt;/);
  assert.match(card, /By A MakeItOurs maker · listed 2026-11-17 · about 3600 x 1800 x 2400 mm/);
  assert.match(card, /Show its 1 part/);
  const parts = partsHtml({ ...liveProject, parts: [livePart] });
  assert.match(parts, /data-reference="MIO-aaaaaaaaaaaa-1234567"/);
  assert.match(parts, /data-part="a{64}"/);
  assert.doesNotMatch(card + parts, /<img|<svg|\$\d|rating|★/i);
  assert.match(partsHtml({ ...liveProject, parts: [] }), /no parts listed/);
});

/** A tiny stand-in for the page, enough for startLive. */
function fakePage() {
  const els = new Map();
  const el = (id) => {
    if (!els.has(id)) els.set(id, { id, hidden: false, textContent: '', innerHTML: '', dataset: {}, value: '', attrs: {},
      querySelector: () => null, setAttribute(k, v) { this.attrs[k] = v; }, removeAttribute(k) { delete this.attrs[k]; }, addEventListener() {},
      insertAdjacentHTML(_, html) { this.innerHTML += html; } });
    return els.get(id);
  };
  const doc = { getElementById: el, querySelector: () => null, defaultView: {} };
  const list = el('store-projects');
  list.dataset.api = 'https://api.test';
  return { doc, list, el };
}

test('the live list fills from the service and fails to a short message, never a broken page', async () => {
  const { doc, list, el } = fakePage();
  const urls = [];
  const fetchOk = async (url) => { urls.push(url); return { ok: true, status: 200, json: async () => ({ projects: [liveProject], next: 'cur' }) }; };
  await startLive(doc, list, fetchOk);
  assert.deepEqual(urls, ['https://api.test/v1/store/projects']);
  assert.match(list.innerHTML, /Back &lt;Yard&gt;/);
  assert.equal(el('store-more').hidden, false);
  assert.match(el('store-count').textContent, /1\+ project, oldest listing first/);

  for (const failing of [async () => ({ ok: false, status: 429 }), async () => { throw new Error('offline'); }]) {
    const page = fakePage();
    await startLive(page.doc, page.list, failing);
    assert.equal(page.list.innerHTML, '');
    assert.equal(page.el('store-unavailable').hidden, false);
    assert.match(page.el('store-unavailable').textContent, /busy|unavailable/);
  }
});

test('the live page renders without sample data, with the report dialog and the API origin', () => {
  const result = spawnSync(process.execPath, [join(root, 'scripts/render-store.mjs'), '--live'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const live = result.stdout;
  assert.match(live, /data-live="true" data-api="https:\/\/makeitours-api\.bengesoftwarellc\.com"/);
  assert.doesNotMatch(live, /store-label">(Preview|Mockup)|store-sample|class="card store-project"/);
  assert.match(live, /<dialog id="store-report-dialog"/);
  for (const [value] of REPORT_REASONS) assert.match(live, new RegExp(`<option value="${value}">`));
  assert.match(live, /Report misuse on any part/);
});

test('the store stays a preview until the owner turns the live store on', () => {
  assert.equal(JSON.parse(read('content/store.json')).live, false);
});

test('privacy and Hosted copy explain store listings, removal and copies', () => {
  const privacy = read('privacy.html');
  assert.match(privacy, /public MakeItOurs Store/);
  assert.match(privacy, /Turning sharing off for the project or your account takes its listings\s+out of the store right away/);
  assert.match(privacy, /copy that belongs to that project/);
  assert.match(read('hosted.html'), /listed in the public MakeItOurs Store/);
});
