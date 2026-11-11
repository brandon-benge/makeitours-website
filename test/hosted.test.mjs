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

test('the page shows the website#21 launch prices and sells nothing on the site', () => {
  const start = page.indexOf('id="plans"');
  const plans = page.slice(start, page.indexOf('id="features"'));
  for (const row of [
    ['Pro subscription', '2,000', '$20.00 / month', 'Included every month'],
    ['Pack', '100', '$2.49', '160 MPU (+60 bonus)'],
    ['Pack', '500', '$10.00', '800 MPU (+300 bonus)'],
    ['Pack', '1,000', '$17.49', '1,600 MPU (+600 bonus)'],
  ]) {
    assert.ok(plans.includes(`<th scope="row">${row[0]}</th><td>${row[1]}</td><td>${row[2]}</td><td>${row[3]}</td>`), row.join(' '));
  }
  assert.match(plans, /60% bonus MPU/);
  assert.match(plans, /Subscription MPUs are used first and expire when your subscription renews/);
  assert.match(plans, /Pack MPUs never expire/);
  assert.match(plans, /no free trial/);
  assert.match(plans, /usage limits per request and per day still apply/);
  assert.match(plans, /nothing is on sale yet/);
  assert.match(plans, /your App Store region may show a different price/);
  assert.doesNotMatch(page, /Pricing coming soon/);
  assert.doesNotMatch(page.slice(page.indexOf('id="features"')), /\$\s?\d/);
  assert.doesNotMatch(page, /unlimited/i);
  assert.match(page, /through the App Store/);
  const emails = page.match(/[\w.+-]+@[\w.-]+/g) ?? [];
  assert.deepEqual([...new Set(emails)], ['makeitours-support@bengesoftwarellc.com']);
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
