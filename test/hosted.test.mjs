import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// makeitours-app#39: the Hosted page, its shared wording and its links.
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = name => readFileSync(join(root, name), 'utf8');
const content = JSON.parse(read('content/hosted-features.json'));
const page = read('hosted.html');

test('hosted.html is generated from the shared wording', () => {
  const result = spawnSync(process.execPath, [join(root, 'scripts/render-hosted.mjs'), '--check'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
});

test('every feature has its own section anchor and planned ones say coming soon', () => {
  assert.equal(content.features.length, 17);
  for (const feature of content.features) {
    const start = page.indexOf(`id="${feature.id}"`);
    assert.ok(start > 0, `missing #${feature.id}`);
    const section = page.slice(start, page.indexOf('</section>', start));
    assert.equal(section.includes('Coming soon'), feature.status === 'planned', feature.id);
  }
});

test('the page sells nothing and states no prices', () => {
  assert.match(page, /Pricing coming soon/);
  assert.doesNotMatch(page, /\$\s?\d/);
  assert.doesNotMatch(page, /unlimited/i);
  assert.match(page, /through the App Store/);
  const emails = page.match(/[\w.+-]+@[\w.-]+/g) ?? [];
  assert.deepEqual([...new Set(emails)], ['support@bengesoftwarellc.com']);
});

test('home, Getting Started and every footer link to the Hosted page', () => {
  for (const name of ['index.html', 'getting-started.html', 'privacy.html', 'roadmap.html', 'security.html', 'support.html', 'hosted.html']) {
    const html = read(name);
    const footer = html.slice(html.indexOf('<footer'));
    assert.match(footer, /href="hosted.html"/, `${name} footer`);
  }
  assert.match(read('index.html'), /class="btn secondary" href="hosted.html"/);
  assert.match(read('getting-started.html').split('<footer')[0], /href="hosted.html"/);
});

test('the Mac installer points to the Hosted page when it finishes', () => {
  assert.match(read('install-mac.sh'), /https:\/\/bengesoftwarellc\.com\/makeitours-website\/hosted\.html/);
});
