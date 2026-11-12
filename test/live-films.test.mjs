import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { apply, figure, listUrl, valid } from '../assets/films.js';

// makeitours#168: the live film list on films.bengesoftwarellc.com.
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = name => readFileSync(join(root, name), 'utf8');
const FILMS = 'https://films.bengesoftwarellc.com';
const clip = (id, sha = 'aaaaaaaaaaaa') => ({
  video: `${FILMS}/v1/${id}/${sha}.mp4`, poster: `${FILMS}/v1/${id}/${sha}.jpg`, captions: `${FILMS}/v1/${id}/${sha}.vtt`, seconds: 15.2,
});

// Just enough DOM for apply(): attributes, children, replaceWith, hidden.
class El {
  constructor(tag) { this.tagName = tag; this.attrs = {}; this.children = []; this.parent = null; this.hidden = false; this.textContent = ''; }
  set className(v) { this.attrs.class = v; }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  append(...nodes) { for (const n of nodes) { n.parent = this; this.children.push(n); } }
  replaceChildren(...nodes) { this.children = []; this.append(...nodes); }
  replaceWith(n) { n.parent = this.parent; this.parent.children[this.parent.children.indexOf(this)] = n; }
  all() { return [this, ...this.children.flatMap(c => c.all())]; }
  querySelector(tag) { return this.all().slice(1).find(e => e.tagName === tag) ?? null; }
}
const page = () => {
  const body = new El('body');
  const doc = { body, createElement: t => new El(t), querySelectorAll: () => body.all().filter(e => e.getAttribute('data-film-slot') !== null) };
  const slot = (name, label, f) => {
    const el = f ? figure(doc, f, label) : new El('figure');
    el.setAttribute('data-film-slot', name);
    el.setAttribute('data-film-label', label);
    if (!f) el.hidden = true;
    body.append(el);
  };
  slot('feature:sawyer', 'Film: Meet Sawyer', clip('f-sawyer'));
  slot('feature:perspective', 'Film: Your perspective');
  slot('overview:hosted', 'Film: MakeItOurs Hosted overview', clip('hosted'));
  const grid = new El('div');
  grid.setAttribute('data-film-slot', 'byoi-setup');
  grid.append(figure(doc, clip('b05'), 'Film: Create a GitHub account'));
  body.append(grid);
  return doc;
};
const slotOf = (doc, name) => doc.querySelectorAll().find(e => e.getAttribute('data-film-slot') === name);
const src = el => el.querySelector('source')?.getAttribute('src');

test('the live list address, and the preview with ?films=next', () => {
  assert.equal(listUrl(''), `${FILMS}/catalog/v1/films.json`);
  assert.equal(listUrl('?films=next'), `${FILMS}/catalog/v1/films-next.json`);
  assert.equal(listUrl('?films=other'), `${FILMS}/catalog/v1/films.json`);
});

test('a re-cut replaces the film and a new film fills an empty slot', () => {
  const doc = page();
  assert.equal(apply(doc, {
    schema: 1,
    features: { sawyer: clip('f-sawyer', 'bbbbbbbbbbbb'), perspective: clip('f-perspective') },
    overviews: { hosted: clip('hosted') },
    byoiSetup: [{ id: 'b05', title: 'Create a GitHub account', film: clip('b05') }, { id: 'b-new', title: 'A new step', film: clip('b-new') }],
  }), true);
  assert.equal(src(slotOf(doc, 'feature:sawyer')), `${FILMS}/v1/f-sawyer/bbbbbbbbbbbb.mp4`);
  const perspective = slotOf(doc, 'feature:perspective');
  assert.equal(perspective.hidden, false);
  assert.equal(perspective.querySelector('video').getAttribute('preload'), 'none');
  assert.equal(perspective.querySelector('figcaption').textContent, 'Film: Your perspective · 15 seconds, no sound');
  assert.equal(slotOf(doc, 'byoi-setup').children.length, 2);
});

test('a loaded list without a film hides it, so a rollback shows at once', () => {
  const doc = page();
  apply(doc, { schema: 1, features: {}, overviews: { hosted: clip('hosted') }, byoiSetup: [] });
  assert.equal(slotOf(doc, 'feature:sawyer').hidden, true);
  assert.equal(slotOf(doc, 'overview:hosted').hidden, false);
  assert.equal(slotOf(doc, 'byoi-setup').children.length, 0);
});

test('a missing, unknown or foreign list leaves the page as released', () => {
  for (const list of [null, { schema: 2, features: {} }, 'nope']) {
    const doc = page();
    assert.equal(apply(doc, list), false);
    assert.equal(src(slotOf(doc, 'feature:sawyer')), `${FILMS}/v1/f-sawyer/aaaaaaaaaaaa.mp4`);
  }
  assert.equal(valid({ ...clip('x'), video: 'https://example.com/x.mp4' }), false);
  assert.equal(valid({ ...clip('x'), seconds: 0 }), false);
  assert.equal(valid({ ...clip('x'), captions: null }), true);
});

test('both pages load the reader and mark every film slot', () => {
  for (const name of ['hosted.html', 'getting-started.html']) {
    assert.match(read(name), /<script type="module" src="assets\/films\.js"><\/script>/, name);
  }
  const hosted = read('hosted.html');
  const content = JSON.parse(read('content/hosted-features.json'));
  for (const f of content.features) {
    const marked = hosted.includes(`data-film-slot="feature:${f.id}"`);
    assert.equal(marked, f.status === 'available', f.id);
  }
  assert.match(hosted, /data-film-slot="overview:hosted"/);
  const started = read('getting-started.html');
  assert.match(started, /data-film-slot="overview:byoi"/);
  assert.match(started, /class="film-grid" data-film-slot="byoi-setup"/);
});
