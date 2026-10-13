import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { renderSite, build } from '../scripts/render-docs.mjs';

function fixture(t, audience = 'public') {
  const root = mkdtempSync(join(tmpdir(), 'mio-docs-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'content/docs'), { recursive: true });
  mkdirSync(join(root, 'scripts/docs-assets'), { recursive: true });
  const doc = { id: 'vision', title: 'Vision', summary: 'Summary', audience, status: 'draft', updated: '2026-10-12', version: 'V1 planning', source: 'vision.md', workflow: 'flow.json' };
  const save = () => writeFileSync(join(root, 'content/docs/catalog.json'), JSON.stringify({ audience, documents: [doc] }));
  save();
  writeFileSync(join(root, 'content/docs/vision.md'), '## Example\n<script>alert(1)</script>\n\n[unsafe](javascript:alert(1))\n\n[safe](https://example.com)');
  writeFileSync(join(root, 'content/docs/flow.json'), JSON.stringify({ title: 'Example', steps: [{ title: 'One', description: 'Start' }, { title: 'Two', description: 'Finish' }] }));
  writeFileSync(join(root, 'scripts/docs-assets/docs.css'), 'body {}');
  writeFileSync(join(root, 'scripts/docs-assets/workflow.js'), '// trusted code');
  return { root, doc, save };
}

test('renders deterministic escaped prose, safe links and a static animated-workflow fallback', t => {
  const { root } = fixture(t);
  const pages = renderSite(root, 'public');
  assert.deepEqual(pages, renderSite(root, 'public'));
  const html = pages.get('vision/index.html');
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('href="javascript:'));
  assert.ok(html.includes('href="https://example.com"'));
  assert.ok(html.includes('class="controls" hidden'));
  assert.ok(html.includes('Illustrative workflow'));
  assert.ok(html.includes('<h3>One</h3>') && html.includes('<h3>Two</h3>'));
  assert.ok(html.includes('Revised 2026-10-12'));
  assert.ok(html.includes('href="../../index.html"'));
});

test('private renditions have distinct human/share links and private metadata', t => {
  const { root } = fixture(t, 'internal');
  const human = renderSite(root, 'internal').get('index.html');
  const shared = renderSite(root, 'internal', true).get('index.html');
  assert.ok(human.includes('href="/case-study/"'));
  assert.ok(shared.includes('href="/case-study/share/"'));
  assert.ok(!shared.includes('href="/case-study/"'));
  assert.ok(shared.includes('noindex,nofollow'));
  assert.throws(() => renderSite(root, 'public'), /audience/);
});

test('rejects unsafe paths, symlinks, invalid audience, reserved IDs and executable metadata', t => {
  const { root, doc, save } = fixture(t);
  for (const source of ['../secret.md', '/secret.md', 'a\\b.md']) {
    doc.source = source; save(); assert.throws(() => renderSite(root, 'public'), /path/);
  }
  doc.source = 'alias.md'; symlinkSync(join(root, 'content/docs/vision.md'), join(root, 'content/docs/alias.md')); save();
  assert.throws(() => renderSite(root, 'public'), /symlink/);
  doc.source = 'vision.md'; doc.audience = 'internal'; save();
  assert.throws(() => renderSite(root, 'public'), /audience/);
  doc.audience = 'public'; doc.id = 'share'; save(); assert.throws(() => renderSite(root, 'public'), /ID/);
  doc.id = 'vision'; doc.title = '<script>bad()</script>'; save();
  assert.ok(renderSite(root, 'public').get('vision/index.html').includes('&lt;script&gt;bad()&lt;/script&gt;'));
});

test('rejects duplicate IDs, invalid dates, missing sources and malformed workflows', t => {
  const { root, doc, save } = fixture(t);
  writeFileSync(join(root, 'content/docs/catalog.json'), JSON.stringify({ audience: 'public', documents: [doc, doc] }));
  assert.throws(() => renderSite(root, 'public'), /duplicate/);
  doc.updated = '2026-02-30'; save(); assert.throws(() => renderSite(root, 'public'), /date/);
  doc.updated = '2026-10-12'; doc.source = 'absent.md'; save(); assert.throws(() => renderSite(root, 'public'), /ENOENT/);
  doc.source = 'vision.md'; save(); writeFileSync(join(root, 'content/docs/flow.json'), '{"steps": []}');
  assert.throws(() => renderSite(root, 'public'), /workflow/);
});

test('unwritten entries are inventory text without broken document links', t => {
  const { root, doc, save } = fixture(t);
  doc.status = 'not-yet-written'; delete doc.source; delete doc.workflow; save();
  const pages = renderSite(root, 'public');
  assert.ok(!pages.has('vision/index.html'));
  assert.ok(!pages.get('index.html').includes('href="vision/'));
});

test('check detects stale outputs and build rejects output symlinks', t => {
  const { root } = fixture(t);
  build(root); build(root, { check: true });
  writeFileSync(join(root, 'docs/index.html'), 'stale');
  assert.throws(() => build(root, { check: true }), /differs/);
  build(root); build(root, { check: true });
  symlinkSync(join(root, 'content/docs/vision.md'), join(root, 'docs/leak.html'));
  assert.throws(() => build(root), /symlink/);
});

test('both private editions survive regeneration and pass drift checks', t => {
  const { root } = fixture(t, 'internal');
  build(root); build(root); build(root, { check: true });
});

test('planning assets are private and select the matching protected endpoint', t => {
  const publicFixture = fixture(t); publicFixture.doc.planning = true; publicFixture.save();
  assert.throws(() => renderSite(publicFixture.root, 'public'), /private/);
  const { root, doc, save } = fixture(t, 'internal'); doc.planning = true; save();
  writeFileSync(join(root, 'scripts/docs-assets/planning.js'), '// trusted planning view');
  const human = renderSite(root, 'internal'); const shared = renderSite(root, 'internal', true);
  assert.ok(human.get('vision/index.html').includes('data-planning-endpoint="/api/docs/planning"'));
  assert.ok(shared.get('vision/index.html').includes('data-planning-endpoint="/api/share/docs/planning"'));
  assert.ok(!shared.get('vision/index.html').includes('data-planning-endpoint="/api/docs/planning"'));
  assert.ok(shared.has('assets/planning.js'));
});
