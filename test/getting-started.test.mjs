import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// makeitours-website#45: Hosted is the recommended start; BYOI stays a
// complete alternative; pre-launch pages offer only actions that work now.
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = name => readFileSync(join(root, name), 'utf8');
const main = name => { const html = read(name); return html.slice(html.indexOf('<main'), html.indexOf('</main>')); };

test('the home page has one primary action, to Getting Started', () => {
  const html = main('index.html');
  const primaries = html.match(/class="btn primary"[^>]*>/g) ?? [];
  assert.equal(primaries.length, 1);
  assert.match(primaries[0], /href="getting-started.html"/);
  assert.doesNotMatch(html, /aria-disabled="true"/, 'no disabled buttons');
  assert.doesNotMatch(html, /Coming soon to the App Store/);
  assert.match(html, /href="getting-started.html#byoi"/);
  assert.match(html, /href="roadmap.html"/);
  assert.match(html, /Make it yours\. Make it ours\./, 'the ad film stays');
});

test('Getting Started recommends Hosted before Bring Your Own Infra', () => {
  const html = main('getting-started.html');
  const hosted = html.indexOf('id="hosted"'), byoi = html.indexOf('id="byoi"');
  assert.ok(hosted > 0 && byoi > hosted);
  assert.match(html.slice(hosted, hosted + 200), /Recommended/);
  assert.match(html, /data-film-slot="overview:hosted"/);
  assert.ok(html.indexOf('data-film-slot="overview:hosted"') < byoi);
  assert.match(html, /id="compare"[\s\S]*<table class="pricing compare">/);
  assert.match(html, /id="hosted-steps"[\s\S]*can't be followed yet/);
});

test('Getting Started is honest about availability', () => {
  const html = main('getting-started.html');
  assert.match(html, /Not open to the public yet/);
  assert.match(html, /no public sign-up, purchase or App Store release yet, and no launch date/);
  assert.match(html, /independent review/);
  assert.doesNotMatch(html, /\$\d/, 'prices live on the Hosted page');
});

test('Getting Started links each answer where the question comes up', () => {
  const html = main('getting-started.html');
  for (const href of ['hosted.html#plans', 'hosted.html#features', 'privacy.html', 'security.html', 'roadmap.html',
    'docs/release-notes/index.html', 'support.html', 'docs/new-to-github/index.html', 'docs/ai-key-openrouter/index.html']) {
    assert.ok(html.includes(`href="${href}"`), href);
  }
  for (const id of ['byoi', 'new-to-github', 'ai-key', 'byoi-films']) assert.ok(html.includes(`id="${id}"`), id);
  const emails = new Set(html.match(/[\w.+-]+@[\w.-]+/g) ?? []);
  assert.deepEqual([...emails].sort(), ['feature@bengesoftwarellc.com', 'makeitours-support@bengesoftwarellc.com']);
});

test('the Hosted page recommends Hosted and links the comparison', () => {
  const html = main('hosted.html');
  assert.match(html, /<strong>Hosted<\/strong> is the easiest way to start/);
  assert.match(html, /BYOI is a capable choice/);
  assert.match(html, /href="getting-started.html#compare"/);
});
